/**
 * 실시간 데이터 수집 서비스
 * Google Trends, 웹 검색 등을 통한 최신 데이터 활용
 */

/**
 * 실시간 Google Trends 데이터 수집
 */
function getLiveTrendingTopics(region = 'US', count = 10) {
  try {
    Logger.log("🔥 실시간 Google Trends 데이터 수집 시작");
    
    const dateInfo = getCurrentDateInfo();
    const trendingTopics = [];
    
    // Google Trends RSS 피드에서 실시간 트렌드 수집
    const regions = [region, 'US', 'KR', 'GB']; // 다중 지역 폴백
    
    for (const reg of regions) {
      try {
        const url = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${reg}`;
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        
        if (response.getResponseCode() === 200) {
          const xmlContent = response.getContentText();
          const topics = parseGoogleTrendsRSS(xmlContent);
          
          trendingTopics.push(...topics.map(topic => ({
            ...topic,
            region: reg,
            timestamp: dateInfo.timestamp,
            freshness: 'trending_now'
          })));
          
          Logger.log(`✅ ${reg} 지역에서 ${topics.length}개 트렌드 수집`);
          
          if (trendingTopics.length >= count) break;
        }
      } catch (regionError) {
        Logger.log(`⚠️ ${reg} 지역 트렌드 수집 실패: ${regionError.message}`);
      }
    }
    
    return trendingTopics.slice(0, count);
    
  } catch (error) {
    Logger.log(`❌ 실시간 트렌드 수집 실패: ${error.message}`);
    return [];
  }
}

/**
 * AI를 활용한 실시간 주제 분석
 */
function analyzeRealTimeTrends(topics, targetLanguage = 'EN') {
  try {
    const config = getConfig();
    const dateInfo = getCurrentDateInfo();
    
    Logger.log("🤖 AI 실시간 트렌드 분석 시작");
    
    const analysisPrompt = buildRealTimeAnalysisPrompt(topics, dateInfo, targetLanguage);
    const response = callAiProvider(analysisPrompt, config, config.AI_MODEL);
    
    const analysis = JSON.parse(response);
    
    Logger.log(`✅ ${analysis.hotTopics?.length || 0}개의 핫 토픽 분석 완료`);
    
    return {
      ...analysis,
      timestamp: dateInfo.timestamp,
      analysisDate: dateInfo.fullDate
    };
    
  } catch (error) {
    Logger.log(`❌ 실시간 트렌드 분석 실패: ${error.message}`);
    return null;
  }
}

/**
 * 실시간 분석 프롬프트 생성
 */
function buildRealTimeAnalysisPrompt(topics, dateInfo, targetLanguage) {
  const isKorean = targetLanguage && (
    targetLanguage.toString().trim().toUpperCase() === "KO" || 
    targetLanguage.toString().trim().toLowerCase().includes("korean")
  );
  
  const topicsList = topics.map(t => `- ${t.title} (region: ${t.region})`).join('\n');
  
  if (isKorean) {
    return `너는 한국 트렌드 분석 전문가야. 현재 실시간으로 핫한 주제들을 분석해서 블로그 글감을 추천해줘.

현재 시각: ${dateInfo.fullDate} (${dateInfo.monthText} ${dateInfo.yearText})
실시간 트렌딩 주제들:
${topicsList}

다음 JSON으로 분석결과를 줘:
{
  "hotTopics": [
    {
      "title": "한국어로 된 매력적인 블로그 제목",
      "originalTrend": "원본 트렌드 키워드", 
      "reason": "왜 지금 핫한지 이유",
      "urgency": "높음|보통|낮음",
      "category": "한국어 카테고리명",
      "keywords": ["한국어 키워드1", "한국어 키워드2"]
    }
  ],
  "dateContext": "${dateInfo.fullDate} 기준 실시간 분석",
  "recommendations": ["첫 번째 추천사항", "두 번째 추천사항"]
}

규칙:
- 모든 결과를 한국어로 작성
- ${dateInfo.yearText}년 ${dateInfo.monthText} 현재 상황 반영
- 지금 당장 글쓰면 트래픽 올 만한 주제 우선
- 한국 독자들이 관심 가질만한 내용으로 변환`;
  }
  
  return `You are a real-time trend analyst. Analyze current trending topics and recommend the best blog post opportunities.

Current Time: ${dateInfo.fullDate} (${dateInfo.monthText} ${dateInfo.yearText})
Live Trending Topics:
${topicsList}

Provide analysis in JSON format:
{
  "hotTopics": [
    {
      "title": "Compelling blog post title optimized for ${dateInfo.yearText}",
      "originalTrend": "Original trending keyword",
      "reason": "Why this is trending now",
      "urgency": "high|medium|low",
      "category": "Blog category",
      "keywords": ["keyword1", "keyword2"],
      "timeliness": "immediate|this_week|this_month"
    }
  ],
  "dateContext": "Analysis based on ${dateInfo.fullDate} data",
  "recommendations": ["First recommendation", "Second recommendation"]
}

Requirements:
- Focus on topics with immediate traffic potential
- Include ${dateInfo.yearText} context for freshness
- Prioritize trends that can be turned into evergreen content
- Consider ${dateInfo.seasonText} ${dateInfo.yearText} relevance`;
}

/**
 * Google Trends RSS 파싱
 */
function parseGoogleTrendsRSS(xmlContent) {
  try {
    const topics = [];
    
    // RSS 아이템 추출 (간단한 정규식 파싱)
    const itemMatches = xmlContent.match(/<item>[\s\S]*?<\/item>/g);
    
    if (itemMatches) {
      itemMatches.forEach(item => {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        const descMatch = item.match(/<ht:news_item_title><!\[CDATA\[(.*?)\]\]><\/ht:news_item_title>/);
        
        if (titleMatch) {
          topics.push({
            title: titleMatch[1].trim(),
            description: descMatch ? descMatch[1].trim() : '',
            source: 'google_trends_rss'
          });
        }
      });
    }
    
    return topics;
    
  } catch (error) {
    Logger.log(`❌ Google Trends RSS 파싱 실패: ${error.message}`);
    return [];
  }
}

/**
 * 실시간 데이터 기반 콘텐츠 향상
 */
function enhanceContentWithLiveData(topic, html, targetLanguage = 'EN') {
  try {
    Logger.log("🔄 실시간 데이터로 콘텐츠 향상 시작");
    
    // 1. 관련 실시간 트렌드 수집
    const liveTrends = getLiveTrendingTopics('US', 5);
    
    // 2. 현재 날짜 정보
    const dateInfo = getCurrentDateInfo();
    const dateContext = getDateContextForPrompt();
    
    // 3. 제목 최적화
    const optimizedTitle = optimizeTitleWithYear(topic);
    
    // 4. 시의성 키워드 추가
    const timelinessKeywords = getTimelinessKeywords();
    
    return {
      enhancedTitle: optimizedTitle,
      dateContext: dateContext.context,
      liveKeywords: timelinessKeywords.current.slice(0, 3),
      relatedTrends: liveTrends.slice(0, 3).map(t => t.title),
      freshnessTags: timelinessKeywords.trending
    };
    
  } catch (error) {
    Logger.log(`❌ 실시간 데이터 향상 실패: ${error.message}`);
    return {
      enhancedTitle: topic,
      dateContext: getCurrentDateInfo().context,
      liveKeywords: [],
      relatedTrends: [],
      freshnessTags: []
    };
  }
}

/**
 * 실시간 트렌드 기반 자동 토픽 생성
 */
function generateTopicsFromLiveTrends(count = 5, targetLanguage = 'EN') {
  try {
    Logger.log("🚀 실시간 트렌드 기반 토픽 자동 생성 시작");
    
    // 1. 실시간 트렌드 수집
    const liveTrends = getLiveTrendingTopics('US', count * 2);
    
    if (liveTrends.length === 0) {
      throw new Error("실시간 트렌드 데이터를 가져올 수 없습니다");
    }
    
    // 2. AI 분석
    const analysis = analyzeRealTimeTrends(liveTrends, targetLanguage);
    
    if (!analysis || !analysis.hotTopics) {
      throw new Error("AI 트렌드 분석 실패");
    }
    
    // 3. 블로그 토픽으로 변환
    const blogTopics = analysis.hotTopics.slice(0, count).map(topic => ({
      topic: topic.title,
      category: topic.category || 'Trending',
      keywords: topic.keywords || [],
      urgency: topic.urgency || 'medium',
      source: 'live_trends',
      timestamp: new Date().getTime(),
      freshness: topic.timeliness || 'immediate'
    }));
    
    Logger.log(`✅ ${blogTopics.length}개의 실시간 블로그 토픽 생성 완료`);
    
    return {
      topics: blogTopics,
      analysis: analysis,
      generatedAt: getCurrentDateInfo().fullDate
    };
    
  } catch (error) {
    Logger.log(`❌ 실시간 토픽 생성 실패: ${error.message}`);
    return {
      topics: [],
      analysis: null,
      error: error.message
    };
  }
}