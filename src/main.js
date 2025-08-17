/**
 * Google Sheet "Topics" → 선택한 AI로 HTML 글 생성 → WordPress 발행 (하루 N건)
 * Providers: openai(GPT), gemini, anthropic(Claude), xai(Grok)
 * Sheet Columns: A Topic | B Status | C PostedURL | D PostedAt | E Category | F TagsCsv
 */


/** 본문 정리: 첫 H1 제거, 중복 H1→H2 강등, 제목과 동일한 헤딩 중복 제거 */
function sanitizeHtmlBeforePublish(html, postTitle) {
  if (!html) return html || "";
  let out = String(html);

  // 1) 첫 번째 <h1>...</h1> 제거 (WP가 포스트 타이틀을 렌더링하므로)
  out = out.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");

  // 2) 남아있는 H1이 있으면 H2로 강등
  out = out.replace(/<h1([^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");

  // 3) 제목과 같은 텍스트의 헤딩이 바로 이어서 한 번 더 나오면 제거
  if (postTitle) {
    const t = postTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dupRe = new RegExp(`<(h2|h3)[^>]*>\\s*${t}\\s*</\\1>\\s*`, "i");
    out = out.replace(dupRe, "");
  }
  return out;
}

/** ====== 기본 설정 ====== */
const SHEET_NAME = "Topics";
// 트리거 1회 실행당 발행 개수 (예: 하루 1회 트리거 × 3건)
const DAILY_LIMIT = 3;
// 글을 몰아서 올릴 때 간격(ms). 0이면 연속 발행. (예: 60초 간격이면 60000)
const POST_INTERVAL_MS = 0;
// Google Trends에서 가져올 주제 개수
const TRENDS_DAILY_LIMIT = 10;

/** ====== 메인: 시트에서 주제 읽어와 발행 ====== */
function main() {
  const props = PropertiesService.getScriptProperties();

  // WP 시크릿
  const WP_BASE = props.getProperty("WP_BASE");
  const WP_USER = props.getProperty("WP_USER");
  const WP_APP_PASS = props.getProperty("WP_APP_PASS");
  if (!WP_BASE || !WP_USER || !WP_APP_PASS) {
    throw new Error("Script properties에 WP_BASE, WP_USER, WP_APP_PASS를 먼저 설정하세요.");
  }

  // 스프레드시트 열기
  const SHEET_ID = props.getProperty("SHEET_ID");
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${SHEET_NAME}" 를 찾을 수 없습니다.`);

  // 데이터
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log("주제가 없습니다. A열에 Topic을 입력하세요.");
    return;
  }

  let postedCount = 0;

  // 2행부터 스캔 (A Topic | B Status | C PostedURL | D PostedAt | E Category | F TagsCsv)
  for (let r = 2; r <= data.length; r++) {
    if (postedCount >= DAILY_LIMIT) break;

    const row = data[r - 1];
    const topic        = String(row[0] || "").trim();
    const status       = String(row[1] || "").trim().toLowerCase();
    const categoryName = String(row[4] || "").trim();
    const tagsCsv      = String(row[5] || "").trim();

    if (!topic || status.startsWith("posted")) continue;

    // 1) AI 결과(구조화 JSON)
    const post = generateHtml(topic); // { title, seoDescription, categories[], tags[], subtopics[], html }

    // 1-1) 본문 정리(H1 제거 등) → 섹션별 이미지 삽입
    const cleaned         = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
    const htmlWithImages  = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

    // 2) SEO 메타 (본문 기준)
    const { seoTitle, seoDesc, slug } = buildSEO(htmlWithImages, post.title || topic);

    // 3) 카테고리/태그 ID (시트값 우선, 없으면 AI 제안 사용)
    let categoryIds;
    if (categoryName) {
      categoryIds = [ ensureCategory(WP_BASE, WP_USER, WP_APP_PASS, categoryName) ];
    } else if (Array.isArray(post.categories) && post.categories.length) {
      categoryIds = post.categories.map(name => ensureCategory(WP_BASE, WP_USER, WP_APP_PASS, name));
    }

    let tagIds;
    if (tagsCsv) {
      tagIds = ensureTags(WP_BASE, WP_USER, WP_APP_PASS, tagsCsv);
    } else if (Array.isArray(post.tags) && post.tags.length) {
      tagIds = ensureTags(WP_BASE, WP_USER, WP_APP_PASS, post.tags.join(","));
    }

    // 4) 공개 발행
    const postId = wpCreatePost({
      baseUrl: WP_BASE,
      user: WP_USER,
      appPass: WP_APP_PASS,
      title: post.title || seoTitle || topic,
      content: htmlWithImages,
      status: "publish",
      categories: categoryIds,
      tags: tagIds
    });

    // 5) 기록
    const postUrl = getPostUrl(WP_BASE, postId);
    sheet.getRange(r, 2).setValue("posted");      // Status
    sheet.getRange(r, 3).setValue(postUrl);       // PostedURL
    sheet.getRange(r, 4).setValue(new Date());    // PostedAt

    postedCount++;
    if (POST_INTERVAL_MS > 0 && postedCount < DAILY_LIMIT) {
      Utilities.sleep(POST_INTERVAL_MS);
    }
  }

  Logger.log(`이번 실행에서 ${postedCount}건 발행`);
}

/** 선택한 행을 실제 Publish로 테스트 발행 (섹션별 이미지 포함) */
function testPublishOneReal() {
  const props = PropertiesService.getScriptProperties();
  const WP_BASE = props.getProperty("WP_BASE");
  const WP_USER = props.getProperty("WP_USER");
  const WP_APP_PASS = props.getProperty("WP_APP_PASS");
  if (!WP_BASE || !WP_USER || !WP_APP_PASS) {
    throw new Error("WP 시크릿 먼저 설정");
  }

  const SHEET_ID = props.getProperty("SHEET_ID");
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${SHEET_NAME}" 를 찾을 수 없습니다.`);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error("주제가 없습니다. A열에 Topic을 추가하세요.");

  // 1) 첫 번째 미발행 행 찾기 (A Topic | B Status | ... )
  let r = -1, topic = "", categoryName = "", tagsCsv = "";
  for (let i = 2; i <= data.length; i++) {
    const row = data[i - 1];
    const t = String(row[0] || "").trim();            // Topic
    const status = String(row[1] || "").toLowerCase(); // Status
    if (t && !status.startsWith("posted")) {
      r = i;
      topic = t;
      categoryName = String(row[4] || "").trim();     // Category (opt)
      tagsCsv = String(row[5] || "").trim();          // TagsCsv  (opt)
      break;
    }
  }
  if (r === -1) throw new Error("발행할 미발행 행이 없습니다. Status가 비어있는 행을 추가하세요.");

  // 2) AI 생성
  const post = generateHtml(topic); // { title, seoDescription, categories[], tags[], subtopics[], html }
  const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
  // 3) 섹션별 이미지 삽입
  const htmlWithImages = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

  // 4) SEO
  const { seoTitle, seoDesc, slug } = buildSEO(htmlWithImages, post.title || topic);

  // 5) 카테고리/태그 ID
  const categories = categoryName
    ? [ensureCategory(WP_BASE, WP_USER, WP_APP_PASS, categoryName)]
    : (post.categories || []).map(n => ensureCategory(WP_BASE, WP_USER, WP_APP_PASS, n));

  const tags = tagsCsv
    ? ensureTags(WP_BASE, WP_USER, WP_APP_PASS, tagsCsv)
    : ((post.tags && post.tags.length) ? ensureTags(WP_BASE, WP_USER, WP_APP_PASS, post.tags.join(",")) : undefined);

  // 6) 공개 발행
  const postId = wpCreatePost({
    baseUrl: WP_BASE,
    user: WP_USER,
    appPass: WP_APP_PASS,
    title: post.title || seoTitle || topic,
    content: htmlWithImages,
    status: "publish",
    categories: (categories && categories.length) ? categories : undefined,
    tags
  });

  // 7) 기록
  const link = getPostUrl(WP_BASE, postId);
  sheet.getRange(r, 2).setValue("posted(test)");
  sheet.getRange(r, 3).setValue(link);
  sheet.getRange(r, 4).setValue(new Date());

  Logger.log(`Published #${postId}: ${link}`);
}

/** ====== Google Trends 자동 데이터 마이닝 ====== */
function fetchTrendingTopics() {
  const props = PropertiesService.getScriptProperties();
  const region = props.getProperty("TRENDS_REGION") || "KR";
  const category = props.getProperty("TRENDS_CATEGORY") || "0"; // 0 = All categories
  
  try {
    // Google Trends RSS 피드 사용 (공식 API 없음)
    const rssUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${region}`;
    const response = UrlFetchApp.fetch(rssUrl, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error("Google Trends RSS 요청 실패: " + response.getResponseCode());
    }
    
    const xmlData = response.getContentText();
    const trends = parseTrendsRSS(xmlData);
    
    return trends.slice(0, TRENDS_DAILY_LIMIT);
  } catch (error) {
    Logger.log("Trends 가져오기 실패, SerpAPI 폴백 시도: " + error);
    return fetchTrendsFromSerpAPI();
  }
}

function parseTrendsRSS(xmlData) {
  const trends = [];
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
  let match;
  
  while ((match = titleRegex.exec(xmlData)) !== null) {
    const title = match[1].trim();
    if (title && title !== "Google Trends" && title !== "Daily Search Trends") {
      trends.push({
        topic: title,
        source: "google_trends",
        timestamp: new Date()
      });
    }
  }
  
  return trends;
}

function fetchTrendsFromSerpAPI() {
  const props = PropertiesService.getScriptProperties();
  const serpApiKey = props.getProperty("SERP_API_KEY");
  
  if (!serpApiKey) {
    Logger.log("SERP_API_KEY가 설정되지 않았습니다. 기본 주제를 사용합니다.");
    return getDefaultTopics();
  }
  
  try {
    const url = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=KR&api_key=${serpApiKey}`;
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error("SerpAPI 요청 실패: " + response.getResponseCode());
    }
    
    const data = JSON.parse(response.getContentText());
    const trends = [];
    
    if (data.trending_searches && Array.isArray(data.trending_searches)) {
      data.trending_searches.forEach(item => {
        if (item.query) {
          trends.push({
            topic: item.query,
            source: "serpapi",
            timestamp: new Date()
          });
        }
      });
    }
    
    return trends.slice(0, TRENDS_DAILY_LIMIT);
  } catch (error) {
    Logger.log("SerpAPI 실패, 기본 주제 사용: " + error);
    return getDefaultTopics();
  }
}

function getDefaultTopics() {
  const defaultTopics = [
    "인공지능 최신 트렌드",
    "블록체인 기술 발전",
    "스마트폰 신제품 리뷰",
    "온라인 쇼핑 팁",
    "건강한 라이프스타일",
    "재택근무 효율성",
    "투자 전략 가이드",
    "여행 추천 장소",
    "요리 레시피 모음",
    "디지털 마케팅 전략"
  ];
  
  return defaultTopics.map(topic => ({
    topic,
    source: "default",
    timestamp: new Date()
  }));
}

/** Google Trends 주제를 시트에 자동 추가 */
function addTrendsToSheet() {
  const props = PropertiesService.getScriptProperties();
  const SHEET_ID = props.getProperty("SHEET_ID");
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss) {
    throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  }
  
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`시트 "${SHEET_NAME}" 를 찾을 수 없습니다.`);
  }
  
  // 트렌딩 주제 가져오기
  const trends = fetchTrendingTopics();
  
  if (!trends || trends.length === 0) {
    Logger.log("가져올 트렌딩 주제가 없습니다.");
    return;
  }
  
  // 기존 주제 중복 확인
  const existingData = sheet.getDataRange().getValues();
  const existingTopics = new Set();
  
  for (let i = 1; i < existingData.length; i++) {
    const topic = String(existingData[i][0] || "").trim().toLowerCase();
    if (topic) {
      existingTopics.add(topic);
    }
  }
  
  // 새로운 주제만 추가
  let addedCount = 0;
  const lastRow = sheet.getLastRow();
  
  trends.forEach((trendData, index) => {
    const topic = trendData.topic.trim();
    const topicLower = topic.toLowerCase();
    
    if (!existingTopics.has(topicLower) && topic.length > 0) {
      const rowIndex = lastRow + addedCount + 1;
      
      // A열: Topic, B열: Status (빈값), E열: Category (트렌드), F열: Tags
      sheet.getRange(rowIndex, 1).setValue(topic); // Topic
      sheet.getRange(rowIndex, 2).setValue(""); // Status (빈값으로 발행 대기)
      sheet.getRange(rowIndex, 5).setValue("트렌드"); // Category
      sheet.getRange(rowIndex, 6).setValue(`트렌딩,${trendData.source},급상승`); // Tags
      
      addedCount++;
      existingTopics.add(topicLower);
    }
  });
  
  Logger.log(`${addedCount}개의 새로운 트렌딩 주제가 추가되었습니다.`);
  return addedCount;
}

