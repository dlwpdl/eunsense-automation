/**
 * 🔐 보안 강화 시스템
 * API 키 로테이션, 요청 제한, 입력 검증, 접근 제어
 */

const SECURITY_CONFIG = {
  API_RATE_LIMITS: {
    OPENAI: { requests: 60, window: 60000 }, // 60 requests per minute
    GEMINI: { requests: 60, window: 60000 },
    PEXELS: { requests: 200, window: 3600000 }, // 200 requests per hour
    WORDPRESS: { requests: 100, window: 60000 }
  },
  
  INPUT_VALIDATION: {
    MAX_TOPIC_LENGTH: 200,
    MAX_TITLE_LENGTH: 100,
    ALLOWED_DOMAINS: ['wordpress.com', 'wp.com'],
    BLOCKED_KEYWORDS: ['<script>', 'javascript:', 'data:', 'vbscript:']
  },
  
  SESSION_LIMITS: {
    MAX_EXECUTION_TIME: 5 * 60 * 1000, // 5분
    MAX_DAILY_POSTS: 10,
    MAX_CONCURRENT_OPERATIONS: 3
  }
};

/**
 * API 키 보안 관리자
 */
class APIKeyManager {
  constructor() {
    this.keyUsage = {};
    this.rateLimits = {};
  }
  
  /**
   * 안전한 API 키 조회
   */
  getSecureAPIKey(service, keyName) {
    const config = getEnhancedConfig();
    const apiKey = config[keyName];
    
    if (!apiKey) {
      throw new Error(`API 키가 설정되지 않았습니다: ${keyName}`);
    }
    
    // API 키 형식 검증
    if (!this._validateAPIKeyFormat(service, apiKey)) {
      throw new Error(`API 키 형식이 올바르지 않습니다: ${service}`);
    }
    
    // 사용량 추적
    this._trackAPIKeyUsage(service, keyName);
    
    return apiKey;
  }
  
  /**
   * API 키 로테이션 시스템
   */
  rotateAPIKeys() {
    Logger.log("🔄 API 키 로테이션 시작");
    
    const config = getEnhancedConfig();
    const keyRotationLog = [];
    
    // 각 AI 서비스별 키 순환
    const aiServices = [
      { name: 'OpenAI', keys: ['OPENAI_API_KEY', 'OPENAI_API_KEY_BACKUP'] },
      { name: 'Gemini', keys: ['GEMINI_API_KEY', 'GEMINI_API_KEY_BACKUP'] },
      { name: 'Anthropic', keys: ['ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY_BACKUP'] }
    ];
    
    aiServices.forEach(service => {
      const primaryKey = config[service.keys[0]];
      const backupKey = config[service.keys[1]];
      
      if (primaryKey && backupKey) {
        // 키 사용량 체크
        const usage = this._getKeyUsage(service.keys[0]);
        
        if (usage.errorRate > 0.2 || usage.dailyRequests > 1000) {
          Logger.log(`🔄 ${service.name} 키 로테이션 실행 (사용량: ${usage.dailyRequests}, 에러율: ${Math.round(usage.errorRate * 100)}%)`);
          
          // Primary <-> Backup 교체
          updateConfigProperty(service.keys[0], backupKey);
          updateConfigProperty(service.keys[1], primaryKey);
          
          keyRotationLog.push(`${service.name}: 키 로테이션 완료`);
        }
      }
    });
    
    if (keyRotationLog.length > 0) {
      Logger.log("🔄 API 키 로테이션 완료:");
      keyRotationLog.forEach(log => Logger.log(`  ${log}`));
    } else {
      Logger.log("✅ 모든 API 키 상태 양호, 로테이션 불필요");
    }
  }
  
  /**
   * API 키 형식 검증
   */
  _validateAPIKeyFormat(service, key) {
    const patterns = {
      'openai': /^sk-[a-zA-Z0-9]{48,}$/,
      'gemini': /^[a-zA-Z0-9_-]{35,}$/,
      'anthropic': /^sk-ant-[a-zA-Z0-9_-]{90,}$/,
      'pexels': /^[a-zA-Z0-9]{50,}$/
    };
    
    const pattern = patterns[service.toLowerCase()];
    return pattern ? pattern.test(key) : true; // 패턴 없으면 통과
  }
  
  /**
   * API 키 사용량 추적
   */
  _trackAPIKeyUsage(service, keyName) {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `KEY_USAGE_${keyName}_${today}`;
    
    const props = PropertiesService.getScriptProperties();
    const currentUsage = parseInt(props.getProperty(usageKey) || '0');
    
    props.setProperty(usageKey, (currentUsage + 1).toString());
  }
  
