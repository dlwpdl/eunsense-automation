/**
 * 🚨 향상된 에러 처리 및 복구 시스템
 * 스마트 재시도, 에러 분류, 알림 시스템 통합
 */

const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  API_LIMIT: 'API_LIMIT_EXCEEDED', 
  TIMEOUT: 'EXECUTION_TIMEOUT',
  AUTHENTICATION: 'AUTH_ERROR',
  INVALID_DATA: 'INVALID_DATA',
  WORDPRESS: 'WORDPRESS_ERROR',
  AI_SERVICE: 'AI_SERVICE_ERROR',
  IMAGE_SERVICE: 'IMAGE_SERVICE_ERROR',
  TRENDS_SERVICE: 'TRENDS_SERVICE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM', 
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * 향상된 재시도 로직 (지수 백오프 + 지터)
 */
function withEnhancedRetry(fn, options = {}) {
  const defaultOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    jitter: true,
    retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT, ERROR_TYPES.API_LIMIT]
  };
  
  const config = { ...defaultOptions, ...options };
  
  return function executeWithRetry(...args) {
    let lastError;
    let delay = config.initialDelay;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        lastError = error;
        const errorType = classifyError(error);
        
        Logger.log(`❌ 시도 ${attempt + 1}/${config.maxRetries + 1} 실패: ${errorType} - ${error.message}`);
        
        // 재시도 불가능한 에러인 경우 즉시 종료
        if (!config.retryableErrors.includes(errorType)) {
          Logger.log(`🚫 재시도 불가능한 에러 유형: ${errorType}`);
          break;
        }
        
        // 마지막 시도인 경우
        if (attempt === config.maxRetries) {
          break;
        }
        
        // 지연 시간 계산 (지터 적용)
        let actualDelay = delay;
        if (config.jitter) {
          actualDelay = delay + (Math.random() * delay * 0.1); // 10% 지터
        }
        
        Logger.log(`⏱️  ${Math.round(actualDelay/1000)}초 후 재시도...`);
        Utilities.sleep(actualDelay);
        
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
    
    // 모든 재시도 실패
    const finalError = new Error(`${config.maxRetries + 1}번의 시도 후 실패: ${lastError.message}`);
    finalError.originalError = lastError;
    finalError.errorType = classifyError(lastError);
    
    logError(finalError, ERROR_SEVERITY.HIGH);
    throw finalError;
  };
}

/**
 * 에러 분류 시스템
 */
function classifyError(error) {
  const message = error.message.toLowerCase();
  
  // 네트워크 관련 에러
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_TYPES.TIMEOUT;
  }
  
  if (message.includes('network') || message.includes('connection') || 
      message.includes('dns') || message.includes('unreachable')) {
    return ERROR_TYPES.NETWORK;
  }
  
  // API 관련 에러
  if (message.includes('rate limit') || message.includes('quota exceeded') ||
      message.includes('429') || message.includes('too many requests')) {
    return ERROR_TYPES.API_LIMIT;
  }
  
  if (message.includes('401') || message.includes('403') || 
      message.includes('unauthorized') || message.includes('forbidden')) {
    return ERROR_TYPES.AUTHENTICATION;
  }
  
  // 서비스별 에러
  if (message.includes('wordpress') || message.includes('wp-json')) {
    return ERROR_TYPES.WORDPRESS;
  }
  
  if (message.includes('openai') || message.includes('gemini') || 
      message.includes('anthropic') || message.includes('grok')) {
    return ERROR_TYPES.AI_SERVICE;
  }
  
  if (message.includes('pexels') || message.includes('unsplash') || 
      message.includes('google search')) {
    return ERROR_TYPES.IMAGE_SERVICE;
  }
  
  if (message.includes('trends') || message.includes('serpapi')) {
    return ERROR_TYPES.TRENDS_SERVICE;
  }
  
  // 데이터 관련 에러
  if (message.includes('invalid') || message.includes('malformed') ||
      message.includes('parse') || message.includes('json')) {
    return ERROR_TYPES.INVALID_DATA;
  }
  
  return ERROR_TYPES.UNKNOWN;
}

/**
 * 구조화된 에러 로깅
 */
