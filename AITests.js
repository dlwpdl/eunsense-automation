/**
 * AI 글 생성 관련 테스트 함수들
 */

/**
 * 기본 AI 글 생성 테스트
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
 * 한국어 AI 글 생성 테스트
 */
function testKoreanAIGeneration() {
  Logger.log("=== 한국어 AI 글 생성 테스트 ===");
  
  const testTopic = "최신 스마트폰 기술 트렌드 2025";
  
  try {
    const result = generateHtmlWithLanguage(testTopic, "KO");
    
    Logger.log(`✅ 한국어 AI 글 생성 결과:`);
    Logger.log(`  - 제목: ${result.title}`);
    Logger.log(`  - HTML 길이: ${result.html ? result.html.length : 0}자`);
    Logger.log(`  - 언어 감지: ${/[가-힣]/.test(result.html) ? '한국어' : '영어'}`);
    
    return {
      success: true,
      title: result.title,
      htmlLength: result.html ? result.html.length : 0,
      language: /[가-힣]/.test(result.html) ? 'Korean' : 'English'
    };
  } catch (error) {
    Logger.log(`❌ 한국어 AI 글 생성 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * AI API 연결 테스트
 */
function testAIAPIConnection() {
  Logger.log("=== AI API 연결 테스트 ===");
  
  try {
    const config = getConfig();
    const hasOpenAI = !!(config.OPENAI_API_KEY);
    const hasGemini = !!(config.GEMINI_API_KEY);
    
    Logger.log(`🔍 AI API 설정 확인:`);
    Logger.log(`  - OpenAI API Key: ${hasOpenAI ? '설정됨' : '없음'}`);
    Logger.log(`  - Gemini API Key: ${hasGemini ? '설정됨' : '없음'}`);
    
    if (!hasOpenAI && !hasGemini) {
      return { success: false, error: 'No AI API keys configured' };
    }
    
    // 간단한 테스트 요청
    const testPrompt = "Write a single sentence about technology.";
    const result = generateHtmlWithLanguage(testPrompt, "EN");
    
    Logger.log(`✅ AI API 연결 성공`);
    Logger.log(`  - 테스트 응답 길이: ${result.html ? result.html.length : 0}자`);
    
    return {
      success: true,
      hasOpenAI: hasOpenAI,
      hasGemini: hasGemini,
      responseLength: result.html ? result.html.length : 0
    };
    
  } catch (error) {
    Logger.log(`❌ AI API 연결 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * AI 모델별 성능 비교 테스트
 */
function testAIModelPerformance() {
  Logger.log("=== AI 모델별 성능 비교 테스트 ===");
  
  const testTopic = "Benefits of electric vehicles";
  const results = [];
  
  try {
    const config = getConfig();
    
    // OpenAI 테스트
    if (config.OPENAI_API_KEY) {
      Logger.log("🧠 OpenAI 모델 테스트...");
      const startTime = Date.now();
      
      try {
        // OpenAI 호출 (실제 구현에 따라 조정)
        const result = generateHtmlWithLanguage(testTopic, "EN");
        const duration = Date.now() - startTime;
        
        results.push({
          model: 'OpenAI',
          success: true,
          duration: duration,
          contentLength: result.html ? result.html.length : 0
        });
        
        Logger.log(`  ✅ OpenAI: ${duration}ms, ${result.html.length}자`);
      } catch (error) {
        results.push({
          model: 'OpenAI', 
          success: false,
          error: error.message
        });
        Logger.log(`  ❌ OpenAI 실패: ${error.message}`);
      }
    }
    
    // Gemini 테스트 (설정되어 있다면)
    if (config.GEMINI_API_KEY) {
      Logger.log("🤖 Gemini 모델 테스트...");
      // Gemini 테스트 로직...
    }
    
    Logger.log(`=== AI 모델 성능 비교 결과 ===`);
    results.forEach(result => {
      if (result.success) {
        Logger.log(`${result.model}: ${result.duration}ms, ${result.contentLength}자`);
      } else {
        Logger.log(`${result.model}: 실패 - ${result.error}`);
      }
    });
    
    return { success: true, results: results };
    
  } catch (error) {
    Logger.log(`❌ 모델 성능 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 콘텐츠 품질 검증 테스트
 */
function testContentQuality() {
  Logger.log("=== AI 콘텐츠 품질 검증 테스트 ===");
  
  const testTopic = "Digital marketing strategies for small businesses";
  
  try {
    const result = generateHtmlWithLanguage(testTopic, "EN");
    
    // 품질 지표 계산
    const wordCount = result.html ? result.html.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    const hasTitle = !!(result.title && result.title.length > 0);
    const hasCategories = !!(result.categories && result.categories.length > 0);
    const hasTags = !!(result.tags && result.tags.length > 0);
    const hasStructure = /(<h[1-6].*?>.*?<\/h[1-6]>.*?<p>)/i.test(result.html);
    
    const qualityScore = [
      hasTitle,
      hasCategories, 
      hasTags,
      hasStructure,
      wordCount > 500,
      wordCount < 3000
    ].filter(Boolean).length;
    
    Logger.log(`✅ 콘텐츠 품질 분석:`);
    Logger.log(`  - 단어 수: ${wordCount}개`);
    Logger.log(`  - 제목 존재: ${hasTitle ? 'O' : 'X'}`);
    Logger.log(`  - 카테고리 존재: ${hasCategories ? 'O' : 'X'}`);
    Logger.log(`  - 태그 존재: ${hasTags ? 'O' : 'X'}`);
    Logger.log(`  - 구조화 여부: ${hasStructure ? 'O' : 'X'}`);
    Logger.log(`  - 품질 점수: ${qualityScore}/6 (${Math.round(qualityScore/6*100)}%)`);
    
    return {
      success: true,
      wordCount: wordCount,
      qualityScore: qualityScore,
      qualityPercentage: Math.round(qualityScore/6*100),
      checks: {
        hasTitle, hasCategories, hasTags, hasStructure
      }
    };
    
  } catch (error) {
    Logger.log(`❌ 품질 검증 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 AI 시스템 통합 테스트
 */
function testAISystemIntegration() {
  Logger.log("=== AI 시스템 통합 테스트 ===");
  
  const results = {
    basic: testAIGeneration(),
    korean: testKoreanAIGeneration(),
    connection: testAIAPIConnection(),
    performance: testAIModelPerformance(),
    quality: testContentQuality()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  Logger.log(`=== AI 시스템 테스트 결과 ===`);
  Logger.log(`성공률: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${test}: ${result.success ? '성공' : result.error}`);
  });
  
  return results;
}