  /**
   * 키 사용량 통계 조회
   */
  _getKeyUsage(keyName) {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `KEY_USAGE_${keyName}_${today}`;
    const errorKey = `KEY_ERRORS_${keyName}_${today}`;
    
    const props = PropertiesService.getScriptProperties();
    const dailyRequests = parseInt(props.getProperty(usageKey) || '0');
    const dailyErrors = parseInt(props.getProperty(errorKey) || '0');
    
    return {
      dailyRequests: dailyRequests,
      dailyErrors: dailyErrors,
      errorRate: dailyRequests > 0 ? dailyErrors / dailyRequests : 0
    };
  }
}

/**
 * 요청 제한 관리자 (Rate Limiting)
 */
class RateLimiter {
  constructor() {
    this.requests = {};
  }
  
  /**
   * 요청 제한 확인
   */
  checkRateLimit(service, identifier = 'default') {
    const config = SECURITY_CONFIG.API_RATE_LIMITS[service.toUpperCase()];
    if (!config) return true;
    
    const key = `${service}_${identifier}`;
    const now = Date.now();
    
    // 현재 윈도우의 요청들만 유지
    if (!this.requests[key]) {
      this.requests[key] = [];
    }
    
    // 윈도우 밖 요청들 제거
    this.requests[key] = this.requests[key].filter(
      timestamp => now - timestamp < config.window
    );
    
    // 제한 확인
    if (this.requests[key].length >= config.requests) {
      const oldestRequest = Math.min(...this.requests[key]);
      const resetTime = oldestRequest + config.window;
      const waitTime = Math.ceil((resetTime - now) / 1000);
      
      Logger.log(`🚫 요청 제한 도달: ${service} (${waitTime}초 후 재시도 가능)`);
      return false;
    }
    
    // 요청 기록
    this.requests[key].push(now);
    return true;
  }
  
  /**
   * 요청 제한 대기
   */
  waitForRateLimit(service, maxWaitMs = 60000) {
    const startTime = Date.now();
    
    while (!this.checkRateLimit(service) && (Date.now() - startTime) < maxWaitMs) {
      Utilities.sleep(1000);
    }
    
    return this.checkRateLimit(service);
  }
}

/**
 * 입력 검증 시스템
 */
class InputValidator {
  /**
   * 주제/제목 검증
   */
  static validateTopic(topic) {
    if (!topic || typeof topic !== 'string') {
      throw new Error('주제는 문자열이어야 합니다');
    }
    
    if (topic.length > SECURITY_CONFIG.INPUT_VALIDATION.MAX_TOPIC_LENGTH) {
      throw new Error(`주제가 너무 깁니다 (최대 ${SECURITY_CONFIG.INPUT_VALIDATION.MAX_TOPIC_LENGTH}자)`);
    }
    
    // 차단된 키워드 검증
    const blockedKeywords = SECURITY_CONFIG.INPUT_VALIDATION.BLOCKED_KEYWORDS;
    const lowerTopic = topic.toLowerCase();
    
    for (const keyword of blockedKeywords) {
      if (lowerTopic.includes(keyword.toLowerCase())) {
        throw new Error(`차단된 키워드가 포함되어 있습니다: ${keyword}`);
      }
    }
    
    return true;
  }
  
  /**
   * WordPress URL 검증
   */
  static validateWordPressURL(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL은 문자열이어야 합니다');
    }
    
    try {
      const parsedURL = new URL(url);
      
      // HTTPS 강제
      if (parsedURL.protocol !== 'https:') {
        throw new Error('HTTPS URL만 허용됩니다');
      }
      
      // 도메인 검증 (화이트리스트 방식)
      const hostname = parsedURL.hostname;
      const config = getEnhancedConfig();
      
      if (config.ENABLE_DOMAIN_WHITELIST) {
        const allowedDomains = SECURITY_CONFIG.INPUT_VALIDATION.ALLOWED_DOMAINS;
        const isAllowed = allowedDomains.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (!isAllowed) {
          throw new Error(`허용되지 않은 도메인: ${hostname}`);
        }
      }
      
      return true;
      
    } catch (error) {
      throw new Error(`유효하지 않은 URL: ${error.message}`);
    }
  }
  
  /**
   * HTML 콘텐츠 검증
   */
  static validateHTMLContent(html) {
    if (!html || typeof html !== 'string') {
      throw new Error('HTML 콘텐츠는 문자열이어야 합니다');
    }
    
    // 위험한 스크립트 태그 검증
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi // onclick, onload 등 이벤트 핸들러
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(html)) {
        throw new Error('보안상 위험한 HTML 콘텐츠가 감지되었습니다');
      }
    }
    
    return true;
  }
}

