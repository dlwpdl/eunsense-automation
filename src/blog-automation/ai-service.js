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
  const currentDate = new Date();
  const currentYear = 2025; // 항상 2025년을 현재 년도로 사용 (최신성 강조)
  const currentMonth = currentDate.getMonth() + 1;
  
  const relatedTopicsText = relatedTopics && relatedTopics.length > 0 
    ? `\n🔗 관련 주제들 (반드시 활용하세요):\n${relatedTopics.map((rt, i) => `${i+1}. ${rt}`).join('\n')}\n` 
    : '';
  
  // KO, KR, 한국어 등 모든 한국어 관련 값을 처리
  const isKorean = targetLanguage && (
    targetLanguage.toUpperCase() === "KO" || 
    targetLanguage.toUpperCase() === "KR" || 
    targetLanguage.includes("한국")
  );
  
  if (isKorean) {
    return `당신은 한국의 전문 블로거로서 독창적인 인사이트와 참신한 관점을 제공하는 것으로 유명합니다. 다음 주제에 대해 SEO 최적화된 한국어 블로그 글을 작성해주세요.

🚨 절대 지켜야 할 언어 규칙:
- 블로그 글 전체를 100% 한국어로만 작성하세요
- 제목, 소제목, 본문, 태그, 카테고리 모두 한국어여야 합니다
- 영어나 다른 언어는 절대 사용하지 마세요 (기술용어 제외)
- 영어 주제가 주어져도 반드시 한국어로 번역하여 작성하세요

🎯 미션: 뻔한 정보를 넘어서세요. 독자들이 생각해보지 못한 인사이트를 제공하고, 기존의 통념에 도전하며, 익숙한 주제라도 흥미진진하게 만드는 참신한 각도를 제시해주세요.

💬 글쓰기 스타일: 똑똑한 친구와 대화하는 듯한 친근하고 자연스러운 톤으로 작성하세요. 쉬운 단어를 사용하고, 복잡한 주제도 이해하기 쉽게 접근해주세요.

주제: ${topic}
현재 날짜: ${currentMonth}/${currentYear}
${relatedTopicsText}

⚠️ 중요한 제한사항:
1. ${currentYear-1}년 이전의 내용을 "최신", "현재", "최근"이라고 표현하지 마세요
2. ${currentYear+1}년 이후에 대한 구체적인 미래 예측은 하지 마세요
3. 검증되지 않은 사실이나 통계는 사용하지 마세요
4. 과장된 표현이나 낚시성 제목은 사용하지 마세요
5. 개인정보나 민감한 데이터는 포함하지 마세요
6. 어디서나 찾을 수 있는 뻔한 내용은 작성하지 마세요
7. 🚨 전체 블로그 글을 100% 한국어로만 작성하세요 (이것이 가장 중요합니다!)
8. 한국 독자를 위한 자연스럽고 완벽한 한국어 표현만 사용하세요\n\n다음 JSON 형식으로 응답해주세요:\n{\n  \"title\": \"흥미롭고 SEO 친화적인 한국어 제목 (60자 이내)\",\n  \"seoDescription\": \"SEO 최적화된 한국어 메타 설명 (155자 이내)\",\n  \"categories\": [\"카테고리1\", \"카테고리2\"],\n  \"tags\": [\"태그1\", \"태그2\", \"태그3\", \"태그4\", \"태그5\"],\n  \"subtopics\": [\"소제목1\", \"소제목2\", \"소제목3\", \"소제목4\", \"소제목5\"],\n  \"html\": \"완전한 HTML 형식의 블로그 글 내용\"\n}\n\n요구사항:\n1. 제목에는 관련 키워드를 포함하여 검색 최적화\n2. 내용은 6000-8000자 내외의 HTML 형식 (너무 길지 않게)\n3. H2, H3 태그를 사용한 구조화된 내용 (H2는 최대 5-6개)\n4. 소제목은 내용의 H2 제목과 일치해야 함 (최대 5-6개)\n5. 카테고리는 일반적인 블로그 카테고리\n6. 태그는 SEO 친화적인 키워드\n7. 자연스럽고 한국어다운 표현 사용\n8. 친근하고 대화체 톤 사용 (반말/존댓말 적절히 혼용)\n9. 실용적이고 유용한 정보 포함\n10. 현재 시점(${currentMonth}/${currentYear})에 맞는 정확한 정보만 사용\n\n🎯 콘텐츠 품질 향상:\n11. 독자들이 생각해보지 못한 독특한 인사이트 제공\n12. 적절한 경우 반대 관점이나 도전적인 시각 포함\n13. 주제를 탐구하는 독창적인 접근법 제시\n14. 평범한 주제도 매혹적으로 만드는 창의적인 스토리텔링\n15. 일반적인 가정에 도전하는 내용 포함\n\n💡 관련 주제 활용 가이드:\n16. 위에 제공된 관련 주제들을 반드시 글 내용에 자연스럽게 통합하세요\n17. 각 H2 섹션에서 최소 1-2개의 관련 주제를 언급하고 연결하세요\n18. 관련 주제들을 통해 주요 주제를 더 깊이 있고 포괄적으로 다루세요\n19. 관련 주제들 간의 연관성과 상호작용을 설명하세요\n20. 독자가 관련 주제들을 통해 더 넓은 관점을 얻을 수 있도록 안내하세요`;
  }
  
  return buildStructuredPrompt(topic, relatedTopics);
}

