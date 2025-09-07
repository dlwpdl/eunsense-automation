/**
 * 이미지 처리 서비스
 */

/**
 * 사용된 이미지 URL 관리
 */
const USED_IMAGES_SHEET = "UsedImages";

function getUsedImages() {
  const config = getConfig();
  if (!config.SHEET_ID) return [];
  
  try {
    const ss = SpreadsheetApp.openById(config.SHEET_ID);
    let sheet = ss.getSheetByName(USED_IMAGES_SHEET);
    
    if (!sheet) {
      sheet = ss.insertSheet(USED_IMAGES_SHEET);
      sheet.getRange(1, 1, 1, 3).setValues([["ImageURL", "UsedAt", "Topic"]]);
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    return data.slice(1).map(row => row[0]); // URL만 반환
  } catch (error) {
    Logger.log("사용된 이미지 목록 가져오기 실패: " + error.message);
    return [];
  }
}

function addUsedImage(imageUrl, topic) {
  const config = getConfig();
  if (!config.SHEET_ID || !imageUrl) return;
  
  try {
    const ss = SpreadsheetApp.openById(config.SHEET_ID);
    let sheet = ss.getSheetByName(USED_IMAGES_SHEET);
    
    if (!sheet) {
      sheet = ss.insertSheet(USED_IMAGES_SHEET);
      sheet.getRange(1, 1, 1, 3).setValues([["ImageURL", "UsedAt", "Topic"]]);
    }
    
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, 3).setValues([[imageUrl, new Date(), topic]]);
  } catch (error) {
    Logger.log("사용된 이미지 기록 실패: " + error.message);
  }
}

/**
 * Pexels API로 이미지 검색 (중복 방지)
 */
function searchPexelsImage(query, apiKey, topic = "") {
  if (!apiKey) return null;
  
  const usedImages = getUsedImages();
  const maxTries = 5; // 최대 5개까지 시도
  
  try {
    const response = UrlFetchApp.fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${maxTries}&orientation=landscape`, {
      method: "GET",
      headers: { "Authorization": apiKey },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.photos && data.photos.length > 0) {
        // 사용되지 않은 첫 번째 이미지 찾기
        for (const photo of data.photos) {
          if (!usedImages.includes(photo.src.large)) {
            const imageData = {
              url: photo.src.large,
              alt: photo.alt || query,
              photographer: photo.photographer,
              source: "pexels"
            };
            
            // 사용된 이미지로 기록
            addUsedImage(photo.src.large, topic);
            return imageData;
          }
        }
        Logger.log(`Pexels: 모든 이미지가 중복됨 (${query})`);
      }
    }
  } catch (error) {
    Logger.log(`Pexels 이미지 검색 실패 (${query}): ${error.message}`);
  }
  
  return null;
}

/**
 * Google Custom Search API로 고해상도 이미지 검색
 */
function searchGoogleImages(query, apiKey, searchEngineId, topic = "") {
  if (!apiKey || !searchEngineId) {
    Logger.log(`❌ Google Images API 설정 누락: API_KEY=${apiKey ? '있음' : '없음'}, ENGINE_ID=${searchEngineId ? '있음' : '없음'}`);
    return null;
  }
  
  try {
    Logger.log(`🔍 Google Images API 상세 설정:`);
    Logger.log(`  - API Key 길이: ${apiKey.length}자`);
    Logger.log(`  - API Key 시작: ${apiKey.substring(0, 10)}...`);
    Logger.log(`  - Search Engine ID: ${searchEngineId}`);
    Logger.log(`  - Query: ${query}`);
    
    const params = {
      key: apiKey,
      cx: searchEngineId,
      q: encodeURIComponent(query),
      searchType: 'image',
      imgSize: 'large',        // 고해상도 이미지
      imgType: 'photo',        // 사진만
      safe: 'active',          // 안전 검색
      num: 3,                  // 최대 3개
      imgColorType: 'color'    // 컬러 이미지
    };
    
    const paramString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `https://www.googleapis.com/customsearch/v1?${paramString}`;
    Logger.log(`  - Request URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log(`🔍 Google Images API 응답:`);
    Logger.log(`  - 상태 코드: ${responseCode}`);
    Logger.log(`  - 응답 길이: ${responseText.length}자`);
    
    if (responseCode === 200) {
      const data = JSON.parse(responseText);
      Logger.log(`  - 검색 결과 수: ${data.items ? data.items.length : 0}개`);
      if (data.items && data.items.length > 0) {
        const image = data.items[0];
        const imageData = {
          url: image.link,
          alt: image.title || query,
          photographer: extractDomain(image.displayLink),
          source: `via ${image.displayLink}`,
          originalSource: image.displayLink,
          contextLink: image.image?.contextLink || image.displayLink
        };
        
        Logger.log(`Google Images 검색 성공: ${query} from ${image.displayLink}`);
        return imageData;
      }
    } else {
      Logger.log(`❌ Google Images API 오류 상세:`);
      Logger.log(`  - 응답 본문: ${responseText.substring(0, 500)}`);
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error) {
          Logger.log(`  - 오류 메시지: ${errorData.error.message}`);
          Logger.log(`  - 오류 코드: ${errorData.error.code}`);
        }
      } catch (parseError) {
        Logger.log(`  - JSON 파싱 불가: ${parseError.message}`);
      }
    }
  } catch (error) {
    Logger.log(`Google Images 검색 실패 (${query}): ${error.message}`);
  }
  
  return null;
}

/**
 * Pexels API로 빠른 이미지 검색 (폴백용)
 */
function searchPexelsImageFast(query, apiKey, topic = "") {
  if (!apiKey) return null;
  
  try {
    const response = UrlFetchApp.fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`, {
      method: "GET",
      headers: { "Authorization": apiKey },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.photos && data.photos.length > 0) {
        // 첫 번째 이미지 바로 사용 (중복 검사 생략)
        const photo = data.photos[0];
        const imageData = {
          url: photo.src.large,
          alt: photo.alt || query,
          photographer: photo.photographer,
          source: "pexels"
        };
        
        // 간소화된 기록 (선택적)
        if (topic) {
          addUsedImage(photo.src.large, topic);
        }
        return imageData;
      }
    }
  } catch (error) {
    Logger.log(`Pexels 빠른 검색 실패 (${query}): ${error.message}`);
  }
  
  return null;
}

