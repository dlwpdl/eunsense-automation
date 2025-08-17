/**
 * Google Trends 데이터 수집 서비스
 */

/**
 * Google Trends RSS에서 트렌딩 주제 수집
 */
function fetchTrendingTopics() {
  const config = getConfig();
  const region = config.TRENDS_REGION;
  const category = config.TRENDS_CATEGORY;
  
  try {
    // Google Trends RSS 피드 사용 (영어 트렌드)
    const rssUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&hl=en`;
    const response = UrlFetchApp.fetch(rssUrl, {
      method: "GET",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error("Google Trends RSS 요청 실패: " + response.getResponseCode());
    }
    
    const xmlData = response.getContentText();
    const trends = parseTrendsRSS(xmlData);
    
    return trends.slice(0, config.TRENDS_DAILY_LIMIT);
  } catch (error) {
    Logger.log("Trends 가져오기 실패, SerpAPI 폴백 시도: " + error);
    return fetchTrendsFromSerpAPI();
  }
}

/**
 * RSS XML 파싱
 */
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

/**
 * SerpAPI를 통한 트렌드 수집 (폴백)
 */
function fetchTrendsFromSerpAPI() {
  const config = getConfig();
  const serpApiKey = config.SERP_API_KEY;
  
  if (!serpApiKey) {
    Logger.log("SERP_API_KEY가 설정되지 않았습니다. 기본 주제를 사용합니다.");
    return getDefaultTopics();
  }
  
  try {
    const url = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=US&hl=en&api_key=${serpApiKey}`;
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
    
    return trends.slice(0, config.TRENDS_DAILY_LIMIT);
  } catch (error) {
    Logger.log("SerpAPI 실패, 기본 주제 사용: " + error);
    return getDefaultTopics();
  }
}

/**
 * 기본 주제 목록 (최종 폴백) - 영어 주제들
 */
function getDefaultTopics() {
  const defaultTopics = [
    "artificial intelligence latest trends",
    "blockchain technology development",
    "smartphone new product reviews",
    "online shopping tips",
    "healthy lifestyle habits",
    "remote work productivity",
    "investment strategy guide",
    "travel destination recommendations",
    "cooking recipe collections",
    "digital marketing strategies"
  ];
  
  return defaultTopics.map(topic => ({
    topic,
    source: "default",
    timestamp: new Date()
  }));
}

/**
 * Google Trends 주제를 시트에 자동 추가
 */
function addTrendsToSheet() {
  const config = validateConfig();
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss) {
    throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  }
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) {
    throw new Error(`시트 "${config.SHEET_NAME}" 를 찾을 수 없습니다.`);
  }
  
  // 트렌딩 주제 가져오기
  const trends = fetchTrendingTopics();
  
  if (!trends || trends.length === 0) {
    Logger.log("가져올 트렌딩 주제가 없습니다.");
    return 0;
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