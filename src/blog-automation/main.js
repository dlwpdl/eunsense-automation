/**
 * 블로그 자동화 시스템 - 메인 오케스트레이터
 * Google Trends → AI 글 생성 → WordPress 자동 발행
 */

// ==============================================================================
// AI 모델 빠른 전환 함수들
// ==============================================================================

/**
 * Claude 4.0 Sonnet으로 전환
 */
function switchToClaude4() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("AI_PROVIDER", "anthropic");
  props.setProperty("AI_MODEL", "claude-4-sonnet-20250514");
  
  const claudeKey = props.getProperty("CLAUDE_API_KEY");
  Logger.log("✅ AI 모델을 Claude 4.0 Sonnet으로 변경했습니다.");
  Logger.log(`🔑 Claude API Key: ${claudeKey ? '설정됨 ✅' : '❌ CLAUDE_API_KEY를 Script Properties에 설정하세요'}`);
}

/**
 * GPT-4o로 전환
 */
function switchToGPT4o() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("AI_PROVIDER", "openai");
  props.setProperty("AI_MODEL", "gpt-4o");
  
  const openaiKey = props.getProperty("OPENAI_API_KEY");
  Logger.log("✅ AI 모델을 GPT-4o로 변경했습니다.");
  Logger.log(`🔑 OpenAI API Key: ${openaiKey ? '설정됨 ✅' : '❌ OPENAI_API_KEY를 Script Properties에 설정하세요'}`);
}

/**
 * GPT-4 Turbo로 전환 (비용 절약)
 */
function switchToGPT4Turbo() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("AI_PROVIDER", "openai");
  props.setProperty("AI_MODEL", "gpt-4-turbo");
  
  const openaiKey = props.getProperty("OPENAI_API_KEY");
  Logger.log("✅ AI 모델을 GPT-4 Turbo로 변경했습니다 (비용 효율적).");
  Logger.log(`🔑 OpenAI API Key: ${openaiKey ? '설정됨 ✅' : '❌ OPENAI_API_KEY를 Script Properties에 설정하세요'}`);
}

/**
 * Gemini Pro로 전환 (무료 할당량)
 */
function switchToGemini() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("AI_PROVIDER", "google");
  props.setProperty("AI_MODEL", "gemini-pro");
  
  const geminiKey = props.getProperty("GEMINI_API_KEY");
  Logger.log("✅ AI 모델을 Gemini Pro로 변경했습니다 (무료 할당량 이용 가능).");
  Logger.log(`🔑 Gemini API Key: ${geminiKey ? '설정됨 ✅' : '❌ GEMINI_API_KEY를 Script Properties에 설정하세요'}`);
}

/**
 * 현재 AI 설정 확인
 */
function checkCurrentAI() {
  const config = getConfig();
  const currentKey = getCurrentAIKey();
  
  Logger.log("🤖 현재 AI 설정:");
  Logger.log(`  Provider: ${config.AI_PROVIDER}`);
  Logger.log(`  Model: ${config.AI_MODEL}`);
  Logger.log(`  현재 사용 중인 API Key: ${currentKey ? '설정됨 ✅' : '❌ 없음'}`);
  Logger.log("");
  Logger.log("🔑 각 서비스별 API 키 상태:");
  Logger.log(`  OpenAI API Key: ${config.OPENAI_API_KEY ? '설정됨 ✅' : '❌ 없음'}`);
  Logger.log(`  Claude API Key: ${config.CLAUDE_API_KEY ? '설정됨 ✅' : '❌ 없음'}`);
  Logger.log(`  Gemini API Key: ${config.GEMINI_API_KEY ? '설정됨 ✅' : '❌ 없음'}`);
}

/**
 * API 키 설정 도우미 함수들
 */
function setOpenAIKey() {
  Logger.log("📝 OpenAI API 키 설정 방법:");
  Logger.log("1. Google Apps Script에서 Extensions → Properties 클릭");
  Logger.log("2. Script properties 탭 선택");
  Logger.log("3. 다음 키 추가:");
  Logger.log("   Property: OPENAI_API_KEY");
  Logger.log("   Value: sk-proj-....... (OpenAI API 키)");
  Logger.log("");
  Logger.log("🔗 OpenAI API 키 발급: https://platform.openai.com/api-keys");
}

function setClaudeKey() {
  Logger.log("📝 Claude API 키 설정 방법:");
  Logger.log("1. Google Apps Script에서 Extensions → Properties 클릭");
  Logger.log("2. Script properties 탭 선택");
  Logger.log("3. 다음 키 추가:");
  Logger.log("   Property: CLAUDE_API_KEY");
  Logger.log("   Value: sk-ant-api....... (Claude API 키)");
  Logger.log("");
  Logger.log("🔗 Claude API 키 발급: https://console.anthropic.com/");
}

