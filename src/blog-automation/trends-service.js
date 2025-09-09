/**
 * 관심사 기반 토픽 발굴 서비스 (SEO 개선)
 * 일일 트렌드 대신, 블로그의 핵심 주제와 관련된 잠재력 있는 토픽을 능동적으로 찾아냅니다.
 */

/**
 * 실시간 Google Trends + 씨앗 키워드 조합으로 토픽을 발굴합니다.
 * @returns {Array<Object>} A list of AI-curated and scored topic objects.
 */
function discoverNicheTopics() {
  const config = getConfig();
  const serpApiKey = config.SERP_API_KEY;

  if (!serpApiKey) {
    Logger.log("⚠️ SERP_API_KEY가 설정되지 않았습니다. 토픽 발굴을 건너뜁니다.");
    return [];
  }

  Logger.log(`🔥 실시간 Google Trends + 니치 키워드 융합 토픽 발굴 시작`);

  let allDiscoveredTopics = [];
  const serpResultsByKeyword = {};

  // 1. 실시간 트렌딩 토픽 수집 및 필터링
  const trendingTopics = fetchRealTimeTrends(serpApiKey);
  if (trendingTopics && trendingTopics.length > 0) {
    Logger.log(`📈 실시간 트렌드 ${trendingTopics.length}개 발굴`);
    
    // 블로그 니치에 맞는 트렌드만 필터링
    const nicheKeywords = config.BLOG_NICHE_KEYWORDS || [];
    const filteredTrends = filterTrendsByNiche(trendingTopics, nicheKeywords);
    
    Logger.log(`🎯 니치 필터링 결과: ${filteredTrends.length}개 선택됨`);
    allDiscoveredTopics.push(...filteredTrends);
  }

  // 2. 니치별 관련 검색어 수집 (기존 로직 유지)
  if (nicheKeywords && nicheKeywords.length > 0) {
    Logger.log(`🎯 니치 키워드 확장 검색: [${nicheKeywords.join(', ')}]`);
    
    nicheKeywords.forEach(keyword => {
      const serpData = fetchTopicsFromSerpApi(keyword, serpApiKey);
      if (serpData) {
        serpResultsByKeyword[keyword] = serpData.organic_results || [];
        const topics = extractTopicsFromSerpData(serpData);
        allDiscoveredTopics.push(...topics);
      }
    });
  }

  const uniqueTopics = allDiscoveredTopics.filter((item, index, self) =>
    index === self.findIndex((t) => t.topic === item.topic)
  );

  Logger.log(`✅ 총 ${uniqueTopics.length}개의 토픽 발굴 (트렌드 + 니치 융합)`);

  if (uniqueTopics.length === 0) return [];

  const analysisResult = analyzeTopicsWithAI(uniqueTopics);

  if (!analysisResult || !analysisResult.clusters || analysisResult.clusters.length === 0) {
    Logger.log("⚠️ AI 토픽 분석 실패. 원본 토픽을 그대로 사용합니다.");
    return [];
  }

  const finalTopics = analysisResult.clusters.map(cluster => {
    const primaryKeyword = cluster.keywords[0] || cluster.representative_title;
    const organicResults = serpResultsByKeyword[findParentSeed(primaryKeyword, nicheKeywords || [])] || [];
    const opportunityScore = calculateOpportunityScore(organicResults);
    
    Logger.log(`✨ AI 추천 토픽: "${cluster.representative_title}" (기회 점수: ${opportunityScore})`);
    Logger.log(`  소스: ${cluster.source || '트렌드+니치 융합'}`);
    Logger.log(`  카테고리: ${cluster.suggested_category || cluster.cluster_name}`);
    Logger.log(`  제품명: ${(cluster.product_names || []).join(', ') || '없음'}`);
    
    return {
      topic: cluster.representative_title,
      source: cluster.source || 'trends_niche_fusion',
      cluster_name: cluster.cluster_name,
      user_intent: cluster.user_intent,
      suggested_category: cluster.suggested_category,
      keywords: cluster.keywords,
      product_names: cluster.product_names || [],
      opportunity_score: opportunityScore
    };
  });
  
  return finalTopics;
}

/**
 * 트렌딩 토픽을 블로그 니치에 맞게 필터링합니다.
 */
