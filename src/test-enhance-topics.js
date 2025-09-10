/**
 * enhanceExistingTopics 함수 테스트 스크립트
 * Google Apps Script 콘솔에서 실행하여 언어 감지 로직을 확인
 */

function testEnhanceExistingTopics() {
  Logger.log("=== enhanceExistingTopics 언어 감지 테스트 ===");
  
  try {
    // enhanceExistingTopics 함수 실행
    enhanceExistingTopics();
    
    Logger.log("✅ enhanceExistingTopics 함수 실행 완료");
    Logger.log("📋 Google Apps Script 로그를 확인하여 다음 사항을 검증하세요:");
    Logger.log("  1. Language 컬럼에서 언어가 정확히 감지되었는지");
    Logger.log("  2. EN/KO에 따라 적절한 SEO 프롬프트가 사용되었는지");
    Logger.log("  3. 최적화된 제목에 2025년이 포함되었는지");
    Logger.log("  4. 한국어/영어에 맞는 SEO 메타데이터가 생성되었는지");
    
  } catch (error) {
    Logger.log(`❌ 테스트 실패: ${error.message}`);
    Logger.log(`스택 추적: ${error.stack}`);
  }
}

// 개별 언어별 SEO 프롬프트 테스트
function testLanguagePrompts() {
  Logger.log("=== 언어별 SEO 프롬프트 테스트 ===");
  
  const testTopics = [
    { topic: "Best AI Tools for Content Creation", language: "EN" },
    { topic: "2025년 최고의 AI 콘텐츠 제작 도구", language: "KO" }
  ];
  
  testTopics.forEach(test => {
    Logger.log(`\n🧪 테스트: ${test.topic} (${test.language})`);
    
    try {
      const metadata = generateSEOMetadata(test.topic, test.language);
      
      if (metadata) {
        Logger.log(`✅ SEO 메타데이터 생성 성공:`);
        Logger.log(`  - 최적화된 제목: ${metadata.optimizedTitle}`);
        Logger.log(`  - 카테고리: ${metadata.category}`);
        Logger.log(`  - 태그: ${metadata.tags.join(', ')}`);
        Logger.log(`  - 클러스터: ${metadata.cluster}`);
        Logger.log(`  - 의도: ${metadata.intent}`);
        Logger.log(`  - 키워드: ${metadata.sourceKeywords.join(', ')}`);
      } else {
        Logger.log(`❌ 메타데이터 생성 실패`);
      }
    } catch (error) {
      Logger.log(`❌ 오류: ${error.message}`);
    }
  });
}