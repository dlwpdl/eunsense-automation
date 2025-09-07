/**
 * WordPress REST API 클라이언트 - 공통 기능
 */

/**
 * WordPress API 기본 클라이언트 (함수 기반)
 */
function createWordPressClient(baseUrl, username, appPassword) {
  const client = {
    baseUrl: baseUrl.replace(/\/$/, ''), // 끝 슬래시 제거
    auth: Utilities.base64Encode(`${username}:${appPassword}`),
    headers: {
      'Authorization': `Basic ${Utilities.base64Encode(`${username}:${appPassword}`)}`,
      'Content-Type': 'application/json'
    }
  };

  /**
   * API 요청 공통 메서드
   */
  client.request = function(endpoint, method, data) {
    method = method || 'GET';
    const url = `${client.baseUrl}/wp-json/wp/v2${endpoint}`;
    
    const options = {
      method: method,
      headers: client.headers,
      muteHttpExceptions: true
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.payload = JSON.stringify(data);
    }

    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (responseCode >= 200 && responseCode < 300) {
        try {
          return JSON.parse(responseText);
        } catch (e) {
          return responseText;
        }
      } else {
        throw new Error(`WordPress API 오류 (${responseCode}): ${responseText}`);
      }
    } catch (error) {
      Logger.log(`WordPress API 요청 실패: ${error.message}`);
      throw error;
    }
  };

  /**
   * 연결 테스트
   */
  client.testConnection = function() {
    try {
      client.request('/posts?per_page=1');
      return true;
    } catch (error) {
      Logger.log(`WordPress 연결 실패: ${error.message}`);
      return false;
    }
  };

  /**
   * 이미지 업로드 (미디어 라이브러리)
   */
  client.uploadImage = function(imageUrl, filename) {
    try {
      // 이미지 다운로드
      const imageResponse = UrlFetchApp.fetch(imageUrl, {
        method: 'GET',
        muteHttpExceptions: true
      });
      
      if (imageResponse.getResponseCode() !== 200) {
        throw new Error(`이미지 다운로드 실패: ${imageResponse.getResponseCode()}`);
      }
      
      const imageBlob = imageResponse.getBlob();
      const contentType = imageBlob.getContentType();
      
      // WordPress 미디어 업로드
      const uploadOptions = {
        method: 'POST',
        headers: {
          'Authorization': client.headers.Authorization,
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        payload: imageBlob.getBytes(),
        muteHttpExceptions: true
      };
      
      const uploadUrl = `${client.baseUrl}/wp-json/wp/v2/media`;
      const uploadResponse = UrlFetchApp.fetch(uploadUrl, uploadOptions);
      const uploadCode = uploadResponse.getResponseCode();
      
      if (uploadCode >= 200 && uploadCode < 300) {
        const mediaData = JSON.parse(uploadResponse.getContentText());
        Logger.log(`이미지 업로드 성공: ${mediaData.id} - ${mediaData.source_url}`);
        return mediaData;
      } else {
        throw new Error(`미디어 업로드 실패 (${uploadCode}): ${uploadResponse.getContentText()}`);
      }
    } catch (error) {
      Logger.log(`이미지 업로드 오류: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Featured Image 설정
   */
  client.setFeaturedImage = function(postId, mediaId) {
    try {
      const updateData = { featured_media: mediaId };
      const result = client.request(`/posts/${postId}`, 'POST', updateData);
      Logger.log(`Featured Image 설정 완료: Post ${postId} -> Media ${mediaId}`);
      return result;
    } catch (error) {
      Logger.log(`Featured Image 설정 실패: ${error.message}`);
      throw error;
    }
  };

  return client;
}

/**
 * 포스트 생성 (기존 호환성)
 */
function wpCreatePost({ baseUrl, user, appPass, title, content, status = "publish", categories, tags, format, slug, excerpt }) {
  const client = createWordPressClient(baseUrl, user, appPass);
  
  const payload = {
    title: title,
    content: content,
    status: status
  };
  
  if (categories && categories.length > 0) {
    payload.categories = categories;
  }
  
  if (tags && tags.length > 0) {
    payload.tags = tags;
  }
  
  if (format) {
    payload.format = format;
    Logger.log(`📝 Post Format 설정: ${format}`);
  }
  
  if (slug) {
    payload.slug = slug;
  }
  
  if (excerpt) {
    payload.excerpt = excerpt;
  }
  
  const result = client.request('/posts', 'POST', payload);
  Logger.log(`WordPress 포스트 생성됨: ID ${result.id} (Format: ${format || 'standard'})`);
  return result.id;
}

/**
 * 카테고리 확인/생성 (기존 호환성)
 */
function ensureCategory(baseUrl, user, appPass, categoryName) {
  const client = createWordPressClient(baseUrl, user, appPass);
  
  // 기존 카테고리 검색
  const categories = client.request(`/categories?search=${encodeURIComponent(categoryName)}`);
  const existing = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  
  if (existing) {
    return existing.id;
  }
  
  // 새 카테고리 생성
  const newCategory = client.request('/categories', 'POST', { name: categoryName });
  Logger.log(`새 카테고리 생성: ${categoryName} (ID: ${newCategory.id})`);
  return newCategory.id;
}

/**
 * 태그 확인/생성 (기존 호환성)
 */
function ensureTags(baseUrl, user, appPass, tagsCsv) {
  if (!tagsCsv) return [];
  
  const client = createWordPressClient(baseUrl, user, appPass);
  const tagNames = tagsCsv.split(",").map(tag => tag.trim()).filter(tag => tag);
  const tagIds = [];
  
  for (const tagName of tagNames) {
    // 기존 태그 검색
    const tags = client.request(`/tags?search=${encodeURIComponent(tagName)}`);
    let existingTag = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
    
    if (!existingTag) {
      // 새 태그 생성
      existingTag = client.request('/tags', 'POST', { name: tagName });
      Logger.log(`새 태그 생성: ${tagName} (ID: ${existingTag.id})`);
    }
    
    tagIds.push(existingTag.id);
  }
  
  return tagIds;
}

/**
 * 포스트 URL 생성 (기존 호환성)
 */
function getPostUrl(baseUrl, postId) {
  return `${baseUrl}/?p=${postId}`;
}

/**
 * Featured Image와 함께 포스트 생성
 */
function wpCreatePostWithFeaturedImage({ baseUrl, user, appPass, title, content, status = "publish", categories, tags, format, slug, excerpt, featuredImageUrl, productName }) {
  const client = createWordPressClient(baseUrl, user, appPass);
  
  let postId;
  
  try {
    // 1. 먼저 포스트 생성
    const payload = {
      title: title,
      content: content,
      status: status
    };
    
    if (categories && categories.length > 0) {
      payload.categories = categories;
    }
    
    if (tags && tags.length > 0) {
      payload.tags = tags;
    }
    
    if (format) {
      payload.format = format;
      Logger.log(`📝 Post Format 설정: ${format}`);
    }
    
    if (slug) {
      payload.slug = slug;
    }
    
    if (excerpt) {
      payload.excerpt = excerpt;
    }
    
    const postResult = client.request('/posts', 'POST', payload);
    postId = postResult.id;
    Logger.log(`WordPress 포스트 생성됨: ID ${postId} (Format: ${format || 'standard'})`);
    
    // 2. Featured Image 설정 (이미지 URL이 있는 경우)
    if (featuredImageUrl) {
      try {
        // 방법 1: 직접 업로드 시도
        const filename = productName 
          ? `${productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-featured.jpg`
          : `post-${postId}-featured.jpg`;
        
        Logger.log(`🖼️ Featured Image 업로드 시도: ${featuredImageUrl}`);
        
        try {
          // 이미지 업로드 시도
          const mediaData = client.uploadImage(featuredImageUrl, filename);
          Logger.log(`📤 미디어 업로드 성공: ID ${mediaData.id}`);
          
          // Featured Image 설정
          client.setFeaturedImage(postId, mediaData.id);
          Logger.log(`✅ Featured Image 설정 완료: ${mediaData.source_url}`);
        } catch (uploadError) {
          // 업로드 실패 시 포스트 본문 맨 위에 이미지 추가
          Logger.log(`⚠️ 미디어 업로드 실패, 본문에 이미지 추가: ${uploadError.message}`);
          
          const imageHtml = `<div style="text-align: center; margin: 20px 0;">
  <img src="${featuredImageUrl}" alt="Featured Image" style="max-width: 100%; height: auto; border-radius: 8px;" />
  <p style="font-size: 0.9em; color: #666; margin-top: 8px;">Featured Image</p>
</div>`;
          
          // 포스트 내용 업데이트 (이미지를 맨 위에 추가)
          Logger.log(`📖 현재 포스트 내용 조회 중...`);
          const currentPost = client.request(`/posts/${postId}`, 'GET');
          const currentContent = currentPost.content.raw || currentPost.content.rendered || "";
          Logger.log(`📝 현재 내용 길이: ${currentContent.length}자`);
          
          const updatedContent = imageHtml + "\n\n" + currentContent;
          Logger.log(`📝 업데이트된 내용 길이: ${updatedContent.length}자`);
          
          const updateResult = client.request(`/posts/${postId}`, 'POST', { content: updatedContent });
          Logger.log(`✅ Featured Image를 포스트 본문에 추가 완료: ${updateResult.id}`);
        }
      } catch (imageError) {
        Logger.log(`❌ Featured Image 처리 실패: ${imageError.message}`);
      }
    } else {
      Logger.log("⚠️ Featured Image URL이 없음 - 건너뜀");
    }
    
    return postId;
  } catch (error) {
    Logger.log(`포스트 생성 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 연결 테스트 (기존 호환성)
 */
function testWordPressConnection(config) {
  try {
    const client = createWordPressClient(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    const isConnected = client.testConnection();
    
    if (isConnected) {
      Logger.log("✅ WordPress API 연결 확인");
      return true;
    } else {
      throw new Error("연결 실패");
    }
  } catch (error) {
    Logger.log(`❌ WordPress 연결 테스트 실패: ${error.message}`);
    return false;
  }
}