/** 완전 자동화: 트렌드 수집 + 글 발행 */
function fullAutomation() {
  try {
    // 1단계: Google Trends에서 주제 수집
    Logger.log("=== 1단계: 트렌딩 주제 수집 시작 ===");
    const addedTopics = addTrendsToSheet();
    
    // 2단계: 수집된 주제로 글 자동 발행
    Logger.log("=== 2단계: 글 자동 발행 시작 ===");
    main();
    
    Logger.log(`=== 자동화 완료: ${addedTopics}개 주제 추가 ===`);
  } catch (error) {
    Logger.log("자동화 실행 중 오류: " + error.toString());
    throw error;
  }
}

/** ====== 자동화 트리거 설정 ====== */
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

  // 매일 오후 6시에 트렌드 주제만 추가 (추가 수집)
  ScriptApp.newTrigger('addTrendsToSheet')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();

  Logger.log("✅ 자동화 트리거가 설정되었습니다:");
  Logger.log("- 매일 09:00: 완전 자동화 (트렌드 수집 + 글 발행)");
  Logger.log("- 매일 18:00: 추가 트렌드 주제 수집");
}

function setupHourlyTriggers() {
  // 기존 시간별 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'main') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 3시간마다 글 발행 (하루 8회)
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyHours(3)
    .create();

  Logger.log("✅ 시간별 발행 트리거가 설정되었습니다 (3시간마다)");
}

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

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    deletedCount++;
  });
  
  Logger.log(`${deletedCount}개의 트리거가 삭제되었습니다.`);
}

