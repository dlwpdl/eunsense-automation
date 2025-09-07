/**
 * 성능 최적화 설정
 * 실행 시간 단축 및 효율성 개선
 */

const PERFORMANCE_CONFIG = {
  // 이미지 검색 설정 (기존 유지)
  images: {
    maxKeywords: 3,           // 기존 3개 키워드 유지
    maxSectionImages: 4,      // 기존 4개 섹션 이미지 유지
    enableAIKeywords: true,   // AI 키워드 생성 유지
    cacheEnabled: true,       // 이미지 캐싱 활성화
    cacheDuration: 24 * 60 * 60 * 1000 // 24시간
  },
  
  // AI 콘텐츠 설정 (기존 유지)
  content: {
    targetLength: 7000,       // 기존 6000-8000자 범위 유지 (평균값)
    maxSections: 6,           // 기존 5-6개 섹션 유지
    useSimplePrompts: false,  // 기존 복잡한 프롬프트 유지
    enableParallelProcessing: false // 순차 처리 (안정성 우선)
  },
  
  // 실행 시간 관리
  execution: {
    maxTime: 300000,          // 5분 제한
    checkInterval: 30000,     // 30초마다 시간 체크
    earlyTermination: true,   // 시간 초과 시 조기 종료
    batchSize: 1              // 한 번에 1개 포스트만 처리
  },
  
  // 에러 처리
  reliability: {
    maxRetries: 2,            // 최대 재시도 2회
    retryDelay: 5000,         // 5초 대기 후 재시도
    skipOnError: true,        // 에러 시 다음 항목으로 건너뛰기
    fallbackEnabled: true     // 폴백 메커니즘 활성화
  }
};

/**
 * 성능 모니터링
 */
function trackPerformance(functionName, startTime) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  Logger.log(`⏱️ ${functionName} 실행 시간: ${minutes}분 ${seconds}초`);
  
  // 5분 초과 시 경고
  if (duration > PERFORMANCE_CONFIG.execution.maxTime) {
    Logger.log(`⚠️ 실행 시간 초과: ${functionName} (${minutes}분 ${seconds}초)`);
  }
  
  return duration;
}

/**
 * 메모리 사용량 체크
 */
function checkMemoryUsage() {
  const used = DriveApp.getStorageUsed();
  Logger.log(`💾 메모리 사용량: ${Math.round(used / 1024 / 1024)}MB`);
}

/**
 * 설정 적용 (기존 설정 유지하되 모니터링 추가)
 */
function getOptimizedConfig() {
  const baseConfig = getConfig();
  
  return {
    ...baseConfig,
    // 기존 설정 유지, 모니터링 기능만 추가
    PERFORMANCE_MONITORING: true,
    MAX_EXECUTION_TIME: PERFORMANCE_CONFIG.execution.maxTime,
    ENABLE_ERROR_RECOVERY: PERFORMANCE_CONFIG.reliability.fallbackEnabled
  };
}

/**
 * 실행 시간 체크 및 조기 종료
 */
function checkExecutionTime(startTime, functionName = '') {
  const elapsed = Date.now() - startTime;
  
  if (elapsed > PERFORMANCE_CONFIG.execution.maxTime) {
    const minutes = Math.floor(elapsed / 60000);
    Logger.log(`🛑 실행 시간 초과로 ${functionName} 조기 종료: ${minutes}분`);
    throw new Error(`Execution timeout: ${functionName} exceeded ${minutes} minutes`);
  }
  
  return elapsed;
}