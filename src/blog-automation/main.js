/**
 * 블로그 자동화 시스템 - 메인 오케스트레이터
 * Google Trends → AI 글 생성 → WordPress 자동 발행
 */

/**
 * 구글 트렌드 주제 수집 함수 (자주 실행)
 */
function collectTrends() {
  const config = validateConfig();
  
  Logger.log("=== 구글 트렌드에서 주제 수집 중 ===");
  const trendingTopics = fetchTrendingTopics();
  Logger.log(`트렌드 주제 ${trendingTopics.length}개 수집 완료`);
  
  if (trendingTopics.length === 0) {
    Logger.log("수집된 트렌드 주제가 없습니다.");
    return;
  }
  
  // 스프레드시트에 저장
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  
  const sheet = getOrCreateSheet(ss, config.SHEET_NAME);
  saveTrendsToSheet(sheet, trendingTopics);
  
  Logger.log("✅ 트렌드 수집 및 저장 완료");
}

/**
 * 포스트 발행 함수 (제한적 실행)
 */
function publishPosts() {
  const config = validateConfig();
  
  Logger.log("=== 미발행 주제로 포스트 발행 시작 ===");
  
  // 스프레드시트에서 미발행 주제들 읽기
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${config.SHEET_NAME}" 를 찾을 수 없습니다.`);

  const data = sheet.getDataRange().getValues();
  Logger.log(`시트 데이터 행 수: ${data.length}`);
  Logger.log(`첫 번째 행 (헤더): ${JSON.stringify(data[0])}`);
  
  if (data.length <= 1) {
    Logger.log("주제가 없습니다.");
    return;
  }

  // 데이터 샘플 로깅
  for (let i = 1; i < Math.min(data.length, 4); i++) {
    Logger.log(`데이터 행 ${i + 1}: ${JSON.stringify(data[i])}`);
  }

  let postedCount = 0;
  let checkedCount = 0;

  // 미발행 주제들 처리
  for (let r = 2; r <= data.length; r++) {
    if (postedCount >= config.DAILY_LIMIT) break;

    const row = data[r - 1];
    const topic = String(row[0] || "").trim();
    const status = String(row[1] || "").trim().toLowerCase();
    
    checkedCount++;
    Logger.log(`행 ${r} 체크: 토픽="${topic}", 상태="${status}", 토픽길이=${topic.length}`);

    if (!topic || status.startsWith("posted")) {
      Logger.log(`행 ${r} 건너뜀: 토픽없음(${!topic}) 또는 이미발행됨(${status.startsWith("posted")})`);
      continue;
    }

    Logger.log(`처리 중인 주제: ${topic}`);

    try {
      // 1) 한글 토픽 처리 및 AI로 글 생성
      Logger.log("=== AI 글 생성 준비 ===");
      
      // 한글 토픽인지 확인하고 영어 설명 추가
      let topicForAI = topic;
      const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(topic);
      
      if (isKorean) {
        Logger.log("한글 토픽 감지됨, 영어 번역 및 상세 설명 추가");
        topicForAI = `${topic} (Korean topic - please translate to English and write a comprehensive blog post in English about this Korean topic)`;
      }
      
      Logger.log(`AI에게 전달할 토픽: ${topicForAI}`);
      const post = generateHtml(topicForAI);

      // 2) HTML 정리 및 이미지 삽입
      const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
      let htmlWithImages = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

      // 3) 카테고리/태그 ID 확보 (시트 카테고리 우선 사용)
      let categoryIds;
      const sheetCategory = String(row[4] || "").trim(); // E열 카테고리
      
      if (sheetCategory) {
        // 시트에 카테고리가 있으면 우선 사용 (한글→영어 변환)
        const englishCategory = translateCategoryToEnglish(sheetCategory);
        categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, englishCategory)];
        Logger.log(`시트 카테고리 사용: ${sheetCategory} → ${englishCategory}`);
      } else if (Array.isArray(post.categories) && post.categories.length) {
        // AI가 생성한 카테고리 사용
        const englishCategories = post.categories.map(name => translateCategoryToEnglish(name));
        categoryIds = englishCategories.map(name => ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, name));
      } else {
        categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, "Trends")];
      }
      
      // 4) Affiliate 링크 처리 (Gear/Gadget 카테고리인 경우)
      const finalCategory = sheetCategory || (post.categories && post.categories[0]) || "Trends";
      const affiliateLinks = getAffiliateLinks(sheet, r);
      const productNames = getProductNames(sheet, r);
      
      Logger.log(`카테고리 확인: ${finalCategory}`);
      Logger.log(`Affiliate 링크 필요 여부: ${shouldAddAffiliateLink(finalCategory)}`);
      Logger.log(`Affiliate 링크 데이터: ${affiliateLinks ? "있음" : "없음"}`);
      Logger.log(`제품명 데이터: ${productNames ? "있음" : "없음"}`);
      
      if (shouldAddAffiliateLink(finalCategory) && affiliateLinks) {
        htmlWithImages = addAffiliateSection(htmlWithImages, affiliateLinks, finalCategory, productNames);
        Logger.log(`✅ Affiliate 링크 추가됨: ${finalCategory}`);
      }

      // 5) SEO 메타데이터 생성
      const { seoTitle, seoDesc, slug } = buildSEO(htmlWithImages, post.title || topic);

      let tagIds;
      if (Array.isArray(post.tags) && post.tags.length) {
        tagIds = ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, post.tags.join(","));
      }

      // 5) WordPress에 발행
      const postId = wpCreatePost({
        baseUrl: config.WP_BASE,
        user: config.WP_USER,
        appPass: config.WP_APP_PASS,
        title: seoTitle || post.title || topic,
        content: htmlWithImages,
        excerpt: seoDesc || post.seoDescription || "",
        slug: slug,
        status: "publish",
        categories: categoryIds,
        tags: tagIds
      });

      // 6) 시트에 결과 기록
      const postUrl = getPostUrl(config.WP_BASE, postId);
      sheet.getRange(r, 2).setValue("posted");
      sheet.getRange(r, 3).setValue(postUrl);
      sheet.getRange(r, 4).setValue(new Date());
      
      Logger.log(`✅ 발행 완료: ${topic} → ${postUrl}`);

      postedCount++;
      
      // 발행 간격 조절
      if (config.POST_INTERVAL_MS > 0 && postedCount < config.DAILY_LIMIT) {
        Utilities.sleep(config.POST_INTERVAL_MS);
      }
      
    } catch (error) {
      Logger.log(`글 발행 실패 (${topic}): ${error.message}`);
      // 에러가 발생해도 다음 글 계속 처리
      continue;
    }
  }

  Logger.log(`=== 실행 요약 ===`);
  Logger.log(`총 데이터 행 수: ${data.length - 1}개 (헤더 제외)`);
  Logger.log(`검토한 행 수: ${checkedCount}개`);
  Logger.log(`발행 완료: ${postedCount}건`);
  Logger.log(`일일 제한: ${config.DAILY_LIMIT}건`);
}

