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

  // 완전 자동화: 실시간 Google Trends만 사용 (니치 키워드 불필요)
  const trendingTopics = fetchRealTimeTrends(serpApiKey);
  if (trendingTopics && trendingTopics.length > 0) {
    Logger.log(`📈 실시간 Google Trends ${trendingTopics.length}개 발굴 - 완전 자동화 모드`);
    Logger.log(`🔥 수집된 트렌드: ${trendingTopics.map(t => t.topic).join(', ')}`);
    
    // 니치 필터링 없이 모든 실시간 트렌드 사용
    allDiscoveredTopics.push(...trendingTopics);
    Logger.log(`✅ ${trendingTopics.length}개 트렌드 토픽을 AI 분석으로 전달`);
  } else {
    Logger.log(`⚠️ 실시간 트렌드 수집 실패 - 빈 배열로 계속 진행`);
  }

  // 중복 토픽 제거 (현재 세션 내)
  const uniqueTopics = allDiscoveredTopics.filter((item, index, self) =>
    index === self.findIndex((t) => t.topic === item.topic)
  );

  // 기존에 발행된 토픽과 중복 체크 (Google Sheets 기반)
  const duplicateFilteredTopics = removeDuplicateTopics(uniqueTopics);
  Logger.log(`🔄 중복 필터링: ${uniqueTopics.length}개 → ${duplicateFilteredTopics.length}개 (중복 ${uniqueTopics.length - duplicateFilteredTopics.length}개 제거)`);

  // 최신성 검증 - 현재 날짜 기준으로 유효한 토픽만 필터링
  const filteredTopics = filterByFreshness(duplicateFilteredTopics);
  Logger.log(`🗓️ 최신성 필터링: ${duplicateFilteredTopics.length}개 → ${filteredTopics.length}개 (구데이터 ${duplicateFilteredTopics.length - filteredTopics.length}개 제거)`);

  Logger.log(`✅ 총 ${filteredTopics.length}개의 고유 토픽 발굴 (중복 제거 완료)`);

  if (filteredTopics.length === 0) return [];

  const analysisResult = analyzeTopicsWithAI(filteredTopics);

  if (!analysisResult || !analysisResult.clusters || analysisResult.clusters.length === 0) {
    Logger.log("⚠️ AI 토픽 분석 실패. 원본 토픽을 그대로 사용합니다.");
    return [];
  }

  const finalTopics = analysisResult.clusters.map(cluster => {
    const primaryKeyword = cluster.keywords[0] || cluster.representative_title;
    // 완전 자동화 모드에서는 기회 점수를 기본값으로 설정
    const opportunityScore = 75; // 중간 수준의 기본 점수
    
    Logger.log(`✨ AI 추천 토픽: "${cluster.representative_title}" (기회 점수: ${opportunityScore})`);
    Logger.log(`  소스: 실시간 Google Trends`);
    Logger.log(`  카테고리: ${cluster.suggested_category || cluster.cluster_name}`);
    Logger.log(`  제품명: ${(cluster.product_names || []).join(', ') || '없음'}`);
    
    return {
      topic: cluster.representative_title,
      source: 'google_trends_realtime',
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
  const cacheKey = 'sustained_google_trends';
  const cacheDuration = 7200; // 2시간 캐시 (지속성 트렌드는 덜 변함)

  return withCache(cacheKey, cacheDuration, () => {
    try {
      Logger.log(`📈 지속성 트렌드 수집 중 (7일~1개월 지속 키워드)...`);
      
      // 1개월 시간 범위로 지속성 있는 트렌드 수집
      const sustainedTopics = fetchSustainedTrends(apiKey, '1month');
      if (sustainedTopics && sustainedTopics.length > 0) {
        Logger.log(`✅ 지속성 트렌드 ${sustainedTopics.length}개 수집 (1개월 범위)`);
        return sustainedTopics;
      }
      
      // 1개월 실패시 2주 범위로 시도
      const twoWeekTopics = fetchSustainedTrends(apiKey, '2weeks');
      if (twoWeekTopics && twoWeekTopics.length > 0) {
        Logger.log(`✅ 지속성 트렌드 ${twoWeekTopics.length}개 수집 (2주 범위)`);
        return twoWeekTopics;
      }

      // 백업: Rising searches 방법 (최소 7일 지속 필터링)
      Logger.log(`🔄 백업 방법: Rising searches 사용...`);
      const risingTopics = tryAlternativeTrendsApproach(apiKey);
      if (risingTopics && risingTopics.length > 0) {
        Logger.log(`✅ Rising searches로 ${risingTopics.length}개 수집 (7일+ 필터링 적용)`);
        return risingTopics;
      }

      // 모든 방법 실패시 빈 배열 반환 (하드코딩 금지)
      Logger.log(`❌ 모든 트렌드 수집 방법 실패 - 하드코딩 사용 안함`);
      return [];

    } catch (error) {
      Logger.log(`❌ Google Trends 처리 중 오류: ${error.message}`);
      return [];
    }
  });
}

/**
 * 지속성 있는 트렌드를 시간 범위별로 수집합니다.
 * @param {string} apiKey - SerpAPI 키
 * @param {string} timeRange - '1month', '2weeks', '1week'
 */
function fetchSustainedTrends(apiKey, timeRange) {
  try {
    Logger.log(`🚀 완전 동적 트렌드 수집 시작 - 카테고리 하드코딩 제거`);
    
    const dateInfo = getCurrentDateInfo();
    let dateParam = '';
    let logDescription = '';
    
    switch (timeRange) {
      case '1month':
        const startDate1M = new Date(dateInfo.timestamp - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        dateParam = `date=${startDate1M} ${dateInfo.dateString}`;
        logDescription = '1개월 동적';
        break;
      case '2weeks':
        const startDate2W = new Date(dateInfo.timestamp - (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        dateParam = `date=${startDate2W} ${dateInfo.dateString}`;
        logDescription = '2주 동적';
        break;
      default:
        dateParam = `date=${dateInfo.dateString} ${dateInfo.dateString}`;
        logDescription = '현재 동적';
    }
    
    Logger.log(`📅 ${logDescription} 트렌드 수집 (${dateParam})`);
    
    // 완전 동적: Google Trends Trending Now API 직접 사용
    const trendingNowUrl = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=US&frequency=daily&api_key=${apiKey}`;
    
    Logger.log(`🔥 순수 Google Trends Trending Now 호출 중...`);
    
    try {
      const response = UrlFetchApp.fetch(trendingNowUrl, {
        method: "GET",
        muteHttpExceptions: true,
        timeout: 8000
      });
      
      const statusCode = response.getResponseCode();
      Logger.log(`📊 Trending Now 응답 코드: ${statusCode}`);
      
      if (statusCode === 200) {
        const data = JSON.parse(response.getContentText());
        
        if (data.trending_searches && data.trending_searches.length > 0) {
          const dynamicTrends = data.trending_searches
            .slice(0, 15) // 상위 15개
            .map((trend, index) => ({
              topic: trend.query || trend.title || trend,
              source: `google_trends_${timeRange}_dynamic`,
              search_volume: 100 - (index * 5), // 순서대로 점수 부여
              trending_rank: index + 1
            }));
          
          Logger.log(`✅ 완전 동적 트렌드 ${dynamicTrends.length}개 수집 완료`);
          Logger.log(`🎯 수집된 동적 토픽: ${dynamicTrends.slice(0, 5).map(t => t.topic).join(', ')}...`);
          
          return dynamicTrends;
        }
      } else if (statusCode === 503 || statusCode === 429) {
        Logger.log(`❌ Trending Now API 서비스 불가 (${statusCode})`);
      }
      
    } catch (error) {
      Logger.log(`❌ Trending Now API 오류: ${error.message}`);
    }
    
  } catch (error) {
    Logger.log(`❌ 동적 트렌드 수집 오류: ${error.message}`);
  }
  
  return null;
}

/**
 * 현재 날짜 정보를 반환하는 헬퍼 함수
 * @returns {Object} - 현재 날짜 정보 객체
 */
function getCurrentDateInfo() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(), // 0-11
    day: now.getDate(),
    dateString: now.toISOString().split('T')[0], // YYYY-MM-DD
    timestamp: now.getTime(),
    // 유용한 계산된 값들
    cutoffYear: now.getFullYear() - 2, // 2년 전까지만 허용
    previousYear: now.getFullYear() - 1,
    season: getSeason(now.getMonth()),
    isNewYear: now.getMonth() === 0 && now.getDate() <= 31, // 1월이면 신년
  };
}

/**
 * 월 기준 계절 반환
 * @param {number} month - 월 (0-11)
 * @returns {string} - 계절
 */
function getSeason(month) {
  if (month >= 11 || month <= 1) return 'winter';
  else if (month >= 2 && month <= 4) return 'spring';
  else if (month >= 5 && month <= 7) return 'summer';
  else return 'fall';
}

/**
 * 중복 토픽 제거 함수 - Google Sheets의 기존 토픽과 비교
 * @param {Array} newTopics - 새로 수집된 토픽들
 * @returns {Array} - 중복이 제거된 토픽들
 */
function removeDuplicateTopics(newTopics) {
  try {
    const config = getConfig();
    const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      Logger.log("⚠️ 스프레드시트를 찾을 수 없어 중복 체크를 건너뜁니다.");
      return newTopics;
    }
    
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    if (!sheet) {
      Logger.log(`⚠️ 시트 "${config.SHEET_NAME}"를 찾을 수 없어 중복 체크를 건너뜁니다.`);
      return newTopics;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log("📝 기존 토픽이 없어 모든 토픽이 새로운 토픽입니다.");
      return newTopics;
    }

    const headers = data[0];
    const topicColumnIndex = headers.indexOf('Topic');
    
    if (topicColumnIndex === -1) {
      Logger.log("⚠️ 'Topic' 컬럼을 찾을 수 없어 중복 체크를 건너뜁니다.");
      return newTopics;
    }

    // 기존 토픽들을 소문자로 정규화하여 수집
    const existingTopics = new Set();
    for (let i = 1; i < data.length; i++) {
      const topic = data[i][topicColumnIndex];
      if (topic && typeof topic === 'string') {
        existingTopics.add(topic.toLowerCase().trim());
      }
    }

    Logger.log(`📊 기존 토픽 ${existingTopics.size}개와 비교 중...`);

    // 새 토픽들을 필터링 (유사도 체크 포함)
    const filteredTopics = newTopics.filter(newTopic => {
      const newTopicNormalized = newTopic.topic.toLowerCase().trim();
      
      // 정확한 일치 체크
      if (existingTopics.has(newTopicNormalized)) {
        Logger.log(`❌ 중복 토픽 제거: "${newTopic.topic}" (정확 일치)`);
        return false;
      }
      
      // 유사도 체크 (70% 이상 유사하면 중복으로 간주)
      for (const existingTopic of existingTopics) {
        const similarity = calculateTopicSimilarity(newTopicNormalized, existingTopic);
        if (similarity > 0.7) {
          Logger.log(`❌ 유사 토픽 제거: "${newTopic.topic}" (기존: "${existingTopic}", 유사도: ${Math.round(similarity * 100)}%)`);
          return false;
        }
      }
      
      return true;
    });

    Logger.log(`✅ 중복 제거 완료: ${newTopics.length}개 → ${filteredTopics.length}개`);
    return filteredTopics;

  } catch (error) {
    Logger.log(`❌ 중복 체크 중 오류: ${error.message} - 원본 토픽 반환`);
    return newTopics;
  }
}

/**
 * 토픽 간 유사도 계산 (단순 단어 겹침 기반)
 * @param {string} topic1 
 * @param {string} topic2 
 * @returns {number} - 0~1 사이의 유사도 값
 */
function calculateTopicSimilarity(topic1, topic2) {
  const words1 = topic1.split(/\s+/).filter(w => w.length > 2);
  const words2 = topic2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
}

/**
 * 최신성 기반 토픽 필터링 - 현재 날짜 기준으로 유효한 토픽만 선별
 * @param {Array} topics - 필터링할 토픽 배열
 * @returns {Array} - 최신성이 검증된 토픽 배열
 */
function filterByFreshness(topics) {
  const dateInfo = getCurrentDateInfo();
  
  Logger.log(`📅 현재 날짜: ${dateInfo.year}년 ${dateInfo.month + 1}월 ${dateInfo.day}일 (최신성 기준)`);
  Logger.log(`🔍 허용 연도 범위: ${dateInfo.cutoffYear + 1}년 ~ ${dateInfo.year}년`);
  
  // 동적으로 과거 연도 패턴 생성
  const pastYearPattern = new RegExp(`\\b(20[0-1][0-9]|20[2][0-${String(dateInfo.cutoffYear).slice(-1)}])\\b`);
  
  const validTopics = topics.filter(topic => {
    const topicText = topic.topic.toLowerCase();
    
    // 1. 동적으로 계산된 과거 연도 제거 (현재 기준 -2년 이전 데이터)
    if (pastYearPattern.test(topicText)) {
      Logger.log(`❌ 과거 연도 토픽 제거: "${topic.topic}" (${dateInfo.cutoffYear}년 이전)`);
      return false;
    }
    
    // 2. 현재 날짜 기준 회고성 토픽 제거 (동적 패턴)
    const retrospectivePatterns = [
      new RegExp(`\\bbest of (20[0-1][0-9]|20[2][0-${String(dateInfo.cutoffYear).slice(-1)}])\\b`),
      new RegExp(`\\b(20[0-1][0-9]|20[2][0-${String(dateInfo.cutoffYear).slice(-1)}]) (review|recap|summary)\\b`),
      new RegExp(`\\byear end (20[0-1][0-9]|20[2][0-${String(dateInfo.cutoffYear).slice(-1)}])\\b`),
      new RegExp(`\\btop.*?(20[0-1][0-9]|20[2][0-${String(dateInfo.cutoffYear).slice(-1)}])\\b`)
    ];
    
    for (const pattern of retrospectivePatterns) {
      if (pattern.test(topicText)) {
        Logger.log(`❌ 회고성 토픽 제거: "${topic.topic}"`);
        return false;
      }
    }
    
    // 3. 계절성 검증 - 현재 계절과 맞지 않는 토픽 제거
    if (!isSeasonallyRelevant(topicText, dateInfo.month)) {
      Logger.log(`❌ 계절성 불일치 토픽 제거: "${topic.topic}" (현재: ${dateInfo.season})`);
      return false;
    }
    
    // 4. 현재 연도와 관련된 토픽은 우선순위 부여
    const currentYearPattern = new RegExp(`\\b${dateInfo.year}\\b`);
    if (currentYearPattern.test(topicText)) {
      Logger.log(`✅ 현재 연도 토픽 우선 선택: "${topic.topic}"`);
      topic.freshness_score = 100;
    } else {
      topic.freshness_score = 75; // 기본 점수
    }
    
    return true;
  });
  
  // 최신성 점수 기준 정렬 (높은 점수 우선)
  validTopics.sort((a, b) => (b.freshness_score || 75) - (a.freshness_score || 75));
  
  return validTopics;
}

/**
 * 계절성 관련성 검증
 * @param {string} topicText - 토픽 텍스트 
 * @param {number} currentMonth - 현재 월 (0-11)
 * @returns {boolean} - 계절적으로 관련성이 있는지 여부
 */
function isSeasonallyRelevant(topicText, currentMonth) {
  // 계절별 키워드 정의
  const seasonalKeywords = {
    winter: ['christmas', 'holiday', 'winter', 'snow', 'skiing', 'indoor', 'cozy'], // 12, 1, 2월
    spring: ['spring', 'easter', 'garden', 'outdoor', 'hiking', 'fresh'], // 3, 4, 5월  
    summer: ['summer', 'vacation', 'travel', 'beach', 'camping', 'festival'], // 6, 7, 8월
    fall: ['fall', 'autumn', 'school', 'back to', 'halloween', 'thanksgiving'] // 9, 10, 11월
  };
  
  // 현재 계절 결정
  let currentSeason;
  if (currentMonth >= 11 || currentMonth <= 1) currentSeason = 'winter';
  else if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
  else currentSeason = 'fall';
  
  // 계절 키워드가 없으면 통과 (일반적인 토픽)
  const hasSeasonalKeyword = Object.values(seasonalKeywords).some(keywords =>
    keywords.some(keyword => topicText.includes(keyword))
  );
  
  if (!hasSeasonalKeyword) {
    return true; // 계절과 무관한 일반 토픽은 항상 유효
  }
  
  // 현재 계절과 관련된 키워드가 있으면 통과
  const currentSeasonKeywords = seasonalKeywords[currentSeason];
  return currentSeasonKeywords.some(keyword => topicText.includes(keyword));
}

/**
 * 대안 트렌드 수집 방법 (Rising searches)
 */
function tryAlternativeTrendsApproach(apiKey) {
  try {
    Logger.log(`🔄 백업 방법: 완전 동적 Google Trends 수집`);
    
    // 완전 동적: Google Trends Top Charts API 시도
    const topChartsUrl = `https://serpapi.com/search.json?engine=google_trends&geo=US&data_type=TOP_CHARTS&api_key=${apiKey}`;
    
    Logger.log(`📊 Google Trends Top Charts API 호출 중...`);
    
    try {
      const response = UrlFetchApp.fetch(topChartsUrl, { 
        method: "GET", 
        muteHttpExceptions: true,
        timeout: 6000
      });
      
      const statusCode = response.getResponseCode();
      Logger.log(`📊 Top Charts 응답 코드: ${statusCode}`);
      
      if (statusCode === 200) {
        const data = JSON.parse(response.getContentText());
        
        if (data.top_charts && data.top_charts.length > 0) {
          const topTrends = data.top_charts
            .slice(0, 10)
            .map((item, index) => ({
              topic: item.query || item.title || item,
              source: 'google_trends_top_charts_dynamic',
              trending_score: 90 - (index * 5)
            }));
            
          Logger.log(`✅ Top Charts로 ${topTrends.length}개 완전 동적 토픽 수집`);
          Logger.log(`🎯 Top Charts 토픽: ${topTrends.slice(0, 3).map(t => t.topic).join(', ')}...`);
          return topTrends;
        }
      }
      
    } catch (topError) {
      Logger.log(`❌ Top Charts API 오류: ${topError.message}`);
    }

    // Top Charts 실패 시 Simple Trending 시도
    Logger.log(`🔄 최종 백업: Google Search Trends 시도`);
    
    const simpleTrendUrl = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=US&api_key=${apiKey}`;
    
    const simpleResponse = UrlFetchApp.fetch(simpleTrendUrl, {
      method: "GET",
      muteHttpExceptions: true,
      timeout: 5000
    });
    
    if (simpleResponse.getResponseCode() === 200) {
      const simpleData = JSON.parse(simpleResponse.getContentText());
      
      if (simpleData.trending_searches && simpleData.trending_searches.length > 0) {
        const simpleTrends = simpleData.trending_searches
          .slice(0, 8)
          .map((trend, index) => ({
            topic: trend.query || trend.title || trend,
            source: 'google_trends_simple_dynamic',
            trending_score: 80 - (index * 3)
          }));
          
        Logger.log(`✅ Simple Trends로 ${simpleTrends.length}개 완전 동적 토픽 수집`);
        return simpleTrends;
      }
    }

    Logger.log(`❌ 모든 동적 트렌드 수집 방법 실패`);
    return null;
  } catch (error) {
    Logger.log(`❌ 백업 동적 트렌드 수집 실패: ${error.message}`);
    return null;
  }
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