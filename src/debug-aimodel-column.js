/**
 * AIModel 컬럼 감지 디버깅 도구
 */

/**
 * 시트의 AIModel 컬럼 상태를 자세히 확인
 */
function debugAIModelColumn() {
  Logger.log("=== AIModel 컬럼 디버깅 시작 ===");

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

    // 1. 헤더 확인
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`📋 현재 헤더: ${headers.join(' | ')}`);

    // AIModel 컬럼 위치 찾기
    const aiModelColIndex = headers.indexOf("AIModel");
    Logger.log(`🔍 AIModel 컬럼 위치: ${aiModelColIndex} (0부터 시작, -1이면 없음)`);

    if (aiModelColIndex === -1) {
      Logger.log("❌ AIModel 컬럼이 헤더에 없습니다!");
      Logger.log("💡 해결책: ensureHeaders 함수를 실행하거나 수동으로 AIModel 컬럼을 추가하세요.");
      return;
    }

    // 2. 데이터 행들 확인
    const dataRange = sheet.getDataRange();
    const allData = dataRange.getValues();

    Logger.log(`📊 총 데이터 행 수: ${allData.length - 1}개 (헤더 제외)`);

    // 각 행의 AIModel 값 확인
    for (let i = 1; i < Math.min(allData.length, 6); i++) { // 최대 5개 행만 확인
      const rowData = allData[i];
      const aiModelValue = rowData[aiModelColIndex];

      Logger.log(`📝 행 ${i + 1}: AIModel = "${aiModelValue}" (타입: ${typeof aiModelValue})`);

      if (aiModelValue) {
        // AIModel 변환 테스트
        const convertedModel = getAIModelFromSheet(sheet, i + 1);
        Logger.log(`   → 변환된 모델: ${convertedModel}`);

        if (convertedModel) {
          const provider = getProviderFromModel(convertedModel);
          Logger.log(`   → 제공자: ${provider}`);
        }
      } else {
        Logger.log(`   → 빈 값: 기본 설정 사용`);
      }
    }

    // 3. 함수 연동 테스트
    Logger.log("\n🧪 함수 연동 테스트:");

    for (let i = 2; i <= Math.min(3, allData.length); i++) { // 2-3행 테스트
      Logger.log(`\n--- 행 ${i} 테스트 ---`);

      const effectiveModel = getEffectiveAIModel(sheet, i);
      const provider = getProviderFromModel(effectiveModel);

      Logger.log(`최종 사용 모델: ${effectiveModel}`);
      Logger.log(`제공자: ${provider}`);
    }

  } catch (error) {
    Logger.log(`❌ 디버깅 실패: ${error.message}`);
    Logger.log(`스택: ${error.stack}`);
  }
}

/**
 * AIModel 컬럼 값들의 매핑 테스트
 */
function testAIModelMappings() {
  Logger.log("=== AIModel 매핑 테스트 ===");

  const testInputs = [
    "Claude4", "CLAUDE4", "claude4",
    "GPT5", "gpt5", "GPT-5",
    "GPT4o", "gpt4o", "GPT4O",
    "Gemini1.5", "GEMINI1.5PRO",
    "", null, undefined
  ];

  testInputs.forEach(input => {
    try {
      // 임시 시트 데이터 시뮬레이션
      const mockSheet = {
        getRange: (row, col, numRows, numCols) => ({
          getValues: () => {
            if (row === 1) {
              // 헤더 행
              return [["Topic", "Body", "Language", "AIModel", "Status"]];
            } else {
              // 데이터 행
              return [["Test Topic", "Test Body", "KO", input, ""]];
            }
          },
          getValue: () => input
        }),
        getLastColumn: () => 5
      };

      const result = getAIModelFromSheet(mockSheet, 2);
      Logger.log(`입력: "${input}" → 결과: "${result}"`);
    } catch (error) {
      Logger.log(`입력: "${input}" → 에러: ${error.message}`);
    }
  });
}

/**
 * 시트 헤더 정리 및 AIModel 컬럼 추가
 */
function fixAIModelColumn() {
  Logger.log("=== AIModel 컬럼 수정 시작 ===");

  try {
    const config = getConfig();
    const sheet = SpreadsheetApp.openById(config.SHEET_ID).getSheetByName(config.SHEET_NAME);

    if (!sheet) {
      Logger.log(`❌ 시트를 찾을 수 없습니다: ${config.SHEET_NAME}`);
      return;
    }

    // 현재 헤더 확인
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`현재 헤더: ${headers.join(' | ')}`);

    // AIModel 컬럼이 있는지 확인
    const aiModelIndex = headers.indexOf("AIModel");

    if (aiModelIndex === -1) {
      Logger.log("AIModel 컬럼이 없습니다. 추가합니다...");

      // Language 컬럼 다음에 AIModel 추가
      const languageIndex = headers.indexOf("Language");

      if (languageIndex !== -1) {
        // Language 컬럼 다음 위치에 AIModel 삽입
        headers.splice(languageIndex + 1, 0, "AIModel");

        // 시트에 새 헤더 적용
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        Logger.log(`✅ AIModel 컬럼을 ${languageIndex + 2}번째 위치에 추가했습니다.`);
        Logger.log(`새 헤더: ${headers.join(' | ')}`);
      } else {
        Logger.log("❌ Language 컬럼을 찾을 수 없어서 AIModel을 추가할 수 없습니다.");
      }
    } else {
      Logger.log(`✅ AIModel 컬럼이 이미 ${aiModelIndex + 1}번째 위치에 있습니다.`);
    }

  } catch (error) {
    Logger.log(`❌ AIModel 컬럼 수정 실패: ${error.message}`);
  }
}

/**
 * 특정 행의 AIModel 테스트
 */
function testSpecificRowAIModel() {
  const rowNumber = 2; // 테스트할 행 번호 (헤더 제외)

  Logger.log(`=== 행 ${rowNumber} AIModel 테스트 ===`);

  try {
    const config = getConfig();
    const sheet = SpreadsheetApp.openById(config.SHEET_ID).getSheetByName(config.SHEET_NAME);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const aiModelIndex = headers.indexOf("AIModel");

    if (aiModelIndex === -1) {
      Logger.log("❌ AIModel 컬럼이 없습니다!");
      return;
    }

    // 해당 행의 데이터 읽기
    const rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    const aiModelValue = rowData[aiModelIndex];

    Logger.log(`행 ${rowNumber}의 AIModel 값: "${aiModelValue}"`);

    // 변환 테스트
    const convertedModel = getAIModelFromSheet(sheet, rowNumber);
    Logger.log(`변환된 모델: ${convertedModel}`);

    // 최종 사용 모델
    const effectiveModel = getEffectiveAIModel(sheet, rowNumber);
    Logger.log(`최종 사용 모델: ${effectiveModel}`);

    const provider = getProviderFromModel(effectiveModel);
    Logger.log(`제공자: ${provider}`);

  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
  }
}