/**
 * 기존 main 함수 (하위 호환성)
 */
function main() {
  // 트렌드 수집 후 바로 발행
  collectTrends();
  publishPosts();
}

/**
 * 시트 가져오기 또는 생성
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // 헤더 추가 (G열에 AffiliateLinks, H열에 ProductNames 추가)
    sheet.getRange(1, 1, 1, 8).setValues([["Topic", "Status", "PostedURL", "PostedAt", "Category", "TagsCsv", "AffiliateLinks", "ProductNames"]]);
  }
  return sheet;
}

/**
 * 시트에서 제품명 정보 가져오기 (H열)
 */
function getProductNames(sheet, currentRow = 2) {
  try {
    Logger.log("=== 제품명 조회 시작 ===");
    Logger.log(`현재 처리 중인 행: ${currentRow}`);
    
    // 시트의 첫 번째 행에서 헤더 확인
    const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
    Logger.log("헤더 목록: " + JSON.stringify(headers));
    
    let productColIndex = headers.indexOf("ProductNames");
    if (productColIndex === -1) {
      productColIndex = headers.indexOf("제품명");
    }
    
    Logger.log("ProductNames 열 인덱스: " + productColIndex);
    
    if (productColIndex === -1) {
      Logger.log("⚠️ ProductNames 또는 제품명 열을 찾을 수 없습니다.");
      return null;
    }
    
    // 현재 처리 중인 행에서 제품명 가져오기
    const productData = sheet.getRange(currentRow, productColIndex + 1).getValue();
    Logger.log(`제품명 데이터 (${currentRow}행): "${productData}"`);
    
    if (!productData || productData.toString().trim() === "") {
      Logger.log(`⚠️ 제품명이 설정되지 않았습니다. ${String.fromCharCode(65 + productColIndex)}${currentRow} 셀을 확인하세요.`);
      return null;
    }
    
    const result = productData.toString().trim();
    Logger.log("✅ 제품명 조회 성공: " + result);
    return result;
    
  } catch (error) {
    Logger.log("❌ 제품명 가져오기 실패: " + error.message);
    return null;
  }
}

