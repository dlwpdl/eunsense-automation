/**
 * AIModel 컬럼 읽기 디버깅 함수
 */

/**
 * 기본적인 시트 접근 확인
 */
function basicSheetCheck() {
  Logger.log("=== 기본 시트 체크 ===");
  
  try {
    // 1. Properties 직접 확인
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty("SHEET_ID");
    
    Logger.log("SHEET_ID from Properties: " + sheetId);
    
    if (!sheetId) {
      Logger.log("❌ SHEET_ID가 Script Properties에 설정되지 않았습니다!");
      Logger.log("Script Properties에서 SHEET_ID를 설정해주세요.");
      return;
    }
    
    // 2. 스프레드시트 열기 시도
    const ss = SpreadsheetApp.openById(sheetId);
    Logger.log("✅ 스프레드시트 열기 성공: " + ss.getName());
    
    // 3. 모든 시트 목록 출력
    Logger.log("📋 사용 가능한 시트들:");
    ss.getSheets().forEach((sheet, index) => {
      Logger.log(`  ${index + 1}. "${sheet.getName()}"`);
    });
    
    // 4. "Topics" 시트 찾기
    const topicsSheet = ss.getSheetByName("Topics");
    if (topicsSheet) {
      Logger.log("✅ 'Topics' 시트 찾기 성공");
      
      // 5. 실제 데이터 확인
      const lastCol = topicsSheet.getLastColumn();
      const lastRow = topicsSheet.getLastRow();
      Logger.log(`📊 시트 크기: ${lastRow}행 x ${lastCol}열`);
      
      if (lastRow >= 2) {
        const headers = topicsSheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const row2 = topicsSheet.getRange(2, 1, 1, lastCol).getValues()[0];
        
        Logger.log("📋 헤더: " + headers.join(" | "));
        Logger.log("📝 2행: " + row2.join(" | "));
        
        const aiModelIdx = headers.indexOf("AIModel");
        if (aiModelIdx >= 0) {
          Logger.log(`🎯 AIModel 위치: ${aiModelIdx}번째 컬럼`);
          Logger.log(`📊 AIModel 값: "${row2[aiModelIdx]}"`);
        }
      }
    } else {
      Logger.log("❌ 'Topics' 시트를 찾을 수 없습니다");
    }
    
  } catch (error) {
    Logger.log("❌ 오류: " + error.toString());
    Logger.log("스택 트레이스: " + error.stack);
  }
}
function debugAIModelReading() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.openById(config.SHEET_ID);
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    Logger.log("=== 🔍 AIModel 컬럼 디버깅 ===");
    Logger.log("📋 헤더 목록:");
    headers.forEach((header, index) => {
      Logger.log(`  ${index}: "${header}"`);
    });
    
    Logger.log("📝 2번째 행 데이터:");
    rowData.forEach((data, index) => {
      Logger.log(`  ${index}: "${data}"`);
    });
    
    const aiModelColIndex = headers.indexOf("AIModel");
    Logger.log(`🎯 AIModel 컬럼 인덱스: ${aiModelColIndex}`);
    
    if (aiModelColIndex !== -1) {
      const aiModelValue = rowData[aiModelColIndex];
      Logger.log(`📊 AIModel 실제 값: "${aiModelValue}" (타입: ${typeof aiModelValue})`);
      Logger.log(`📏 AIModel 값 길이: ${aiModelValue ? aiModelValue.toString().length : 0}`);
      
      if (aiModelValue) {
        Logger.log("🔄 getAIModelFromSheet() 함수 호출...");
        const result = getAIModelFromSheet(sheet, 2);
        Logger.log(`✅ 변환 결과: "${result}"`);
        
        // 수동으로 변환 테스트
        const input = aiModelValue.toString().trim().toUpperCase().replace(/\s+/g, '');
        Logger.log(`🧪 수동 변환 테스트: "${aiModelValue}" → "${input}"`);
        
        if (input === 'CLAUDE4') {
          Logger.log("✅ CLAUDE4 매칭 성공!");
        } else {
          Logger.log("❌ CLAUDE4 매칭 실패");
        }
      } else {
        Logger.log("❌ AIModel 셀이 비어있거나 null");
      }
    } else {
      Logger.log("❌ AIModel 헤더를 찾을 수 없음");
    }
    
    Logger.log("=== getEffectiveAIModel 테스트 ===");
    const effectiveModel = getEffectiveAIModel(sheet, 2);
    Logger.log(`🎯 최종 선택된 모델: "${effectiveModel}"`);
    
  } catch (error) {
    Logger.log(`❌ 디버깅 실패: ${error.message}`);
    Logger.log(`스택: ${error.stack}`);
  }
}

/**
 * publishPostsWithDynamicAI에서 실제로 어떻게 읽는지 테스트
 */
function testActualAIModelReading() {
  Logger.log("=== 🧪 실제 AI 모델 읽기 테스트 ===");
  
  try {
    const config = validateConfig();
    const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(config.SHEET_NAME);
    
    // 실제 publishPostWithDynamicAI에서 사용하는 방식과 동일하게
    const rowData = getRowDataFromSheet(sheet, 2);
    Logger.log("📊 getRowDataFromSheet 결과:");
    Logger.log(`  - topic: "${rowData.topic}"`);
    Logger.log(`  - language: "${rowData.language}"`);
    Logger.log(`  - aiModel: "${rowData.aiModel}"`);
    
    const effectiveModel = getEffectiveAIModel(sheet, 2);
    const effectiveProvider = getProviderFromModel(effectiveModel);
    
    Logger.log(`🎯 최종 결과:`);
    Logger.log(`  - effectiveModel: "${effectiveModel}"`);
    Logger.log(`  - effectiveProvider: "${effectiveProvider}"`);
    
  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
  }
}