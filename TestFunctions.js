/**
 * 통합 테스트 마스터 파일
 * 모든 개별 테스트들을 통합 실행
 */

/**
 * 빠른 핵심 기능 테스트 (5분 이내)
 */
function testCoreFeatures() {
  Logger.log("=== 🚀 핵심 기능 빠른 테스트 시작 ===");
  const startTime = Date.now();
  
  const coreTests = {
    trends: testTrendsCollection(),
    ai: testAIGeneration(), 
    wordpress: testWordPressConnection(),
    images: testImageSearch()
  };
  
  const successCount = Object.values(coreTests).filter(r => r.success).length;
  const duration = Date.now() - startTime;
  
  Logger.log(`=== ⚡ 핵심 기능 테스트 완료 (${Math.round(duration/1000)}초) ===`);
  Logger.log(`성공률: ${successCount}/4 (${Math.round(successCount/4*100)}%)`);
  
  Object.entries(coreTests).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${test}: ${result.success ? '성공' : result.error}`);
  });
  
  return {
    success: successCount >= 3, // 4개 중 3개 이상 성공
    results: coreTests,
    duration: duration,
    successCount: successCount
  };
}

/**
 * 1. Google Trends 토픽 수집 테스트
 */
function testTrendsCollection() {
  Logger.log("=== Google Trends 토픽 수집 테스트 시작 ===");
  
  try {
    const trends = fetchTrendingTopics();
    
    Logger.log(`✅ 트렌드 수집 결과:`);
    Logger.log(`  - 수집된 주제 수: ${trends.length}개`);
    Logger.log(`  - 첫 3개 주제:`);
    
    trends.slice(0, 3).forEach((trend, index) => {
      Logger.log(`    ${index + 1}. ${trend.topic} (출처: ${trend.source})`);
    });
    
    return {
      success: true,
      count: trends.length,
      trends: trends
    };
  } catch (error) {
    Logger.log(`❌ 트렌드 수집 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 2. AI 글 생성 테스트
 */
function testAIGeneration() {
  Logger.log("=== AI 글 생성 테스트 시작 ===");
  
  const testTopic = "Latest smartphone technology trends 2025";
  
  try {
    const result = generateHtmlWithLanguage(testTopic, "EN");
    
    Logger.log(`✅ AI 글 생성 결과:`);
    Logger.log(`  - 제목: ${result.title}`);
    Logger.log(`  - HTML 길이: ${result.html ? result.html.length : 0}자`);
    Logger.log(`  - 카테고리: ${result.categories ? result.categories.join(', ') : '없음'}`);
    Logger.log(`  - 태그: ${result.tags ? result.tags.join(', ') : '없음'}`);
    
    return {
      success: true,
      title: result.title,
      htmlLength: result.html ? result.html.length : 0,
      categories: result.categories,
      tags: result.tags
    };
  } catch (error) {
    Logger.log(`❌ AI 글 생성 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 3. WordPress 연결 테스트
 */
function testWordPressConnection() {
  Logger.log("=== WordPress 연결 테스트 시작 ===");
  
  try {
    const config = validateConfig();
    const isConnected = testWordPressConnection(config);
    
    Logger.log(`✅ WordPress 연결 결과: ${isConnected ? '성공' : '실패'}`);
    
    return {
      success: isConnected,
      baseUrl: config.WP_BASE,
      user: config.WP_USER
    };
  } catch (error) {
    Logger.log(`❌ WordPress 연결 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 4. 이미지 검색 테스트
 */
function testImageSearch() {
  Logger.log("=== 이미지 검색 테스트 시작 ===");
  
  const testQuery = "Sony FX3 camera";
  
  try {
    const image = findFeaturedImageForProduct(testQuery, "Sony FX3 Review");
    
    if (image && image.url) {
      Logger.log(`✅ 이미지 검색 결과:`);
      Logger.log(`  - 이미지 URL: ${image.url}`);
      Logger.log(`  - 출처: ${image.source}`);
      Logger.log(`  - 원본 사이트: ${image.originalSource || 'N/A'}`);
      
      return {
        success: true,
        url: image.url,
        source: image.source,
        originalSource: image.originalSource
      };
    } else {
      Logger.log(`❌ 이미지 검색 실패: 결과 없음`);
      return {
        success: false,
        error: "No image found"
      };
    }
  } catch (error) {
    Logger.log(`❌ 이미지 검색 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 5. Google Images API 설정 테스트
 */
function testGoogleImagesAPI() {
  Logger.log("=== Google Images API 설정 테스트 시작 ===");
  
  try {
    const config = getConfig();
    const apiKey = config.GOOGLE_API_KEY;
    const engineId = config.GOOGLE_SEARCH_ENGINE_ID;
    
    Logger.log(`🔍 설정 확인:`);
    Logger.log(`  - API Key: ${apiKey ? '설정됨 (' + apiKey.length + '자)' : '없음'}`);
    Logger.log(`  - Engine ID: ${engineId ? '설정됨 (' + engineId + ')' : '없음'}`);
    
    if (!apiKey || !engineId) {
      Logger.log(`❌ Google Images API 설정 불완전`);
      return {
        success: false,
        error: "Missing API key or Engine ID"
      };
    }
    
    // 실제 API 호출 테스트
    const testResult = searchGoogleImages("test camera", apiKey, engineId);
    
    return {
      success: testResult !== null,
      hasApiKey: !!apiKey,
      hasEngineId: !!engineId,
      apiKeyLength: apiKey ? apiKey.length : 0
    };
  } catch (error) {
    Logger.log(`❌ Google Images API 테스트 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 6. 전체 시스템 통합 테스트
 */
function testFullAutomation() {
  Logger.log("=== 풀 오토메이션 통합 테스트 시작 ===");
  
  const results = {
    trends: testTrendsCollection(),
    ai: testAIGeneration(), 
    wordpress: testWordPressConnection(),
    images: testImageSearch(),
    googleImages: testGoogleImagesAPI()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  Logger.log(`=== 통합 테스트 결과 ===`);
  Logger.log(`성공: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${test}: ${result.success ? '성공' : result.error}`);
  });
  
  return results;
}