/**
 * 트렌드를 시트에 저장
 */
function saveTrendsToSheet(sheet, trends) {
  const existingData = sheet.getDataRange().getValues();
  const existingTopics = existingData.slice(1).map(row => row[0]);
  
  const newTrends = trends.filter(trend => !existingTopics.includes(trend.topic));
  
  if (newTrends.length > 0) {
    const newRows = newTrends.map(trend => [trend.topic, "", "", "", "Trends", ""]);
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRows.length, 6).setValues(newRows);
    Logger.log(`새로운 트렌드 ${newTrends.length}개를 시트에 저장했습니다.`);
  }
}

/**
 * 한글 카테고리를 영어로 번역
 */
function translateCategoryToEnglish(category) {
  const categoryMap = {
    // 기술
    "기술": "Technology",
    "테크": "Technology", 
    "IT": "Technology",
    "인공지능": "Artificial Intelligence",
    "AI": "Artificial Intelligence",
    "블록체인": "Blockchain",
    
    // 장비/기어
    "기어": "Gear",
    "장비": "Equipment", 
    "가젯": "Gadget",
    "카메라": "Camera",
    "리뷰": "Review",
    
    // 비즈니스
    "비즈니스": "Business",
    "창업": "Entrepreneurship",
    "투자": "Investment",
    "금융": "Finance",
    "마케팅": "Marketing",
    
    // 라이프스타일
    "라이프스타일": "Lifestyle",
    "건강": "Health",
    "요리": "Cooking",
    "여행": "Travel",
    "패션": "Fashion",
    
    // 교육
    "교육": "Education",
    "학습": "Learning",
    "자기계발": "Self Development",
    
    // 엔터테인먼트
    "엔터테인먼트": "Entertainment",
    "게임": "Gaming",
    "영화": "Movies",
    "음악": "Music",
    
    // 뉴스/트렌드
    "뉴스": "News",
    "트렌드": "Trends",
    "시사": "Current Affairs"
  };
  
  return categoryMap[category] || category; // 매핑이 없으면 원본 반환
}

/**
 * Affiliate 링크가 필요한 카테고리인지 확인
 */
function shouldAddAffiliateLink(category) {
  const affiliateCategories = ['gear', 'gadget', 'camera', 'equipment', 'review', 'tech'];
  const categoryLower = category.toLowerCase();
  
  return affiliateCategories.some(keyword => categoryLower.includes(keyword));
}

/**
 * 시트에서 Affiliate 링크 정보 가져오기 (현재 처리 중인 행에서)
 */
