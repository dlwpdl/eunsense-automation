/**
 * Claude 4 모델 테스트 및 설정 도구
 */

/**
 * 다양한 Claude 4 모델명으로 API 테스트
 */
function testClaude4Models() {
  const config = getConfig();
  
  if (!config.CLAUDE_API_KEY) {
    Logger.log("❌ CLAUDE_API_KEY가 설정되지 않았습니다.");
    return;
  }
  
  const claude4Models = [
    "claude-4",
    "claude-4-sonnet",
    "claude-4-opus", 
    "claude-4-haiku",
    "claude-4-sonnet-20250514",
    "claude-4-sonnet-20241222",
    "claude-4-opus-20250514",
    "claude-4-haiku-20250514",
    "claude-4.0",
    "claude-4.0-sonnet",
    "claude-3-5-sonnet-20241022" // 비교용 (확실히 작동하는 모델)
  ];
  
  Logger.log("🧪 === Claude 4 모델 테스트 시작 ===");
  Logger.log(`사용할 API 키: ${config.CLAUDE_API_KEY.substring(0, 15)}...`);
  Logger.log("");
  
  const workingModels = [];
  const failedModels = [];
  
  claude4Models.forEach(model => {
    Logger.log(`테스트 중: ${model}`);
    
    try {
      // 간단한 테스트 프롬프트
      const testPrompt = "Hello, respond with just 'OK'";
      
      // 기본 모델 프로파일 사용
      const profile = {
        provider: 'anthropic',
        params: { maxTokens: 100 }
      };
      
      const response = callClaude(testPrompt, config, model, profile);
      
      Logger.log(`✅ ${model}: 성공 - ${response.substring(0, 50)}...`);
      workingModels.push(model);
      
    } catch (error) {
      Logger.log(`❌ ${model}: 실패 - ${error.message}`);
      failedModels.push({model, error: error.message});
    }
    
    // API 제한을 위한 짧은 대기
    Utilities.sleep(1000);
  });
  
  Logger.log("");
  Logger.log("📊 === 테스트 결과 요약 ===");
  Logger.log(`성공한 모델 (${workingModels.length}개):`);
  workingModels.forEach(model => Logger.log(`  ✅ ${model}`));
  
  Logger.log("");
  Logger.log(`실패한 모델 (${failedModels.length}개):`);
  failedModels.forEach(item => Logger.log(`  ❌ ${item.model}: ${item.error}`));
  
  if (workingModels.length > 0) {
    Logger.log("");
    Logger.log("🎯 권장 사항:");
    Logger.log(`가장 첫 번째로 성공한 모델을 사용하세요: ${workingModels[0]}`);
    Logger.log(`setClaude4Model("${workingModels[0]}") 실행`);
  }
  
  return {
    working: workingModels,
    failed: failedModels
  };
}

/**
 * 특정 Claude 4 모델로 설정
 */
function setClaude4Model(modelName) {
  if (!modelName) {
    Logger.log("❌ 모델명을 입력하세요. 예: setClaude4Model('claude-4-sonnet')");
    return;
  }
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty("AI_PROVIDER", "anthropic");
  props.setProperty("AI_MODEL", modelName);
  
  Logger.log(`✅ Claude 4 모델 설정 완료:`);
  Logger.log(`  AI_PROVIDER: anthropic`);
  Logger.log(`  AI_MODEL: ${modelName}`);
  
  // 즉시 테스트
  Logger.log("");
  Logger.log("🧪 설정된 모델 테스트 중...");
  
  try {
    const config = getConfig();
    const testResult = generateHtmlWithLanguage("테스트 주제", "KO", []);
    Logger.log("✅ 모델 설정 및 테스트 성공!");
    Logger.log(`생성된 제목: ${testResult.title}`);
  } catch (error) {
    Logger.log(`❌ 모델 테스트 실패: ${error.message}`);
  }
}

/**
 * Claude 4 권장 모델들로 순차 테스트
 */
