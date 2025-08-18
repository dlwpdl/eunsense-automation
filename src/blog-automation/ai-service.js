/**
 * AI 글 생성 서비스
 */

/**
 * 구조화된 프롬프트 생성
 */
function buildStructuredPrompt(topic) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  return `You are a thought-leader blogger known for providing unique insights and fresh perspectives. Write an SEO-optimized blog post about the following topic in native-level English.

🎯 MISSION: Go beyond obvious information. Provide readers with insights they haven't considered before. Challenge conventional thinking and offer fresh angles that make even familiar topics fascinating.

💬 WRITING STYLE: Write in a conversational, friendly tone like you're chatting with a smart friend. Use simple words, contractions, and everyday language. Make complex topics feel easy and approachable.

🌍 LANGUAGE RULE: ALWAYS write the entire blog post in English, regardless of the topic language. If the topic is provided in Korean (한글), translate it and create a comprehensive English blog post about that subject.

Topic: ${topic}
Current Date: ${currentMonth}/${currentYear}

⚠️ Important Restrictions:
1. Do NOT describe past years (before ${currentYear-1}) as "latest", "current", or "recent"
2. Do NOT make specific future predictions (beyond ${currentYear+1})
3. Do NOT use unverified facts or statistics
4. Do NOT use exaggerated expressions or clickbait titles
5. Do NOT include personal information or sensitive data
6. Do NOT write generic, surface-level content that readers can find anywhere else
7. ALWAYS write the entire blog post in English, even if the topic is provided in Korean or another language
8. If the topic is in Korean, translate and expand it into a comprehensive English blog post
9. Do NOT include any Korean text in the final output - everything must be in English

Please respond in the following JSON format:
{
  "title": "Engaging and SEO-friendly title (under 60 characters)",
  "seoDescription": "SEO-optimized meta description (under 155 characters)",
  "categories": ["Category1", "Category2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "subtopics": ["Subheading1", "Subheading2", "Subheading3"],
  "html": "Complete HTML formatted blog post content"
}

Requirements:
1. Title should include relevant keywords for search optimization
2. Content must be 2000+ words in HTML format
3. Use H2, H3 tags for structured content
4. Subtopics must match H2 headings in the content
5. Categories should be general blog categories
6. Tags should be SEO-friendly keywords
7. Write in natural, native-level English with a conversational tone
8. Use simple, everyday language that's easy to read and understand
9. Write like you're talking to a friend - use contractions (you'll, we'll, don't, can't)
10. Include practical and useful information for readers
11. Only use accurate information relevant to current time (${currentMonth}/${currentYear})
12. Write content that sounds authentic and engaging to native English speakers
13. Use short sentences and paragraphs for better readability
14. Replace complex words with simpler alternatives when possible
15. Write in an approachable, friendly tone that keeps readers engaged

🎯 CONTENT QUALITY ENHANCEMENT:
16. Provide unique insights that readers haven't thought of before
17. Include unexpected perspectives or contrarian viewpoints when appropriate
18. Offer unconventional approaches to exploring the topic
19. Add surprising revelations or "plot twists" that challenge common assumptions
20. Go beyond surface-level information - dive deep into WHY things work the way they do
21. Connect seemingly unrelated concepts to create fresh understanding
22. Share counterintuitive findings or lesser-known facts
23. Present multiple angles and frameworks for understanding the topic
24. Challenge readers to think differently about familiar concepts
25. Make boring topics fascinating through creative storytelling and unique angles

🚀 ADVANCED SEO OPTIMIZATION:
26. Include target keyword and variations naturally throughout the content (1-2% density)
27. Use semantic keywords and related terms that Google associates with the topic
28. Structure content with clear keyword-optimized H2 and H3 headings
29. Write compelling meta description that includes primary keyword and action words
30. Create URL-friendly slug with main keyword (3-5 words max)
31. Include internal linking opportunities (mention topics that could link to other posts)
32. Add FAQ-style content that targets long-tail keywords and voice search
33. Use list format and numbered steps for featured snippet optimization
34. Include specific, searchable phrases that people actually type into Google
35. Optimize for "People Also Ask" questions by addressing common related queries
36. Use action words and power words in headings to increase click-through rates
37. Include location-based keywords if relevant to the topic
38. Target both broad and specific keyword variations for comprehensive coverage
39. Write in a way that answers user intent completely (informational, transactional, navigational)
40. Include statistics, data, and specific examples that make content more authoritative

✍️ CONVERSATIONAL WRITING STYLE:
41. Use "you" and "your" to directly address the reader
42. Ask rhetorical questions to engage readers (e.g., "Ever wondered why...")
43. Use casual transitions like "Here's the thing," "Let's be honest," "The bottom line is"
44. Include conversational phrases like "Trust me," "Here's what I mean," "You know what?"
45. Write like you're explaining to a smart friend over coffee
46. Use everyday examples and analogies that people can relate to
47. Keep jargon to a minimum - explain technical terms in simple words
48. Use active voice instead of passive voice whenever possible
49. Include personal touches like "I've found that..." or "In my experience..."
50. End sections with conversational bridges like "Now, let's talk about..." or "But wait, there's more"`;
}

