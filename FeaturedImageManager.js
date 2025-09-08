/**
 * 🖼️ WordPress Featured Image 관리 시스템
 * 고화질 이미지 선별, 업로드, Featured Image 자동 설정
 */

/**
 * 이미지 품질 기준 설정
 */
const IMAGE_QUALITY_STANDARDS = {
  MIN_WIDTH: 1200,        // 최소 가로 해상도
  MIN_HEIGHT: 630,        // 최소 세로 해상도 (1200x630 = 1.9:1 비율, SNS 최적)
  PREFERRED_WIDTH: 1920,  // 선호 가로 해상도
  PREFERRED_HEIGHT: 1080, // 선호 세로 해상도
  MAX_FILE_SIZE_MB: 5,    // 최대 파일 크기
  MIN_FILE_SIZE_KB: 50,   // 최소 파일 크기 (너무 작은 이미지 제외)
  PREFERRED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  ASPECT_RATIOS: {
    'landscape': { min: 1.5, max: 2.1, score: 1.0 },  // 가로형 (16:9, 1.91:1)
    'square': { min: 0.9, max: 1.1, score: 0.7 },     // 정사각형
    'portrait': { min: 0.4, max: 0.67, score: 0.5 }   // 세로형
  }
};

/**
 * 향상된 Featured Image 검색 및 설정
 */
function findAndSetFeaturedImage(topic, postTitle, postId = null) {
  Logger.log(`🖼️ Featured Image 검색 시작: ${topic}`);
  
  return trackExecutionMetrics('featured_image_search', () => {
    // 캐시에서 먼저 확인
    const cacheKey = `featured_image_${topic}`;
    let featuredImage = cacheManager.get(cacheKey);
    
    if (!featuredImage) {
      // 고화질 이미지 검색
      featuredImage = _searchHighQualityImage(topic, postTitle);
      
      if (featuredImage) {
        // 캐시에 저장 (24시간)
        cacheManager.set(cacheKey, featuredImage, 24 * 60 * 60 * 1000);
      }
    } else {
      Logger.log(`💾 Featured Image 캐시 사용: ${topic}`);
    }
    
    if (!featuredImage) {
      Logger.log(`❌ Featured Image를 찾을 수 없습니다: ${topic}`);
      return null;
    }
    
    // WordPress에 Featured Image 설정 (postId가 있는 경우)
    if (postId && featuredImage.url) {
      const mediaId = _uploadAndSetFeaturedImage(postId, featuredImage);
      if (mediaId) {
        featuredImage.mediaId = mediaId;
        Logger.log(`✅ Featured Image 설정 완료: Post ${postId}, Media ${mediaId}`);
      }
    }
    
    return featuredImage;
    
  }, { topic, hasPostId: !!postId });
}

/**
 * 고화질 이미지 검색 (다중 소스)
 */
function _searchHighQualityImage(topic, postTitle) {
  const searchTerms = _generateImageSearchTerms(topic, postTitle);
  Logger.log(`🔍 이미지 검색 키워드: ${searchTerms.join(', ')}`);
  
  const allImages = [];
  
  // 1. Pexels 검색 (고화질 우선)
  for (const term of searchTerms.slice(0, 3)) {
    const pexelsImages = _searchPexelsImages(term);
    allImages.push(...pexelsImages);
  }
  
  // 2. Unsplash 검색 (Pexels 결과가 부족한 경우)
  if (allImages.length < 5) {
    for (const term of searchTerms.slice(0, 2)) {
      const unsplashImages = _searchUnsplashImages(term);
      allImages.push(...unsplashImages);
    }
  }
  
  // 3. Google Images 검색 (폴백)
  if (allImages.length < 3) {
    const googleImages = _searchGoogleImages(searchTerms[0]);
    allImages.push(...googleImages);
  }
  
  if (allImages.length === 0) {
    Logger.log("❌ 모든 소스에서 이미지를 찾을 수 없습니다");
    return null;
  }
  
  // 이미지 품질 평가 및 최적 이미지 선택
  const qualityImages = _evaluateImageQuality(allImages);
  const bestImage = _selectBestImage(qualityImages);
  
  Logger.log(`🎯 최적 이미지 선택: ${bestImage.url} (품질점수: ${bestImage.qualityScore})`);
  return bestImage;
}

/**
 * 이미지 검색 키워드 생성
 */
