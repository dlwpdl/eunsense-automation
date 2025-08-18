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

  return client;
}

/**
 * 포스트 생성 (기존 호환성)
 */
function wpCreatePost({ baseUrl, user, appPass, title, content, status = "publish", categories, tags }) {
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
  
  const result = client.request('/posts', 'POST', payload);
  Logger.log(`WordPress 포스트 생성됨: ID ${result.id}`);
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