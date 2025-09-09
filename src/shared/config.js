/**
 * 설정 관리 모듈
 */

const SHEET_NAME = "Topics";
const DAILY_LIMIT = 3;
const POST_INTERVAL_MS = 0;
const TRENDS_DAILY_LIMIT = 10;

/**
 * 현재 AI 모델에 맞는 API 키를 가져오기
 */
function getCurrentAIKey() {
  const config = getConfig();
  const provider = config.AI_PROVIDER;
  
  switch (provider) {
    case 'openai':
      return config.OPENAI_API_KEY;
    case 'anthropic':
      return config.CLAUDE_API_KEY;
    case 'google':
      return config.GEMINI_API_KEY;
    default:
      Logger.log(`⚠️ 알 수 없는 AI Provider: ${provider}, OpenAI 키 사용`);
      return config.OPENAI_API_KEY;
  }
}

/**
 * Script Properties에서 설정값 가져오기
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const provider = props.getProperty("AI_PROVIDER") || "openai";
  
  // 각 AI 서비스별 독립 API 키들
  const openaiKey = props.getProperty("OPENAI_API_KEY");
  const claudeKey = props.getProperty("CLAUDE_API_KEY");
  const geminiKey = props.getProperty("GEMINI_API_KEY");
  
  // 현재 AI Provider에 맞는 키 선택
  let currentAIKey;
  switch (provider) {
    case 'openai':
      currentAIKey = openaiKey;
      break;
    case 'anthropic':
      currentAIKey = claudeKey;
      break;
    case 'google':
      currentAIKey = geminiKey;
      break;
    default:
      currentAIKey = openaiKey; // 기본값
  }
  
  return {
    // WordPress 설정
    WP_BASE: props.getProperty("WP_BASE"),
    WP_USER: props.getProperty("WP_USER"),
    WP_APP_PASS: props.getProperty("WP_APP_PASS"),
    
    // 스프레드시트 설정
    SHEET_ID: props.getProperty("SHEET_ID"),
    SHEET_NAME: SHEET_NAME,
    
    // AI 설정 (단일 선택) - GPT-5 기본값 사용
    AI_PROVIDER: provider,
    AI_MODEL: props.getProperty("AI_MODEL") || "gpt-5",
    AI_API_KEY: currentAIKey, // 현재 AI Provider에 맞는 키 자동 선택
    
    // 각 AI 서비스별 독립 API 키들
    OPENAI_API_KEY: openaiKey,
    CLAUDE_API_KEY: claudeKey,
    GEMINI_API_KEY: geminiKey,
    
    // 트렌드 설정 (영어 기반)
    TRENDS_REGION: props.getProperty("TRENDS_REGION") || "US",
    TRENDS_CATEGORY: props.getProperty("TRENDS_CATEGORY") || "0",
    SERP_API_KEY: props.getProperty("SERP_API_KEY"),
    
    // 이미지 설정 (비활성화됨 - 수동 이미지 사용 권장)
    IMAGE_PROVIDER: "disabled",
    PEXELS_API_KEY: null,
    UNSPLASH_API_KEY: null,
    
    // Google Images API 설정 (비활성화됨)
    GOOGLE_API_KEY: props.getProperty("GOOGLE_API_KEY"),
    GOOGLE_SEARCH_ENGINE_ID: props.getProperty("GOOGLE_SEARCH_ENGINE_ID"),
    
    // AI 이미지 키워드 생성 (비활성화됨)
    ENABLE_AI_IMAGE_KEYWORDS: false,

    // 토픽 마이닝: 완전 자동화 모드 (실시간 Google Trends만 사용)
    // 니치 키워드는 더 이상 사용되지 않음 - AI가 트렌드에서 자동으로 적절한 카테고리 선택
    BLOG_NICHE_KEYWORDS: [],
    
    // 발행 설정
    DAILY_LIMIT: DAILY_LIMIT,
    POST_INTERVAL_MS: POST_INTERVAL_MS,
    TRENDS_DAILY_LIMIT: TRENDS_DAILY_LIMIT,

    // 콘텐츠 재활용 설정
    REOPTIMIZE_ENABLED: props.getProperty("REOPTIMIZE_ENABLED") === "true",
    REOPTIMIZE_POSTS_OLDER_THAN_DAYS: parseInt(props.getProperty("REOPTIMIZE_POSTS_OLDER_THAN_DAYS") || "180", 10),
    REOPTIMIZE_TARGET_CATEGORY: props.getProperty("REOPTIMIZE_TARGET_CATEGORY") || null, // 특정 카테고리 이름
    REOPTIMIZE_DAILY_LIMIT: parseInt(props.getProperty("REOPTIMIZE_DAILY_LIMIT") || "1", 10),

    // 어필리에이트 링크 설정
    AFFILIATE_ENABLED: props.getProperty("AFFILIATE_ENABLED") === "true",
    AFFILIATE_LINKS_JSON: props.getProperty("AFFILIATE_LINKS_JSON") || "{}",
    AFFILIATE_DISCLAIMER: props.getProperty("AFFILIATE_DISCLAIMER") || "이 포스트에는 제휴 링크가 포함되어 있습니다.",
    MAX_AFFILIATE_LINKS_PER_POST: parseInt(props.getProperty("MAX_AFFILIATE_LINKS_PER_POST") || "3", 10)
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
    'AI_PROVIDER': 'anthropic',
    'AI_MODEL': 'claude-4-sonnet-20250514',
    'TRENDS_REGION': 'US',
    'TRENDS_CATEGORY': '0',
    'IMAGE_PROVIDER': 'disabled',
    'REOPTIMIZE_ENABLED': 'false',
    'REOPTIMIZE_POSTS_OLDER_THAN_DAYS': '180',
    'REOPTIMIZE_DAILY_LIMIT': '1',
    'AFFILIATE_ENABLED': 'true',
    'MAX_AFFILIATE_LINKS_PER_POST': '3'
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
  Logger.log("   - AI_MODEL: 모델명");
  Logger.log("   - AI_API_KEY: 선택한 AI의 API 키");
  Logger.log("6. 이미지 및 토픽 API 키:");
  Logger.log("   - PEXELS_API_KEY");
  Logger.log("   - SERP_API_KEY");
  Logger.log("7. 콘텐츠 재활용 설정 (선택사항):");
  Logger.log("   - REOPTIMIZE_ENABLED: true 또는 false");
  Logger.log("   - REOPTIMIZE_POSTS_OLDER_THAN_DAYS: 재작성할 포스트의 최소 경과일 (예: 180)");
  Logger.log("   - REOPTIMIZE_TARGET_CATEGORY: 재작성할 카테고리 이름 (예: Technology)");
  Logger.log("   - REOPTIMIZE_DAILY_LIMIT: 하루에 재작성할 최대 포스트 수 (예: 1)");
}