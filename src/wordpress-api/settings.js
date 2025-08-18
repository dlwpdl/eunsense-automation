/**
 * WordPress 사이트 설정 관리 API
 */

/**
 * 설정 관리 클래스
 */
class SettingsManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 모든 설정 조회
   */
  async getAllSettings() {
    return await this.client.request('/settings');
  }

  /**
   * 특정 설정 조회
   */
  async getSetting(settingKey) {
    const settings = await this.getAllSettings();
    return settings[settingKey];
  }

  /**
   * 설정 업데이트
   */
  async updateSettings(settingsData) {
    return await this.client.request('/settings', 'PUT', settingsData);
  }

  /**
   * 단일 설정 업데이트
   */
  async updateSetting(key, value) {
    const updateData = {};
    updateData[key] = value;
    return await this.updateSettings(updateData);
  }

  /**
   * 사이트 제목 설정
   */
  async setSiteTitle(title) {
    return await this.updateSetting('title', title);
  }

  /**
   * 사이트 태그라인 설정
   */
  async setSiteTagline(tagline) {
    return await this.updateSetting('description', tagline);
  }

  /**
   * 관리자 이메일 설정
   */
  async setAdminEmail(email) {
    return await this.updateSetting('admin_email', email);
  }

  /**
   * 사이트 URL 설정
   */
  async setSiteUrl(url) {
    return await this.updateSetting('url', url);
  }

  /**
   * 타임존 설정
   */
  async setTimezone(timezone) {
    return await this.updateSetting('timezone', timezone);
  }

  /**
   * 날짜 형식 설정
   */
  async setDateFormat(format) {
    return await this.updateSetting('date_format', format);
  }

  /**
   * 시간 형식 설정
   */
  async setTimeFormat(format) {
    return await this.updateSetting('time_format', format);
  }

  /**
   * 언어 설정
   */
  async setLanguage(language) {
    return await this.updateSetting('language', language);
  }

  /**
   * 한 페이지당 포스트 수 설정
   */
  async setPostsPerPage(count) {
    return await this.updateSetting('posts_per_page', count);
  }

  /**
   * 기본 카테고리 설정
   */
  async setDefaultCategory(categoryId) {
    return await this.updateSetting('default_category', categoryId);
  }

  /**
   * 기본 포스트 형식 설정
   */
  async setDefaultPostFormat(format) {
    return await this.updateSetting('default_post_format', format);
  }

  /**
   * 댓글 설정 관리
   */
  async getCommentSettings() {
    const settings = await this.getAllSettings();
    return {
      default_comment_status: settings.default_comment_status,
      require_name_email: settings.require_name_email,
      comment_registration: settings.comment_registration,
      close_comments_for_old_posts: settings.close_comments_for_old_posts,
      close_comments_days_old: settings.close_comments_days_old,
      thread_comments: settings.thread_comments,
      thread_comments_depth: settings.thread_comments_depth,
      page_comments: settings.page_comments,
      comments_per_page: settings.comments_per_page,
      default_comments_page: settings.default_comments_page,
      comment_order: settings.comment_order,
      comments_notify: settings.comments_notify,
      moderation_notify: settings.moderation_notify,
      comment_moderation: settings.comment_moderation,
      comment_whitelist: settings.comment_whitelist,
      comment_max_links: settings.comment_max_links,
      moderation_keys: settings.moderation_keys,
      blacklist_keys: settings.blacklist_keys
    };
  }

  /**
   * 댓글 설정 업데이트
   */
  async updateCommentSettings(commentSettings) {
    return await this.updateSettings(commentSettings);
  }

  /**
   * 댓글 허용/비허용 설정
   */
  async setCommentsEnabled(enabled) {
    return await this.updateSetting('default_comment_status', enabled ? 'open' : 'closed');
  }

  /**
   * 미디어 설정 조회
   */
  async getMediaSettings() {
    const settings = await this.getAllSettings();
    return {
      thumbnail_size_w: settings.thumbnail_size_w,
      thumbnail_size_h: settings.thumbnail_size_h,
      thumbnail_crop: settings.thumbnail_crop,
      medium_size_w: settings.medium_size_w,
      medium_size_h: settings.medium_size_h,
      medium_large_size_w: settings.medium_large_size_w,
      medium_large_size_h: settings.medium_large_size_h,
      large_size_w: settings.large_size_w,
      large_size_h: settings.large_size_h,
      uploads_use_yearmonth_folders: settings.uploads_use_yearmonth_folders
    };
  }

  /**
   * 미디어 설정 업데이트
   */
  async updateMediaSettings(mediaSettings) {
    return await this.updateSettings(mediaSettings);
  }

  /**
   * 퍼머링크 설정 조회
   */
  async getPermalinkSettings() {
    const settings = await this.getAllSettings();
    return {
      permalink_structure: settings.permalink_structure,
      category_base: settings.category_base,
      tag_base: settings.tag_base
    };
  }

  /**
   * 퍼머링크 설정 업데이트
   */
  async updatePermalinkSettings(permalinkSettings) {
    return await this.updateSettings(permalinkSettings);
  }

  /**
   * 읽기 설정 조회
   */
  async getReadingSettings() {
    const settings = await this.getAllSettings();
    return {
      show_on_front: settings.show_on_front,
      page_on_front: settings.page_on_front,
      page_for_posts: settings.page_for_posts,
      posts_per_page: settings.posts_per_page,
      posts_per_rss: settings.posts_per_rss,
      rss_use_excerpt: settings.rss_use_excerpt,
      blog_public: settings.blog_public
    };
  }

  /**
   * 읽기 설정 업데이트
   */
  async updateReadingSettings(readingSettings) {
    return await this.updateSettings(readingSettings);
  }

  /**
   * 쓰기 설정 조회
   */
  async getWritingSettings() {
    const settings = await this.getAllSettings();
    return {
      default_category: settings.default_category,
      default_post_format: settings.default_post_format,
      mailserver_url: settings.mailserver_url,
      mailserver_login: settings.mailserver_login,
      mailserver_pass: settings.mailserver_pass,
      mailserver_port: settings.mailserver_port,
      ping_sites: settings.ping_sites,
      use_balanceTags: settings.use_balanceTags
    };
  }

  /**
   * 쓰기 설정 업데이트
   */
  async updateWritingSettings(writingSettings) {
    return await this.updateSettings(writingSettings);
  }

  /**
   * 토론 설정 조회 (댓글 설정과 동일)
   */
  async getDiscussionSettings() {
    return await this.getCommentSettings();
  }

  /**
   * 토론 설정 업데이트
   */
  async updateDiscussionSettings(discussionSettings) {
    return await this.updateCommentSettings(discussionSettings);
  }

  /**
   * 설정 백업
   */
  async backupSettings() {
    const settings = await this.getAllSettings();
    const backup = {
      timestamp: new Date().toISOString(),
      settings: settings
    };
    
    return backup;
  }

  /**
   * 설정 복원
   */
  async restoreSettings(backup) {
    if (!backup.settings) {
      throw new Error('유효하지 않은 백업 데이터');
    }
    
    // 복원 가능한 설정만 필터링
    const restorableSettings = { ...backup.settings };
    
    // 읽기 전용 설정 제거
    delete restorableSettings.gmt_offset;
    delete restorableSettings.start_of_week;
    
    return await this.updateSettings(restorableSettings);
  }

  /**
   * 설정 검증
   */
  async validateSettings() {
    const settings = await this.getAllSettings();
    const issues = [];
    
    // 기본 검증 규칙
    if (!settings.title || settings.title.trim() === '') {
      issues.push('사이트 제목이 설정되지 않았습니다');
    }
    
    if (!settings.admin_email || !this.isValidEmail(settings.admin_email)) {
      issues.push('유효하지 않은 관리자 이메일 주소입니다');
    }
    
    if (!settings.url || !this.isValidUrl(settings.url)) {
      issues.push('유효하지 않은 사이트 URL입니다');
    }
    
    if (settings.posts_per_page < 1 || settings.posts_per_page > 100) {
      issues.push('페이지당 포스트 수가 유효하지 않습니다 (1-100)');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * 이메일 유효성 검사
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URL 유효성 검사
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * 설정 관리자 인스턴스 생성
 */
function createSettingsManager(baseUrl, username, appPassword) {
  const client = new WordPressClient(baseUrl, username, appPassword);
  return new SettingsManager(client);
}

/**
 * 편의 함수들
 */
function getAllSettings(baseUrl, username, appPassword) {
  const manager = createSettingsManager(baseUrl, username, appPassword);
  return manager.getAllSettings();
}

function updateSettings(baseUrl, username, appPassword, settingsData) {
  const manager = createSettingsManager(baseUrl, username, appPassword);
  return manager.updateSettings(settingsData);
}

function setSiteTitle(baseUrl, username, appPassword, title) {
  const manager = createSettingsManager(baseUrl, username, appPassword);
  return manager.setSiteTitle(title);
}