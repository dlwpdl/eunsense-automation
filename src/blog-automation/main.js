/**
 * 블로그 자동화 시스템 - 메인 오케스트레이터
 * Google Trends → AI 글 생성 → WordPress 자동 발행
 */

// ==============================================================================
// 메인 워크플로우 함수
// ==============================================================================

/**
 * 토픽 수집 및 시트 저장의 메인 함수
 */
function collectTrends() {
  const config = validateConfig();
  
  Logger.log("=== 씨앗 키워드로 주제 발굴 시작 ===");
  const strategicTopics = discoverNicheTopics();
  Logger.log(`AI가 분석한 전략적 주제 ${strategicTopics.length}개 수집 완료`);
  
  if (strategicTopics.length === 0) {
    Logger.log("수집된 신규 주제가 없습니다.");
    return;
  }
  
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  
  const sheet = getOrCreateSheet(ss, config.SHEET_NAME);
  saveTopicsToSheet(sheet, strategicTopics);
  
  Logger.log("✅ 트렌드 수집 및 전략 분석, 시트 저장 완료");
}

/**
 * 포스트 발행 함수 (제한적 실행)
 */
function publishPosts() {
  const config = validateConfig();
  
  Logger.log("=== 미발행 주제로 포스트 발행 시작 ===");
  
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${config.SHEET_NAME}" 를 찾을 수 없습니다.`);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  Logger.log(`시트 데이터 행 수: ${data.length}`);
  Logger.log(`헤더: ${JSON.stringify(headers)}`);
  
  if (data.length <= 1) {
    Logger.log("주제가 없습니다.");
    return;
  }

  let postedCount = 0;
  let checkedCount = 0;

  for (let r = 1; r < data.length; r++) {
    if (postedCount >= config.DAILY_LIMIT) break;

    const rowData = createRowObject(headers, data[r]);
    checkedCount++;
    Logger.log(`행 ${r + 1} 체크: 토픽="${rowData.Topic}", 상태="${rowData.Status}"`);

    // 공백이 있는 헤더 이름들도 체크 
    const topic = rowData.Topic || rowData["Topic "] || rowData["Topic"];
    const status = rowData.Status || rowData["Status "] || rowData["Status"];
    
    if (!topic || (status && status.startsWith("posted"))) {
      continue;
    }

    Logger.log(`처리 중인 주제: ${topic}`);

    try {
      const targetLanguage = rowData.Language || "EN";
      const relatedTopics = (rowData.SourceKeywords || "").split(',').map(t => t.trim()).filter(Boolean);
      
      const post = generateHtmlWithLanguage(topic, targetLanguage, relatedTopics);

      const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
      const seoData = buildSEO(cleaned, post.title || topic, rowData.ProductNames);
      let htmlWithImages = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

      const categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, rowData.Category || "Trends")];
      const allTags = [...new Set([...seoData.keywords.slice(0, 8), ...(post.tags || [])])];
      const tagIds = ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, allTags.join(","));
      const postFormat = validatePostFormat(rowData.Format || determinePostFormat(rowData.Category, rowData.ProductNames));

      const postId = wpCreatePost({
        baseUrl: config.WP_BASE,
        user: config.WP_USER,
        appPass: config.WP_APP_PASS,
        title: seoData.seoTitle || post.title || rowData.Topic,
        content: htmlWithImages,
        excerpt: seoData.seoDesc || post.seoDescription || "",
        slug: seoData.slug,
        status: "publish",
        categories: categoryIds,
        tags: tagIds,
        format: postFormat
      });

      const postUrl = getPostUrl(config.WP_BASE, postId);
      updateSheetRow(sheet, r + 1, { Status: `posted (SEO: ${seoData.seoScore.grade})`, PostedURL: postUrl, PostedAt: new Date() }, headers);
      
      Logger.log(`✅ 발행 완료: ${topic} → ${postUrl}`);
      postedCount++;
      
      if (config.POST_INTERVAL_MS > 0 && postedCount < config.DAILY_LIMIT) {
        Utilities.sleep(config.POST_INTERVAL_MS);
      }
      
    } catch (error) {
      Logger.log(`글 발행 실패 (${topic}): ${error.message}`);
      updateSheetRow(sheet, r + 1, { Status: `error: ${error.message}` }, headers);
      continue;
    }
  }

  Logger.log(`=== 실행 요약 ===`);
  Logger.log(`총 데이터 행 수: ${data.length - 1}개 (헤더 제외)`);
  Logger.log(`검토한 행 수: ${checkedCount}개`);
  Logger.log(`발행 완료: ${postedCount}건`);
  Logger.log(`일일 제한: ${config.DAILY_LIMIT}건`);
}

