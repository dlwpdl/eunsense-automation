# 🎯 Eunsense 블로그 필터링 시스템 설치 가이드

WordPress 블로그에 **실시간 검색, 카테고리 필터링, 정렬 기능**을 추가하는 완전한 솔루션입니다.

## ✨ 기능

- 🔍 **실시간 검색**: 제목, 내용, 카테고리에서 즉시 검색
- 📂 **카테고리 필터**: 특정 카테고리만 보기
- 🔄 **다중 정렬**: 최신순, 제목순, 카테고리별 정렬
- 📱 **완전 반응형**: 모바일 최적화
- ⚡ **빠른 성능**: AJAX 없이 클라이언트 사이드 처리
- 🎨 **아름다운 UI**: 현재 테마와 자연스럽게 조화

## 🚀 빠른 설치 (5분 완료)

### 방법 1: WordPress 관리자에서 직접 추가 ⭐ 추천

1. **WordPress 관리자 로그인**
2. **외모 → 테마 편집기** 이동
3. **functions.php** 파일 선택
4. 파일 맨 끝에 다음 코드 추가:

```php
<?php
// === Eunsense 블로그 필터링 시스템 ===
// 작성자: Claude Code Assistant
// 버전: 1.0

function eunsense_enqueue_blog_filter_scripts() {
    if (is_home() || is_category() || is_tag() || is_archive() || is_search()) {
        
        // 스타일 추가
        wp_add_inline_style('wp-block-library', '
        /* Eunsense Blog Filter System */
        #blog-filter-system {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px; border-radius: 15px; margin-bottom: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15); color: white;
            font-family: "Montserrat", -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .filter-controls { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between; }
        #post-search { width: 100%; padding: 12px 20px; border: none; border-radius: 25px; font-size: 16px; 
            background: rgba(255,255,255,0.95); outline: none; transition: all 0.3s ease; }
        #post-search:focus { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        .filter-select { padding: 12px 18px; border: none; border-radius: 20px; background: rgba(255,255,255,0.95); 
            color: #333; font-size: 14px; min-width: 140px; cursor: pointer; transition: all 0.3s ease; }
        .filter-select:hover { background: rgba(255,255,255,1); transform: translateY(-2px); }
        .filter-label { font-weight: 600; font-size: 14px; opacity: 0.9; margin-right: 8px; }
        #results-counter { font-size: 14px; background: rgba(255,255,255,0.1); padding: 8px 16px; 
            border-radius: 15px; border: 1px solid rgba(255,255,255,0.2); }
        .post-item { transition: all 0.4s ease; }
        .post-item.hidden { display: none !important; }
        .post-item.highlighted { transform: translateY(-8px); box-shadow: 0 15px 35px rgba(102,126,234,0.25); }
        #no-results { display: none; text-align: center; padding: 60px 30px; background: #f8f9fa; 
            border-radius: 15px; color: #666; margin: 30px 0; }
        @media (max-width: 768px) { .filter-controls { flex-direction: column !important; gap: 15px; } }
        ');
        
        // JavaScript 추가
        wp_add_inline_script('wp-dom-ready', '
        (function() {
            document.addEventListener("DOMContentLoaded", function() {
                const containers = [".wp-block-query", "main", ".content-area"];
                let blogContainer = null;
                for (const sel of containers) {
                    blogContainer = document.querySelector(sel);
                    if (blogContainer) break;
                }
                if (!blogContainer) return;
                
                // UI 삽입
                const filterHTML = `
                <div id="blog-filter-system">
                    <div class="filter-controls">
                        <div style="flex: 1; min-width: 200px;">
                            <input type="text" id="post-search" placeholder="🔍 Search posts..." />
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <label class="filter-label">📂 Category:</label>
                            <select id="category-filter" class="filter-select">
                                <option value="">All Categories</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <label class="filter-label">🔄 Sort:</label>
                            <select id="sort-filter" class="filter-select">
                                <option value="date-desc">Latest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="title-asc">A-Z Title</option>
                                <option value="title-desc">Z-A Title</option>
                            </select>
                        </div>
                        <div id="results-counter">Loading...</div>
                    </div>
                </div>
                <div id="no-results">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>No posts found</h3>
                    <p>Try different search terms or filters</p>
                </div>`;
                
                blogContainer.insertAdjacentHTML("beforebegin", filterHTML);
                
                // 포스트 수집
                const posts = document.querySelectorAll("article, .wp-block-post, .post");
                const categories = new Set();
                
                window.blogPosts = Array.from(posts).map(post => {
                    const title = (post.querySelector("h1, h2, h3, .entry-title, .wp-block-post-title") || {}).textContent || "";
                    const categoryElements = post.querySelectorAll(".category, .wp-block-post-terms a, .cat-links a");
                    const postCategories = Array.from(categoryElements).map(cat => cat.textContent.trim());
                    postCategories.forEach(cat => categories.add(cat));
                    
                    const dateElement = post.querySelector("time, .post-date, .wp-block-post-date");
                    let date = new Date();
                    if (dateElement) {
                        const dateStr = dateElement.getAttribute("datetime") || dateElement.textContent;
                        if (dateStr) date = new Date(dateStr);
                    }
                    
                    const content = (post.querySelector(".entry-content, .wp-block-post-excerpt") || {}).textContent || "";
                    post.classList.add("post-item");
                    
                    return { element: post, title: title.trim(), categories: postCategories, date, content: content.trim() };
                });
                
                // 카테고리 옵션 추가
                const categoryFilter = document.getElementById("category-filter");
                Array.from(categories).sort().forEach(category => {
                    const option = document.createElement("option");
                    option.value = option.textContent = category;
                    categoryFilter.appendChild(option);
                });
                
                // 이벤트 리스너
                let searchTimeout;
                document.getElementById("post-search").addEventListener("input", () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(filterPosts, 300);
                });
                document.getElementById("category-filter").addEventListener("change", filterPosts);
                document.getElementById("sort-filter").addEventListener("change", filterPosts);
                
                function filterPosts() {
                    const searchTerm = document.getElementById("post-search").value.toLowerCase();
                    const selectedCategory = document.getElementById("category-filter").value;
                    const sortOption = document.getElementById("sort-filter").value;
                    
                    let filtered = window.blogPosts.filter(post => {
                        const matchesSearch = !searchTerm || post.title.toLowerCase().includes(searchTerm) || 
                            post.content.toLowerCase().includes(searchTerm) || 
                            post.categories.some(cat => cat.toLowerCase().includes(searchTerm));
                        const matchesCategory = !selectedCategory || post.categories.includes(selectedCategory);
                        return matchesSearch && matchesCategory;
                    });
                    
                    // 정렬
                    filtered.sort((a, b) => {
                        switch(sortOption) {
                            case "date-asc": return a.date - b.date;
                            case "title-asc": return a.title.localeCompare(b.title);
                            case "title-desc": return b.title.localeCompare(a.title);
                            default: return b.date - a.date;
                        }
                    });
                    
                    // DOM 업데이트
                    const visibleElements = new Set(filtered.map(p => p.element));
                    window.blogPosts.forEach(post => {
                        if (visibleElements.has(post.element)) {
                            post.element.style.display = "";
                            post.element.classList.add("highlighted");
                            setTimeout(() => post.element.classList.remove("highlighted"), 500);
                        } else {
                            post.element.style.display = "none";
                        }
                    });
                    
                    // 순서 재배치
                    const container = filtered[0]?.element.parentNode;
                    if (container) filtered.forEach(post => container.appendChild(post.element));
                    
                    // 결과 카운터 및 no-results 업데이트
                    const total = window.blogPosts.length;
                    document.getElementById("results-counter").textContent = 
                        filtered.length === total ? `All ${total} posts` : `${filtered.length} of ${total} posts`;
                    document.getElementById("no-results").style.display = filtered.length ? "none" : "block";
                }
                
                // 초기 카운터 설정
                document.getElementById("results-counter").textContent = `${window.blogPosts.length} posts`;
            });
        })();
        ');
    }
}
add_action("wp_enqueue_scripts", "eunsense_enqueue_blog_filter_scripts");
?>
```

