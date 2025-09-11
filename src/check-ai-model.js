/**
 * 현재 사용 중인 AI 모델 상세 확인 및 퀄리티 분석 도구
 */

/**
 * 현재 AI 설정 상세 확인
 */
function checkCurrentAIDetailed() {
  const config = getConfig();
  const currentKey = getCurrentAIKey();
  
  Logger.log("🤖 === 현재 AI 설정 상세 분석 ===");
  Logger.log("");
  
  // 1. 기본 설정 정보
  Logger.log("📋 기본 설정:");
  Logger.log(`  AI Provider: ${config.AI_PROVIDER}`);
  Logger.log(`  AI Model: ${config.AI_MODEL}`);
  Logger.log(`  현재 사용 API Key: ${currentKey ? '설정됨 ✅' : '❌ 없음'}`);
  
  // 2. 모델 프로파일 확인
  Logger.log("");
  Logger.log("🔍 모델 프로파일 분석:");
  const modelProfile = getModelProfile(config.AI_MODEL);
  Logger.log(`  Provider: ${modelProfile.provider}`);
  Logger.log(`  Max Tokens: ${modelProfile.params.maxTokens}`);
  Logger.log(`  JSON 신뢰성: ${modelProfile.capabilities.jsonReliability}`);
  Logger.log(`  프롬프트 준수: ${modelProfile.capabilities.promptFollowing}`);
  Logger.log(`  글쓰기 품질: ${modelProfile.capabilities.writingQuality}`);
  Logger.log(`  비용 효율성: ${modelProfile.capabilities.costEfficiency}`);
  Logger.log(`  재시도 횟수: ${modelProfile.strategy.retryAttempts}`);
  
  // 3. 각 서비스별 키 상태
  Logger.log("");
  Logger.log("🔑 각 AI 서비스별 API 키 상태:");
  Logger.log(`  OpenAI API Key: ${config.OPENAI_API_KEY ? '설정됨 ✅' : '❌ 없음'}`);
  Logger.log(`  Claude API Key: ${config.CLAUDE_API_KEY ? '설정됨 ✅' : '❌ 없음'}`);
  Logger.log(`  Gemini API Key: ${config.GEMINI_API_KEY ? '설정됨 ✅' : '❌ 없음'}`);
  
  // 4. 모델별 품질 평가
  Logger.log("");
  Logger.log("⭐ 품질 평가:");
  evaluateModelQuality(config.AI_MODEL);
  
  // 5. 권장사항
  Logger.log("");
  Logger.log("💡 품질 향상 권장사항:");
  provideQualityRecommendations(config.AI_MODEL, config.AI_PROVIDER);
  
  return {
    provider: config.AI_PROVIDER,
    model: config.AI_MODEL,
    hasKey: !!currentKey,
    profile: modelProfile
  };
}

/**
 * 모델별 품질 평가
 */
function evaluateModelQuality(model) {
  const qualityRatings = {
    // OpenAI 모델들
    'gpt-5': {
      contentQuality: '최고 (95%)',
      koreanSupport: '뛰어남 (90%)',
      promptFollowing: '최고 (95%)',
      consistency: '최고 (95%)',
      creativity: '최고 (95%)',
      recommendation: '최고 품질의 콘텐츠가 필요한 경우 추천'
    },
    'gpt-5-mini': {
      contentQuality: '뛰어남 (85%)',
      koreanSupport: '뛰어남 (88%)',
      promptFollowing: '뛰어남 (90%)',
      consistency: '뛰어남 (88%)',
      creativity: '좋음 (82%)',
      recommendation: '비용 효율적이면서 고품질 - 가장 추천'
    },
    'gpt-4o': {
      contentQuality: '뛰어남 (88%)',
      koreanSupport: '좋음 (85%)',
      promptFollowing: '뛰어남 (88%)',
      consistency: '좋음 (85%)',
      creativity: '뛰어남 (88%)',
      recommendation: '빠른 응답이 필요한 경우'
    },
    'gpt-4o-mini': {
      contentQuality: '좋음 (75%)',
      koreanSupport: '좋음 (80%)',
      promptFollowing: '뛰어남 (85%)',
      consistency: '좋음 (80%)',
      creativity: '보통 (70%)',
      recommendation: '대량 생산시 비용 절약용'
    },
    
    // Anthropic 모델들
    'claude-4-sonnet-20250514': {
      contentQuality: '최고 (98%)',
      koreanSupport: '최고 (95%)',
      promptFollowing: '최고 (98%)',
      consistency: '최고 (95%)',
      creativity: '최고 (98%)',
      recommendation: '장문, 고품질 콘텐츠에 최적 - 강력 추천'
    },
    'claude-3-5-sonnet-20241022': {
      contentQuality: '뛰어남 (90%)',
      koreanSupport: '뛰어남 (90%)',
      promptFollowing: '뛰어남 (92%)',
      consistency: '뛰어남 (88%)',
      creativity: '뛰어남 (90%)',
      recommendation: '안정적인 고품질 대안'
    },
    'claude-3-5-haiku-20241022': {
      contentQuality: '좋음 (78%)',
      koreanSupport: '좋음 (82%)',
      promptFollowing: '뛰어남 (85%)',
      consistency: '좋음 (80%)',
      creativity: '좋음 (75%)',
      recommendation: '빠르고 저렴한 옵션'
    }
  };
  
  const rating = qualityRatings[model];
  if (rating) {
    Logger.log(`  콘텐츠 품질: ${rating.contentQuality}`);
    Logger.log(`  한국어 지원: ${rating.koreanSupport}`);
    Logger.log(`  프롬프트 준수: ${rating.promptFollowing}`);
    Logger.log(`  일관성: ${rating.consistency}`);
    Logger.log(`  창의성: ${rating.creativity}`);
    Logger.log(`  추천도: ${rating.recommendation}`);
  } else {
    Logger.log(`  ⚠️ "${model}" 모델에 대한 평가 데이터가 없습니다.`);
  }
}