// ==============================================================================
// 시트 관리 함수
// ==============================================================================

/**
 * 시트 가져오기 또는 생성 (확장된 헤더 포함)
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    const headers = [
      "Topic", "Status", "PostedURL", "PostedAt", "Category", 
      "TagsCsv", "AffiliateLinks", "ProductNames", "Language", "Format",
      "Cluster", "Intent", "SourceKeywords", "OpportunityScore"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    Logger.log(`✅ 새 시트 '${sheetName}' 생성 및 헤더 설정 완료.`);
  }
  return sheet;
}

/**
 * AI가 분석한 새로운 토픽들을 시트에 저장
 */
function saveTopicsToSheet(sheet, topics) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existingData = sheet.getDataRange().getValues();
  const existingTopics = new Set(existingData.slice(1).map(row => row[0]));

  const newTopics = topics.filter(topic => !existingTopics.has(topic.topic));
  
  if (newTopics.length > 0) {
    const newRows = newTopics.map(topic => {
      const row = new Array(headers.length).fill("");
      
      // 안전한 열 인덱스 설정 함수
      const setColumn = (headerName, value) => {
        const index = headers.indexOf(headerName);
        if (index >= 0) {
          row[index] = value;
        } else {
          Logger.log(`⚠️ 헤더 '${headerName}'를 찾을 수 없습니다.`);
        }
      };
      
      setColumn("Topic", topic.topic);
      setColumn("Category", topic.cluster_name || "Trends");
      setColumn("TagsCsv", (topic.keywords || []).slice(0, 5).join(','));
      setColumn("Language", "EN");
      setColumn("Format", "standard");
      setColumn("Cluster", topic.cluster_name);
      setColumn("Intent", topic.user_intent);
      setColumn("SourceKeywords", (topic.keywords || []).join(', '));
      setColumn("OpportunityScore", topic.opportunity_score);
      
      return row;
    });
    
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    Logger.log(`✅ AI가 분석한 새로운 토픽 ${newTopics.length}개를 시트에 저장했습니다.`);
  } else {
    Logger.log("✅ 새로운 토픽이 없습니다 (기존 토픽과 중복). ");
  }
}

function createRowObject(headers, row) {
  const obj = {};
  headers.forEach((header, i) => {
    // 헤더 이름 정규화 (공백 제거 및 소문자 변환)
    const normalizedKey = header.trim();
    obj[normalizedKey] = row[i];
  });
  return obj;
}

function updateSheetRow(sheet, rowNumber, dataToUpdate, headers) {
  for (const [key, value] of Object.entries(dataToUpdate)) {
    // 헤더 이름 매칭 (공백 문제 해결)
    let colIndex = headers.indexOf(key);
    
    // 공백이 있는 헤더도 체크
    if (colIndex === -1) {
      colIndex = headers.findIndex(header => header.trim() === key.trim());
    }
    
    // 유연한 헤더 매칭 (Status, Status 등)
    if (colIndex === -1 && key === 'Status') {
      colIndex = headers.findIndex(header => header.trim().toLowerCase().startsWith('status'));
    }
    if (colIndex === -1 && key === 'PostedURL') {
      colIndex = headers.findIndex(header => header.trim().toLowerCase().includes('postedurl') || header.trim().toLowerCase().includes('url'));
    }
    if (colIndex === -1 && key === 'PostedAt') {
      colIndex = headers.findIndex(header => header.trim().toLowerCase().includes('postedat') || header.trim().toLowerCase().includes('posted'));
    }
    
    if (colIndex !== -1) {
      try {
        sheet.getRange(rowNumber, colIndex + 1).setValue(value);
        Logger.log(`✅ 시트 업데이트: ${key} → ${value} (열 ${colIndex + 1})`);
      } catch (error) {
        Logger.log(`❌ 시트 업데이트 실패: ${key} → ${error.message}`);
      }
    } else {
      Logger.log(`⚠️ 헤더를 찾을 수 없음: "${key}" (사용 가능한 헤더: ${headers.map(h => `"${h}"`).join(', ')})`);
    }
  }
}

function getLanguageFromSheet(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const languageColIndex = headers.indexOf("Language");
    if (languageColIndex === -1) return "EN";
    const languageData = sheet.getRange(currentRow, languageColIndex + 1).getValue();
    if (!languageData) return "EN";
    const result = languageData.toString().trim().toUpperCase();
    if (result.includes("KO")) return "KO";
    if (result.includes("EN")) return "EN";
    return "EN";
  } catch (e) {
    return "EN";
  }
}

