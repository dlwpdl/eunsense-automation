/**
 * 강제 한국어 SEO 최적화 테스트
 * 영어 토픽이라도 Language가 KO/KR이면 한국어로 번역해서 SEO 최적화하는지 테스트
 */

function testKoreanSEOForceTranslation() {
  Logger.log("=== 강제 한국어 SEO 번역 테스트 ===");
  
  // 영어 토픽들을 한국어로 강제 번역하는 테스트
  const testCases = [
    {
      topic: "Best AI Tools for Content Creation in 2025",
      language: "KO",
      expectedContainsKorean: true,
      description: "영어 토픽 → 한국어 Language → 한국어 제목으로 변환"
    },
    {
      topic: "Top 10 Smartphones Review and Comparison",
      language: "KR", 
      expectedContainsKorean: true,
      description: "영어 토픽 → KR Language → 한국어 제목으로 변환"
    },
    {
      topic: "Machine Learning Tutorial for Beginners",
      language: "kr",
      expectedContainsKorean: true,
      description: "영어 토픽 → 소문자 kr Language → 한국어 제목으로 변환"
    },
    {
      topic: "Best Cryptocurrency Investment Strategies",
      language: "EN",
      expectedContainsKorean: false,
      description: "영어 토픽 → 영어 Language → 영어 제목 유지"
    },
    {
      topic: "이미 한국어 토픽입니다",
      language: "KO",
      expectedContainsKorean: true,
      description: "한국어 토픽 → 한국어 Language → 한국어 제목 유지"
    }
  ];
  
  testCases.forEach((testCase, index) => {
    Logger.log(`\n🧪 테스트 ${index + 1}: ${testCase.description}`);
    Logger.log(`   토픽: "${testCase.topic}"`);
    Logger.log(`   언어: ${testCase.language}`);
    
    try {
      const metadata = generateSEOMetadata(testCase.topic, testCase.language);
      
      if (metadata) {
        const hasKorean = /[가-힣]/.test(metadata.optimizedTitle);
        const isCorrect = hasKorean === testCase.expectedContainsKorean;
        
        Logger.log(`✅ SEO 메타데이터 생성 성공:`);
        Logger.log(`   최적화된 제목: "${metadata.optimizedTitle}"`);
        Logger.log(`   카테고리: ${metadata.category}`);
        Logger.log(`   태그: ${metadata.tags.slice(0, 3).join(', ')}...`);
        Logger.log(`   한국어 포함: ${hasKorean ? 'YES' : 'NO'} (예상: ${testCase.expectedContainsKorean ? 'YES' : 'NO'}) ${isCorrect ? '✅' : '❌'}`);
        
        if (!isCorrect) {
          Logger.log(`   ❌ 언어 처리 실패: Language가 ${testCase.language}인데 ${hasKorean ? '한국어' : '영어'}로 처리됨`);
        }
        
        // 2025년 포함 여부 확인
        const has2025 = metadata.optimizedTitle.includes('2025');
        Logger.log(`   2025년 포함: ${has2025 ? 'YES ✅' : 'NO ⚠️'}`);
        
      } else {
        Logger.log(`❌ 메타데이터 생성 실패`);
      }
      
    } catch (error) {
      Logger.log(`❌ 테스트 실패: ${error.message}`);
    }
  });
}

