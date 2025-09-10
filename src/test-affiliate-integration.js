/**
 * 어필리에이트 링크 통합 테스트 스크립트
 * Google Apps Script에서 실행하여 어필리에이트 링크가 포스트에 제대로 삽입되는지 확인
 */

function testAffiliateIntegration() {
  Logger.log("=== 어필리에이트 링크 통합 테스트 ===");
  
  try {
    // 1. 기본 어필리에이트 링크 파싱 테스트
    testAffiliateParsingFromSheet();
    
    // 2. HTML 삽입 테스트
    testAffiliateHTMLInsertion();
    
    // 3. 전체 publishPosts 워크플로우에서의 어필리에이트 처리 확인
    testPublishWorkflowWithAffiliate();
    
    Logger.log("✅ 모든 어필리에이트 링크 테스트 완료");
    
  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
    Logger.log(`스택: ${error.stack}`);
  }
}

function testAffiliateParsingFromSheet() {
  Logger.log("\n🧪 1. 어필리에이트 링크 파싱 테스트");
  
  // 간단한 형식 테스트 (제품명|링크 형식)
  const testInputs = [
    "MacBook Pro|https://example.com/macbook",
    "MacBook Pro|https://example.com/macbook,iPhone 15|https://example.com/iphone",
    "Sony Camera|https://example.com/sony,Adobe CC|https://example.com/adobe,Final Cut Pro|https://example.com/fcp"
  ];
  
  testInputs.forEach((input, index) => {
    Logger.log(`\n테스트 ${index + 1}: ${input}`);
    
    try {
      const parsed = parseAffiliateLinksFromSheet(input);
      Logger.log(`✅ 파싱 결과: ${parsed.length}개 제품`);
      
      parsed.forEach((product, i) => {
        Logger.log(`  ${i + 1}. ${product.name} → ${product.link}`);
      });
      
    } catch (error) {
      Logger.log(`❌ 파싱 실패: ${error.message}`);
    }
  });
}

function testAffiliateHTMLInsertion() {
  Logger.log("\n🧪 2. HTML 삽입 테스트");
  
  const testHTML = `
    <h1>테스트 포스트</h1>
    <p>이것은 테스트 포스트입니다.</p>
    
    <h2>첫 번째 섹션</h2>
    <p>첫 번째 섹션 내용입니다.</p>
    
    <h2>두 번째 섹션</h2>
    <p>두 번째 섹션 내용입니다.</p>
    
    <h2>세 번째 섹션</h2>
    <p>세 번째 섹션 내용입니다.</p>
    
    <p>마지막 문단입니다.</p>
  `;
  
  const affiliateData = "MacBook Pro|https://example.com/macbook,iPhone 15|https://example.com/iphone,AirPods|https://example.com/airpods";
  
  try {
    const result = injectAffiliateLinks(testHTML, "테스트 포스트", affiliateData);
    
    Logger.log("✅ HTML 삽입 테스트 완료");
    Logger.log(`원본 길이: ${testHTML.length}자`);
    Logger.log(`결과 길이: ${result.length}자`);
    
    // 어필리에이트 섹션이 포함되었는지 확인
    const hasAffiliateContent = result.includes('affiliate-product-box');
    Logger.log(`어필리에이트 콘텐츠 포함: ${hasAffiliateContent ? '✅' : '❌'}`);
    
    // 링크 수 확인
    const linkCount = (result.match(/rel="nofollow"/g) || []).length;
    Logger.log(`nofollow 링크 수: ${linkCount}개`);
    
    // 고지문 포함 확인
    const hasDisclaimer = result.includes('제휴 링크') || result.includes('affiliate');
    Logger.log(`어필리에이트 고지문 포함: ${hasDisclaimer ? '✅' : '❌'}`);
    
  } catch (error) {
    Logger.log(`❌ HTML 삽입 테스트 실패: ${error.message}`);
  }
}

