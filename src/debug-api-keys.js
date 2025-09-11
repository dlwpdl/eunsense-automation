/**
 * API 키 사용 현황 진단 도구
 */

/**
 * 현재 사용 중인 API 키가 올바른지 상세 확인
 */
function debugAPIKeyUsage() {
  const config = getConfig();
  const props = PropertiesService.getScriptProperties();
  
  Logger.log("🔍 === API 키 사용 현황 진단 ===");
  Logger.log("");
  
  // 1. 현재 AI 설정
  Logger.log("🤖 현재 AI 설정:");
  Logger.log(`  AI_PROVIDER: ${config.AI_PROVIDER}`);
  Logger.log(`  AI_MODEL: ${config.AI_MODEL}`);
  Logger.log("");
  
  // 2. Script Properties에 설정된 모든 키들
  Logger.log("🔑 Script Properties에 설정된 API 키들:");
  const openaiKey = props.getProperty("OPENAI_API_KEY");
  const claudeKey = props.getProperty("CLAUDE_API_KEY");
  const geminiKey = props.getProperty("GEMINI_API_KEY");
  const genericKey = props.getProperty("AI_API_KEY");
  
  Logger.log(`  OPENAI_API_KEY: ${openaiKey ? `설정됨 (${openaiKey.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log(`  CLAUDE_API_KEY: ${claudeKey ? `설정됨 (${claudeKey.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log(`  GEMINI_API_KEY: ${geminiKey ? `설정됨 (${geminiKey.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log(`  AI_API_KEY (범용): ${genericKey ? `설정됨 (${genericKey.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log("");
  
  // 3. config 객체에서 실제 사용되는 키들
  Logger.log("⚙️ config 객체에서 사용되는 키들:");
  Logger.log(`  config.OPENAI_API_KEY: ${config.OPENAI_API_KEY ? `설정됨 (${config.OPENAI_API_KEY.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log(`  config.CLAUDE_API_KEY: ${config.CLAUDE_API_KEY ? `설정됨 (${config.CLAUDE_API_KEY.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log(`  config.GEMINI_API_KEY: ${config.GEMINI_API_KEY ? `설정됨 (${config.GEMINI_API_KEY.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log(`  config.AI_API_KEY (선택된 키): ${config.AI_API_KEY ? `설정됨 (${config.AI_API_KEY.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log("");
  
  // 4. getCurrentAIKey() 함수 테스트
  const currentKey = getCurrentAIKey();
  Logger.log("🎯 getCurrentAIKey() 함수 결과:");
  Logger.log(`  현재 선택된 키: ${currentKey ? `설정됨 (${currentKey.substring(0, 15)}...)` : '❌ 없음'}`);
  Logger.log("");
  
  // 5. Claude API 호출 시 사용되는 키 확인
  if (config.AI_PROVIDER === 'anthropic') {
    Logger.log("🔍 Claude API 호출 시 사용되는 키:");
    const claudeCallKey = config.CLAUDE_API_KEY || config.AI_API_KEY;
    Logger.log(`  callClaude에서 사용할 키: ${claudeCallKey ? `설정됨 (${claudeCallKey.substring(0, 15)}...)` : '❌ 없음'}`);
    
    if (claudeCallKey) {
      Logger.log(`  키가 Claude 형식인가: ${claudeCallKey.startsWith('sk-ant-api') ? 'YES ✅' : 'NO ❌'}`);
      if (!claudeCallKey.startsWith('sk-ant-api')) {
        Logger.log(`  ⚠️ 경고: Claude가 아닌 키가 설정되어 있습니다!`);
        Logger.log(`  키 시작 부분: ${claudeCallKey.substring(0, 20)}...`);
      }
    }
    Logger.log("");
  }
  
  // 6. 키 형식 검증
  Logger.log("🔍 API 키 형식 검증:");
  if (openaiKey) {
    Logger.log(`  OpenAI 키 형식: ${openaiKey.startsWith('sk-') ? 'OK ✅' : 'BAD ❌'}`);
  }
  if (claudeKey) {
    Logger.log(`  Claude 키 형식: ${claudeKey.startsWith('sk-ant-api') ? 'OK ✅' : 'BAD ❌'}`);
  }
  if (geminiKey) {
    Logger.log(`  Gemini 키 형식: ${geminiKey.startsWith('AI') ? 'OK ✅' : 'BAD ❌'}`);
  }
  Logger.log("");
  
  // 7. 문제 진단 및 권장사항
  Logger.log("⚠️ 문제 진단:");
  
  if (config.AI_PROVIDER === 'anthropic') {
    if (!claudeKey) {
      Logger.log("❌ Claude를 사용하려는데 CLAUDE_API_KEY가 없습니다!");
      Logger.log("   해결책: console.anthropic.com에서 API 키 발급 후 CLAUDE_API_KEY에 설정");
    } else if (!claudeKey.startsWith('sk-ant-api')) {
      Logger.log("❌ CLAUDE_API_KEY에 Claude가 아닌 키가 설정되어 있습니다!");
      Logger.log("   해결책: 올바른 Claude API 키로 교체");
    } else if (config.AI_MODEL && config.AI_MODEL.includes('claude-4')) {
      Logger.log("❌ 존재하지 않는 Claude-4 모델을 사용하려고 합니다!");
      Logger.log("   해결책: claude-3-5-sonnet-20241022로 변경");
    } else {
      Logger.log("✅ Claude 설정이 올바른 것 같습니다. API 키가 만료되었거나 계정에 문제가 있을 수 있습니다.");
    }
  }
  
  return {
    provider: config.AI_PROVIDER,
    model: config.AI_MODEL,
    hasCorrectKey: !!currentKey,
    keyStartsWith: currentKey ? currentKey.substring(0, 15) : null
  };
}

/**
 * API 키 교차 검증 (Claude 키가 정말 Claude 키인지 확인)
 */
function validateAPIKeyFormats() {
  const props = PropertiesService.getScriptProperties();
  
  Logger.log("🔍 === API 키 형식 교차 검증 ===");
  Logger.log("");
  
  const keys = {
    'OPENAI_API_KEY': props.getProperty("OPENAI_API_KEY"),
    'CLAUDE_API_KEY': props.getProperty("CLAUDE_API_KEY"),
    'GEMINI_API_KEY': props.getProperty("GEMINI_API_KEY"),
    'AI_API_KEY': props.getProperty("AI_API_KEY")
  };
  
  Object.entries(keys).forEach(([keyName, keyValue]) => {
    if (keyValue) {
      Logger.log(`${keyName}:`);
      Logger.log(`  길이: ${keyValue.length}자`);
      Logger.log(`  시작: ${keyValue.substring(0, 20)}...`);
      Logger.log(`  끝: ...${keyValue.substring(keyValue.length - 10)}`);
      
      // 키 형식 판별
      if (keyValue.startsWith('sk-proj-') || keyValue.startsWith('sk-')) {
        Logger.log(`  형식: OpenAI 키로 보입니다 ${keyName.includes('OPENAI') ? '✅' : '⚠️'}`);
      } else if (keyValue.startsWith('sk-ant-api')) {
        Logger.log(`  형식: Claude 키로 보입니다 ${keyName.includes('CLAUDE') ? '✅' : '⚠️'}`);
      } else if (keyValue.startsWith('AI')) {
        Logger.log(`  형식: Gemini 키로 보입니다 ${keyName.includes('GEMINI') ? '✅' : '⚠️'}`);
      } else {
        Logger.log(`  형식: 알 수 없는 키 형식 ❌`);
      }
      Logger.log("");
    }
  });
}

/**
 * Claude 키가 실제 OpenAI 키로 잘못 설정되었는지 확인
 */
function checkForMixedUpKeys() {
  const props = PropertiesService.getScriptProperties();
  const claudeKey = props.getProperty("CLAUDE_API_KEY");
  const openaiKey = props.getProperty("OPENAI_API_KEY");
  
  Logger.log("🔍 === 키 혼동 검사 ===");
  
  if (claudeKey && claudeKey.startsWith('sk-') && !claudeKey.startsWith('sk-ant-api')) {
    Logger.log("❌ 심각한 문제 발견!");
    Logger.log("CLAUDE_API_KEY에 OpenAI 키가 설정되어 있습니다!");
    Logger.log(`Claude 키 시작: ${claudeKey.substring(0, 20)}...`);
    Logger.log("");
    Logger.log("🔧 해결 방법:");
    Logger.log("1. console.anthropic.com에서 진짜 Claude API 키 발급");
    Logger.log("2. CLAUDE_API_KEY를 sk-ant-api03-로 시작하는 키로 교체");
    Logger.log("3. 또는 switchToGPT5() 실행하여 OpenAI로 전환");
    return true;
  }
  
  if (openaiKey && openaiKey.startsWith('sk-ant-api')) {
    Logger.log("❌ OPENAI_API_KEY에 Claude 키가 설정되어 있습니다!");
    return true;
  }
  
  Logger.log("✅ 키 혼동은 없는 것 같습니다.");
  return false;
}

/**
 * 종합 API 키 진단 및 자동 수정
 */
function fixAPIKeyIssues() {
  Logger.log("🛠️ === 종합 API 키 문제 해결 ===");
  Logger.log("");
  
  // 1. 현재 상황 진단
  const diagnosis = debugAPIKeyUsage();
  Logger.log("");
  
  // 2. 키 형식 검증
  validateAPIKeyFormats();
  Logger.log("");
  
  // 3. 키 혼동 검사
  const hasMixedKeys = checkForMixedUpKeys();
  Logger.log("");
  
  // 4. 자동 해결 시도
  if (diagnosis.provider === 'anthropic') {
    Logger.log("🔧 Claude 문제 자동 해결 시도...");
    
    // Claude 4 모델 문제 수정
    if (diagnosis.model && diagnosis.model.includes('claude-4')) {
      Logger.log("❌ Claude-4 모델 감지, 유효한 모델로 변경 중...");
      const props = PropertiesService.getScriptProperties();
      props.setProperty("AI_MODEL", "claude-3-5-sonnet-20241022");
      Logger.log("✅ claude-3-5-sonnet-20241022로 변경 완료");
    }
    
    // Claude 키가 없거나 잘못된 경우 GPT로 전환
    if (!diagnosis.hasCorrectKey || hasMixedKeys) {
      Logger.log("❌ Claude 키 문제로 인해 GPT-5로 전환합니다...");
      switchToGPT5();
      Logger.log("✅ GPT-5로 전환 완료");
    }
  }
  
  Logger.log("");
  Logger.log("🎯 최종 권장사항:");
  Logger.log("1. debugAPIKeyUsage() 결과를 확인하세요");
  Logger.log("2. Claude를 사용하려면 올바른 Claude API 키를 발급받으세요");
  Logger.log("3. 임시로 GPT-5를 사용하려면 switchToGPT5() 실행하세요");
}