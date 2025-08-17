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

Topic: ${topic}
Current Date: ${currentMonth}/${currentYear}

⚠️ Important Restrictions:
1. Do NOT describe past years (before ${currentYear-1}) as "latest", "current", or "recent"
2. Do NOT make specific future predictions (beyond ${currentYear+1})
3. Do NOT use unverified facts or statistics
4. Do NOT use exaggerated expressions or clickbait titles
5. Do NOT include personal information or sensitive data
6. Do NOT write generic, surface-level content that readers can find anywhere else

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
7. Write in natural, native-level English
8. Include practical and useful information for readers
9. Only use accurate information relevant to current time (${currentMonth}/${currentYear})
10. Write content that sounds authentic and engaging to native English speakers

🎯 CONTENT QUALITY ENHANCEMENT:
11. Provide unique insights that readers haven't thought of before
12. Include unexpected perspectives or contrarian viewpoints when appropriate
13. Offer unconventional approaches to exploring the topic
14. Add surprising revelations or "plot twists" that challenge common assumptions
15. Go beyond surface-level information - dive deep into WHY things work the way they do
16. Connect seemingly unrelated concepts to create fresh understanding
17. Share counterintuitive findings or lesser-known facts
18. Present multiple angles and frameworks for understanding the topic
19. Challenge readers to think differently about familiar concepts
20. Make boring topics fascinating through creative storytelling and unique angles`;
}

/**
 * OpenAI GPT로 글 생성
 */
function generateWithOpenAI(topic, apiKey, model = "gpt-4o-mini") {
  const prompt = buildStructuredPrompt(topic);
  
  const payload = {
    model: model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4000,
    temperature: 0.7,
    response_format: { type: "json_object" }
  };

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
    throw new Error(`OpenAI API 오류: ${response.getResponseCode()}`);
  }

  const data = JSON.parse(response.getContentText());
  return JSON.parse(data.choices[0].message.content);
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