function getAffiliateLinks(sheet, currentRow = 2) {
  try {
    Logger.log("=== Affiliate 링크 조회 시작 ===");
    Logger.log(`현재 처리 중인 행: ${currentRow}`);
    
    // 시트의 첫 번째 행에서 헤더 확인
    const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
    Logger.log("헤더 목록: " + JSON.stringify(headers));
    
    const affiliateColIndex = headers.indexOf("AffiliateLinks");
    Logger.log("AffiliateLinks 열 인덱스: " + affiliateColIndex);
    
    if (affiliateColIndex === -1) {
      Logger.log("❌ AffiliateLinks 열을 찾을 수 없습니다. 헤더를 확인하세요.");
      return null;
    }
    
    // 현재 처리 중인 행에서 Affiliate 링크 가져오기
    const affiliateData = sheet.getRange(currentRow, affiliateColIndex + 1).getValue();
    Logger.log(`Affiliate 데이터 (${currentRow}행): "${affiliateData}"`);
    Logger.log(`데이터 타입: ${typeof affiliateData}, 길이: ${affiliateData ? affiliateData.toString().length : 0}`);
    
    // 모든 행의 Affiliate 데이터 확인 (디버깅용)
    Logger.log("=== 전체 Affiliate 열 데이터 확인 ===");
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < Math.min(allData.length, 6); i++) {
      const rowData = allData[i][affiliateColIndex] || "";
      Logger.log(`행 ${i + 1}: "${rowData}" (길이: ${rowData.toString().length})`);
    }
    
    if (!affiliateData || affiliateData.toString().trim() === "") {
      Logger.log(`⚠️ Affiliate 링크가 설정되지 않았습니다. ${String.fromCharCode(65 + affiliateColIndex)}${currentRow} 셀을 확인하세요.`);
      return null;
    }
    
    const result = affiliateData.toString().trim();
    Logger.log("✅ Affiliate 링크 조회 성공: " + result);
    return result;
  } catch (error) {
    Logger.log("❌ Affiliate 링크 가져오기 실패: " + error.message);
    return null;
  }
}

/**
 * HTML에 Affiliate 링크 섹션 추가 (제품명 포함)
 */
function addAffiliateSection(html, affiliateLinks, category, productNames = null) {
  if (!html || !affiliateLinks) return html;
  
  // Affiliate 링크와 제품명 파싱
  const linkData = parseLinksAndProducts(affiliateLinks, productNames);
  
  if (linkData.length === 0) return html;
  
  // 자연스러운 Affiliate 섹션 생성
  const affiliateSection = generateAffiliateSection(linkData, category);
  
  // HTML 마지막에 추가 (</body> 태그 전이나 마지막 문단 뒤)
  const lastParagraph = html.lastIndexOf('</p>');
  if (lastParagraph !== -1) {
    return html.substring(0, lastParagraph + 4) + affiliateSection + html.substring(lastParagraph + 4);
  } else {
    return html + affiliateSection;
  }
}

/**
 * 링크와 제품명 파싱 및 매칭 (다중 구분자 지원)
 */
function parseLinksAndProducts(affiliateLinks, productNames) {
  Logger.log(`원본 링크 데이터: "${affiliateLinks}"`);
  Logger.log(`원본 제품명 데이터: "${productNames || 'null'}"`);
  
  // 스마트 구분자 감지 및 파싱
  const links = smartSplit(affiliateLinks);
  Logger.log(`파싱된 링크: ${JSON.stringify(links)}`);
  
  // 제품명 파싱 (없으면 빈 배열)
  let products = [];
  if (productNames) {
    products = smartSplit(productNames);
  }
  Logger.log(`파싱된 제품명: ${JSON.stringify(products)}`);
  
  // 링크와 제품명 매칭
  const linkData = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    let productName = products[i] || extractProductName(link) || `Product ${i + 1}`;
    
    linkData.push({
      url: link,
      name: productName
    });
  }
  
  Logger.log(`최종 파싱된 링크 데이터: ${JSON.stringify(linkData)}`);
  return linkData;
}

/**
 * 스마트 구분자 감지 및 분할
 * 지원 구분자: 콤마(,), 파이프(|), 세미콜론(;), 줄바꿈(\n)
 */
