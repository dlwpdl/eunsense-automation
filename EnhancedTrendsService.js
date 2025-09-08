/**
 * 🚀 향상된 Google Trends 서비스
 * 캐싱, 에러 처리, 성능 최적화, 보안 강화 적용
 */

/**
 * 캐시 및 보안이 적용된 트렌드 수집
 */
function fetchTrendingTopicsEnhanced() {
  const config = getEnhancedConfig();
  
  return withSecurityCheck('트렌드 수집', () => {
    return trackExecutionMetrics('trends_collection', () => {
      // 캐시에서 먼저 조회
      return getCachedTrends(config.TRENDS_REGION, config.TRENDS_CATEGORY, () => {
        return _fetchTrendsFromSources();
      });
    }, { region: config.TRENDS_REGION, category: config.TRENDS_CATEGORY });
  }, {
    service: 'TRENDS',
    validateInput: () => {
      if (!config.TRENDS_REGION) throw new Error('TRENDS_REGION 설정 필요');
    }
  });
}

/**
 * 다중 소스에서 트렌드 수집 (개선된 버전)
 */
function _fetchTrendsFromSources() {
  const config = getEnhancedConfig();
  const sources = [];
  
  Logger.log("📈 다중 소스 트렌드 수집 시작");
  
  // 1차: Google Trends RSS (주 소스)
  try {
    const googleTrends = _fetchGoogleTrendsRSS();
    if (googleTrends.length > 0) {
      sources.push({ name: 'google_trends', data: googleTrends, priority: 1 });
      Logger.log(`✅ Google Trends RSS: ${googleTrends.length}개 수집`);
    }
  } catch (error) {
    Logger.log(`❌ Google Trends RSS 실패: ${error.message}`);
  }
  
  // 2차: SerpAPI (폴백)
  if (config.SERP_API_KEY) {
    try {
      const serpTrends = _fetchSerpAPITrends();
      if (serpTrends.length > 0) {
        sources.push({ name: 'serpapi', data: serpTrends, priority: 2 });
        Logger.log(`✅ SerpAPI: ${serpTrends.length}개 수집`);
      }
    } catch (error) {
      Logger.log(`❌ SerpAPI 실패: ${error.message}`);
    }
  }
  
  // 3차: 기본 주제 (최종 폴백)
  if (sources.length === 0) {
    Logger.log("⚠️ 모든 소스 실패, 기본 주제 사용");
    sources.push({ name: 'default', data: getDefaultTopicsEnhanced(), priority: 3 });
  }
  
  // 우선순위별 정렬 및 병합
  sources.sort((a, b) => a.priority - b.priority);
  const allTrends = [];
  
  sources.forEach(source => {
    allTrends.push(...source.data.map(trend => ({
      ...trend,
      source: source.name,
      priority: source.priority
    })));
  });
  
  // 중복 제거 및 제한 적용
  const uniqueTrends = _deduplicateTrends(allTrends);
  const limitedTrends = uniqueTrends.slice(0, config.TRENDS_DAILY_LIMIT);
  
  // 관련 주제 병렬 수집 (성능 개선)
  const enrichedTrends = _enrichTrendsWithRelatedTopics(limitedTrends);
  
  Logger.log(`🎯 트렌드 수집 완료: ${enrichedTrends.length}개 (${sources.map(s => s.name).join(', ')})`);
  return enrichedTrends;
}

/**
 * Google Trends RSS 수집 (개선된 버전)
 */
function _fetchGoogleTrendsRSS() {
  const config = getEnhancedConfig();
  const region = config.TRENDS_REGION || 'US';
  
  return withEnhancedRetry(() => {
    const rssUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${region}&hl=en`;
    
    const response = UrlFetchApp.fetch(rssUrl, {
      method: "GET",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Google Trends RSS 요청 실패: HTTP ${response.getResponseCode()}`);
    }
    
    const xmlData = response.getContentText();
    if (!xmlData || xmlData.length < 100) {
      throw new Error("Google Trends RSS 응답 데이터 부족");
    }
    
    return _parseGoogleTrendsRSS(xmlData);
    
  }, {
    maxRetries: 3,
    initialDelay: 2000,
    retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT]
  })();
}

/**
 * SerpAPI 트렌드 수집 (개선된 버전)
 */