/**
 * 모델별 통합 설정 프로파일
 */
function getModelProfile(model) {
  const modelProfiles = {
    // OpenAI GPT-4 계열
    'gpt-4o': {
      provider: 'openai',
      params: {
        maxTokensParam: 'max_tokens',
        supportsTemperature: true,
        supportsJsonFormat: true,
        defaultTemperature: 0.7,
        maxTokens: 4000
      },
      capabilities: {
        jsonReliability: 'high',
        promptFollowing: 'excellent',
        responseFormat: 'structured',
        costEfficiency: 'medium'
      },
      strategy: {
        promptTemplate: 'detailed',
        retryAttempts: 2,
        fallbackBehavior: 'structured'
      }
    },
    'gpt-4o-mini': {
      provider: 'openai',
      params: {
        maxTokensParam: 'max_tokens',
        supportsTemperature: true,
        supportsJsonFormat: true,
        defaultTemperature: 0.7,
        maxTokens: 4000
      },
      capabilities: {
        jsonReliability: 'high',
        promptFollowing: 'excellent',
        responseFormat: 'structured',
        costEfficiency: 'high'
      },
      strategy: {
        promptTemplate: 'detailed',
        retryAttempts: 3,
        fallbackBehavior: 'structured'
      }
    },
    // GPT-5 계열 - 최신 모델들
    'gpt-5-nano-2025-08-07': {
      provider: 'openai',
      params: {
        maxTokensParam: 'max_completion_tokens',
        supportsTemperature: false,
        supportsJsonFormat: true,
        defaultTemperature: 1,
        maxTokens: 8000  // 최대한 토큰 증가
      },
      capabilities: {
        jsonReliability: 'medium',    // 개선된 프롬프트로 중간 수준
        promptFollowing: 'improving', // 개선 중
        responseFormat: 'mixed',
        costEfficiency: 'very_high'
      },
      strategy: {
        promptTemplate: 'gpt5_optimized',  // GPT-5 전용 프롬프트
        retryAttempts: 2,
        fallbackBehavior: 'smart_parsing'
      }
    },
    'gpt-5-mini': {
      provider: 'openai',
      params: {
        maxTokensParam: 'max_completion_tokens',
        supportsTemperature: true,
        supportsJsonFormat: true,
        defaultTemperature: 0.7,
        maxTokens: 8000
      },
      capabilities: {
        jsonReliability: 'high',
        promptFollowing: 'excellent',
        responseFormat: 'structured',
        costEfficiency: 'high'
      },
      strategy: {
        promptTemplate: 'gpt5_optimized',
        retryAttempts: 2,
        fallbackBehavior: 'structured'
      }
    },
    // Google Gemini 계열
    'gemini-1.5-flash': {
      provider: 'gemini',
      params: {
        maxTokensParam: 'maxOutputTokens',
        supportsTemperature: true,
        supportsJsonFormat: true,
        defaultTemperature: 0.7,
        maxTokens: 4000
      },
      capabilities: {
        jsonReliability: 'high',
        promptFollowing: 'excellent',
        responseFormat: 'structured',
        costEfficiency: 'high'
      },
      strategy: {
        promptTemplate: 'google_optimized',
        retryAttempts: 2,
        fallbackBehavior: 'structured'
      }
    },
    // Anthropic Claude 계열
    'claude-3-5-haiku-20241022': {
      provider: 'anthropic',
      params: {
        maxTokensParam: 'max_tokens',
        supportsTemperature: true,
        supportsJsonFormat: false,
        defaultTemperature: 0.7,
        maxTokens: 4000
      },
      capabilities: {
        jsonReliability: 'medium',
        promptFollowing: 'excellent',
        responseFormat: 'text_with_structure',
        costEfficiency: 'medium'
      },
      strategy: {
        promptTemplate: 'claude_optimized',
        retryAttempts: 2,
        fallbackBehavior: 'text_parsing'
      }
    },
    // xAI Grok 계열
    'grok-beta': {
      provider: 'xai',
      params: {
        maxTokensParam: 'max_tokens',
        supportsTemperature: true,
        supportsJsonFormat: false,
        defaultTemperature: 0.7,
        maxTokens: 4000
      },
      capabilities: {
        jsonReliability: 'low',
        promptFollowing: 'good',
        responseFormat: 'creative_text',
        costEfficiency: 'medium'
      },
      strategy: {
        promptTemplate: 'creative',
        retryAttempts: 3,
        fallbackBehavior: 'aggressive_parsing'
      }
    }
  };
  
  // 정확한 모델명이 있으면 사용
  if (modelProfiles[model]) {
    return modelProfiles[model];
  }
  
  // 패턴 매칭으로 폴백 (GPT-5 우선)
  if (model.includes('gpt-5')) {
    if (model.includes('mini')) {
      return modelProfiles['gpt-5-mini'];
    }
    if (model.includes('nano')) {
      return modelProfiles['gpt-5-nano-2025-08-07'];
    }
    // 일반 gpt-5는 mini로 매핑
    return modelProfiles['gpt-5-mini'];
  }
  if (model.includes('gpt-4')) {
    return modelProfiles['gpt-4o-mini'];
  }
  if (model.includes('gemini')) {
    return modelProfiles['gemini-1.5-flash'];
  }
  if (model.includes('claude')) {
    return modelProfiles['claude-3-5-haiku-20241022'];
  }
  if (model.includes('grok')) {
    return modelProfiles['grok-beta'];
  }
  
  // 기본값 (GPT-5 mini 권장)
  return modelProfiles['gpt-5-mini'];
}