/**
 * Unsplash API로 이미지 검색 (폴백)
 */
function searchUnsplashImage(query, apiKey) {
  if (!apiKey) return null;
  
  try {
    const response = UrlFetchApp.fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      method: "GET",
      headers: { "Authorization": `Client-ID ${apiKey}` },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        return {
          url: photo.urls.regular,
          alt: photo.alt_description || query,
          photographer: photo.user.name,
          source: "unsplash"
        };
      }
    }
  } catch (error) {
    Logger.log(`Unsplash 이미지 검색 실패 (${query}): ${error.message}`);
  }
  
  return null;
}

/**
 * 기본 이미지 (폴백)
 */
function getDefaultImage(query) {
  return {
    url: "https://via.placeholder.com/1280x720/cccccc/666666?text=" + encodeURIComponent(query),
    alt: query,
    photographer: "Placeholder",
    source: "placeholder"
  };
}

/**
 * Pexels API로 여러 이미지 검색 (중복 방지)
 */
function searchMultiplePexelsImages(query, apiKey, topic = "") {
  if (!apiKey) return [];
  
  const usedImages = getUsedImages();
  const perPage = 10; // 여러 후보군을 위해 10개 요청
  
  try {
    const response = UrlFetchApp.fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`, {
      method: "GET",
      headers: { "Authorization": apiKey },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.photos && data.photos.length > 0) {
        // 사용되지 않은 이미지 필터링
        const newImages = data.photos.filter(photo => !usedImages.includes(photo.src.large));
        
        return newImages.map(photo => ({
          url: photo.src.large,
          alt: photo.alt || query,
          photographer: photo.photographer,
          source: "pexels"
        }));
      }
    }
  } catch (error) {
    Logger.log(`Pexels 다중 이미지 검색 실패 (${query}): ${error.message}`);
  }
  
  return [];
}

/**
 * Unsplash API로 여러 이미지 검색
 */
function searchMultipleUnsplashImages(query, apiKey) {
  if (!apiKey) return [];
  
  const perPage = 10;

  try {
    const response = UrlFetchApp.fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`, {
      method: "GET",
      headers: { "Authorization": `Client-ID ${apiKey}` },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.results && data.results.length > 0) {
        return data.results.map(photo => ({
          url: photo.urls.regular,
          alt: photo.alt_description || query,
          photographer: photo.user.name,
          source: "unsplash"
        }));
      }
    }
  } catch (error) {
    Logger.log(`Unsplash 다중 이미지 검색 실패 (${query}): ${error.message}`);
  }
  
  return [];
}