function smartSplit(text) {
  if (!text) return [];
  
  const trimmedText = text.trim();
  
  // 구분자 우선순위: 콤마 > 파이프 > 세미콜론 > 줄바꿈
  const separators = [',', '|', ';', '\n'];
  
  for (const separator of separators) {
    if (trimmedText.includes(separator)) {
      const parts = trimmedText.split(separator)
        .map(part => part.trim())
        .filter(part => part.length > 0);
      
      if (parts.length > 1) {
        Logger.log(`'${separator}' 구분자로 ${parts.length}개 항목 감지`);
        return parts;
      }
    }
  }
  
  // 구분자가 없으면 단일 항목으로 처리
  Logger.log(`구분자 없음 - 단일 항목으로 처리`);
  return [trimmedText];
}

/**
 * 자연스러운 Affiliate 섹션 HTML 생성 (제품명 기반)
 */
function generateAffiliateSection(linkData, category) {
  const categoryTexts = {
    'gear': 'photography gear',
    'gadget': 'tech gadgets',
    'camera': 'camera equipment',
    'equipment': 'professional equipment',
    'review': 'reviewed products',
    'tech': 'technology products'
  };
  
  const categoryText = Object.keys(categoryTexts).find(key => 
    category.toLowerCase().includes(key)
  );
  const productType = categoryTexts[categoryText] || 'recommended products';
  
  let sectionHtml = `
<div style="margin: 40px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #007cba;">
  <h3 style="color: #333; margin-bottom: 15px;">🛒 Recommended ${productType.charAt(0).toUpperCase() + productType.slice(1)}</h3>
  <p style="color: #666; font-size: 0.95em; margin-bottom: 15px;">
    If you're interested in getting some of the ${productType} mentioned in this article, here are some great options to consider:
  </p>
  <div style="margin: 15px 0;">`;
  
  linkData.forEach((item, index) => {
    sectionHtml += `
    <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="margin-bottom: 8px;">
        <a href="${item.url}" target="_blank" rel="noopener nofollow" style="text-decoration: none; color: #007cba; font-weight: 600; font-size: 1.1em;">
          ${item.name}
        </a>
      </div>
      <p style="color: #666; font-size: 0.9em; margin: 5px 0;">
        <strong>💰 Check Latest Price →</strong>
      </p>
      <small style="color: #999; font-size: 0.85em; font-style: italic;">
        *This is an affiliate link - purchasing through this link helps support our content at no extra cost to you.
      </small>
    </div>`;
  });
  
  sectionHtml += `
  </div>
  <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
    <p style="color: #888; font-size: 0.9em; font-style: italic; margin: 0;">
      💡 As an Amazon Associate and affiliate partner, we earn from qualifying purchases.<br>
      This helps us continue creating valuable content for you!
    </p>
  </div>
</div>`;
  
  return sectionHtml;
}

/**
 * URL에서 제품명 추출
 */