function setGeminiKey() {
  Logger.log("📝 Gemini API 키 설정 방법:");
  Logger.log("1. Google Apps Script에서 Extensions → Properties 클릭");
  Logger.log("2. Script properties 탭 선택");
  Logger.log("3. 다음 키 추가:");
  Logger.log("   Property: GEMINI_API_KEY");
  Logger.log("   Value: AI....... (Google AI Studio API 키)");
  Logger.log("");
  Logger.log("🔗 Gemini API 키 발급: https://aistudio.google.com/app/apikey");
}

/**
 * AI 모델 성능 비교 정보
 */
function showAIComparison() {
  Logger.log("🤖 AI 모델 비교:");
  Logger.log("");
  Logger.log("🏆 Claude 4.0 Sonnet:");
  Logger.log("  • 글 품질: 최고");
  Logger.log("  • 프롬프트 준수: 뛰어남");
  Logger.log("  • 비용: 중간");
  Logger.log("  • 속도: 빠름");
  Logger.log("");
  Logger.log("🚀 GPT-4o:");
  Logger.log("  • 글 품질: 뛰어남");
  Logger.log("  • 프롬프트 준수: 좋음");
  Logger.log("  • 비용: 높음");
  Logger.log("  • 속도: 매우 빠름");
  Logger.log("");
  Logger.log("💰 GPT-4 Turbo:");
  Logger.log("  • 글 품질: 뛰어남");
  Logger.log("  • 프롬프트 준수: 좋음");
  Logger.log("  • 비용: 중간");
  Logger.log("  • 속도: 빠름");
  Logger.log("");
  Logger.log("🆓 Gemini Pro:");
  Logger.log("  • 글 품질: 좋음");
  Logger.log("  • 프롬프트 준수: 보통");
  Logger.log("  • 비용: 무료 할당량");
  Logger.log("  • 속도: 빠름");
  Logger.log("");
  Logger.log("💡 추천: Claude 4.0 > GPT-4 Turbo > GPT-4o > Gemini Pro");
}

// ==============================================================================
// 메인 워크플로우 함수
// ==============================================================================

/**
 * 토픽 수집 및 시트 저장의 메인 함수
 */
function collectTrends() {
  const config = validateConfig();
  
  Logger.log("=== 씨앗 키워드로 주제 발굴 시작 ===");
  const strategicTopics = discoverNicheTopics();
  Logger.log(`AI가 분석한 전략적 주제 ${strategicTopics.length}개 수집 완료`);
  
  if (strategicTopics.length === 0) {
    Logger.log("수집된 신규 주제가 없습니다.");
    return;
  }
  
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  
  const sheet = getOrCreateSheet(ss, config.SHEET_NAME);
  saveTopicsToSheet(sheet, strategicTopics);
  
  Logger.log("✅ 트렌드 수집 및 전략 분석, 시트 저장 완료");
}

/**
 * 포스트 발행 함수 (제한적 실행)
 */
function publishPosts() {
  const config = validateConfig();
  
  Logger.log("=== 미발행 주제로 포스트 발행 시작 ===");
  
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다. SHEET_ID를 설정했는지 확인하세요.");
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${config.SHEET_NAME}" 를 찾을 수 없습니다.`);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  Logger.log(`시트 데이터 행 수: ${data.length}`);
  Logger.log(`헤더: ${JSON.stringify(headers)}`);
  
  if (data.length <= 1) {
    Logger.log("주제가 없습니다.");
    return;
  }

  let postedCount = 0;
  let checkedCount = 0;

  for (let r = 1; r < data.length; r++) {
    if (postedCount >= config.DAILY_LIMIT) break;

    const rowData = createRowObject(headers, data[r]);
    checkedCount++;
    Logger.log(`행 ${r + 1} 체크: 토픽="${rowData.Topic}", 상태="${rowData.Status}"`);

    // 공백이 있는 헤더 이름들도 체크 
    const topic = rowData.Topic || rowData["Topic "] || rowData["Topic"];
    const status = rowData.Status || rowData["Status "] || rowData["Status"];
    
    if (!topic || (status && status.startsWith("posted"))) {
      continue;
    }

    Logger.log(`처리 중인 주제: ${topic}`);

    try {
      const targetLanguage = rowData.Language || "EN";
      const relatedTopics = (rowData.SourceKeywords || "").split(',').map(t => t.trim()).filter(Boolean);
      
      const post = generateHtmlWithLanguage(topic, targetLanguage, relatedTopics);

      const cleaned = sanitizeHtmlBeforePublish(post.html || "", post.title || topic);
      const seoData = buildSEO(cleaned, post.title || topic, rowData.ProductNames);
      let htmlWithImages = injectSectionImages(cleaned, post.title || topic, post.subtopics || []);

      const categoryIds = [ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, rowData.Category || "Trends")];
      const allTags = [...new Set([...seoData.keywords.slice(0, 8), ...(post.tags || [])])];
      const tagIds = ensureTags(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, allTags.join(","));
      const postFormat = validatePostFormat(rowData.Format || determinePostFormat(rowData.Category, rowData.ProductNames));

      const postId = wpCreatePost({
        baseUrl: config.WP_BASE,
        user: config.WP_USER,
        appPass: config.WP_APP_PASS,
        title: seoData.seoTitle || post.title || rowData.Topic,
        content: htmlWithImages,
        excerpt: seoData.seoDesc || post.seoDescription || "",
        slug: seoData.slug,
        status: "publish",
        categories: categoryIds,
        tags: tagIds,
        format: postFormat
      });

      const postUrl = getPostUrl(config.WP_BASE, postId);
      updateSheetRow(sheet, r + 1, { Status: `posted (SEO: ${seoData.seoScore.grade})`, PostedURL: postUrl, PostedAt: new Date() }, headers);
      
      Logger.log(`✅ 발행 완료: ${topic} → ${postUrl}`);
      postedCount++;
      
      if (config.POST_INTERVAL_MS > 0 && postedCount < config.DAILY_LIMIT) {
        Utilities.sleep(config.POST_INTERVAL_MS);
      }
      
    } catch (error) {
      Logger.log(`글 발행 실패 (${topic}): ${error.message}`);
      updateSheetRow(sheet, r + 1, { Status: `error: ${error.message}` }, headers);
      continue;
    }
  }

  Logger.log(`=== 실행 요약 ===`);
  Logger.log(`총 데이터 행 수: ${data.length - 1}개 (헤더 제외)`);
  Logger.log(`검토한 행 수: ${checkedCount}개`);
  Logger.log(`발행 완료: ${postedCount}건`);
  Logger.log(`일일 제한: ${config.DAILY_LIMIT}건`);
}

