/**
 * WordPress 사용자 관리 API
 */

/**
 * 사용자 관리 클래스
 */
class UsersManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 사용자 조회
   */
  async getAllUsers(params = {}) {
    const defaultParams = {
      per_page: 10,
      page: 1,
      order: 'asc',
      orderby: 'name'
    };
    
    const queryParams = { ...defaultParams, ...params };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
      
    return await this.client.request(`/users?${queryString}`);
  }

  /**
   * 특정 사용자 조회
   */
  async getUser(userId) {
    return await this.client.request(`/users/${userId}`);
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser() {
    return await this.client.request('/users/me');
  }

  /**
   * 사용자 생성
   */
  async createUser(userData) {
    const requiredFields = ['username', 'email'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`필수 필드 누락: ${field}`);
      }
    }

    const defaultData = {
      roles: ['subscriber'],
      password: this.generateRandomPassword()
    };

    const finalData = { ...defaultData, ...userData };
    return await this.client.request('/users', 'POST', finalData);
  }

  /**
   * 사용자 업데이트
   */
  async updateUser(userId, updateData) {
    return await this.client.request(`/users/${userId}`, 'PUT', updateData);
  }

  /**
   * 사용자 삭제
   */
  async deleteUser(userId, reassign = null, force = false) {
    let params = '';
    if (reassign) {
      params += `?reassign=${reassign}`;
    }
    if (force) {
      params += params ? '&force=true' : '?force=true';
    }
    
    return await this.client.request(`/users/${userId}${params}`, 'DELETE');
  }

  /**
   * 사용자 역할별 조회
   */
  async getUsersByRole(role) {
    return await this.getAllUsers({ roles: role });
  }

  /**
   * 관리자 사용자 조회
   */
  async getAdminUsers() {
    return await this.getUsersByRole('administrator');
  }

  /**
   * 편집자 사용자 조회
   */
  async getEditorUsers() {
    return await this.getUsersByRole('editor');
  }

  /**
   * 작성자 사용자 조회
   */
  async getAuthorUsers() {
    return await this.getUsersByRole('author');
  }

  /**
   * 사용자 검색
   */
  async searchUsers(query) {
    return await this.getAllUsers({ search: query });
  }

  /**
   * 사용자 역할 변경
   */
  async changeUserRole(userId, newRole) {
    const validRoles = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`유효하지 않은 역할: ${newRole}`);
    }
    
    return await this.updateUser(userId, { roles: [newRole] });
  }

  /**
   * 비밀번호 재설정
   */
  async resetPassword(userId, newPassword = null) {
    const password = newPassword || this.generateRandomPassword();
    
    const result = await this.updateUser(userId, { password });
    
    return {
      success: true,
      newPassword: newPassword ? null : password, // 자동 생성된 경우만 반환
      user: result
    };
  }

  /**
   * 사용자 활동 통계
   */
  async getUserActivity(userId) {
    // 사용자의 포스트 수 조회
    const posts = await this.client.request(`/posts?author=${userId}&per_page=100`);
    
    // 사용자의 댓글 수 조회 (작성자 이름으로 검색)
    const user = await this.getUser(userId);
    const comments = await this.client.request(`/comments?search=${user.name}&per_page=100`);
    
    return {
      postsCount: posts.length,
      commentsCount: comments.length,
      lastPost: posts.length > 0 ? posts[0].date : null,
      registrationDate: user.registered_date
    };
  }

  /**
   * 사용자 통계
   */
  async getUserStats() {
    const users = await this.getAllUsers({ per_page: 100 });
    
    const roleStats = {};
    users.forEach(user => {
      user.roles.forEach(role => {
        roleStats[role] = (roleStats[role] || 0) + 1;
      });
    });

    return {
      total: users.length,
      byRole: roleStats,
      recentRegistrations: users
        .filter(user => {
          const regDate = new Date(user.registered_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return regDate > thirtyDaysAgo;
        }).length
    };
  }

  /**
   * 대량 사용자 조작
   */
  async bulkAction(userIds, action, data = {}) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        let result;
        switch (action) {
          case 'delete':
            result = await this.deleteUser(userId, data.reassign, data.force || false);
            break;
          case 'changeRole':
            result = await this.changeUserRole(userId, data.role);
            break;
          case 'update':
            result = await this.updateUser(userId, data);
            break;
          case 'resetPassword':
            result = await this.resetPassword(userId);
            break;
          default:
            throw new Error(`지원하지 않는 액션: ${action}`);
        }
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 랜덤 비밀번호 생성
   */
  generateRandomPassword(length = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }

  /**
   * 비활성 사용자 조회 (최근 로그인 기록 없음)
   */
  async getInactiveUsers(days = 90) {
    // WordPress REST API는 마지막 로그인 정보를 제공하지 않으므로
    // 포스트/댓글 활동을 기준으로 판단
    const users = await this.getAllUsers({ per_page: 100 });
    const inactiveUsers = [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    for (const user of users) {
      const activity = await this.getUserActivity(user.id);
      
      const lastActivity = activity.lastPost ? new Date(activity.lastPost) : new Date(user.registered_date);
      
      if (lastActivity < cutoffDate) {
        inactiveUsers.push({
          ...user,
          lastActivity: lastActivity,
          daysSinceActivity: Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    return inactiveUsers;
  }
}

/**
 * 사용자 관리자 인스턴스 생성
 */
function createUsersManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new UsersManager(client);
}

/**
 * 편의 함수들
 */
function getAllUsers(baseUrl, username, appPassword, params = {}) {
  const manager = createUsersManager(baseUrl, username, appPassword);
  return manager.getAllUsers(params);
}

function getUser(baseUrl, username, appPassword, userId) {
  const manager = createUsersManager(baseUrl, username, appPassword);
  return manager.getUser(userId);
}

function createUser(baseUrl, username, appPassword, userData) {
  const manager = createUsersManager(baseUrl, username, appPassword);
  return manager.createUser(userData);
}

function getUsersByRole(baseUrl, username, appPassword, role) {
  const manager = createUsersManager(baseUrl, username, appPassword);
  return manager.getUsersByRole(role);
}