/**
 * 후보 이미지 중 최고 품질 이미지 선택
 */
function selectBestImage(candidateImages, query, blogContent) {
    if (!candidateImages || candidateImages.length === 0) {
        return null;
    }

    // 현재는 첫 번째 이미지를 최선으로 간주하는 간단한 로직
    const bestImage = candidateImages[0];

    // 최종 선택된 이미지를 '사용됨'으로 기록 (Pexels 이미지의 경우)
    if (bestImage.source === 'pexels') {
        addUsedImage(bestImage.url, bestImage.keyword || query);
    }

    return bestImage;
}

/**
 * 스마트 이미지 검색 (블로그 내용 기반) - 최적화 버전
 */
function findImage(query, topic = "", blogContent = "") {
  const config = getConfig();
  
  // 최대 3개 키워드로 제한 (시간 절약)
  const searchKeywords = blogContent 
    ? generateContentBasedKeywords(query, topic, blogContent).slice(0, 3)
    : generateSmartImageKeywords(query, topic).slice(0, 3);
    
  Logger.log(`이미지 검색 키워드: ${searchKeywords.join(", ")}`);
  
  // 첫 번째 키워드로만 시도 (빠른 검색)
  for (const keyword of searchKeywords) {
    // Google Images 최우선 (고해상도, 다양성)
    Logger.log(`🔍 Google Images 설정 확인: API_KEY=${config.GOOGLE_API_KEY ? '설정됨' : '없음'}, ENGINE_ID=${config.GOOGLE_SEARCH_ENGINE_ID ? '설정됨' : '없음'}`);
    
    if (config.GOOGLE_API_KEY && config.GOOGLE_SEARCH_ENGINE_ID) {
      Logger.log(`🌐 Google Images 검색 시도: ${keyword}`);
      const googleImage = searchGoogleImages(keyword, config.GOOGLE_API_KEY, config.GOOGLE_SEARCH_ENGINE_ID, topic);
      if (googleImage) {
        Logger.log(`✅ 고해상도 이미지 검색 성공 (google): ${keyword} from ${googleImage.originalSource}`);
        return googleImage;
      } else {
        Logger.log(`❌ Google Images 검색 실패: ${keyword}`);
      }
    } else {
      Logger.log(`⚠️ Google Images API 설정이 누락됨 - Pexels로 폴백`);
    }
    
    // Pexels 폴백 (중복 검사 간소화)
    if (config.PEXELS_API_KEY) {
      const pexelsImage = searchPexelsImageFast(keyword, config.PEXELS_API_KEY, topic);
      if (pexelsImage) {
        Logger.log(`빠른 이미지 검색 성공 (pexels): ${keyword}`);
        return pexelsImage;
      }
    }
    
    // Unsplash 최종 폴백
    if (config.UNSPLASH_API_KEY) {
      const unsplashImage = searchUnsplashImage(keyword, config.UNSPLASH_API_KEY);
      if (unsplashImage) {
        Logger.log(`빠른 이미지 검색 성공 (unsplash): ${keyword}`);
        return unsplashImage;
      }
    }
  }
  
  // 기본 이미지 (최종 폴백)
  Logger.log(`기본 이미지 사용: ${query}`);
  return getDefaultImage(query);
}

/**
 * 블로그 내용 기반 이미지 키워드 생성 (AI 강화 방식)
 */
function generateContentBasedKeywords(query, topic, blogContent) {
  // 1. 기존 방식으로 기본 키워드 추출
  const textContent = extractTextFromHtml(blogContent);
  const contentKeywords = extractImportantWords(textContent);
  const topicWords = extractWordsFromQuery(query + " " + topic);
  const basicKeywords = prioritizeKeywords([...contentKeywords, ...topicWords], textContent);
  
  // 2. AI 강화 키워드 생성 (비용 효율적)
  const aiKeywords = generateAIImageKeywords(textContent, query, basicKeywords);
  
  // 3. 기본 + AI 키워드 결합
  const combinedKeywords = combineAndRankKeywords(basicKeywords, aiKeywords);
  
  Logger.log(`AI 강화 키워드: ${combinedKeywords.slice(0, 6).join(", ")}`);
  return combinedKeywords.slice(0, 8);
}