function logError(error, severity = ERROR_SEVERITY.MEDIUM, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    severity: severity,
    type: error.errorType || classifyError(error),
    message: error.message,
    stack: error.stack,
    context: context,
    environment: getEnhancedConfig().ENVIRONMENT
  };
  
  // 콘솔 로그 (색상 코딩)
  const severityEmoji = {
    [ERROR_SEVERITY.LOW]: '⚠️',
    [ERROR_SEVERITY.MEDIUM]: '❌', 
    [ERROR_SEVERITY.HIGH]: '🚨',
    [ERROR_SEVERITY.CRITICAL]: '💥'
  };
  
  Logger.log(`${severityEmoji[severity]} [${severity}] ${errorLog.type}: ${error.message}`);
  
  // 상세 로그 (DEBUG 모드)
  const config = getEnhancedConfig();
  if (config.LOG_LEVEL === 'DEBUG') {
    Logger.log(`상세 정보: ${JSON.stringify(errorLog, null, 2)}`);
  }
  
  // 에러 통계 업데이트
  updateErrorStats(errorLog.type, severity);
  
  // 심각한 에러인 경우 알림 발송
  if (severity === ERROR_SEVERITY.HIGH || severity === ERROR_SEVERITY.CRITICAL) {
    sendErrorAlert(errorLog);
  }
  
  return errorLog;
}

/**
 * 에러 통계 추적
 */
function updateErrorStats(errorType, severity) {
  const props = PropertiesService.getScriptProperties();
  const today = new Date().toISOString().split('T')[0];
  const statsKey = `ERROR_STATS_${today}`;
  
  let stats = {};
  try {
    const existingStats = props.getProperty(statsKey);
    if (existingStats) {
      stats = JSON.parse(existingStats);
    }
  } catch (e) {
    // 파싱 실패시 새로 시작
  }
  
  if (!stats[errorType]) {
    stats[errorType] = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  }
  
  stats[errorType][severity]++;
  stats.lastUpdated = new Date().toISOString();
  
  props.setProperty(statsKey, JSON.stringify(stats));
}

/**
 * 에러 알림 시스템
 */
function sendErrorAlert(errorLog) {
  const config = getEnhancedConfig();
  
  if (!config.ENABLE_EMAIL_ALERTS || !config.ALERT_EMAIL) {
    return;
  }
  
  try {
    const subject = `🚨 WordPress 자동화 시스템 에러 알림 [${errorLog.severity}]`;
    const body = `
에러 발생 시각: ${errorLog.timestamp}
환경: ${errorLog.environment}
에러 유형: ${errorLog.type}
심각도: ${errorLog.severity}

에러 메시지:
${errorLog.message}

컨텍스트:
${JSON.stringify(errorLog.context, null, 2)}

이 알림은 자동으로 발송되었습니다.
시스템 상태를 확인하려면 runAllTests() 함수를 실행하세요.
    `;
    
    GmailApp.sendEmail(config.ALERT_EMAIL, subject, body);
    Logger.log(`📧 에러 알림 발송 완료: ${config.ALERT_EMAIL}`);
    
  } catch (emailError) {
    Logger.log(`📧 에러 알림 발송 실패: ${emailError.message}`);
  }
}

/**
 * 에러 복구 전략
 */
function attemptErrorRecovery(error, context = {}) {
  const errorType = classifyError(error);
  Logger.log(`🔧 에러 복구 시도: ${errorType}`);
  
  switch (errorType) {
    case ERROR_TYPES.API_LIMIT:
      return handleAPILimitRecovery(context);
      
    case ERROR_TYPES.AUTHENTICATION:
      return handleAuthRecovery(context);
      
    case ERROR_TYPES.WORDPRESS:
      return handleWordPressRecovery(context);
      
    case ERROR_TYPES.NETWORK:
      return handleNetworkRecovery(context);
      
    default:
      Logger.log(`❌ ${errorType}에 대한 자동 복구 전략이 없습니다`);
      return false;
  }
}

function handleAPILimitRecovery(context) {
  Logger.log("🔄 API 제한 복구: 다른 제공업체로 전환 시도");
  
  if (context.aiProvider) {
    // AI 제공업체 순환
    const providers = ['openai', 'gemini', 'anthropic', 'xai'];
    const currentIndex = providers.indexOf(context.aiProvider);
    const nextProvider = providers[(currentIndex + 1) % providers.length];
    
    Logger.log(`AI 제공업체 전환: ${context.aiProvider} → ${nextProvider}`);
    return { switchTo: nextProvider };
  }
  
  return false;
}