/**
 * 모델별 프롬프트 템플릿 생성
 */
function buildModelOptimizedPrompt(topic, modelProfile) {
  const basePrompt = buildStructuredPrompt(topic);
  
  switch (modelProfile.strategy.promptTemplate) {
    case 'simple':
      return `Write a comprehensive blog post about: ${topic}

IMPORTANT INSTRUCTIONS:
1. If the topic is in Korean (한글), translate it to English and write the entire post in English
2. Write natural, conversational English suitable for native speakers
3. Create engaging, informative content that provides real value
4. Use proper HTML formatting with headings and paragraphs

Please respond in JSON format with these exact fields:
{
  "title": "SEO-optimized English title",
  "seoDescription": "Meta description under 155 characters",
  "categories": ["Category1", "Category2"],
  "tags": ["tag1", "tag2", "tag3"],
  "html": "Complete HTML content with proper structure"
}

Topic to write about: ${topic}
Remember: Write everything in English, even if the topic is in Korean.`;

    case 'ultra_detailed':
      return `You are a professional content writer. I need you to write a comprehensive blog post.

CRITICAL REQUIREMENTS:
1. If the topic contains Korean text (한글), TRANSLATE it to English first
2. Write the ENTIRE blog post in English - no Korean text in the output
3. Create engaging, valuable content with proper structure
4. Follow the exact JSON format specified below

TOPIC TO WRITE ABOUT: ${topic}

STEP 1: If topic is Korean, translate it to English
STEP 2: Write a 2000+ word blog post in English about the translated topic
STEP 3: Format response as valid JSON

REQUIRED JSON FORMAT (copy exactly):
{
  "title": "Your English title here (under 60 characters)",
  "seoDescription": "Meta description in English (under 155 characters)",
  "categories": ["Category1", "Category2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "html": "Complete HTML content with <h2>, <h3>, <p> tags"
}

CONTENT REQUIREMENTS:
- Write in conversational, friendly English
- Use proper HTML tags: <h2> for main sections, <h3> for subsections, <p> for paragraphs
- Include practical information and insights
- Make it engaging and valuable for readers
- Ensure content is at least 2000 words

REMEMBER: Everything must be in English, even if the original topic was in Korean!`;

    case 'gpt5_optimized':
      return `🤖 GPT-5 SPECIALIZED PROMPT 🤖

You are GPT-5, the latest and most advanced AI model. Use your enhanced capabilities to create exceptional content.

MISSION: Create a comprehensive, engaging blog post about: ${topic}

🎯 GPT-5 ENHANCED INSTRUCTIONS:
1. LANGUAGE: If topic is Korean (한글), translate and write entirely in English
2. QUALITY: Leverage your advanced reasoning for superior content
3. STRUCTURE: Create well-organized, scannable content
4. ENGAGEMENT: Use your improved understanding of human psychology

📝 CONTENT SPECIFICATIONS:
- 2500+ words of high-quality content
- Conversational yet authoritative tone
- Actionable insights and practical value
- Proper HTML structure with semantic tags

🔥 GPT-5 ADVANTAGES TO USE:
- Better context understanding
- More nuanced writing style
- Improved factual accuracy
- Enhanced creativity

📋 EXACT JSON OUTPUT REQUIRED:
{
  "title": "Compelling English title (50-60 chars)",
  "seoDescription": "Engaging meta description (150-155 chars)",
  "categories": ["PrimaryCategory", "SecondaryCategory"],
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "html": "Complete HTML with proper <h2>, <h3>, <p> structure"
}

⚡ GPT-5 CONTENT RULES:
- Use advanced vocabulary appropriately
- Include unique perspectives only GPT-5 can provide
- Create content that stands out from GPT-4 output
- Ensure perfect JSON formatting
- NO Korean text in final output

TOPIC: ${topic}

Deploy your GPT-5 capabilities now! 🚀`;

    case 'google_optimized':
      return basePrompt + `

IMPORTANT FOR GEMINI: Please ensure your response is valid JSON format with proper escaping of quotes and special characters.`;

    case 'claude_optimized':
      return basePrompt + `

Please structure your response clearly. If you cannot provide JSON format, please organize your response with clear sections:
TITLE: [your title]
DESCRIPTION: [your description]
CATEGORIES: [comma-separated list]
TAGS: [comma-separated list]
CONTENT: [your HTML content]`;

    case 'creative':
      return basePrompt + `

Feel free to be creative and engaging. Structure your response with clear markers for easy parsing.`;

    default:
      return basePrompt;
  }
}