function _generateImageSearchTerms(topic, postTitle) {
  const terms = new Set();
  
  // 기본 토픽
  terms.add(topic);
  
  // 토픽에서 핵심 키워드 추출
  const topicWords = topic.toLowerCase().split(' ');
  const importantWords = topicWords.filter(word => 
    word.length > 3 && 
    !['the', 'and', 'for', 'with', 'guide', 'tips', 'how', 'best'].includes(word)
  );
  
  // 핵심 키워드 조합
  if (importantWords.length > 1) {
    terms.add(importantWords.slice(0, 2).join(' '));
  }
  
  // 포스트 제목에서 키워드 추출
  if (postTitle && postTitle !== topic) {
    const titleWords = postTitle.toLowerCase().split(' ');
    const titleImportant = titleWords.filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'with'].includes(word)
    );
    
    if (titleImportant.length > 0) {
      terms.add(titleImportant[0]);
    }
  }
  
  // 고품질 이미지를 위한 전문 키워드 추가
  const professionalTerms = [
    `${importantWords[0]} professional`,
    `${importantWords[0]} high quality`,
    `${importantWords[0]} modern`,
    `${importantWords[0]} business`
  ];
  
  professionalTerms.forEach(term => terms.add(term));
  
  return Array.from(terms).filter(term => term.length > 3);
}

/**
 * Pexels 고화질 이미지 검색
 */
function _searchPexelsImages(query) {
  const config = getEnhancedConfig();
  const apiKey = config.PEXELS_API_KEY;
  
  if (!apiKey) {
    Logger.log("⚠️ Pexels API 키가 설정되지 않음");
    return [];
  }
  
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
    
    const response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': apiKey },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Pexels API 오류: ${response.getResponseCode()}`);
    }
    
    const data = JSON.parse(response.getContentText());
    const images = [];
    
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach(photo => {
        // 고화질 이미지 우선 (large, medium 사이즈 사용)
        const imageUrl = photo.src.large || photo.src.medium || photo.src.original;
        
        images.push({
          url: imageUrl,
          width: photo.width,
          height: photo.height,
          source: 'pexels',
          photographer: photo.photographer,
          alt: photo.alt || query,
          originalUrl: photo.url,
          id: photo.id
        });
      });
    }
    
    Logger.log(`✅ Pexels에서 ${images.length}개 이미지 수집: ${query}`);
    return images;
    
  } catch (error) {
    Logger.log(`❌ Pexels 검색 실패: ${error.message}`);
    return [];
  }
}

/**
 * Unsplash 이미지 검색
 */
function _searchUnsplashImages(query) {
  const config = getEnhancedConfig();
  const apiKey = config.UNSPLASH_API_KEY;
  
  if (!apiKey) {
    Logger.log("⚠️ Unsplash API 키가 설정되지 않음");
    return [];
  }
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;
    
    const response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': `Client-ID ${apiKey}` },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Unsplash API 오류: ${response.getResponseCode()}`);
    }
    
    const data = JSON.parse(response.getContentText());
    const images = [];
    
    if (data.results && data.results.length > 0) {
      data.results.forEach(photo => {
        // 고화질 이미지 선택
        const imageUrl = photo.urls.regular || photo.urls.small;
        
        images.push({
          url: imageUrl,
          width: photo.width,
          height: photo.height,
          source: 'unsplash',
          photographer: photo.user.name,
          alt: photo.alt_description || query,
          originalUrl: photo.links.html,
          id: photo.id
        });
      });
    }
    
    Logger.log(`✅ Unsplash에서 ${images.length}개 이미지 수집: ${query}`);
    return images;
    
  } catch (error) {
    Logger.log(`❌ Unsplash 검색 실패: ${error.message}`);
    return [];
  }
}

/**
 * Google Images 검색 (폴백)
 */
function _searchGoogleImages(query) {
  const config = getEnhancedConfig();
  const apiKey = config.GOOGLE_API_KEY;
  const searchEngineId = config.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    Logger.log("⚠️ Google Images API 키가 설정되지 않음");
    return [];
  }
  
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&imgSize=large&num=8`;
    
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Google Images API 오류: ${response.getResponseCode()}`);
    }
    
    const data = JSON.parse(response.getContentText());
    const images = [];
    
    if (data.items) {
      data.items.forEach(item => {
        images.push({
          url: item.link,
          width: parseInt(item.image.width) || 1200,
          height: parseInt(item.image.height) || 630,
          source: 'google',
          alt: item.title || query,
          originalUrl: item.image.contextLink,
          id: item.cacheId
        });
      });
    }
    
    Logger.log(`✅ Google Images에서 ${images.length}개 이미지 수집: ${query}`);
    return images;
    
  } catch (error) {
    Logger.log(`❌ Google Images 검색 실패: ${error.message}`);
    return [];
  }
}

