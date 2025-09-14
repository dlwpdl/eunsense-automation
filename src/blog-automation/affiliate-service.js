/**
 * 어필리에이트 링크 관리 서비스
 */

/**
 * 포스트에 어필리에이트 링크를 삽입합니다 (Google Sheets 데이터 기반)
 * @param {string} htmlContent - 원본 HTML 콘텐츠
 * @param {string} postTitle - 포스트 제목
 * @param {string} affiliateLinksString - 시트의 AffiliateLinks 컬럼 데이터
 * @param {string} language - 언어 코드 (KO/EN)
 * @returns {string} - 어필리에이트 링크가 삽입된 HTML
 */
function injectAffiliateLinks(htmlContent, postTitle, affiliateLinksString = "", language = "EN") {
  try {
    const config = getConfig();
    
    if (!config.AFFILIATE_ENABLED) {
      Logger.log("🔗 어필리에이트 링크 기능이 비활성화됨");
      // 비활성화되어도 기본 어필리에이트 문구는 추가
      return addDefaultAffiliateSection(htmlContent, language);
    }

    Logger.log(`🔗 어필리에이트 링크 처리 시작: "${postTitle}"`);
    
    let finalHTML = htmlContent;
    
    // 시트에 어필리에이트 링크가 있으면 처리
    if (affiliateLinksString && affiliateLinksString.trim() !== "") {
      Logger.log(`📋 시트 어필리에이트 링크: ${affiliateLinksString}`);
      
      const affiliateProducts = parseAffiliateLinksFromSheet(affiliateLinksString);
      
      if (affiliateProducts.length > 0) {
        Logger.log(`✅ ${affiliateProducts.length}개 어필리에이트 제품 파싱 완료`);
        finalHTML = insertAffiliateLinksIntoHTML(htmlContent, affiliateProducts, config);
      }
    } else {
      Logger.log("📝 시트에 어필리에이트 링크 없음 → 기본 문구만 추가");
    }
    
    // 항상 마지막에 어필리에이트 문구 추가 (시트 링크 유무와 관계없이)
    finalHTML = addDefaultAffiliateSection(finalHTML, language);

    Logger.log(`🔗 어필리에이트 처리 완료`);
    
    return finalHTML;

  } catch (error) {
    Logger.log(`❌ 어필리에이트 링크 삽입 실패: ${error.message}`);
    return htmlContent;
  }
}

/**
 * 시트 AffiliateLinks 컬럼 데이터를 파싱합니다
 * 형식: "제품명1|링크1,제품명2|링크2" (간단한 형태)
 * @param {string} affiliateString - 시트의 AffiliateLinks 컬럼 데이터
 * @returns {Array} - 파싱된 제품 배열
 */
function parseAffiliateLinksFromSheet(affiliateString) {
  const products = [];
  
  try {
    // JSON 형태로 입력된 경우 시도
    if (affiliateString.trim().startsWith('[') || affiliateString.trim().startsWith('{')) {
      const jsonData = JSON.parse(affiliateString);
      if (Array.isArray(jsonData)) {
        return jsonData.map((item, index) => ({
          name: item.name || item.title || `제품 ${index + 1}`,
          link: item.link || item.url || '#',
          description: item.description || `${item.name || '제품'}에 대한 자세한 정보를 확인해보세요.`,
          buttonText: item.buttonText || item.button || '자세히 보기'
        }));
      }
    }
    
    // 간단한 파이프(|) 구분 형태로 파싱: "제품명1|링크1,제품명2|링크2"
    const items = affiliateString.split(',').map(item => item.trim()).filter(item => item.length > 0);
    
    items.forEach((item, index) => {
      const parts = item.split('|').map(part => part.trim());
      
      if (parts.length >= 2) {
        products.push({
          name: parts[0] || `제품 ${index + 1}`,
          link: parts[1] || '#',
          description: `${parts[0] || '제품'}에 대한 자세한 정보를 확인해보세요.`,
          buttonText: '자세히 보기'
        });
        
        Logger.log(`📦 파싱된 제품 ${index + 1}: "${parts[0]}" → ${parts[1]}`);
      } else {
        Logger.log(`⚠️ 잘못된 형식의 어필리에이트 데이터: "${item}"`);
      }
    });
    
  } catch (parseError) {
    Logger.log(`❌ 어필리에이트 링크 파싱 오류: ${parseError.message}`);
    
    // 파싱 실패시 단순 링크로 처리
    if (affiliateString.includes('http')) {
      const links = affiliateString.match(/https?:\/\/[^\s,]+/g) || [];
      links.forEach((link, index) => {
        products.push({
          name: `추천 제품 ${index + 1}`,
          link: link,
          price: '',
          description: '자세한 내용을 확인해보세요.',
          buttonText: '자세히 보기'
        });
      });
    }
  }
  
  return products;
}

