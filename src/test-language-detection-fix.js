/**
 * 수정된 언어 감지 로직 테스트
 * Google Apps Script에서 실행하여 KO, KR 모두 한국어로 인식되는지 확인
 */

function testLanguageDetectionFix() {
  Logger.log("=== 수정된 언어 감지 로직 테스트 ===");
  
  // 다양한 언어 입력값 테스트
  const testCases = [
    { input: "KO", expected: "한국어" },
    { input: "KR", expected: "한국어" },
    { input: "ko", expected: "한국어" },
    { input: "kr", expected: "한국어" },
    { input: "한국어", expected: "한국어" },
    { input: "EN", expected: "영어" },
    { input: "en", expected: "영어" },
    { input: "English", expected: "영어" },
    { input: "", expected: "영어" },
    { input: null, expected: "영어" },
    { input: undefined, expected: "영어" }
  ];
  
  testCases.forEach((testCase, index) => {
    Logger.log(`\n🧪 테스트 ${index + 1}: "${testCase.input}"`);
    
    try {
      // 언어 감지 로직 테스트 (generateSEOMetadata 함수 내부 로직과 동일)
      const language = testCase.input || "EN";
      const isKorean = language && (language.toUpperCase() === "KO" || language.toUpperCase() === "KR" || language.includes("한국"));
      const result = isKorean ? "한국어" : "영어";
      
      const isCorrect = result === testCase.expected;
      Logger.log(`  입력: "${testCase.input}" → 감지: ${result} (예상: ${testCase.expected}) ${isCorrect ? '✅' : '❌'}`);
      
      if (!isCorrect) {
        Logger.log(`  ❌ 테스트 실패!`);
      }
      
    } catch (error) {
      Logger.log(`  ❌ 오류: ${error.message}`);
    }
  });
  
  Logger.log("\n=== 실제 SEO 메타데이터 생성 테스트 ===");
  
  // 실제 generateSEOMetadata 함수로 테스트
  const realTestCases = [
    { topic: "2025년 최고의 스마트폰", language: "KR" },
    { topic: "Best Smartphones in 2025", language: "EN" },
    { topic: "AI 기술 동향", language: "KO" }
  ];
  
  realTestCases.forEach((testCase, index) => {
    Logger.log(`\n🔍 실제 테스트 ${index + 1}: ${testCase.topic} (${testCase.language})`);
    
    try {
      const metadata = generateSEOMetadata(testCase.topic, testCase.language);
      
      if (metadata) {
        Logger.log(`✅ 메타데이터 생성 성공:`);
        Logger.log(`  - 최적화된 제목: ${metadata.optimizedTitle}`);
        Logger.log(`  - 카테고리: ${metadata.category}`);
        
        // 한국어 또는 영어 콘텐츠인지 확인
        const hasKorean = /[가-힣]/.test(metadata.optimizedTitle);
        const expectedKorean = testCase.language === "KR" || testCase.language === "KO";
        
        Logger.log(`  - 한국어 콘텐츠: ${hasKorean ? 'YES' : 'NO'} (예상: ${expectedKorean ? 'YES' : 'NO'}) ${hasKorean === expectedKorean ? '✅' : '❌'}`);
        
      } else {
        Logger.log(`❌ 메타데이터 생성 실패`);
      }
      
    } catch (error) {
      Logger.log(`❌ 오류: ${error.message}`);
    }
  });
}

// 시트에서 실제 데이터로 테스트
function testRealSheetLanguageDetection() {
  Logger.log("\n=== 실제 시트 데이터로 언어 감지 테스트 ===");
  
  try {
    const config = getConfig();
    
    if (!config.SHEET_ID) {
      Logger.log("❌ SHEET_ID가 설정되지 않았습니다.");
      return;
    }
    
    const sheet = SpreadsheetApp.openById(config.SHEET_ID).getSheetByName(config.SHEET_NAME);
    if (!sheet) {
      Logger.log(`❌ 시트를 찾을 수 없습니다: ${config.SHEET_NAME}`);
      return;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const allData = sheet.getDataRange().getValues();
    
    // Language 컬럼이 있는 처음 몇 행 확인
    for (let i = 1; i < Math.min(allData.length, 10); i++) {
      const rowData = createRowObject(headers, allData[i]);
      const topic = rowData.Topic || "";
      const language = rowData.Language || "";
      
      if (topic.trim() && language.trim()) {
        Logger.log(`\n📋 행 ${i + 1}: ${topic}`);
        Logger.log(`  Language 컬럼: "${language}"`);
        
        // 언어 감지 로직 적용
        const isKorean = language && (language.toUpperCase() === "KO" || language.toUpperCase() === "KR" || language.includes("한국"));
        Logger.log(`  감지 결과: ${isKorean ? '한국어' : '영어'}`);
        
        // 토픽 자체에 한국어가 있는지 확인
        const topicHasKorean = /[가-힣]/.test(topic);
        Logger.log(`  토픽 한국어 포함: ${topicHasKorean ? 'YES' : 'NO'}`);
        
        const isConsistent = isKorean === topicHasKorean;
        Logger.log(`  언어 일치성: ${isConsistent ? '✅' : '⚠️'}`);
      }
    }
    
  } catch (error) {
    Logger.log(`❌ 실제 시트 테스트 실패: ${error.message}`);
  }
}