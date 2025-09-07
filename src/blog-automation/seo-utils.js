/**
 * 🚀 고급 SEO 최적화 유틸리티 
 * 키워드 밀도, 시맨틱 SEO, Featured Snippets, Voice Search 최적화
 */

/**
 * HTML 본문 정리 (H1 제거, 중복 헤딩 처리)
 */
function sanitizeHtmlBeforePublish(html, postTitle) {
  if (!html) return html || "";
  let out = String(html);

  // 1) 첫 번째 <h1>...</h1> 제거 (WP가 포스트 타이틀을 렌더링하므로)
  out = out.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");

  // 2) 남아있는 H1이 있으면 H2로 강등
  out = out.replace(/<h1([^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");

  // 3) 제목과 같은 텍스트의 헤딩이 바로 이어서 한 번 더 나오면 제거
  if (postTitle) {
    const t = postTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const dupRe = new RegExp(`<(h2|h3)[^>]*>\\s*${t}\\s*</\\1>\\s*`, "i");
    out = out.replace(dupRe, "");
  }
  return out;
}

/**
 * 영어 제목을 SEO 최적화된 URL 슬러그로 변환
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거 (영어, 숫자, 하이픈만 유지)
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 중복 하이픈 제거
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .substring(0, 60); // 60자 제한 (SEO 권장사항)
}

/**
 * 🎯 고급 SEO 키워드 추출 (단어 + 구문 + 시맨틱 분석)
 */
function extractKeywords(html, limit = 10) {
  if (!html) return [];
  
  // HTML 태그 제거
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 확장된 영어 불용어 목록
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'now', 'here', 'there',
    'also', 'even', 'still', 'since', 'after', 'before', 'while', 'because', 'if', 'then', 'else', 'may', 'might', 'must', 'shall'
  ]);
  
  // 1. 단일 키워드 분석
  const words = text.toLowerCase().split(/\s+/)
    .filter(word => word.length >= 3) // 3글자 이상
    .filter(word => !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word)) // 숫자만인 것 제외
    .filter(word => /^[a-zA-Z-]+$/.test(word)); // 영어 단어만
  
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // 2. 2-3 단어 구문 분석 (롱테일 키워드)
  const phrases = extractPhrases(text, 2, 3);
  const phraseCount = {};
  phrases.forEach(phrase => {
    phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
  });
  
  // 3. 전문 용어 및 브랜드명 우대
  const specialTerms = extractSpecialTerms(text);
  specialTerms.forEach(term => {
    if (wordCount[term.toLowerCase()]) {
      wordCount[term.toLowerCase()] += 2; // 가중치 부여
    }
  });
  
  // 4. 빈도순 정렬 및 조합
  const topWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, Math.ceil(limit * 0.6))
    .map(([word]) => word);
    
  const topPhrases = Object.entries(phraseCount)
    .filter(([,count]) => count >= 2) // 최소 2회 언급
    .sort(([,a], [,b]) => b - a)
    .slice(0, Math.ceil(limit * 0.4))
    .map(([phrase]) => phrase);
  
  return [...topPhrases, ...topWords].slice(0, limit);
}

/**
 * 구문 추출 (2-3 단어 조합)
 */
function extractPhrases(text, minWords = 2, maxWords = 3) {
  const sentences = text.toLowerCase().split(/[.!?]+/);
  const phrases = [];
  
  sentences.forEach(sentence => {
    const words = sentence.split(/\s+/).filter(w => w.length > 2);
    
    for (let len = minWords; len <= maxWords; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 8 && phrase.length < 50) {
          phrases.push(phrase);
        }
      }
    }
  });
  
  return phrases;
}

/**
 * 전문 용어 및 브랜드명 식별
 */
