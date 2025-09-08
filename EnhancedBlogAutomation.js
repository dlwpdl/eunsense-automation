/**
 * 🚀 향상된 블로그 자동화 시스템
 * Featured Image, 캐싱, 에러 처리, 모니터링이 통합된 버전
 */

/**
 * 향상된 자동화 워크플로우 실행
 */
function runEnhancedBlogAutomation() {
  Logger.log("=== 🚀 향상된 블로그 자동화 시작 ===");
  
  return trackExecutionMetrics('enhanced_blog_automation', () => {
    const startTime = Date.now();
    const results = {
      trendsCollected: 0,
      postsPublished: 0,
      featuredImagesSet: 0,
      errors: [],
      duration: 0
    };
    
    try {
      // 1. 트렌드 수집 (향상된 버전)
      Logger.log("📈 향상된 트렌드 수집 시작");
      const trendsAdded = addEnhancedTrendsToSheet();
      results.trendsCollected = trendsAdded;
      Logger.log(`✅ 트렌드 수집 완료: ${trendsAdded}개`);
      
      // 2. 향상된 포스트 발행
      Logger.log("📝 향상된 포스트 발행 시작");
      const publishResults = publishEnhancedPosts();
      results.postsPublished = publishResults.published;
      results.featuredImagesSet = publishResults.featuredImages;
      results.errors = publishResults.errors;
      
      Logger.log(`✅ 포스트 발행 완료: ${publishResults.published}개`);
      Logger.log(`🖼️ Featured Image 설정: ${publishResults.featuredImages}개`);
      
      results.duration = Date.now() - startTime;
      
      Logger.log("=== ✅ 향상된 블로그 자동화 완료 ===");
      Logger.log(`총 소요시간: ${Math.round(results.duration / 1000)}초`);
      
      return results;
      
    } catch (error) {
      logError(error, ERROR_SEVERITY.HIGH, { workflow: 'enhanced_automation' });
      throw error;
    }
    
  }, { enhanced: true });
}

/**
 * 향상된 포스트 발행 (Featured Image 통합)
 */
function publishEnhancedPosts() {
  Logger.log("📝 향상된 포스트 발행 시작");
  
  const config = validateEnhancedConfig();
  const ss = config.SHEET_ID ? 
    SpreadsheetApp.openById(config.SHEET_ID) : 
    SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss) {
    throw new Error("스프레드시트에 바인딩되어 있지 않습니다");
  }
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) {
    throw new Error(`시트 "${config.SHEET_NAME}"를 찾을 수 없습니다`);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log("발행할 주제가 없습니다");
    return { published: 0, featuredImages: 0, errors: [] };
  }
  
  const results = {
    published: 0,
    featuredImages: 0,
    errors: []
  };
  
  // 미발행 주제들 찾기
  const unpublishedRows = [];
  for (let r = 2; r <= data.length; r++) {
    const row = data[r-1];
    const topic = String(row[0] || "").trim();
    const status = String(row[1] || "").trim();
    
    if (topic && !status) {
      unpublishedRows.push({ row: r, topic, data: row });
    }
  }
  
  Logger.log(`📋 발행 대상: ${unpublishedRows.length}개 (제한: ${config.DAILY_LIMIT}개)`);
  
  // 일일 제한 적용
  const targetRows = unpublishedRows.slice(0, config.DAILY_LIMIT);
  
  for (const targetRow of targetRows) {
    try {
      const publishResult = _publishSinglePostEnhanced(sheet, targetRow, config);
      
      if (publishResult.success) {
        results.published++;
        if (publishResult.featuredImageSet) {
          results.featuredImages++;
        }
        Logger.log(`✅ 발행 성공: ${targetRow.topic}`);
      } else {
        results.errors.push({ topic: targetRow.topic, error: publishResult.error });
        Logger.log(`❌ 발행 실패: ${targetRow.topic} - ${publishResult.error}`);
      }
      
      // 발행 간격 조절
      if (config.POST_INTERVAL_MS > 0) {
        Utilities.sleep(config.POST_INTERVAL_MS);
      }
      
    } catch (error) {
      const errorMsg = `포스트 발행 중 오류: ${error.message}`;
      results.errors.push({ topic: targetRow.topic, error: errorMsg });
      Logger.log(`❌ ${errorMsg}`);
      
      // 에러가 있어도 다음 포스트 계속 처리
      continue;
    }
  }
  
  Logger.log(`📊 발행 결과: ${results.published}개 성공, ${results.errors.length}개 실패`);
  return results;
}

