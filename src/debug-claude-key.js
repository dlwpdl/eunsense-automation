/**
 * Claude API 키 진단 및 문제 해결 도구
 */

/**
 * Claude API 키 상태 상세 진단
 */
function debugClaudeKey() {
  const props = PropertiesService.getScriptProperties();
  const claudeKey = props.getProperty("CLAUDE_API_KEY");
  
  Logger.log("🔍 === Claude API 키 진단 ===");
  Logger.log(`CLAUDE_API_KEY 설정됨: ${claudeKey ? 'YES ✅' : 'NO ❌'}`);
  
  if (claudeKey) {
    Logger.log(`키 길이: ${claudeKey.length}자`);
    Logger.log(`키 시작: ${claudeKey.substring(0, 15)}...`);
    Logger.log(`키 끝: ...${claudeKey.substring(claudeKey.length - 10)}`);
    Logger.log(`올바른 형식: ${claudeKey.startsWith('sk-ant-api') ? 'YES ✅' : 'NO ❌'}`);
    
    // 키 유효성 상세 체크
    if (claudeKey.startsWith('sk-ant-api03-')) {
      Logger.log("✅ Claude API v3 키 형식 정상");
    } else if (claudeKey.startsWith('sk-ant-api02-')) {
      Logger.log("⚠️ Claude API v2 키 (작동하지만 v3 권장)");
    } else if (claudeKey.startsWith('sk-ant-')) {
      Logger.log("❌ 잘못된 Claude API 키 형식");
    } else {
      Logger.log("❌ 완전히 잘못된 키 형식");
    }
    
    // 키 길이 체크
    if (claudeKey.length < 80) {
      Logger.log("⚠️ 키가 너무 짧습니다 (불완전한 키일 가능성)");
    } else if (claudeKey.length > 150) {
      Logger.log("⚠️ 키가 너무 깁니다");
    } else {
      Logger.log("✅ 키 길이 정상");
    }
    
  } else {
    Logger.log("❌ CLAUDE_API_KEY가 설정되지 않았습니다!");
    Logger.log("");
    Logger.log("🔧 해결 방법:");
    Logger.log("1. Google Apps Script → Extensions → Properties");
    Logger.log("2. Script properties 탭 선택");
    Logger.log("3. Property: CLAUDE_API_KEY");
    Logger.log("4. Value: sk-ant-api03-xxxxxxxx... (Claude API 키)");
  }
  
  // 현재 AI 설정도 확인
  Logger.log("");
  Logger.log("🤖 === 현재 AI 설정 ===");
  Logger.log(`AI_PROVIDER: ${props.getProperty("AI_PROVIDER") || '없음'}`);
  Logger.log(`AI_MODEL: ${props.getProperty("AI_MODEL") || '없음'}`);
  
  // 다른 AI 키들도 확인
  Logger.log("");
  Logger.log("🔑 === 기타 AI 키 상태 ===");
  Logger.log(`OPENAI_API_KEY: ${props.getProperty("OPENAI_API_KEY") ? 'YES ✅' : 'NO ❌'}`);
  Logger.log(`GEMINI_API_KEY: ${props.getProperty("GEMINI_API_KEY") ? 'YES ✅' : 'NO ❌'}`);
  
  return {
    claudeKeyExists: !!claudeKey,
    claudeKeyValid: claudeKey && claudeKey.startsWith('sk-ant-api'),
    currentProvider: props.getProperty("AI_PROVIDER"),
    currentModel: props.getProperty("AI_MODEL")
  };
}

/**
 * Claude API 키 실제 테스트
 */
function testClaudeAPI() {
  Logger.log("🧪 Claude API 실제 연결 테스트 시작...");
  
  const config = getConfig();
  
  if (!config.CLAUDE_API_KEY) {
    Logger.log("❌ CLAUDE_API_KEY가 설정되지 않았습니다.");
    return false;
  }
  
  // 간단한 테스트 프롬프트
  const testPrompt = "Hello, please respond with just 'API_TEST_SUCCESS' in JSON format: {\"result\": \"API_TEST_SUCCESS\"}";
  
  try {
    const response = callClaude(testPrompt, config, "claude-3-5-haiku-20241022", getModelProfile("claude-3-5-haiku-20241022"));
    
    Logger.log("✅ Claude API 연결 성공!");
    Logger.log(`응답: ${response.substring(0, 200)}...`);
    return true;
    
  } catch (error) {
    Logger.log("❌ Claude API 연결 실패:");
    Logger.log(`오류: ${error.message}`);
    
    if (error.message.includes("authentication_error")) {
      Logger.log("🔑 인증 오류 - API 키를 확인하세요");
      Logger.log("해결책:");
      Logger.log("1. Claude API 키가 올바른지 확인");
      Logger.log("2. 키가 만료되지 않았는지 확인");
      Logger.log("3. console.anthropic.com에서 새 키 생성");
    } else if (error.message.includes("rate_limit")) {
      Logger.log("⏱️ 요청 제한 - 잠시 후 다시 시도하세요");
    } else if (error.message.includes("insufficient_quota")) {
      Logger.log("💳 할당량 부족 - 결제 정보를 확인하세요");
    }
    
    return false;
  }
}

