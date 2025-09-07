/**
 * Google Trends 데이터 수집 서비스
 */

/**
 * Google Trends RSS에서 트렌딩 주제 수집 (관련 주제 포함)
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
    const limitedTrends = trends.slice(0, config.TRENDS_DAILY_LIMIT);
    
    // 각 트렌드에 대해 관련 주제 수집
    const enrichedTrends = limitedTrends.map(trend => {
      const relatedTopics = fetchRelatedTopics(trend.topic);
      return {
        ...trend,
        relatedTopics: relatedTopics
      };
    });
    
    Logger.log(`📈 트렌드 수집 완료: ${enrichedTrends.length}개 주요 주제, 각각 ${enrichedTrends[0]?.relatedTopics?.length || 0}개 관련 주제`);
    
    return enrichedTrends;
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
 * 특정 주제의 관련 토픽 수집 (최소 5개)
 */
function fetchRelatedTopics(mainTopic) {
  try {
    Logger.log(`🔍 관련 주제 수집 중: ${mainTopic}`);
    
    // Google Trends 관련 주제 검색을 위한 다양한 접근법
    const relatedTopics = [];
    
    // 1. 키워드 확장 방식
    const keywordVariations = generateKeywordVariations(mainTopic);
    relatedTopics.push(...keywordVariations);
    
    // 2. Google Trends Related Queries API 시도 (가능한 경우)
    const trendsRelated = fetchTrendsRelatedQueries(mainTopic);
    if (trendsRelated && trendsRelated.length > 0) {
      relatedTopics.push(...trendsRelated);
    }
    
    // 3. SerpAPI Related Searches 폴백
    const serpRelated = fetchSerpAPIRelatedSearches(mainTopic);
    if (serpRelated && serpRelated.length > 0) {
      relatedTopics.push(...serpRelated);
    }
    
    // 중복 제거 및 최소 10개 보장
    const uniqueTopics = [...new Set(relatedTopics)];
    const finalTopics = uniqueTopics.slice(0, Math.max(10, uniqueTopics.length));
    
    // 10개 미만인 경우 스마트 확장
    if (finalTopics.length < 10) {
      const expandedTopics = generateSmartTopicExpansion(mainTopic, 10 - finalTopics.length);
      finalTopics.push(...expandedTopics);
    }
    
    Logger.log(`✅ ${mainTopic}의 관련 주제 ${finalTopics.length}개 수집 완료`);
    return finalTopics.slice(0, 15); // 최대 15개로 제한
    
  } catch (error) {
    Logger.log(`❌ 관련 주제 수집 실패: ${error.message}`);
    // 실패 시 기본 관련 주제 생성
    return generateSmartTopicExpansion(mainTopic, 10);
  }
}

/**
 * 키워드 변형 생성
 */
function generateKeywordVariations(topic) {
  const variations = [];
  const cleanTopic = topic.toLowerCase().trim();
  
  // 다양한 키워드 패턴 생성
  const patterns = [
    `${cleanTopic} trends 2025`,
    `${cleanTopic} latest news`,
    `${cleanTopic} guide`,
    `${cleanTopic} tips`,
    `${cleanTopic} review`,
    `how to ${cleanTopic}`,
    `best ${cleanTopic}`,
    `${cleanTopic} comparison`
  ];
  
  patterns.forEach(pattern => {
    if (pattern.length > 10 && pattern.length < 60) {
      variations.push(pattern);
    }
  });
  
  return variations.slice(0, 3);
}

/**
 * Google Trends Related Queries 시도
 */
