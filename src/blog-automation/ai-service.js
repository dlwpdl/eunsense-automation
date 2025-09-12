/**
 * AI 글 생성 및 분석 서비스
 */

// ==============================================================================
// AI 기반 전략 및 분석 함수
// ==============================================================================

/**
 * 토픽 클러스터링 및 전략 분석을 위한 AI 호출 함수
 * @param {Array<Object>} discoveredTopics - discoverNicheTopics에서 발굴한 토픽 목록
 * @returns {Object} AI가 분석한 토픽 클러스터 데이터 또는 null
 */
function analyzeTopicsWithAI(discoveredTopics) {
  Logger.log(`🧠 AI 토픽 분석 시작: ${discoveredTopics.length}개 키워드`);
  const config = getConfig();
  if (!config.AI_API_KEY) throw new Error("AI_API_KEY가 설정되지 않았습니다.");

  const analysisModel = "gpt-4o-mini"; 
  const prompt = buildTopicClusterPrompt(discoveredTopics);
  Logger.log(`AI 전략가 모델: ${analysisModel}`);
  
  try {
    const responseContent = callAiProvider(prompt, config, analysisModel);
    const parsedResponse = JSON.parse(responseContent);
    
    if (parsedResponse.clusters && Array.isArray(parsedResponse.clusters)) {
      Logger.log(`✅ AI가 ${parsedResponse.clusters.length}개의 토픽 클러스터를 생성했습니다.`);
      return parsedResponse;
    } else {
      throw new Error("AI 응답에 'clusters' 배열이 없습니다.");
    }
  } catch (e) {
    Logger.log(`❌ AI 토픽 분석 응답 파싱 실패: ${e.message}`);
    return null;
  }
}

/**
 * AI를 사용하여 기존 포스트를 재최적화합니다.
 * @param {string} originalTitle - 원본 포스트 제목
 * @param {string} originalHtml - 원본 포스트 HTML 콘텐츠
 * @returns {Object} { newTitle, newHtml } 또는 null
 */
function generateReoptimizedPost(originalTitle, originalHtml) {
  Logger.log(`🤖 AI 콘텐츠 재최적화 시작: "${originalTitle}"`);
  const config = getConfig();
  if (!config.AI_API_KEY) throw new Error("AI_API_KEY가 설정되지 않았습니다.");

  const reoptimizationModel = "gpt-4o"; 
  const prompt = buildReoptimizationPrompt(originalTitle, originalHtml);
  Logger.log(`AI 편집자 모델: ${reoptimizationModel}`);
  
  try {
    const responseContent = callAiProvider(prompt, config, reoptimizationModel);
    const parsedResponse = JSON.parse(responseContent);
    
    if (parsedResponse.newTitle && parsedResponse.newHtml) {
      Logger.log(`✅ AI가 콘텐츠 재작성을 완료했습니다. 새 제목: ${parsedResponse.newTitle}`);
      return parsedResponse;
    } else {
      throw new Error("AI 응답에 'newTitle' 또는 'newHtml'이 없습니다.");
    }
  } catch (e) {
    Logger.log(`❌ AI 재최적화 응답 파싱 실패: ${e.message}`);
    return null; 
  }
}


// ==============================================================================
// AI API 호출 및 프롬프트 생성 함수
// ==============================================================================

/**
 * 범용 AI 호출 함수
 */
function callAiProvider(prompt, config, model) {
    const profile = getModelProfile(model);
    
    switch (profile.provider) {
        case 'openai':
            return callOpenAI(prompt, config, model, profile);
        case 'anthropic':
            return callClaude(prompt, config, model, profile);
        default:
            throw new Error(`지원하지 않는 AI 제공자: ${profile.provider}`);
    }
}

/**
 * OpenAI API 호출
 */
