/**
 * 프롬프트 토큰 길이 진단 및 최적화 도구
 */

/**
 * 프롬프트 길이 측정 (대략적인 토큰 수 계산)
 */
function measurePromptLength(prompt) {
  // 대략적인 토큰 계산: 영어는 4글자당 1토큰, 한국어는 2-3글자당 1토큰
  const englishChars = (prompt.match(/[a-zA-Z0-9\s]/g) || []).length;
  const koreanChars = (prompt.match(/[가-힣]/g) || []).length;
  const otherChars = prompt.length - englishChars - koreanChars;
  
  const estimatedTokens = Math.ceil(englishChars / 4) + Math.ceil(koreanChars / 2.5) + Math.ceil(otherChars / 3);
  
  return {
    totalLength: prompt.length,
    englishChars,
    koreanChars,
    otherChars,
    estimatedTokens
  };
}

/**
 * 현재 사용 중인 프롬프트 길이 확인
 */
function checkCurrentPromptLength() {
  Logger.log("🔍 === 프롬프트 토큰 길이 진단 ===");
  
  try {
    // 테스트 토픽과 관련 주제로 실제 프롬프트 생성
    const testTopic = "AI 기술의 미래 전망과 산업별 활용 방안";
    const testRelatedTopics = ["인공지능", "기계학습", "딥러닝", "자연어처리", "컴퓨터비전", "로봇공학"];
    
    // 한국어 프롬프트 생성
    const koreanPrompt = buildStructuredPromptWithLanguage(testTopic, "KO", testRelatedTopics);
    const koreanStats = measurePromptLength(koreanPrompt);
    
    Logger.log("🇰🇷 한국어 프롬프트 분석:");
    Logger.log(`  총 글자 수: ${koreanStats.totalLength.toLocaleString()}자`);
    Logger.log(`  영어 글자: ${koreanStats.englishChars.toLocaleString()}자`);
    Logger.log(`  한국어 글자: ${koreanStats.koreanChars.toLocaleString()}자`);
    Logger.log(`  기타 글자: ${koreanStats.otherChars.toLocaleString()}자`);
    Logger.log(`  예상 토큰 수: ${koreanStats.estimatedTokens.toLocaleString()}토큰`);
    Logger.log("");
    
    // 영어 프롬프트 생성
    const englishPrompt = buildStructuredPromptWithLanguage(testTopic, "EN", testRelatedTopics);
    const englishStats = measurePromptLength(englishPrompt);
    
    Logger.log("🇺🇸 영어 프롬프트 분석:");
    Logger.log(`  총 글자 수: ${englishStats.totalLength.toLocaleString()}자`);
    Logger.log(`  예상 토큰 수: ${englishStats.estimatedTokens.toLocaleString()}토큰`);
    Logger.log("");
    
    // Claude 토큰 제한 확인
    const claudeMaxTokens = 200000; // Claude 3.5의 실제 최대 입력 토큰
    
    Logger.log("📊 토큰 제한 비교:");
    Logger.log(`  Claude 최대 입력 토큰: ${claudeMaxTokens.toLocaleString()}`);
    Logger.log(`  한국어 프롬프트 비율: ${(koreanStats.estimatedTokens / claudeMaxTokens * 100).toFixed(2)}%`);
    Logger.log(`  영어 프롬프트 비율: ${(englishStats.estimatedTokens / claudeMaxTokens * 100).toFixed(2)}%`);
    Logger.log("");
    
    // 문제 진단
    if (koreanStats.estimatedTokens > 64000) {
      Logger.log("❌ 문제 발견: 한국어 프롬프트가 64,000 토큰을 초과합니다!");
      Logger.log("   이것이 'Invalid bearer token' 에러의 원인일 수 있습니다.");
      Logger.log("");
      Logger.log("🔧 해결 방법:");
      Logger.log("   1. optimizePromptLength() 실행 - 프롬프트 단축");
      Logger.log("   2. switchToGPT5() 실행 - 더 긴 토큰 지원 모델로 전환");
    } else if (koreanStats.estimatedTokens > 32000) {
      Logger.log("⚠️ 경고: 한국어 프롬프트가 32,000 토큰을 초과합니다.");
      Logger.log("   일부 Claude 모델에서 문제가 될 수 있습니다.");
    } else {
      Logger.log("✅ 프롬프트 길이는 정상 범위입니다.");
    }
    
    // 실제 프롬프트 미리보기 (처음 500자만)
    Logger.log("");
    Logger.log("📝 한국어 프롬프트 미리보기 (처음 500자):");
    Logger.log(koreanPrompt.substring(0, 500) + "...");
    
    return {
      korean: koreanStats,
      english: englishStats,
      isProblematic: koreanStats.estimatedTokens > 64000
    };
    
  } catch (error) {
    Logger.log(`❌ 프롬프트 분석 실패: ${error.message}`);
    return null;
  }
}

/**
 * 프롬프트 길이 최적화 (단축 버전 생성)
 */
function optimizePromptLength() {
  Logger.log("🔧 === 프롬프트 길이 최적화 ===");
  
  // ai-service.js의 한국어 프롬프트를 단축 버전으로 수정
  Logger.log("한국어 프롬프트를 단축 버전으로 최적화합니다...");
  
  const shortKoreanPrompt = createShortKoreanPrompt();
  Logger.log("✅ 단축 프롬프트 생성 완료");
  
  const stats = measurePromptLength(shortKoreanPrompt);
  Logger.log(`단축 프롬프트 토큰 수: ${stats.estimatedTokens.toLocaleString()}`);
  
  if (stats.estimatedTokens < 32000) {
    Logger.log("✅ 최적화 성공! 토큰 수가 안전 범위로 줄어들었습니다.");
    Logger.log("");
    Logger.log("🔧 적용 방법:");
    Logger.log("1. ai-service.js 파일의 buildStructuredPromptWithLanguage 함수 수정");
    Logger.log("2. 또는 createOptimizedPromptFunction() 실행하여 새 함수 생성");
  } else {
    Logger.log("⚠️ 추가 최적화가 필요합니다.");
  }
  
  return shortKoreanPrompt;
}