function _fetchSerpAPITrends() {
  const config = getEnhancedConfig();
  const serpApiKey = apiKeyManager.getSecureAPIKey('serpapi', 'SERP_API_KEY');
  
  return withEnhancedRetry(() => {
    const url = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=${config.TRENDS_REGION}&hl=en&api_key=${serpApiKey}`;
    
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`SerpAPI 요청 실패: HTTP ${response.getResponseCode()}`);
    }
    
    const data = JSON.parse(response.getContentText());
    return _parseSerpAPIResponse(data);
    
  }, {
    maxRetries: 2,
    initialDelay: 3000,
    retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.API_LIMIT]
  })();
}

/**
 * 향상된 RSS 파싱
 */
function _parseGoogleTrendsRSS(xmlData) {
  const trends = [];
  
  try {
    // 제목 추출
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
    // 설명 추출 (추가 정보)
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/g;
    // 링크 추출
    const linkRegex = /<link>(.*?)<\/link>/g;
    
    let titleMatch, descMatch, linkMatch;
    const titles = [];
    const descriptions = [];
    const links = [];
    
    // 모든 매치 수집
    while ((titleMatch = titleRegex.exec(xmlData)) !== null) {
      titles.push(titleMatch[1].trim());
    }
    
    while ((descMatch = descRegex.exec(xmlData)) !== null) {
      descriptions.push(descMatch[1].trim());
    }
    
    while ((linkMatch = linkRegex.exec(xmlData)) !== null) {
      links.push(linkMatch[1].trim());
    }
    
    // 메타 정보 제외하고 실제 트렌드만 추출
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      if (title && 
          title !== "Google Trends" && 
          title !== "Daily Search Trends" &&
          !title.includes("Google") &&
          title.length > 3) {
        
        trends.push({
          topic: title,
          description: descriptions[i] || '',
          link: links[i] || '',
          timestamp: new Date(),
          confidence: _calculateTrendConfidence(title, descriptions[i])
        });
      }
    }
    
    Logger.log(`📊 RSS 파싱 결과: ${trends.length}개 트렌드 추출`);
    return trends;
    
  } catch (error) {
    Logger.log(`❌ RSS 파싱 실패: ${error.message}`);
    throw error;
  }
}

/**
 * SerpAPI 응답 파싱
 */
function _parseSerpAPIResponse(data) {
  const trends = [];
  
  try {
    if (data.trending_searches && Array.isArray(data.trending_searches)) {
      data.trending_searches.forEach(item => {
        if (item.query && item.query.length > 3) {
          trends.push({
            topic: item.query,
            description: item.snippet || '',
            searchVolume: item.search_volume || 0,
            timestamp: new Date(),
            confidence: _calculateTrendConfidence(item.query, item.snippet)
          });
        }
      });
    }
    
    // Google Trends specific data
    if (data.interest_over_time && Array.isArray(data.interest_over_time)) {
      data.interest_over_time.forEach(item => {
        if (item.query && item.value > 50) { // 높은 관심도만
          trends.push({
            topic: item.query,
            interest: item.value,
            timestamp: new Date(),
            confidence: Math.min(item.value / 100, 1)
          });
        }
      });
    }
    
    Logger.log(`📊 SerpAPI 파싱 결과: ${trends.length}개 트렌드 추출`);
    return trends;
    
  } catch (error) {
    Logger.log(`❌ SerpAPI 파싱 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 트렌드 신뢰도 계산
 */
function _calculateTrendConfidence(topic, description = '') {
  let confidence = 0.5; // 기본 신뢰도
  
  // 토픽 길이 기반
  if (topic.length >= 10 && topic.length <= 50) {
    confidence += 0.2;
  }
  
  // 설명 있으면 가점
  if (description && description.length > 20) {
    confidence += 0.15;
  }
  
  // 특정 키워드 포함시 가점
  const highConfidenceKeywords = ['breaking', 'latest', 'trending', '2025', 'new'];
  const lowConfidenceKeywords = ['old', 'archive', 'history'];
  
  const topicLower = topic.toLowerCase();
  
  highConfidenceKeywords.forEach(keyword => {
    if (topicLower.includes(keyword)) confidence += 0.1;
  });
  
  lowConfidenceKeywords.forEach(keyword => {
    if (topicLower.includes(keyword)) confidence -= 0.2;
  });
  
  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * 중복 트렌드 제거 (고급 알고리즘)
 */
function _deduplicateTrends(trends) {
  const uniqueTrends = [];
  const seenTopics = new Set();
  
  // 신뢰도 기준 정렬 (높은 순)
  trends.sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5));
  
  trends.forEach(trend => {
    const normalizedTopic = _normalizeTopic(trend.topic);
    
    // 유사도 검사
    let isDuplicate = false;
    for (const seenTopic of seenTopics) {
      if (_calculateSimilarity(normalizedTopic, seenTopic) > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueTrends.push(trend);
      seenTopics.add(normalizedTopic);
    }
  });
  
  Logger.log(`🔍 중복 제거: ${trends.length}개 → ${uniqueTrends.length}개`);
  return uniqueTrends;
}

/**
 * 토픽 정규화
 */
function _normalizeTopic(topic) {
  return topic.toLowerCase()
    .replace(/[^\w\s]/g, '') // 특수문자 제거
    .replace(/\s+/g, ' ')    // 공백 정리
    .trim();
}

/**
 * 문자열 유사도 계산 (레벤슈타인 거리 기반)
 */
function _calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix = [];
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return 1 - (matrix[len2][len1] / maxLen);
}

/**
 * 병렬 관련 주제 수집
 */
function _enrichTrendsWithRelatedTopics(trends) {
  Logger.log("🔗 관련 주제 병렬 수집 시작");
  
  const enrichedTrends = trends.map(trend => {
    try {
      const relatedTopics = _fetchRelatedTopicsOptimized(trend.topic);
      return {
        ...trend,
        relatedTopics: relatedTopics.slice(0, 10) // 최대 10개로 제한
      };
    } catch (error) {
      Logger.log(`⚠️ ${trend.topic} 관련 주제 수집 실패: ${error.message}`);
      return {
        ...trend,
        relatedTopics: _generateBasicRelatedTopics(trend.topic)
      };
    }
  });
  
  Logger.log("✅ 관련 주제 수집 완료");
  return enrichedTrends;
}

/**
 * 최적화된 관련 주제 수집
 */
function _fetchRelatedTopicsOptimized(mainTopic) {
  // 캐시에서 먼저 확인
  const cacheKey = `related_${mainTopic}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    Logger.log(`💾 관련 주제 캐시 사용: ${mainTopic}`);
    return cached;
  }
  
  const relatedTopics = [];
  
  // 1. 키워드 변형 생성
  const variations = _generateKeywordVariations(mainTopic);
  relatedTopics.push(...variations);
  
  // 2. 의미적 확장
  const semanticExpansions = _generateSemanticExpansions(mainTopic);
  relatedTopics.push(...semanticExpansions);
  
  // 3. 카테고리 기반 확장
  const categoryExpansions = _generateCategoryBasedExpansions(mainTopic);
  relatedTopics.push(...categoryExpansions);
  
  // 중복 제거 및 검증
  const uniqueTopics = [...new Set(relatedTopics)];
  const validTopics = uniqueTopics.filter(topic => 
    topic.length >= 10 && topic.length <= 100 && topic.trim() !== mainTopic
  );
  
  // 캐시에 저장
  const finalTopics = validTopics.slice(0, 12);
  cacheManager.set(cacheKey, finalTopics, 12 * 60 * 60 * 1000); // 12시간
  
  return finalTopics;
}

/**
 * 키워드 변형 생성 (개선된 버전)
 */
function _generateKeywordVariations(topic) {
  const variations = [];
  const cleanTopic = topic.toLowerCase().trim();
  
  const patterns = [
    `${cleanTopic} guide 2025`,
    `${cleanTopic} latest trends`,
    `${cleanTopic} tips and tricks`,
    `${cleanTopic} best practices`,
    `${cleanTopic} comparison review`,
    `how to use ${cleanTopic}`,
    `${cleanTopic} for beginners`,
    `advanced ${cleanTopic} techniques`
  ];
  
  patterns.forEach(pattern => {
    if (pattern.length >= 10 && pattern.length <= 80) {
      variations.push(pattern);
    }
  });
  
  return variations.slice(0, 4);
}

/**
 * 의미적 확장 생성
 */
function _generateSemanticExpansions(topic) {
  const expansions = [];
  const topicLower = topic.toLowerCase();
  
  // 의미적 연관 키워드 매핑
  const semanticMap = {
    'ai': ['machine learning', 'deep learning', 'neural networks', 'automation'],
    'cryptocurrency': ['blockchain', 'bitcoin', 'ethereum', 'defi', 'web3'],
    'technology': ['innovation', 'digital transformation', 'software', 'hardware'],
    'health': ['wellness', 'fitness', 'nutrition', 'medical', 'mental health'],
    'business': ['entrepreneurship', 'startup', 'marketing', 'finance', 'leadership'],
    'climate': ['environment', 'sustainability', 'renewable energy', 'carbon footprint'],
    'gaming': ['esports', 'streaming', 'virtual reality', 'console', 'mobile games']
  };
  
  for (const [key, relatedTerms] of Object.entries(semanticMap)) {
    if (topicLower.includes(key)) {
      relatedTerms.forEach(term => {
        expansions.push(`${topic} ${term}`);
        expansions.push(`${term} in ${topic}`);
      });
      break;
    }
  }
  
  return expansions.slice(0, 3);
}

/**
 * 카테고리 기반 확장
 */
function _generateCategoryBasedExpansions(topic) {
  const expansions = [];
  
  // 시간 기반 확장
  const timeModifiers = ['2025', 'latest', 'upcoming', 'recent', 'future'];
  timeModifiers.forEach(modifier => {
    expansions.push(`${topic} ${modifier}`);
  });
  
  // 액션 기반 확장
  const actionModifiers = ['tutorial', 'review', 'analysis', 'predictions', 'news'];
  actionModifiers.forEach(modifier => {
    expansions.push(`${topic} ${modifier}`);
  });
  
  return expansions.slice(0, 5);
}

/**
 * 기본 관련 주제 생성 (폴백)
 */
function _generateBasicRelatedTopics(topic) {
  const basic = [
    `${topic} guide`,
    `${topic} tips`,
    `${topic} news`,
    `${topic} trends`,
    `${topic} review`
  ];
  
  return basic.filter(t => t.length <= 80);
}

/**
 * 향상된 기본 주제 목록
 */
function getDefaultTopicsEnhanced() {
  const config = getEnhancedConfig();
  const currentYear = new Date().getFullYear();
  
  const defaultTopics = [
    `artificial intelligence trends ${currentYear}`,
    `blockchain technology developments ${currentYear}`,
    `sustainable energy solutions ${currentYear}`,
    `remote work productivity tools`,
    `digital marketing strategies ${currentYear}`,
    `healthy lifestyle habits guide`,
    `investment opportunities ${currentYear}`,
    `travel destinations recommendations`,
    `cooking recipes trending ${currentYear}`,
    `tech gadgets review ${currentYear}`
  ];
  
  return defaultTopics.map(topic => ({
    topic,
    source: "default_enhanced",
    timestamp: new Date(),
    confidence: 0.6,
    priority: 3
  }));
}

/**
 * 트렌드 품질 검증
 */
function validateTrendQuality(trends) {
  Logger.log("🔍 트렌드 품질 검증 시작");
  
  const validatedTrends = trends.filter(trend => {
    // 기본 검증
    if (!trend.topic || trend.topic.length < 5) {
      Logger.log(`❌ 주제 너무 짧음: ${trend.topic}`);
      return false;
    }
    
    if (trend.topic.length > 150) {
      Logger.log(`❌ 주제 너무 김: ${trend.topic}`);
      return false;
    }
    
    // 품질 검증
    const quality = _assessTopicQuality(trend.topic);
    if (quality < 0.3) {
      Logger.log(`❌ 품질 낮음 (${quality}): ${trend.topic}`);
      return false;
    }
    
    trend.qualityScore = quality;
    return true;
  });
  
  Logger.log(`✅ 품질 검증 완료: ${validatedTrends.length}/${trends.length} 통과`);
  return validatedTrends;
}

/**
 * 주제 품질 평가
 */
function _assessTopicQuality(topic) {
  let score = 0.5; // 기본 점수
  
  // 길이 적절성
  if (topic.length >= 20 && topic.length <= 80) score += 0.2;
  
  // 단어 수
  const wordCount = topic.split(' ').length;
  if (wordCount >= 3 && wordCount <= 8) score += 0.15;
  
  // 고품질 키워드
  const qualityKeywords = [
    'guide', 'tips', 'how to', 'best', 'latest', 'new', '2025', 
    'review', 'comparison', 'tutorial', 'strategy'
  ];
  
  const topicLower = topic.toLowerCase();
  qualityKeywords.forEach(keyword => {
    if (topicLower.includes(keyword)) score += 0.1;
  });
  
  // 저품질 키워드 감점
  const lowQualityKeywords = ['spam', 'click', 'free', 'now', '!!!'];
  lowQualityKeywords.forEach(keyword => {
    if (topicLower.includes(keyword)) score -= 0.3;
  });
  
  return Math.max(0, Math.min(1, score));
}

/**
 * 통합 테스트 함수
 */
function testEnhancedTrendsService() {
  Logger.log("🧪 향상된 트렌드 서비스 테스트");
  
  const startTime = Date.now();
  
  try {
    // 기본 기능 테스트
    const trends = fetchTrendingTopicsEnhanced();
    
    const testResults = {
      trendsCount: trends.length,
      sourcesUsed: [...new Set(trends.map(t => t.source))],
      avgConfidence: trends.reduce((sum, t) => sum + (t.confidence || 0), 0) / trends.length,
      hasRelatedTopics: trends.every(t => t.relatedTopics && t.relatedTopics.length > 0),
      duration: Date.now() - startTime
    };
    
    Logger.log("=== 테스트 결과 ===");
    Logger.log(`수집된 트렌드: ${testResults.trendsCount}개`);
    Logger.log(`사용된 소스: ${testResults.sourcesUsed.join(', ')}`);
    Logger.log(`평균 신뢰도: ${Math.round(testResults.avgConfidence * 100)}%`);
    Logger.log(`관련 주제 포함: ${testResults.hasRelatedTopics ? '✅' : '❌'}`);
    Logger.log(`실행 시간: ${Math.round(testResults.duration / 1000)}초`);
    
    // 샘플 트렌드 출력
    Logger.log("\n📋 샘플 트렌드 (첫 3개):");
    trends.slice(0, 3).forEach((trend, index) => {
      Logger.log(`${index + 1}. ${trend.topic}`);
      Logger.log(`   소스: ${trend.source}, 신뢰도: ${Math.round((trend.confidence || 0) * 100)}%`);
      Logger.log(`   관련 주제 수: ${trend.relatedTopics ? trend.relatedTopics.length : 0}개`);
    });
    
    return {
      success: testResults.trendsCount > 0,
      results: testResults
    };
    
  } catch (error) {
    Logger.log(`❌ 트렌드 서비스 테스트 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 개선사항이 적용된 시트 추가 함수
 */
function addEnhancedTrendsToSheet() {
  Logger.log("📊 향상된 트렌드 시트 추가 시작");
  
  return trackExecutionMetrics('trends_to_sheet', () => {
    const config = validateEnhancedConfig();
    const ss = config.SHEET_ID ? 
      SpreadsheetApp.openById(config.SHEET_ID) : 
      SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      throw new Error("스프레드시트에 바인딩되어 있지 않습니다.");
    }
    
    const sheet = ss.getSheetByName(config.SHEET_NAME) || 
      ss.insertSheet(config.SHEET_NAME);
    
    // 향상된 트렌드 수집
    const trends = fetchTrendingTopicsEnhanced();
    
    if (!trends || trends.length === 0) {
      Logger.log("수집된 트렌드가 없습니다.");
      return 0;
    }
    
    // 품질 검증
    const validatedTrends = validateTrendQuality(trends);
    
    // 기존 주제 확인 (개선된 중복 검사)
    const existingTopics = _getExistingTopics(sheet);
    
    // 새 주제 추가
    let addedCount = 0;
    const lastRow = sheet.getLastRow();
    
    validatedTrends.forEach((trend, index) => {
      if (!_isDuplicateTopic(trend.topic, existingTopics)) {
        const rowIndex = lastRow + addedCount + 1;
        
        // 향상된 메타데이터와 함께 추가
        sheet.getRange(rowIndex, 1).setValue(trend.topic); // Topic
        sheet.getRange(rowIndex, 2).setValue(""); // Status
        sheet.getRange(rowIndex, 5).setValue("트렌드"); // Category  
        sheet.getRange(rowIndex, 6).setValue(
          `${trend.source},신뢰도:${Math.round((trend.confidence || 0) * 100)}%`
        ); // Tags
        
        addedCount++;
        existingTopics.add(trend.topic.toLowerCase().trim());
      }
    });
    
    Logger.log(`✅ ${addedCount}개의 검증된 트렌딩 주제 추가`);
    return addedCount;
    
  }, { validated: true });
}

/**
 * 기존 주제 조회 (개선된 버전)
 */
function _getExistingTopics(sheet) {
  const existingTopics = new Set();
  
  if (sheet.getLastRow() > 1) {
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    data.forEach(row => {
      const topic = String(row[0] || "").trim().toLowerCase();
      if (topic.length > 0) {
        existingTopics.add(topic);
      }
    });
  }
  
  return existingTopics;
}

/**
 * 중복 주제 검사 (개선된 버전)
 */
function _isDuplicateTopic(newTopic, existingTopics) {
  const normalizedNew = _normalizeTopic(newTopic);
  
  for (const existing of existingTopics) {
    const normalizedExisting = _normalizeTopic(existing);
    
    // 정확히 같거나 유사도가 높은 경우
    if (normalizedNew === normalizedExisting || 
        _calculateSimilarity(normalizedNew, normalizedExisting) > 0.8) {
      return true;
    }
  }
  
  return false;
}