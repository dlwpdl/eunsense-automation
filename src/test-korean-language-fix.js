/**
 * 수정된 한국어 언어 감지 로직 테스트
 * 이 파일은 KR, KO 모두 한국어로 처리되는지 확인합니다
 */

function testKoreanLanguageDetection() {
  Logger.log("=== 수정된 한국어 언어 감지 테스트 ===");
  
  // 다양한 한국어 언어 코드 테스트
  const koreanTestCases = [
    { input: "KR", topic: "2025년 최고의 스마트폰" },
    { input: "KO", topic: "AI 기술 동향" },
    { input: "kr", topic: "블록체인 투자 가이드" },
    { input: "ko", topic: "건강한 다이어트 방법" },
    { input: "한국어", topic: "디지털 마케팅 전략" }
  ];
  
  koreanTestCases.forEach((testCase, index) => {
    Logger.log(`\n🧪 한국어 테스트 ${index + 1}: Language="${testCase.input}", Topic="${testCase.topic}"`);
    
    try {
      // generateHtmlWithLanguage 함수 테스트
      const result = generateHtmlWithLanguage(testCase.topic, testCase.input, []);
      
      if (result && result.title && result.html) {
        Logger.log(`✅ 글 생성 성공`);
        Logger.log(`  - 제목: ${result.title}`);
        
        // 한국어 콘텐츠 확인
        const titleHasKorean = /[가-힣]/.test(result.title);
        const htmlHasKorean = /[가-힣]/.test(result.html);
        const titleHasEnglish = /[a-zA-Z]{3,}/.test(result.title.replace(/HTML?|CSS|JavaScript|AI|API|SEO/g, ''));
        
        Logger.log(`  - 제목 한국어 포함: ${titleHasKorean ? '✅ YES' : '❌ NO'}`);
        Logger.log(`  - 본문 한국어 포함: ${htmlHasKorean ? '✅ YES' : '❌ NO'}`);
        Logger.log(`  - 제목에 불필요한 영어: ${titleHasEnglish ? '⚠️ YES (문제!)' : '✅ NO'}`);
        
        // 카테고리와 태그도 확인
        if (result.categories && Array.isArray(result.categories)) {
          const categoriesKorean = result.categories.every(cat => /[가-힣]/.test(cat));
          Logger.log(`  - 카테고리 한국어: ${categoriesKorean ? '✅ YES' : '❌ NO'} (${result.categories.join(', ')})`);
        }
        
        if (result.tags && Array.isArray(result.tags)) {
          const tagsKorean = result.tags.some(tag => /[가-힣]/.test(tag));
          Logger.log(`  - 태그 한국어 포함: ${tagsKorean ? '✅ YES' : '❌ NO'} (${result.tags.slice(0, 3).join(', ')}...)`);
        }
        
      } else {
        Logger.log(`❌ 글 생성 실패`);
      }
      
    } catch (error) {
      Logger.log(`❌ 오류: ${error.message}`);
    }
  });
  
  Logger.log("\n=== SEO 메타데이터 한국어 테스트 ===");
  
  // SEO 메타데이터도 테스트
  koreanTestCases.forEach((testCase, index) => {
    Logger.log(`\n🔍 SEO 테스트 ${index + 1}: Language="${testCase.input}"`);
    
    try {
      const metadata = generateSEOMetadata(testCase.topic, testCase.input);
      
      if (metadata && metadata.optimizedTitle) {
        Logger.log(`✅ SEO 메타데이터 생성 성공`);
        Logger.log(`  - 최적화된 제목: ${metadata.optimizedTitle}`);
        Logger.log(`  - 카테고리: ${metadata.category}`);
        Logger.log(`  - 태그: ${metadata.tags.join(', ')}`);
        
        // 한국어 콘텐츠 확인
        const titleHasKorean = /[가-힣]/.test(metadata.optimizedTitle);
        const categoryHasKorean = /[가-힣]/.test(metadata.category);
        const tagsHaveKorean = metadata.tags.some(tag => /[가-힣]/.test(tag));
        
        Logger.log(`  - 제목 한국어: ${titleHasKorean ? '✅ YES' : '❌ NO'}`);
        Logger.log(`  - 카테고리 한국어: ${categoryHasKorean ? '✅ YES' : '❌ NO'}`);
        Logger.log(`  - 태그 한국어 포함: ${tagsHaveKorean ? '✅ YES' : '❌ NO'}`);
        
      } else {
        Logger.log(`❌ SEO 메타데이터 생성 실패`);
      }
      
    } catch (error) {
      Logger.log(`❌ SEO 오류: ${error.message}`);
    }
  });
}

// 영어 테스트도 추가 (대조군)
function testEnglishLanguageStillWorks() {
  Logger.log("\n=== 영어 언어 처리 확인 (대조군) ===");
  
  const englishTestCases = [
    { input: "EN", topic: "Best Smartphones of 2025" },
    { input: "en", topic: "AI Technology Trends" },
    { input: "English", topic: "Digital Marketing Strategy" }
  ];
  
  englishTestCases.forEach((testCase, index) => {
    Logger.log(`\n🧪 영어 테스트 ${index + 1}: Language="${testCase.input}", Topic="${testCase.topic}"`);
    
    try {
      const result = generateHtmlWithLanguage(testCase.topic, testCase.input, []);
      
      if (result && result.title && result.html) {
        Logger.log(`✅ 영어 글 생성 성공`);
        Logger.log(`  - 제목: ${result.title}`);
        
        // 영어 콘텐츠 확인
        const titleHasEnglish = /[a-zA-Z]{3,}/.test(result.title);
        const htmlHasEnglish = /[a-zA-Z]{10,}/.test(result.html);
        const titleHasKorean = /[가-힣]/.test(result.title);
        
        Logger.log(`  - 제목 영어 포함: ${titleHasEnglish ? '✅ YES' : '❌ NO'}`);
        Logger.log(`  - 본문 영어 포함: ${htmlHasEnglish ? '✅ YES' : '❌ NO'}`);
        Logger.log(`  - 제목에 한국어: ${titleHasKorean ? '⚠️ YES (의외!)' : '✅ NO'}`);
        
      } else {
        Logger.log(`❌ 영어 글 생성 실패`);
      }
      
    } catch (error) {
      Logger.log(`❌ 영어 테스트 오류: ${error.message}`);
    }
  });
}

// 전체 테스트 실행
function runFullLanguageDetectionTest() {
  Logger.log("🚀 한국어 언어 감지 수정 사항 전체 테스트 시작");
  
  try {
    testKoreanLanguageDetection();
    testEnglishLanguageStillWorks();
    
    Logger.log("\n🎉 전체 테스트 완료!");
    Logger.log("이제 KR, KO 모두 한국어로 처리되어야 합니다.");
    
  } catch (error) {
    Logger.log(`❌ 전체 테스트 실패: ${error.message}`);
  }
}