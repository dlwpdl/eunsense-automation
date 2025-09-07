/**
 * SEO 최적화 유틸리티
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
 * 영어 본문에서 SEO 키워드 추출
 */
function extractKeywords(html, limit = 10) {
  if (!html) return [];
  
  // HTML 태그 제거
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 영어 불용어 목록
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'now', 'here', 'there'
  ]);
  
  // 단어 빈도 계산
  const words = text.split(/\s+/)
    .filter(word => word.length >= 2) // 2글자 이상
    .filter(word => !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word)); // 숫자만인 것 제외
  
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // 빈도순 정렬
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
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
  
  return {
    seoTitle: seoTitle,
    seoDesc: description,
    slug: slug,
    keywords: keywords,
    readingTime: readingTime,
    headings: headings,
    wordCount: textContent.split(' ').length
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