/**
 * 키워드와 매칭되는 어필리에이트 제품 찾기
 * @param {Object} affiliateData - 어필리에이트 데이터
 * @param {Array} searchTerms - 검색할 키워드들
 * @returns {Array} - 매칭된 제품 배열
 */
function findMatchingAffiliateProducts(affiliateData, searchTerms) {
  const matchedProducts = [];
  
  for (const [category, products] of Object.entries(affiliateData)) {
    if (!Array.isArray(products)) continue;
    
    for (const product of products) {
      if (!product.keywords || !product.name || !product.link) continue;
      
      // 제품 키워드와 검색 키워드 매칭
      const productKeywords = product.keywords.map(k => k.toLowerCase());
      const matchScore = calculateMatchScore(productKeywords, searchTerms);
      
      if (matchScore > 0) {
        matchedProducts.push({
          ...product,
          category: category,
          matchScore: matchScore
        });
        
        Logger.log(`🎯 매칭: "${product.name}" (점수: ${matchScore})`);
      }
    }
  }
  
  // 매칭 점수 순으로 정렬하고 상위 제품만 선택
  const config = getConfig();
  return matchedProducts
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, config.MAX_AFFILIATE_LINKS_PER_POST || 3);
}

/**
 * 키워드 매칭 점수 계산
 * @param {Array} productKeywords - 제품 키워드들
 * @param {Array} searchTerms - 검색 키워드들
 * @returns {number} - 매칭 점수
 */
function calculateMatchScore(productKeywords, searchTerms) {
  let score = 0;
  
  for (const productKeyword of productKeywords) {
    for (const searchTerm of searchTerms) {
      // 완전 일치
      if (productKeyword === searchTerm) {
        score += 10;
      }
      // 부분 일치
      else if (searchTerm.includes(productKeyword) || productKeyword.includes(searchTerm)) {
        score += 5;
      }
      // 유사 단어
      else if (calculateSimilarity(productKeyword, searchTerm) > 0.7) {
        score += 3;
      }
    }
  }
  
  return score;
}

/**
 * 두 단어의 유사도 계산
 * @param {string} word1 
 * @param {string} word2 
 * @returns {number} - 0~1 사이의 유사도
 */
