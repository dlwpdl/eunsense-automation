/**
 * ⚡ 성능 최적화 시스템
 * 병렬 처리, 배치 처리, 리소스 관리
 */

/**
 * 병렬 이미지 검색 (기존 개선사항)
 */
function parallelImageSearch(queries, options = {}) {
  const maxConcurrent = options.maxConcurrent || 3;
  const timeout = options.timeout || 30000;
  
  Logger.log(`🖼️ 병렬 이미지 검색 시작: ${queries.length}개 쿼리, 최대 ${maxConcurrent}개 동시 실행`);
  
  const results = [];
  const batches = [];
  
  // 배치로 나누기
  for (let i = 0; i < queries.length; i += maxConcurrent) {
    batches.push(queries.slice(i, i + maxConcurrent));
  }
  
  batches.forEach((batch, batchIndex) => {
    Logger.log(`📦 배치 ${batchIndex + 1}/${batches.length} 처리 중...`);
    
    const batchResults = batch.map(query => {
      try {
        const startTime = Date.now();
        const result = findFeaturedImageForProduct(query, `Query ${query}`);
        const duration = Date.now() - startTime;
        
        Logger.log(`✅ 이미지 검색 완료: ${query} (${duration}ms)`);
        return { query, result, success: true, duration };
        
      } catch (error) {
        Logger.log(`❌ 이미지 검색 실패: ${query} - ${error.message}`);
        return { query, error: error.message, success: false };
      }
    });
    
    results.push(...batchResults);
    
    // 배치 간 짧은 대기 (API 제한 방지)
    if (batchIndex < batches.length - 1) {
      Utilities.sleep(1000);
    }
  });
  
  const successful = results.filter(r => r.success).length;
  Logger.log(`🎯 병렬 이미지 검색 완료: ${successful}/${queries.length} 성공`);
  
  return results;
}

/**
 * 병렬 AI 글 생성 (다중 주제)
 */
function parallelAIGeneration(topics, options = {}) {
  const maxConcurrent = options.maxConcurrent || 2; // AI는 더 보수적으로
  const language = options.language || "KR";
  
  Logger.log(`🤖 병렬 AI 글 생성 시작: ${topics.length}개 주제`);
  
  const results = [];
  const batches = [];
  
  for (let i = 0; i < topics.length; i += maxConcurrent) {
    batches.push(topics.slice(i, i + maxConcurrent));
  }
  
  batches.forEach((batch, batchIndex) => {
    Logger.log(`🧠 배치 ${batchIndex + 1}/${batches.length} AI 생성 중...`);
    
    const batchResults = batch.map(topic => {
      try {
        const startTime = Date.now();
        const result = withEnhancedRetry(() => {
          return generateHtmlWithLanguage(topic, language);
        }, {
          maxRetries: 2,
          retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.API_LIMIT]
        })();
        
        const duration = Date.now() - startTime;
        
        Logger.log(`✅ AI 글 생성 완료: ${topic} (${Math.round(duration/1000)}초)`);
        return { topic, result, success: true, duration };
        
      } catch (error) {
        Logger.log(`❌ AI 글 생성 실패: ${topic} - ${error.message}`);
        return { topic, error: error.message, success: false };
      }
    });
    
    results.push(...batchResults);
    
    // AI 호출 간 더 긴 대기
    if (batchIndex < batches.length - 1) {
      Utilities.sleep(3000);
    }
  });
  
  const successful = results.filter(r => r.success).length;
  Logger.log(`🎯 병렬 AI 글 생성 완료: ${successful}/${topics.length} 성공`);
  
  return results;
}

/**
 * 배치 WordPress 포스트 발행
 */
function batchWordPressPublish(posts, options = {}) {
  const batchSize = options.batchSize || 3;
  const delayBetweenPosts = options.delayBetweenPosts || 2000;
  
  Logger.log(`📝 배치 WordPress 발행 시작: ${posts.length}개 포스트`);
  
  const results = [];
  const batches = [];
  
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize));
  }
  
  batches.forEach((batch, batchIndex) => {
    Logger.log(`📦 배치 ${batchIndex + 1}/${batches.length} 발행 중...`);
    
    batch.forEach((post, postIndex) => {
      try {
        const startTime = Date.now();
        
        // WordPress에 포스트 발행
        const result = withEnhancedRetry(() => {
          const config = getEnhancedConfig();
          return publishToWordPress(post, config);
        }, {
          maxRetries: 2,
          retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.WORDPRESS]
        })();
        
        const duration = Date.now() - startTime;
        
        Logger.log(`✅ 포스트 발행 완료: ${post.title} (${Math.round(duration/1000)}초)`);
        results.push({ post, result, success: true, duration });
        
        // 포스트 간 지연
        if (postIndex < batch.length - 1) {
          Utilities.sleep(delayBetweenPosts);
        }
        
      } catch (error) {
        Logger.log(`❌ 포스트 발행 실패: ${post.title} - ${error.message}`);
        results.push({ post, error: error.message, success: false });
      }
    });
    
    // 배치 간 더 긴 대기
    if (batchIndex < batches.length - 1) {
      Utilities.sleep(5000);
    }
  });
  
  const successful = results.filter(r => r.success).length;
  Logger.log(`🎯 배치 WordPress 발행 완료: ${successful}/${posts.length} 성공`);
  
  return results;
}