// ==============================================================================
// 시트 관리 함수
// ==============================================================================

/**
 * 시트 가져오기 또는 생성 (확장된 헤더 포함)
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  const requiredHeaders = [
    "Topic", "Status", "PostedURL", "PostedAt", "Category", 
    "TagsCsv", "AffiliateLinks", "ProductNames", "Language", "Format",
    "Cluster", "Intent", "SourceKeywords", "OpportunityScore"
  ];
  
  if (!sheet) {
    // 새 시트 생성
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    Logger.log(`✅ 새 시트 '${sheetName}' 생성 및 헤더 설정 완료.`);
  } else {
    // 기존 시트의 헤더 확인 및 업데이트
    ensureHeaders(sheet, requiredHeaders);
  }
  return sheet;
}

/**
 * 시트 헤더 확인 및 정리
 */
function ensureHeaders(sheet, requiredHeaders) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    // 빈 시트인 경우 새 헤더 생성
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    Logger.log(`✅ 새 시트에 헤더 생성 완료`);
    return;
  }
  
  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log(`🔍 기존 헤더 확인: ${existingHeaders.join(', ')}`);
  
  // 헤더 정리 (공백 제거, 중복 제거)
  const cleanExistingHeaders = existingHeaders
    .map(h => (h || '').toString().trim())
    .filter(h => h.length > 0);
  
  // 중복 헤더 제거
  const uniqueExisting = [...new Set(cleanExistingHeaders)];
  
  // 필요한 헤더 중 누락된 것만 찾기
  const missingHeaders = requiredHeaders.filter(header => 
    !uniqueExisting.some(existing => existing.toLowerCase() === header.toLowerCase())
  );
  
  if (missingHeaders.length > 0) {
    Logger.log(`⚠️ 누락된 헤더: ${missingHeaders.join(', ')}`);
    
    // 기존 고유 헤더 + 누락된 헤더 조합
    const finalHeaders = [...uniqueExisting, ...missingHeaders];
    
    // 전체 헤더 행 재작성
    sheet.getRange(1, 1, 1, Math.max(lastCol, finalHeaders.length)).clearContent();
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    
    Logger.log(`✅ 헤더 정리 완료: ${finalHeaders.join(', ')}`);
  } else if (uniqueExisting.length < cleanExistingHeaders.length) {
    // 중복 헤더만 있는 경우 정리
    Logger.log(`🧹 중복 헤더 정리 중...`);
    sheet.getRange(1, 1, 1, lastCol).clearContent();
    sheet.getRange(1, 1, 1, uniqueExisting.length).setValues([uniqueExisting]);
    Logger.log(`✅ 중복 헤더 정리 완료: ${uniqueExisting.join(', ')}`);
  } else {
    Logger.log(`✅ 헤더가 올바르게 설정되어 있습니다.`);
  }
}

/**
 * AI가 분석한 새로운 토픽들을 시트에 저장
 */