/**
 * 이미지 품질 평가
 */
function _evaluateImageQuality(images) {
  Logger.log(`📊 ${images.length}개 이미지 품질 평가 시작`);
  
  const qualityImages = images.map(image => {
    let qualityScore = 0;
    const details = [];
    
    // 1. 해상도 평가 (40%)
    const resolutionScore = _evaluateResolution(image.width, image.height);
    qualityScore += resolutionScore * 0.4;
    details.push(`해상도: ${resolutionScore.toFixed(2)}`);
    
    // 2. 종횡비 평가 (25%)
    const aspectScore = _evaluateAspectRatio(image.width, image.height);
    qualityScore += aspectScore * 0.25;
    details.push(`비율: ${aspectScore.toFixed(2)}`);
    
    // 3. 소스 신뢰도 (20%)
    const sourceScore = _evaluateImageSource(image.source);
    qualityScore += sourceScore * 0.2;
    details.push(`소스: ${sourceScore.toFixed(2)}`);
    
    // 4. Alt 텍스트 품질 (15%)
    const altScore = _evaluateAltText(image.alt);
    qualityScore += altScore * 0.15;
    details.push(`Alt: ${altScore.toFixed(2)}`);
    
    return {
      ...image,
      qualityScore: Math.round(qualityScore * 100) / 100,
      qualityDetails: details
    };
  });
  
  // 품질 점수로 정렬 (높은 순)
  qualityImages.sort((a, b) => b.qualityScore - a.qualityScore);
  
  Logger.log("🎯 품질 평가 상위 5개:");
  qualityImages.slice(0, 5).forEach((img, i) => {
    Logger.log(`  ${i+1}. ${img.qualityScore} - ${img.width}x${img.height} (${img.source})`);
  });
  
  return qualityImages;
}

/**
 * 해상도 평가
 */
function _evaluateResolution(width, height) {
  const standards = IMAGE_QUALITY_STANDARDS;
  
  // 최소 해상도 미달
  if (width < standards.MIN_WIDTH || height < standards.MIN_HEIGHT) {
    return 0.1;
  }
  
  // 선호 해상도 달성
  if (width >= standards.PREFERRED_WIDTH && height >= standards.PREFERRED_HEIGHT) {
    return 1.0;
  }
  
  // 해상도에 따른 점진적 점수
  const widthScore = Math.min(width / standards.PREFERRED_WIDTH, 1);
  const heightScore = Math.min(height / standards.PREFERRED_HEIGHT, 1);
  
  return (widthScore + heightScore) / 2;
}

/**
 * 종횡비 평가
 */
function _evaluateAspectRatio(width, height) {
  const ratio = width / height;
  const ratios = IMAGE_QUALITY_STANDARDS.ASPECT_RATIOS;
  
  // 각 비율 카테고리에 대해 평가
  for (const [category, range] of Object.entries(ratios)) {
    if (ratio >= range.min && ratio <= range.max) {
      return range.score;
    }
  }
  
  // 어느 범주에도 속하지 않으면 낮은 점수
  return 0.3;
}

/**
 * 이미지 소스 평가
 */
function _evaluateImageSource(source) {
  const sourceScores = {
    'pexels': 1.0,      // 최고품질 무료 스톡
    'unsplash': 0.95,   // 고품질 무료 스톡
    'google': 0.7,      // 일반 검색 결과
    'default': 0.5      // 기타
  };
  
  return sourceScores[source] || sourceScores.default;
}

/**
 * Alt 텍스트 품질 평가
 */
function _evaluateAltText(altText) {
  if (!altText || altText.length < 5) return 0.1;
  
  let score = 0.5; // 기본 점수
  
  // 적절한 길이
  if (altText.length >= 10 && altText.length <= 125) score += 0.3;
  
  // 의미있는 단어 수
  const words = altText.split(' ').filter(word => word.length > 2);
  if (words.length >= 3) score += 0.2;
  
  return Math.min(score, 1.0);
}

/**
 * 최적 이미지 선택
 */
