/**
 * 관심사 기반 토픽 발굴 서비스 (SEO 개선)
 * 일일 트렌드 대신, 블로그의 핵심 주제와 관련된 잠재력 있는 토픽을 능동적으로 찾아냅니다.
 */

/**
 * 씨앗 키워드를 기반으로 연관 토픽 및 질문들을 발굴하고, AI를 통해 전략적으로 그룹화하고, 기회 점수를 계산합니다.
 * @returns {Array<Object>} A list of AI-curated and scored topic objects.
 */
function discoverNicheTopics() {
  const config = getConfig();
  const nicheKeywords = config.BLOG_NICHE_KEYWORDS;
  const serpApiKey = config.SERP_API_KEY;

  if (!serpApiKey) {
    Logger.log("⚠️ SERP_API_KEY가 설정되지 않았습니다. 토픽 발굴을 건너뜁니다.");
    return [];
  }

  if (!nicheKeywords || nicheKeywords.length === 0) {
    Logger.log("⚠️ BLOG_NICHE_KEYWORDS가 설정되지 않았습니다. 토픽 발굴을 건너뜁니다.");
    return [];
  }

  Logger.log(`🔍 씨앗 키워드 기반 토픽 발굴 시작: [${nicheKeywords.join(', ')}]`);

  const serpResultsByKeyword = {};
  let allDiscoveredTopics = [];

  nicheKeywords.forEach(keyword => {
    const serpData = fetchTopicsFromSerpApi(keyword, serpApiKey);
    if (serpData) {
      serpResultsByKeyword[keyword] = serpData.organic_results || [];
      const topics = extractTopicsFromSerpData(serpData);
      allDiscoveredTopics.push(...topics);
    }
  });

  const uniqueTopics = allDiscoveredTopics.filter((item, index, self) =>
    index === self.findIndex((t) => t.topic === item.topic)
  );

  Logger.log(`✅ 총 ${uniqueTopics.length}개의 잠재적 토픽을 발굴했습니다.`);

  if (uniqueTopics.length === 0) return [];

  const analysisResult = analyzeTopicsWithAI(uniqueTopics);

  if (!analysisResult || !analysisResult.clusters || analysisResult.clusters.length === 0) {
    Logger.log("⚠️ AI 토픽 분석 실패. 원본 토픽을 그대로 사용합니다.");
    return [];
  }

  const finalTopics = analysisResult.clusters.map(cluster => {
    const primaryKeyword = cluster.keywords[0] || cluster.representative_title;
    const organicResults = serpResultsByKeyword[findParentSeed(primaryKeyword, nicheKeywords)] || [];
    const opportunityScore = calculateOpportunityScore(organicResults);
    
    Logger.log(`✨ AI 추천 토픽: "${cluster.representative_title}" (기회 점수: ${opportunityScore})`);
    
    return {
      topic: cluster.representative_title,
      source: 'ai_content_strategy',
      cluster_name: cluster.cluster_name,
      user_intent: cluster.user_intent,
      keywords: cluster.keywords,
      opportunity_score: opportunityScore
    };
  });
  
  return finalTopics;
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