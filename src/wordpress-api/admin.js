/**
 * WordPress 관리자 기능 API
 */

/**
 * 관리자 기능 클래스
 */
class AdminManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 사이트 전체 통계
   */
  async getSiteStats() {
    try {
      const [posts, pages, comments, media, users, categories, tags] = await Promise.all([
        this.client.request('/posts?per_page=1&status=publish'),
        this.client.request('/pages?per_page=1&status=publish'),
        this.client.request('/comments?per_page=1&status=approved'),
        this.client.request('/media?per_page=1'),
        this.client.request('/users?per_page=1'),
        this.client.request('/categories?per_page=1&hide_empty=false'),
        this.client.request('/tags?per_page=1&hide_empty=false')
      ]);

      return {
        posts: await this.getPostStats(),
        pages: await this.getPageStats(),
        comments: await this.getCommentStats(),
        media: await this.getMediaStats(),
        users: await this.getUserStats(),
        categories: categories.length,
        tags: tags.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      Logger.log(`사이트 통계 조회 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 포스트 통계
   */
  async getPostStats() {
    const [published, draft, pending, privatePosts, trash] = await Promise.all([
      this.client.request('/posts?status=publish&per_page=100'),
      this.client.request('/posts?status=draft&per_page=100'),
      this.client.request('/posts?status=pending&per_page=100'),
      this.client.request('/posts?status=private&per_page=100'),
      this.client.request('/posts?status=trash&per_page=100')
    ]);

    return {
      published: published.length,
      draft: draft.length,
      pending: pending.length,
      private_posts: privatePosts.length,
      trash: trash.length,
      total: published.length + draft.length + pending.length + privatePosts.length
    };
  }

  /**
   * 페이지 통계
   */
  async getPageStats() {
    const [published, draft, pending, privatePages] = await Promise.all([
      this.client.request('/pages?status=publish&per_page=100'),
      this.client.request('/pages?status=draft&per_page=100'),
      this.client.request('/pages?status=pending&per_page=100'),
      this.client.request('/pages?status=private&per_page=100')
    ]);

    return {
      published: published.length,
      draft: draft.length,
      pending: pending.length,
      private_pages: privatePages.length,
      total: published.length + draft.length + pending.length + privatePages.length
    };
  }

  /**
   * 댓글 통계
   */
  async getCommentStats() {
    const [approved, pending, spam, trash] = await Promise.all([
      this.client.request('/comments?status=approved&per_page=100'),
      this.client.request('/comments?status=hold&per_page=100'),
      this.client.request('/comments?status=spam&per_page=100'),
      this.client.request('/comments?status=trash&per_page=100')
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
   * 미디어 통계
   */
  async getMediaStats() {
    const media = await this.client.request('/media?per_page=100');
    
    const stats = {
      total: media.length,
      byType: {},
      totalSize: 0
    };

    media.forEach(item => {
      const type = item.mime_type.split('/')[0];
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      if (item.media_details && item.media_details.filesize) {
        stats.totalSize += item.media_details.filesize;
      }
    });

    return stats;
  }

  /**
   * 사용자 통계
   */
  async getUserStats() {
    const users = await this.client.request('/users?per_page=100');
    
    const stats = {
      total: users.length,
      byRole: {}
    };

    users.forEach(user => {
      user.roles.forEach(role => {
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * 최근 활동 조회
   */
  async getRecentActivity(limit = 20) {
    const activities = [];
    
    try {
      // 최근 포스트
      const recentPosts = await this.client.request(`/posts?per_page=${Math.ceil(limit/4)}&orderby=date&order=desc`);
      recentPosts.forEach(post => {
        activities.push({
          type: 'post',
          action: 'published',
          title: post.title.rendered,
          date: post.date,
          author: post.author,
          url: post.link
        });
      });

      // 최근 댓글
      const recentComments = await this.client.request(`/comments?per_page=${Math.ceil(limit/4)}&orderby=date&order=desc`);
      recentComments.forEach(comment => {
        activities.push({
          type: 'comment',
          action: 'posted',
          title: comment.content.rendered.substring(0, 50) + '...',
          date: comment.date,
          author: comment.author_name,
          post: comment.post
        });
      });

      // 최근 미디어
      const recentMedia = await this.client.request(`/media?per_page=${Math.ceil(limit/4)}&orderby=date&order=desc`);
      recentMedia.forEach(media => {
        activities.push({
          type: 'media',
          action: 'uploaded',
          title: media.title.rendered,
          date: media.date,
          author: media.author,
          url: media.source_url
        });
      });

      // 날짜순 정렬
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return activities.slice(0, limit);
    } catch (error) {
      Logger.log(`최근 활동 조회 실패: ${error.message}`);
      return [];
    }
  }

  /**
   * 시스템 건강 상태 확인
   */
  async getSystemHealth() {
    const health = {
      status: 'healthy',
      checks: [],
      score: 100
    };

    try {
      // API 연결 테스트
      await this.client.request('/posts?per_page=1');
      health.checks.push({
        name: 'API 연결',
        status: 'pass',
        message: 'WordPress REST API가 정상적으로 작동합니다'
      });
    } catch (error) {
      health.checks.push({
        name: 'API 연결',
        status: 'fail',
        message: `API 연결 실패: ${error.message}`
      });
      health.score -= 30;
    }

    try {
      // 설정 확인
      const settings = await this.client.request('/settings');
      
      if (!settings.title || settings.title.trim() === '') {
        health.checks.push({
          name: '사이트 제목',
          status: 'warning',
          message: '사이트 제목이 설정되지 않았습니다'
        });
        health.score -= 10;
      } else {
        health.checks.push({
          name: '사이트 제목',
          status: 'pass',
          message: '사이트 제목이 설정되어 있습니다'
        });
      }

      if (!settings.admin_email || !this.isValidEmail(settings.admin_email)) {
        health.checks.push({
          name: '관리자 이메일',
          status: 'fail',
          message: '유효하지 않은 관리자 이메일 주소입니다'
        });
        health.score -= 20;
      } else {
        health.checks.push({
          name: '관리자 이메일',
          status: 'pass',
          message: '관리자 이메일이 올바르게 설정되어 있습니다'
        });
      }
    } catch (error) {
      health.checks.push({
        name: '설정 확인',
        status: 'fail',
        message: `설정 확인 실패: ${error.message}`
      });
      health.score -= 20;
    }

    // 전체 상태 결정
    if (health.score >= 80) {
      health.status = 'healthy';
    } else if (health.score >= 60) {
      health.status = 'warning';
    } else {
      health.status = 'critical';
    }

    return health;
  }

  /**
   * 데이터베이스 최적화 권장사항
   */
  async getOptimizationRecommendations() {
    const recommendations = [];

    try {
      // 휴지통 포스트 확인
      const trashPosts = await this.client.request('/posts?status=trash&per_page=100');
      if (trashPosts.length > 0) {
        recommendations.push({
          type: 'cleanup',
          priority: 'medium',
          title: '휴지통 포스트 정리',
          description: `${trashPosts.length}개의 휴지통 포스트가 있습니다. 영구 삭제를 고려하세요.`,
          action: 'delete_trash_posts'
        });
      }

      // 스팸 댓글 확인
      const spamComments = await this.client.request('/comments?status=spam&per_page=100');
      if (spamComments.length > 0) {
        recommendations.push({
          type: 'cleanup',
          priority: 'medium',
          title: '스팸 댓글 정리',
          description: `${spamComments.length}개의 스팸 댓글이 있습니다. 삭제를 권장합니다.`,
          action: 'delete_spam_comments'
        });
      }

      // 사용되지 않는 태그 확인
      const tags = await this.client.request('/tags?per_page=100&hide_empty=false');
      const unusedTags = tags.filter(tag => tag.count === 0);
      if (unusedTags.length > 0) {
        recommendations.push({
          type: 'cleanup',
          priority: 'low',
          title: '사용되지 않는 태그 정리',
          description: `${unusedTags.length}개의 사용되지 않는 태그가 있습니다.`,
          action: 'delete_unused_tags'
        });
      }

      // 대기 중인 댓글 확인
      const pendingComments = await this.client.request('/comments?status=hold&per_page=100');
      if (pendingComments.length > 0) {
        recommendations.push({
          type: 'moderation',
          priority: 'high',
          title: '댓글 승인 대기',
          description: `${pendingComments.length}개의 댓글이 승인을 기다리고 있습니다.`,
          action: 'review_pending_comments'
        });
      }

    } catch (error) {
      Logger.log(`최적화 권장사항 조회 실패: ${error.message}`);
    }

    return recommendations;
  }

  /**
   * 백업 데이터 생성
   */
  async createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    try {
      // 설정 백업
      backup.data.settings = await this.client.request('/settings');
      
      // 카테고리 백업
      backup.data.categories = await this.client.request('/categories?per_page=100&hide_empty=false');
      
      // 태그 백업
      backup.data.tags = await this.client.request('/tags?per_page=100&hide_empty=false');
      
      // 사용자 백업 (비밀번호 제외)
      const users = await this.client.request('/users?per_page=100');
      backup.data.users = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      Logger.log('백업 데이터 생성 완료');
      return backup;
    } catch (error) {
      Logger.log(`백업 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 이메일 유효성 검사
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 대시보드 위젯 데이터
   */
  async getDashboardData() {
    try {
      const [stats, recentActivity, health, recommendations] = await Promise.all([
        this.getSiteStats(),
        this.getRecentActivity(10),
        this.getSystemHealth(),
        this.getOptimizationRecommendations()
      ]);

      return {
        stats,
        recentActivity,
        health,
        recommendations,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      Logger.log(`대시보드 데이터 조회 실패: ${error.message}`);
      throw error;
    }
  }
}

/**
 * 관리자 인스턴스 생성
 */
function createAdminManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new AdminManager(client);
}

/**
 * 편의 함수들
 */
function getSiteStats(baseUrl, username, appPassword) {
  const manager = createAdminManager(baseUrl, username, appPassword);
  return manager.getSiteStats();
}

function getSystemHealth(baseUrl, username, appPassword) {
  const manager = createAdminManager(baseUrl, username, appPassword);
  return manager.getSystemHealth();
}

function getDashboardData(baseUrl, username, appPassword) {
  const manager = createAdminManager(baseUrl, username, appPassword);
  return manager.getDashboardData();
}