function extractProductName(url) {
  try {
    // Amazon 링크에서 제품명 추출 시도
    if (url.includes('amazon.com') || url.includes('amzn.to')) {
      const match = url.match(/\/([^\/\?]+)(?:\?|$)/);
      if (match && match[1]) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    // 기타 링크에서 도메인명 사용
    const domain = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    if (domain && domain[1]) {
      return domain[1].replace('.com', '').replace('.org', '').replace('.net', '');
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 자동화 트리거 설정
 */
function setupAutomationTriggers() {
  // 기존 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // 트렌드 수집: 하루 4번 (6시, 12시, 18시, 24시)
  [6, 12, 18, 24].forEach(hour => {
    ScriptApp.newTrigger('collectTrends')
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();
  });
  
  // 포스트 발행: 하루 2번 (10시, 16시)
  [10, 16].forEach(hour => {
    ScriptApp.newTrigger('publishPosts')
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();
  });
  
  Logger.log("✅ 자동화 트리거 설정 완료");
  Logger.log("- 트렌드 수집: 매일 6시, 12시, 18시, 24시");
  Logger.log("- 포스트 발행: 매일 10시, 16시");
}

/**
 * 트리거 상태 확인
 */
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`현재 설정된 트리거: ${triggers.length}개`);
  
  triggers.forEach(trigger => {
    Logger.log(`- ${trigger.getHandlerFunction()}: ${trigger.getTriggerSource()}`);
  });
}

/**
 * 선택한 주제로 테스트 발행
 */
function testPublishOneReal() {
  const config = validateConfig();
  
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${config.SHEET_NAME}" 를 찾을 수 없습니다.`);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error("주제가 없습니다. A열에 Topic을 추가하세요.");

  // 첫 번째 미발행 주제 찾기
  let r = -1, topic = "", categoryName = "", tagsCsv = "";
  for (let i = 2; i <= data.length; i++) {
    const row = data[i - 1];
    const t = String(row[0] || "").trim();
    const status = String(row[1] || "").toLowerCase();
    if (t && !status.startsWith("posted")) {
      r = i;
      topic = t;
      categoryName = String(row[4] || "").trim();
      tagsCsv = String(row[5] || "").trim();
      break;
    }
  }
  if (r === -1) throw new Error("발행할 미발행 행이 없습니다.");

  // AI 생성 및 발행
  const post = generateHtml(topic);
  const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
  const htmlWithImages = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

  const { seoTitle, seoDesc, slug } = buildSEO(htmlWithImages, post.title || topic);

  const categories = categoryName
    ? [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, categoryName)]
    : (post.categories || []).map(n => ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, n));

  const tags = tagsCsv
    ? ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, tagsCsv)
    : ((post.tags && post.tags.length) ? ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, post.tags.join(",")) : undefined);

  const postId = wpCreatePost({
    baseUrl: config.WP_BASE,
    user: config.WP_USER,
    appPass: config.WP_APP_PASS,
    title: post.title || seoTitle || topic,
    content: htmlWithImages,
    status: "publish",
    categories: (categories && categories.length) ? categories : undefined,
    tags
  });

  const link = getPostUrl(config.WP_BASE, postId);
  sheet.getRange(r, 2).setValue("posted(test)");
  sheet.getRange(r, 3).setValue(link);
  sheet.getRange(r, 4).setValue(new Date());

  Logger.log(`테스트 발행 완료 #${postId}: ${link}`);
}

/**
 * 완전 자동화: 트렌드 수집 + 글 발행
 */
function fullAutomation() {
  try {
    Logger.log("=== 1단계: 트렌딩 주제 수집 시작 ===");
    const addedTopics = addTrendsToSheet();
    
    Logger.log("=== 2단계: 글 자동 발행 시작 ===");
    main();
    
    Logger.log(`=== 자동화 완료: ${addedTopics}개 주제 추가 ===`);
  } catch (error) {
    Logger.log("자동화 실행 중 오류: " + error.toString());
    throw error;
  }
}

/**
 * 자동화 트리거 설정
 */
function setupAutomationTriggers() {
  // 기존 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'fullAutomation' || 
        trigger.getHandlerFunction() === 'addTrendsToSheet') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 매일 오전 9시에 완전 자동화 실행
  ScriptApp.newTrigger('fullAutomation')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  // 매일 오후 6시에 트렌드 주제만 추가
  ScriptApp.newTrigger('addTrendsToSheet')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();

  Logger.log("✅ 자동화 트리거가 설정되었습니다:");
  Logger.log("- 매일 09:00: 완전 자동화 (트렌드 수집 + 글 발행)");
  Logger.log("- 매일 18:00: 추가 트렌드 주제 수집");
}

/**
 * 시간별 발행 트리거 설정
 */
function setupHourlyTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'main') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 3시간마다 글 발행
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyHours(3)
    .create();

  Logger.log("✅ 시간별 발행 트리거가 설정되었습니다 (3시간마다)");
}