/**
 * AI를 활용한 이미지 검색어 생성 (저비용)
 */
function generateAIImageKeywords(content, query, basicKeywords) {
  const config = getConfig();
  
  // AI 키워드 생성이 활성화된 경우만 (비용 절약)
  if (!config.AI_API_KEY || !config.ENABLE_AI_IMAGE_KEYWORDS) {
    Logger.log("AI 이미지 키워드 비활성화됨 - 기본 방식 사용");
    return [];
  }
  
  try {
    // 간단하고 저렴한 프롬프트
    const shortContent = content.substring(0, 800); // 토큰 절약
    const basicKeywordsList = basicKeywords.slice(0, 5).join(", ");
    
    const prompt = `Blog content: "${shortContent}"

Main topic: "${query}"
Current keywords: ${basicKeywordsList}

Task: Generate 5 highly specific, visual search terms for stock photos that would be PERFECT for this blog post.

Requirements:
- Focus on concrete, photographable objects and scenes
- Avoid abstract concepts like "technology", "innovation", "future"
- Think about what actual photos exist on stock sites
- Consider the EXACT subject matter of the content
- Include specific products, actions, or environments mentioned

Examples of GOOD terms: "person using smartphone camera", "DJI microphone on desk", "content creator recording video"
Examples of BAD terms: "advanced technology", "digital transformation", "modern innovation"

Generate exactly 5 terms (comma-separated): `;

    const aiKeywords = callLowCostAI(prompt);
    return aiKeywords.split(",").map(k => k.trim()).filter(k => k.length > 2);
    
  } catch (error) {
    Logger.log(`AI 이미지 키워드 생성 실패: ${error.message}`);
    return [];
  }
}

/**
 * 저비용 AI 호출 (GPT-3.5-turbo 또는 Gemini Flash)
 */