/**
 * 단일 포스트 향상된 발행
 */
function _publishSinglePostEnhanced(sheet, targetRow, config) {
  const { row, topic, data } = targetRow;
  
  Logger.log(`📝 포스트 생성 시작: ${topic}`);
  
  try {
    // 1. AI 글 생성 (캐시 적용)
    const aiResult = getCachedAIResponse(topic, "KR", () => {
      return withSecurityCheck('AI 글 생성', () => {
        return generateHtmlWithLanguage(topic, "KR");
      }, {
        service: 'AI',
        validateInput: () => InputValidator.validateTopic(topic)
      });
    });
    
    if (!aiResult || !aiResult.title || !aiResult.html) {
      throw new Error("AI 글 생성 실패");
    }
    
    // 2. HTML 정리 및 섹션 이미지 삽입
    const cleaned = sanitizeHtmlBeforePublish(aiResult.html, aiResult.title);
    let htmlWithImages = injectSectionImages(cleaned, aiResult.title, aiResult.subtopics || []);
    
    // 3. 향상된 Featured Image 검색 및 설정
    Logger.log("🖼️ 고화질 Featured Image 검색");
    const featuredImageData = findAndSetFeaturedImage(topic, aiResult.title);
    
    let featuredImageSet = false;
    
    if (featuredImageData && featuredImageData.url) {
      // 본문에 Featured Image 삽입 (스타일 개선)
      const featuredImageHtml = _generateFeaturedImageHTML(featuredImageData, aiResult.title);
      htmlWithImages = featuredImageHtml + "\n\n" + htmlWithImages;
      Logger.log(`✅ Featured Image 준비 완료: ${featuredImageData.url} (품질: ${featuredImageData.qualityScore})`);
    }
    
    // 4. SEO 최적화
    const seoTitle = generateSEOTitle(aiResult.title);
    const seoDesc = generateSEODescription(aiResult.html, aiResult.title);
    const slug = generateSEOSlug(aiResult.title);
    
    // 5. 카테고리/태그 처리
    const categoryIds = _processCategories(data, aiResult.categories, config);
    const tagIds = _processTags(data, aiResult.tags, config);
    
    // 6. WordPress 포스트 생성
    Logger.log("📝 WordPress 포스트 생성");
    const postId = wpCreatePost({
      baseUrl: config.WP_BASE,
      user: config.WP_USER,
      appPass: config.WP_APP_PASS,
      title: seoTitle,
      content: htmlWithImages,
      excerpt: seoDesc,
      slug: slug,
      status: "publish",
      categories: categoryIds,
      tags: tagIds,
      format: "standard"
    });
    
    if (!postId) {
      throw new Error("WordPress 포스트 생성 실패");
    }
    
    Logger.log(`✅ WordPress 포스트 생성 완료: ID ${postId}`);
    
    // 7. Featured Media 설정 (WordPress 네이티브)
    if (featuredImageData && featuredImageData.url) {
      Logger.log("🖼️ WordPress Featured Media 설정 시작");
      
      const mediaId = withEnhancedRetry(() => {
        return _uploadAndSetFeaturedImage(postId, featuredImageData);
      }, {
        maxRetries: 2,
        retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.WORDPRESS]
      })();
      
      if (mediaId) {
        Logger.log(`✅ Featured Media 설정 완료: Media ${mediaId}`);
        featuredImageSet = true;
      } else {
        Logger.log("⚠️ Featured Media 설정 실패, 본문 이미지만 표시");
      }
    }
    
    // 8. 시트에 결과 기록
    const postUrl = getPostUrl(config.WP_BASE, postId);
    sheet.getRange(row, 2).setValue("posted");
    sheet.getRange(row, 3).setValue(postUrl);
    sheet.getRange(row, 4).setValue(new Date());
    
    Logger.log(`✅ 포스트 발행 완료: ${postUrl}`);
    
    return {
      success: true,
      postId: postId,
      postUrl: postUrl,
      featuredImageSet: featuredImageSet
    };
    
  } catch (error) {
    Logger.log(`❌ 포스트 발행 실패: ${error.message}`);
    
    // 시트에 에러 상태 기록
    sheet.getRange(row, 2).setValue(`error: ${error.message.substring(0, 50)}`);
    
    return {
      success: false,
      error: error.message,
      featuredImageSet: false
    };
  }
}

