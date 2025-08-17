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
  if (data.length <= 1) {
    Logger.log("주제가 없습니다.");
    return;
  }

  let postedCount = 0;

  // 미발행 주제들 처리
  for (let r = 2; r <= data.length; r++) {
    if (postedCount >= config.DAILY_LIMIT) break;

    const row = data[r - 1];
    const topic = String(row[0] || "").trim();
    const status = String(row[1] || "").trim().toLowerCase();

    if (!topic || status.startsWith("posted")) continue;

    Logger.log(`처리 중인 주제: ${topic}`);

    try {
      // 1) AI로 글 생성
      const post = generateHtml(topic);

      // 2) HTML 정리 및 이미지 삽입
      const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
      const htmlWithImages = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

      // 3) SEO 메타데이터 생성
      const { seoTitle, seoDesc, slug } = buildSEO(htmlWithImages, post.title || topic);

      // 4) 카테고리/태그 ID 확보
      let categoryIds;
      if (Array.isArray(post.categories) && post.categories.length) {
        categoryIds = post.categories.map(name => ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, name));
      } else {
        categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, "Trends")];
      }

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

  Logger.log(`이번 실행에서 ${postedCount}건 발행 완료`);
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
    // 헤더 추가
    sheet.getRange(1, 1, 1, 6).setValues([["Topic", "Status", "PostedURL", "PostedAt", "Category", "TagsCsv"]]);
  }
  return sheet;
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