function callOpenAI(prompt, config, model, profile) {
    const payload = {
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    };
    payload[profile.params.maxTokensParam] = profile.params.maxTokens;
    
    const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.AI_API_KEY}`,
            "Content-Type": "application/json"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
        const data = JSON.parse(responseText);
        return data.choices[0].message.content || "";
    } else {
        Logger.log(`OpenAI API Error (${responseCode}): ${responseText}`);
        throw new Error(`OpenAI API Error: ${responseText}`);
    }
}

/**
 * Claude API 호출 (Anthropic)
 */
function callClaude(prompt, config, model, profile) {
    const apiKey = config.CLAUDE_API_KEY || config.AI_API_KEY;
    if (!apiKey) {
        throw new Error("Claude API 키가 설정되지 않았습니다. CLAUDE_API_KEY를 Script Properties에 설정하세요.");
    }
    
    // Claude는 JSON 모드가 없으므로 프롬프트에 JSON 요청 추가
    const claudePrompt = prompt + "\n\n반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.";
    
    const payload = {
        model: model,
        max_tokens: profile.params.maxTokens,
        messages: [{ 
            role: "user", 
            content: claudePrompt 
        }]
    };
    
    const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
        const data = JSON.parse(responseText);
        const content = data.content[0].text || "";
        
        // Claude 응답에서 JSON 부분만 추출
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? jsonMatch[0] : content;
    } else {
        Logger.log(`Claude API Error (${responseCode}): ${responseText}`);
        throw new Error(`Claude API Error: ${responseText}`);
    }
}

/**
 * 콘텐츠 재활용 및 개선을 위한 프롬프트 생성
 */
function buildReoptimizationPrompt(originalTitle, originalHtml) {
  return `You are an expert SEO content editor. Your mission is to analyze the following blog post and rewrite it to be more engaging, accurate, and SEO-optimized for the current year.\n\nOriginal Title: ${originalTitle}\n\nOriginal Content (HTML):\n\
${originalHtml}
\
\nTASK: Rewrite the article with the following improvements:\n1.  **Update Information:** Refresh any outdated information, statistics, or examples.\n2.  **Improve Clarity & Flow:** Make the content easier to read and understand. Reorganize sections if necessary for better logical flow.\n3.  **Enhance SEO:** Naturally integrate relevant modern keywords and LSI (Latent Semantic Indexing) terms. Optimize headings (H2, H3) for better search visibility.\n4.  **Increase Engagement:** Add a more compelling introduction and a stronger conclusion. Use more engaging language and a conversational tone.\n5.  **Maintain Core Message:** Do not change the fundamental topic or core message of the original article.\n\nPlease respond in the following JSON format:\n{\n  \"newTitle\": \"A new, more engaging, and SEO-optimized title\",\n  \"newHtml\": \"The completely rewritten and improved blog post in HTML format\"\n}`;
}

/**
 * 토픽 클러스터링 및 전략 분석을 위한 프롬프트 생성
 */
function buildTopicClusterPrompt(discoveredTopics) {
  const topicList = discoveredTopics.map(t => `- ${t.topic} (source: ${t.source})`).join('\n');

  return `You are a senior content strategist and SEO expert. Your task is to analyze a raw list of search queries and organize them into a coherent content strategy.\n\nHere is a list of discovered search queries and questions related to a niche:\n\n${topicList}\n\nTASK: Analyze this list and perform the following actions:\n1.  **Group into Clusters:** Group these queries into 3-5 logical topic clusters. A cluster represents a single, comprehensive blog post idea.\n2.  **Assign a Cluster Name:** Give each cluster a short, descriptive name.\n3.  **Determine User Intent:** For each cluster, identify the primary user intent. Choose from: 'How-to/Tutorial', 'Comparison/Review', 'Information/Concept', 'News/Update'.\n4.  **Create a Representative Title:** For each cluster, write one compelling, SEO-friendly blog post title that would satisfy all the queries in that cluster.\n5.  **List Keywords:** List the original queries that belong to each cluster.\n6.  **Extract Product Names:** If any specific products, tools, or brands are mentioned in the keywords, list them separately for affiliate/review purposes.\n7.  **Suggest Category:** Suggest the most appropriate WordPress blog category for this topic cluster.\n\nPlease respond in the following JSON format:\n{\n  \"clusters\": [\n    {\n      \"cluster_name\": \"A short, descriptive name for the cluster\",\n      \"representative_title\": \"A compelling, SEO-friendly blog post title for this cluster\",\n      \"user_intent\": \"The primary user intent (e.g., 'How-to/Tutorial')\",\n      \"suggested_category\": \"Most appropriate blog category (e.g., Technology, Lifestyle, Business)\",\n      \"keywords\": [\n        \"keyword1 from the original list\",\n        \"keyword2 from the original list\"\n      ],\n      \"product_names\": [\n        \"Product Name 1\",\n        \"Brand Name 2\"\n      ]\n    }\n  ]\n}`;
}

