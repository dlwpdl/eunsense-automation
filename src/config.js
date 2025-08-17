/**
 * 설정 관리 모듈
 */

const SHEET_NAME = "Topics";
const DAILY_LIMIT = 3;
const POST_INTERVAL_MS = 0;
const TRENDS_DAILY_LIMIT = 10;

/**
 * Script Properties에서 설정값 가져오기
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  
  return {
    // WordPress 설정
    WP_BASE: props.getProperty("WP_BASE"),
    WP_USER: props.getProperty("WP_USER"),
    WP_APP_PASS: props.getProperty("WP_APP_PASS"),
    
    // 스프레드시트 설정
    SHEET_ID: props.getProperty("SHEET_ID"),
    SHEET_NAME: SHEET_NAME,
    
    // AI 설정 (단일 선택)
    AI_PROVIDER: props.getProperty("AI_PROVIDER") || "openai",
    AI_MODEL: props.getProperty("AI_MODEL") || "gpt-3.5-turbo",
    AI_API_KEY: props.getProperty("AI_API_KEY"),
    
    // 트렌드 설정 (영어 기반)
    TRENDS_REGION: props.getProperty("TRENDS_REGION") || "US",
    TRENDS_CATEGORY: props.getProperty("TRENDS_CATEGORY") || "0",
    SERP_API_KEY: props.getProperty("SERP_API_KEY"),
    
    // 이미지 설정
    IMAGE_PROVIDER: props.getProperty("IMAGE_PROVIDER") || "pexels",
    PEXELS_API_KEY: props.getProperty("PEXELS_API_KEY"),
    
    // 발행 설정
    DAILY_LIMIT: DAILY_LIMIT,
    POST_INTERVAL_MS: POST_INTERVAL_MS,
    TRENDS_DAILY_LIMIT: TRENDS_DAILY_LIMIT
  };
}

/**
 * 필수 설정 검증
 */
function validateConfig() {
  const config = getConfig();
  
  const requiredProps = {
    "WP_BASE": config.WP_BASE,
    "WP_USER": config.WP_USER,
    "WP_APP_PASS": config.WP_APP_PASS
  };
  
  const missing = [];
  for (const [key, value] of Object.entries(requiredProps)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`필수 설정이 누락되었습니다: ${missing.join(", ")}`);
  }
  
  return config;
}

/**
 * Script Properties 기본값 설정
 */
function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  
  const defaultProps = {
    'AI_PROVIDER': 'openai',
    'AI_MODEL': 'gpt-3.5-turbo',
    'TRENDS_REGION': 'US',
    'TRENDS_CATEGORY': '0',
    'IMAGE_PROVIDER': 'pexels'
  };
  
  Object.keys(defaultProps).forEach(key => {
    if (!props.getProperty(key)) {
      props.setProperty(key, defaultProps[key]);
      Logger.log(`✅ 기본값 설정: ${key} = ${defaultProps[key]}`);
    }
  });
  
  Logger.log("=== 필수 설정 가이드 ===");
  Logger.log("다음 값들을 Script Properties에 설정하세요:");
  Logger.log("1. WP_BASE: 워드프레스 사이트 URL");
  Logger.log("2. WP_USER: 워드프레스 사용자명");  
  Logger.log("3. WP_APP_PASS: 워드프레스 앱 비밀번호");
  Logger.log("4. SHEET_ID: 구글 시트 ID (선택사항)");
  Logger.log("5. AI 설정:");
  Logger.log("   - AI_PROVIDER: openai | gemini | anthropic | xai");
  Logger.log("   - AI_MODEL: 모델명 (gpt-4, gemini-pro, claude-3-sonnet, grok-beta)");
  Logger.log("   - AI_API_KEY: 선택한 AI의 API 키");
  Logger.log("6. 이미지 API 키:");
  Logger.log("   - PEXELS_API_KEY");
  Logger.log("   - SERP_API_KEY (트렌드 폴백용)");
}