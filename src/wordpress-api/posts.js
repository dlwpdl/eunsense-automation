/**
 * WordPress 포스트 관리 API
 */

/**
 * 포스트 관리 클래스
 */
class PostsManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 포스트 조회
   */
  async getAllPosts(params = {}) {
    const defaultParams = {
      per_page: 10,
      page: 1,
      status: 'any',
      order: 'desc',
      orderby: 'date'
    };
    
    const queryParams = { ...defaultParams, ...params };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
      
    return await this.client.request(`/posts?${queryString}`);
  }

  /**
   * 특정 포스트 조회
   */
  async getPost(postId) {
    return await this.client.request(`/posts/${postId}`);
  }

  /**
   * 포스트 생성
   */
  async createPost(postData) {
    const requiredFields = ['title', 'content'];
    for (const field of requiredFields) {
      if (!postData[field]) {
        throw new Error(`필수 필드 누락: ${field}`);
      }
    }

    const defaultData = {
      status: 'draft',
      comment_status: 'open',
      ping_status: 'open'
    };

    const finalData = { ...defaultData, ...postData };
    return await this.client.request('/posts', 'POST', finalData);
  }

  /**
   * 포스트 업데이트
   */
  async updatePost(postId, updateData) {
    return await this.client.request(`/posts/${postId}`, 'PUT', updateData);
  }

  /**
   * 포스트 삭제
   */
  async deletePost(postId, force = false) {
    const params = force ? '?force=true' : '';
    return await this.client.request(`/posts/${postId}${params}`, 'DELETE');
  }

  /**
   * 포스트 상태 변경
   */
  async changeStatus(postId, status) {
    const validStatuses = ['publish', 'draft', 'private', 'pending', 'trash'];
    if (!validStatuses.includes(status)) {
      throw new Error(`유효하지 않은 상태: ${status}`);
    }
    
    return await this.updatePost(postId, { status });
  }

  /**
   * 대량 포스트 조작
   */
  async bulkAction(postIds, action, data = {}) {
    const results = [];
    
    for (const postId of postIds) {
      try {
        let result;
        switch (action) {
          case 'delete':
            result = await this.deletePost(postId, data.force || false);
            break;
          case 'status':
            result = await this.changeStatus(postId, data.status);
            break;
          case 'update':
            result = await this.updatePost(postId, data);
            break;
          default:
            throw new Error(`지원하지 않는 액션: ${action}`);
        }
        results.push({ postId, success: true, result });
      } catch (error) {
        results.push({ postId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 포스트 검색
   */
  async searchPosts(query, params = {}) {
    const searchParams = {
      search: query,
      per_page: 10,
      ...params
    };
    
    return await this.getAllPosts(searchParams);
  }

  /**
   * 카테고리별 포스트 조회
   */
  async getPostsByCategory(categoryId, params = {}) {
    const categoryParams = {
      categories: categoryId,
      ...params
    };
    
    return await this.getAllPosts(categoryParams);
  }

  /**
   * 태그별 포스트 조회
   */
  async getPostsByTag(tagId, params = {}) {
    const tagParams = {
      tags: tagId,
      ...params
    };
    
    return await this.getAllPosts(tagParams);
  }

  /**
   * 포스트 복제
   */
  async duplicatePost(postId, modifications = {}) {
    const originalPost = await this.getPost(postId);
    
    const duplicateData = {
      title: `${originalPost.title.rendered} (복사본)`,
      content: originalPost.content.rendered,
      excerpt: originalPost.excerpt.rendered,
      categories: originalPost.categories,
      tags: originalPost.tags,
      status: 'draft',
      ...modifications
    };
    
    return await this.createPost(duplicateData);
  }
}

/**
 * 포스트 관리자 인스턴스 생성
 */
function createPostsManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new PostsManager(client);
}

/**
 * 편의 함수들 (기존 호환성)
 */
function getAllPosts(baseUrl, username, appPassword, params = {}) {
  const manager = createPostsManager(baseUrl, username, appPassword);
  return manager.getAllPosts(params);
}

function getPost(baseUrl, username, appPassword, postId) {
  const manager = createPostsManager(baseUrl, username, appPassword);
  return manager.getPost(postId);
}

function createPost(baseUrl, username, appPassword, postData) {
  const manager = createPostsManager(baseUrl, username, appPassword);
  return manager.createPost(postData);
}

function updatePost(baseUrl, username, appPassword, postId, updateData) {
  const manager = createPostsManager(baseUrl, username, appPassword);
  return manager.updatePost(postId, updateData);
}

function deletePost(baseUrl, username, appPassword, postId, force = false) {
  const manager = createPostsManager(baseUrl, username, appPassword);
  return manager.deletePost(postId, force);
}