/**
 * 모델별 응답 처리 전략
 */
function processModelResponse(response, modelProfile, topic) {
  const strategy = modelProfile.strategy.fallbackBehavior;
  
  try {
    // JSON 우선 시도
    if (modelProfile.params.supportsJsonFormat && modelProfile.capabilities.jsonReliability === 'high') {
      return JSON.parse(response);
    }
    
    // 구조화된 파싱
    if (strategy === 'structured') {
      return extractJsonFromText(response);
    }
    
    // 텍스트 파싱 (Claude, Grok용)
    if (strategy === 'text_parsing' || strategy === 'aggressive_parsing') {
      return parseStructuredText(response, topic);
    }
    
    // 기본 JSON 추출
    return extractJsonFromText(response);
    
  } catch (error) {
    Logger.log(`모델별 파싱 실패: ${error.message}`);
    return createFallbackStructure(topic, response);
  }
}

/**
 * 구조화된 텍스트 파싱 (Claude, Grok용)
 */
function parseStructuredText(text, topic) {
  const result = {
    title: topic,
    seoDescription: "",
    categories: ["General"],
    tags: ["blog"],
    html: ""
  };
  
  // 제목 추출
  const titleMatch = text.match(/(?:TITLE|Title|제목):\s*(.+)/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }
  
  // 설명 추출
  const descMatch = text.match(/(?:DESCRIPTION|Description|설명):\s*(.+)/i);
  if (descMatch) {
    result.seoDescription = descMatch[1].trim();
  }
  
  // 카테고리 추출
  const catMatch = text.match(/(?:CATEGORIES|Categories|카테고리):\s*(.+)/i);
  if (catMatch) {
    result.categories = catMatch[1].split(',').map(c => c.trim());
  }
  
  // 태그 추출
  const tagMatch = text.match(/(?:TAGS|Tags|태그):\s*(.+)/i);
  if (tagMatch) {
    result.tags = tagMatch[1].split(',').map(t => t.trim());
  }
  
  // 내용 추출
  const contentMatch = text.match(/(?:CONTENT|Content|내용):\s*([\s\S]+)/i);
  if (contentMatch) {
    result.html = contentMatch[1].trim();
  } else {
    // 전체 텍스트를 HTML로 변환
    result.html = `<h2>${result.title}</h2>${text.replace(/\n/g, '</p><p>').replace(/^<p>/, '<p>').replace(/<\/p>$/, '</p>')}`;
  }
  
  return result;
}