/**
 * 리소스 사용량 모니터링
 */
function monitorResourceUsage() {
  const startTime = Date.now();
  
  return {
    startTracking: () => startTime,
    getUsage: () => {
      const currentTime = Date.now();
      const executionTime = currentTime - startTime;
      
      // Google Apps Script 실행 시간 제한: 6분
      const maxExecutionTime = 6 * 60 * 1000;
      const remainingTime = maxExecutionTime - executionTime;
      const usagePercent = Math.round((executionTime / maxExecutionTime) * 100);
      
      return {
        executionTime: Math.round(executionTime / 1000),
        remainingTime: Math.round(remainingTime / 1000),
        usagePercent: usagePercent,
        isNearLimit: usagePercent > 80
      };
    },
    
    checkTimeLimit: () => {
      const usage = this.getUsage();
      if (usage.isNearLimit) {
        Logger.log(`⚠️ 실행 시간 한계 근접: ${usage.usagePercent}% (${usage.executionTime}초/${Math.round(6 * 60)}초)`);
        return false;
      }
      return true;
    }
  };
}

/**
 * 적응형 배치 크기 조정
 */
function adaptiveBatchSizing(items, processingFunction, options = {}) {
  const initialBatchSize = options.initialBatchSize || 3;
  const minBatchSize = options.minBatchSize || 1;
  const maxBatchSize = options.maxBatchSize || 10;
  const performanceTarget = options.performanceTarget || 30000; // 30초 목표
  
  let currentBatchSize = initialBatchSize;
  const results = [];
  const performanceHistory = [];
  
  Logger.log(`📊 적응형 배치 처리 시작: ${items.length}개 항목`);
  
  for (let i = 0; i < items.length; i += currentBatchSize) {
    const batch = items.slice(i, i + currentBatchSize);
    const batchStartTime = Date.now();
    
    Logger.log(`⚡ 배치 ${Math.floor(i/currentBatchSize) + 1} 처리 중 (크기: ${batch.length})...`);
    
    try {
      const batchResults = batch.map(item => processingFunction(item));
      const batchDuration = Date.now() - batchStartTime;
      
      results.push(...batchResults);
      performanceHistory.push({
        batchSize: batch.length,
        duration: batchDuration,
        avgPerItem: Math.round(batchDuration / batch.length)
      });
      
      // 성능 기반 배치 크기 조정
      if (batchDuration > performanceTarget && currentBatchSize > minBatchSize) {
        currentBatchSize = Math.max(Math.floor(currentBatchSize * 0.8), minBatchSize);
        Logger.log(`📉 배치 크기 감소: ${currentBatchSize} (너무 느림)`);
      } else if (batchDuration < performanceTarget * 0.5 && currentBatchSize < maxBatchSize) {
        currentBatchSize = Math.min(Math.floor(currentBatchSize * 1.2), maxBatchSize);
        Logger.log(`📈 배치 크기 증가: ${currentBatchSize} (여유 있음)`);
      }
      
    } catch (error) {
      Logger.log(`❌ 배치 처리 실패: ${error.message}`);
      // 에러 발생시 배치 크기 줄이기
      currentBatchSize = Math.max(Math.floor(currentBatchSize * 0.5), minBatchSize);
    }
  }
  
  // 성능 리포트
  if (performanceHistory.length > 0) {
    const avgDuration = performanceHistory.reduce((sum, p) => sum + p.duration, 0) / performanceHistory.length;
    const avgPerItem = performanceHistory.reduce((sum, p) => sum + p.avgPerItem, 0) / performanceHistory.length;
    
    Logger.log(`📊 배치 처리 성능 리포트:`);
    Logger.log(`  평균 배치 처리 시간: ${Math.round(avgDuration/1000)}초`);
    Logger.log(`  항목당 평균 처리 시간: ${Math.round(avgPerItem)}ms`);
    Logger.log(`  최종 배치 크기: ${currentBatchSize}`);
  }
  
  return results;
}

/**
 * 메모리 효율적인 대용량 데이터 처리
 */