function calculateSimilarity(word1, word2) {
  const longer = word1.length > word2.length ? word1 : word2;
  const shorter = word1.length > word2.length ? word2 : word1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * 레벤슈타인 거리 계산
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * HTML 콘텐츠에 어필리에이트 링크 삽입
 * @param {string} htmlContent - 원본 HTML
 * @param {Array} products - 매칭된 제품들
 * @param {Object} config - 설정 객체
 * @returns {string} - 수정된 HTML
 */
function insertAffiliateLinksIntoHTML(htmlContent, products, config) {
  let updatedHTML = htmlContent;
  
  // 각 제품을 전략적으로 분산 배치 (클릭률 최적화)
  products.forEach((product, index) => {
    const affiliateHTML = createAffiliateHTML(product, index);
    
    // 전략적 분산 삽입으로 클릭률 향상
    if (index === 0) {
      // 첫 번째 제품: 첫 번째 H2 섹션 뒤 (관심도 높은 초반 섹션)
      updatedHTML = insertAfterFirstH2(updatedHTML, affiliateHTML);
    } else if (index === 1) {
      // 두 번째 제품: 글 중간 지점 (독자가 몰입한 상태)
      updatedHTML = insertAtMiddle(updatedHTML, affiliateHTML);
    } else {
      // 세 번째+ 제품: 글 마지막 (구매 결정 시점)
      updatedHTML = insertAtEnd(updatedHTML, affiliateHTML);
    }
  });
  
  return updatedHTML;
}

/**
 * 어필리에이트 제품 HTML 생성 (간단한 형태)
 * @param {Object} product - 제품 정보
 * @param {number} index - 제품 순서
 * @returns {string} - 어필리에이트 HTML
 */
function createAffiliateHTML(product, index) {
  const description = product.description || `${product.name}에 대한 자세한 정보를 확인해보세요.`;
  
  return `
<div class="affiliate-product-box" style="border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 8px; background: #f9f9f9;">
  <h4 style="margin: 0 0 10px 0; color: #333;">
    🛍️ ${product.name}
  </h4>
  <p style="margin: 10px 0; color: #666; font-size: 14px;">
    ${description}
  </p>
  <a href="${product.link}" 
     target="_blank" 
     rel="nofollow noopener" 
     style="display: inline-block; background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
    ${product.buttonText || '자세히 보기'}
  </a>
</div>`;
}

/**
 * 첫 번째 H2 섹션 뒤에 삽입
 */
function insertAfterFirstH2(html, affiliateHTML) {
  const h2Match = html.match(/<\/h2>/i);
  if (h2Match) {
    const index = h2Match.index + h2Match[0].length;
    return html.slice(0, index) + '\n\n' + affiliateHTML + '\n\n' + html.slice(index);
  }
  return html + '\n\n' + affiliateHTML;
}

/**
 * HTML 중간 지점에 삽입
 */
function insertAtMiddle(html, affiliateHTML) {
  const h2Matches = html.match(/<\/h2>/gi);
  if (h2Matches && h2Matches.length >= 2) {
    // 두 번째 H2 뒤에 삽입
    let count = 0;
    return html.replace(/<\/h2>/gi, (match) => {
      count++;
      if (count === 2) {
        return match + '\n\n' + affiliateHTML + '\n\n';
      }
      return match;
    });
  }
  return html + '\n\n' + affiliateHTML;
}

/**
 * HTML 마지막에 삽입
 */
function insertAtEnd(html, affiliateHTML) {
  return html + '\n\n' + affiliateHTML;
}

/**
 * 어필리에이트 고지 추가
 * @param {string} htmlContent - HTML 콘텐츠
 * @param {Object} config - 설정 객체
 * @returns {string} - 고지가 추가된 HTML
 */
function addAffiliateDisclaimer(htmlContent, config) {
  const disclaimer = `
<div class="affiliate-disclaimer" style="margin: 30px 0; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; font-size: 13px; color: #856404;">
  <strong>📢 알림:</strong> ${config.AFFILIATE_DISCLAIMER}
</div>`;
  
  return htmlContent + disclaimer;
}

/**
 * 항상 마지막에 추가되는 기본 어필리에이트 섹션
 * 시트에 어필리에이트 링크가 있든 없든 항상 추가됨
 * 언어별로 다른 문구 사용
 */
function addDefaultAffiliateSection(htmlContent, language = "EN") {
  // 한국어 버전
  if (language === "KO") {
    const affiliateSection = `

<hr style="margin: 40px 0; border: none; border-top: 2px solid #e9ecef;">

<div class="affiliate-section" style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; text-align: center;">
  <h3 style="color: white; margin-bottom: 15px; font-size: 20px;">💡 이 글이 도움이 되셨나요?</h3>
  <p style="color: #f8f9fa; margin-bottom: 20px; line-height: 1.6;">
    더 많은 유용한 도구와 서비스를 찾고 계신다면, 아래 링크들을 확인해보세요!
  </p>
  <div style="margin: 20px 0;">
    <p style="font-size: 14px; color: #e9ecef; margin-bottom: 10px;">
      <strong>🎯 추천 서비스:</strong>
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 15px;">
      <a href="#" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
        🤖 AI 도구
      </a>
      <a href="#" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
        💼 비즈니스 도구
      </a>
      <a href="#" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
        📊 분석 도구
      </a>
    </div>
  </div>
</div>

<div class="affiliate-disclaimer" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 5px; font-size: 13px; color: #495057;">
  <strong>💼 제휴 마케팅 안내:</strong> 이 포스트에는 제휴 마케팅 링크가 포함되어 있을 수 있습니다. 
  링크를 통해 구매하시면 저희에게 소정의 수수료가 지급되며, 이는 더 나은 콘텐츠 제작에 도움이 됩니다. 
  구매자에게는 추가 비용이 발생하지 않습니다.
</div>`;

    return htmlContent + affiliateSection;
  }
  
  // 영어 버전 (기본값)
  const affiliateSection = `

<hr style="margin: 40px 0; border: none; border-top: 2px solid #e9ecef;">

<div class="affiliate-section" style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; text-align: center;">
  <h3 style="color: white; margin-bottom: 15px; font-size: 20px;">💡 Found This Helpful?</h3>
  <p style="color: #f8f9fa; margin-bottom: 20px; line-height: 1.6;">
    Looking for more useful tools and services? Check out the links below!
  </p>
  <div style="margin: 20px 0;">
    <p style="font-size: 14px; color: #e9ecef; margin-bottom: 10px;">
      <strong>🎯 Recommended Services:</strong>
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 15px;">
      <a href="#" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
        🤖 AI Tools
      </a>
      <a href="#" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
        💼 Business Tools
      </a>
      <a href="#" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s ease;">
        📊 Analytics Tools
      </a>
    </div>
  </div>
</div>

<div class="affiliate-disclaimer" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 5px; font-size: 13px; color: #495057;">
  <strong>💼 Affiliate Marketing Disclosure:</strong> This post may contain affiliate marketing links. 
  If you purchase through these links, we may receive a small commission that helps us create better content. 
  There's no additional cost to you as the buyer.
</div>`;

  return htmlContent + affiliateSection;
}

/**
 * 어필리에이트 링크 설정 도우미 함수들
 */
function setAffiliateLinks() {
  Logger.log("📝 어필리에이트 링크 설정 방법:");
  Logger.log("1. Google Apps Script에서 Extensions → Properties 클릭");
  Logger.log("2. Script properties 탭 선택");
  Logger.log("3. 다음 키들을 추가:");
  Logger.log("");
  Logger.log("Property: AFFILIATE_ENABLED");
  Logger.log("Value: true");
  Logger.log("");
  Logger.log("Property: AFFILIATE_LINKS_JSON");
  Logger.log('Value: 예시 JSON 구조');
  Logger.log("");
  Logger.log("예시 JSON 구조:");
  Logger.log(`{
  "technology": [
    {
      "name": "MacBook Pro",
      "link": "https://your-affiliate-link.com/macbook",
      "price": "$1,299",
      "description": "최신 M3 칩 탑재 MacBook Pro",
      "keywords": ["macbook", "laptop", "apple", "computer"],
      "buttonText": "구매하기"
    }
  ],
  "software": [
    {
      "name": "Adobe Creative Suite",
      "link": "https://your-affiliate-link.com/adobe",
      "keywords": ["photoshop", "design", "adobe", "creative"],
      "buttonText": "무료 체험하기"
    }
  ]
}`);
  Logger.log("");
  Logger.log("Property: MAX_AFFILIATE_LINKS_PER_POST");
  Logger.log("Value: 3");
}

function showAffiliateStatus() {
  const config = getConfig();
  
  Logger.log("🔗 어필리에이트 링크 설정 상태:");
  Logger.log(`  활성화: ${config.AFFILIATE_ENABLED ? '✅' : '❌'}`);
  Logger.log(`  최대 링크 수: ${config.MAX_AFFILIATE_LINKS_PER_POST}개`);
  Logger.log(`  고지사항: "${config.AFFILIATE_DISCLAIMER}"`);
  
  try {
    const affiliateData = JSON.parse(config.AFFILIATE_LINKS_JSON);
    const categoryCount = Object.keys(affiliateData).length;
    const totalProducts = Object.values(affiliateData).reduce((sum, products) => 
      sum + (Array.isArray(products) ? products.length : 0), 0);
    
    Logger.log(`  설정된 카테고리: ${categoryCount}개`);
    Logger.log(`  총 제품 수: ${totalProducts}개`);
    
    Object.entries(affiliateData).forEach(([category, products]) => {
      if (Array.isArray(products)) {
        Logger.log(`    ${category}: ${products.length}개 제품`);
      }
    });
    
  } catch (error) {
    Logger.log("  JSON 파싱 오류 - 어필리에이트 링크 설정을 확인하세요");
  }
}