/**
 * Google Trends 관련 테스트 함수들
 */

/**
 * 기본 트렌드 수집 테스트
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
 * Google Trends RSS 직접 테스트
 */
function testGoogleTrendsRSS() {
  Logger.log("=== Google Trends RSS 직접 테스트 ===");
  
  try {
    const rssUrl = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&hl=en';
    
    const response = UrlFetchApp.fetch(rssUrl, {
      method: "GET",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const content = response.getContentText();
    
    Logger.log(`📡 RSS 응답:`);
    Logger.log(`  - 상태 코드: ${responseCode}`);
    Logger.log(`  - 콘텐츠 길이: ${content.length}자`);
    
    if (responseCode === 200) {
      const trends = parseTrendsRSS(content);
      Logger.log(`  - 파싱된 트렌드: ${trends.length}개`);
      
      trends.slice(0, 3).forEach((trend, i) => {
        Logger.log(`    ${i + 1}. ${trend.topic}`);
      });
      
      return { success: true, trends: trends };
    } else {
      Logger.log(`❌ RSS 요청 실패: ${responseCode}`);
      return { success: false, code: responseCode };
    }
    
  } catch (error) {
    Logger.log(`❌ RSS 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * SerpAPI 폴백 테스트
 */
function testSerpAPIFallback() {
  Logger.log("=== SerpAPI 폴백 테스트 ===");
  
  try {
    const config = getConfig();
    const serpApiKey = config.SERP_API_KEY;
    
    if (!serpApiKey) {
      Logger.log("⚠️ SERP_API_KEY가 설정되지 않음");
      return { success: false, error: "No API key" };
    }
    
    const trends = fetchTrendsFromSerpAPI();
    
    Logger.log(`✅ SerpAPI 결과:`);
    Logger.log(`  - 수집된 주제: ${trends.length}개`);
    
    trends.slice(0, 3).forEach((trend, i) => {
      Logger.log(`    ${i + 1}. ${trend.topic} (${trend.source})`);
    });
    
    return { success: true, trends: trends };
    
  } catch (error) {
    Logger.log(`❌ SerpAPI 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 기본 주제 폴백 테스트
 */
function testDefaultTopicsFallback() {
  Logger.log("=== 기본 주제 폴백 테스트 ===");
  
  try {
    const defaultTopics = getDefaultTopics();
    
    Logger.log(`✅ 기본 주제 목록:`);
    Logger.log(`  - 총 주제 수: ${defaultTopics.length}개`);
    
    defaultTopics.slice(0, 5).forEach((topic, i) => {
      Logger.log(`    ${i + 1}. ${topic.topic}`);
    });
    
    return { success: true, topics: defaultTopics };
    
  } catch (error) {
    Logger.log(`❌ 기본 주제 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 트렌드 → 시트 저장 테스트
 */
function testTrendsToSheet() {
  Logger.log("=== 트렌드 → 시트 저장 테스트 ===");
  
  try {
    const addedCount = addTrendsToSheet();
    
    Logger.log(`✅ 시트 저장 결과:`);
    Logger.log(`  - 추가된 주제 수: ${addedCount}개`);
    
    return { success: true, addedCount: addedCount };
    
  } catch (error) {
    Logger.log(`❌ 시트 저장 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 트렌드 시스템 통합 테스트
 */
function testTrendsSystemIntegration() {
  Logger.log("=== 트렌드 시스템 통합 테스트 ===");
  
  const results = {
    rss: testGoogleTrendsRSS(),
    serpapi: testSerpAPIFallback(), 
    defaults: testDefaultTopicsFallback(),
    collection: testTrendsCollection(),
    saveToSheet: testTrendsToSheet()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  Logger.log(`=== 트렌드 시스템 테스트 결과 ===`);
  Logger.log(`성공률: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    Logger.log(`${status} ${test}: ${result.success ? '성공' : result.error}`);
  });
  
  return results;
}