function callLowCostAI(prompt) {
  const config = getConfig();
  
  const payload = {
    model: "gpt-3.5-turbo", // 매우 저렴한 모델
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100, // 매우 제한적
    temperature: 0.3
  };

  const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.AI_API_KEY}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`AI 호출 실패: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  return data.choices[0].message.content.trim();
}

/**
 * 기본 + AI 키워드 결합 및 순위 매기기
 */
function combineAndRankKeywords(basicKeywords, aiKeywords) {
  const combined = [...basicKeywords.slice(0, 5), ...aiKeywords.slice(0, 4)];
  
  // 중복 제거 및 품질 필터링
  const unique = [...new Set(combined)]
    .filter(keyword => keyword.length >= 3 && keyword.length <= 25)
    .filter(keyword => !/^\d+$/.test(keyword)) // 숫자만 제외
    .slice(0, 8);
  
  return unique;
}

/**
 * HTML에서 텍스트만 추출
 */
function extractTextFromHtml(html) {
  if (!html) return "";
  
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 스크립트 제거
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 스타일 제거
    .replace(/<[^>]*>/g, ' ') // HTML 태그 제거
    .replace(/\s+/g, ' ') // 공백 정리
    .trim();
}

/**
 * 텍스트에서 중요한 단어들 추출
 */
function extractImportantWords(text) {
  if (!text) return [];
  
  // 영어 불용어 (확장된 버전)
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'now', 'here', 'there',
    'also', 'one', 'two', 'first', 'last', 'may', 'might', 'must', 'need', 'use', 'used', 'using', 'make', 'made', 'get', 'got', 'take', 'taken'
  ]);
  
  // 단어 분리 및 정리
  const words = text.toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '')) // 특수문자 제거
    .filter(word => word.length >= 3) // 3글자 이상
    .filter(word => !stopWords.has(word)) // 불용어 제거
    .filter(word => !/^\d+$/.test(word)); // 숫자만인 것 제외
  
  // 빈도 계산
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // 빈도순으로 정렬하여 상위 키워드 반환
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * 쿼리에서 단어 추출
 */
function extractWordsFromQuery(query) {
  if (!query) return [];
  
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3);
  
  return [...new Set(words)];
}

/**
 * 키워드 우선순위 결정
 */
function prioritizeKeywords(keywords, fullText) {
  if (!keywords.length) return [];
  
  // 텍스트 내 빈도와 중요도를 고려한 점수 계산
  return keywords
    .map(keyword => {
      const frequency = (fullText.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      const score = frequency + (keyword.length > 5 ? 2 : 0); // 긴 단어에 가산점
      return { keyword, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.keyword);
}

/**
 * 이미지 검색에 적합한 검색어로 변환
 */
function convertToImageSearchTerms(keywords, originalQuery) {
  const searchTerms = [];
  
  // 1. 단일 키워드들 추가
  keywords.slice(0, 5).forEach(keyword => {
    searchTerms.push(keyword);
  });
  
  // 2. 조합 키워드 생성
  const topKeywords = keywords.slice(0, 3);
  for (let i = 0; i < topKeywords.length - 1; i++) {
    searchTerms.push(`${topKeywords[i]} ${topKeywords[i + 1]}`);
  }
  
  // 3. 원본 쿼리의 핵심 단어들 추가
  const queryWords = extractWordsFromQuery(originalQuery);
  queryWords.slice(0, 2).forEach(word => {
    if (!searchTerms.includes(word)) {
      searchTerms.push(word);
    }
  });
  
  // 4. 중복 제거 및 정리
  return [...new Set(searchTerms)]
    .filter(term => term && term.length > 2)
    .slice(0, 8);
}

/**
 * 스마트 이미지 검색 키워드 생성 (기존 방식)
 */
function generateSmartImageKeywords(query, topic = "") {
  const keywords = [];
  
  // 1. 원본 쿼리 정리
  let cleanQuery = query.toLowerCase()
    .replace(/[?!.,]/g, '') // 특수문자 제거
    .replace(/\s+/g, ' ') // 공백 정리
    .trim();
  
  // 2. 한글 키워드 영어 변환
  const englishQuery = translateToEnglish(cleanQuery);
  
  // 3. 주제별 특화 키워드 맵핑
  const topicKeywords = getTopicSpecificKeywords(englishQuery, topic);
  keywords.push(...topicKeywords);
  
  // 4. 핵심 명사 추출
  const coreKeywords = extractCoreKeywords(englishQuery);
  keywords.push(...coreKeywords);
  
  // 5. 일반적인 시각적 키워드 추가
  const visualKeywords = getVisualKeywords(englishQuery);
  keywords.push(...visualKeywords);
  
  // 6. 중복 제거 및 우선순위 정렬
  const uniqueKeywords = [...new Set(keywords)];
  
  // 길이 제한 (너무 긴 키워드는 효과적이지 않음)
  return uniqueKeywords
    .filter(k => k.length > 2 && k.length < 30)
    .slice(0, 8); // 최대 8개 키워드
}

/**
 * 주제별 특화 키워드 생성
 */
function getTopicSpecificKeywords(query, topic) {
  const keywords = [];
  const queryLower = query.toLowerCase();
  const topicLower = topic.toLowerCase();
  
  // 기술/카메라 관련
  if (queryLower.includes('camera') || queryLower.includes('fx3') || topicLower.includes('camera')) {
    keywords.push('professional camera', 'photography equipment', 'video camera', 'camera lens', 'photographer working');
  }
  
  // AI 관련
  if (queryLower.includes('ai') || queryLower.includes('artificial intelligence')) {
    keywords.push('futuristic technology', 'digital innovation', 'robot hands', 'data visualization', 'modern technology');
  }
  
  // 비즈니스 관련
  if (queryLower.includes('business') || queryLower.includes('investment') || queryLower.includes('finance')) {
    keywords.push('business meeting', 'office workspace', 'financial charts', 'professional team', 'modern office');
  }
  
  // 라이프스타일 관련
  if (queryLower.includes('lifestyle') || queryLower.includes('health') || queryLower.includes('wellness')) {
    keywords.push('healthy lifestyle', 'wellness concept', 'people exercising', 'balanced life', 'self care');
  }
  
  // 교육 관련
  if (queryLower.includes('education') || queryLower.includes('learning') || queryLower.includes('study')) {
    keywords.push('students learning', 'education concept', 'books and laptop', 'online learning', 'knowledge sharing');
  }
  
  return keywords;
}

/**
 * 핵심 명사 추출
 */
function extractCoreKeywords(query) {
  const keywords = [];
  const words = query.split(' ');
  
  // 중요한 단어들 (명사, 형용사)
  const importantWords = words.filter(word => {
    return word.length > 3 && 
           !['when', 'what', 'where', 'how', 'why', 'will', 'would', 'should', 'could'].includes(word) &&
           !['the', 'and', 'or', 'but', 'for', 'with', 'from'].includes(word);
  });
  
  // 개별 단어
  keywords.push(...importantWords);
  
  // 2단어 조합
  for (let i = 0; i < importantWords.length - 1; i++) {
    keywords.push(`${importantWords[i]} ${importantWords[i + 1]}`);
  }
  
  return keywords;
}

/**
 * 시각적 키워드 생성
 */
function getVisualKeywords(query) {
  const keywords = [];
  const queryLower = query.toLowerCase();
  
  // 일반적인 시각적 보완 키워드
  if (queryLower.includes('future') || queryLower.includes('innovation')) {
    keywords.push('futuristic concept', 'innovation visualization', 'abstract technology');
  }
  
  if (queryLower.includes('trend') || queryLower.includes('latest')) {
    keywords.push('modern design', 'contemporary style', 'trending concept');
  }
  
  if (queryLower.includes('guide') || queryLower.includes('how to')) {
    keywords.push('step by step', 'tutorial concept', 'learning process');
  }
  
  // 감정적 키워드
  keywords.push('professional concept', 'success visualization', 'achievement concept');
  
  return keywords;
}

/**
 * 간단한 한→영 키워드 매핑
 */
function translateToEnglish(koreanText) {
  const translations = {
    "인공지능": "artificial intelligence",
    "AI": "artificial intelligence",
    "기술": "technology",
    "블록체인": "blockchain",
    "스마트폰": "smartphone",
    "쇼핑": "shopping",
    "건강": "health",
    "라이프스타일": "lifestyle",
    "재택근무": "remote work",
    "투자": "investment",
    "여행": "travel",
    "요리": "cooking",
    "마케팅": "marketing",
    "트렌드": "trend",
    "뉴스": "news",
    "경제": "economy",
    "비즈니스": "business",
    "교육": "education",
    "환경": "environment",
    "엔터테인먼트": "entertainment"
  };
  
  let result = koreanText.toLowerCase();
  
  // 매핑된 키워드 변환
  for (const [korean, english] of Object.entries(translations)) {
    if (result.includes(korean.toLowerCase())) {
      return english;
    }
  }
  
  // 매핑되지 않은 경우 그대로 반환 (영어일 수도 있음)
  return result;
}

/**
 * HTML에 섹션별 이미지 삽입 (최적화 버전 - 최대 4개 이미지)
 */
function injectSectionImages(html, mainTitle, subtopics = []) {
  if (!html) return html;
  
  let result = html;
  
  // 메인 타이틀 이미지 (블로그 전체 내용 기반)
  const mainImage = findImage(mainTitle, mainTitle, html);
  const mainImageHtml = `