function _selectBestImage(qualityImages) {
  if (qualityImages.length === 0) return null;
  
  // 기본적으로는 품질 점수가 가장 높은 이미지 선택
  let bestImage = qualityImages[0];
  
  // 하지만 최소 품질 기준을 만족하는 이미지만 선택
  if (bestImage.qualityScore < 0.4) {
    Logger.log("⚠️ 모든 이미지가 최소 품질 기준 미달");
    return null;
  }
  
  // 중복 방지를 위한 사용된 이미지 확인
  const usedImages = getUsedImages();
  const availableImages = qualityImages.filter(img => !usedImages.includes(img.url));
  
  if (availableImages.length > 0) {
    bestImage = availableImages[0];
    Logger.log(`🔄 사용된 이미지 제외, 다음 최적 이미지 선택: ${bestImage.qualityScore}`);
  }
  
  // 사용된 이미지로 기록
  addUsedImage(bestImage.url, bestImage.alt);
  
  return bestImage;
}

/**
 * WordPress에 Featured Image 업로드 및 설정
 */
function _uploadAndSetFeaturedImage(postId, imageData) {
  Logger.log(`📤 Featured Image 업로드 시작: Post ${postId}`);
  
  try {
    const config = getEnhancedConfig();
    const client = createWordPressClient(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    
    // 1. 이미지 다운로드 및 검증
    const imageBlob = _downloadAndValidateImage(imageData.url);
    if (!imageBlob) {
      Logger.log("❌ 이미지 다운로드 실패");
      return null;
    }
    
    // 2. WordPress 미디어 라이브러리에 업로드
    const filename = _generateImageFilename(imageData);
    const mediaData = _uploadToWordPressMedia(client, imageBlob, filename, imageData);
    
    if (!mediaData || !mediaData.id) {
      Logger.log("❌ WordPress 미디어 업로드 실패");
      return null;
    }
    
    // 3. 포스트에 Featured Image 설정
    const success = _setPostFeaturedMedia(client, postId, mediaData.id);
    
    if (success) {
      Logger.log(`✅ Featured Image 설정 완료: Media ${mediaData.id} → Post ${postId}`);
      return mediaData.id;
    } else {
      Logger.log("❌ Featured Image 설정 실패");
      return null;
    }
    
  } catch (error) {
    Logger.log(`❌ Featured Image 업로드 오류: ${error.message}`);
    return null;
  }
}

/**
 * 이미지 다운로드 및 검증
 */
function _downloadAndValidateImage(imageUrl) {
  try {
    const response = UrlFetchApp.fetch(imageUrl, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`이미지 다운로드 실패: HTTP ${response.getResponseCode()}`);
    }
    
    const contentType = response.getHeaders()['Content-Type'] || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`잘못된 파일 형식: ${contentType}`);
    }
    
    const blob = response.getBlob();
    const sizeBytes = blob.getBytes().length;
    const sizeMB = sizeBytes / (1024 * 1024);
    
    // 파일 크기 검증
    if (sizeMB > IMAGE_QUALITY_STANDARDS.MAX_FILE_SIZE_MB) {
      throw new Error(`파일이 너무 큼: ${sizeMB.toFixed(2)}MB`);
    }
    
    if (sizeBytes < IMAGE_QUALITY_STANDARDS.MIN_FILE_SIZE_KB * 1024) {
      throw new Error(`파일이 너무 작음: ${Math.round(sizeBytes/1024)}KB`);
    }
    
    Logger.log(`✅ 이미지 다운로드 성공: ${sizeMB.toFixed(2)}MB`);
    return blob;
    
  } catch (error) {
    Logger.log(`❌ 이미지 다운로드 오류: ${error.message}`);
    return null;
  }
}

/**
 * 이미지 파일명 생성
 */
function _generateImageFilename(imageData) {
  const timestamp = Date.now();
  const extension = _getImageExtension(imageData.url);
  const safeName = imageData.alt.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
  
  return `featured-${safeName.substring(0, 30)}-${timestamp}.${extension}`;
}

/**
 * 이미지 확장자 추출
 */
function _getImageExtension(url) {
  const match = url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * WordPress 미디어 라이브러리 업로드
 */
function _uploadToWordPressMedia(client, imageBlob, filename, imageData) {
  try {
    const uploadUrl = `${client.baseUrl}/wp-json/wp/v2/media`;
    
    const response = UrlFetchApp.fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': client.headers.Authorization,
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      payload: imageBlob,
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 201) {
      throw new Error(`미디어 업로드 실패: HTTP ${response.getResponseCode()}`);
    }
    
    const mediaData = JSON.parse(response.getContentText());
    
    // Alt 텍스트 설정 (별도 요청)
    if (imageData.alt) {
      _updateMediaAltText(client, mediaData.id, imageData.alt);
    }
    
    Logger.log(`✅ 미디어 업로드 성공: ${mediaData.id} - ${mediaData.source_url}`);
    return mediaData;
    
  } catch (error) {
    Logger.log(`❌ 미디어 업로드 오류: ${error.message}`);
    return null;
  }
}

