/**
 * Body 컬럼 기능 테스트
 * 사용자가 직접 입력한 본문에 대한 SEO 최적화 테스트
 */

/**
 * 사용자 본문 SEO 최적화 기능 테스트
 */
function testUserBodySEOOptimization() {
  Logger.log("=== 사용자 본문 SEO 최적화 테스트 시작 ===");

  try {
    // 테스트 데이터
    const testTitle = "내가 좋아하는 커피 브랜드";
    const testBody = `
      <p>안녕하세요! 오늘은 제가 정말 좋아하는 커피 브랜드들에 대해서 이야기해보려고 해요.</p>

      <h2>스타벅스</h2>
      <p>스타벅스는 정말 유명한 브랜드죠. 아메리카노가 맛있어요.</p>

      <h2>이디야</h2>
      <p>가격이 저렴하면서도 맛있는 커피를 파는 곳이에요.</p>

      <h2>할리스</h2>
      <p>분위기가 좋고 조용해서 공부하기 좋은 곳입니다.</p>

      <p>여러분도 좋아하는 커피 브랜드가 있나요?</p>
    `;
    const testLanguage = "KO";

    Logger.log(`📝 테스트 입력:`);
    Logger.log(`  - 제목: ${testTitle}`);
    Logger.log(`  - 본문 길이: ${testBody.length}자`);
    Logger.log(`  - 언어: ${testLanguage}`);

    // SEO 최적화 실행
    const result = optimizeSEOForUserContent(testTitle, testBody, testLanguage);

    if (result) {
      Logger.log(`✅ SEO 최적화 성공!`);
      Logger.log(`🎯 최적화된 제목: ${result.optimizedTitle}`);
      Logger.log(`📄 최적화된 본문 길이: ${result.optimizedHtml.length}자`);
      Logger.log(`📋 SEO 설명: ${result.seoDescription}`);
      Logger.log(`🏷️ 카테고리: ${result.categories.join(', ')}`);
      Logger.log(`🔖 태그: ${result.tags.join(', ')}`);

      // 한국어 콘텐츠 검증
      const hasKorean = /[가-힣]/.test(result.optimizedHtml);
      Logger.log(`🇰🇷 한국어 콘텐츠 포함: ${hasKorean ? '✅' : '❌'}`);

      return {
        success: true,
        result: result,
        hasKorean: hasKorean
      };
    } else {
      Logger.log(`❌ SEO 최적화 실패`);
      return { success: false, error: "최적화 결과가 null" };
    }

  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Body 컬럼이 있는 시트 데이터 처리 테스트
 */
function testBodyColumnProcessing() {
  Logger.log("=== Body 컬럼 처리 테스트 시작 ===");

  try {
    const config = getConfig();

    // 테스트용 시트 데이터 시뮬레이션
    const testHeaders = [
      "Topic", "Body", "Language", "Status", "PostedURL", "PostedAt", "Category",
      "TagsCsv", "AffiliateLinks", "ProductNames", "Format",
      "Cluster", "Intent", "SourceKeywords", "OpportunityScore"
    ];

    const testRowData = [
      "최고의 프로그래밍 언어 5가지", // Topic
      "<h2>Python</h2><p>파이썬은 배우기 쉬운 언어입니다.</p><h2>JavaScript</h2><p>웹 개발에 필수적인 언어죠.</p>", // Body
      "KO", // Language
      "", // Status
      "", // PostedURL
      "", // PostedAt
      "Technology", // Category
      "프로그래밍,언어,개발", // TagsCsv
      "", // AffiliateLinks
      "", // ProductNames
      "standard", // Format
      "", // Cluster
      "", // Intent
      "", // SourceKeywords
      "" // OpportunityScore
    ];

    // 행 데이터 객체 생성
    const rowData = {};
    testHeaders.forEach((header, index) => {
      rowData[header] = testRowData[index];
    });

    Logger.log(`📊 테스트 행 데이터:`);
    Logger.log(`  - Topic: ${rowData.Topic}`);
    Logger.log(`  - Body: ${rowData.Body ? '✅ 있음' : '❌ 없음'}`);
    Logger.log(`  - Language: ${rowData.Language}`);

    // Body 컬럼 체크 로직 테스트
    const userBody = rowData.Body || "";
    const hasUserBody = userBody && userBody.toString().trim().length > 0;

    Logger.log(`🔍 Body 컬럼 감지 결과: ${hasUserBody ? '✅ 사용자 본문 있음' : '❌ 사용자 본문 없음'}`);

    if (hasUserBody) {
      // 언어 정보 처리
      const rawLanguage = rowData.Language || "EN";
      const targetLanguage = rawLanguage.toString().trim() || "EN";

      // AI SEO 최적화 실행
      const seoOptimized = optimizeSEOForUserContent(rowData.Topic, userBody.toString().trim(), targetLanguage);

      if (seoOptimized) {
        Logger.log(`✅ Body 컬럼 처리 성공!`);
        Logger.log(`  - 최적화된 제목: ${seoOptimized.optimizedTitle}`);
        Logger.log(`  - 카테고리: ${seoOptimized.categories.join(', ')}`);
        Logger.log(`  - 태그: ${seoOptimized.tags.join(', ')}`);

        return {
          success: true,
          hasUserBody: hasUserBody,
          seoOptimized: seoOptimized
        };
      } else {
        Logger.log(`❌ SEO 최적화 실패`);
        return { success: false, error: "SEO 최적화 실패" };
      }
    } else {
      Logger.log(`ℹ️ Body 컬럼이 비어있음 - AI 글 생성 모드로 처리됨`);
      return {
        success: true,
        hasUserBody: false,
        mode: "AI 글 생성"
      };
    }

  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 영어 콘텐츠 SEO 최적화 테스트
 */
function testEnglishBodySEO() {
  Logger.log("=== 영어 Body SEO 최적화 테스트 시작 ===");

  try {
    const testTitle = "My Favorite Programming Languages";
    const testBody = `
      <p>Hello everyone! Today I want to share my favorite programming languages.</p>

      <h2>Python</h2>
      <p>Python is easy to learn and very powerful for data science.</p>

      <h2>JavaScript</h2>
      <p>JavaScript is essential for web development.</p>

      <h2>Java</h2>
      <p>Java is great for enterprise applications.</p>

      <p>What are your favorite programming languages?</p>
    `;
    const testLanguage = "EN";

    Logger.log(`📝 영어 테스트 입력:`);
    Logger.log(`  - 제목: ${testTitle}`);
    Logger.log(`  - 본문 길이: ${testBody.length}자`);
    Logger.log(`  - 언어: ${testLanguage}`);

    const result = optimizeSEOForUserContent(testTitle, testBody, testLanguage);

    if (result) {
      Logger.log(`✅ 영어 SEO 최적화 성공!`);
      Logger.log(`🎯 최적화된 제목: ${result.optimizedTitle}`);
      Logger.log(`📋 SEO 설명: ${result.seoDescription}`);
      Logger.log(`🏷️ 카테고리: ${result.categories.join(', ')}`);
      Logger.log(`🔖 태그: ${result.tags.join(', ')}`);

      return {
        success: true,
        result: result
      };
    } else {
      Logger.log(`❌ 영어 SEO 최적화 실패`);
      return { success: false };
    }

  } catch (error) {
    Logger.log(`❌ 영어 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 통합 Body 기능 테스트
 */
function testBodyFeatureIntegration() {
  Logger.log("🧪 === Body 컬럼 기능 통합 테스트 시작 ===");

  const results = {
    koreanSEO: null,
    englishSEO: null,
    bodyProcessing: null
  };

  try {
    // 1. 한국어 SEO 최적화 테스트
    Logger.log("1️⃣ 한국어 SEO 최적화 테스트...");
    results.koreanSEO = testUserBodySEOOptimization();

    // 2. 영어 SEO 최적화 테스트
    Logger.log("2️⃣ 영어 SEO 최적화 테스트...");
    results.englishSEO = testEnglishBodySEO();

    // 3. Body 컬럼 처리 테스트
    Logger.log("3️⃣ Body 컬럼 처리 로직 테스트...");
    results.bodyProcessing = testBodyColumnProcessing();

    // 결과 요약
    Logger.log("📊 === 테스트 결과 요약 ===");
    Logger.log(`한국어 SEO: ${results.koreanSEO.success ? '✅ 성공' : '❌ 실패'}`);
    Logger.log(`영어 SEO: ${results.englishSEO.success ? '✅ 성공' : '❌ 실패'}`);
    Logger.log(`Body 처리: ${results.bodyProcessing.success ? '✅ 성공' : '❌ 실패'}`);

    const allSuccess = results.koreanSEO.success && results.englishSEO.success && results.bodyProcessing.success;

    if (allSuccess) {
      Logger.log("🎉 모든 테스트 통과! Body 컬럼 기능이 정상 작동합니다.");
    } else {
      Logger.log("⚠️ 일부 테스트 실패. 문제를 확인해주세요.");
    }

    return {
      success: allSuccess,
      results: results
    };

  } catch (error) {
    Logger.log(`❌ 통합 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 빠른 Body 기능 테스트 (핵심만)
 */
function quickTestBodyFeature() {
  Logger.log("⚡ === 빠른 Body 기능 테스트 ===");

  try {
    // 간단한 한국어 테스트
    const result = optimizeSEOForUserContent(
      "테스트 제목",
      "<p>테스트 본문입니다.</p>",
      "KO"
    );

    if (result && result.optimizedTitle) {
      Logger.log("✅ Body 컬럼 SEO 최적화 기능 정상 작동");
      Logger.log(`최적화된 제목: ${result.optimizedTitle}`);
      return { success: true };
    } else {
      Logger.log("❌ Body 컬럼 SEO 최적화 기능 실패");
      return { success: false };
    }

  } catch (error) {
    Logger.log(`❌ 빠른 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}