function findBestClaude4Model() {
  Logger.log("🔍 === 최적의 Claude 4 모델 찾기 ===");
  
  // 우선순위가 높은 순서로 배열
  const priorityModels = [
    "claude-4-sonnet",
    "claude-4",
    "claude-4-opus",
    "claude-4-sonnet-20250514", // 사용자가 언급한 모델
    "claude-4-haiku"
  ];
  
  const config = getConfig();
  
  for (const model of priorityModels) {
    Logger.log(`우선순위 테스트: ${model}`);
    
    try {
      const profile = {
        provider: 'anthropic',
        params: { maxTokens: 100 }
      };
      
      const response = callClaude("Test", config, model, profile);
      
      Logger.log(`🎉 최적 모델 발견: ${model}`);
      Logger.log(`자동으로 이 모델로 설정합니다...`);
      
      setClaude4Model(model);
      return model;
      
    } catch (error) {
      Logger.log(`❌ ${model} 실패: ${error.message}`);
    }
    
    Utilities.sleep(1000);
  }
  
  Logger.log("❌ 사용 가능한 Claude 4 모델을 찾지 못했습니다.");
  Logger.log("💡 대안: switchToGPT5() 실행을 권장합니다.");
  return null;
}

/**
 * Claude 4 모델 정보 업데이트 (getModelProfile 함수에 추가할 정보)
 */
function updateClaude4Profiles() {
  Logger.log("📋 Claude 4 모델 프로파일 정보:");
  Logger.log("");
  
  const claude4Profiles = {
    'claude-4': {
      provider: 'anthropic',
      params: { maxTokensParam: 'max_tokens', maxTokens: 8000 },
      capabilities: { 
        jsonReliability: 'outstanding', 
        promptFollowing: 'outstanding', 
        writingQuality: 'outstanding',
        koreanSupport: 'outstanding',
        costEfficiency: 'medium'
      }
    },
    'claude-4-sonnet': {
      provider: 'anthropic', 
      params: { maxTokensParam: 'max_tokens', maxTokens: 8000 },
      capabilities: { 
        jsonReliability: 'outstanding', 
        promptFollowing: 'outstanding', 
        writingQuality: 'outstanding',
        koreanSupport: 'outstanding',
        costEfficiency: 'medium'
      }
    },
    'claude-4-opus': {
      provider: 'anthropic',
      params: { maxTokensParam: 'max_tokens', maxTokens: 8000 },
      capabilities: { 
        jsonReliability: 'outstanding', 
        promptFollowing: 'outstanding', 
        writingQuality: 'outstanding',
        koreanSupport: 'outstanding', 
        costEfficiency: 'low'
      }
    }
  };
  
  Object.entries(claude4Profiles).forEach(([model, profile]) => {
    Logger.log(`${model}:`);
    Logger.log(`  글쓰기 품질: ${profile.capabilities.writingQuality}`);
    Logger.log(`  한국어 지원: ${profile.capabilities.koreanSupport}`);
    Logger.log(`  비용 효율성: ${profile.capabilities.costEfficiency}`);
    Logger.log("");
  });
  
  Logger.log("💡 이 정보를 ai-service.js의 getModelProfile 함수에 추가해야 합니다.");
}

/**
 * 빠른 Claude 4 설정 (추천)
 */
function quickSetupClaude4() {
  Logger.log("⚡ === Claude 4 빠른 설정 ===");
  
  // 1. 가장 가능성 높은 모델 시도
  const likelyModel = "claude-4-sonnet";
  
  Logger.log(`1️⃣ 가장 가능성 높은 모델로 설정: ${likelyModel}`);
  setClaude4Model(likelyModel);
  
  Logger.log("");
  Logger.log("2️⃣ 만약 위 설정이 실패하면 다음을 실행하세요:");
  Logger.log("   testClaude4Models() - 모든 가능한 모델 테스트");
  Logger.log("   findBestClaude4Model() - 자동으로 최적 모델 찾기");
  Logger.log("");
  Logger.log("3️⃣ Claude 4가 안되면 대안:");
  Logger.log("   switchToGPT5() - GPT-5로 전환 (고품질)");
}