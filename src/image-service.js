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
 * 이미지 검색 (폴백 지원)
 */
function findImage(query) {
  const config = getConfig();
  
  // 한국어 검색어를 영어로 간단 변환
  const englishQuery = translateToEnglish(query);
  
  // Pexels 우선 시도
  if (config.PEXELS_API_KEY) {
    const pexelsImage = searchPexelsImage(englishQuery, config.PEXELS_API_KEY);
    if (pexelsImage) return pexelsImage;
  }
  
  // Unsplash 폴백 (API 키가 있는 경우)
  if (config.UNSPLASH_API_KEY) {
    const unsplashImage = searchUnsplashImage(englishQuery, config.UNSPLASH_API_KEY);
    if (unsplashImage) return unsplashImage;
  }
  
  // 기본 이미지 (최종 폴백)
  return getDefaultImage(query);
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
 * HTML에 섹션별 이미지 삽입
 */
function injectSectionImages(html, mainTitle, subtopics = []) {
  if (!html) return html;
  
  let result = html;
  
  // 메인 타이틀 이미지 (첫 번째에 삽입)
  const mainImage = findImage(mainTitle);
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
      const sectionImage = findImage(headingText);
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