function filterTrendsByNiche(trendingTopics, nicheKeywords) {
  if (!nicheKeywords || nicheKeywords.length === 0) {
    Logger.log(`📝 니치 키워드 없음 - 기본 기술 관련 트렌드만 필터링`);
    return filterTechRelatedTrends(trendingTopics);
  }

  const filteredTopics = [];
  const nichePatterns = nicheKeywords.map(keyword => keyword.toLowerCase());

  trendingTopics.forEach(topic => {
    const topicLower = topic.topic.toLowerCase();
    
    // 직접 매칭
    const directMatch = nichePatterns.some(pattern => 
      topicLower.includes(pattern) || pattern.includes(topicLower)
    );

    if (directMatch) {
      Logger.log(`✅ 직접 매칭: "${topic.topic}" (${topic.source})`);
      filteredTopics.push({ ...topic, match_type: 'direct' });
      return;
    }

    // 관련 키워드 매칭 (확장 검색)
    const relatedMatch = checkRelatedKeywords(topicLower, nichePatterns);
    if (relatedMatch) {
      Logger.log(`🔗 관련 매칭: "${topic.topic}" → ${relatedMatch}`);
      filteredTopics.push({ ...topic, match_type: 'related', related_to: relatedMatch });
    }
  });

  // 매칭되지 않은 경우 기술 관련 기본 필터 적용
  if (filteredTopics.length === 0) {
    Logger.log(`⚠️ 니치 매칭 실패 - 기술 관련 기본 필터 적용`);
    return filterTechRelatedTrends(trendingTopics).slice(0, 5);
  }

  return filteredTopics;
}

/**
 * 기본 기술 관련 트렌드 필터링
 */
function filterTechRelatedTrends(trendingTopics) {
  const techKeywords = [
    'tech', 'technology', 'ai', 'artificial intelligence', 'machine learning', 'ml',
    'software', 'app', 'mobile', 'web', 'digital', 'online', 'internet',
    'computer', 'laptop', 'phone', 'smartphone', 'device', 'gadget',
    'gaming', 'game', 'streaming', 'social media', 'platform',
    'startup', 'innovation', 'cybersecurity', 'blockchain', 'crypto',
    'programming', 'coding', 'developer', 'framework', 'database'
  ];

  return trendingTopics.filter(topic => {
    const topicLower = topic.topic.toLowerCase();
    return techKeywords.some(keyword => topicLower.includes(keyword));
  });
}

/**
 * 관련 키워드 매칭 확인
 */
function checkRelatedKeywords(topicLower, nichePatterns) {
  // 키워드별 확장 매칭 규칙
  const expansionRules = {
    'gear': ['equipment', 'tool', 'device', 'hardware', 'accessory', 'review'],
    'tech': ['technology', 'digital', 'software', 'app', 'platform', 'innovation'],
    'ai': ['artificial intelligence', 'machine learning', 'automation', 'robot', 'smart'],
    'crypto': ['bitcoin', 'ethereum', 'blockchain', 'nft', 'defi', 'web3'],
    'gaming': ['game', 'esports', 'streaming', 'console', 'pc gaming', 'mobile gaming'],
    'productivity': ['workflow', 'efficiency', 'tool', 'app', 'automation', 'remote work'],
    'filmmaking': ['video', 'camera', 'editing', 'film', 'cinema', 'director', 'production'],
    'pentest': ['security', 'hacking', 'cybersecurity', 'vulnerability', 'penetration testing', 'ethical hacking']
  };

  for (const pattern of nichePatterns) {
    if (expansionRules[pattern]) {
      const expandedKeywords = expansionRules[pattern];
      if (expandedKeywords.some(keyword => topicLower.includes(keyword))) {
        return pattern;
      }
    }
  }

  return null;
}

/**
 * SerpApi를 사용하여 실시간 Google Trends 데이터를 가져옵니다.
 */
function fetchRealTimeTrends(apiKey) {
  const cacheKey = 'realtime_google_trends';
  const cacheDuration = 3600; // 1시간 캐시 (트렌드는 빠르게 변함)

  return withCache(cacheKey, cacheDuration, () => {
    try {
      // SerpApi Google Trends Daily Trends (실제 트렌딩 토픽)
      const url = `https://serpapi.com/search.json?engine=google_trends&data_type=DAILY_TRENDS&geo=US&api_key=${apiKey}`;
      
      Logger.log(`📈 Google Daily Trends 데이터 요청 중...`);
      const response = UrlFetchApp.fetch(url, { method: "GET", muteHttpExceptions: true });

      if (response.getResponseCode() !== 200) {
        Logger.log(`❌ Google Trends Daily API 요청 실패: ${response.getContentText()}`);
        Logger.log(`🔄 대안 방법으로 트렌드 토픽 수집 시도 중...`);
        
        // 대안 1: Rising searches 시도
        return tryAlternativeTrendsApproach(apiKey) || getFallbackTrendingTopics();
      }

      const trendsData = JSON.parse(response.getContentText());
      Logger.log(`✅ Google Daily Trends 데이터 수집 성공`);
      Logger.log(`📊 응답 구조: ${Object.keys(trendsData).join(', ')}`);

      return extractDailyTrendingTopics(trendsData);

    } catch (error) {
      Logger.log(`❌ Google Trends 처리 중 오류: ${error.message}`);
      return getFallbackTrendingTopics();
    }
  });
}

