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
 * 🚀 고급 SEO 최적화 테스트
 */
function testAdvancedSEO() {
  Logger.log("=== 🚀 고급 SEO 최적화 테스트 시작 ===");
  
  const testContent = `
    <h2>Smart Home Technology 2025</h2>
    <p>Smart home technology has revolutionized how we interact with our living spaces. From intelligent thermostats to automated lighting systems, these innovations make our homes more efficient and comfortable.</p>
    
    <h3>Popular Smart Devices</h3>
    <p>The most popular smart devices include Amazon Echo, Google Home, Nest Learning Thermostat, and Philips Hue lighting systems. These products integrate seamlessly with voice assistants.</p>
    
    <h3>Voice Control Features</h3>
    <p>Voice control technology enables hands-free operation of smart devices. Users can adjust temperature, control lighting, and manage security systems using simple voice commands.</p>
  `;
  
  const testTitle = "Complete Guide to Smart Home Technology 2025";
  const testProductNames = "Amazon Echo, Google Home, Nest Thermostat";
  
  try {
    // 1. SEO 메타데이터 생성 테스트
    const seoData = buildSEO(testContent, testTitle, testProductNames);
    
    Logger.log(`📊 SEO 분석 결과:`);
    Logger.log(`  - SEO 제목: ${seoData.seoTitle}`);
    Logger.log(`  - SEO 설명: ${seoData.seoDesc}`);
    Logger.log(`  - URL 슬러그: ${seoData.slug}`);
    Logger.log(`  - 키워드 수: ${seoData.keywords.length}개`);
    Logger.log(`  - 주요 키워드: ${seoData.keywords.slice(0, 3).join(', ')}`);
    Logger.log(`  - 읽기 시간: ${seoData.readingTime}분`);
    Logger.log(`  - SEO 점수: ${seoData.seoScore.total}/100 (${seoData.seoScore.grade}등급)`);
    
    // 2. 키워드 밀도 테스트
    const densityKeys = Object.keys(seoData.keywordDensity);
    const optimalKeywords = densityKeys.filter(key => seoData.keywordDensity[key].optimal);
    Logger.log(`🎯 키워드 밀도 분석:`);
    Logger.log(`  - 총 키워드: ${densityKeys.length}개`);
    Logger.log(`  - 최적 밀도: ${optimalKeywords.length}개`);
    
    // 3. FAQ 섹션 테스트
    Logger.log(`❓ FAQ 섹션: ${seoData.faqSections.length}개 생성`);
    seoData.faqSections.slice(0, 2).forEach((faq, i) => {
      Logger.log(`  ${i+1}. ${faq.question}`);
    });
    
    // 4. Featured Snippets 최적화 테스트
    const enhancedHtml = enhanceForFeaturedSnippets(testContent, seoData.keywords);
    const hasDefinitions = enhancedHtml.includes('definition-section');
    Logger.log(`✨ Featured Snippets 최적화: ${hasDefinitions ? '정의 섹션 추가됨' : '기본 최적화만 적용'}`);
    
    // 5. 구조화된 데이터 테스트
    Logger.log(`🏗️ 구조화된 데이터: ${Object.keys(seoData.structuredData).length}개 필드`);
    Logger.log(`  - Schema Type: ${seoData.structuredData['@type']}`);
    Logger.log(`  - Keywords: ${seoData.structuredData.keywords}`);
    
    return {
      success: true,
      seoScore: seoData.seoScore,
      keywordCount: seoData.keywords.length,
      optimalKeywords: optimalKeywords.length,
      faqCount: seoData.faqSections.length,
      hasStructuredData: !!seoData.structuredData,
      readingTime: seoData.readingTime
    };
    
  } catch (error) {
    Logger.log(`❌ 고급 SEO 테스트 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 🔍 키워드 추출 테스트
 */
function testKeywordExtraction() {
  Logger.log("=== 🔍 키워드 추출 테스트 시작 ===");
  
  const testTexts = [
    "iPhone 15 Pro Max camera review with advanced photography features",
    "MacBook Air M2 performance testing and battery life analysis",
    "Tesla Model 3 electric vehicle charging infrastructure overview"
  ];
  
  try {
    testTexts.forEach((text, index) => {
      const keywords = extractKeywords(`<p>${text}</p>`, 5);
      Logger.log(`📝 텍스트 ${index + 1}: "${text.substring(0, 50)}..."`);
      Logger.log(`  - 추출된 키워드: ${keywords.join(', ')}`);
    });
    
    // 구문 추출 테스트
    const phrases = extractPhrases("iPhone 15 Pro camera system artificial intelligence", 2, 3);
    Logger.log(`🔤 구문 추출 테스트: ${phrases.length}개 구문`);
    phrases.slice(0, 3).forEach(phrase => {
      Logger.log(`  - "${phrase}"`);
    });
    
    // 전문 용어 추출 테스트
    const specialTerms = extractSpecialTerms("Apple iPhone 15 AI ML API SDK");
    Logger.log(`🎯 전문 용어 추출: ${specialTerms.join(', ')}`);
    
    return {
      success: true,
      keywordTests: testTexts.length,
      phraseCount: phrases.length,
      specialTermCount: specialTerms.length
    };
    
  } catch (error) {
    Logger.log(`❌ 키워드 추출 테스트 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 6. 전체 시스템 통합 테스트 (SEO 최적화 포함)
 */
function testFullAutomation() {
  Logger.log("=== 🚀 SEO 최적화 포함 풀 오토메이션 통합 테스트 시작 ===");
  
  const results = {
    trends: testTrendsCollection(),
    ai: testAIGeneration(), 
    wordpress: testWordPressConnection(),
    images: testImageSearch(),
    googleImages: testGoogleImagesAPI(),
    seo: testAdvancedSEO(),
    keywords: testKeywordExtraction()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  Logger.log(`=== 🎯 SEO 최적화 통합 테스트 결과 ===`);
  Logger.log(`성공: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${test}: ${result.success ? '성공' : result.error}`);
    
    // SEO 상세 결과 표시
    if (test === 'seo' && result.success) {
      Logger.log(`    📊 SEO 점수: ${result.seoScore.total}/100 (${result.seoScore.grade}등급)`);
      Logger.log(`    🔍 키워드: ${result.keywordCount}개, 최적화: ${result.optimalKeywords}개`);
      Logger.log(`    ❓ FAQ: ${result.faqCount}개`);
    }
  });
  
  // 시스템 준비도 평가
  const seoReady = results.seo.success;
  const coreReady = results.trends.success && results.ai.success && results.wordpress.success;
  const overallReady = successCount >= Math.ceil(totalTests * 0.7); // 70% 이상 성공
  
  Logger.log(`\n=== 🎯 시스템 준비도 평가 ===`);
  Logger.log(`SEO 최적화: ${seoReady ? '✅ 준비됨' : '❌ 미완료'}`);
  Logger.log(`핵심 기능: ${coreReady ? '✅ 준비됨' : '❌ 미완료'}`);
  Logger.log(`전체 시스템: ${overallReady ? '🚀 배포 준비됨' : '⚠️ 추가 작업 필요'}`);
  
  return results;
}