<figure style="margin: 20px 0; text-align: center;">
  <img src="${mainImage.url}" alt="${mainImage.alt}" style="max-width: 100%; height: auto; border-radius: 8px;">
  <figcaption style="font-size: 0.9em; color: #666; margin-top: 8px;">
    ${generateImageAttribution(mainImage)}
  </figcaption>
</figure>`;
  
  // 첫 번째 문단 뒤에 메인 이미지 삽입
  const firstParagraph = result.match(/<p[^>]*>.*?<\/p>/i);
  if (firstParagraph) {
    result = result.replace(firstParagraph[0], firstParagraph[0] + mainImageHtml);
  } else {
    // 문단이 없으면 처음에 삽입
    result = mainImageHtml + result;
  }
  
  // H2/H3 헤딩 중 최대 3개만 선택하여 이미지 삽입 (시간 절약)
  const headingRegex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
  let match;
  const headings = [];
  
  while ((match = headingRegex.exec(html)) !== null) {
    const headingText = match[2].replace(/<[^>]*>/g, '').trim();
    if (headingText) {
      headings.push({
        original: match[0],
        text: headingText,
        index: match.index
      });
    }
  }
  
  // 최대 3개 헤딩만 처리
  const selectedHeadings = headings.slice(0, 3);
  const replacements = [];
  
  for (const heading of selectedHeadings) {
    // 간단한 키워드로만 이미지 검색 (속도 개선)
    const sectionImage = findImage(heading.text, mainTitle, "");
    
    const sectionImageHtml = `
