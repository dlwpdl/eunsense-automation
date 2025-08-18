/**
 * WordPress 댓글 관리 API
 */

/**
 * 댓글 관리 클래스
 */
class CommentsManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 댓글 조회
   */
  async getAllComments(params = {}) {
    const defaultParams = {
      per_page: 10,
      page: 1,
      order: 'desc',
      orderby: 'date',
      status: 'approved'
    };
    
    const queryParams = { ...defaultParams, ...params };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
      
    return await this.client.request(`/comments?${queryString}`);
  }

  /**
   * 특정 댓글 조회
   */
  async getComment(commentId) {
    return await this.client.request(`/comments/${commentId}`);
  }

  /**
   * 포스트별 댓글 조회
   */
  async getCommentsByPost(postId, params = {}) {
    const postParams = {
      post: postId,
      ...params
    };
    
    return await this.getAllComments(postParams);
  }

  /**
   * 댓글 생성
   */
  async createComment(commentData) {
    const requiredFields = ['post', 'content'];
    for (const field of requiredFields) {
      if (!commentData[field]) {
        throw new Error(`필수 필드 누락: ${field}`);
      }
    }

    const defaultData = {
      status: 'hold', // 승인 대기
      author_name: 'Anonymous',
      author_email: 'anonymous@example.com'
    };

    const finalData = { ...defaultData, ...commentData };
    return await this.client.request('/comments', 'POST', finalData);
  }

  /**
   * 댓글 업데이트
   */
  async updateComment(commentId, updateData) {
    return await this.client.request(`/comments/${commentId}`, 'PUT', updateData);
  }

  /**
   * 댓글 삭제
   */
  async deleteComment(commentId, force = false) {
    const params = force ? '?force=true' : '';
    return await this.client.request(`/comments/${commentId}${params}`, 'DELETE');
  }

  /**
   * 댓글 상태 변경
   */
  async changeCommentStatus(commentId, status) {
    const validStatuses = ['approved', 'hold', 'spam', 'trash'];
    if (!validStatuses.includes(status)) {
      throw new Error(`유효하지 않은 상태: ${status}`);
    }
    
    return await this.updateComment(commentId, { status });
  }

  /**
   * 댓글 승인
   */
  async approveComment(commentId) {
    return await this.changeCommentStatus(commentId, 'approved');
  }

  /**
   * 댓글 거부 (보류)
   */
  async holdComment(commentId) {
    return await this.changeCommentStatus(commentId, 'hold');
  }

  /**
   * 댓글 스팸 처리
   */
  async markAsSpam(commentId) {
    return await this.changeCommentStatus(commentId, 'spam');
  }

  /**
   * 대기 중인 댓글 조회
   */
  async getPendingComments(params = {}) {
    return await this.getAllComments({ 
      status: 'hold',
      ...params 
    });
  }

  /**
   * 스팸 댓글 조회
   */
  async getSpamComments(params = {}) {
    return await this.getAllComments({ 
      status: 'spam',
      ...params 
    });
  }

  /**
   * 댓글 검색
   */
  async searchComments(query, params = {}) {
    const searchParams = {
      search: query,
      per_page: 10,
      ...params
    };
    
    return await this.getAllComments(searchParams);
  }

  /**
   * 대량 댓글 조작
   */
  async bulkAction(commentIds, action, data = {}) {
    const results = [];
    
    for (const commentId of commentIds) {
      try {
        let result;
        switch (action) {
          case 'approve':
            result = await this.approveComment(commentId);
            break;
          case 'hold':
            result = await this.holdComment(commentId);
            break;
          case 'spam':
            result = await this.markAsSpam(commentId);
            break;
          case 'delete':
            result = await this.deleteComment(commentId, data.force || false);
            break;
          case 'update':
            result = await this.updateComment(commentId, data);
            break;
          default:
            throw new Error(`지원하지 않는 액션: ${action}`);
        }
        results.push({ commentId, success: true, result });
      } catch (error) {
        results.push({ commentId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 댓글 통계
   */
  async getCommentStats() {
    const [approved, pending, spam, trash] = await Promise.all([
      this.getAllComments({ status: 'approved', per_page: 100 }),
      this.getAllComments({ status: 'hold', per_page: 100 }),
      this.getAllComments({ status: 'spam', per_page: 100 }),
      this.getAllComments({ status: 'trash', per_page: 100 })
    ]);

    return {
      approved: approved.length,
      pending: pending.length,
      spam: spam.length,
      trash: trash.length,
      total: approved.length + pending.length + spam.length + trash.length
    };
  }

  /**
   * 최근 댓글 활동
   */
  async getRecentActivity(days = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const afterDate = date.toISOString();

    return await this.getAllComments({
      after: afterDate,
      per_page: 50,
      status: 'any'
    });
  }

  /**
   * 댓글 작성자별 통계
   */
  async getAuthorStats() {
    const comments = await this.getAllComments({ 
      per_page: 100,
      status: 'approved'
    });
    
    const authorStats = {};
    
    comments.forEach(comment => {
      const author = comment.author_name || 'Anonymous';
      if (!authorStats[author]) {
        authorStats[author] = {
          count: 0,
          email: comment.author_email || '',
          url: comment.author_url || '',
          lastComment: comment.date
        };
      }
      authorStats[author].count++;
    });

    return Object.entries(authorStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count);
  }
}

/**
 * 댓글 관리자 인스턴스 생성
 */
function createCommentsManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new CommentsManager(client);
}

/**
 * 편의 함수들
 */
function getAllComments(baseUrl, username, appPassword, params = {}) {
  const manager = createCommentsManager(baseUrl, username, appPassword);
  return manager.getAllComments(params);
}

function getCommentsByPost(baseUrl, username, appPassword, postId, params = {}) {
  const manager = createCommentsManager(baseUrl, username, appPassword);
  return manager.getCommentsByPost(postId, params);
}

function approveComment(baseUrl, username, appPassword, commentId) {
  const manager = createCommentsManager(baseUrl, username, appPassword);
  return manager.approveComment(commentId);
}

function getPendingComments(baseUrl, username, appPassword, params = {}) {
  const manager = createCommentsManager(baseUrl, username, appPassword);
  return manager.getPendingComments(params);
}