function saveTopicsToSheet(sheet, topics) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existingData = sheet.getDataRange().getValues();
  const existingTopics = new Set(existingData.slice(1).map(row => row[0]));

  const newTopics = topics.filter(topic => !existingTopics.has(topic.topic));
  
  if (newTopics.length > 0) {
    const newRows = newTopics.map(topic => {
      const row = new Array(headers.length).fill("");
      
      // 안전한 열 인덱스 설정 함수
      const setColumn = (headerName, value) => {
        const index = headers.indexOf(headerName);
        if (index >= 0) {
          row[index] = value;
        } else {
          Logger.log(`⚠️ 헤더 '${headerName}'를 찾을 수 없습니다.`);
        }
      };
      
      setColumn("Topic", topic.topic);
      setColumn("Category", topic.suggested_category || topic.cluster_name || "Trends");
      setColumn("TagsCsv", (topic.keywords || []).slice(0, 5).join(','));
      setColumn("ProductNames", (topic.product_names || []).join(', '));
      setColumn("Language", "EN");
      setColumn("Format", "standard");
      setColumn("Cluster", topic.cluster_name);
      setColumn("Intent", topic.user_intent);
      setColumn("SourceKeywords", (topic.keywords || []).join(', '));
      setColumn("OpportunityScore", topic.opportunity_score);
      
      return row;
    });
    
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    Logger.log(`✅ AI가 분석한 새로운 토픽 ${newTopics.length}개를 시트에 저장했습니다.`);
  } else {
    Logger.log("✅ 새로운 토픽이 없습니다 (기존 토픽과 중복). ");
  }
}

function createRowObject(headers, row) {
  const obj = {};
  headers.forEach((header, i) => {
    // 헤더 이름 정규화 (공백 제거 및 소문자 변환)
    const normalizedKey = header.trim();
    obj[normalizedKey] = row[i];
  });
  return obj;
}

function updateSheetRow(sheet, rowNumber, dataToUpdate, headers) {
  for (const [key, value] of Object.entries(dataToUpdate)) {
    // 헤더 이름 매칭 (공백 문제 해결)
    let colIndex = headers.indexOf(key);
    
    // 공백이 있는 헤더도 체크
    if (colIndex === -1) {
      colIndex = headers.findIndex(header => header.trim() === key.trim());
    }
    
    // 유연한 헤더 매칭 (Status, Status 등)
    if (colIndex === -1 && key === 'Status') {
      colIndex = headers.findIndex(header => header.trim().toLowerCase().startsWith('status'));
    }
    if (colIndex === -1 && key === 'PostedURL') {
      colIndex = headers.findIndex(header => header.trim().toLowerCase().includes('postedurl') || header.trim().toLowerCase().includes('url'));
    }
    if (colIndex === -1 && key === 'PostedAt') {
      colIndex = headers.findIndex(header => header.trim().toLowerCase().includes('postedat') || header.trim().toLowerCase().includes('posted'));
    }
    
    if (colIndex !== -1) {
      try {
        sheet.getRange(rowNumber, colIndex + 1).setValue(value);
        Logger.log(`✅ 시트 업데이트: ${key} → ${value} (열 ${colIndex + 1})`);
      } catch (error) {
        Logger.log(`❌ 시트 업데이트 실패: ${key} → ${error.message}`);
      }
    } else {
      Logger.log(`⚠️ 헤더를 찾을 수 없음: "${key}" (사용 가능한 헤더: ${headers.map(h => `"${h}"`).join(', ')})`);
    }
  }
}

function getLanguageFromSheet(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const languageColIndex = headers.indexOf("Language");
    if (languageColIndex === -1) return "EN";
    const languageData = sheet.getRange(currentRow, languageColIndex + 1).getValue();
    if (!languageData) return "EN";
    const result = languageData.toString().trim().toUpperCase();
    if (result.includes("KO")) return "KO";
    if (result.includes("EN")) return "EN";
    return "EN";
  } catch (e) {
    return "EN";
  }
}

function getProductNames(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const productColIndex = headers.indexOf("ProductNames");
    if (productColIndex === -1) return null;
    return sheet.getRange(currentRow, productColIndex + 1).getValue() || null;
  } catch (e) {
    return null;
  }
}

function getPostFormatFromSheet(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const formatColIndex = headers.indexOf("Format");
    if (formatColIndex === -1) return "standard";
    const formatData = sheet.getRange(currentRow, formatColIndex + 1).getValue();
    return formatData ? formatData.toString().trim().toLowerCase() : "standard";
  } catch (e) {
    return "standard";
  }
}

function determinePostFormat(category, productNames) {
  // WordPress 지원 포맷만 사용
  const validFormats = ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio'];
  
  if (!category) return 'standard';
  const categoryLower = category.toLowerCase();
  
  // 기어/제품 리뷰의 경우 gallery 포맷 사용
  const reviewKeywords = ['gear', 'gadget', 'camera', 'equipment', 'review'];
  if (reviewKeywords.some(k => categoryLower.includes(k)) || productNames) {
    return 'gallery';
  }
  
  // 비디오 관련 주제
  const videoKeywords = ['video', 'tutorial', 'guide', 'demo'];
  if (videoKeywords.some(k => categoryLower.includes(k))) {
    return 'video';
  }
  
  // 뉴스/업데이트
  const statusKeywords = ['news', 'update', 'release', 'announcement'];
  if (statusKeywords.some(k => categoryLower.includes(k))) {
    return 'status';
  }
  
  return 'standard';
}

