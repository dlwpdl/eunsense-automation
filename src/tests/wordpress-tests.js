/**
 * WordPress 연결 및 발행 관련 테스트 함수들
 */

/**
 * WordPress 연결 테스트
 */
function testWordPressConnection() {
  Logger.log("=== WordPress 연결 테스트 시작 ===");
  
  try {
    const config = validateConfig();
    const isConnected = testWordPressConnection(config);
    
    Logger.log(`✅ WordPress 연결 결과: ${isConnected ? '성공' : '실패'}`);
    Logger.log(`  - 기본 URL: ${config.WP_BASE}`);
    Logger.log(`  - 사용자: ${config.WP_USER}`);
    Logger.log(`  - 앱 패스워드: ${config.WP_APP_PASS ? '설정됨' : '없음'}`);
    
    return {
      success: isConnected,
      baseUrl: config.WP_BASE,
      user: config.WP_USER,
      hasAppPassword: !!config.WP_APP_PASS
    };
  } catch (error) {
    Logger.log(`❌ WordPress 연결 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * WordPress API 엔드포인트 테스트
 */
function testWordPressAPIEndpoints() {
  Logger.log("=== WordPress API 엔드포인트 테스트 ===");
  
  try {
    const config = validateConfig();
    const client = createWordPressClient(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    
    const endpoints = [
      { name: 'Posts', path: '/posts?per_page=1' },
      { name: 'Categories', path: '/categories?per_page=5' },
      { name: 'Tags', path: '/tags?per_page=5' },
      { name: 'Media', path: '/media?per_page=1' }
    ];
    
    const results = {};
    
    endpoints.forEach(endpoint => {
      try {
        Logger.log(`🔍 ${endpoint.name} 엔드포인트 테스트...`);
        const response = client.request(endpoint.path, 'GET');
        
        const isArray = Array.isArray(response);
        const count = isArray ? response.length : (response ? 1 : 0);
        
        Logger.log(`  ✅ ${endpoint.name}: ${count}개 항목`);
        
        results[endpoint.name.toLowerCase()] = {
          success: true,
          count: count,
          isArray: isArray
        };
        
      } catch (error) {
        Logger.log(`  ❌ ${endpoint.name} 실패: ${error.message}`);
        results[endpoint.name.toLowerCase()] = {
          success: false,
          error: error.message
        };
      }
    });
    
    const successCount = Object.values(results).filter(r => r.success).length;
    Logger.log(`📊 API 엔드포인트 테스트: ${successCount}/${endpoints.length} 성공`);
    
    return {
      success: successCount > 0,
      results: results,
      successCount: successCount,
      totalTests: endpoints.length
    };
    
  } catch (error) {
    Logger.log(`❌ API 엔드포인트 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 카테고리 생성 및 조회 테스트
 */
function testCategoryManagement() {
  Logger.log("=== 카테고리 관리 테스트 ===");
  
  try {
    const config = validateConfig();
    const testCategoryName = "Test Category " + Date.now();
    
    Logger.log(`🏷️ 테스트 카테고리 생성: ${testCategoryName}`);
    
    // 카테고리 생성
    const categoryId = ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, testCategoryName);
    
    Logger.log(`✅ 카테고리 생성 성공: ID ${categoryId}`);
    
    // 같은 이름으로 다시 시도 (중복 확인)
    const duplicateId = ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, testCategoryName);
    
    Logger.log(`🔄 중복 카테고리 처리: ID ${duplicateId}`);
    
    const isDuplicateHandled = categoryId === duplicateId;
    Logger.log(`중복 처리 성공: ${isDuplicateHandled ? 'O' : 'X'}`);
    
    return {
      success: true,
      categoryId: categoryId,
      duplicateId: duplicateId,
      duplicateHandled: isDuplicateHandled,
      categoryName: testCategoryName
    };
    
  } catch (error) {
    Logger.log(`❌ 카테고리 관리 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 태그 생성 및 조회 테스트
 */
function testTagManagement() {
  Logger.log("=== 태그 관리 테스트 ===");
  
  try {
    const config = validateConfig();
    const testTags = `test tag ${Date.now()}, automation, wordpress api`;
    
    Logger.log(`🏷️ 테스트 태그 생성: ${testTags}`);
    
    const tagIds = ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, testTags);
    
    Logger.log(`✅ 태그 생성 성공: ${tagIds.length}개 태그`);
    tagIds.forEach((id, index) => {
      Logger.log(`  - 태그 ${index + 1}: ID ${id}`);
    });
    
    return {
      success: true,
      tagIds: tagIds,
      tagCount: tagIds.length,
      originalTags: testTags
    };
    
  } catch (error) {
    Logger.log(`❌ 태그 관리 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 포스트 생성 테스트 (간단한 테스트 포스트)
 */
function testPostCreation() {
  Logger.log("=== 포스트 생성 테스트 ===");
  
  try {
    const config = validateConfig();
    const timestamp = Date.now();
    
    const testPost = {
      title: `Test Post ${timestamp}`,
      content: `<p>This is a test post created at ${new Date().toISOString()}.</p><p>Testing WordPress API integration.</p>`,
      status: "draft", // 테스트이므로 초안으로 생성
      excerpt: "This is a test post for API validation."
    };
    
    Logger.log(`📝 테스트 포스트 생성: ${testPost.title}`);
    
    const postId = wpCreatePost({
      baseUrl: config.WP_BASE,
      user: config.WP_USER,
      appPass: config.WP_APP_PASS,
      title: testPost.title,
      content: testPost.content,
      status: testPost.status,
      excerpt: testPost.excerpt
    });
    
    Logger.log(`✅ 포스트 생성 성공: ID ${postId}`);
    
    // 생성된 포스트 URL
    const postUrl = getPostUrl(config.WP_BASE, postId);
    Logger.log(`🔗 포스트 URL: ${postUrl}`);
    
    return {
      success: true,
      postId: postId,
      postUrl: postUrl,
      title: testPost.title,
      status: testPost.status
    };
    
  } catch (error) {
    Logger.log(`❌ 포스트 생성 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Post Format 테스트
 */
function testPostFormats() {
  Logger.log("=== Post Format 테스트 ===");
  
  try {
    const config = validateConfig();
    const formats = ['standard', 'aside', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio', 'chat'];
    const testFormat = 'image'; // 테스트용 포맷
    
    const testPost = {
      title: `Format Test: ${testFormat} ${Date.now()}`,
      content: `<p>Testing post format: ${testFormat}</p>`,
      status: "draft",
      format: testFormat
    };
    
    Logger.log(`🎨 Post Format 테스트: ${testFormat}`);
    
    const postId = wpCreatePost({
      baseUrl: config.WP_BASE,
      user: config.WP_USER,
      appPass: config.WP_APP_PASS,
      title: testPost.title,
      content: testPost.content,
      status: testPost.status,
      format: testPost.format
    });
    
    Logger.log(`✅ Format 포스트 생성 성공: ID ${postId}`);
    
    return {
      success: true,
      postId: postId,
      format: testFormat,
      title: testPost.title
    };
    
  } catch (error) {
    Logger.log(`❌ Post Format 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 미디어 업로드 테스트 (외부 URL)
 */
function testMediaUpload() {
  Logger.log("=== 미디어 업로드 테스트 ===");
  
  try {
    const config = validateConfig();
    const client = createWordPressClient(config.WP_BASE, config.WP_USER, config.WP_APP_PASS);
    
    // 테스트용 이미지 URL (placeholder)
    const testImageUrl = "https://via.placeholder.com/800x600/0066cc/ffffff?text=Test+Image";
    const filename = `test-upload-${Date.now()}.png`;
    
    Logger.log(`📤 미디어 업로드 테스트: ${filename}`);
    Logger.log(`  - 소스 URL: ${testImageUrl}`);
    
    const mediaData = client.uploadImage(testImageUrl, filename);
    
    Logger.log(`✅ 미디어 업로드 성공:`);
    Logger.log(`  - 미디어 ID: ${mediaData.id}`);
    Logger.log(`  - WordPress URL: ${mediaData.source_url}`);
    
    return {
      success: true,
      mediaId: mediaData.id,
      mediaUrl: mediaData.source_url,
      originalUrl: testImageUrl,
      filename: filename
    };
    
  } catch (error) {
    Logger.log(`❌ 미디어 업로드 실패: ${error.message}`);
    
    // NinjaFirewall 403 오류 감지
    if (error.message.includes('403') || error.message.includes('NinjaFirewall')) {
      Logger.log(`🛡️ NinjaFirewall 차단 감지 - 예상된 결과`);
      return {
        success: false,
        error: error.message,
        isFirewallBlocked: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * SEO 메타데이터 적용 테스트
 */
function testSEOMetadata() {
  Logger.log("=== SEO 메타데이터 테스트 ===");
  
  try {
    const testContent = `<h2>Technology Trends</h2><p>This is a comprehensive guide about the latest technology trends in 2025.</p><p>We'll cover artificial intelligence, machine learning, and more.</p>`;
    const testTitle = "Ultimate Guide to Technology Trends 2025";
    const testProductNames = "iPhone 15 Pro, MacBook Air";
    
    const seoData = buildSEO(testContent, testTitle, testProductNames);
    
    Logger.log(`🔍 SEO 메타데이터 생성 결과:`);
    Logger.log(`  - SEO 제목: ${seoData.seoTitle}`);
    Logger.log(`  - SEO 설명: ${seoData.seoDesc}`);
    Logger.log(`  - URL 슬러그: ${seoData.slug}`);
    Logger.log(`  - 키워드 수: ${seoData.keywords.length}개`);
    Logger.log(`  - 주요 키워드: ${seoData.keywords.slice(0, 3).join(', ')}`);
    Logger.log(`  - 예상 읽기 시간: ${seoData.readingTime}분`);
    
    const hasValidData = !!(seoData.seoTitle && seoData.seoDesc && seoData.slug && seoData.keywords.length > 0);
    
    return {
      success: hasValidData,
      seoTitle: seoData.seoTitle,
      seoDesc: seoData.seoDesc,
      slug: seoData.slug,
      keywordCount: seoData.keywords.length,
      keywords: seoData.keywords,
      readingTime: seoData.readingTime
    };
    
  } catch (error) {
    Logger.log(`❌ SEO 메타데이터 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 WordPress 시스템 통합 테스트
 */
function testWordPressSystemIntegration() {
  Logger.log("=== WordPress 시스템 통합 테스트 ===");
  
  const results = {
    connection: testWordPressConnection(),
    endpoints: testWordPressAPIEndpoints(),
    categories: testCategoryManagement(),
    tags: testTagManagement(),
    postCreation: testPostCreation(),
    postFormats: testPostFormats(),
    mediaUpload: testMediaUpload(),
    seoMetadata: testSEOMetadata()
  };
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  Logger.log(`=== WordPress 시스템 테스트 결과 ===`);
  Logger.log(`성공률: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    const errorInfo = result.error ? ` (${result.error})` : '';
    const firewallInfo = result.isFirewallBlocked ? ' [Firewall Blocked]' : '';
    Logger.log(`${status} ${test}${errorInfo}${firewallInfo}`);
  });
  
  return results;
}