/**
 * Featured Image HTML 생성 (스타일 개선)
 */
function _generateFeaturedImageHTML(featuredImageData, title) {
  const qualityBadge = featuredImageData.qualityScore >= 0.8 ? '🌟 프리미엄' : 
                       featuredImageData.qualityScore >= 0.6 ? '⭐ 고품질' : '📸 표준';
  
  return `<div style="text-align: center; margin: 40px 0; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);">
  <img src="${featuredImageData.url}" 
       alt="${featuredImageData.alt || title}" 
       style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.2);" />
  <div style="margin-top: 18px; color: white; font-size: 0.9em; opacity: 0.9;">
    <div style="font-weight: 600; margin-bottom: 5px;">${qualityBadge} Featured Image</div>
    <div style="font-size: 0.8em; opacity: 0.8;">
      ${featuredImageData.width}×${featuredImageData.height} | 품질: ${featuredImageData.qualityScore} | ${featuredImageData.source}
      ${featuredImageData.photographer ? ` | by ${featuredImageData.photographer}` : ''}
    </div>
  </div>
</div>`;
}

/**
 * 카테고리 처리 (개선)
 */
function _processCategories(rowData, aiCategories, config) {
  const sheetCategory = String(rowData[4] || "").trim();
  
  if (sheetCategory) {
    // 시트 카테고리 우선 사용
    const englishCategory = translateCategoryToEnglish(sheetCategory);
    return [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, englishCategory)];
  } else if (Array.isArray(aiCategories) && aiCategories.length > 0) {
    // AI 생성 카테고리 사용
    return aiCategories.map(cat => 
      ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, cat)
    );
  } else {
    // 기본 카테고리
    return [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, "General")];
  }
}

/**
 * 태그 처리 (개선)
 */
function _processTags(rowData, aiTags, config) {
  let allTags = [];
  
  // 시트 태그
  const sheetTags = String(rowData[5] || "").trim();
  if (sheetTags) {
    const sheetTagList = sheetTags.split(",").map(tag => tag.trim()).filter(tag => tag);
    allTags.push(...sheetTagList);
  }
  
  // AI 생성 태그
  if (Array.isArray(aiTags)) {
    allTags.push(...aiTags);
  }
  
  // 중복 제거 및 제한 (최대 8개)
  const uniqueTags = [...new Set(allTags)].slice(0, 8);
  
  return ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, uniqueTags);
}

/**
 * 향상된 블로그 자동화 테스트
 */