/**
 * 품질 향상 권장사항
 */
function provideQualityRecommendations(currentModel, currentProvider) {
  const recommendations = [];
  
  // 현재 모델별 맞춤 권장사항
  if (currentModel === 'gpt-4o-mini') {
    recommendations.push("🔄 품질 향상: GPT-5 Mini 또는 Claude 4 Sonnet으로 업그레이드 권장");
    recommendations.push("📝 현재 모델은 대량 생산용이며, 개별 글 품질이 떨어질 수 있음");
  }
  
  if (currentModel === 'gpt-4o') {
    recommendations.push("🔄 품질 향상: GPT-5 또는 Claude 4 Sonnet으로 업그레이드 권장");
    recommendations.push("🇰🇷 한국어 품질: Claude 4 Sonnet이 한국어에 더 적합");
  }
  
  if (currentProvider === 'openai' && !currentModel.includes('gpt-5')) {
    recommendations.push("⬆️ OpenAI 최신 모델: GPT-5 또는 GPT-5 Mini로 업그레이드");
  }
  
  if (currentProvider !== 'anthropic') {
    recommendations.push("🇰🇷 한국어 특화: Claude 4 Sonnet 사용 고려 (한국어 품질 최고)");
    recommendations.push("📚 장문 콘텐츠: Claude가 긴 글 작성에 더 적합");
  }
  
  // 일반 권장사항
  recommendations.push("🔧 프롬프트 최적화: 더 구체적이고 명확한 지시사항 제공");
  recommendations.push("🔄 모델 로테이션: 여러 모델을 번갈아 사용하여 다양성 확보");
  recommendations.push("📊 결과 모니터링: 정기적으로 생성된 콘텐츠 품질 검토");
  
  recommendations.forEach(rec => Logger.log(`  ${rec}`));
}

/**
 * 최고 품질 모델로 즉시 전환
 */
function switchToHighestQuality() {
  Logger.log("🚀 최고 품질 모델로 전환 중...");
  
  const config = getConfig();
  
  // Claude 4 Sonnet이 있으면 최우선
  if (config.CLAUDE_API_KEY) {
    switchToClaude4();
    Logger.log("✅ Claude 4 Sonnet으로 전환 완료 - 최고 품질 보장");
    return;
  }
  
  // GPT-5가 있으면 차선
  if (config.OPENAI_API_KEY) {
    switchToGPT5();
    Logger.log("✅ GPT-5로 전환 완료 - 최신 고품질 모델");
    return;
  }
  
  Logger.log("❌ 고품질 모델을 위한 API 키가 없습니다.");
  Logger.log("권장: Claude 4 Sonnet 또는 GPT-5 API 키를 설정하세요.");
}

/**
 * 비용 효율적인 고품질 모델로 전환
 */
