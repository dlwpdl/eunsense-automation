/**
 * 🔧 향상된 설정 관리 시스템
 * 환경별 설정 분리 및 동적 구성 지원
 */

// 환경별 설정 프로파일
const CONFIG_PROFILES = {
  development: {
    DAILY_LIMIT: 1,
    POST_INTERVAL_MS: 5000,
    TRENDS_DAILY_LIMIT: 3,
    LOG_LEVEL: 'DEBUG',
    ENABLE_MONITORING: true,
    AI_TIMEOUT_MS: 60000,
    IMAGE_TIMEOUT_MS: 30000
  },
  production: {
    DAILY_LIMIT: 3,
    POST_INTERVAL_MS: 0,
    TRENDS_DAILY_LIMIT: 10,
    LOG_LEVEL: 'INFO',
    ENABLE_MONITORING: true,
    AI_TIMEOUT_MS: 120000,
    IMAGE_TIMEOUT_MS: 60000
  },
  testing: {
    DAILY_LIMIT: 1,
    POST_INTERVAL_MS: 1000,
    TRENDS_DAILY_LIMIT: 2,
    LOG_LEVEL: 'DEBUG',
    ENABLE_MONITORING: false,
    AI_TIMEOUT_MS: 30000,
    IMAGE_TIMEOUT_MS: 15000
  }
};

// 기본 설정값
const DEFAULT_CONFIG = {
  SHEET_NAME: "Topics",
  ENVIRONMENT: "production",
  CACHE_DURATION_HOURS: 24,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  SECURITY_CHECK_ENABLED: true
};

/**
 * 환경별 설정 통합 로더
 */
function getEnhancedConfig() {
  const props = PropertiesService.getScriptProperties();
  const environment = props.getProperty("ENVIRONMENT") || DEFAULT_CONFIG.ENVIRONMENT;
  const profile = CONFIG_PROFILES[environment] || CONFIG_PROFILES.production;
  
  const baseConfig = {
    // WordPress 설정
    WP_BASE: props.getProperty("WP_BASE"),
    WP_USER: props.getProperty("WP_USER"),
    WP_APP_PASS: props.getProperty("WP_APP_PASS"),
    
    // 스프레드시트 설정
    SHEET_ID: props.getProperty("SHEET_ID"),
    SHEET_NAME: DEFAULT_CONFIG.SHEET_NAME,
    
    // AI 설정
    AI_PROVIDER: props.getProperty("AI_PROVIDER") || "openai",
    AI_MODEL: props.getProperty("AI_MODEL") || "gpt-4o-mini",
    AI_API_KEY: props.getProperty("AI_API_KEY"),
    
    // 다중 AI 모델 지원
    OPENAI_API_KEY: props.getProperty("OPENAI_API_KEY"),
    GEMINI_API_KEY: props.getProperty("GEMINI_API_KEY"),
    ANTHROPIC_API_KEY: props.getProperty("ANTHROPIC_API_KEY"),
    XAI_API_KEY: props.getProperty("XAI_API_KEY"),
    
    // 트렌드 설정
    TRENDS_REGION: props.getProperty("TRENDS_REGION") || "US",
    TRENDS_CATEGORY: props.getProperty("TRENDS_CATEGORY") || "0",
    SERP_API_KEY: props.getProperty("SERP_API_KEY"),
    
    // 이미지 설정
    IMAGE_PROVIDER: props.getProperty("IMAGE_PROVIDER") || "pexels",
    PEXELS_API_KEY: props.getProperty("PEXELS_API_KEY"),
    UNSPLASH_API_KEY: props.getProperty("UNSPLASH_API_KEY"),
    GOOGLE_API_KEY: props.getProperty("GOOGLE_API_KEY"),
    GOOGLE_SEARCH_ENGINE_ID: props.getProperty("GOOGLE_SEARCH_ENGINE_ID"),
    
    // 환경 설정
    ENVIRONMENT: environment,
    
    // 캐싱 설정
    ENABLE_CACHE: props.getProperty("ENABLE_CACHE") !== "false",
    CACHE_DURATION_HOURS: parseInt(props.getProperty("CACHE_DURATION_HOURS") || DEFAULT_CONFIG.CACHE_DURATION_HOURS),
    
    // 보안 설정
    API_RATE_LIMIT_PER_HOUR: parseInt(props.getProperty("API_RATE_LIMIT_PER_HOUR") || "100"),
    ENABLE_IP_WHITELIST: props.getProperty("ENABLE_IP_WHITELIST") === "true",
    
    // 모니터링 설정
    MONITORING_SHEET_ID: props.getProperty("MONITORING_SHEET_ID"),
    ENABLE_EMAIL_ALERTS: props.getProperty("ENABLE_EMAIL_ALERTS") === "true",
    ALERT_EMAIL: props.getProperty("ALERT_EMAIL")
  };
  
  // 환경별 프로파일 설정 병합
  return { ...baseConfig, ...profile };
}

/**
 * 설정 검증 (향상된 버전)
 */