/**
 * Claude 설정 완전 초기화 및 재설정
 */
function resetClaudeSetup() {
  Logger.log("🔄 Claude 설정 완전 초기화 중...");
  
  const props = PropertiesService.getScriptProperties();
  
  // Claude 관련 설정 초기화
  props.deleteProperty("AI_PROVIDER");
  props.deleteProperty("AI_MODEL");
  
  Logger.log("✅ 기존 Claude 설정 삭제 완료");
  Logger.log("");
  Logger.log("🔧 새로운 Claude 설정을 위해 다음을 수행하세요:");
  Logger.log("1. console.anthropic.com에서 새 API 키 생성");
  Logger.log("2. Script Properties에 CLAUDE_API_KEY 설정");
  Logger.log("3. switchToClaude4() 함수 실행");
  Logger.log("4. testClaudeAPI() 함수로 연결 확인");
}

/**
 * 대안 AI 모델로 즉시 전환 (Claude 문제시)
 */
function switchToAlternativeAI() {
  Logger.log("🔄 대안 AI 모델로 전환 중...");
  
  const config = getConfig();
  
  // OpenAI 키가 있으면 GPT-5로
  if (config.OPENAI_API_KEY) {
    switchToGPT5();
    Logger.log("✅ GPT-5로 전환 완료");
    
    // 즉시 테스트
    try {
      const testResult = generateHtmlWithLanguage("테스트 주제", "KO", []);
      Logger.log("✅ GPT-5 연결 테스트 성공");
      return true;
    } catch (error) {
      Logger.log("❌ GPT-5 연결 실패");
    }
  }
  
  // Gemini 키가 있으면 Gemini로
  if (config.GEMINI_API_KEY) {
    switchToGemini();
    Logger.log("✅ Gemini로 전환 완료");
    return true;
  }
  
  Logger.log("❌ 사용 가능한 대안 AI가 없습니다.");
  Logger.log("OpenAI 또는 Gemini API 키를 설정하세요.");
  return false;
}

/**
 * Claude API 키 설정 가이드
 */
function showClaudeSetupGuide() {
  Logger.log("📋 === Claude API 키 설정 가이드 ===");
  Logger.log("");
  Logger.log("1️⃣ Claude API 키 발급:");
  Logger.log("   🔗 https://console.anthropic.com 접속");
  Logger.log("   📝 계정 생성/로그인");
  Logger.log("   🔑 API Keys → Create Key");
  Logger.log("   💳 결제 방법 등록 (무료 크레딧 제공)");
  Logger.log("");
  Logger.log("2️⃣ Google Apps Script 설정:");
  Logger.log("   ⚙️ Extensions → Properties");
  Logger.log("   📄 Script properties 탭");
  Logger.log("   ➕ Add property:");
  Logger.log("      Property: CLAUDE_API_KEY");
  Logger.log("      Value: sk-ant-api03-xxxxxxxxx...");
  Logger.log("");
  Logger.log("3️⃣ 설정 적용:");
  Logger.log("   🔄 switchToClaude4() 실행");
  Logger.log("   🧪 testClaudeAPI() 실행");
  Logger.log("");
  Logger.log("4️⃣ 문제 해결:");
  Logger.log("   🔍 debugClaudeKey() 실행");
  Logger.log("   🔄 switchToAlternativeAI() 실행 (임시 해결)");
}

/**
 * 종합 Claude 문제 해결사
 */
function fixClaudeIssues() {
  Logger.log("🛠️ === Claude 문제 종합 해결 ===");
  
  // 1. 현재 상태 진단
  const diagnosis = debugClaudeKey();
  
  // 2. API 연결 테스트
  if (diagnosis.claudeKeyExists && diagnosis.claudeKeyValid) {
    Logger.log("");
    const apiWorking = testClaudeAPI();
    
    if (apiWorking) {
      Logger.log("🎉 Claude 설정이 정상입니다!");
      return true;
    }
  }
  
  // 3. 문제가 있으면 대안 제시
  Logger.log("");
  Logger.log("⚠️ Claude에 문제가 있습니다. 대안을 실행합니다...");
  
  const alternativeSuccess = switchToAlternativeAI();
  
  if (!alternativeSuccess) {
    Logger.log("");
    Logger.log("🆘 === 긴급 해결 가이드 ===");
    showClaudeSetupGuide();
  }
  
  return alternativeSuccess;
}