${heading.original}
<figure style="margin: 20px 0; text-align: center;">
  <img src="${sectionImage.url}" alt="${sectionImage.alt}" style="max-width: 100%; height: auto; border-radius: 8px;">
  <figcaption style="font-size: 0.9em; color: #666; margin-top: 8px;">
    ${generateImageAttribution(sectionImage)}
  </figcaption>
</figure>`;
    
    replacements.push({
      original: heading.original,
      replacement: sectionImageHtml
    });
  }
  
  // 교체 실행 (역순으로 하여 인덱스 문제 방지)
  for (let i = replacements.length - 1; i >= 0; i--) {
    const replacement = replacements[i];
    result = result.replace(replacement.original, replacement.replacement);
  }
  
  Logger.log(`이미지 삽입 완료: 메인 1개 + 섹션 ${selectedHeadings.length}개`);
  return result;
}

/**
 * 섹션 내용 추출 (헤딩 다음부터 다음 헤딩까지) - 개선된 버전
 */
function extractSectionContent(html, headingIndex) {
  if (!html || headingIndex < 0) return "";
  
  // 헤딩 위치부터 시작
  const afterHeading = html.substring(headingIndex);
  
  // 다음 헤딩(h1-h3)을 찾거나 문서 끝까지
  const nextHeadingMatch = afterHeading.match(/<h[1-3][^>]*>/i);
  const endIndex = nextHeadingMatch ? nextHeadingMatch.index : afterHeading.length;
  
  let sectionHtml = afterHeading.substring(0, endIndex);
  
  // HTML 태그 제거하여 순수 텍스트만 추출
  const cleanText = sectionHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 핵심 명사와 동사 추출 (제품명, 브랜드명, 동작 등)
  const importantTerms = extractVisualTerms(cleanText);
  
  // 원본 텍스트와 핵심 용어를 조합
  const result = cleanText.substring(0, 300) + " " + importantTerms.join(" ");
  
  return result;
}

/**
 * 시각적으로 표현 가능한 용어들 추출
 */
function extractVisualTerms(text) {
  const visualTerms = [];
  
  // 제품/브랜드명 패턴 (대문자로 시작하는 단어들)
  const brands = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]*)*\b/g) || [];
  brands.forEach(brand => {
    if (brand.length > 2 && brand.length < 20) {
      visualTerms.push(brand);
    }
  });
  
  // 기술 용어들 (iPhone, MacBook, camera, microphone 등)
  const techTerms = text.match(/\b(?:iPhone|MacBook|iPad|camera|microphone|laptop|smartphone|headphones|speaker|monitor|keyboard|mouse)\b/gi) || [];
  visualTerms.push(...techTerms);
  
  // 동작 관련 용어들
  const actions = text.match(/\b(?:recording|filming|editing|streaming|broadcasting|reviewing|testing|using|holding|wearing)\b/gi) || [];
  visualTerms.push(...actions);
  
  // 환경/장소 관련 용어들  
  const environments = text.match(/\b(?:studio|office|desk|workspace|home|outdoor|indoor|setup|room)\b/gi) || [];
  visualTerms.push(...environments);
  
  return [...new Set(visualTerms)].slice(0, 10); // 중복 제거, 최대 10개
}

/**
 * URL에서 도메인명 추출 (Google Images 출처 표기용)
 */
function extractDomain(url) {
  try {
    if (url.startsWith('www.')) {
      return url.replace('www.', '');
    }
    return url.replace(/^https?:\/\/(?:www\.)?/, '').split('/')[0];
  } catch (error) {
    return url || 'Unknown Source';
  }
}

/**
 * ProductNames 기반 Featured Image 검색 (고품질 이미지 우선)
 */
function findFeaturedImageForProduct(productNames, postTitle = "") {
  if (!productNames || productNames.trim() === "") {
    Logger.log("⚠️ ProductNames가 없음 - 일반 Featured Image 검색");
    return findImage(postTitle, postTitle);
  }

  const config = getConfig();
  
  // ProductNames를 개별 제품으로 분리
  const products = productNames.split(/[,|;]/)
    .map(name => name.trim())
    .filter(name => name.length > 0);

  Logger.log(`🎯 Featured Image 검색 대상 제품: ${products.join(", ")}`);

  // 첫 번째 제품을 메인으로 사용
  const primaryProduct = products[0];
  
  // 제품 중심의 키워드 생성
  const productKeywords = [
    primaryProduct,
    `${primaryProduct} product`,
    `${primaryProduct} review`,
    `${primaryProduct} unboxing`,
    `${primaryProduct} photography`,
    `professional ${primaryProduct}`,
    `${primaryProduct} lifestyle`
  ];

  Logger.log(`🔍 제품 중심 키워드: ${productKeywords.slice(0, 3).join(", ")}`);

  // Google Images 최우선 (제품 이미지에 최적)
  for (const keyword of productKeywords.slice(0, 3)) {
    if (config.GOOGLE_API_KEY && config.GOOGLE_SEARCH_ENGINE_ID) {
      Logger.log(`🌐 Google Images 제품 검색: ${keyword}`);
      const googleImage = searchGoogleImages(keyword, config.GOOGLE_API_KEY, config.GOOGLE_SEARCH_ENGINE_ID, `featured-${primaryProduct}`);
      if (googleImage) {
        Logger.log(`✅ 제품 Featured Image 검색 성공 (Google): ${keyword} from ${googleImage.originalSource}`);
        return googleImage;
      }
    }

    // Pexels 폴백 (제품 사진 품질 좋음)
    if (config.PEXELS_API_KEY) {
      const pexelsImage = searchPexelsImageFast(keyword, config.PEXELS_API_KEY, `featured-${primaryProduct}`);
      if (pexelsImage) {
        Logger.log(`✅ 제품 Featured Image 검색 성공 (Pexels): ${keyword}`);
        return pexelsImage;
      }
    }

    // Unsplash 최종 폴백
    if (config.UNSPLASH_API_KEY) {
      const unsplashImage = searchUnsplashImage(keyword, config.UNSPLASH_API_KEY);
      if (unsplashImage) {
        Logger.log(`✅ 제품 Featured Image 검색 성공 (Unsplash): ${keyword}`);
        return unsplashImage;
      }
    }
  }

  // 제품 이미지를 찾지 못한 경우 일반 검색으로 폴백
  Logger.log("⚠️ 제품별 이미지를 찾지 못함 - 일반 검색으로 폴백");
  return findImage(postTitle, postTitle);
}

/**
 * 제품명에서 브랜드와 모델 분리
 */
function parseProductName(productName) {
  if (!productName) return { brand: "", model: "", full: "" };
  
  const name = productName.trim();
  const words = name.split(/\s+/);
  
  if (words.length === 1) {
    return { brand: words[0], model: "", full: name };
  }
  
  // 첫 번째 단어를 브랜드로, 나머지를 모델로 간주
  const brand = words[0];
  const model = words.slice(1).join(" ");
  
  return { brand, model, full: name };
}

/**
 * 이미지 출처 표기 생성 (소스별 최적화)
 */
function generateImageAttribution(imageData) {
  if (!imageData) return 'Image source unknown';
  
  switch (imageData.source) {
    case 'pexels':
      return `Photo by <strong>${imageData.photographer}</strong> on <a href="https://pexels.com" target="_blank" rel="noopener">Pexels</a>`;
      
    case 'unsplash':
      return `Photo by <strong>${imageData.photographer}</strong> on <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>`;
      
    case 'placeholder':
      return `Placeholder image`;
      
    default:
      // Google Images 등 기타 소스
      if (imageData.contextLink && imageData.originalSource) {
        return `Image from <a href="${imageData.contextLink}" target="_blank" rel="noopener"><strong>${imageData.originalSource}</strong></a> ${imageData.source ? `(${imageData.source})` : ''}`;
      } else if (imageData.originalSource) {
        return `Image from <strong>${imageData.originalSource}</strong> ${imageData.source ? `(${imageData.source})` : ''}`;
      } else {
        return `Photo by <strong>${imageData.photographer || 'Unknown'}</strong> ${imageData.source ? `on ${imageData.source}` : ''}`;
      }
  }
}