/** 설정 도우미 함수들 */
function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  
  // 기본 설정값들
  const defaultProps = {
    'AI_PROVIDER_ORDER': 'openai,gemini,anthropic,xai',
    'TRENDS_REGION': 'KR',
    'TRENDS_CATEGORY': '0',
    'IMAGE_PROVIDER': 'pexels'
  };
  
  Object.keys(defaultProps).forEach(key => {
    if (!props.getProperty(key)) {
      props.setProperty(key, defaultProps[key]);
      Logger.log(`✅ 기본값 설정: ${key} = ${defaultProps[key]}`);
    }
  });
  
  Logger.log("=== 필수 설정 가이드 ===");
  Logger.log("다음 값들을 Script Properties에 설정하세요:");
  Logger.log("1. WP_BASE: 워드프레스 사이트 URL");
  Logger.log("2. WP_USER: 워드프레스 사용자명");  
  Logger.log("3. WP_APP_PASS: 워드프레스 앱 비밀번호");
  Logger.log("4. SHEET_ID: 구글 시트 ID (선택사항)");
  Logger.log("5. AI API 키들:");
  Logger.log("   - OPENAI_API_KEY");
  Logger.log("   - GEMINI_API_KEY");
  Logger.log("   - ANTHROPIC_API_KEY");
  Logger.log("   - XAI_API_KEY");
  Logger.log("6. 이미지 API 키:");
  Logger.log("   - PEXELS_API_KEY");
  Logger.log("   - SERP_API_KEY (트렌드 폴백용)");
}

function testFullSystem() {
  Logger.log("=== 전체 시스템 테스트 시작 ===");
  
  try {
    // 1단계: 설정 확인
    Logger.log("1️⃣ 설정 확인 중...");
    const props = PropertiesService.getScriptProperties();
    const requiredProps = ['WP_BASE', 'WP_USER', 'WP_APP_PASS'];
    
    for (const prop of requiredProps) {
      if (!props.getProperty(prop)) {
        throw new Error(`필수 설정 누락: ${prop}`);
      }
    }
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
    
    // 4단계: WordPress 연결 테스트 (실제 발행은 하지 않음)
    Logger.log("4️⃣ WordPress 연결 테스트 중...");
    const WP_BASE = props.getProperty("WP_BASE");
    const response = UrlFetchApp.fetch(`${WP_BASE}/wp-json/wp/v2/posts?per_page=1`, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      Logger.log("✅ WordPress API 연결 확인");
    } else {
      throw new Error(`WordPress 연결 실패: ${response.getResponseCode()}`);
    }
    
    Logger.log("🎉 전체 시스템 테스트 완료! 모든 기능이 정상 작동합니다.");
    
  } catch (error) {
    Logger.log("❌ 시스템 테스트 실패: " + error.toString());
    throw error;
  }
}