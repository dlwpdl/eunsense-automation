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
 * 스마트 이미지 검색 (블로그 내용 기반)
 */
function findImage(query, topic = "", blogContent = "") {
  const config = getConfig();
  
  // 블로그 내용 기반 키워드 추출
  const searchKeywords = blogContent 
    ? generateContentBasedKeywords(query, topic, blogContent)
    : generateSmartImageKeywords(query, topic);
    
  Logger.log(`이미지 검색 키워드: ${searchKeywords.join(", ")}`);
  
  // 여러 키워드로 시도 (품질 검증 포함)
  const candidateImages = [];
  
  for (const keyword of searchKeywords) {
    // Pexels 우선 시도
    if (config.PEXELS_API_KEY) {
      const pexelsImages = searchMultiplePexelsImages(keyword, config.PEXELS_API_KEY, topic);
      candidateImages.push(...pexelsImages.map(img => ({...img, keyword})));
    }
    
    // Unsplash 폴백 (API 키가 있는 경우)  
    if (config.UNSPLASH_API_KEY) {
      const unsplashImages = searchMultipleUnsplashImages(keyword, config.UNSPLASH_API_KEY);
      candidateImages.push(...unsplashImages.map(img => ({...img, keyword})));
    }
  }
  
  // 최고 품질 이미지 선택
  if (candidateImages.length > 0) {
    const bestImage = selectBestImage(candidateImages, query, blogContent);
    Logger.log(`최고 품질 이미지 선택됨 (${bestImage.source}): ${bestImage.keyword}`);
    return bestImage;
  }
  
  // 기본 이미지 (최종 폴백)
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
 * HTML에 섹션별 이미지 삽입 (내용 기반 키워드 사용)
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
    Photo by ${mainImage.photographer} on ${mainImage.source}
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
  
  // H2/H3 헤딩 뒤에 관련 이미지 삽입
  const headingRegex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
  let match;
  const replacements = [];
  
  while ((match = headingRegex.exec(html)) !== null) {
    const headingText = match[2].replace(/<[^>]*>/g, '').trim();
    if (headingText) {
      // 섹션별로 해당 섹션 내용을 기반으로 이미지 검색
      const sectionContent = extractSectionContent(html, match.index);
      const sectionImage = findImage(headingText, mainTitle, sectionContent);
      
      const sectionImageHtml = `
${match[0]}
<figure style="margin: 20px 0; text-align: center;">
  <img src="${sectionImage.url}" alt="${sectionImage.alt}" style="max-width: 100%; height: auto; border-radius: 8px;">
  <figcaption style="font-size: 0.9em; color: #666; margin-top: 8px;">
    Photo by ${sectionImage.photographer} on ${sectionImage.source}
  </figcaption>
</figure>`;
      
      replacements.push({
        original: match[0],
        replacement: sectionImageHtml
      });
    }
  }
  
  // 교체 실행 (역순으로 하여 인덱스 문제 방지)
  for (let i = replacements.length - 1; i >= 0; i--) {
    const replacement = replacements[i];
    result = result.replace(replacement.original, replacement.replacement);
  }
  
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