function buildStructuredPromptWithLanguage(topic, targetLanguage = "EN", relatedTopics = []) {
  const dateInfo = getCurrentDateInfo();
  const dateContext = getDateContextForPrompt();
  
  const relatedTopicsText = relatedTopics && relatedTopics.length > 0 
    ? `\n🔗 관련 주제들 (반드시 활용하세요):\n${relatedTopics.map((rt, i) => `${i+1}. ${rt}`).join('\n')}\n` 
    : '';
  
  // KO, KR, 한국어 등 모든 한국어 관련 값을 처리 (강화된 감지 로직)
  const isKorean = targetLanguage && (
    targetLanguage.toString().trim().toUpperCase() === "KO" || 
    targetLanguage.toString().trim().toUpperCase() === "KR" || 
    targetLanguage.toString().trim().toLowerCase() === "ko" || 
    targetLanguage.toString().trim().toLowerCase() === "kr" || 
    targetLanguage.toString().includes("한국") ||
    targetLanguage.toString().toLowerCase().includes("korean")
  );
  
  if (isKorean) {
    Logger.log(`🇰🇷 한국어 모드 활성화: targetLanguage="${targetLanguage}" → 네이티브 한국어 프롬프트 사용`);
    return `너는 진짜 한국 사람처럼 글을 쓰는 블로거야. 다음 주제로 완전 자연스러운 한국어 블로그 글을 써줘.

🔥 진짜 중요한 거:
- 무조건 100% 한국어로만 써 (영어 금지!)
- AI처럼 들리지 말고 진짜 사람처럼 써
- 딱딱한 말투 말고 편하게 써
- 영어 주제라도 한국어로 완전히 바꿔서 써

✨ 어떻게 쓸지:
- 친구한테 이야기하듯이 자연스럽게
- "~죠", "~네요", "~거든요" 같은 말투 많이 써
- 가끔 반말도 섞어서 친근하게
- "진짜", "완전", "약간", "그냥" 같은 일상 표현 써
- 어려운 말 쓰지 말고 쉽게 설명해

주제: ${topic}
${dateContext.context}
${relatedTopicsText}

🚫 이런 건 절대 하지 마:
- 과거 정보를 '최신'이라고 하기 (${dateInfo.yearText}년이 현재야)
- 미래 예측하기 (${dateInfo.yearText}년 이후는 예측 말고)
- 검증 안 된 통계 쓰기
- 과장된 낚시 제목 쓰기
- "~하는 것이 중요합니다", "~라고 할 수 있습니다" 같은 AI 말투
- "여러분", "독자분들" 같은 딱딱한 호칭
- "다양한", "효과적인", "핵심적인" 같은 뻔한 형용사
- 어디서나 볼 수 있는 내용

💬 이렇게 써야 해:
- "~죠", "~거든요", "~네요" 자주 써
- "그런데", "근데", "아무튼" 같은 연결어 써
- "진짜", "정말", "완전", "엄청" 같은 강조 표현
- "솔직히", "사실", "개인적으로" 같은 개인 의견 표현
- "~할게요", "~해보세요", "~하시면 돼요" 같은 친근한 권유
- 가끔 "ㅋㅋ", "ㅠㅠ" 같은 감정 표현도 OK

다음 JSON으로 답해줘:
{
  "title": "클릭하고 싶은 자연스러운 한국어 제목 (60자 이내)",
  "seoDescription": "검색에 잘 걸리는 한국어 설명 (155자 이내)", 
  "categories": ["카테고리1", "카테고리2"],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "subtopics": ["소제목1", "소제목2", "소제목3", "소제목4", "소제목5"],
  "html": "완전 자연스러운 한국어 HTML 글"
}

글 쓸 때 이것만 지켜:
1. 제목에 검색 키워드와 ${dateInfo.yearText}년 넣기 (관련 있을 때만)
2. 6000-8000자 정도로 쓰기 (너무 길면 안 돼)
3. H2, H3 태그로 구조 잡기 (H2는 5개 정도만)
4. 진짜 도움되는 내용만 쓰기
5. ${dateContext.freshness}
6. 관련 주제들 자연스럽게 섞어서 쓰기
7. 읽는 사람이 "아, 이거 유용하네!" 하게 만들기`;
  }
  
  Logger.log(`🌍 영어 모드 활성화: targetLanguage="${targetLanguage}" → 영어 프롬프트 사용`);
  return buildStructuredPrompt(topic, relatedTopics);
}