function testEnhancedBlogAutomation() {
  Logger.log("🧪 향상된 블로그 자동화 테스트");
  
  const startTime = Date.now();
  
  try {
    // 테스트용 주제
    const testTopic = "AI technology trends 2025 comprehensive guide";
    
    // 1. Featured Image 시스템 테스트
    Logger.log("🖼️ Featured Image 시스템 테스트");
    const featuredImage = findAndSetFeaturedImage(testTopic, "AI Technology Guide 2025");
    
    const imageTestResult = {
      hasImage: !!featuredImage,
      highQuality: featuredImage ? featuredImage.qualityScore >= 0.6 : false,
      resolution: featuredImage ? `${featuredImage.width}x${featuredImage.height}` : 'N/A'
    };
    
    // 2. 캐시 시스템 테스트
    Logger.log("💾 캐시 시스템 테스트");
    const cacheStats = getCacheStats();
    
    // 3. 보안 시스템 테스트
    Logger.log("🔐 보안 시스템 테스트");
    const securityAudit = auditSecuritySettings();
    
    const testResults = {
      featuredImage: imageTestResult,
      cacheStats: {
        totalEntries: cacheStats?.totalEntries || 0,
        totalSizeMB: Math.round((cacheStats?.totalSizeMB || 0) * 100) / 100
      },
      securityStatus: securityAudit.configurationSecurity?.httpsOnly ? 'SECURE' : 'NEEDS_REVIEW',
      duration: Date.now() - startTime
    };
    
    Logger.log("=== 향상된 시스템 테스트 결과 ===");
    Logger.log(`Featured Image: ${imageTestResult.hasImage ? '✅' : '❌'} (품질: ${imageTestResult.highQuality ? '고품질' : '일반'})`);
    Logger.log(`해상도: ${imageTestResult.resolution}`);
    Logger.log(`캐시 항목: ${testResults.cacheStats.totalEntries}개 (${testResults.cacheStats.totalSizeMB}MB)`);
    Logger.log(`보안 상태: ${testResults.securityStatus}`);
    Logger.log(`테스트 시간: ${Math.round(testResults.duration / 1000)}초`);
    
    return {
      success: imageTestResult.hasImage && testResults.securityStatus === 'SECURE',
      results: testResults
    };
    
  } catch (error) {
    Logger.log(`❌ 향상된 시스템 테스트 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 시스템 성능 벤치마크
 */
function benchmarkEnhancedSystem() {
  Logger.log("⚡ 향상된 시스템 성능 벤치마크");
  
  const benchmarks = {
    trendsCollection: benchmarkFunction(() => fetchTrendingTopicsEnhanced(), 3, "향상된 트렌드 수집"),
    featuredImageSearch: benchmarkFunction(() => findAndSetFeaturedImage("AI technology", "AI Guide"), 3, "Featured Image 검색"),
    cacheOperations: benchmarkFunction(() => {
      cacheManager.set('benchmark_test', { data: 'test' }, 60000);
      return cacheManager.get('benchmark_test');
    }, 5, "캐시 읽기/쓰기")
  };
  
  Logger.log("\n📊 성능 벤치마크 결과:");
  Object.entries(benchmarks).forEach(([name, result]) => {
    if (result.success) {
      Logger.log(`${name}: ${result.avgDuration}ms 평균 (성공률: ${Math.round(result.successRate * 100)}%)`);
    } else {
      Logger.log(`${name}: 벤치마크 실패`);
    }
  });
  
  return benchmarks;
}

/**
 * 전체 시스템 상태 체크
 */
function checkEnhancedSystemHealth() {
  Logger.log("🏥 향상된 시스템 건강 상태 체크");
  
  const healthChecks = {
    config: { name: '설정', test: () => validateEnhancedConfig() },
    trends: { name: '트렌드', test: () => testEnhancedTrendsService() },
    featuredImage: { name: 'Featured Image', test: () => testFeaturedImageSystem() },
    cache: { name: '캐시', test: () => getCacheStats() },
    security: { name: '보안', test: () => auditSecuritySettings() }
  };
  
  const healthResults = {};
  let healthyCount = 0;
  
  Object.entries(healthChecks).forEach(([key, check]) => {
    try {
      const result = check.test();
      const isHealthy = result.success !== false && !result.error;
      
      healthResults[key] = {
        name: check.name,
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        details: result
      };
      
      if (isHealthy) healthyCount++;
      
      Logger.log(`${isHealthy ? '✅' : '❌'} ${check.name}: ${isHealthy ? '정상' : '점검 필요'}`);
      
    } catch (error) {
      healthResults[key] = {
        name: check.name,
        status: 'ERROR',
        error: error.message
      };
      Logger.log(`💥 ${check.name}: 오류 - ${error.message}`);
    }
  });
  
  const totalChecks = Object.keys(healthChecks).length;
  const healthPercentage = Math.round((healthyCount / totalChecks) * 100);
  
  Logger.log(`\n🏥 전체 시스템 건강도: ${healthyCount}/${totalChecks} (${healthPercentage}%)`);
  
  if (healthPercentage >= 80) {
    Logger.log("✅ 시스템 상태 양호");
  } else if (healthPercentage >= 60) {
    Logger.log("⚠️ 시스템 상태 주의 - 일부 개선 필요");
  } else {
    Logger.log("🚨 시스템 상태 위험 - 즉시 점검 필요");
  }
  
  return {
    healthPercentage: healthPercentage,
    results: healthResults,
    status: healthPercentage >= 80 ? 'HEALTHY' : healthPercentage >= 60 ? 'WARNING' : 'CRITICAL'
  };
}