function switchToCostEffectiveQuality() {
  Logger.log("💰 비용 효율적인 고품질 모델로 전환 중...");
  
  const config = getConfig();
  
  // GPT-5 Mini가 최고의 가성비
  if (config.OPENAI_API_KEY) {
    switchToGPT5Mini();
    Logger.log("✅ GPT-5 Mini로 전환 완료 - 최고 가성비");
    return;
  }
  
  // Claude 3.5 Haiku가 차선
  if (config.CLAUDE_API_KEY) {
    const props = PropertiesService.getScriptProperties();
    props.setProperty("AI_PROVIDER", "anthropic");
    props.setProperty("AI_MODEL", "claude-3-5-haiku-20241022");
    Logger.log("✅ Claude 3.5 Haiku로 전환 완료 - 비용 효율적");
    return;
  }
  
  Logger.log("❌ 사용 가능한 API 키가 없습니다.");
}

/**
 * 한국어 특화 모델로 전환
 */
function switchToKoreanOptimized() {
  Logger.log("🇰🇷 한국어 특화 모델로 전환 중...");
  
  const config = getConfig();
  
  // Claude 4 Sonnet이 한국어 최고
  if (config.CLAUDE_API_KEY) {
    switchToClaude4();
    Logger.log("✅ Claude 4 Sonnet으로 전환 완료 - 한국어 품질 최고");
    return;
  }
  
  // GPT-5가 차선
  if (config.OPENAI_API_KEY) {
    switchToGPT5();
    Logger.log("✅ GPT-5로 전환 완료 - 한국어 지원 양호");
    return;
  }
  
  Logger.log("❌ 한국어 최적화 모델을 위한 API 키가 없습니다.");
}

/**
 * 실제 API 호출 테스트
 */
function testActualAPICall() {
  Logger.log("🧪 실제 API 호출 테스트 시작...");
  
  try {
    const config = getConfig();
    const testTopic = "AI 기술의 미래 전망";
    
    Logger.log(`사용 중인 모델: ${config.AI_PROVIDER} / ${config.AI_MODEL}`);
    
    const startTime = new Date();
    const result = generateHtmlWithLanguage(testTopic, "KO", ["AI", "기술", "미래"]);
    const endTime = new Date();
    const duration = endTime - startTime;
    
    Logger.log("🎉 API 호출 테스트 완료!");
    Logger.log(`⏱️ 응답 시간: ${duration}ms`);
    Logger.log(`📝 생성된 제목: ${result.title}`);
    Logger.log(`📊 콘텐츠 길이: ${result.html ? result.html.length : 0}자`);
    Logger.log(`🏷️ 카테고리: ${result.categories ? result.categories.join(', ') : '없음'}`);
    Logger.log(`🔖 태그: ${result.tags ? result.tags.join(', ') : '없음'}`);
    
    return {
      success: true,
      duration: duration,
      contentLength: result.html ? result.html.length : 0,
      title: result.title
    };
    
  } catch (error) {
    Logger.log(`❌ API 호출 테스트 실패: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 종합 품질 진단
 */
function diagnoseContentQuality() {
  Logger.log("🔍 === 종합 콘텐츠 품질 진단 ===");
  
  // 1. 현재 설정 확인
  const currentStatus = checkCurrentAIDetailed();
  
  // 2. API 호출 테스트
  Logger.log("");
  const apiTest = testActualAPICall();
  
  // 3. 종합 진단 결과
  Logger.log("");
  Logger.log("📋 === 진단 결과 요약 ===");
  
  if (apiTest.success) {
    Logger.log("✅ API 연결: 정상");
    Logger.log(`⏱️ 응답 속도: ${apiTest.duration < 30000 ? '빠름' : '느림'} (${apiTest.duration}ms)`);
    Logger.log(`📊 콘텐츠 길이: ${apiTest.contentLength > 3000 ? '적절' : '부족'} (${apiTest.contentLength}자)`);
  } else {
    Logger.log("❌ API 연결: 실패");
    Logger.log(`🚨 오류: ${apiTest.error}`);
  }
  
  // 4. 최종 권장사항
  Logger.log("");
  Logger.log("🎯 === 최종 권장사항 ===");
  
  if (currentStatus.model === 'gpt-4o-mini' || currentStatus.model === 'gpt-4o') {
    Logger.log("⚠️ 현재 사용 중인 모델의 품질이 기대 수준보다 낮을 수 있습니다.");
    Logger.log("🔄 다음 함수를 실행하여 모델을 업그레이드하세요:");
    Logger.log("   - switchToHighestQuality() // 최고 품질");
    Logger.log("   - switchToCostEffectiveQuality() // 가성비");
    Logger.log("   - switchToKoreanOptimized() // 한국어 특화");
  } else {
    Logger.log("✅ 현재 사용 중인 모델은 고품질 모델입니다.");
  }
}