/**
 * 구조화된 프롬프트 생성 (영어)
 */
function buildStructuredPrompt(topic, relatedTopics = []) {
  const dateInfo = getCurrentDateInfo();
  const dateContext = getDateContextForPrompt();
  
  // 관련 주제 문자열 생성
  const relatedTopicsText = relatedTopics && relatedTopics.length > 0 
    ? `\n🔗 Related Topics (YOU MUST utilize these):\n${relatedTopics.map((rt, i) => `${i+1}. ${rt}`).join('\n')}\n` 
    : '';
  
  return `You are a thought-leader blogger known for providing unique insights and fresh perspectives. Write an SEO-optimized blog post about the following topic in native-level English.

🎯 MISSION: Go beyond obvious information. Provide readers with insights they haven't considered before. Challenge conventional thinking and offer fresh angles that make even familiar topics fascinating.

💬 WRITING STYLE: Write in a conversational, friendly tone like you're chatting with a smart friend. Use simple words, contractions, and everyday language. Make complex topics feel easy and approachable.

🌍 LANGUAGE RULE: ALWAYS write the entire blog post in English, regardless of the topic language. If the topic is provided in Korean (한글), translate it and create a comprehensive English blog post about that subject.

Topic: ${topic}
${dateContext.context}
${relatedTopicsText}

⚠️ Important Restrictions:
1. ${dateContext.freshness}
2. Do NOT make specific future predictions beyond ${dateInfo.year + 1}
3. Do NOT use unverified facts or statistics
4. Do NOT use exaggerated expressions or clickbait titles
5. Do NOT include personal information or sensitive data
6. Do NOT write generic content that can be found everywhere
7. Write the entire blog post in English
8. Use natural English expressions for English readers

Please respond in the following JSON format:
{
  "title": "An engaging, SEO-friendly title (under 60 characters)",
  "seoDescription": "An SEO-optimized meta description (under 155 characters)",
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "subtopics": ["subtopic1", "subtopic2", "subtopic3", "subtopic4", "subtopic5"],
  "html": "Complete HTML blog post content"
}

Requirements:
1. Title should include relevant keywords and ${dateInfo.yearText} when relevant for freshness
2. Content should be 6000-8000 characters in HTML format (not too long)
3. Use structured content with H2, H3 tags (maximum 5-6 H2s)
4. Subtopics must match the H2 titles in the content (maximum 5-6)
5. Categories should be general blog categories
6. Tags should be SEO-friendly keywords
7. Use natural and fluent English expressions
8. Use a conversational and friendly tone
9. Include practical and useful information
10. ${dateContext.seasonality}

🔥 FRESHNESS EMPHASIS:
11. Always reference ${dateInfo.yearText} as the current year for maximum relevance
12. Include ${dateInfo.yearText} in titles and content when it enhances timeliness
13. Consider ${dateInfo.seasonText} ${dateInfo.yearText} context when relevant

🎯 Content Quality Enhancement:
14. Provide unique insights that readers haven't thought of
15. Include contrarian viewpoints or challenging perspectives when appropriate
16. Offer creative approaches to exploring the topic
17. Use engaging storytelling to make ordinary topics captivating
18. Challenge common assumptions with well-reasoned content

💡 Related Topics Integration Guide:
19. You MUST naturally integrate the related topics provided above into the blog content
20. In each H2 section, mention and connect at least 1-2 related topics
21. Use related topics to make the main topic more comprehensive and in-depth
22. Explain the connections and interactions between related topics
23. Guide readers to gain broader perspectives through the related topics`;
}

