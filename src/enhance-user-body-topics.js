/**
 * Body 컬럼이 있는 토픽들의 SEO 메타데이터만 업데이트하는 전용 함수
 * publishPosts와 별도로 실행 가능
 */

/**
 * Body가 있는 토픽들의 SEO 메타데이터만 강화
 * Body 내용은 그대로 두고 Topic, Category, Tags 등만 AI로 최적화
 */
function enhanceUserBodyTopics() {
  try {
    Logger.log("=== Body가 있는 토픽들 SEO 강화 시작 ===");

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

    // Body가 있으면서 아직 발행되지 않은 행들 찾기
    const userBodyRows = [];
    for (let i = 1; i < allData.length; i++) {
      const rowData = createRowObject(headers, allData[i]);
      const topic = rowData.Topic || "";
      const body = rowData.Body || "";
      const status = rowData.Status || "";

      // Body가 있고, 아직 발행되지 않은 토픽들
      if (topic.trim() && body.trim() && !status.trim().startsWith("posted")) {
        userBodyRows.push({
          rowNumber: i + 1,
          data: rowData
        });
      }
    }

    Logger.log(`📋 Body가 있는 미발행 토픽 ${userBodyRows.length}개 발견`);

    if (userBodyRows.length === 0) {
      Logger.log("✅ Body 컬럼이 있는 미발행 토픽이 없습니다.");
      return;
    }

    let enhanced = 0;
    for (const row of userBodyRows) {
      try {
        Logger.log(`🔍 사용자 본문 토픽 처리 중: "${row.data.Topic}"`);

        // 언어 처리
        const rawLanguage = row.data.Language || "EN";
        const targetLanguage = rawLanguage.toString().trim() || "EN";
        Logger.log(`🌐 언어 설정: "${rawLanguage}" → "${targetLanguage}"`);

        // 1. 기존 enhance 함수로 SEO 메타데이터 생성
        let seoMetadata = null;
        if (!row.data.Category || !row.data.TagsCsv) {
          Logger.log(`🔍 SEO 메타데이터 생성 중...`);
          seoMetadata = generateSEOMetadata(row.data.Topic, targetLanguage);
        }

        // 2. 사용자 본문 SEO 최적화 (제목 + 본문 개선)
        const seoOptimized = optimizeSEOForUserContent(
          row.data.Topic,
          row.data.Body.toString().trim(),
          targetLanguage
        );

        // 3. 시트 업데이트 데이터 준비
        const updateData = {};

        // SEO 최적화된 제목으로 업데이트
        if (seoOptimized.optimizedTitle && seoOptimized.optimizedTitle !== row.data.Topic) {
          updateData.Topic = seoOptimized.optimizedTitle;
          Logger.log(`📝 제목 SEO 최적화: "${row.data.Topic}" → "${seoOptimized.optimizedTitle}"`);
        }

        // 카테고리 업데이트 (빈 경우에만)
        if (!row.data.Category && (seoMetadata?.category || seoOptimized.categories?.length > 0)) {
          updateData.Category = seoMetadata?.category || seoOptimized.categories[0];
          Logger.log(`🏷️ 카테고리 생성: ${updateData.Category}`);
        }

        // 태그 업데이트 (빈 경우에만)
        if (!row.data.TagsCsv && (seoMetadata?.tags?.length > 0 || seoOptimized.tags?.length > 0)) {
          const tags = seoMetadata?.tags || seoOptimized.tags;
          updateData.TagsCsv = tags.join(',');
          Logger.log(`🔖 태그 생성: ${updateData.TagsCsv}`);
        }

        // 클러스터 및 기타 메타데이터 (enhance 결과가 있는 경우만)
        if (seoMetadata) {
          if (!row.data.Cluster && seoMetadata.cluster) {
            updateData.Cluster = seoMetadata.cluster;
          }
          if (!row.data.Intent && seoMetadata.intent) {
            updateData.Intent = seoMetadata.intent;
          }
          if (!row.data.SourceKeywords && seoMetadata.sourceKeywords?.length > 0) {
            updateData.SourceKeywords = seoMetadata.sourceKeywords.join(', ');
          }
        }

        // 시트에 업데이트
        if (Object.keys(updateData).length > 0) {
          updateSheetRow(sheet, row.rowNumber, updateData, headers);
          enhanced++;
          Logger.log(`✅ "${row.data.Topic}" SEO 메타데이터 업데이트 완료`);
          Logger.log(`   업데이트된 항목: ${Object.keys(updateData).join(', ')}`);
        } else {
          Logger.log(`ℹ️ "${row.data.Topic}" 이미 모든 SEO 메타데이터가 있음`);
        }

        // API 요청 제한을 위한 대기
        Utilities.sleep(1500);

      } catch (error) {
        Logger.log(`❌ "${row.data.Topic}" 처리 실패: ${error.message}`);
      }
    }

    Logger.log(`🎉 Body 토픽 SEO 강화 완료: ${enhanced}개 토픽 처리`);

  } catch (error) {
    Logger.log(`❌ Body 토픽 SEO 강화 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 단일 Body 토픽 SEO 강화 테스트
 */
function testSingleUserBodyTopic() {
  Logger.log("=== 단일 Body 토픽 SEO 강화 테스트 ===");

  try {
    const config = getConfig();
    const sheet = SpreadsheetApp.openById(config.SHEET_ID).getSheetByName(config.SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const allData = sheet.getDataRange().getValues();

    // Body가 있는 첫 번째 토픽 찾기
    for (let i = 1; i < allData.length; i++) {
      const rowData = createRowObject(headers, allData[i]);
      const topic = rowData.Topic || "";
      const body = rowData.Body || "";

      if (topic.trim() && body.trim()) {
        Logger.log(`🎯 테스트 대상: "${topic}"`);
        Logger.log(`📝 Body 길이: ${body.length}자`);

        // SEO 최적화 실행
        const result = optimizeSEOForUserContent(topic, body, rowData.Language || "EN");

        if (result) {
          Logger.log(`✅ SEO 최적화 결과:`);
          Logger.log(`  - 최적화된 제목: ${result.optimizedTitle}`);
          Logger.log(`  - 카테고리: ${result.categories.join(', ')}`);
          Logger.log(`  - 태그: ${result.tags.join(', ')}`);
          Logger.log(`  - 메타 설명: ${result.seoDescription}`);
          return result;
        } else {
          Logger.log(`❌ SEO 최적화 실패`);
          return null;
        }
      }
    }

    Logger.log(`ℹ️ Body가 있는 토픽을 찾을 수 없습니다.`);
    return null;

  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
    return null;
  }
}

/**
 * Body 컬럼 데이터 현황 확인
 */
function checkUserBodyTopicsStatus() {
  Logger.log("=== Body 컬럼 토픽 현황 확인 ===");

  try {
    const config = getConfig();
    const sheet = SpreadsheetApp.openById(config.SHEET_ID).getSheetByName(config.SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const allData = sheet.getDataRange().getValues();

    let totalRows = allData.length - 1; // 헤더 제외
    let bodyRows = 0;
    let publishedBodyRows = 0;
    let unpublishedBodyRows = 0;
    let emptyBodyRows = 0;

    for (let i = 1; i < allData.length; i++) {
      const rowData = createRowObject(headers, allData[i]);
      const topic = rowData.Topic || "";
      const body = rowData.Body || "";
      const status = rowData.Status || "";

      if (topic.trim()) {
        if (body.trim()) {
          bodyRows++;
          if (status.trim().startsWith("posted")) {
            publishedBodyRows++;
          } else {
            unpublishedBodyRows++;
          }
        } else {
          emptyBodyRows++;
        }
      }
    }

    Logger.log(`📊 Body 컬럼 현황:`);
    Logger.log(`  - 전체 토픽: ${totalRows}개`);
    Logger.log(`  - Body 있는 토픽: ${bodyRows}개`);
    Logger.log(`  - Body 있는 발행된 토픽: ${publishedBodyRows}개`);
    Logger.log(`  - Body 있는 미발행 토픽: ${unpublishedBodyRows}개`);
    Logger.log(`  - Body 없는 토픽: ${emptyBodyRows}개`);

    if (unpublishedBodyRows > 0) {
      Logger.log(`💡 enhanceUserBodyTopics() 함수를 실행하면 ${unpublishedBodyRows}개 토픽의 SEO를 강화할 수 있습니다.`);
    }

    return {
      total: totalRows,
      withBody: bodyRows,
      publishedWithBody: publishedBodyRows,
      unpublishedWithBody: unpublishedBodyRows,
      withoutBody: emptyBodyRows
    };

  } catch (error) {
    Logger.log(`❌ 현황 확인 실패: ${error.message}`);
    return null;
  }
}