function processLargeDataset(data, processingFunction, options = {}) {
  const chunkSize = options.chunkSize || 50;
  const memoryCheckInterval = options.memoryCheckInterval || 10;
  
  Logger.log(`💾 대용량 데이터 처리 시작: ${data.length}개 항목 (청크 크기: ${chunkSize})`);
  
  const results = [];
  let processedCount = 0;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    try {
      const chunkResults = chunk.map((item, index) => {
        const result = processingFunction(item);
        processedCount++;
        
        // 주기적으로 진행 상황 로그
        if (processedCount % memoryCheckInterval === 0) {
          const progress = Math.round((processedCount / data.length) * 100);
          Logger.log(`📈 처리 진행률: ${progress}% (${processedCount}/${data.length})`);
        }
        
        return result;
      });
      
      results.push(...chunkResults);
      
      // 메모리 정리를 위한 가비지 컬렉션 힌트
      if (i > 0 && i % (chunkSize * 5) === 0) {
        Logger.log(`🧹 메모리 정리 힌트 (${Math.round(i/chunkSize)}번째 청크)`);
        Utilities.sleep(100); // 짧은 대기로 GC 기회 제공
      }
      
    } catch (error) {
      Logger.log(`❌ 청크 처리 실패 (${i}-${i+chunkSize}): ${error.message}`);
    }
  }
  
  Logger.log(`✅ 대용량 데이터 처리 완료: ${results.length}/${data.length}개 성공`);
  return results;
}

/**
 * 성능 벤치마크 도구
 */
function benchmarkFunction(fn, iterations = 3, name = "함수") {
  Logger.log(`⏱️ 성능 벤치마크 시작: ${name} (${iterations}회 실행)`);
  
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      
      results.push({
        iteration: i + 1,
        duration: duration,
        success: true,
        result: result
      });
      
      Logger.log(`  ${i + 1}회차: ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      results.push({
        iteration: i + 1,
        duration: duration,
        success: false,
        error: error.message
      });
      
      Logger.log(`  ${i + 1}회차: 실패 (${duration}ms) - ${error.message}`);
    }
  }
  
  // 통계 계산
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const durations = successful.map(r => r.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    Logger.log(`📊 ${name} 벤치마크 결과:`);
    Logger.log(`  성공률: ${successful.length}/${iterations} (${Math.round(successful.length/iterations*100)}%)`);
    Logger.log(`  평균 실행시간: ${Math.round(avgDuration)}ms`);
    Logger.log(`  최소 실행시간: ${minDuration}ms`);
    Logger.log(`  최대 실행시간: ${maxDuration}ms`);
    
    return {
      success: true,
      avgDuration: avgDuration,
      minDuration: minDuration,
      maxDuration: maxDuration,
      successRate: successful.length / iterations
    };
  } else {
    Logger.log(`❌ ${name} 벤치마크: 모든 실행 실패`);
    return { success: false, results: results };
  }
}

/**
 * 워크플로우 최적화된 실행
 */
function optimizedWorkflow(topics, options = {}) {
  Logger.log("🚀 최적화된 워크플로우 시작");
  
  const resourceMonitor = monitorResourceUsage();
  const config = getEnhancedConfig();
  
  try {
    // 1단계: 병렬 AI 글 생성
    Logger.log("1️⃣ 병렬 AI 글 생성 시작");
    const aiResults = parallelAIGeneration(topics.slice(0, config.DAILY_LIMIT), {
      maxConcurrent: 2,
      language: "KR"
    });
    
    const successfulPosts = aiResults.filter(r => r.success).map(r => ({
      title: r.result.title,
      content: r.result.html,
      categories: r.result.categories,
      tags: r.result.tags,
      topic: r.topic
    }));
    
    if (!resourceMonitor.checkTimeLimit()) {
      Logger.log("⏰ 시간 제한으로 인해 워크플로우 단축");
      return { success: false, reason: "시간 제한" };
    }
    
    // 2단계: 병렬 이미지 검색
    Logger.log("2️⃣ 병렬 이미지 검색 시작");
    const imageQueries = successfulPosts.map(post => post.topic);
    const imageResults = parallelImageSearch(imageQueries, {
      maxConcurrent: 3
    });
    
    // 이미지를 포스트에 연결
    successfulPosts.forEach((post, index) => {
      const imageResult = imageResults[index];
      if (imageResult && imageResult.success) {
        post.featuredImage = imageResult.result.url;
      }
    });
    
    if (!resourceMonitor.checkTimeLimit()) {
      Logger.log("⏰ 시간 제한으로 인해 WordPress 발행 건너뛰기");
      return { success: true, posts: successfulPosts, published: false };
    }
    
    // 3단계: 배치 WordPress 발행
    Logger.log("3️⃣ 배치 WordPress 발행 시작");
    const publishResults = batchWordPressPublish(successfulPosts, {
      batchSize: 2,
      delayBetweenPosts: 3000
    });
    
    const usage = resourceMonitor.getUsage();
    Logger.log(`⚡ 최적화된 워크플로우 완료 (${usage.executionTime}초 소요)`);
    
    return {
      success: true,
      aiResults: aiResults,
      imageResults: imageResults, 
      publishResults: publishResults,
      performance: usage
    };
    
  } catch (error) {
    logError(error, ERROR_SEVERITY.HIGH, { workflow: "optimized" });
    return { success: false, error: error.message };
  }
}