function validatePostFormat(format) {
  const validFormats = ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio'];
  return validFormats.includes(format) ? format : 'standard';
}

// ==============================================================================
// 콘텐츠 재활용 및 최적화
// ==============================================================================

/**
 * 오래된 콘텐츠를 찾아 AI로 재최적화하는 메인 함수
 */
function reoptimizeOldPosts() {
  const config = validateConfig();
  if (!config.REOPTIMIZE_ENABLED) {
    Logger.log("콘텐츠 재최적화 기능이 비활성화되어 있습니다.");
    return;
  }

  Logger.log("=== 오래된 콘텐츠 재최적화 시작 ===");

  // 1. 재최적화할 오래된 포스트 가져오기
  const olderThanDate = new Date();
  olderThanDate.setDate(olderThanDate.getDate() - config.REOPTIMIZE_POSTS_OLDER_THAN_DAYS);
  const isoDate = olderThanDate.toISOString();

  const params = {
    per_page: config.REOPTIMIZE_DAILY_LIMIT,
    before: isoDate, // 특정 날짜 이전 포스트
    orderby: 'date',
    order: 'asc' // 가장 오래된 순서부터
  };

  // 특정 카테고리가 설정된 경우, 해당 카테고리 ID를 조회하여 파라미터에 추가
  if (config.REOPTIMIZE_TARGET_CATEGORY) {
    try {
      const categoryId = ensureCategory(config.WP_BASE, config.WP_USER, config.WP_APP_PASS, config.REOPTIMIZE_TARGET_CATEGORY);
      if (categoryId) {
        params.categories = categoryId;
        Logger.log(`타겟 카테고리 '${config.REOPTIMIZE_TARGET_CATEGORY}' (ID: ${categoryId})의 글을 검색합니다.`);
      }
    } catch (e) {
      Logger.log(`타겟 카테고리 '${config.REOPTIMIZE_TARGET_CATEGORY}'를 찾지 못했습니다: ${e.message}`);
    }
  }

  const postsToUpdate = wpGetPosts({ ...config, params });

  if (!postsToUpdate || postsToUpdate.length === 0) {
    Logger.log("재최적화할 포스트가 없습니다.");
    return;
  }

  Logger.log(`${postsToUpdate.length}개의 오래된 포스트를 재최적화합니다.`);

  // 2. 각 포스트를 순회하며 AI로 재작성 및 업데이트
  postsToUpdate.forEach(post => {
    try {
      Logger.log(`🔄 포스트 재최적화 중: #${post.id} - ${post.title.rendered}`);
      
      // 2.1 AI에게 재작성 요청
      const reoptimizedData = generateReoptimizedPost(post.title.rendered, post.content.rendered);
      if (!reoptimizedData || !reoptimizedData.newTitle || !reoptimizedData.newHtml) {
        throw new Error("AI가 유효한 재작성 콘텐츠를 생성하지 못했습니다.");
      }

      // 2.2 워드프레스 포스트 업데이트
      const updateData = {
        title: reoptimizedData.newTitle,
        content: reoptimizedData.newHtml,
        // 재최적화되었음을 알리는 메타 필드 또는 태그 추가 (선택사항)
        meta: { _reoptimized_at: new Date().toISOString() }
      };

      wpUpdatePost({ ...config, postId: post.id, data: updateData });

      Logger.log(`✅ 포스트 업데이트 완료: #${post.id} - ${reoptimizedData.newTitle}`);
      
      // API 과부하 방지를 위한 딜레이
      Utilities.sleep(2000);

    } catch (error) {
      Logger.log(`❌ 포스트 #${post.id} 재최적화 실패: ${error.message}`);
    }
  });

  Logger.log("=== 콘텐츠 재최적화 완료 ===");
}

/**
 * 콘텐츠 재활용 자동화 트리거 설정 (매주 일요일 새벽 3시)
 */
function setupReoptimizationTrigger() {
  // 기존 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'reoptimizeOldPosts') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 매주 일요일 새벽 3시에 실행되는 트리거 생성
  ScriptApp.newTrigger('reoptimizeOldPosts')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();

  Logger.log("✅ 콘텐츠 재최적화 트리거 설정 완료 (매주 일요일 새벽 3시 실행).");
}

function getAffiliateLinks(sheet, currentRow = 2) {
  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const affiliateColIndex = headers.indexOf("AffiliateLinks");
    if (affiliateColIndex === -1) return null;
    return sheet.getRange(currentRow, affiliateColIndex + 1).getValue() || null;
  } catch (e) {
    return null;
  }
}

