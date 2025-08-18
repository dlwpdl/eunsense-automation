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
 * 모델별 지원 파라미터 설정
 */
function getModelConfig(model) {
  const modelConfigs = {
    // GPT-4 계열
    'gpt-4o': {
      maxTokensParam: 'max_tokens',
      supportsTemperature: true,
      supportsJsonFormat: true,
      defaultTemperature: 0.7
    },
    'gpt-4o-mini': {
      maxTokensParam: 'max_tokens',
      supportsTemperature: true,
      supportsJsonFormat: true,
      defaultTemperature: 0.7
    },
    'gpt-4-turbo': {
      maxTokensParam: 'max_tokens',
      supportsTemperature: true,
      supportsJsonFormat: true,
      defaultTemperature: 0.7
    },
    'gpt-3.5-turbo': {
      maxTokensParam: 'max_tokens',
      supportsTemperature: true,
      supportsJsonFormat: true,
      defaultTemperature: 0.7
    },
    // GPT-5-nano 계열
    'gpt-5-nano-2025-08-07': {
      maxTokensParam: 'max_completion_tokens',
      supportsTemperature: false,
      supportsJsonFormat: true,
      defaultTemperature: 1
    }
  };
  
  // 정확한 모델명이 있으면 사용, 없으면 패턴 매칭
  if (modelConfigs[model]) {
    return modelConfigs[model];
  }
  
  // 패턴 매칭으로 폴백
  if (model.includes('gpt-5-nano')) {
    return modelConfigs['gpt-5-nano-2025-08-07'];
  }
  
  // 기본값 (대부분의 GPT 모델)
  return modelConfigs['gpt-4o-mini'];
}

/**
 * OpenAI GPT로 글 생성
 */
function generateWithOpenAI(topic, apiKey, model = "gpt-4o-mini") {
  const prompt = buildStructuredPrompt(topic);
  const config = getModelConfig(model);
  
  const payload = {
    model: model,
    messages: [{ role: "user", content: prompt }]
  };
  
  // 모델별 토큰 파라미터 설정
  payload[config.maxTokensParam] = 4000;
  
  // 온도 설정 (지원하는 모델만)
  if (config.supportsTemperature) {
    payload.temperature = config.defaultTemperature;
  }
  
  // JSON 형식 지원 여부
  if (config.supportsJsonFormat) {
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
  
  // JSON 형식 응답 처리 시도
  try {
    return JSON.parse(content);
  } catch (jsonError) {
    // JSON이 아닌 경우 텍스트에서 JSON 추출 시도
    Logger.log("JSON 파싱 실패, 텍스트에서 JSON 추출 시도");
    return extractJsonFromText(content);
  }
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
    // JSON 블록 찾기 (```json 또는 ``` 사이)
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // 중괄호로 둘러싸인 JSON 찾기
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    
    // 폴백: 기본 구조 생성
    Logger.log("JSON 추출 실패, 기본 구조 생성");
    return {
      title: extractTitle(text) || "Blog Post",
      seoDescription: extractDescription(text) || "Blog post description",
      categories: ["General"],
      tags: ["blog", "post"],
      subtopics: [],
      html: `<p>${text.replace(/\n/g, '</p><p>')}</p>`
    };
  } catch (error) {
    Logger.log("JSON 추출 중 오류: " + error.message);
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
  
  Logger.log(`${config.AI_PROVIDER} AI로 글 생성: ${topic}`);
  
  switch (config.AI_PROVIDER) {
    case 'openai':
      return generateWithOpenAI(topic, config.AI_API_KEY, config.AI_MODEL);
      
    case 'gemini':
      return generateWithGemini(topic, config.AI_API_KEY, config.AI_MODEL);
      
    case 'anthropic':
      return generateWithClaude(topic, config.AI_API_KEY, config.AI_MODEL);
      
    case 'xai':
      return generateWithGrok(topic, config.AI_API_KEY, config.AI_MODEL);
      
    default:
      throw new Error(`지원하지 않는 AI 제공자: ${config.AI_PROVIDER}`);
  }
}