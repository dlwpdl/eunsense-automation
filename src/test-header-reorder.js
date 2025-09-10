/**
 * Language 컬럼을 B로 이동한 후 헤더 순서 테스트
 */

function testNewHeaderOrder() {
  Logger.log("=== 새 헤더 순서 테스트 ===");
  
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
    Logger.log(`📋 현재 시트 헤더: ${headers.join(', ')}`);
    
    // 예상 헤더 순서
    const expectedHeaders = [
      "Topic", "Language", "Status", "PostedURL", "PostedAt", "Category", 
      "TagsCsv", "AffiliateLinks", "ProductNames", "Format",
      "Cluster", "Intent", "SourceKeywords", "OpportunityScore"
    ];
    
    Logger.log(`📋 예상 헤더 순서: ${expectedHeaders.join(', ')}`);
    
    // Language가 B 컬럼(인덱스 1)에 있는지 확인
    const languageIndex = headers.indexOf("Language");
    const topicIndex = headers.indexOf("Topic");
    
    Logger.log(`\n🔍 헤더 위치 확인:`);
    Logger.log(`   Topic: ${topicIndex >= 0 ? `컬럼 ${String.fromCharCode(65 + topicIndex)} (인덱스 ${topicIndex})` : '없음'}`);
    Logger.log(`   Language: ${languageIndex >= 0 ? `컬럼 ${String.fromCharCode(65 + languageIndex)} (인덱스 ${languageIndex})` : '없음'}`);
    
    const isLanguageInB = languageIndex === 1;
    const isTopicInA = topicIndex === 0;
    
    Logger.log(`\n✅ 위치 검증:`);
    Logger.log(`   Topic이 A 컬럼에 있는가: ${isTopicInA ? '✅ YES' : '❌ NO'}`);
    Logger.log(`   Language가 B 컬럼에 있는가: ${isLanguageInB ? '✅ YES' : '❌ NO'}`);
    
    if (isTopicInA && isLanguageInB) {
      Logger.log("\n🎉 헤더 순서 완벽! Topic(A) → Language(B)");
    } else {
      Logger.log("\n⚠️ 헤더 순서 조정 필요");
      
      if (!isLanguageInB && languageIndex >= 0) {
        Logger.log(`   → Language를 현재 ${String.fromCharCode(65 + languageIndex)} 컬럼에서 B 컬럼으로 이동해야 함`);
      }
    }
    
    return {
      success: isTopicInA && isLanguageInB,
      currentHeaders: headers,
      topicIndex: topicIndex,
      languageIndex: languageIndex
    };
    
  } catch (error) {
    Logger.log(`❌ 헤더 순서 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 헤더를 올바른 순서로 수동 재정렬하는 함수
function reorderHeadersManually() {
  Logger.log("=== 헤더 수동 재정렬 실행 ===");
  
  try {
    fixSheetHeaders(); // 기존 함수 호출
    
    Logger.log("✅ 헤더 재정렬 완료");
    
    // 재정렬 후 확인
    testNewHeaderOrder();
    
  } catch (error) {
    Logger.log(`❌ 헤더 재정렬 실패: ${error.message}`);
  }
}

// 실제 Language 컬럼 데이터 접근 테스트
function testLanguageColumnAccess() {
  Logger.log("\n=== Language 컬럼 데이터 접근 테스트 ===");
  
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
    
    Logger.log(`📋 데이터 행 수: ${allData.length - 1}개 (헤더 제외)`);
    
    // 처음 몇 행의 Topic과 Language 확인
    for (let i = 1; i < Math.min(allData.length, 6); i++) {
      const rowData = createRowObject(headers, allData[i]);
      const topic = rowData.Topic || "";
      const language = rowData.Language || "";
      
      if (topic.trim()) {
        Logger.log(`\n📝 행 ${i + 1}:`);
        Logger.log(`   Topic: "${topic}"`);
        Logger.log(`   Language: "${language}"`);
        
        // 언어 감지 로직 테스트
        const isKorean = language && (language.toUpperCase() === "KO" || language.toUpperCase() === "KR" || language.includes("한국"));
        Logger.log(`   감지 결과: ${isKorean ? '한국어' : '영어'}`);
      }
    }
    
  } catch (error) {
    Logger.log(`❌ Language 컬럼 접근 테스트 실패: ${error.message}`);
  }
}

// enhanceExistingTopics에서 새 헤더 순서로 제대로 작동하는지 테스트
function testEnhanceWithNewHeaderOrder() {
  Logger.log("\n=== 새 헤더 순서로 enhanceExistingTopics 테스트 ===");
  
  try {
    Logger.log("🔍 enhanceExistingTopics 함수를 새 헤더 순서로 실행...");
    
    // enhanceExistingTopics 함수 실행 (한 개 토픽만 처리하도록 제한)
    enhanceExistingTopics();
    
    Logger.log("✅ enhanceExistingTopics 실행 완료");
    Logger.log("📋 로그를 확인하여 Language 컬럼 B에서 정확히 읽어왔는지 확인하세요:");
    Logger.log("   - '시트 Language 값: [값] → [한국어/영어] 처리' 메시지 확인");
    Logger.log("   - Language가 KO/KR일 때 한국어 프롬프트 사용 확인");
    
  } catch (error) {
    Logger.log(`❌ enhance 테스트 실패: ${error.message}`);
  }
}