/**
 * 폴백 구조 생성
 */
function createFallbackStructure(topic, originalResponse) {
  return {
    title: topic,
    seoDescription: `Learn about ${topic} and discover valuable insights.`,
    categories: ["General"],
    tags: ["information", "guide"],
    html: `
      <h2>${topic}</h2>
      <p>This comprehensive guide explores everything you need to know about ${topic}.</p>
      
      <h3>Key Information</h3>
      <p>${originalResponse.substring(0, 500).replace(/\n/g, '</p><p>')}</p>
      
      <h3>Conclusion</h3>
      <p>Understanding ${topic} can provide valuable insights and knowledge for readers.</p>
    `
  };
}

/**
 * OpenAI GPT로 글 생성 (프로파일 기반)
 */
function generateWithOpenAI(topic, apiKey, model = "gpt-4o-mini") {
  const profile = getModelProfile(model);
  const prompt = buildModelOptimizedPrompt(topic, profile);
  
  Logger.log(`OpenAI 모델 프로파일: ${JSON.stringify(profile.capabilities)}`);
  
  const payload = {
    model: model,
    messages: [{ role: "user", content: prompt }]
  };
  
  // 모델별 토큰 파라미터 설정
  payload[profile.params.maxTokensParam] = profile.params.maxTokens;
  
  // 온도 설정 (지원하는 모델만)
  if (profile.params.supportsTemperature) {
    payload.temperature = profile.params.defaultTemperature;
  }
  
  // JSON 형식 지원 여부
  if (profile.params.supportsJsonFormat) {
    payload.response_format = { type: "json_object" };
  }

  const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    const errorText = response.getContentText();
    throw new Error(`OpenAI API 오류: ${response.getResponseCode()} - ${errorText}`);
  }

  const data = JSON.parse(response.getContentText());
  const content = data.choices[0].message.content;
  
  // 모델 프로파일에 따른 응답 처리
  return processModelResponse(content, profile, topic);
}

/**
 * Google Gemini로 글 생성
 */
function generateWithGemini(topic, apiKey, model = "gemini-1.5-flash") {
  const prompt = buildStructuredPrompt(topic);
  
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      responseMimeType: "application/json"
    }
  };

  const response = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`Gemini API 오류: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/**
 * Anthropic Claude로 글 생성
 */
function generateWithClaude(topic, apiKey, model = "claude-3-5-haiku-20241022") {
  const prompt = buildStructuredPrompt(topic);
  
  const payload = {
    model: model,
    max_tokens: 4000,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }]
  };

  const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`Claude API 오류: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  const content = data.content[0].text;
  
  // JSON 추출
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude 응답에서 JSON을 찾을 수 없습니다");
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * xAI Grok으로 글 생성
 */