function handleAuthRecovery(context) {
  Logger.log("🔑 인증 에러 복구: API 키 검증 및 갱신 시도");
  
  // API 키 유효성 재검증
  const config = getEnhancedConfig();
  if (!config.WP_BASE || !config.WP_USER || !config.WP_APP_PASS) {
    Logger.log("❌ WordPress 인증 정보 누락");
    return false;
  }
  
  Logger.log("✅ 기본 인증 정보 확인됨");
  return true;
}

function handleWordPressRecovery(context) {
  Logger.log("🔧 WordPress 연결 복구 시도");
  
  const config = getEnhancedConfig();
  const testUrl = `${config.WP_BASE}/wp-json/wp/v2/posts?per_page=1`;
  
  try {
    const response = UrlFetchApp.fetch(testUrl, {
      method: "GET",
      headers: {
        'Authorization': `Basic ${Utilities.base64Encode(config.WP_USER + ':' + config.WP_APP_PASS)}`
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      Logger.log("✅ WordPress 연결 복구 성공");
      return true;
    }
  } catch (testError) {
    Logger.log(`❌ WordPress 연결 테스트 실패: ${testError.message}`);
  }
  
  return false;
}

function handleNetworkRecovery(context) {
  Logger.log("🌐 네트워크 에러 복구: 연결 테스트 실행");
  
  try {
    const testResponse = UrlFetchApp.fetch("https://www.google.com", {
      method: "GET",
      muteHttpExceptions: true
    });
    
    if (testResponse.getResponseCode() === 200) {
      Logger.log("✅ 인터넷 연결 정상");
      return true;
    }
  } catch (networkError) {
    Logger.log(`❌ 네트워크 연결 테스트 실패: ${networkError.message}`);
  }
  
  return false;
}

/**
 * 에러 통계 조회
 */
function getErrorStats(days = 7) {
  const props = PropertiesService.getScriptProperties();
  const stats = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const statsKey = `ERROR_STATS_${dateKey}`;
    
    const dayStats = props.getProperty(statsKey);
    if (dayStats) {
      stats[dateKey] = JSON.parse(dayStats);
    }
  }
  
  Logger.log(`📊 최근 ${days}일 에러 통계:`);
  Logger.log(JSON.stringify(stats, null, 2));
  
  return stats;
}

/**
 * 헬스 체크 시스템
 */
function systemHealthCheck() {
  Logger.log("🏥 시스템 건강 상태 체크 시작");
  
  const healthStatus = {
    timestamp: new Date().toISOString(),
    overall: 'HEALTHY',
    services: {},
    recommendations: []
  };
  
  // 각 서비스 상태 체크
  const services = [
    { name: 'Config', test: () => validateEnhancedConfig() },
    { name: 'WordPress', test: () => testWordPressOnly() },
    { name: 'AI', test: () => testAIOnly() },
    { name: 'Trends', test: () => testTrendsOnly() },
    { name: 'Images', test: () => testImagesOnly() }
  ];
  
  let healthyServices = 0;
  
  services.forEach(service => {
    try {
      const result = service.test();
      healthStatus.services[service.name] = {
        status: result.success ? 'HEALTHY' : 'UNHEALTHY',
        details: result
      };
      
      if (result.success) {
        healthyServices++;
      } else {
        healthStatus.recommendations.push(`${service.name} 서비스 확인 필요`);
      }
    } catch (error) {
      healthStatus.services[service.name] = {
        status: 'ERROR',
        error: error.message
      };
      healthStatus.recommendations.push(`${service.name} 서비스 에러 해결 필요`);
    }
  });
  
  // 전체 건강 상태 판정
  const healthRatio = healthyServices / services.length;
  if (healthRatio >= 0.8) {
    healthStatus.overall = 'HEALTHY';
  } else if (healthRatio >= 0.6) {
    healthStatus.overall = 'DEGRADED';
  } else {
    healthStatus.overall = 'CRITICAL';
  }
  
  Logger.log(`🏥 전체 건강 상태: ${healthStatus.overall} (${healthyServices}/${services.length})`);
  
  // 심각한 상태인 경우 알림
  if (healthStatus.overall === 'CRITICAL') {
    logError(new Error(`시스템 건강 상태 위험: ${healthStatus.overall}`), ERROR_SEVERITY.HIGH, {
      healthStatus: healthStatus
    });
  }
  
  return healthStatus;
}