function getProductNames(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const productColIndex = headers.indexOf("ProductNames");
    if (productColIndex === -1) return null;
    return sheet.getRange(currentRow, productColIndex + 1).getValue() || null;
  } catch (e) {
    return null;
  }
}

function getPostFormatFromSheet(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const formatColIndex = headers.indexOf("Format");
    if (formatColIndex === -1) return "standard";
    const formatData = sheet.getRange(currentRow, formatColIndex + 1).getValue();
    return formatData ? formatData.toString().trim().toLowerCase() : "standard";
  } catch (e) {
    return "standard";
  }
}

function determinePostFormat(category, productNames) {
  // WordPress 지원 포맷만 사용
  const validFormats = ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio'];
  
  if (!category) return 'standard';
  const categoryLower = category.toLowerCase();
  
  // 기어/제품 리뷰의 경우 gallery 포맷 사용
  const reviewKeywords = ['gear', 'gadget', 'camera', 'equipment', 'review'];
  if (reviewKeywords.some(k => categoryLower.includes(k)) || productNames) {
    return 'gallery';
  }
  
  // 비디오 관련 주제
  const videoKeywords = ['video', 'tutorial', 'guide', 'demo'];
  if (videoKeywords.some(k => categoryLower.includes(k))) {
    return 'video';
  }
  
  // 뉴스/업데이트
  const statusKeywords = ['news', 'update', 'release', 'announcement'];
  if (statusKeywords.some(k => categoryLower.includes(k))) {
    return 'status';
  }
  
  return 'standard';
}

function validatePostFormat(format) {
  const validFormats = ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio'];
  return validFormats.includes(format) ? format : 'standard';
}

// ==============================================================================
// 콘텐츠 재활용 및 최적화
// ==============================================================================

/**
 * 오래된 콘텐츠를 찾아 AI로 재최적화하는 메인 함수
 */
function reoptimizeOldPosts() {
  const config = validateConfig();
  if (!config.REOPTIMIZE_ENABLED) {
    Logger.log("콘텐츠 재최적화 기능이 비활성화되어 있습니다.");
    return;
  }

  Logger.log("=== 오래된 콘텐츠 재최적화 시작 ===");

  // 1. 재최적화할 오래된 포스트 가져오기
  const olderThanDate = new Date();
  olderThanDate.setDate(olderThanDate.getDate() - config.REOPTIMIZE_POSTS_OLDER_THAN_DAYS);
  const isoDate = olderThanDate.toISOString();

  const params = {
    per_page: config.REOPTIMIZE_DAILY_LIMIT,
    before: isoDate, // 특정 날짜 이전 포스트
    orderby: 'date',
    order: 'asc' // 가장 오래된 순서부터
  };

  // 특정 카테고리가 설정된 경우, 해당 카테고리 ID를 조회하여 파라미터에 추가
  if (config.REOPTIMIZE_TARGET_CATEGORY) {
    try {
      const categoryId = ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, config.REOPTIMIZE_TARGET_CATEGORY);
      if (categoryId) {
        params.categories = categoryId;
        Logger.log(`타겟 카테고리 '${config.REOPTIMIZE_TARGET_CATEGORY}' (ID: ${categoryId})의 글을 검색합니다.`);
      }
    } catch (e) {
      Logger.log(`타겟 카테고리 '${config.REOPTIMIZE_TARGET_CATEGORY}'를 찾지 못했습니다: ${e.message}`);
    }
  }

  const postsToUpdate = wpGetPosts({ ...config, params });

  if (!postsToUpdate || postsToUpdate.length === 0) {
    Logger.log("재최적화할 포스트가 없습니다.");
    return;
  }

  Logger.log(`${postsToUpdate.length}개의 오래된 포스트를 재최적화합니다.`);

  // 2. 각 포스트를 순회하며 AI로 재작성 및 업데이트
  postsToUpdate.forEach(post => {
    try {
      Logger.log(`🔄 포스트 재최적화 중: #${post.id} - ${post.title.rendered}`);
      
      // 2.1 AI에게 재작성 요청
      const reoptimizedData = generateReoptimizedPost(post.title.rendered, post.content.rendered);
      if (!reoptimizedData || !reoptimizedData.newTitle || !reoptimizedData.newHtml) {
        throw new Error("AI가 유효한 재작성 콘텐츠를 생성하지 못했습니다.");
      }

      // 2.2 워드프레스 포스트 업데이트
      const updateData = {
        title: reoptimizedData.newTitle,
        content: reoptimizedData.newHtml,
        // 재최적화되었음을 알리는 메타 필드 또는 태그 추가 (선택사항)
        meta: { _reoptimized_at: new Date().toISOString() }
      };

      wpUpdatePost({ ...config, postId: post.id, data: updateData });

      Logger.log(`✅ 포스트 업데이트 완료: #${post.id} - ${reoptimizedData.newTitle}`);
      
      // API 과부하 방지를 위한 딜레이
      Utilities.sleep(2000);

    } catch (error) {
      Logger.log(`❌ 포스트 #${post.id} 재최적화 실패: ${error.message}`);
    }
  });

  Logger.log("=== 콘텐츠 재최적화 완료 ===");
}

