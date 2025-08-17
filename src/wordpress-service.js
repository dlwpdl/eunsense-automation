/**
 * WordPress 연동 서비스
 */

/**
 * WordPress 포스트 생성
 */
function wpCreatePost({ baseUrl, user, appPass, title, content, status = "publish", categories, tags }) {
  const auth = Utilities.base64Encode(`${user}:${appPass}`);
  
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
  
  const response = UrlFetchApp.fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 201) {
    throw new Error(`WordPress 포스트 생성 실패: ${response.getResponseCode()} - ${response.getContentText()}`);
  }
  
  const data = JSON.parse(response.getContentText());
  Logger.log(`WordPress 포스트 생성됨: ID ${data.id}`);
  
  return data.id;
}

/**
 * 카테고리 확인/생성
 */
function ensureCategory(baseUrl, user, appPass, categoryName) {
  const auth = Utilities.base64Encode(`${user}:${appPass}`);
  
  // 기존 카테고리 검색
  const searchResponse = UrlFetchApp.fetch(`${baseUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}`, {
    method: "GET",
    headers: { "Authorization": `Basic ${auth}` },
    muteHttpExceptions: true
  });
  
  if (searchResponse.getResponseCode() === 200) {
    const categories = JSON.parse(searchResponse.getContentText());
    const existing = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    
    if (existing) {
      return existing.id;
    }
  }
  
  // 새 카테고리 생성
  const createResponse = UrlFetchApp.fetch(`${baseUrl}/wp-json/wp/v2/categories`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({ name: categoryName }),
    muteHttpExceptions: true
  });
  
  if (createResponse.getResponseCode() === 201) {
    const newCategory = JSON.parse(createResponse.getContentText());
    Logger.log(`새 카테고리 생성: ${categoryName} (ID: ${newCategory.id})`);
    return newCategory.id;
  }
  
  Logger.log(`카테고리 생성 실패: ${categoryName}`);
  return null;
}

/**
 * 태그 확인/생성
 */
function ensureTags(baseUrl, user, appPass, tagsCsv) {
  if (!tagsCsv) return [];
  
  const auth = Utilities.base64Encode(`${user}:${appPass}`);
  const tagNames = tagsCsv.split(",").map(tag => tag.trim()).filter(tag => tag);
  const tagIds = [];
  
  for (const tagName of tagNames) {
    // 기존 태그 검색
    const searchResponse = UrlFetchApp.fetch(`${baseUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`, {
      method: "GET",
      headers: { "Authorization": `Basic ${auth}` },
      muteHttpExceptions: true
    });
    
    let tagId = null;
    
    if (searchResponse.getResponseCode() === 200) {
      const tags = JSON.parse(searchResponse.getContentText());
      const existing = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
      
      if (existing) {
        tagId = existing.id;
      }
    }
    
    // 태그가 없으면 새로 생성
    if (!tagId) {
      const createResponse = UrlFetchApp.fetch(`${baseUrl}/wp-json/wp/v2/tags`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        payload: JSON.stringify({ name: tagName }),
        muteHttpExceptions: true
      });
      
      if (createResponse.getResponseCode() === 201) {
        const newTag = JSON.parse(createResponse.getContentText());
        tagId = newTag.id;
        Logger.log(`새 태그 생성: ${tagName} (ID: ${tagId})`);
      }
    }
    
    if (tagId) {
      tagIds.push(tagId);
    }
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
    const response = UrlFetchApp.fetch(`${config.WP_BASE}/wp-json/wp/v2/posts?per_page=1`, {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      Logger.log("✅ WordPress API 연결 확인");
      return true;
    } else {
      throw new Error(`WordPress 연결 실패: ${response.getResponseCode()}`);
    }
  } catch (error) {
    Logger.log(`❌ WordPress 연결 테스트 실패: ${error.message}`);
    return false;
  }
}