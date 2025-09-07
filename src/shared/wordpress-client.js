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

  return client;
}

/**
 * 포스트 생성 (기존 호환성)
 */
function wpCreatePost({ baseUrl, user, appPass, title, content, status = "publish", categories, tags, format, slug, excerpt, meta }) {
  const client = createWordPressClient(baseUrl, user, appPass);
  
  const payload = {
    title: title,
    content: content,
    status: status
  };
  
  if (categories && categories.length > 0) payload.categories = categories;
  if (tags && tags.length > 0) payload.tags = tags;
  if (format) payload.format = format;
  if (slug) payload.slug = slug;
  if (excerpt) payload.excerpt = excerpt;
  if (meta) payload.meta = meta;
  
  const result = client.request('/posts', 'POST', payload);
  Logger.log(`WordPress 포스트 생성됨: ID ${result.id}`);
  return result.id;
}

/**
 * 기존 포스트 업데이트
 */
function wpUpdatePost({ baseUrl, user, appPass, postId, data }) {
  const client = createWordPressClient(baseUrl, user, appPass);
  Logger.log(`WordPress 포스트 업데이트 중: ID ${postId}`);
  return client.request(`/posts/${postId}`, 'POST', data);
}

/**
 * 조건에 따라 포스트 목록 조회
 */
function wpGetPosts({ baseUrl, user, appPass, params = {} }) {
  const client = createWordPressClient(baseUrl, user, appPass);
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return client.request(`/posts?${query}`, 'GET');
}

/**
 * 카테고리 확인/생성 (캐시 적용)
 */
function ensureCategory(baseUrl, user, appPass, categoryName) {
  const cacheKey = `wp_cat_${categoryName.toLowerCase().replace(/\s/g, '_')}`;
  const cacheDuration = 21600; // 6시간

  return withCache(cacheKey, cacheDuration, () => {
    const client = createWordPressClient(baseUrl, user, appPass);
    
    const categories = client.request(`/categories?search=${encodeURIComponent(categoryName)}`);
    const existing = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    
    if (existing) {
      return existing.id;
    }
    
    Logger.log(`새 카테고리 생성: ${categoryName}`);
    const newCategory = client.request('/categories', 'POST', { name: categoryName });
    return newCategory.id;
  });
}

/**
 * 태그 확인/생성 (캐시 적용)
 */
function ensureTags(baseUrl, user, appPass, tagsCsv) {
  if (!tagsCsv) return [];
  
  const client = createWordPressClient(baseUrl, user, appPass);
  const tagNames = tagsCsv.split(",").map(tag => tag.trim()).filter(tag => tag);
  const tagIds = [];
  
  for (const tagName of tagNames) {
    const cacheKey = `wp_tag_${tagName.toLowerCase().replace(/\s/g, '_')}`;
    const cacheDuration = 21600; // 6시간

    const tagId = withCache(cacheKey, cacheDuration, () => {
      const tags = client.request(`/tags?search=${encodeURIComponent(tagName)}`);
      let existingTag = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
      
      if (existingTag) {
        return existingTag.id;
      }
      
      Logger.log(`새 태그 생성: ${tagName}`);
      existingTag = client.request('/tags', 'POST', { name: tagName });
      return existingTag.id;
    });
    
    tagIds.push(tagId);
  }
  
  return tagIds;
}

/**
 * 포스트 URL 생성
 */
function getPostUrl(baseUrl, postId) {
  return `${baseUrl}/?p=${postId}`;
}

/**
 * WordPress 연결 테스트
 */
function testWordPressConnection(config) {
  try {
    const client = createWordPressClient(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    client.request('/posts?per_page=1');
    Logger.log("✅ WordPress API 연결 확인");
    return true;
  } catch (error) {
    Logger.log(`❌ WordPress 연결 테스트 실패: ${error.message}`);
    return false;
  }
}