function testPublishWorkflowWithAffiliate() {
  Logger.log("\n🧪 3. PublishPosts 워크플로우 내 어필리에이트 처리 확인");
  
  try {
    const config = getConfig();
    
    if (!config.SHEET_ID) {
      Logger.log("❌ SHEET_ID가 설정되지 않아 워크플로우 테스트를 건너뜁니다.");
      return;
    }
    
    const sheet = SpreadsheetApp.openById(config.SHEET_ID).getSheetByName(config.SHEET_NAME);
    if (!sheet) {
      Logger.log(`❌ 시트를 찾을 수 없습니다: ${config.SHEET_NAME}`);
      return;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`📋 시트 헤더: ${headers.join(', ')}`);
    
    // AffiliateLinks 컬럼이 있는지 확인
    const affiliateColIndex = headers.indexOf("AffiliateLinks");
    Logger.log(`AffiliateLinks 컬럼: ${affiliateColIndex >= 0 ? `✅ 인덱스 ${affiliateColIndex}` : '❌ 없음'}`);
    
    // 테스트용 데이터 확인 (Status가 비어있고 AffiliateLinks가 있는 행)
    const allData = sheet.getDataRange().getValues();
    let testRows = [];
    
    for (let i = 1; i < Math.min(allData.length, 10); i++) { // 처음 10행만 확인
      const rowData = createRowObject(headers, allData[i]);
      const status = rowData.Status || "";
      const affiliateLinks = rowData.AffiliateLinks || "";
      const topic = rowData.Topic || "";
      
      if (topic.trim() && !status.trim() && affiliateLinks.trim()) {
        testRows.push({
          row: i + 1,
          topic: topic,
          affiliateLinks: affiliateLinks
        });
      }
    }
    
    Logger.log(`🔍 테스트 가능한 행: ${testRows.length}개`);
    
    if (testRows.length > 0) {
      const testRow = testRows[0];
      Logger.log(`📝 테스트 행: ${testRow.row} - ${testRow.topic}`);
      Logger.log(`🔗 어필리에이트 데이터: ${testRow.affiliateLinks}`);
      
      // 어필리에이트 데이터 파싱 테스트
      const parsed = parseAffiliateLinksFromSheet(testRow.affiliateLinks);
      Logger.log(`✅ 파싱된 제품 수: ${parsed.length}개`);
      
    } else {
      Logger.log("⚠️ 테스트할 수 있는 행이 없습니다. (Status가 비어있고 AffiliateLinks가 있는 행 필요)");
    }
    
  } catch (error) {
    Logger.log(`❌ 워크플로우 테스트 실패: ${error.message}`);
  }
}

// 실제 포스팅 전 어필리에이트 링크 미리보기
function previewAffiliateInPost() {
  Logger.log("=== 어필리에이트 링크 미리보기 ===");
  
  const sampleContent = `
    <h1>2025년 최고의 카메라 추천</h1>
    <p>이번 글에서는 2025년 최고의 카메라들을 소개해드리겠습니다.</p>
    
    <h2>DSLR 카메라</h2>
    <p>DSLR 카메라는 여전히 전문 사진작가들에게 인기가 많습니다.</p>
    
    <h2>미러리스 카메라</h2>
    <p>미러리스 카메라는 휴대성과 성능을 모두 만족시킵니다.</p>
    
    <h2>액션 카메라</h2>
    <p>액션 카메라는 여행과 스포츠 촬영에 최적입니다.</p>
  `;
  
  const affiliateData = "Canon EOS R5|https://example.com/canon-r5,Sony A7 IV|https://example.com/sony-a7iv,GoPro Hero 12|https://example.com/gopro-hero12";
  
  try {
    const result = injectAffiliateLinks(sampleContent, "2025년 최고의 카메라 추천", affiliateData);
    
    Logger.log("📖 어필리에이트 링크가 삽입된 미리보기:");
    Logger.log("=".repeat(50));
    Logger.log(result.substring(0, 1000) + "..."); // 처음 1000자만 출력
    Logger.log("=".repeat(50));
    
  } catch (error) {
    Logger.log(`❌ 미리보기 생성 실패: ${error.message}`);
  }
}