/**
 * 고급 에러 처리 및 복구 시스템
 */

const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  API_LIMIT: 'API_LIMIT_EXCEEDED', 
  TIMEOUT: 'EXECUTION_TIMEOUT',
  AUTHENTICATION: 'AUTH_ERROR',
  INVALID_DATA: 'INVALID_DATA',
  WORDPRESS: 'WORDPRESS_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * 스마트 재시도 로직
 */
function withRetry(fn, options = {}) {
  const defaultOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000
  };
  
  const config = { ...defaultOptions, ...options };
  
  return async function(...args) {
    let lastError;
    let delay = config.initialDelay;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = fn.apply(this, args);
        
        // 성공 시 결과 반환
        if (attempt > 0) {
          Logger.log(`✅ ${fn.name} 재시도 성공 (${attempt}/${config.maxRetries})`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // 마지막 시도인 경우 에러 발생
        if (attempt === config.maxRetries) {
          Logger.log(`❌ ${fn.name} 최종 실패: ${error.message}`);
          break;
        }
        
        // 재시도 불가능한 에러 확인
        if (isNonRetryableError(error)) {
          Logger.log(`🚫 ${fn.name} 재시도 불가능한 에러: ${error.message}`);
          break;
        }
        
        Logger.log(`⏳ ${fn.name} 재시도 ${attempt + 1}/${config.maxRetries} (${delay}ms 대기)`);
        
        // 지연 후 재시도
        Utilities.sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
    
    throw lastError;
  };
}

/**
 * 재시도 불가능한 에러 판별
 */
function isNonRetryableError(error) {
  const nonRetryablePatterns = [
    /invalid.*api.*key/i,
    /unauthorized/i,
    /forbidden/i,
    /not.*found/i,
    /invalid.*credentials/i
  ];
  
  return nonRetryablePatterns.some(pattern => 
    pattern.test(error.message)
  );
}

/**
 * 에러 분류 및 로깅
 */
function classifyAndLogError(error, context = '') {
  const errorType = getErrorType(error);
  const errorInfo = {
    type: errorType,
    message: error.message,
    context: context,
    timestamp: new Date(),
    stack: error.stack || 'No stack trace'
  };
  
  // 에러 타입별 처리
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      Logger.log(`🌐 네트워크 오류 [${context}]: ${error.message}`);
      break;
      
    case ERROR_TYPES.API_LIMIT:
      Logger.log(`📊 API 한도 초과 [${context}]: ${error.message}`);
      break;
      
    case ERROR_TYPES.TIMEOUT:
      Logger.log(`⏰ 실행 시간 초과 [${context}]: ${error.message}`);
      break;
      
    case ERROR_TYPES.AUTHENTICATION:
      Logger.log(`🔐 인증 오류 [${context}]: ${error.message}`);
      break;
      
    case ERROR_TYPES.WORDPRESS:
      Logger.log(`📝 WordPress 오류 [${context}]: ${error.message}`);
      break;
      
    default:
      Logger.log(`❓ 알 수 없는 오류 [${context}]: ${error.message}`);
  }
  
  // 에러 로그를 시트에 저장 (선택사항)
  saveErrorLog(errorInfo);
  
  return errorInfo;
}

/**
 * 에러 타입 분류
 */
function getErrorType(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('connection')) {
    return ERROR_TYPES.NETWORK;
  }
  
  if (message.includes('quota') || message.includes('limit') || message.includes('rate')) {
    return ERROR_TYPES.API_LIMIT;
  }
  
  if (message.includes('timeout') || message.includes('exceeded maximum execution')) {
    return ERROR_TYPES.TIMEOUT;
  }
  
  if (message.includes('unauthorized') || message.includes('authentication') || message.includes('api key')) {
    return ERROR_TYPES.AUTHENTICATION;
  }
  
  if (message.includes('wordpress') || message.includes('wp-json')) {
    return ERROR_TYPES.WORDPRESS;
  }
  
  return ERROR_TYPES.UNKNOWN;
}

/**
 * 에러 로그 저장
 */
function saveErrorLog(errorInfo) {
  try {
    const config = getConfig();
    if (!config.SHEET_ID) return;
    
    const ss = SpreadsheetApp.openById(config.SHEET_ID);
    let errorSheet = ss.getSheetByName('ErrorLog');
    
    if (!errorSheet) {
      errorSheet = ss.insertSheet('ErrorLog');
      errorSheet.getRange(1, 1, 1, 5).setValues([
        ['Timestamp', 'Type', 'Context', 'Message', 'Stack']
      ]);
    }
    
    const lastRow = errorSheet.getLastRow();
    errorSheet.getRange(lastRow + 1, 1, 1, 5).setValues([[
      errorInfo.timestamp,
      errorInfo.type,
      errorInfo.context,
      errorInfo.message,
      errorInfo.stack.substring(0, 1000) // 스택 트레이스는 1000자로 제한
    ]]);
    
  } catch (logError) {
    Logger.log(`에러 로그 저장 실패: ${logError.message}`);
  }
}

/**
 * 안전한 함수 실행 래퍼
 */
function safeExecute(fn, fallback = null, context = '') {
  try {
    return fn();
  } catch (error) {
    classifyAndLogError(error, context);
    
    if (fallback && typeof fallback === 'function') {
      Logger.log(`🔄 폴백 실행: ${context}`);
      try {
        return fallback();
      } catch (fallbackError) {
        Logger.log(`❌ 폴백도 실패: ${fallbackError.message}`);
      }
    }
    
    return null;
  }
}

/**
 * 배치 처리 시 개별 아이템 안전 실행
 */
function safeBatchProcess(items, processFn, options = {}) {
  const results = [];
  const errors = [];
  let successCount = 0;
  
  const { continueOnError = true, logProgress = true } = options;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      if (logProgress && i % 5 === 0) {
        Logger.log(`📊 배치 처리 진행률: ${i}/${items.length} (성공: ${successCount})`);
      }
      
      const result = processFn(item, i);
      results.push({ success: true, result, item });
      successCount++;
      
    } catch (error) {
      const errorInfo = classifyAndLogError(error, `batch_item_${i}`);
      results.push({ success: false, error: errorInfo, item });
      errors.push({ item, error: errorInfo, index: i });
      
      if (!continueOnError) {
        Logger.log(`🛑 배치 처리 중단: ${error.message}`);
        break;
      }
    }
  }
  
  Logger.log(`✅ 배치 처리 완료: ${successCount}/${items.length} 성공, ${errors.length} 실패`);
  
  return {
    results,
    errors,
    successCount,
    totalCount: items.length,
    successRate: (successCount / items.length * 100).toFixed(1) + '%'
  };
}