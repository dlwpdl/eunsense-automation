/**
 * WordPress 카테고리 및 태그 관리 API
 */

/**
 * 카테고리 관리 클래스
 */
class CategoriesManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 카테고리 조회
   */
  async getAllCategories(params = {}) {
    const defaultParams = {
      per_page: 100,
      hide_empty: false,
      order: 'asc',
      orderby: 'name'
    };
    
    const queryParams = { ...defaultParams, ...params };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
      
    return await this.client.request(`/categories?${queryString}`);
  }

  /**
   * 특정 카테고리 조회
   */
  async getCategory(categoryId) {
    return await this.client.request(`/categories/${categoryId}`);
  }

  /**
   * 카테고리 생성
   */
  async createCategory(categoryData) {
    if (!categoryData.name) {
      throw new Error('카테고리 이름은 필수입니다');
    }

    const defaultData = {
      description: '',
      parent: 0
    };

    const finalData = { ...defaultData, ...categoryData };
    return await this.client.request('/categories', 'POST', finalData);
  }

  /**
   * 카테고리 업데이트
   */
  async updateCategory(categoryId, updateData) {
    return await this.client.request(`/categories/${categoryId}`, 'PUT', updateData);
  }

  /**
   * 카테고리 삭제
   */
  async deleteCategory(categoryId, force = false) {
    const params = force ? '?force=true' : '';
    return await this.client.request(`/categories/${categoryId}${params}`, 'DELETE');
  }

  /**
   * 카테고리 검색
   */
  async searchCategories(query) {
    return await this.client.request(`/categories?search=${encodeURIComponent(query)}`);
  }

  /**
   * 계층 구조 카테고리 조회
   */
  async getCategoryHierarchy() {
    const categories = await this.getAllCategories();
    
    const buildHierarchy = (parentId = 0) => {
      return categories
        .filter(cat => cat.parent === parentId)
        .map(cat => ({
          ...cat,
          children: buildHierarchy(cat.id)
        }));
    };
    
    return buildHierarchy();
  }

  /**
   * 카테고리 통계
   */
  async getCategoryStats() {
    const categories = await this.getAllCategories();
    
    return {
      total: categories.length,
      withPosts: categories.filter(cat => cat.count > 0).length,
      empty: categories.filter(cat => cat.count === 0).length,
      topCategories: categories
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }
}

/**
 * 태그 관리 클래스
 */
class TagsManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 태그 조회
   */
  async getAllTags(params = {}) {
    const defaultParams = {
      per_page: 100,
      hide_empty: false,
      order: 'asc',
      orderby: 'name'
    };
    
    const queryParams = { ...defaultParams, ...params };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
      
    return await this.client.request(`/tags?${queryString}`);
  }

  /**
   * 특정 태그 조회
   */
  async getTag(tagId) {
    return await this.client.request(`/tags/${tagId}`);
  }

  /**
   * 태그 생성
   */
  async createTag(tagData) {
    if (!tagData.name) {
      throw new Error('태그 이름은 필수입니다');
    }

    const defaultData = {
      description: ''
    };

    const finalData = { ...defaultData, ...tagData };
    return await this.client.request('/tags', 'POST', finalData);
  }

  /**
   * 태그 업데이트
   */
  async updateTag(tagId, updateData) {
    return await this.client.request(`/tags/${tagId}`, 'PUT', updateData);
  }

  /**
   * 태그 삭제
   */
  async deleteTag(tagId, force = false) {
    const params = force ? '?force=true' : '';
    return await this.client.request(`/tags/${tagId}${params}`, 'DELETE');
  }

  /**
   * 태그 검색
   */
  async searchTags(query) {
    return await this.client.request(`/tags?search=${encodeURIComponent(query)}`);
  }

  /**
   * 사용되지 않는 태그 조회
   */
  async getUnusedTags() {
    const tags = await this.getAllTags();
    return tags.filter(tag => tag.count === 0);
  }

  /**
   * 태그 통계
   */
  async getTagStats() {
    const tags = await this.getAllTags();
    
    return {
      total: tags.length,
      withPosts: tags.filter(tag => tag.count > 0).length,
      unused: tags.filter(tag => tag.count === 0).length,
      topTags: tags
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
    };
  }

  /**
   * 태그 클라우드 데이터
   */
  async getTagCloud(minCount = 1) {
    const tags = await this.getAllTags();
    
    return tags
      .filter(tag => tag.count >= minCount)
      .map(tag => ({
        name: tag.name,
        count: tag.count,
        weight: Math.min(Math.max(tag.count / 10, 1), 5) // 1-5 가중치
      }))
      .sort((a, b) => b.count - a.count);
  }
}

/**
 * 관리자 인스턴스 생성 함수들
 */
function createCategoriesManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new CategoriesManager(client);
}

function createTagsManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new TagsManager(client);
}

/**
 * 편의 함수들
 */
function getAllCategories(baseUrl, username, appPassword, params = {}) {
  const manager = createCategoriesManager(baseUrl, username, appPassword);
  return manager.getAllCategories(params);
}

function createCategory(baseUrl, username, appPassword, categoryData) {
  const manager = createCategoriesManager(baseUrl, username, appPassword);
  return manager.createCategory(categoryData);
}

function getAllTags(baseUrl, username, appPassword, params = {}) {
  const manager = createTagsManager(baseUrl, username, appPassword);
  return manager.getAllTags(params);
}

function createTag(baseUrl, username, appPassword, tagData) {
  const manager = createTagsManager(baseUrl, username, appPassword);
  return manager.createTag(tagData);
}