// 특정 영어 토픽을 한국어로 강제 변환하는 상세 테스트
function testSpecificEnglishToKorean() {
  Logger.log("\n=== 특정 영어 토픽 → 한국어 변환 상세 테스트 ===");
  
  const englishTopic = "Ultimate Guide to Digital Marketing Strategies in 2025";
  const koreanLanguage = "KO";
  
  Logger.log(`🎯 테스트 토픽: "${englishTopic}"`);
  Logger.log(`🌐 Language 설정: ${koreanLanguage}`);
  
  try {
    Logger.log("\n📋 generateSEOMetadata 호출...");
    const metadata = generateSEOMetadata(englishTopic, koreanLanguage);
    
    if (metadata) {
      Logger.log("\n✅ 생성된 한국어 SEO 메타데이터:");
      Logger.log(`📝 최적화된 제목: "${metadata.optimizedTitle}"`);
      Logger.log(`📂 카테고리: ${metadata.category}`);
      Logger.log(`🏷️ 태그: ${metadata.tags.join(', ')}`);
      Logger.log(`🎯 클러스터: ${metadata.cluster}`);
      Logger.log(`💡 의도: ${metadata.intent}`);
      Logger.log(`🔍 키워드: ${metadata.sourceKeywords.join(', ')}`);
      
      // 검증
      const hasKorean = /[가-힣]/.test(metadata.optimizedTitle);
      const hasEnglish = /[a-zA-Z]{2,}/.test(metadata.optimizedTitle);
      const has2025 = metadata.optimizedTitle.includes('2025');
      
      Logger.log("\n🔍 품질 검증:");
      Logger.log(`   한국어 포함: ${hasKorean ? '✅ YES' : '❌ NO'}`);
      Logger.log(`   영어 단어 포함: ${hasEnglish ? '⚠️ YES (한국어 번역 불완전)' : '✅ NO (완전 한국어)'}`);
      Logger.log(`   2025년 포함: ${has2025 ? '✅ YES' : '⚠️ NO'}`);
      Logger.log(`   제목 길이: ${metadata.optimizedTitle.length}자 ${metadata.optimizedTitle.length <= 60 ? '✅' : '❌ (60자 초과)'}`);
      
      if (hasKorean && !hasEnglish) {
        Logger.log("\n🎉 완벽한 한국어 번역 성공!");
      } else if (hasKorean && hasEnglish) {
        Logger.log("\n⚠️ 부분적 번역: 한영 혼용 제목");
      } else {
        Logger.log("\n❌ 번역 실패: 여전히 영어 제목");
      }
      
    } else {
      Logger.log("❌ 메타데이터 생성 실패");
    }
    
  } catch (error) {
    Logger.log(`❌ 상세 테스트 실패: ${error.message}`);
    Logger.log(`스택: ${error.stack}`);
  }
}

// 실제 시트에서 영어 토픽 + 한국어 Language 조합 찾아서 테스트
function testRealSheetEnglishToKorean() {
  Logger.log("\n=== 실제 시트에서 영어→한국어 변환 테스트 ===");
  
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
    
    let testCandidates = [];
    
    // 영어 토픽 + 한국어 Language 조합 찾기
    for (let i = 1; i < Math.min(allData.length, 20); i++) {
      const rowData = createRowObject(headers, allData[i]);
      const topic = rowData.Topic || "";
      const language = rowData.Language || "";
      const status = rowData.Status || "";
      
      if (topic.trim() && language.trim() && !status.trim()) {
        const topicHasKorean = /[가-힣]/.test(topic);
        const isKoreanLang = language && (language.toUpperCase() === "KO" || language.toUpperCase() === "KR" || language.includes("한국"));
        
        // 영어 토픽인데 Language가 한국어인 경우
        if (!topicHasKorean && isKoreanLang) {
          testCandidates.push({
            row: i + 1,
            topic: topic,
            language: language,
            description: "영어 토픽 + 한국어 Language"
          });
        }
      }
    }
    
    Logger.log(`🔍 발견된 테스트 후보: ${testCandidates.length}개`);
    
    if (testCandidates.length > 0) {
      const candidate = testCandidates[0];
      Logger.log(`\n📋 테스트 대상: 행 ${candidate.row}`);
      Logger.log(`   토픽: "${candidate.topic}"`);
      Logger.log(`   Language: ${candidate.language}`);
      Logger.log(`   설명: ${candidate.description}`);
      
      const metadata = generateSEOMetadata(candidate.topic, candidate.language);
      
      if (metadata) {
        const hasKorean = /[가-힣]/.test(metadata.optimizedTitle);
        Logger.log(`\n✅ 변환 결과: "${metadata.optimizedTitle}"`);
        Logger.log(`   한국어 변환: ${hasKorean ? '✅ 성공' : '❌ 실패'}`);
      }
      
    } else {
      Logger.log("⚠️ 영어 토픽 + 한국어 Language 조합을 찾을 수 없습니다.");
      Logger.log("테스트하려면 시트에 영어로 된 Topic과 KO/KR Language를 설정하세요.");
    }
    
  } catch (error) {
    Logger.log(`❌ 실제 시트 테스트 실패: ${error.message}`);
  }
}