/**
 * 콘텐츠 재활용 자동화 트리거 설정 (매주 일요일 새벽 3시)
 */
function setupReoptimizationTrigger() {
  // 기존 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'reoptimizeOldPosts') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 매주 일요일 새벽 3시에 실행되는 트리거 생성
  ScriptApp.newTrigger('reoptimizeOldPosts')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();

  Logger.log("✅ 콘텐츠 재최적화 트리거 설정 완료 (매주 일요일 새벽 3시 실행).");
}

function getAffiliateLinks(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const affiliateColIndex = headers.indexOf("AffiliateLinks");
    if (affiliateColIndex === -1) return null;
    return sheet.getRange(currentRow, affiliateColIndex + 1).getValue() || null;
  } catch (e) {
    return null;
  }
}

function addAffiliateSection(html, affiliateLinks, category, productNames = null) {
  if (!html || !affiliateLinks) return html;
  const linkData = parseLinksAndProducts(affiliateLinks, productNames);
  if (linkData.length === 0) return html;
  const affiliateSection = generateAffiliateSection(linkData, category);
  const lastParagraph = html.lastIndexOf('</p>');
  if (lastParagraph !== -1) {
    return html.substring(0, lastParagraph + 4) + affiliateSection + html.substring(lastParagraph + 4);
  } else {
    return html + affiliateSection;
  }
}

function parseLinksAndProducts(affiliateLinks, productNames) {
  const links = smartSplit(affiliateLinks);
  let products = productNames ? smartSplit(productNames) : [];
  return links.map((link, i) => ({
    url: link,
    name: products[i] || extractProductName(link) || `Product ${i + 1}`
  }));
}

function smartSplit(text) {
  if (!text) return [];
  const trimmedText = text.trim();
  const separators = [',', '|', ';', '\n'];
  for (const separator of separators) {
    if (trimmedText.includes(separator)) {
      const parts = trimmedText.split(separator).map(part => part.trim()).filter(part => part.length > 0);
      if (parts.length > 1) return parts;
    }
  }
  return [trimmedText];
}

function generateAffiliateSection(linkData, category) {
  // ... (implementation as before)
  return "<div>...</div>"; // Placeholder for brevity
}

function extractProductName(url) {
  // ... (implementation as before)
  return "Product"; // Placeholder for brevity
}

// ==============================================================================
// 자동화 트리거 및 테스트 함수
// ==============================================================================

function setupAutomationTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  ScriptApp.newTrigger('collectTrends').timeBased().everyDays(1).atHour(6).create();
  ScriptApp.newTrigger('publishPosts').timeBased().everyDays(1).atHour(9).create();
  
  Logger.log("✅ 자동화 트리거 설정 완료");
}

function testFullSystem() {
  Logger.log("=== 전체 시스템 테스트 시작 ===");
  try {
    Logger.log("1️⃣ 설정 확인 중...");
    validateConfig();
    Logger.log("2️⃣ 토픽 발굴 테스트 중...");
    const topics = discoverNicheTopics();
    if (topics.length === 0) throw new Error("토픽 발굴 실패");
    Logger.log(`✅ ${topics.length}개 전략적 주제 발굴 완료`);
    Logger.log("3️⃣ AI 글 생성 테스트 중...");
    const testPost = generateHtmlWithLanguage(topics[0].topic, "EN", topics[0].keywords);
    if (!testPost.html) throw new Error("AI 글 생성 실패");
    Logger.log(`✅ AI 글 생성 완료: ${testPost.title}`);
    Logger.log("4️⃣ WordPress 연결 테스트 중...");
    const connectionTest = testWordPressConnection(getConfig());
    if (!connectionTest) throw new Error("WordPress 연결 실패");
    Logger.log("🎉 전체 시스템 테스트 완료!");
  } catch (error) {
    Logger.log(`❌ 시스템 테스트 실패: ${error.toString()}`);
    throw error;
  }
}