/**
 * 세션 보안 관리자
 */
class SessionManager {
  constructor() {
    this.startTime = Date.now();
    this.operations = 0;
  }
  
  /**
   * 실행 시간 제한 확인
   */
  checkExecutionTimeLimit() {
    const elapsed = Date.now() - this.startTime;
    const limit = SECURITY_CONFIG.SESSION_LIMITS.MAX_EXECUTION_TIME;
    
    if (elapsed > limit) {
      throw new Error(`실행 시간 제한 초과: ${Math.round(elapsed/1000)}초 > ${Math.round(limit/1000)}초`);
    }
    
    return true;
  }
  
  /**
   * 동시 작업 제한 확인
   */
  checkConcurrentOperations() {
    this.operations++;
    
    if (this.operations > SECURITY_CONFIG.SESSION_LIMITS.MAX_CONCURRENT_OPERATIONS) {
      throw new Error(`동시 작업 수 제한 초과: ${this.operations} > ${SECURITY_CONFIG.SESSION_LIMITS.MAX_CONCURRENT_OPERATIONS}`);
    }
    
    return true;
  }
  
  /**
   * 일일 포스트 제한 확인
   */
  checkDailyPostLimit() {
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `DAILY_POSTS_${today}`;
    
    const props = PropertiesService.getScriptProperties();
    const todayPosts = parseInt(props.getProperty(limitKey) || '0');
    
    if (todayPosts >= SECURITY_CONFIG.SESSION_LIMITS.MAX_DAILY_POSTS) {
      throw new Error(`일일 포스트 제한 초과: ${todayPosts} >= ${SECURITY_CONFIG.SESSION_LIMITS.MAX_DAILY_POSTS}`);
    }
    
    // 포스트 수 증가
    props.setProperty(limitKey, (todayPosts + 1).toString());
    return true;
  }
}

// 전역 보안 매니저들
const apiKeyManager = new APIKeyManager();
const rateLimiter = new RateLimiter();
const sessionManager = new SessionManager();

/**
 * 보안 래퍼 함수들
 */
function withSecurityCheck(operation, fn, options = {}) {
  Logger.log(`🔐 보안 검사 시작: ${operation}`);
  
  try {
    // 세션 제한 확인
    sessionManager.checkExecutionTimeLimit();
    sessionManager.checkConcurrentOperations();
    
    // 요청 제한 확인
    if (options.service) {
      if (!rateLimiter.checkRateLimit(options.service)) {
        if (options.waitForLimit) {
          rateLimiter.waitForRateLimit(options.service);
        } else {
          throw new Error(`요청 제한 초과: ${options.service}`);
        }
      }
    }
    
    // 입력 검증
    if (options.validateInput) {
      options.validateInput();
    }
    
    // 실제 작업 실행
    const result = fn();
    
    Logger.log(`✅ 보안 검사 통과: ${operation}`);
    return result;
    
  } catch (error) {
    Logger.log(`🚫 보안 검사 실패: ${operation} - ${error.message}`);
    throw error;
  }
}

/**
 * WordPress 보안 강화
 */
function secureWordPressPublish(post) {
  return withSecurityCheck('WordPress 발행', () => {
    // 포스트 발행 로직
    const config = getEnhancedConfig();
    return publishToWordPress(post, config);
  }, {
    service: 'WORDPRESS',
    validateInput: () => {
      InputValidator.validateWordPressURL(getEnhancedConfig().WP_BASE);
      InputValidator.validateTopic(post.title);
      InputValidator.validateHTMLContent(post.content);
    }
  });
}

/**
 * AI 서비스 보안 강화
 */
function secureAIGeneration(topic, service = 'openai') {
  return withSecurityCheck('AI 글 생성', () => {
    const apiKey = apiKeyManager.getSecureAPIKey(service, `${service.toUpperCase()}_API_KEY`);
    return generateHtmlWithLanguage(topic, 'KR');
  }, {
    service: service.toUpperCase(),
    waitForLimit: true,
    validateInput: () => {
      InputValidator.validateTopic(topic);
    }
  });
}

/**
 * 보안 감사 함수들
 */