function addAffiliateSection(html, affiliateLinks, category, productNames = null) {
  if (!html || !affiliateLinks) return html;
  const linkData = parseLinksAndProducts(affiliateLinks, productNames);
  if (linkData.length === 0) return html;
  const affiliateSection = generateAffiliateSection(linkData, category);
  const lastParagraph = html.lastIndexOf('</p>');
  if (lastParagraph !== -1) {
    return html.substring(0, lastParagraph + 4) + affiliateSection + html.substring(lastParagraph + 4);
  } else {
    return html + affiliateSection;
  }
}

function parseLinksAndProducts(affiliateLinks, productNames) {
  const links = smartSplit(affiliateLinks);
  let products = productNames ? smartSplit(productNames) : [];
  return links.map((link, i) => ({
    url: link,
    name: products[i] || extractProductName(link) || `Product ${i + 1}`
  }));
}

function smartSplit(text) {
  if (!text) return [];
  const trimmedText = text.trim();
  const separators = [',', '|', ';', '\n'];
  for (const separator of separators) {
    if (trimmedText.includes(separator)) {
      const parts = trimmedText.split(separator).map(part => part.trim()).filter(part => part.length > 0);
      if (parts.length > 1) return parts;
    }
  }
  return [trimmedText];
}

function generateAffiliateSection(linkData, category) {
  // ... (implementation as before)
  return "<div>...</div>"; // Placeholder for brevity
}

function extractProductName(url) {
  // ... (implementation as before)
  return "Product"; // Placeholder for brevity
}

// ==============================================================================
// 자동화 트리거 및 테스트 함수
// ==============================================================================

function setupAutomationTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  ScriptApp.newTrigger('collectTrends').timeBased().everyDays(1).atHour(6).create();
  ScriptApp.newTrigger('publishPosts').timeBased().everyDays(1).atHour(9).create();
  
  Logger.log("✅ 자동화 트리거 설정 완료");
}

function testFullSystem() {
  Logger.log("=== 전체 시스템 테스트 시작 ===");
  try {
    Logger.log("1️⃣ 설정 확인 중...");
    validateConfig();
    Logger.log("2️⃣ 토픽 발굴 테스트 중...");
    const topics = discoverNicheTopics();
    if (topics.length === 0) throw new Error("토픽 발굴 실패");
    Logger.log(`✅ ${topics.length}개 전략적 주제 발굴 완료`);
    Logger.log("3️⃣ AI 글 생성 테스트 중...");
    const testPost = generateHtmlWithLanguage(topics[0].topic, "EN", topics[0].keywords);
    if (!testPost.html) throw new Error("AI 글 생성 실패");
    Logger.log(`✅ AI 글 생성 완료: ${testPost.title}`);
    Logger.log("4️⃣ WordPress 연결 테스트 중...");
    const connectionTest = testWordPressConnection(getConfig());
    if (!connectionTest) throw new Error("WordPress 연결 실패");
    Logger.log("🎉 전체 시스템 테스트 완료!");
  } catch (error) {
    Logger.log(`❌ 시스템 테스트 실패: ${error.toString()}`);
    throw error;
  }
}

/**
 * 토픽 마이닝만 테스트하는 함수
 */
/**
 * 씨앗 키워드 관리 함수들
 */
function setSeedKeywords(keywords) {
  const props = PropertiesService.getScriptProperties();
  const keywordString = Array.isArray(keywords) ? keywords.join(',') : keywords;
  props.setProperty('BLOG_NICHE_KEYWORDS', keywordString);
  Logger.log(`✅ 씨앗 키워드 설정 완료: ${keywordString}`);
}

function getSeedKeywords() {
  const config = getConfig();
  return config.BLOG_NICHE_KEYWORDS;
}

function addSeedKeywords(newKeywords) {
  const existing = getSeedKeywords();
  const newKeywordArray = Array.isArray(newKeywords) ? newKeywords : [newKeywords];
  const combined = [...existing, ...newKeywordArray];
  const unique = [...new Set(combined)];
  setSeedKeywords(unique);
  Logger.log(`✅ 새 키워드 추가: ${newKeywordArray.join(', ')}`);
  return unique;
}

function removeSeedKeywords(keywordsToRemove) {
  const existing = getSeedKeywords();
  const removeArray = Array.isArray(keywordsToRemove) ? keywordsToRemove : [keywordsToRemove];
  const filtered = existing.filter(keyword => !removeArray.includes(keyword));
  setSeedKeywords(filtered);
  Logger.log(`✅ 키워드 제거: ${removeArray.join(', ')}`);
  return filtered;
}

function listSeedKeywords() {
  const keywords = getSeedKeywords();
  Logger.log(`현재 씨앗 키워드 (${keywords.length}개):`);
  keywords.forEach((keyword, i) => {
    Logger.log(`  ${i + 1}. ${keyword}`);
  });
  return keywords;
}

