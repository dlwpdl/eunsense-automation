/**
 * 이미지 검색 및 처리 관련 테스트 함수들  
 */

/**
 * 기본 이미지 검색 테스트
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
 * Google Images API 상세 테스트
 */
function testGoogleImagesAPI() {
  Logger.log("=== Google Images API 상세 테스트 ===");
  
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
      apiKeyLength: apiKey ? apiKey.length : 0,
      testResult: testResult
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
 * Pexels API 테스트
 */
function testPexelsAPI() {
  Logger.log("=== Pexels API 테스트 ===");
  
  try {
    const config = getConfig();
    const apiKey = config.PEXELS_API_KEY;
    
    if (!apiKey) {
      Logger.log("❌ PEXELS_API_KEY 없음");
      return { success: false, error: "No Pexels API key" };
    }
    
    Logger.log(`🔍 Pexels 설정: API Key ${apiKey.length}자`);
    
    const result = searchPexelsImageFast("camera technology", apiKey, "test");
    
    if (result && result.url) {
      Logger.log(`✅ Pexels 검색 성공:`);
      Logger.log(`  - URL: ${result.url}`);
      Logger.log(`  - 사진작가: ${result.photographer}`);
      
      return {
        success: true,
        url: result.url,
        photographer: result.photographer,
        source: result.source
      };
    } else {
      Logger.log(`❌ Pexels 검색 실패`);
      return { success: false, error: "No results from Pexels" };
    }
    
  } catch (error) {
    Logger.log(`❌ Pexels API 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Unsplash API 테스트
 */
function testUnsplashAPI() {
  Logger.log("=== Unsplash API 테스트 ===");
  
  try {
    const config = getConfig();
    const apiKey = config.UNSPLASH_API_KEY;
    
    if (!apiKey) {
      Logger.log("❌ UNSPLASH_API_KEY 없음");
      return { success: false, error: "No Unsplash API key" };
    }
    
    Logger.log(`🔍 Unsplash 설정: API Key ${apiKey.length}자`);
    
    const result = searchUnsplashImage("modern technology", apiKey);
    
    if (result && result.url) {
      Logger.log(`✅ Unsplash 검색 성공:`);
      Logger.log(`  - URL: ${result.url}`);
      Logger.log(`  - 사진작가: ${result.photographer}`);
      
      return {
        success: true,
        url: result.url,
        photographer: result.photographer,
        source: result.source
      };
    } else {
      Logger.log(`❌ Unsplash 검색 실패`);
      return { success: false, error: "No results from Unsplash" };
    }
    
  } catch (error) {
    Logger.log(`❌ Unsplash API 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 이미지 폴백 시스템 테스트
 */
function testImageFallbackSystem() {
  Logger.log("=== 이미지 폴백 시스템 테스트 ===");
  
  const testQuery = "smartphone review";
  const fallbackOrder = ['Google Images', 'Pexels', 'Unsplash', 'Default'];
  const results = {};
  
  try {
    // findImage 함수로 전체 폴백 체인 테스트
    const finalResult = findImage(testQuery, "Technology", "Basic content");
    
    Logger.log(`✅ 폴백 시스템 테스트 결과:`);
    Logger.log(`  - 최종 이미지 소스: ${finalResult.source}`);
    Logger.log(`  - 최종 URL: ${finalResult.url}`);
    
    // 개별 소스 테스트
    const config = getConfig();
    
    // Google Images 테스트
    if (config.GOOGLE_API_KEY && config.GOOGLE_SEARCH_ENGINE_ID) {
      const googleResult = searchGoogleImages(testQuery, config.GOOGLE_API_KEY, config.GOOGLE_SEARCH_ENGINE_ID);
      results.google = !!googleResult;
    }
    
    // Pexels 테스트
    if (config.PEXELS_API_KEY) {
      const pexelsResult = searchPexelsImageFast(testQuery, config.PEXELS_API_KEY);
      results.pexels = !!pexelsResult;
    }
    
    // Unsplash 테스트
    if (config.UNSPLASH_API_KEY) {
      const unsplashResult = searchUnsplashImage(testQuery, config.UNSPLASH_API_KEY);
      results.unsplash = !!unsplashResult;
    }
    
    Logger.log(`📊 개별 소스 성공률:`);
    Object.entries(results).forEach(([source, success]) => {
      Logger.log(`  - ${source}: ${success ? '✅' : '❌'}`);
    });
    
    return {
      success: true,
      finalSource: finalResult.source,
      finalUrl: finalResult.url,
      sourceResults: results
    };
    
  } catch (error) {
    Logger.log(`❌ 폴백 시스템 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Featured Image 전용 검색 테스트
 */
function testFeaturedImageSearch() {
  Logger.log("=== Featured Image 전용 검색 테스트 ===");
  
  const testCases = [
    { productName: "Sony FX3", title: "Sony FX3 Review" },
    { productName: "iPhone 15 Pro", title: "iPhone 15 Pro Camera Test" },
    { productName: "", title: "General Technology Trends" }
  ];
  
  const results = [];
  
  testCases.forEach((testCase, index) => {
    try {
      Logger.log(`🧪 테스트 케이스 ${index + 1}: ${testCase.productName || 'No product'}`);
      
      const result = findFeaturedImageForProduct(testCase.productName, testCase.title);
      
      if (result && result.url) {
        Logger.log(`  ✅ 성공: ${result.source} - ${result.url.substring(0, 60)}...`);
        results.push({
          case: testCase,
          success: true,
          source: result.source,
          url: result.url
        });
      } else {
        Logger.log(`  ❌ 실패: 이미지 없음`);
        results.push({
          case: testCase,
          success: false,
          error: "No image found"
        });
      }
    } catch (error) {
      Logger.log(`  ❌ 오류: ${error.message}`);
      results.push({
        case: testCase,
        success: false,
        error: error.message
      });
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  Logger.log(`📊 Featured Image 테스트 결과: ${successCount}/${results.length} 성공`);
  
  return {
    success: successCount > 0,
    results: results,
    successRate: Math.round(successCount / results.length * 100)
  };
}

/**
 * 이미지 URL 유효성 검증 테스트
 */
function testImageURLValidation() {
  Logger.log("=== 이미지 URL 유효성 검증 테스트 ===");
  
  const testQuery = "technology gadgets";
  
  try {
    const image = findImage(testQuery, "Technology");
    
    if (!image || !image.url) {
      return { success: false, error: "No image found" };
    }
    
    Logger.log(`🔗 URL 테스트: ${image.url}`);
    
    // URL 접근 테스트
    const response = UrlFetchApp.fetch(image.url, {
      method: 'HEAD',
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    const contentType = response.getHeaders()['Content-Type'] || '';
    const contentLength = response.getHeaders()['Content-Length'] || 0;
    
    Logger.log(`📊 URL 검증 결과:`);
    Logger.log(`  - 상태 코드: ${statusCode}`);
    Logger.log(`  - 콘텐츠 타입: ${contentType}`);
    Logger.log(`  - 파일 크기: ${contentLength} bytes`);
    
    const isValid = statusCode === 200 && contentType.startsWith('image/');
    
    return {
      success: isValid,
      url: image.url,
      statusCode: statusCode,
      contentType: contentType,
      contentLength: contentLength,
      source: image.source
    };
    
  } catch (error) {
    Logger.log(`❌ URL 검증 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 이미지 시스템 통합 테스트
 */
function testImageSystemIntegration() {
  Logger.log("=== 이미지 시스템 통합 테스트 ===");
  
  const results = {
    basic: testImageSearch(),
    google: testGoogleImagesAPI(),
    pexels: testPexelsAPI(),
    unsplash: testUnsplashAPI(),
    fallback: testImageFallbackSystem(),
    featured: testFeaturedImageSearch(),
    validation: testImageURLValidation()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  Logger.log(`=== 이미지 시스템 테스트 결과 ===`);
  Logger.log(`성공률: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${test}: ${result.success ? '성공' : result.error}`);
  });
  
  return results;
}