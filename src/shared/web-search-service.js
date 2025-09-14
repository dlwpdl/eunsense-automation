/**
 * 웹 검색 서비스 - 실시간 데이터로 AI 프롬프트 강화
 */

/**
 * 토픽에 대한 최신 웹 검색 결과를 가져와서 AI 프롬프트에 포함할 데이터 생성
 * @param {string} topic - 검색할 토픽
 * @param {string} language - 언어 (KO/EN)
 * @returns {string} - AI 프롬프트에 추가할 웹 검색 데이터
 */
function getWebSearchDataForPrompt(topic, language = "EN") {
  try {
    const config = getConfig();
    
    // SerpAPI 키가 없으면 웹 검색 스킵
    if (!config.SERP_API_KEY) {
      Logger.log("⚠️ SERP_API_KEY 없음 → 웹 검색 데이터 없이 진행");
      return "";
    }
    
    Logger.log(`🔍 웹 검색 시작: "${topic}" (언어: ${language})`);
    
    // 검색 쿼리 최적화
    const searchQuery = optimizeSearchQuery(topic, language);
    Logger.log(`🎯 최적화된 검색어: "${searchQuery}"`);
    
    // 웹 검색 실행
    const searchResults = performSerpAPISearch(searchQuery, language, config.SERP_API_KEY);
    
    if (!searchResults || searchResults.length === 0) {
      Logger.log("❌ 웹 검색 결과 없음");
      return "";
    }
    
    Logger.log(`✅ ${searchResults.length}개 검색 결과 수집 완료`);
    
    // AI 프롬프트용 데이터로 변환
    const webSearchData = formatSearchDataForAI(searchResults, topic, language);
    
    Logger.log(`📝 웹 검색 데이터 길이: ${webSearchData.length}자`);
    return webSearchData;
    
  } catch (error) {
    Logger.log(`❌ 웹 검색 실패: ${error.message}`);
    return ""; // 에러 시에도 글 작성은 계속 진행
  }
}

/**
 * 토픽을 검색 최적화된 쿼리로 변환
 */
function optimizeSearchQuery(topic, language) {
  // 한국어 토픽인 경우
  if (language === "KO") {
    return `${topic} 2025 최신 정보`;
  }
  
  // 영어 토픽인 경우
  return `${topic} 2025 latest information trends`;
}

/**
 * SerpAPI로 실제 웹 검색 수행
 */
function performSerpAPISearch(query, language, apiKey) {
  try {
    const countryCode = language === "KO" ? "kr" : "us";
    const languageCode = language === "KO" ? "ko" : "en";
    
    const url = `https://serpapi.com/search` +
      `?api_key=${apiKey}` +
      `&engine=google` +
      `&q=${encodeURIComponent(query)}` +
      `&gl=${countryCode}` +
      `&hl=${languageCode}` +
      `&num=5`; // 상위 5개 결과만
    
    Logger.log(`🌐 SerpAPI 호출: ${countryCode.toUpperCase()} 검색`);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ SerpAPI 에러 (${response.getResponseCode()}): ${response.getContentText()}`);
      return [];
    }
    
    const data = JSON.parse(response.getContentText());
    
    if (!data.organic_results || data.organic_results.length === 0) {
      Logger.log("❌ 검색 결과 없음");
      return [];
    }
    
    Logger.log(`✅ SerpAPI 응답: ${data.organic_results.length}개 결과`);
    return data.organic_results.slice(0, 5); // 상위 5개만 사용
    
  } catch (error) {
    Logger.log(`❌ SerpAPI 호출 실패: ${error.message}`);
    return [];
  }
}

/**
 * 검색 결과를 AI 프롬프트용 형태로 포맷
 */
function formatSearchDataForAI(searchResults, topic, language) {
  const isKorean = language === "KO";
  
  const header = isKorean ? 
    `\n🔍 "${topic}"에 대한 최신 웹 검색 정보 (2025년):\n` :
    `\n🔍 Latest web search information about "${topic}" (2025):\n`;
  
  let formattedData = header;
  
  searchResults.forEach((result, index) => {
    const snippet = result.snippet || "";
    const title = result.title || "";
    const source = result.displayed_link || result.link || "";
    
    formattedData += `\n${index + 1}. **${title}**\n`;
    formattedData += `   출처: ${source}\n`;
    formattedData += `   내용: ${snippet}\n`;
  });
  
  const instruction = isKorean ?
    `\n⚡ 중요: 위의 최신 웹 검색 정보를 반드시 참고하여 정확하고 신뢰할 수 있는 내용으로 글을 작성하세요. 상상이나 추측으로 쓰지 말고, 검색된 실제 정보를 기반으로 작성하세요.\n` :
    `\n⚡ Important: Please use the above latest web search information to write accurate and reliable content. Don't write based on imagination or speculation, but use the actual searched information.\n`;
  
  formattedData += instruction;
  
  return formattedData;
}

/**
 * 웹 검색 기능 테스트
 */
function testWebSearchService() {
  Logger.log("=== 🔍 웹 검색 서비스 테스트 ===");
  
  const testTopic = "AI 코딩 도구 비교";
  const webSearchData = getWebSearchDataForPrompt(testTopic, "KO");
  
  if (webSearchData) {
    Logger.log("✅ 웹 검색 성공!");
    Logger.log("📋 생성된 데이터:");
    Logger.log(webSearchData);
  } else {
    Logger.log("❌ 웹 검색 실패 또는 데이터 없음");
  }
}

/**
 * SerpAPI 키 설정 도우미
 */
function setupSerpAPI() {
  Logger.log("=== 🔑 SerpAPI 설정 가이드 ===");
  Logger.log("1. https://serpapi.com 접속");
  Logger.log("2. 계정 생성 (월 100회 무료)");
  Logger.log("3. API 키 복사");
  Logger.log("4. Script Properties에 다음 설정:");
  Logger.log("   키: SERP_API_KEY");
  Logger.log("   값: your_serpapi_key_here");
  Logger.log("5. testWebSearchService() 함수로 테스트");
  Logger.log("");
  Logger.log("💡 무료 플랜: 월 100회 검색");
  Logger.log("💰 유료 플랜: 월 $75부터 (5000회 검색)");
}