/**
 * 키워드 세트 빠른 전환 (미리 정의된 세트들)
 */
function switchToKeywordSet(setName) {
  const keywordSets = {
    'tech': ['AI art', 'WordPress speed', 'SEO strategies', 'productivity apps', 'tech reviews'],
    'finance': ['cryptocurrency', 'investment apps', 'financial planning', 'trading platforms', 'budgeting tools'],
    'lifestyle': ['fitness apps', 'meal planning', 'sustainable living', 'travel tips', 'wellness trends'],
    'business': ['remote work tools', 'project management', 'team collaboration', 'business automation', 'startup tips'],
    'gaming': ['gaming laptops', 'mobile games', 'streaming setup', 'game reviews', 'esports trends'],
    'gear': ['camera gear', 'photography equipment', 'tech gadgets', 'outdoor gear', 'travel gear', 'fitness equipment'],
    'filmmaking': ['video editing software', 'camera equipment', 'filmmaking techniques', 'video production', 'cinematography', 'film gear reviews'],
    'pentest': ['penetration testing tools', 'ethical hacking', 'cybersecurity', 'vulnerability assessment', 'security testing', 'bug bounty']
  };
  
  if (keywordSets[setName]) {
    setSeedKeywords(keywordSets[setName]);
    Logger.log(`✅ '${setName}' 키워드 세트로 전환 완료`);
    listSeedKeywords();
    return keywordSets[setName];
  } else {
    Logger.log(`❌ 키워드 세트 '${setName}'을 찾을 수 없습니다.`);
    Logger.log(`사용 가능한 세트: ${Object.keys(keywordSets).join(', ')}`);
    return null;
  }
}

/**
 * 키워드 세트별 전용 함수들 (드롭다운에서 선택 가능)
 */
function switchToTech() {
  return switchToKeywordSet('tech');
}

function switchToFinance() {
  return switchToKeywordSet('finance');
}

function switchToLifestyle() {
  return switchToKeywordSet('lifestyle');
}

function switchToBusiness() {
  return switchToKeywordSet('business');
}

function switchToGaming() {
  return switchToKeywordSet('gaming');
}

function switchToGear() {
  return switchToKeywordSet('gear');
}

function switchToFilmmaking() {
  return switchToKeywordSet('filmmaking');
}

function switchToPentest() {
  return switchToKeywordSet('pentest');
}

/**
 * 수동 헤더 정리 함수 (꼬인 헤더 수정용)
 */
function fixSheetHeaders() {
  const config = getConfig();
  const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("스프레드시트에 바인딩되어 있지 않습니다.");
  
  const sheet = ss.getSheetByName(config.SHEET_NAME);
  if (!sheet) throw new Error(`시트 "${config.SHEET_NAME}" 를 찾을 수 없습니다.`);

  Logger.log("=== 헤더 수동 정리 시작 ===");
  
  // 올바른 헤더 순서
  const correctHeaders = [
    "Topic", "Status", "PostedURL", "PostedAt", "Category", 
    "TagsCsv", "AffiliateLinks", "ProductNames", "Language", "Format",
    "Cluster", "Intent", "SourceKeywords", "OpportunityScore"
  ];
  
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  
  Logger.log(`현재 시트 크기: ${lastRow}행 x ${lastCol}열`);
  
  if (lastCol === 0 || lastRow === 0) {
    // 빈 시트인 경우
    sheet.getRange(1, 1, 1, correctHeaders.length).setValues([correctHeaders]);
    Logger.log("✅ 빈 시트에 올바른 헤더 설정 완료");
    return;
  }
  
  // 기존 헤더 확인
  const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log(`기존 헤더: ${existingHeaders.join(' | ')}`);
  
  // 중복된 Topic 헤더 찾기
  const topicIndices = [];
  existingHeaders.forEach((header, index) => {
    if (header && header.toString().trim().toLowerCase() === 'topic') {
      topicIndices.push(index);
    }
  });
  
  if (topicIndices.length > 1) {
    Logger.log(`⚠️ 중복된 Topic 헤더 발견: ${topicIndices.length}개 (위치: ${topicIndices.join(', ')})`);
    
    // 첫 번째 Topic 열의 데이터가 있는지 확인
    const firstTopicHasData = checkColumnHasData(sheet, topicIndices[0] + 1, lastRow);
    const targetTopicIndex = firstTopicHasData ? topicIndices[0] : topicIndices[topicIndices.length - 1];
    
    Logger.log(`주 데이터가 있는 Topic 열: ${targetTopicIndex + 1}`);
  }
  
  // 헤더 행 전체 재작성
  sheet.getRange(1, 1, 1, Math.max(lastCol, correctHeaders.length)).clearContent();
  sheet.getRange(1, 1, 1, correctHeaders.length).setValues([correctHeaders]);
  
  Logger.log("✅ 헤더 정리 완료!");
  Logger.log(`새 헤더: ${correctHeaders.join(' | ')}`);
  
  // 사용자에게 데이터 확인 요청
  Logger.log("🔍 데이터 확인 요청:");
  Logger.log("1. Google Sheets에서 첫 번째 행(헤더)이 올바른지 확인하세요");
  Logger.log("2. 기존 데이터가 올바른 열에 있는지 확인하세요");
  Logger.log("3. 필요시 데이터를 수동으로 올바른 위치로 이동하세요");
}