function generateWithGrok(topic, apiKey, model = "grok-beta") {
  const prompt = buildStructuredPrompt(topic);
  
  const payload = {
    messages: [{ role: "user", content: prompt }],
    model: model,
    temperature: 0.7,
    max_tokens: 4000
  };

  const response = UrlFetchApp.fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`Grok API 오류: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  const content = data.choices[0].message.content;
  
  // JSON 추출
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Grok 응답에서 JSON을 찾을 수 없습니다");
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * 텍스트에서 JSON 추출 (폴백 처리)
 */
function extractJsonFromText(text) {
  try {
    Logger.log("=== AI 응답 디버깅 ===");
    Logger.log("원본 응답 (처음 500자): " + text.substring(0, 500));
    
    // JSON 블록 찾기 (```json 또는 ``` 사이)
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      Logger.log("코드 블록에서 JSON 발견");
      const parsed = JSON.parse(jsonMatch[1]);
      Logger.log("파싱된 제목: " + (parsed.title || "제목 없음"));
      return parsed;
    }
    
    // 중괄호로 둘러싸인 JSON 찾기
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      Logger.log("중괄호 JSON 발견");
      const parsed = JSON.parse(braceMatch[0]);
      Logger.log("파싱된 제목: " + (parsed.title || "제목 없음"));
      return parsed;
    }
    
    // 폴백: 기본 구조 생성
    Logger.log("❌ JSON 추출 실패 - 폴백 구조 생성");
    Logger.log("텍스트 샘플: " + text.substring(0, 200));
    
    // 텍스트에서 제목 추출 시도
    const extractedTitle = extractTitle(text);
    const fallbackTitle = extractedTitle || "AI Generated Post";
    
    return {
      title: fallbackTitle,
      seoDescription: extractDescription(text) || "AI generated blog post",
      categories: ["General"],
      tags: ["ai", "generated"],
      subtopics: [],
      html: `<h2>${fallbackTitle}</h2><p>${text.replace(/\n/g, '</p><p>')}</p>`
    };
  } catch (error) {
    Logger.log("❌ JSON 추출 중 오류: " + error.message);
    Logger.log("❌ 원본 텍스트: " + text.substring(0, 300));
    throw new Error("AI 응답을 처리할 수 없습니다: " + error.message);
  }
}

/**
 * 텍스트에서 제목 추출
 */
function extractTitle(text) {
  const titleMatch = text.match(/(?:title|제목):\s*["']?([^"'\n]+)["']?/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * 텍스트에서 설명 추출
 */
function extractDescription(text) {
  const descMatch = text.match(/(?:description|설명):\s*["']?([^"'\n]+)["']?/i);
  return descMatch ? descMatch[1].trim() : null;
}

/**
 * 메인 AI 글 생성 함수 (단일 AI 선택)
 */
function generateHtml(topic) {
  const config = getConfig();
  
  if (!config.AI_API_KEY) {
    throw new Error("AI_API_KEY가 설정되지 않았습니다.");
  }
  
  // 모델 프로파일 정보 로그
  const modelProfile = getModelProfile(config.AI_MODEL);
  
  Logger.log(`=== AI 글 생성 시작 (프로파일 기반) ===`);
  Logger.log(`주제: ${topic}`);
  Logger.log(`AI 제공자: ${config.AI_PROVIDER}`);
  Logger.log(`모델: ${config.AI_MODEL}`);
  Logger.log(`JSON 신뢰도: ${modelProfile.capabilities.jsonReliability}`);
  Logger.log(`응답 형식: ${modelProfile.capabilities.responseFormat}`);
  Logger.log(`재시도 횟수: ${modelProfile.strategy.retryAttempts}`);
  
  let lastError = null;
  
  // 모델 프로파일에 따른 재시도 로직
  for (let attempt = 1; attempt <= modelProfile.strategy.retryAttempts; attempt++) {
    try {
      Logger.log(`시도 ${attempt}/${modelProfile.strategy.retryAttempts}`);
      let result;
      
      switch (config.AI_PROVIDER) {
        case 'openai':
          result = generateWithOpenAI(topic, config.AI_API_KEY, config.AI_MODEL);
          break;
          
        case 'gemini':
          result = generateWithGemini(topic, config.AI_API_KEY, config.AI_MODEL);
          break;
          
        case 'anthropic':
          result = generateWithClaude(topic, config.AI_API_KEY, config.AI_MODEL);
          break;
          
        case 'xai':
          result = generateWithGrok(topic, config.AI_API_KEY, config.AI_MODEL);
          break;
          
        default:
          throw new Error(`지원하지 않는 AI 제공자: ${config.AI_PROVIDER}`);
      }
      
      // 성공하면 결과 검증 후 반환
      if (result && result.title && result.html) {
        Logger.log(`✅ 시도 ${attempt}에서 성공`);
        return validateAndCleanResult(result, topic, modelProfile);
      } else {
        throw new Error("불완전한 응답 (제목 또는 내용 누락)");
      }
      
    } catch (error) {
      lastError = error;
      Logger.log(`❌ 시도 ${attempt} 실패: ${error.message}`);
      
      if (attempt < modelProfile.strategy.retryAttempts) {
        Logger.log(`${attempt + 1}번째 시도 준비 중...`);
        Utilities.sleep(1000); // 1초 대기
      }
    }
  }
  
  // 모든 시도 실패 시 최종 폴백
  Logger.log(`❌ 모든 시도 실패, 최종 폴백 모드 실행`);
  Logger.log(`마지막 오류: ${lastError ? lastError.message : '알 수 없음'}`);
  
  return createFallbackStructure(topic, `Failed after ${modelProfile.strategy.retryAttempts} attempts. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

/**
 * 결과 검증 및 정리
 */
function validateAndCleanResult(result, topic, modelProfile) {
  Logger.log("=== 결과 검증 및 정리 ===");
  
  // 제목 검증
  if (!result.title || result.title.trim() === "" || result.title === "Blog Post") {
    Logger.log("⚠️ 제목 보정: 주제 사용");
    result.title = topic;
  }
  
  // 내용 검증
  if (!result.html || result.html.trim() === "") {
    Logger.log("⚠️ 내용 보정: 기본 구조 생성");
    result.html = `<h2>${result.title}</h2><p>This comprehensive article explores ${topic} and provides valuable insights.</p>`;
  }
  
  // SEO 설명 검증
  if (!result.seoDescription || result.seoDescription.trim() === "") {
    result.seoDescription = `Learn about ${topic} and discover valuable insights.`;
  }
  
  // 카테고리 검증
  if (!result.categories || !Array.isArray(result.categories) || result.categories.length === 0) {
    result.categories = ["General"];
  }
  
  // 태그 검증
  if (!result.tags || !Array.isArray(result.tags) || result.tags.length === 0) {
    result.tags = ["information", "guide"];
  }
  
  Logger.log(`✅ 검증 완료: ${result.title}`);
  Logger.log(`HTML 길이: ${result.html.length}자`);
  Logger.log(`카테고리: ${result.categories.join(', ')}`);
  Logger.log(`태그: ${result.tags.join(', ')}`);
  
  return result;
}

/**
 * 모델 추천 함수
 */
function getRecommendedModel() {
  const recommendations = {
    'gpt-5-mini': {
      reason: '🚀 최신 GPT-5 기술, 우수한 품질, 합리적 비용 (추천!)',
      score: 98
    },
    'gpt-5-nano-2025-08-07': {
      reason: '🚀 최신 GPT-5 기술, 초저비용, 개선된 프롬프트로 품질 향상',
      score: 85
    },
    'gpt-4o-mini': {
      reason: '검증된 안정성, 높은 품질, 적당한 비용',
      score: 90
    },
    'gpt-4o': {
      reason: '최고 품질, 완벽한 JSON 응답, 높은 비용',
      score: 85
    },
    'gemini-1.5-flash': {
      reason: '빠른 응답, 좋은 품질, 저렴한 비용',
      score: 80
    },
    'claude-3-5-haiku-20241022': {
      reason: '우수한 품질, JSON 파싱 필요, 중간 비용',
      score: 75
    },
    'grok-beta': {
      reason: '창의적 내용, JSON 파싱 필요, 중간 비용',
      score: 70
    }
  };
  
  Logger.log("=== 🚀 GPT-5 우선 모델 추천 ===");
  Object.entries(recommendations).forEach(([model, info]) => {
    Logger.log(`${model}: ${info.reason} (점수: ${info.score})`);
  });
  
  return 'gpt-5-mini'; // GPT-5 mini 우선 추천
}

/**
 * AI 생성 테스트 함수
 */
function testAIGeneration() {
  Logger.log("=== AI 생성 테스트 시작 ===");
  
  try {
    const testTopic = "테스트 주제";
    const result = generateHtml(testTopic);
    
    Logger.log("=== 테스트 결과 ===");
    Logger.log(`제목: ${result.title}`);
    Logger.log(`설명: ${result.seoDescription}`);
    Logger.log(`카테고리: ${JSON.stringify(result.categories)}`);
    Logger.log(`태그: ${JSON.stringify(result.tags)}`);
    Logger.log(`HTML 내용 (처음 200자): ${result.html.substring(0, 200)}...`);
    
    return result;
  } catch (error) {
    Logger.log("❌ AI 생성 테스트 실패: " + error.message);
    throw error;
  }
}