function validateEnhancedConfig() {
  const config = getEnhancedConfig();
  
  const requiredProps = {
    "WP_BASE": config.WP_BASE,
    "WP_USER": config.WP_USER,
    "WP_APP_PASS": config.WP_APP_PASS
  };
  
  const aiKeys = [
    config.OPENAI_API_KEY,
    config.GEMINI_API_KEY, 
    config.ANTHROPIC_API_KEY,
    config.XAI_API_KEY
  ];
  
  const missing = [];
  for (const [key, value] of Object.entries(requiredProps)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`필수 설정 누락: ${missing.join(", ")}`);
  }
  
  // AI API 키 중 하나 이상 필요
  const availableAI = aiKeys.filter(key => key).length;
  if (availableAI === 0) {
    throw new Error("AI API 키가 하나도 설정되지 않았습니다.");
  }
  
  Logger.log(`✅ 설정 검증 완료 - 환경: ${config.ENVIRONMENT}, AI 모델: ${availableAI}개 사용 가능`);
  return config;
}

/**
 * 동적 설정 업데이트
 */
function updateConfigProperty(key, value) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(key, value);
  Logger.log(`설정 업데이트: ${key} = ${value}`);
  
  // 보안 로그
  if (CONFIG_PROFILES[getEnhancedConfig().ENVIRONMENT].LOG_LEVEL === 'DEBUG') {
    Logger.log(`[DEBUG] 설정 변경 시각: ${new Date()}`);
  }
}

/**
 * 환경 전환 함수
 */
function switchEnvironment(newEnvironment) {
  if (!CONFIG_PROFILES[newEnvironment]) {
    throw new Error(`알 수 없는 환경: ${newEnvironment}. 사용 가능: ${Object.keys(CONFIG_PROFILES).join(', ')}`);
  }
  
  updateConfigProperty("ENVIRONMENT", newEnvironment);
  Logger.log(`🔄 환경 전환 완료: ${newEnvironment}`);
  Logger.log(`새 설정: ${JSON.stringify(CONFIG_PROFILES[newEnvironment], null, 2)}`);
}

/**
 * 설정 백업 및 복원
 */
function backupConfig() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  
  const backup = {
    timestamp: new Date().toISOString(),
    properties: allProps
  };
  
  // 백업을 Script Properties에 저장
  props.setProperty('CONFIG_BACKUP', JSON.stringify(backup));
  Logger.log(`✅ 설정 백업 완료: ${backup.timestamp}`);
  
  return backup;
}

function restoreConfig(backupData) {
  const props = PropertiesService.getScriptProperties();
  
  if (typeof backupData === 'string') {
    backupData = JSON.parse(backupData);
  }
  
  // 기존 설정 클리어 후 복원
  const currentProps = props.getProperties();
  Object.keys(currentProps).forEach(key => {
    if (key !== 'CONFIG_BACKUP') {
      props.deleteProperty(key);
    }
  });
  
  props.setProperties(backupData.properties);
  Logger.log(`✅ 설정 복원 완료: ${backupData.timestamp}`);
}

/**
 * 설정 진단 및 건강 체크
 */
function diagnoseConfig() {
  Logger.log("🔍 설정 시스템 진단 시작");
  
  try {
    const config = getEnhancedConfig();
    const diagnosis = {
      environment: config.ENVIRONMENT,
      wordpress: !!config.WP_BASE && !!config.WP_USER && !!config.WP_APP_PASS,
      aiProviders: [
        { name: 'OpenAI', available: !!config.OPENAI_API_KEY },
        { name: 'Gemini', available: !!config.GEMINI_API_KEY },
        { name: 'Claude', available: !!config.ANTHROPIC_API_KEY },
        { name: 'xAI', available: !!config.XAI_API_KEY }
      ].filter(ai => ai.available),
      imageProviders: [
        { name: 'Pexels', available: !!config.PEXELS_API_KEY },
        { name: 'Google', available: !!config.GOOGLE_API_KEY && !!config.GOOGLE_SEARCH_ENGINE_ID }
      ].filter(img => img.available),
      sheets: !!config.SHEET_ID,
      caching: config.ENABLE_CACHE,
      monitoring: config.ENABLE_MONITORING,
      security: config.SECURITY_CHECK_ENABLED
    };
    
    Logger.log("📊 진단 결과:");
    Logger.log(`  환경: ${diagnosis.environment}`);
    Logger.log(`  WordPress: ${diagnosis.wordpress ? '✅' : '❌'}`);
    Logger.log(`  AI 제공업체: ${diagnosis.aiProviders.length}개 (${diagnosis.aiProviders.map(ai => ai.name).join(', ')})`);
    Logger.log(`  이미지 제공업체: ${diagnosis.imageProviders.length}개 (${diagnosis.imageProviders.map(img => img.name).join(', ')})`);
    Logger.log(`  Google Sheets: ${diagnosis.sheets ? '✅' : '❌'}`);
    Logger.log(`  캐싱: ${diagnosis.caching ? '✅' : '❌'}`);
    Logger.log(`  모니터링: ${diagnosis.monitoring ? '✅' : '❌'}`);
    
    return diagnosis;
    
  } catch (error) {
    Logger.log(`❌ 진단 실패: ${error.message}`);
    return { error: error.message };
  }
}