/**
 * 특정 열에 데이터가 있는지 확인
 */
function checkColumnHasData(sheet, colIndex, lastRow) {
  if (lastRow <= 1) return false;
  
  try {
    const data = sheet.getRange(2, colIndex, Math.min(lastRow - 1, 10), 1).getValues();
    return data.some(row => row[0] && row[0].toString().trim().length > 0);
  } catch (error) {
    return false;
  }
}

function testTopicMiningOnly() {
  Logger.log("=== 토픽 마이닝 테스트 시작 ===");
  try {
    Logger.log("1️⃣ 설정 확인 중...");
    const config = getConfig();
    
    if (!config.SERP_API_KEY) {
      throw new Error("SERP_API_KEY가 설정되지 않았습니다. Script Properties에서 설정하세요.");
    }
    
    if (!config.AI_API_KEY) {
      throw new Error("AI_API_KEY가 설정되지 않았습니다. Script Properties에서 설정하세요.");
    }
    
    Logger.log(`✅ 설정 확인 완료`);
    Logger.log(`  - SERP API Key: ${config.SERP_API_KEY ? '설정됨' : '없음'}`);
    Logger.log(`  - AI Provider: ${config.AI_PROVIDER}`);
    Logger.log(`  - AI Model: ${config.AI_MODEL}`);
    Logger.log(`  - 씨앗 키워드: ${config.BLOG_NICHE_KEYWORDS.join(', ')}`);
    
    Logger.log("2️⃣ 토픽 발굴 및 AI 분석 중...");
    const topics = discoverNicheTopics();
    
    if (topics.length === 0) {
      throw new Error("토픽 발굴 실패 - 씨앗 키워드나 API 키를 확인하세요");
    }
    
    Logger.log(`✅ ${topics.length}개의 전략적 토픽 발굴 완료!`);
    
    topics.forEach((topic, index) => {
      Logger.log(`\n📝 토픽 ${index + 1}:`);
      Logger.log(`  제목: ${topic.topic}`);
      Logger.log(`  카테고리: ${topic.suggested_category || topic.cluster_name}`);
      Logger.log(`  의도: ${topic.user_intent}`);
      Logger.log(`  키워드: ${topic.keywords.slice(0, 3).join(', ')}`);
      Logger.log(`  제품명: ${topic.product_names && topic.product_names.length > 0 ? topic.product_names.join(', ') : '없음'}`);
      Logger.log(`  기회 점수: ${topic.opportunity_score}`);
    });
    
    Logger.log("\n3️⃣ Google Sheets 저장 테스트 중...");
    const ss = config.SHEET_ID ? SpreadsheetApp.openById(config.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, config.SHEET_NAME);
    
    Logger.log(`✅ 시트 준비 완료: ${sheet.getName()}`);
    Logger.log(`  현재 데이터 행 수: ${sheet.getLastRow()}`);
    
    // 실제로 저장하지는 않고 시뮬레이션
    Logger.log("4️⃣ 저장 시뮬레이션 중...");
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`  시트 헤더: ${headers.join(', ')}`);
    
    const requiredHeaders = ['Topic', 'Category', 'TagsCsv', 'ProductNames', 'Language', 'Format', 'Cluster', 'Intent', 'SourceKeywords', 'OpportunityScore'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      Logger.log(`⚠️ 누락된 헤더: ${missingHeaders.join(', ')}`);
      Logger.log("시트에 필요한 헤더를 추가하거나 새 시트가 생성됩니다.");
    } else {
      Logger.log("✅ 모든 필요한 헤더가 존재합니다.");
    }
    
    Logger.log("\n🎉 토픽 마이닝 테스트 완료!");
    Logger.log(`총 ${topics.length}개의 블로그 토픽이 준비되었습니다.`);
    Logger.log("이제 collectTrends() 함수를 실행하여 실제로 시트에 저장하세요.");
    
    return topics;
    
  } catch (error) {
    Logger.log(`❌ 토픽 마이닝 테스트 실패: ${error.message}`);
    Logger.log("해결 방법:");
    Logger.log("1. Script Properties에서 SERP_API_KEY 설정");
    Logger.log("2. Script Properties에서 AI_API_KEY 설정");
    Logger.log("3. Script Properties에서 BLOG_NICHE_KEYWORDS 설정 (쉼표로 구분)");
    throw error;
  }
}