function extractSpecialTerms(text) {
  const specialTerms = [];
  
  // 대문자로 시작하는 전문 용어 (브랜드명, 제품명)
  const capitalizedWords = text.match(/\b[A-Z][a-zA-Z0-9]{2,}\b/g) || [];
  specialTerms.push(...capitalizedWords);
  
  // 기술 용어 패턴 (API, SDK, AI, ML 등)
  const techTerms = text.match(/\b[A-Z]{2,5}\b/g) || [];
  specialTerms.push(...techTerms);
  
  // 버전 번호나 모델명 (iPhone 15, Windows 11 등)
  const modelTerms = text.match(/\b[A-Za-z]+\s+\d+(?:\.\d+)?\b/g) || [];
  specialTerms.push(...modelTerms);
  
  return [...new Set(specialTerms)];
}

/**
 * SEO 메타데이터 생성 (고급 최적화) - ProductNames 집중
 */
function buildSEO(html, title, productNames = null) {
  // ProductNames를 최우선 키워드로 활용
  let keywords = extractKeywords(html, 8);
  
  // 제품명이 있으면 SEO 키워드에 우선 포함
  if (productNames) {
    const productKeywords = productNames.split(/[,|;]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // 제품명을 키워드 목록 앞쪽에 추가
    keywords = [...productKeywords, ...keywords.filter(k => 
      !productKeywords.some(p => p.toLowerCase().includes(k.toLowerCase()))
    )];
    keywords = keywords.slice(0, 10);
    Logger.log(`SEO 키워드 우선순위: 제품명 '${productNames}' 포함`);
  }
  
  const slug = generateSlug(title);
  
  // 본문에서 핵심 문장 추출하여 설명 생성
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = textContent.split(/[.!?]\s+/).filter(s => s.length > 20);
  
  // 가장 정보가 풍부한 문장들 선택 (키워드가 많이 포함된)
  const scoredSentences = sentences.map(sentence => {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (sentence.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    return { sentence, score };
  });
  
  scoredSentences.sort((a, b) => b.score - a.score);
  
  let description = scoredSentences.slice(0, 2)
    .map(item => item.sentence)
    .join('. ')
    .substring(0, 155);
  
  if (description.length >= 155) {
    description = description.substring(0, description.lastIndexOf(' ')) + '...';
  }
  
  // SEO 최적화된 제목 (ProductNames 우선, 60자 제한)
  let seoTitle = title;
  
  // 제품명이 제목에 없으면 추가 (SEO 향상)
  if (productNames) {
    const primaryProduct = productNames.split(/[,|;]/)[0].trim();
    if (!seoTitle.toLowerCase().includes(primaryProduct.toLowerCase())) {
      // 제품명을 제목 앞부분에 자연스럽게 통합
      if (seoTitle.length + primaryProduct.length < 55) {
        seoTitle = `${primaryProduct}: ${seoTitle}`;
      } else {
        seoTitle = `${primaryProduct} ${seoTitle}`;
      }
      Logger.log(`SEO 제목에 주요 제품명 '${primaryProduct}' 추가`);
    }
  } else {
    // 제품명이 없을 때만 파워 워드 추가
    const powerWords = ['Ultimate', 'Complete', 'Essential', 'Proven', 'Expert', 'Advanced'];
    const hasActionWord = /\b(how|why|what|when|where|guide|tips|secrets|strategies)\b/i.test(seoTitle);
    
    if (seoTitle.length < 45 && !hasActionWord) {
      const randomPowerWord = powerWords[Math.floor(Math.random() * powerWords.length)];
      seoTitle = `${randomPowerWord} ${seoTitle}`;
    }
  }
  
  if (seoTitle.length > 60) {
    seoTitle = seoTitle.substring(0, 57) + '...';
  }
  
  // 추가 SEO 데이터
  const readingTime = Math.ceil(textContent.split(' ').length / 200); // 분당 200단어 기준
  const headings = extractHeadings(html);
  
  // 키워드 밀도 분석
  const keywordDensity = analyzeKeywordDensity(textContent, keywords);
  
  // FAQ 및 Voice Search 최적화
  const faqSections = extractFAQOpportunities(textContent, keywords);
  
  // 구조화된 데이터 준비
  const structuredData = generateStructuredData(seoTitle, description, keywords, readingTime);
  
  return {
    seoTitle: seoTitle,
    seoDesc: description,
    slug: slug,
    keywords: keywords,
    readingTime: readingTime,
    headings: headings,
    wordCount: textContent.split(' ').length,
    keywordDensity: keywordDensity,
    faqSections: faqSections,
    structuredData: structuredData,
    seoScore: calculateSEOScore(seoTitle, description, keywords, textContent)
  };
}

/**
 * HTML에서 헤딩 구조 추출
 */
function extractHeadings(html) {
  const headings = [];
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: match[1],
      text: match[2].replace(/<[^>]*>/g, '').trim()
    });
  }
  
  return headings;
}