/**
 * 구조화된 프롬프트 생성 (영어)
 */
function buildStructuredPrompt(topic, relatedTopics = []) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // 관련 주제 문자열 생성
  const relatedTopicsText = relatedTopics && relatedTopics.length > 0 
    ? `\n🔗 Related Topics (YOU MUST utilize these):\n${relatedTopics.map((rt, i) => `${i+1}. ${rt}`).join('\n')}\n` 
    : '';
  
  return `You are a thought-leader blogger known for providing unique insights and fresh perspectives. Write an SEO-optimized blog post about the following topic in native-level English.

🎯 MISSION: Go beyond obvious information. Provide readers with insights they haven't considered before. Challenge conventional thinking and offer fresh angles that make even familiar topics fascinating.

💬 WRITING STYLE: Write in a conversational, friendly tone like you're chatting with a smart friend. Use simple words, contractions, and everyday language. Make complex topics feel easy and approachable.

🌍 LANGUAGE RULE: ALWAYS write the entire blog post in English, regardless of the topic language. If the topic is provided in Korean (한글), translate it and create a comprehensive English blog post about that subject.

Topic: ${topic}
Current Date: ${currentMonth}/${currentYear}
${relatedTopicsText}

⚠️ Important Restrictions:
1. Do NOT describe past years (before ${currentYear-1}) as "latest", "current", or "recent"
2. Do NOT make specific future predictions (beyond ${currentYear+1})
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
1. Title should include relevant keywords for SEO optimization and "2025" when relevant
2. Content should be 6000-8000 characters in HTML format (not too long)
3. Use structured content with H2, H3 tags (maximum 5-6 H2s)
4. Subtopics must match the H2 titles in the content (maximum 5-6)
5. Categories should be general blog categories
6. Tags should be SEO-friendly keywords
7. Use natural and fluent English expressions
8. Use a conversational and friendly tone
9. Include practical and useful information
10. Use only accurate information appropriate for current time (${currentMonth}/${currentYear})
🔥 FRESHNESS EMPHASIS:
10.1. ALWAYS use 2025 as the current year for maximum freshness and recency
10.2. Include "2025" in titles and content when it makes the content feel more current and up-to-date

🎯 Content Quality Enhancement:
11. Provide unique insights that readers haven't thought of
12. Include contrarian viewpoints or challenging perspectives when appropriate
13. Offer creative approaches to exploring the topic
14. Use engaging storytelling to make ordinary topics captivating
15. Challenge common assumptions with well-reasoned content

💡 Related Topics Integration Guide:
16. You MUST naturally integrate the related topics provided above into the blog content
17. In each H2 section, mention and connect at least 1-2 related topics
18. Use related topics to make the main topic more comprehensive and in-depth
19. Explain the connections and interactions between related topics
20. Guide readers to gain broader perspectives through the related topics`;
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