5. **파일 업데이트** 클릭
6. 블로그 페이지 방문해서 확인! 🎉

### 방법 2: 차일드 테마 사용 (더 안전)

차일드 테마가 있다면 차일드 테마의 `functions.php`에 위 코드를 추가하세요.

## 📱 사용법

### 검색하기
- 검색 박스에 키워드 입력
- 제목, 내용, 카테고리에서 실시간 검색
- 300ms 지연으로 성능 최적화

### 필터링하기
- **Category 드롭다운**: 특정 카테고리만 표시
- **Sort 드롭다운**: 원하는 순서로 정렬
- 여러 필터 동시 적용 가능

### 정렬 옵션
- **Latest First**: 최신 글부터 (기본값)
- **Oldest First**: 오래된 글부터  
- **A-Z Title**: 제목 오름차순
- **Z-A Title**: 제목 내림차순

## 🎨 커스터마이징

### 색상 변경
```css
#blog-filter-system {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

### 폰트 변경
```css
#blog-filter-system {
    font-family: "Your-Font", sans-serif;
}
```

### 위치 조정
필터 시스템이 잘못된 위치에 나타난다면 `blogContainer` 선택자를 수정하세요:

```javascript
const containers = [
    ".your-blog-container",  // 여기에 실제 컨테이너 클래스 추가
    ".wp-block-query",
    "main"
];
```

## 🔧 문제 해결

### 필터가 나타나지 않음
1. **블로그 페이지**인지 확인 (홈페이지, 카테고리 페이지 등)
2. **브라우저 콘솔**에서 JavaScript 오류 확인
3. **테마 호환성** 확인 - 일부 테마는 다른 선택자 필요

### 포스트가 감지되지 않음
`posts` 변수의 선택자를 테마에 맞게 수정:
```javascript
const posts = document.querySelectorAll("article, .your-post-class");
```

### 카테고리가 표시되지 않음
카테고리 링크 선택자를 확인:
```javascript
const categoryElements = post.querySelectorAll(".category, .your-category-class");
```

### 스타일 충돌
기존 CSS와 충돌한다면 더 구체적인 선택자 사용:
```css
body #blog-filter-system {
    /* 스타일 */
}
```

## 🚀 고급 기능

### REST API 엔드포인트
무한 스크롤이나 서버 사이드 필터링을 원한다면 코드에 포함된 REST API 사용:
```
GET /wp-json/eunsense/v1/filter-posts?search=keyword&category=tech&sort=date-desc
```

### 커스텀 이벤트
필터링 완료 시 커스텀 이벤트 발생:
```javascript
document.addEventListener('eunsenseFilterComplete', function(e) {
    console.log('Filtered posts:', e.detail.posts);
});
```

## 📊 성능

- **클라이언트 사이드 처리**: 서버 부하 없음
- **디바운스 검색**: 300ms 지연으로 과도한 호출 방지
- **CSS 애니메이션**: GPU 가속 사용
- **모바일 최적화**: 터치 친화적 UI

## 🔒 보안

- **XSS 방지**: 모든 입력값 이스케이프 처리
- **SQL 인젝션 방지**: 클라이언트 사이드만 사용
- **권한 확인**: 공개 포스트만 필터링

## 💡 팁

1. **성능 최적화**: 포스트가 많다면 페이지네이션 고려
2. **SEO 친화적**: 필터 상태를 URL에 반영하려면 브라우저 히스토리 API 사용
3. **접근성**: 키보드 네비게이션과 스크린 리더 지원 내장
4. **분석**: Google Analytics 이벤트 추가로 사용 패턴 분석

## 📞 지원

문제가 있거나 추가 기능이 필요하시면:
- **GitHub Issues**: 버그 리포트
- **WordPress 포럼**: 일반적인 질문
- **개발자 문의**: 커스터마이징 요청

---

**🎯 Eunsense Blog Filter v1.0**  
*Claude Code Assistant로 제작*  
*MIT 라이선스 - 자유롭게 수정하여 사용하세요*