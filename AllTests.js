/**
 * 🧪 통합 테스트 시스템
 * 모든 테스트를 한 곳에서 실행하고 관리
 */

/**
 * 🏃‍♂️ 전체 시스템 테스트 실행 (메인 진입점)
 */
function runAllTests() {
  Logger.log("╔══════════════════════════════════════════╗");
  Logger.log("║        🚀 전체 시스템 테스트 시작         ║");
  Logger.log("╚══════════════════════════════════════════╝");
  
  const startTime = Date.now();
  const results = {};
  
  // 모든 테스트 실행
  const testSuites = [
    { name: 'config', title: '🔧 설정 테스트', fn: runConfigTests },
    { name: 'trends', title: '📈 트렌드 테스트', fn: runTrendsTests },
    { name: 'ai', title: '🤖 AI 테스트', fn: runAITests },
    { name: 'images', title: '🖼️ 이미지 테스트', fn: runImageTests },
    { name: 'wordpress', title: '📝 WordPress 테스트', fn: runWordPressTests },
    { name: 'integration', title: '🔗 통합 테스트', fn: runIntegrationTests }
  ];
  
  for (const suite of testSuites) {
    try {
      Logger.log(`\n${suite.title} 시작...`);
      results[suite.name] = suite.fn();
    } catch (error) {
      Logger.log(`❌ ${suite.title} 실행 중 오류: ${error.message}`);
      results[suite.name] = { success: false, error: error.message };
    }
  }
  
  const duration = Date.now() - startTime;
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = testSuites.length;
  
  // 결과 요약
  Logger.log("\n╔══════════════════════════════════════════╗");
  Logger.log("║            📊 테스트 결과 요약            ║");
  Logger.log("╚══════════════════════════════════════════╝");
  Logger.log(`⏱️  총 소요 시간: ${Math.round(duration/1000)}초`);
  Logger.log(`✅ 성공: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  testSuites.forEach((suite, index) => {
    const result = results[suite.name];
    const status = result.success ? '✅' : '❌';
    const message = result.success ? '성공' : `실패: ${result.error}`;
    Logger.log(`${status} ${suite.title}: ${message}`);
  });
  
  return {
    success: successCount >= Math.ceil(totalTests * 0.7), // 70% 이상 성공시 전체 성공
    results,
    duration,
    successRate: Math.round(successCount/totalTests*100)
  };
}

/**
 * 🔧 설정 테스트
 */
function runConfigTests() {
  Logger.log("=== 설정 검증 중 ===");
  
  try {
    const config = validateConfig();
    const requiredKeys = ['WP_BASE', 'WP_USER', 'WP_APP_PASS'];
    const aiKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'XAI_API_KEY'];
    
    const missingRequired = requiredKeys.filter(key => !config[key]);
    const availableAI = aiKeys.filter(key => config[key]).length;
    
    if (missingRequired.length > 0) {
      Logger.log(`❌ 필수 설정 누락: ${missingRequired.join(', ')}`);
      return { success: false, error: `필수 설정 누락: ${missingRequired.join(', ')}` };
    }
    
    if (availableAI === 0) {
      Logger.log(`❌ AI API 키가 하나도 설정되지 않았습니다`);
      return { success: false, error: 'AI API 키 필요' };
    }
    
    Logger.log(`✅ 설정 검증 완료 - AI 모델 ${availableAI}개 사용 가능`);
    return { success: true, availableAI, config: Object.keys(config).length };
    
  } catch (error) {
    Logger.log(`❌ 설정 검증 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 📈 트렌드 테스트
 */
function runTrendsTests() {
  Logger.log("=== 트렌드 수집 테스트 중 ===");
  
  try {
    const trends = fetchTrendingTopics();
    
    if (!trends || trends.length === 0) {
      Logger.log("❌ 트렌드 수집 실패: 결과 없음");
      return { success: false, error: "트렌드 데이터 없음" };
    }
    
    Logger.log(`✅ 트렌드 수집 성공: ${trends.length}개 주제`);
    trends.slice(0, 3).forEach((trend, i) => {
      Logger.log(`  ${i+1}. ${trend.topic} (${trend.source})`);
    });
    
    return { success: true, count: trends.length, samples: trends.slice(0, 3) };
    
  } catch (error) {
    Logger.log(`❌ 트렌드 수집 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 🤖 AI 테스트
 */
function runAITests() {
  Logger.log("=== AI 글 생성 테스트 중 ===");
  
  const testTopic = "2025년 인공지능 트렌드";
  
  try {
    const result = generateHtmlWithLanguage(testTopic, "KR");
    
    if (!result || !result.title || !result.html) {
      Logger.log("❌ AI 글 생성 실패: 불완전한 결과");
      return { success: false, error: "불완전한 AI 결과" };
    }
    
    Logger.log(`✅ AI 글 생성 성공:`);
    Logger.log(`  제목: ${result.title}`);
    Logger.log(`  HTML 길이: ${result.html.length}자`);
    Logger.log(`  카테고리: ${result.categories ? result.categories.length : 0}개`);
    Logger.log(`  태그: ${result.tags ? result.tags.length : 0}개`);
    
    return { 
      success: true, 
      title: result.title,
      htmlLength: result.html.length,
      categoryCount: result.categories ? result.categories.length : 0,
      tagCount: result.tags ? result.tags.length : 0
    };
    
  } catch (error) {
    Logger.log(`❌ AI 글 생성 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 🖼️ 이미지 테스트
 */
function runImageTests() {
  Logger.log("=== 이미지 검색 테스트 중 ===");
  
  const testQuery = "artificial intelligence technology";
  
  try {
    const image = findFeaturedImageForProduct(testQuery, "AI Technology Review");
    
    if (!image || !image.url) {
      Logger.log("❌ 이미지 검색 실패: 결과 없음");
      return { success: false, error: "이미지 검색 결과 없음" };
    }
    
    Logger.log(`✅ 이미지 검색 성공:`);
    Logger.log(`  URL: ${image.url}`);
    Logger.log(`  출처: ${image.source}`);
    
    return { success: true, url: image.url, source: image.source };
    
  } catch (error) {
    Logger.log(`❌ 이미지 검색 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 📝 WordPress 테스트
 */
function runWordPressTests() {
  Logger.log("=== WordPress 연결 테스트 중 ===");
  
  try {
    const config = validateConfig();
    
    // WordPress REST API 연결 테스트
    const testUrl = `${config.WP_BASE}/wp-json/wp/v2/posts?per_page=1`;
    const response = UrlFetchApp.fetch(testUrl, {
      headers: {
        'Authorization': `Basic ${Utilities.base64Encode(config.WP_USER + ':' + config.WP_APP_PASS)}`
      }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
    }
    
    Logger.log(`✅ WordPress 연결 성공:`);
    Logger.log(`  기본 URL: ${config.WP_BASE}`);
    Logger.log(`  사용자: ${config.WP_USER}`);
    Logger.log(`  응답 코드: ${response.getResponseCode()}`);
    
    return { success: true, baseUrl: config.WP_BASE, responseCode: response.getResponseCode() };
    
  } catch (error) {
    Logger.log(`❌ WordPress 연결 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 🔗 통합 테스트 (전체 워크플로우)
 */
function runIntegrationTests() {
  Logger.log("=== 통합 워크플로우 테스트 중 ===");
  
  try {
    // 1. 트렌드 수집
    const trends = fetchTrendingTopics();
    if (!trends || trends.length === 0) {
      throw new Error("트렌드 수집 실패");
    }
    
    // 2. AI 글 생성
    const testTopic = trends[0].topic;
    const aiResult = generateHtmlWithLanguage(testTopic, "KR");
    if (!aiResult || !aiResult.title) {
      throw new Error("AI 글 생성 실패");
    }
    
    // 3. 이미지 검색
    const image = findFeaturedImageForProduct(testTopic, aiResult.title);
    
    Logger.log(`✅ 통합 워크플로우 성공:`);
    Logger.log(`  트렌드: ${testTopic}`);
    Logger.log(`  생성 제목: ${aiResult.title}`);
    Logger.log(`  이미지: ${image ? '찾음' : '없음'}`);
    
    return { 
      success: true, 
      topic: testTopic,
      title: aiResult.title,
      hasImage: !!image
    };
    
  } catch (error) {
    Logger.log(`❌ 통합 워크플로우 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ======= 개별 테스트 실행 함수들 =======

/**
 * 빠른 핵심 테스트만 실행 (3분 이내)
 */
function runQuickTests() {
  Logger.log("🚀 빠른 핵심 테스트 시작");
  const startTime = Date.now();
  
  const quickTests = {
    config: runConfigTests(),
    trends: runTrendsTests(),
    ai: runAITests()
  };
  
  const duration = Date.now() - startTime;
  const successCount = Object.values(quickTests).filter(r => r.success).length;
  
  Logger.log(`⚡ 빠른 테스트 완료 (${Math.round(duration/1000)}초)`);
  Logger.log(`성공률: ${successCount}/3 (${Math.round(successCount/3*100)}%)`);
  
  return { success: successCount >= 2, results: quickTests, duration };
}

/**
 * 개별 테스트 실행 함수들
 */
function testConfigOnly() { return runConfigTests(); }
function testTrendsOnly() { return runTrendsTests(); }
function testAIOnly() { return runAITests(); }
function testImagesOnly() { return runImageTests(); }
function testWordPressOnly() { return runWordPressTests(); }
function testIntegrationOnly() { return runIntegrationTests(); }

/**
 * 🔍 테스트 실행 가이드 출력
 */
function showTestGuide() {
  Logger.log("╔══════════════════════════════════════════╗");
  Logger.log("║            🧪 테스트 실행 가이드           ║");
  Logger.log("╚══════════════════════════════════════════╝");
  Logger.log("");
  Logger.log("📋 전체 테스트:");
  Logger.log("  runAllTests()        - 모든 테스트 실행");
  Logger.log("  runQuickTests()      - 핵심 테스트만 (3분)");
  Logger.log("");
  Logger.log("🎯 개별 테스트:");
  Logger.log("  testConfigOnly()     - 설정 검증");
  Logger.log("  testTrendsOnly()     - 트렌드 수집");
  Logger.log("  testAIOnly()         - AI 글 생성");
  Logger.log("  testImagesOnly()     - 이미지 검색");
  Logger.log("  testWordPressOnly()  - WordPress 연결");
  Logger.log("  testIntegrationOnly() - 통합 워크플로우");
  Logger.log("");
  Logger.log("💡 사용법: Apps Script 편집기에서 함수명을 선택하고 ▶️ 실행");
}