function getModelProfile(model) {
  const modelProfiles = {
    // OpenAI 모델들 (추천 순서)
    'gpt-5': {
      provider: 'openai',
      params: { maxTokensParam: 'max_completion_tokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 8000 },
      capabilities: { jsonReliability: 'outstanding', promptFollowing: 'outstanding', responseFormat: 'structured', costEfficiency: 'low', writingQuality: 'outstanding' },
      strategy: { promptTemplate: 'detailed', retryAttempts: 2, fallbackBehavior: 'structured' }
    },
    'gpt-5-mini': {
      provider: 'openai',
      params: { maxTokensParam: 'max_completion_tokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 6000 },
      capabilities: { jsonReliability: 'excellent', promptFollowing: 'excellent', responseFormat: 'structured', costEfficiency: 'high', writingQuality: 'excellent' },
      strategy: { promptTemplate: 'detailed', retryAttempts: 2, fallbackBehavior: 'structured' }
    },
    'gpt-4o': {
      provider: 'openai',
      params: { maxTokensParam: 'max_completion_tokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'excellent', promptFollowing: 'excellent', responseFormat: 'structured', costEfficiency: 'medium', writingQuality: 'excellent' },
      strategy: { promptTemplate: 'detailed', retryAttempts: 2, fallbackBehavior: 'structured' }
    },
    'gpt-4o-mini': {
      provider: 'openai',
      params: { maxTokensParam: 'max_completion_tokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'high', promptFollowing: 'excellent', responseFormat: 'structured', costEfficiency: 'high', writingQuality: 'good' },
      strategy: { promptTemplate: 'detailed', retryAttempts: 3, fallbackBehavior: 'structured' }
    },
    'gpt-4-turbo': {
      provider: 'openai',
      params: { maxTokensParam: 'max_completion_tokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'excellent', promptFollowing: 'excellent', responseFormat: 'structured', costEfficiency: 'low', writingQuality: 'excellent' },
      strategy: { promptTemplate: 'detailed', retryAttempts: 2, fallbackBehavior: 'structured' }
    },
    
    // Anthropic Claude 모델들 (장문 작성에 최적)
    'claude-4-sonnet-20250514': {
      provider: 'anthropic',
      params: { maxTokensParam: 'max_tokens', supportsTemperature: true, supportsJsonFormat: false, defaultTemperature: 0.7, maxTokens: 8000 },
      capabilities: { jsonReliability: 'excellent', promptFollowing: 'outstanding', responseFormat: 'text_with_structure', costEfficiency: 'medium', writingQuality: 'outstanding' },
      strategy: { promptTemplate: 'claude_optimized', retryAttempts: 2, fallbackBehavior: 'text_parsing' }
    },
    'claude-3-5-sonnet-20241022': {
      provider: 'anthropic',
      params: { maxTokensParam: 'max_tokens', supportsTemperature: true, supportsJsonFormat: false, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'good', promptFollowing: 'excellent', responseFormat: 'text_with_structure', costEfficiency: 'medium', writingQuality: 'excellent' },
      strategy: { promptTemplate: 'claude_optimized', retryAttempts: 3, fallbackBehavior: 'text_parsing' }
    },
    'claude-3-5-haiku-20241022': {
      provider: 'anthropic',
      params: { maxTokensParam: 'max_tokens', supportsTemperature: true, supportsJsonFormat: false, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'medium', promptFollowing: 'excellent', responseFormat: 'text_with_structure', costEfficiency: 'high', writingQuality: 'good' },
      strategy: { promptTemplate: 'claude_optimized', retryAttempts: 3, fallbackBehavior: 'text_parsing' }
    },
    'claude-3-opus-20240229': {
      provider: 'anthropic',
      params: { maxTokensParam: 'max_tokens', supportsTemperature: true, supportsJsonFormat: false, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'good', promptFollowing: 'excellent', responseFormat: 'text_with_structure', costEfficiency: 'very_low', writingQuality: 'outstanding' },
      strategy: { promptTemplate: 'claude_optimized', retryAttempts: 2, fallbackBehavior: 'text_parsing' }
    },
    
    // Google Gemini 모델들
    'gemini-1.5-flash': {
      provider: 'gemini',
      params: { maxTokensParam: 'maxOutputTokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'high', promptFollowing: 'excellent', responseFormat: 'structured', costEfficiency: 'high', writingQuality: 'good' },
      strategy: { promptTemplate: 'google_optimized', retryAttempts: 2, fallbackBehavior: 'structured' }
    },
    'gemini-1.5-pro': {
      provider: 'gemini',
      params: { maxTokensParam: 'maxOutputTokens', supportsTemperature: true, supportsJsonFormat: true, defaultTemperature: 0.7, maxTokens: 4000 },
      capabilities: { jsonReliability: 'high', promptFollowing: 'excellent', responseFormat: 'structured', costEfficiency: 'medium', writingQuality: 'excellent' },
      strategy: { promptTemplate: 'google_optimized', retryAttempts: 2, fallbackBehavior: 'structured' }
    }
  };
  
  // 정확한 모델명으로 찾기
  if (modelProfiles[model]) return modelProfiles[model];
  
  // 패턴 매칭 (fallback)
  if (model.includes('gpt-5-mini')) return modelProfiles['gpt-5-mini'];
  if (model.includes('gpt-5')) return modelProfiles['gpt-5'];
  if (model.includes('claude-4')) return modelProfiles['claude-4-sonnet-20250514'];
  if (model.includes('gpt-4o')) return modelProfiles['gpt-4o'];
  if (model.includes('gpt-4')) return modelProfiles['gpt-4-turbo'];
  if (model.includes('claude-3-5-sonnet')) return modelProfiles['claude-3-5-sonnet-20241022'];
  if (model.includes('claude-3-5-haiku')) return modelProfiles['claude-3-5-haiku-20241022'];
  if (model.includes('claude-3-opus')) return modelProfiles['claude-3-opus-20240229'];
  if (model.includes('claude')) return modelProfiles['claude-4-sonnet-20250514'];
  if (model.includes('gemini-1.5-pro')) return modelProfiles['gemini-1.5-pro'];
  if (model.includes('gemini')) return modelProfiles['gemini-1.5-flash'];
  
  // 기본값 (최신 추천 모델)
  return modelProfiles['gpt-5'];
}

function generateHtmlWithLanguage(topic, targetLanguage = "EN", relatedTopics = []) {
  // 동적 날짜 정보 자동 초기화
  const dateInfo = getCurrentDateInfo();
  const dateContext = getDateContextForPrompt();
  
  const config = getConfig();
  if (!config.AI_API_KEY) throw new Error("AI_API_KEY가 설정되지 않았습니다.");
  const modelProfile = getModelProfile(config.AI_MODEL);
  Logger.log(`=== AI 글 생성 시작 (관련 주제 포함) ===`);
  let lastError = null;
  for (let attempt = 1; attempt <= modelProfile.strategy.retryAttempts; attempt++) {
    try {
      Logger.log(`시도 ${attempt}/${modelProfile.strategy.retryAttempts}`);
      let result;
      const prompt = buildStructuredPromptWithLanguage(topic, targetLanguage, relatedTopics);
      switch (config.AI_PROVIDER) {
        case 'openai':
        case 'anthropic':
        case 'claude':
          result = JSON.parse(callAiProvider(prompt, config, config.AI_MODEL));
          break;
        default:
          throw new Error(`지원하지 않는 AI 제공자: ${config.AI_PROVIDER}. 지원 가능한 제공자: openai, anthropic, claude`);
      }
      if (result && result.title && result.html && result.html.length > 50) {
        Logger.log(`✅ 시도 ${attempt}에서 성공`);
        return validateAndCleanResult(result, topic, modelProfile);
      }
      throw new Error("불완전한 응답");
    } catch (error) {
      lastError = error;
      Logger.log(`❌ 시도 ${attempt} 실패: ${error.message}`);
      if (attempt < modelProfile.strategy.retryAttempts) Utilities.sleep(1000);
    }
  }
  Logger.log(`❌ 모든 시도 실패, 최종 폴백 모드 실행`);
  return createFallbackStructure(topic, `Failed after ${modelProfile.strategy.retryAttempts} attempts. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

function validateAndCleanResult(result, topic, modelProfile) {
  if (!result.title || result.title.trim() === "" || result.title === "Blog Post") {
    result.title = topic;
  }
  if (!result.html || result.html.trim() === "") {
    result.html = `<h2>${result.title}</h2><p>This comprehensive article explores ${topic} and provides valuable insights.</p>`;
  }
  return result;
}

function createFallbackStructure(topic, originalResponse) {
  return {
    title: topic,
    seoDescription: `Learn about ${topic} and discover valuable insights.`,
    categories: ["General"],
    tags: ["information", "guide"],
    html: `<h2>${topic}</h2><p>This comprehensive guide explores everything you need to know about ${topic}.</p><p>${originalResponse.substring(0, 500)}</p>`
  };
}