/**
 * 대안 트렌드 수집 방법 (Rising searches)
 */
function tryAlternativeTrendsApproach(apiKey) {
  try {
    // 현재 인기있는 기술 관련 검색어들로 rising searches 확인
    const techKeywords = ['AI', 'ChatGPT', 'iPhone', 'Android', 'Tesla', 'Apple'];
    const risingTopics = [];

    for (const keyword of techKeywords) {
      const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(keyword)}&data_type=RELATED_QUERIES&geo=US&api_key=${apiKey}`;
      
      try {
        const response = UrlFetchApp.fetch(url, { method: "GET", muteHttpExceptions: true });
        if (response.getResponseCode() === 200) {
          const data = JSON.parse(response.getContentText());
          if (data.related_queries && data.related_queries.rising) {
            data.related_queries.rising.forEach(item => {
              if (item.query) {
                risingTopics.push({
                  topic: item.query,
                  source: 'google_trends_rising',
                  trending_score: parseInt(item.value) || 80
                });
              }
            });
          }
        }
      } catch (err) {
        Logger.log(`⚠️ ${keyword} rising searches 실패: ${err.message}`);
      }
      
      // API 호출 제한 방지
      Utilities.sleep(500);
    }

    if (risingTopics.length > 0) {
      Logger.log(`✅ 대안 방법으로 ${risingTopics.length}개 트렌딩 토픽 수집`);
      return risingTopics.slice(0, 12);
    }

    return null;
  } catch (error) {
    Logger.log(`❌ 대안 트렌드 수집 실패: ${error.message}`);
    return null;
  }
}

/**
 * Google Trends API 실패시 대안 트렌딩 토픽
 */
function getFallbackTrendingTopics() {
  Logger.log(`🔄 대안 트렌딩 토픽 사용`);
  
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMonth = currentDate.getMonth();
  
  // 시간대별, 계절별 트렌딩 토픽 (동적으로 변화)
  const trendingByTime = {
    morning: ['productivity apps', 'morning routines', 'coffee brewing', 'fitness trackers'],
    afternoon: ['remote work tools', 'project management', 'video conferencing', 'team collaboration'],
    evening: ['streaming services', 'entertainment apps', 'gaming gear', 'smart home devices']
  };
  
  const trendingBySeason = {
    winter: ['CES tech news', 'indoor entertainment', 'productivity tools', 'learning platforms'],
    spring: ['outdoor tech', 'photography gear', 'travel apps', 'fitness technology'],
    summer: ['portable tech', 'vacation apps', 'outdoor cameras', 'travel gadgets'],
    fall: ['back to school tech', 'new device launches', 'productivity software', 'study tools']
  };
  
  let timeBasedTopics = [];
  if (currentHour < 12) timeBasedTopics = trendingByTime.morning;
  else if (currentHour < 18) timeBasedTopics = trendingByTime.afternoon;
  else timeBasedTopics = trendingByTime.evening;
  
  let seasonBasedTopics = [];
  if (currentMonth >= 11 || currentMonth <= 1) seasonBasedTopics = trendingBySeason.winter;
  else if (currentMonth >= 2 && currentMonth <= 4) seasonBasedTopics = trendingBySeason.spring;
  else if (currentMonth >= 5 && currentMonth <= 7) seasonBasedTopics = trendingBySeason.summer;
  else seasonBasedTopics = trendingBySeason.fall;
  
  const allFallbackTopics = [...timeBasedTopics, ...seasonBasedTopics];
  
  return allFallbackTopics.map(topic => ({
    topic: topic,
    source: 'fallback_trending',
    trending_score: Math.floor(Math.random() * 30) + 70 // 70-100 스코어
  }));
}

/**
 * Google Daily Trends API 응답에서 트렌딩 토픽 추출
 */
function extractDailyTrendingTopics(trendsData) {
  const topics = [];
  
  if (trendsData.trending_stories && Array.isArray(trendsData.trending_stories)) {
    trendsData.trending_stories.forEach(story => {
      if (story.title) {
        topics.push({
          topic: story.title,
          source: 'google_daily_trends',
          trending_score: story.articles ? Math.min(100, story.articles.length * 10) : 75,
          description: story.snippet || ''
        });
      }
      
      // 관련 쿼리들도 추가
      if (story.related_queries && Array.isArray(story.related_queries)) {
        story.related_queries.forEach(query => {
          if (query.query) {
            topics.push({
              topic: query.query,
              source: 'google_daily_trends_related',
              trending_score: 70
            });
          }
        });
      }
    });
  }
  
  if (trendsData.trending_searches && Array.isArray(trendsData.trending_searches)) {
    trendsData.trending_searches.forEach(search => {
      if (search.query) {
        topics.push({
          topic: search.query,
          source: 'google_trending_searches',
          trending_score: parseInt(search.search_volume) || 80
        });
      }
    });
  }
  
  return topics.slice(0, 20); // 상위 20개만 선택
}

/**
 * Google Trends API 응답에서 트렌딩 토픽 추출 (일반)
 */
function extractTrendingTopics(trendsData) {
  const topics = [];
  
  if (trendsData.related_queries && Array.isArray(trendsData.related_queries)) {
    trendsData.related_queries.forEach(query => {
      if (query.query && query.value) {
        topics.push({
          topic: query.query,
          source: 'google_trends_realtime',
          trending_score: parseInt(query.value) || 50
        });
      }
    });
  }
  
  if (trendsData.rising_searches && Array.isArray(trendsData.rising_searches)) {
    trendsData.rising_searches.forEach(search => {
      if (search.query) {
        topics.push({
          topic: search.query,
          source: 'google_trends_rising',
          trending_score: 85 // Rising searches get high score
        });
      }
    });
  }
  
  return topics.slice(0, 15); // 상위 15개만 선택
}

/**
 * SerpApi를 사용하여 특정 키워드에 대한 전체 SERP 데이터를 가져옵니다.
 */
function fetchTopicsFromSerpApi(keyword, apiKey) {
  const cacheKey = `serp_data_${keyword.replace(/\s/g, '_')}`;
  const cacheDuration = 86400; // 24시간

  return withCache(cacheKey, cacheDuration, () => {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const url = `https://serpapi.com/search.json?engine=google&q=${encodedKeyword}&gl=us&hl=en&api_key=${apiKey}`;
      const response = UrlFetchApp.fetch(url, { method: "GET", muteHttpExceptions: true });

      if (response.getResponseCode() !== 200) {
        Logger.log(`❌ SerpAPI 요청 실패 (${keyword}): ${response.getContentText()}`);
        return null;
      }
      Logger.log(`👍 [${keyword}]에 대한 SERP 데이터 수집 성공 (API 호출).`);
      return JSON.parse(response.getContentText());
    } catch (error) {
      Logger.log(`❌ SerpAPI 처리 중 오류 (${keyword}): ${error.message}`);
      return null;
    }
  });
}

