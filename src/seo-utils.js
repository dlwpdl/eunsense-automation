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
 * 한글 제목을 URL 슬러그로 변환
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거 (한글 유지)
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 중복 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

/**
 * 본문에서 키워드 추출
 */
function extractKeywords(html, limit = 10) {
  if (!html) return [];
  
  // HTML 태그 제거
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 불용어 목록
  const stopWords = new Set([
    '그리고', '하지만', '그러나', '또한', '따라서', '이렇게', '그렇게', '이런', '그런', '이것', '그것',
    '있다', '없다', '되다', '하다', '이다', '아니다', '같다', '다르다', '많다', '적다',
    '위해', '때문', '통해', '대해', '에서', '에게', '에도', '으로', '로서', '에서',
    '것은', '것이', '것을', '것과', '것에', '것도', '것만', '것의', '것으로'
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
 * SEO 메타데이터 생성
 */
function buildSEO(html, title) {
  const keywords = extractKeywords(html, 5);
  const slug = generateSlug(title);
  
  // 본문에서 첫 2문장 추출하여 설명 생성
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = textContent.split(/[.!?]\s+/).filter(s => s.length > 10);
  let description = sentences.slice(0, 2).join('. ').substring(0, 150);
  
  if (description.length >= 150) {
    description = description.substring(0, description.lastIndexOf(' ')) + '...';
  }
  
  // SEO 최적화된 제목 (60자 제한)
  let seoTitle = title;
  if (seoTitle.length > 57) {
    seoTitle = seoTitle.substring(0, 54) + '...';
  }
  
  return {
    seoTitle: seoTitle,
    seoDesc: description,
    slug: slug,
    keywords: keywords
  };
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