function fetchTrendsRelatedQueries(topic) {
  try {
    // Google Trends Related Queries 엔드포인트 시도
    const encodedTopic = encodeURIComponent(topic);
    const relatedUrl = `https://trends.google.com/trends/api/widgetdata/relatedsearches?req=%7B%22restriction%22:%7B%22geo%22:%7B%22country%22:%22US%22%7D,%22time%22:%222024-01-01%202024-12-31%22,%22originalTimeRangeForExploreUrl%22:%222024-01-01%202024-12-31%22,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22BROAD%22,%22value%22:%22${encodedTopic}%22%7D%5D%7D%7D,%22keywordType%22:%22QUERY%22,%22metric%22:%5B%22TOP%22,%22RISING%22%5D,%22trendinessSettings%22:%7B%22compareTime%22:%222023-01-01%202023-12-31%22%7D,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22IZG%22,%22category%22:0%7D,%22language%22:%22en-US%22%7D`;
    
    const response = UrlFetchApp.fetch(relatedUrl, {
      method: "GET",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const responseText = response.getContentText();
      // Google Trends API 응답 파싱 (JSON 형태)
      const relatedTopics = parseTrendsRelatedResponse(responseText);
      return relatedTopics;
    }
    
  } catch (error) {
    Logger.log(`Google Trends Related 요청 실패: ${error.message}`);
  }
  
  return [];
}

/**
 * SerpAPI를 통한 관련 검색어 수집
 */
function fetchSerpAPIRelatedSearches(topic) {
  try {
    const config = getConfig();
    const serpApiKey = config.SERP_API_KEY;
    
    if (!serpApiKey) {
      return [];
    }
    
    const encodedTopic = encodeURIComponent(topic);
    const url = `https://serpapi.com/search.json?engine=google&q=${encodedTopic}&api_key=${serpApiKey}&num=10`;
    
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      const relatedSearches = [];
      
      // Related searches 섹션에서 추출
      if (data.related_searches && Array.isArray(data.related_searches)) {
        data.related_searches.forEach(item => {
          if (item.query && item.query.length > 10) {
            relatedSearches.push(item.query);
          }
        });
      }
      
      // People also ask 섹션에서도 추출
      if (data.people_also_ask && Array.isArray(data.people_also_ask)) {
        data.people_also_ask.forEach(item => {
          if (item.question && item.question.length > 10) {
            relatedSearches.push(item.question);
          }
        });
      }
      
      return relatedSearches.slice(0, 5);
    }
    
  } catch (error) {
    Logger.log(`SerpAPI 관련 검색어 실패: ${error.message}`);
  }
  
  return [];
}

/**
 * 스마트 주제 확장 (AI 기반)
 */
function generateSmartTopicExpansion(mainTopic, count) {
  const expandedTopics = [];
  const topicWords = mainTopic.toLowerCase().split(' ');
  
  // 주제별 관련 키워드 매핑
  const relatedKeywords = {
    'technology': ['innovation', 'digital', 'software', 'hardware', 'tech trends'],
    'health': ['fitness', 'wellness', 'medical', 'lifestyle', 'nutrition'],
    'business': ['market', 'finance', 'investment', 'startup', 'economy'],
    'entertainment': ['movies', 'music', 'gaming', 'streaming', 'celebrity'],
    'sports': ['athlete', 'championship', 'tournament', 'team', 'competition'],
    'science': ['research', 'discovery', 'innovation', 'breakthrough', 'study'],
    'travel': ['destination', 'tourism', 'vacation', 'adventure', 'culture'],
    'food': ['recipe', 'cooking', 'restaurant', 'cuisine', 'nutrition']
  };
  
  // 주요 카테고리 감지 및 관련 키워드 활용
  let categoryKeywords = [];
  for (const [category, keywords] of Object.entries(relatedKeywords)) {
    if (topicWords.some(word => word.includes(category) || keywords.some(k => word.includes(k)))) {
      categoryKeywords = keywords;
      break;
    }
  }
  
  // 확장 주제 생성
  if (categoryKeywords.length > 0) {
    categoryKeywords.slice(0, count).forEach(keyword => {
      expandedTopics.push(`${mainTopic} ${keyword}`);
    });
  } else {
    // 기본 확장 패턴
    const defaultExpansions = ['guide', 'tips', 'trends', 'news', 'review'];
    defaultExpansions.slice(0, count).forEach(expansion => {
      expandedTopics.push(`${mainTopic} ${expansion}`);
    });
  }
  
  return expandedTopics;
}

/**
 * Google Trends 관련 응답 파싱
 */
function parseTrendsRelatedResponse(responseText) {
  try {
    // Google Trends API는 ")]}'" 접두사를 제거해야 함
    const cleanJson = responseText.replace(/^\)\]\}'/, '');
    const data = JSON.parse(cleanJson);
    
    const relatedTopics = [];
    
    if (data.default && data.default.rankedList) {
      data.default.rankedList.forEach(list => {
        if (list.rankedKeyword) {
          list.rankedKeyword.forEach(item => {
            if (item.topic && item.topic.title) {
              relatedTopics.push(item.topic.title);
            }
          });
        }
      });
    }
    
    return relatedTopics.slice(0, 5);
  } catch (error) {
    Logger.log(`Trends 관련 응답 파싱 실패: ${error.message}`);
    return [];
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
    timestamp: new Date(),
    relatedTopics: generateSmartTopicExpansion(topic, 10)
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