/**
 * 내부 링크 자동 삽입
 */
function addInternalLinks(html, siteUrl, existingPosts = []) {
  if (!html || !siteUrl || !existingPosts.length) return html;
  
  let result = html;
  
  // 기존 포스트와 연관성 있는 키워드 매칭
  existingPosts.forEach(post => {
    if (post.title && post.url) {
      const keywords = post.title.split(' ').filter(word => word.length >= 3);
      
      keywords.forEach(keyword => {
        // 이미 링크가 걸려있지 않은 키워드에만 링크 추가
        const regex = new RegExp(`(?<!<[^>]*>)\\b${keyword}\\b(?![^<]*>)`, 'gi');
        const linkHtml = `<a href="${post.url}" target="_blank">${keyword}</a>`;
        
        // 첫 번째 매치만 링크로 변경 (과도한 링크 방지)
        result = result.replace(regex, (match, offset) => {
          const beforeLink = result.substring(0, offset);
          const linkCount = (beforeLink.match(new RegExp(linkHtml, 'g')) || []).length;
          
          return linkCount === 0 ? linkHtml : match;
        });
      });
    }
  });
  
  return result;
}

/**
 * 🎯 키워드 밀도 분석 (SEO 최적화)
 */
function analyzeKeywordDensity(text, keywords) {
  const totalWords = text.split(/\s+/).length;
  const density = {};
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = (text.match(regex) || []).length;
    const keywordDensity = ((matches / totalWords) * 100).toFixed(2);
    
    density[keyword] = {
      count: matches,
      density: parseFloat(keywordDensity),
      optimal: parseFloat(keywordDensity) >= 0.5 && parseFloat(keywordDensity) <= 2.5
    };
  });
  
  return density;
}

/**
 * 📋 FAQ 섹션 및 Voice Search 최적화
 */
function extractFAQOpportunities(text, keywords) {
  const faqPatterns = [
    'what is', 'what are', 'how to', 'how do', 'how can', 'why is', 'why do', 'why does',
    'when to', 'when is', 'where to', 'where is', 'which is', 'which are'
  ];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.length > 20);
  const faqOpportunities = [];
  
  keywords.forEach(keyword => {
    faqPatterns.forEach(pattern => {
      const question = `${pattern} ${keyword}`;
      const relatedSentences = sentences.filter(sentence => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (relatedSentences.length > 0) {
        faqOpportunities.push({
          question: question.replace(/\b\w/g, l => l.toUpperCase()) + '?',
          answer: relatedSentences[0].trim().substring(0, 200) + '...',
          keyword: keyword
        });
      }
    });
  });
  
  return faqOpportunities.slice(0, 5); // 최대 5개 FAQ
}

/**
 * 🏗️ 구조화된 데이터 (Schema Markup) 생성
 */
function generateStructuredData(title, description, keywords, readingTime) {
  const currentDate = new Date().toISOString();
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "keywords": keywords.join(', '),
    "datePublished": currentDate,
    "dateModified": currentDate,
    "author": {
      "@type": "Organization",
      "name": "AI-Powered Blog"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "AI Blog Publisher"
    },
    "mainEntityOfPage": {
      "@type": "WebPage"
    },
    "articleSection": "Technology",
    "wordCount": readingTime * 200, // 대략적인 단어 수
    "timeRequired": `PT${readingTime}M`
  };
}

/**
 * 📊 종합 SEO 점수 계산
 */