function auditSecuritySettings() {
  Logger.log("🔍 보안 설정 감사 시작");
  
  const audit = {
    timestamp: new Date().toISOString(),
    apiKeysSecurity: {},
    rateLimitStatus: {},
    configurationSecurity: {}
  };
  
  try {
    const config = getEnhancedConfig();
    
    // API 키 보안 상태
    const apiKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'PEXELS_API_KEY'];
    apiKeys.forEach(keyName => {
      const key = config[keyName];
      audit.apiKeysSecurity[keyName] = {
        configured: !!key,
        formatValid: key ? apiKeyManager._validateAPIKeyFormat(keyName.split('_')[0], key) : false,
        usage: key ? apiKeyManager._getKeyUsage(keyName) : null
      };
    });
    
    // 설정 보안 상태
    audit.configurationSecurity = {
      httpsOnly: config.WP_BASE ? config.WP_BASE.startsWith('https://') : false,
      rateLimitingEnabled: config.API_RATE_LIMIT_PER_HOUR > 0,
      monitoringEnabled: !!config.MONITORING_SHEET_ID,
      emailAlertsConfigured: config.ENABLE_EMAIL_ALERTS && !!config.ALERT_EMAIL
    };
    
    Logger.log("=== 보안 감사 결과 ===");
    Logger.log(`API 키 상태: ${JSON.stringify(audit.apiKeysSecurity, null, 2)}`);
    Logger.log(`설정 보안: ${JSON.stringify(audit.configurationSecurity, null, 2)}`);
    
    // 보안 권장사항
    const recommendations = [];
    
    if (!audit.configurationSecurity.httpsOnly) {
      recommendations.push("WordPress URL을 HTTPS로 변경하세요");
    }
    
    if (!audit.configurationSecurity.monitoringEnabled) {
      recommendations.push("모니터링 시스템을 활성화하세요 (MONITORING_SHEET_ID 설정)");
    }
    
    const configuredKeys = Object.values(audit.apiKeysSecurity).filter(key => key.configured).length;
    if (configuredKeys < 2) {
      recommendations.push("백업 AI API 키를 설정하여 이중화하세요");
    }
    
    if (recommendations.length > 0) {
      Logger.log("🚨 보안 권장사항:");
      recommendations.forEach(rec => Logger.log(`  - ${rec}`));
    } else {
      Logger.log("✅ 보안 설정이 양호합니다");
    }
    
    return audit;
    
  } catch (error) {
    Logger.log(`❌ 보안 감사 실패: ${error.message}`);
    return { error: error.message };
  }
}

function generateSecurityReport() {
  Logger.log("📋 보안 리포트 생성");
  
  const report = {
    auditResults: auditSecuritySettings(),
    keyRotationStatus: 'Completed',
    rateLimitViolations: 0,
    securityIncidents: []
  };
  
  // 모니터링 시트에 보안 리포트 저장
  try {
    const config = getEnhancedConfig();
    if (config.MONITORING_SHEET_ID) {
      const ss = SpreadsheetApp.openById(config.MONITORING_SHEET_ID);
      const securitySheet = ss.getSheetByName('Security_Report') || 
        ss.insertSheet('Security_Report');
      
      if (securitySheet.getLastRow() === 0) {
        securitySheet.getRange(1, 1, 1, 4).setValues([
          ['Timestamp', 'Audit_Status', 'Key_Rotation', 'Recommendations']
        ]);
      }
      
      const auditStatus = report.auditResults.error ? 'FAILED' : 'PASSED';
      const recommendations = report.auditResults.recommendations || [];
      
      securitySheet.appendRow([
        new Date().toISOString(),
        auditStatus,
        report.keyRotationStatus,
        recommendations.join('; ')
      ]);
      
      Logger.log("📊 보안 리포트가 모니터링 시트에 저장되었습니다");
    }
  } catch (error) {
    Logger.log(`❌ 보안 리포트 저장 실패: ${error.message}`);
  }
  
  return report;
}

/**
 * 자동 보안 유지보수
 */
function performSecurityMaintenance() {
  Logger.log("🔧 보안 유지보수 시작");
  
  try {
    // 1. API 키 로테이션
    apiKeyManager.rotateAPIKeys();
    
    // 2. 만료된 사용량 데이터 정리
    const props = PropertiesService.getScriptProperties();
    const properties = props.getProperties();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let cleanedCount = 0;
    Object.keys(properties).forEach(key => {
      if (key.startsWith('KEY_USAGE_') || key.startsWith('DAILY_POSTS_')) {
        const date = key.split('_').pop();
        if (date < threeDaysAgo) {
          props.deleteProperty(key);
          cleanedCount++;
        }
      }
    });
    
    Logger.log(`🧹 오래된 사용량 데이터 ${cleanedCount}개 정리`);
    
    // 3. 보안 리포트 생성
    generateSecurityReport();
    
    Logger.log("✅ 보안 유지보수 완료");
    
  } catch (error) {
    Logger.log(`❌ 보안 유지보수 실패: ${error.message}`);
  }
}