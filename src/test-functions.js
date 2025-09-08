/**
 * === 핵심 함수들 ===
 * 실제로 사용하는 주요 함수들만 유지
 */

function validatePostFormat(format) {
  const validFormats = ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio'];
  return validFormats.includes(format) ? format : 'standard';
}

// 1. 설정 관리
function checkConfig() {
  Logger.log("=== 설정 확인 ===");
  
  try {
    const config = getConfig();
    Logger.log("현재 설정:");
    Logger.log(`  - SERP_API_KEY: ${config.SERP_API_KEY ? '설정됨' : '❌ 미설정'}`);
    Logger.log(`  - AI_MODEL: ${config.AI_MODEL || 'gpt-4o-mini'}`);
    Logger.log(`  - BLOG_NICHE_KEYWORDS: ${config.BLOG_NICHE_KEYWORDS?.length || 0}개`);
    
    return { success: true, config: config };
  } catch (error) {
    Logger.log(`❌ 설정 확인 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 2. AI 모델 변경
function changeAIModel(modelName = "gpt-5") {
  Logger.log(`=== AI 모델을 ${modelName}으로 변경 ===`);
  
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty("AI_MODEL", modelName);
    
    Logger.log(`✅ AI 모델을 ${modelName}으로 변경했습니다.`);
    const config = getConfig();
    Logger.log(`현재 모델: ${config.AI_MODEL}`);
    
    return { success: true, model: config.AI_MODEL };
  } catch (error) {
    Logger.log(`❌ 모델 변경 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 수동 포스트 발행 - 특정 토픽 선택해서 발행
 */
function publishSinglePost() {
  Logger.log("=== 📝 수동 포스트 발행 ===");
  
  try {
    const config = validateConfig();
    const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // 미발행 토픽들 찾기
    const unpublishedTopics = [];
    for (let r = 1; r < data.length; r++) {
      const rowData = createRowObject(headers, data[r]);
      const topic = rowData.Topic || rowData["Topic "] || rowData["Topic"];
      const status = rowData.Status || rowData["Status "] || rowData["Status"];
      
      if (topic && (!status || !status.startsWith("posted"))) {
        unpublishedTopics.push({
          row: r + 1,
          topic: topic,
          rowData: rowData
        });
      }
    }
    
    if (unpublishedTopics.length === 0) {
      Logger.log("❌ 발행할 미발행 토픽이 없습니다.");
      return { success: false, error: "No unpublished topics" };
    }
    
    // 첫 번째 미발행 토픽 선택 (나중에 UI로 선택 가능)
    const selected = unpublishedTopics[0];
    Logger.log(`🎯 선택된 토픽: "${selected.topic}"`);
    Logger.log(`📍 행 위치: ${selected.row}`);
    
    // 포스트 생성 및 발행
    const targetLanguage = selected.rowData.Language || "EN";
    const relatedTopics = (selected.rowData.SourceKeywords || "").split(',').map(t => t.trim()).filter(Boolean);
    
    const post = generateHtmlWithLanguage(selected.topic, targetLanguage, relatedTopics);
    const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || selected.topic);
    const seoData = buildSEO(cleaned, post.title || selected.topic, selected.rowData.ProductNames);
    const htmlWithImages = injectSectionImages(cleaned, post.title || selected.topic, post.subtopics || []);
    
    // WordPress 발행
    const categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, selected.rowData.Category || "Trends")];
    const allTags = [...new Set([...seoData.keywords.slice(0, 8), ...(post.tags || [])])];
    const tagIds = ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, allTags.join(","));
    const postFormat = validatePostFormat(selected.rowData.Format || determinePostFormat(selected.rowData.Category, selected.rowData.ProductNames));
    
    const postId = wpCreatePost({
      baseUrl: config.WP_BASE,
      user: config.WP_USER,
      appPass: config.WP_APP_PASS,
      title: seoData.seoTitle || post.title || selected.topic,
      content: htmlWithImages,
      excerpt: seoData.seoDesc || post.seoDescription || "",
      slug: seoData.slug,
      status: "publish",
      categories: categoryIds,
      tags: tagIds,
      format: postFormat
    });
    
    const postUrl = getPostUrl(config.WP_BASE, postId);
    updateSheetRow(sheet, selected.row, { 
      Status: `posted (SEO: ${seoData.seoScore.grade})`, 
      PostedURL: postUrl, 
      PostedAt: new Date() 
    }, headers);
    
    Logger.log(`✅ 수동 발행 완료: ${selected.topic} → ${postUrl}`);
    return { 
      success: true, 
      topic: selected.topic, 
      url: postUrl,
      totalUnpublished: unpublishedTopics.length - 1
    };
    
  } catch (error) {
    Logger.log(`❌ 수동 발행 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}



/**
 * 선택한 토픽만 발행하기 (행 번호로 선택)
 */
function publishSelectedTopic(rowNumber = null) {
  Logger.log("=== 🎯 선택한 토픽 발행 ===");
  
  try {
    const config = validateConfig();
    const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // 미발행 토픽 목록 표시
    const unpublishedTopics = [];
    for (let r = 1; r < data.length; r++) {
      const rowData = createRowObject(headers, data[r]);
      const topic = rowData.Topic || rowData["Topic "] || rowData["Topic"];
      const status = rowData.Status || rowData["Status "] || rowData["Status"];
      
      if (topic && (!status || !status.startsWith("posted"))) {
        unpublishedTopics.push({
          row: r + 1,
          topic: topic,
          cluster: rowData.Cluster,
          intent: rowData.Intent,
          rowData: rowData
        });
      }
    }
    
    if (unpublishedTopics.length === 0) {
      Logger.log("❌ 발행할 미발행 토픽이 없습니다.");
      return { success: false, error: "No unpublished topics" };
    }
    
    Logger.log("📋 발행 가능한 토픽 목록:");
    unpublishedTopics.forEach((item, i) => {
      Logger.log(`  ${i + 1}. [행${item.row}] "${item.topic}" (${item.cluster || 'N/A'})`);
    });
    
    // 행 번호가 지정되지 않았으면 첫 번째 토픽 선택
    let selectedIndex = 0;
    if (rowNumber) {
      const foundIndex = unpublishedTopics.findIndex(item => item.row === rowNumber);
      if (foundIndex !== -1) {
        selectedIndex = foundIndex;
        Logger.log(`🎯 지정된 행 ${rowNumber} 선택됨`);
      } else {
        Logger.log(`⚠️ 행 ${rowNumber}을 찾을 수 없어서 첫 번째 토픽을 선택합니다.`);
      }
    }
    
    const selected = unpublishedTopics[selectedIndex];
    Logger.log(`\n🚀 선택된 토픽:`);
    Logger.log(`  - 제목: "${selected.topic}"`);
    Logger.log(`  - 행: ${selected.row}`);
    Logger.log(`  - 클러스터: ${selected.cluster || 'N/A'}`);
    Logger.log(`  - 의도: ${selected.intent || 'N/A'}`);
    
    // 포스트 생성 및 발행
    const targetLanguage = selected.rowData.Language || "EN";
    const relatedTopics = (selected.rowData.SourceKeywords || "").split(',').map(t => t.trim()).filter(Boolean);
    
    Logger.log(`📝 글 생성 시작...`);
    const post = generateHtmlWithLanguage(selected.topic, targetLanguage, relatedTopics);
    const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || selected.topic);
    const seoData = buildSEO(cleaned, post.title || selected.topic, selected.rowData.ProductNames);
    const htmlWithImages = injectSectionImages(cleaned, post.title || selected.topic, post.subtopics || []);
    
    // WordPress 발행
    Logger.log(`🌐 WordPress에 발행 중...`);
    const categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, selected.rowData.Category || selected.cluster || "Trends")];
    const allTags = [...new Set([...seoData.keywords.slice(0, 8), ...(post.tags || [])])];
    const tagIds = ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, allTags.join(","));
    const postFormat = validatePostFormat(selected.rowData.Format || determinePostFormat(selected.rowData.Category, selected.rowData.ProductNames));
    
    const postId = wpCreatePost({
      baseUrl: config.WP_BASE,
      user: config.WP_USER,
      appPass: config.WP_APP_PASS,
      title: seoData.seoTitle || post.title || selected.topic,
      content: htmlWithImages,
      excerpt: seoData.seoDesc || post.seoDescription || "",
      slug: seoData.slug,
      status: "publish",
      categories: categoryIds,
      tags: tagIds,
      format: postFormat
    });
    
    const postUrl = getPostUrl(config.WP_BASE, postId);
    updateSheetRow(sheet, selected.row, { 
      Status: `posted (SEO: ${seoData.seoScore.grade})`, 
      PostedURL: postUrl, 
      PostedAt: new Date() 
    }, headers);
    
    Logger.log(`\n✅ 선택한 토픽 발행 완료!`);
    Logger.log(`📍 행 ${selected.row}: "${selected.topic}"`);
    Logger.log(`🔗 URL: ${postUrl}`);
    Logger.log(`📊 SEO 점수: ${seoData.seoScore.grade}`);
    
    return { 
      success: true, 
      row: selected.row,
      topic: selected.topic, 
      url: postUrl,
      seoGrade: seoData.seoScore.grade,
      remainingTopics: unpublishedTopics.length - 1
    };
    
  } catch (error) {
    Logger.log(`❌ 선택한 토픽 발행 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 시스템 전체 진단 및 테스트
 */
function testSystemHealth() {
  Logger.log("=== 🏥 시스템 건강 진단 시작 ===");
  
  const results = {
    config: testBasicConfig(),
    googleApi: testGoogleCustomSearch(),
    wordpress: testWordPressBasic(),
    sheets: testSheetsAccess(),
    ai: testAIConnection()
  };
  
  Logger.log("\n=== 📊 진단 결과 요약 ===");
  Object.entries(results).forEach(([component, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${component}: ${result.success ? '정상' : result.error}`);
  });
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const successRate = Math.round((successCount / Object.keys(results).length) * 100);
  
  Logger.log(`\n🎯 전체 시스템 상태: ${successRate}% (${successCount}/${Object.keys(results).length})`);
  
  if (successRate >= 80) {
    Logger.log("🚀 시스템이 정상 작동 중입니다!");
  } else {
    Logger.log("⚠️ 일부 기능에 문제가 있습니다. 위 결과를 확인해주세요.");
  }
  
  return results;
}

function testBasicConfig() {
  try {
    const config = getConfig();
    const required = ['AI_API_KEY', 'WP_BASE', 'WP_USER', 'WP_APP_PASS'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      return { success: false, error: `설정 누락: ${missing.join(', ')}` };
    }
    
    return { success: true, message: "기본 설정 완료" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function testGoogleCustomSearch() {
  try {
    const config = getConfig();
    
    if (!config.GOOGLE_API_KEY || !config.GOOGLE_SEARCH_ENGINE_ID) {
      return { 
        success: false, 
        error: "Google API 설정 누락 (이미지 검색은 Pexels 대체 사용)" 
      };
    }
    
    // API 상태만 확인 (실제 호출 안함)
    return { 
      success: true, 
      message: "Google API 설정됨 (실제 사용시 활성화 필요)" 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function testWordPressBasic() {
  try {
    const config = getConfig();
    
    if (!config.WP_BASE || !config.WP_USER || !config.WP_APP_PASS) {
      return { success: false, error: "WordPress 설정 누락" };
    }
    
    // 간단한 연결 테스트 (GET 요청)
    const response = UrlFetchApp.fetch(`${config.WP_BASE}/wp-json/wp/v2/posts?per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(`${config.WP_USER}:${config.WP_APP_PASS}`)
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      return { success: true, message: "WordPress 연결 정상" };
    } else {
      return { success: false, error: `WordPress 연결 실패 (${response.getResponseCode()})` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function testSheetsAccess() {
  try {
    const config = getConfig();
    const ss = config.SHEET_ID ? 
      SpreadsheetApp.openById(config.SHEET_ID) : 
      SpreadsheetApp.getActiveSpreadsheet();
    
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    if (!sheet) {
      return { success: false, error: `시트 '${config.SHEET_NAME}' 찾을 수 없음` };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const requiredHeaders = ['Topic', 'Status'];
    const missingHeaders = requiredHeaders.filter(h => 
      !headers.some(header => header.toString().trim().toLowerCase().includes(h.toLowerCase()))
    );
    
    if (missingHeaders.length > 0) {
      return { success: false, error: `필수 헤더 누락: ${missingHeaders.join(', ')}` };
    }
    
    return { success: true, message: "Google Sheets 접근 정상" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function testAIConnection() {
  try {
    const config = getConfig();
    
    if (!config.AI_API_KEY) {
      return { success: false, error: "AI API 키 누락" };
    }
    
    // AI 모델 정보만 확인
    const modelProfile = getModelProfile(config.AI_MODEL);
    
    return { 
      success: true, 
      message: `AI 설정 완료 (${config.AI_MODEL})`,
      model: config.AI_MODEL
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 토픽 목록만 보기 (선택용)
 */
function showTopicList() {
  Logger.log("=== 📋 발행 가능한 토픽 목록 ===");
  
  try {
    const config = validateConfig();
    const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const unpublishedTopics = [];
    for (let r = 1; r < data.length; r++) {
      const rowData = createRowObject(headers, data[r]);
      const topic = rowData.Topic || rowData["Topic "] || rowData["Topic"];
      const status = rowData.Status || rowData["Status "] || rowData["Status"];
      
      if (topic && (!status || !status.startsWith("posted"))) {
        unpublishedTopics.push({
          row: r + 1,
          topic: topic,
          cluster: rowData.Cluster,
          intent: rowData.Intent
        });
      }
    }
    
    Logger.log(`\n📊 총 ${unpublishedTopics.length}개의 미발행 토픽:`);
    Logger.log(`\n사용법: publishSelectedTopic(행번호)`);
    Logger.log(`예: publishSelectedTopic(5) → 5행의 토픽 발행\n`);
    
    unpublishedTopics.forEach((item, i) => {
      Logger.log(`🔸 행${item.row}: "${item.topic}"`);
      if (item.cluster) Logger.log(`   └ 클러스터: ${item.cluster}`);
      if (item.intent) Logger.log(`   └ 의도: ${item.intent}`);
      Logger.log(``); // 빈 줄
    });
    
    return { 
      success: true, 
      topics: unpublishedTopics,
      count: unpublishedTopics.length
    };
    
  } catch (error) {
    Logger.log(`❌ 토픽 목록 조회 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}