function calculateSEOScore(title, description, keywords, content) {
  let score = 0;
  const maxScore = 100;
  
  // 제목 최적화 (20점)
  if (title.length >= 30 && title.length <= 60) score += 10;
  if (keywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) score += 10;
  
  // 설명 최적화 (20점)
  if (description.length >= 120 && description.length <= 155) score += 10;
  if (keywords.some(k => description.toLowerCase().includes(k.toLowerCase()))) score += 10;
  
  // 키워드 밀도 (30점)
  const density = analyzeKeywordDensity(content, keywords);
  const optimalKeywords = Object.values(density).filter(d => d.optimal).length;
  score += Math.min(30, (optimalKeywords / keywords.length) * 30);
  
  // 콘텐츠 길이 (15점)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 1000) score += 15;
  else if (wordCount >= 500) score += 10;
  else if (wordCount >= 300) score += 5;
  
  // 헤딩 구조 (15점)
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count >= 3 && h2Count <= 6) score += 15;
  else if (h2Count >= 1) score += 10;
  
  return {
    total: Math.round(score),
    maxScore: maxScore,
    percentage: Math.round((score / maxScore) * 100),
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
  };
}

/**
 * ✨ Featured Snippets 최적화를 위한 HTML 강화
 */
function enhanceForFeaturedSnippets(html, keywords) {
  let enhanced = html;
  
  // 1. 정의 섹션 추가
  const definitions = extractDefinitions(html, keywords);
  if (definitions.length > 0) {
    const definitionHtml = `
<div class="definition-section" style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #007cba;">
  <h3>📖 Key Definitions</h3>
  ${definitions.map(def => `<p><strong>${def.term}:</strong> ${def.definition}</p>`).join('')}
</div>`;
    enhanced = definitionHtml + enhanced;
  }
  
  // 2. 단계별 가이드 최적화
  enhanced = enhanceStepByStepGuides(enhanced);
  
  // 3. 비교 테이블 최적화
  enhanced = enhanceComparisonTables(enhanced);
  
  return enhanced;
}

/**
 * 정의 추출
 */
function extractDefinitions(html, keywords) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const definitions = [];
  
  keywords.forEach(keyword => {
    const patterns = [
      new RegExp(`${keyword}\\s+is\\s+([^.!?]{20,100})`, 'i'),
      new RegExp(`${keyword}\\s+refers\\s+to\\s+([^.!?]{20,100})`, 'i'),
      new RegExp(`${keyword}\\s+means\\s+([^.!?]{20,100})`, 'i')
    ];
    
    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        definitions.push({
          term: keyword,
          definition: match[1].trim()
        });
      }
    });
  });
  
  return definitions.slice(0, 3); // 최대 3개 정의
}

/**
 * 단계별 가이드 강화
 */
function enhanceStepByStepGuides(html) {
  // 순서 있는 목록을 더 명확하게 표시
  return html.replace(/<ol([^>]*)>/gi, '<ol$1 style="counter-reset: step-counter; padding-left: 0;">')
           .replace(/<li([^>]*)>/gi, '<li$1 style="counter-increment: step-counter; margin-bottom: 15px; padding-left: 30px; position: relative;">');
}

/**
 * 비교 테이블 최적화
 */
function enhanceComparisonTables(html) {
  // 기존 테이블에 반응형 스타일 추가
  return html.replace(/<table([^>]*)>/gi, '<div style="overflow-x: auto;"><table$1 style="width: 100%; border-collapse: collapse; margin: 20px 0;">')
           .replace(/<\/table>/gi, '</table></div>')
           .replace(/<th([^>]*)>/gi, '<th$1 style="background: #f4f4f4; padding: 12px; border: 1px solid #ddd; text-align: left;">')
           .replace(/<td([^>]*)>/gi, '<td$1 style="padding: 12px; border: 1px solid #ddd;">');
}

/**
 * 스키마 마크업 생성
 */
function generateSchemaMarkup(title, description, author, publishDate, imageUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author || "Eunsense Blog"
    },
    "datePublished": publishDate || new Date().toISOString(),
    "dateModified": publishDate || new Date().toISOString()
  };
  
  if (imageUrl) {
    schema.image = {
      "@type": "ImageObject",
      "url": imageUrl
    };
  }
  
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}