/**
 * 포스트 Featured Media 설정
 */
function _setPostFeaturedMedia(client, postId, mediaId) {
  try {
    const updateUrl = `${client.baseUrl}/wp-json/wp/v2/posts/${postId}`;
    
    const response = UrlFetchApp.fetch(updateUrl, {
      method: 'POST',
      headers: client.headers,
      payload: JSON.stringify({ featured_media: mediaId }),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error(`Featured Media 설정 실패: HTTP ${responseCode}`);
    }
    
    Logger.log(`✅ Featured Media 설정 성공: Post ${postId} ← Media ${mediaId}`);
    return true;
    
  } catch (error) {
    Logger.log(`❌ Featured Media 설정 오류: ${error.message}`);
    return false;
  }
}

/**
 * 미디어 Alt 텍스트 업데이트
 */
function _updateMediaAltText(client, mediaId, altText) {
  try {
    const updateUrl = `${client.baseUrl}/wp-json/wp/v2/media/${mediaId}`;
    
    UrlFetchApp.fetch(updateUrl, {
      method: 'POST',
      headers: client.headers,
      payload: JSON.stringify({ alt_text: altText }),
      muteHttpExceptions: true
    });
    
    Logger.log(`✅ Alt 텍스트 설정: Media ${mediaId}`);
    
  } catch (error) {
    Logger.log(`⚠️ Alt 텍스트 설정 실패: ${error.message}`);
  }
}

/**
 * Featured Image 통합 테스트
 */
function testFeaturedImageSystem() {
  Logger.log("🧪 Featured Image 시스템 테스트 시작");
  
  const testCases = [
    { topic: "artificial intelligence trends 2025", title: "AI Technology Guide" },
    { topic: "sustainable energy solutions", title: "Green Energy Review" },
    { topic: "remote work productivity", title: "Work From Home Tips" }
  ];
  
  const results = [];
  
  testCases.forEach((testCase, index) => {
    Logger.log(`\n📋 테스트 케이스 ${index + 1}: ${testCase.topic}`);
    
    const startTime = Date.now();
    
    try {
      const featuredImage = findAndSetFeaturedImage(testCase.topic, testCase.title);
      const duration = Date.now() - startTime;
      
      if (featuredImage) {
        Logger.log(`✅ 테스트 성공: ${featuredImage.url}`);
        Logger.log(`   품질점수: ${featuredImage.qualityScore}`);
        Logger.log(`   해상도: ${featuredImage.width}x${featuredImage.height}`);
        Logger.log(`   소스: ${featuredImage.source}`);
        Logger.log(`   소요시간: ${Math.round(duration/1000)}초`);
        
        results.push({
          ...testCase,
          success: true,
          image: featuredImage,
          duration: duration
        });
      } else {
        Logger.log(`❌ 테스트 실패: 이미지를 찾을 수 없음`);
        results.push({ ...testCase, success: false, duration: duration });
      }
      
    } catch (error) {
      Logger.log(`❌ 테스트 오류: ${error.message}`);
      results.push({ ...testCase, success: false, error: error.message });
    }
  });
  
  // 테스트 요약
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  
  Logger.log("\n📊 Featured Image 테스트 결과:");
  Logger.log(`성공률: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  Logger.log(`평균 소요시간: ${Math.round(avgDuration/1000)}초`);
  
  return {
    success: successCount >= Math.ceil(results.length * 0.7),
    results: results,
    successRate: Math.round(successCount/results.length*100),
    avgDuration: Math.round(avgDuration/1000)
  };
}

/**
 * Featured Image 캐시 관리
 */
function manageFeaturedImageCache() {
  Logger.log("🧹 Featured Image 캐시 관리 시작");
  
  // 만료된 캐시 정리
  const cleaned = cacheManager.deleteByPrefix('featured_image_');
  
  // 캐시 통계
  const stats = cacheManager.getStats();
  const imageCache = stats.byCategory['featured'] || 0;
  
  Logger.log(`📊 Featured Image 캐시 현황:`);
  Logger.log(`  활성 캐시: ${imageCache}개`);
  Logger.log(`  정리된 캐시: ${cleaned}개`);
  
  return { active: imageCache, cleaned: cleaned };
}