/**
 * 트리거 목록 조회
 */
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  if (triggers.length === 0) {
    Logger.log("설정된 트리거가 없습니다.");
    return;
  }

  Logger.log("=== 현재 설정된 트리거 목록 ===");
  triggers.forEach((trigger, index) => {
    const handler = trigger.getHandlerFunction();
    const source = trigger.getTriggerSource();
    const type = trigger.getTriggerSourceId() ? "특정 시간" : "시간 기반";
    
    if (source === ScriptApp.TriggerSource.CLOCK) {
      Logger.log(`${index + 1}. ${handler}() - ${type}`);
    }
  });
}

/**
 * 모든 트리거 삭제
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    deletedCount++;
  });
  
  Logger.log(`${deletedCount}개의 트리거가 삭제되었습니다.`);
}

/**
 * 시트 데이터 확인 함수 (디버깅용)
 */
function debugSheetData() {
  const config = validateConfig();
  
  Logger.log("=== 시트 데이터 디버깅 ===");
  
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log("❌ 스프레드시트를 찾을 수 없습니다.");
    return;
  }
  
  Logger.log(`📊 스프레드시트 ID: ${config.SHEET_ID || "활성 시트 사용"}`);
  Logger.log(`📋 시트 이름: ${config.SHEET_NAME}`);
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) {
    Logger.log(`❌ 시트 "${config.SHEET_NAME}"를 찾을 수 없습니다.`);
    Logger.log("사용 가능한 시트 목록:");
    ss.getSheets().forEach(s => Logger.log(`  - ${s.getName()}`));
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  Logger.log(`📏 총 행 수: ${data.length}`);
  Logger.log(`📏 총 열 수: ${data[0] ? data[0].length : 0}`);
  
  if (data.length > 0) {
    Logger.log(`🏷️ 헤더: ${JSON.stringify(data[0])}`);
  }
  
  if (data.length > 1) {
    Logger.log("📋 데이터 샘플 (최대 5행):");
    for (let i = 1; i < Math.min(data.length, 6); i++) {
      const row = data[i];
      const topic = String(row[0] || "").trim();
      const status = String(row[1] || "").trim();
      Logger.log(`  행 ${i + 1}: 토픽="${topic}" (${topic.length}자), 상태="${status}"`);
    }
  }
  
  // 미발행 토픽 개수 확인
  let unpublishedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const topic = String(data[i][0] || "").trim();
    const status = String(data[i][1] || "").trim().toLowerCase();
    if (topic && !status.startsWith("posted")) {
      unpublishedCount++;
    }
  }
  
  Logger.log(`📝 미발행 토픽 수: ${unpublishedCount}개`);
  Logger.log(`⚙️ 일일 발행 제한: ${config.DAILY_LIMIT}개`);
}

/**
 * 전체 시스템 테스트
 */
function testFullSystem() {
  Logger.log("=== 전체 시스템 테스트 시작 ===");
  
  try {
    // 1단계: 설정 확인
    Logger.log("1️⃣ 설정 확인 중...");
    const config = validateConfig();
    Logger.log("✅ 필수 설정 확인 완료");
    
    // 2단계: 트렌드 수집 테스트
    Logger.log("2️⃣ 트렌드 수집 테스트 중...");
    const trends = fetchTrendingTopics();
    Logger.log(`✅ ${trends.length}개 트렌드 주제 수집 완료`);
    
    // 3단계: AI 생성 테스트
    Logger.log("3️⃣ AI 글 생성 테스트 중...");
    const testTopic = trends[0]?.topic || "인공지능 최신 동향";
    const testPost = generateHtml(testTopic);
    Logger.log(`✅ AI 글 생성 완료: ${testPost.title}`);
    
    // 4단계: WordPress 연결 테스트
    Logger.log("4️⃣ WordPress 연결 테스트 중...");
    const connectionTest = testWordPressConnection(config);
    if (!connectionTest) throw new Error("WordPress 연결 실패");
    
    Logger.log("🎉 전체 시스템 테스트 완료! 모든 기능이 정상 작동합니다.");
    
  } catch (error) {
    Logger.log("❌ 시스템 테스트 실패: " + error.toString());
    throw error;
  }
}