/**
 * SERP 데이터에서 토픽 목록을 추출합니다.
 */
function extractTopicsFromSerpData(data) {
  const discoveredTopics = [];
  if (data.related_searches && Array.isArray(data.related_searches)) {
    data.related_searches.forEach(item => {
      if (item.query) discoveredTopics.push({ topic: item.query, source: 'related_searches' });
    });
  }
  if (data.people_also_ask && Array.isArray(data.people_also_ask)) {
    data.people_also_ask.forEach(item => {
      if (item.question) discoveredTopics.push({ topic: item.question, source: 'people_also_ask' });
    });
  }
  return discoveredTopics;
}

/**
 * 특정 키워드가 어떤 씨앗 키워드에서 파생되었는지 찾습니다.
 */
function findParentSeed(keyword, seedKeywords) {
    // 간단한 포함 관계로 부모 씨앗을 찾음 (개선 가능)
    return seedKeywords.find(seed => keyword.toLowerCase().includes(seed.toLowerCase())) || seedKeywords[0];
}

/**
 * 검색 결과을 분석하여 기회 점수를 계산합니다.
 */
function calculateOpportunityScore(organicResults) {
  if (!organicResults || organicResults.length === 0) return 50; // 정보가 없으면 중간 점수

  let score = 50;
  const authorityDomains = ['wikipedia.org', 'forbes.com', 'nytimes.com', 'theverge.com', 'techcrunch.com', 'wired.com'];
  const forumDomains = ['reddit.com', 'quora.com', 'stackoverflow.com'];

  organicResults.slice(0, 10).forEach(result => {
    const domain = result.link.split('/')[2];
    if (forumDomains.some(d => domain.includes(d))) {
      score += 5; // 포럼/Q&A 사이트는 기회
    }
    if (authorityDomains.some(d => domain.includes(d))) {
      score -= 5; // 대형 권위 사이트는 경쟁이 치열
    }
    if (result.type === 'video') {
      score += 2; // 비디오 결과는 텍스트 콘텐츠에 기회
    }
  });

  return Math.max(0, Math.min(100, score)); // 0-100점 사이로 정규화
}