/**
 * 단축 버전 한국어 프롬프트 생성
 */
function createShortKoreanPrompt() {
  return `당신은 전문 블로거입니다. 다음 주제로 한국어 블로그 글을 작성해주세요.

🚨 언어 규칙:
- 전체 글을 100% 한국어로만 작성
- 제목, 본문, 태그, 카테고리 모두 한국어

주제: {topic}
관련 주제: {relatedTopics}

JSON 형식으로 응답:
{
  "title": "한국어 제목 (60자 이내)",
  "seoDescription": "한국어 메타 설명 (155자 이내)",
  "categories": ["카테고리1", "카테고리2"],
  "tags": ["태그1", "태그2", "태그3"],
  "subtopics": ["소제목1", "소제목2", "소제목3"],
  "html": "HTML 형식 글 내용"
}

요구사항:
1. 6000-8000자 내외 HTML
2. H2, H3 태그 사용 (H2 최대 5개)
3. 한국어 SEO 최적화
4. 2025년 최신 정보 사용
5. 관련 주제를 자연스럽게 통합`;
}

/**
 * 최적화된 프롬프트 함수 생성
 */
function createOptimizedPromptFunction() {
  Logger.log("🔧 === 최적화된 프롬프트 함수 생성 ===");
  
  const optimizedFunction = `
/**
 * 토큰 제한을 고려한 최적화된 프롬프트 생성
 */
function buildOptimizedPromptWithLanguage(topic, targetLanguage = "EN", relatedTopics = []) {
  const isKorean = targetLanguage && (
    targetLanguage.toString().trim().toUpperCase() === "KO" || 
    targetLanguage.toString().trim().toUpperCase() === "KR" || 
    targetLanguage.toString().trim().toLowerCase() === "ko" || 
    targetLanguage.toString().trim().toLowerCase() === "kr" || 
    targetLanguage.toString().includes("한국") ||
    targetLanguage.toString().toLowerCase().includes("korean")
  );
  
  if (isKorean) {
    Logger.log(\`🇰🇷 한국어 모드 (최적화된 프롬프트): targetLanguage="\${targetLanguage}"\`);
    
    const relatedTopicsText = relatedTopics && relatedTopics.length > 0 
      ? \`관련 주제: \${relatedTopics.slice(0, 3).join(', ')}\` // 3개로 제한
      : '';
    
    return \`당신은 전문 블로거입니다. 한국어 블로그 글을 작성해주세요.

🚨 언어 규칙: 전체 글을 100% 한국어로만 작성하세요.

주제: \${topic}
\${relatedTopicsText}

JSON 형식 응답:
{
  "title": "한국어 제목 (60자 이내)",
  "seoDescription": "한국어 메타 설명 (155자 이내)", 
  "categories": ["카테고리1", "카테고리2"],
  "tags": ["태그1", "태그2", "태그3"],
  "subtopics": ["소제목1", "소제목2", "소제목3"],
  "html": "HTML 형식 글 내용"
}

요구사항:
1. 6000-8000자 HTML 내용
2. H2, H3 태그 사용 (H2 최대 5개)
3. 한국어 SEO 최적화
4. 2025년 최신 정보
5. 자연스러운 한국어 표현\`;
  }
  
  Logger.log(\`🌍 영어 모드 (최적화된 프롬프트): targetLanguage="\${targetLanguage}"\`);
  return buildStructuredPrompt(topic, relatedTopics.slice(0, 3)); // 관련 주제 3개로 제한
}`;

  Logger.log("📝 최적화된 함수 코드:");
  Logger.log(optimizedFunction);
  Logger.log("");
  Logger.log("🔧 적용 방법:");
  Logger.log("1. 위 코드를 ai-service.js에 추가");
  Logger.log("2. main.js에서 generateHtmlWithLanguage 대신 buildOptimizedPromptWithLanguage 사용");
  Logger.log("3. 또는 기존 buildStructuredPromptWithLanguage 함수를 위 코드로 교체");
}

/**
 * 토큰 제한 빠른 해결
 */
function quickFixTokenLimit() {
  Logger.log("⚡ === 토큰 제한 빠른 해결 ===");
  
  // 1. 현재 길이 확인
  const analysis = checkCurrentPromptLength();
  
  if (analysis && analysis.isProblematic) {
    Logger.log("");
    Logger.log("🚨 토큰 초과 문제 확인됨!");
    Logger.log("");
    Logger.log("🔧 즉시 해결 방법 3가지:");
    Logger.log("1. GPT-5로 전환 (더 많은 토큰 지원):");
    Logger.log("   switchToGPT5()");
    Logger.log("");
    Logger.log("2. 프롬프트 최적화:");
    Logger.log("   optimizePromptLength()");
    Logger.log("");
    Logger.log("3. Claude 3.5 Haiku 사용 (더 관대한 제한):");
    Logger.log("   setClaude4Model('claude-3-5-haiku-20241022')");
    
    // 자동으로 GPT-5로 전환
    Logger.log("");
    Logger.log("🔄 자동으로 GPT-5로 전환합니다...");
    switchToGPT5();
    Logger.log("✅ GPT-5 전환 완료! 이제 더 긴 프롬프트 지원됩니다.");
    
  } else {
    Logger.log("✅ 토큰 길이는 정상입니다. 다른 원인을 확인해보세요:");
    Logger.log("   debugAPIKeyUsage() 실행");
  }
}