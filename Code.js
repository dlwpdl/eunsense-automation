/**
 * 통합 WordPress 자동화 시스템 - 메인 진입점
 */

// 블로그 자동화 기능 import
// 주의: Google Apps Script에서는 ES6 import가 작동하지 않으므로 
// 모든 파일을 sync.js를 통해 하나의 스크립트로 병합됩니다.

/**
 * 블로그 자동화 - 트렌드 수집 및 포스트 발행
 */
function runBlogAutomation() {
  try {
    Logger.log("=== 블로그 자동화 시작 ===");
    
    // 트렌드 수집
    const trendsAdded = addTrendsToSheet();
    Logger.log(`트렌드 수집 완료: ${trendsAdded}개 추가`);
    
    // 포스트 발행
    const publishResults = publishPosts();
    Logger.log(`포스트 발행 완료: ${JSON.stringify(publishResults)}`);
    
    Logger.log("=== 블로그 자동화 완료 ===");
    
    return {
      trendsAdded,
      publishResults
    };
  } catch (error) {
    Logger.log(`블로그 자동화 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 관리 대시보드 데이터 조회
 */
function getWordPressDashboard() {
  try {
    const config = getConfig();
    
    if (!config.WP_BASE || !config.WP_USER || !config.WP_APP_PASS) {
      throw new Error("WordPress 설정이 완료되지 않았습니다.");
    }
    
    const adminManager = createAdminManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return adminManager.getDashboardData();
  } catch (error) {
    Logger.log(`WordPress 대시보드 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 사이트 통계 조회
 */
function getWordPressSiteStats() {
  try {
    const config = getConfig();
    const adminManager = createAdminManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return adminManager.getSiteStats();
  } catch (error) {
    Logger.log(`사이트 통계 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 시스템 건강 상태 확인
 */
function checkWordPressHealth() {
  try {
    const config = getConfig();
    const adminManager = createAdminManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return adminManager.getSystemHealth();
  } catch (error) {
    Logger.log(`시스템 건강 상태 확인 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 최적화 권장사항 조회
 */
function getOptimizationRecommendations() {
  try {
    const config = getConfig();
    const adminManager = createAdminManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return adminManager.getOptimizationRecommendations();
  } catch (error) {
    Logger.log(`최적화 권장사항 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 모든 WordPress 포스트 조회
 */
function getAllWordPressPosts(params = {}) {
  try {
    const config = getConfig();
    const postsManager = createPostsManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return postsManager.getAllPosts(params);
  } catch (error) {
    Logger.log(`포스트 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 포스트 생성
 */
function createWordPressPost(postData) {
  try {
    const config = getConfig();
    const postsManager = createPostsManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return postsManager.createPost(postData);
  } catch (error) {
    Logger.log(`포스트 생성 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 미디어 조회
 */
function getAllWordPressMedia(params = {}) {
  try {
    const config = getConfig();
    const mediaManager = createMediaManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return mediaManager.getAllMedia(params);
  } catch (error) {
    Logger.log(`미디어 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 미디어 업로드 (URL에서)
 */
function uploadWordPressMediaFromUrl(imageUrl, filename = null, metadata = {}) {
  try {
    const config = getConfig();
    const mediaManager = createMediaManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return mediaManager.uploadFromUrl(imageUrl, filename, metadata);
  } catch (error) {
    Logger.log(`미디어 업로드 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 댓글 관리
 */
function getWordPressComments(params = {}) {
  try {
    const config = getConfig();
    const commentsManager = createCommentsManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return commentsManager.getAllComments(params);
  } catch (error) {
    Logger.log(`댓글 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 대기 중인 댓글 승인
 */
function approveAllPendingComments() {
  try {
    const config = getConfig();
    const commentsManager = createCommentsManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    
    const pendingComments = commentsManager.getPendingComments();
    const results = [];
    
    for (const comment of pendingComments) {
      try {
        const result = commentsManager.approveComment(comment.id);
        results.push({ commentId: comment.id, success: true, result });
      } catch (error) {
        results.push({ commentId: comment.id, success: false, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    Logger.log(`댓글 승인 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 사용자 관리
 */
function getWordPressUsers(params = {}) {
  try {
    const config = getConfig();
    const usersManager = createUsersManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return usersManager.getAllUsers(params);
  } catch (error) {
    Logger.log(`사용자 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 설정 조회
 */
function getWordPressSettings() {
  try {
    const config = getConfig();
    const settingsManager = createSettingsManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return settingsManager.getAllSettings();
  } catch (error) {
    Logger.log(`설정 조회 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 설정 업데이트
 */
function updateWordPressSettings(settingsData) {
  try {
    const config = getConfig();
    const settingsManager = createSettingsManager(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    return settingsManager.updateSettings(settingsData);
  } catch (error) {
    Logger.log(`설정 업데이트 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 테스트 함수들
 */
function testBlogAutomation() {
  try {
    Logger.log("=== 블로그 자동화 테스트 시작 ===");
    
    // 설정 확인
    const config = validateConfig();
    Logger.log("✅ 설정 검증 완료");
    
    // WordPress 연결 테스트
    const wpConnected = testWordPressConnection(config);
    if (!wpConnected) {
      throw new Error("WordPress 연결 실패");
    }
    Logger.log("✅ WordPress 연결 확인");
    
    // AI 서비스 테스트
    const testTopic = "Test Blog Post Generation";
    const aiResult = generateHtml(testTopic);
    if (!aiResult || !aiResult.title) {
      throw new Error("AI 글 생성 실패");
    }
    Logger.log("✅ AI 글 생성 확인");
    
    // 이미지 서비스 테스트
    const testImage = findImage("technology");
    if (!testImage || !testImage.url) {
      throw new Error("이미지 검색 실패");
    }
    Logger.log("✅ 이미지 검색 확인");
    
    Logger.log("=== 모든 테스트 통과 ===");
    return true;
  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
    return false;
  }
}

function testWordPressAPI() {
  try {
    Logger.log("=== WordPress API 테스트 시작 ===");
    
    const config = getConfig();
    
    // 기본 연결 테스트
    const health = checkWordPressHealth();
    Logger.log(`시스템 상태: ${health.status}`);
    
    // 통계 조회 테스트
    const stats = getWordPressSiteStats();
    Logger.log(`포스트 수: ${stats.posts.total}, 사용자 수: ${stats.users.total}`);
    
    // 최근 포스트 조회 테스트
    const recentPosts = getAllWordPressPosts({ per_page: 5 });
    Logger.log(`최근 포스트 ${recentPosts.length}개 조회 완료`);
    
    Logger.log("=== WordPress API 테스트 완료 ===");
    return true;
  } catch (error) {
    Logger.log(`❌ WordPress API 테스트 실패: ${error.message}`);
    return false;
  }
}

/**
 * 전체 시스템 상태 확인
 */
function getSystemStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    blogAutomation: false,
    wordpressAPI: false,
    details: {}
  };
  
  try {
    // 블로그 자동화 상태
    status.blogAutomation = testBlogAutomation();
    
    // WordPress API 상태
    status.wordpressAPI = testWordPressAPI();
    
    // 상세 정보
    if (status.wordpressAPI) {
      status.details = getWordPressDashboard();
    }
    
    status.overall = status.blogAutomation && status.wordpressAPI ? 'healthy' : 'warning';
    
  } catch (error) {
    Logger.log(`시스템 상태 확인 실패: ${error.message}`);
    status.overall = 'error';
    status.error = error.message;
  }
  
  return status;
}

// 기존 블로그 자동화 함수들 (하위 호환성)
// 이 함수들은 blog-automation 폴더의 main.js에서 이동된 것들입니다.