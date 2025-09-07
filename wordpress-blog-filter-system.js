/**
 * WordPress 블로그 필터링 및 정렬 시스템
 * Eunsense 블로그용 커스텀 솔루션
 */

// 메인 필터링 시스템 초기화
document.addEventListener('DOMContentLoaded', function() {
    initBlogFilterSystem();
});

function initBlogFilterSystem() {
    // 필터 UI 삽입
    insertFilterUI();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 초기 포스트 데이터 수집
    collectInitialPosts();
}

/**
 * 필터 UI를 블로그 페이지에 삽입
 */
function insertFilterUI() {
    const blogContainer = document.querySelector('.wp-block-post-template, .blog-posts, main, .content-area');
    
    if (!blogContainer) {
        console.warn('블로그 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    const filterHTML = `
    <div id="blog-filter-system" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 25px;
        border-radius: 15px;
        margin-bottom: 30px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        color: white;
    ">
        <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between;">
            
            <!-- 검색 박스 -->
            <div style="flex: 1; min-width: 200px;">
                <input type="text" 
                       id="post-search" 
                       placeholder="🔍 Search posts..." 
                       style="
                           width: 100%;
                           padding: 12px 16px;
                           border: none;
                           border-radius: 25px;
                           font-size: 16px;
                           background: rgba(255,255,255,0.95);
                           backdrop-filter: blur(10px);
                           outline: none;
                           transition: all 0.3s ease;
                       ">
            </div>
            
            <!-- 카테고리 필터 -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <label style="font-weight: 600; font-size: 14px;">📂 Category:</label>
                <select id="category-filter" style="
                    padding: 10px 15px;
                    border: none;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.95);
                    color: #333;
                    font-size: 14px;
                    min-width: 150px;
                    outline: none;
                ">
                    <option value="">All Categories</option>
                </select>
            </div>
            
            <!-- 정렬 옵션 -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <label style="font-weight: 600; font-size: 14px;">🔄 Sort:</label>
                <select id="sort-filter" style="
                    padding: 10px 15px;
                    border: none;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.95);
                    color: #333;
                    font-size: 14px;
                    min-width: 130px;
                    outline: none;
                ">
                    <option value="date-desc">Latest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="title-asc">A-Z Title</option>
                    <option value="title-desc">Z-A Title</option>
                    <option value="category">By Category</option>
                </select>
            </div>
            
            <!-- 결과 카운터 -->
            <div id="results-counter" style="
                font-size: 14px;
                font-weight: 500;
                opacity: 0.9;
            ">
                Loading posts...
            </div>
        </div>
        
        <!-- 활성 필터 태그들 -->
        <div id="active-filters" style="
            margin-top: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        "></div>
    </div>
    
    <!-- 로딩 표시기 -->
    <div id="loading-indicator" style="
        display: none;
        text-align: center;
        padding: 40px;
        font-size: 18px;
        color: #666;
    ">
        <div style="
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <div style="margin-top: 10px;">Filtering posts...</div>
    </div>
    
    <!-- 결과 없음 메시지 -->
    <div id="no-results" style="
        display: none;
        text-align: center;
        padding: 60px 20px;
        background: #f8f9fa;
        border-radius: 15px;
        color: #666;
        font-size: 18px;
    ">
        <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
        <h3 style="margin: 0 0 10px 0;">No posts found</h3>
        <p style="margin: 0;">Try adjusting your filters or search terms</p>
    </div>
    
    <style>
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    #post-search:focus {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .filter-tag {
        background: rgba(255,255,255,0.2) !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 15px !important;
        font-size: 12px !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
    }
    
    .filter-tag .remove-filter {
        cursor: pointer;
        font-weight: bold;
        margin-left: 5px;
    }
    
    .post-item {
        transition: all 0.3s ease;
    }
    
    .post-item.hidden {
        display: none !important;
    }
    
    .post-item.highlighted {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    
    @media (max-width: 768px) {
        #blog-filter-system > div {
            flex-direction: column !important;
            align-items: stretch !important;
        }
        
        #blog-filter-system > div > div {
            justify-content: center !important;
            margin-bottom: 10px;
        }
    }
    </style>
    `;
    
    blogContainer.insertAdjacentHTML('beforebegin', filterHTML);
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 검색 입력
    const searchInput = document.getElementById('post-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterPosts();
            }, 300);
        });
    }
    
    // 카테고리 필터
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterPosts);
    }
    
    // 정렬 필터
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterPosts);
    }
}

/**
 * 초기 포스트 데이터 수집 및 카테고리 목록 생성
 */
function collectInitialPosts() {
    const posts = document.querySelectorAll('article, .wp-block-post, .post, .blog-post');
    const categories = new Set();
    
    window.blogPosts = Array.from(posts).map(post => {
        // 제목 추출
        const titleElement = post.querySelector('h1, h2, h3, .entry-title, .post-title');
        const title = titleElement ? titleElement.textContent.trim() : '';
        
        // 카테고리 추출
        const categoryElements = post.querySelectorAll('.category, .post-categories a, .wp-block-post-terms a');
        const postCategories = Array.from(categoryElements).map(cat => cat.textContent.trim());
        postCategories.forEach(cat => categories.add(cat));
        
        // 날짜 추출
        const dateElement = post.querySelector('time, .post-date, .entry-date');
        const dateStr = dateElement ? (dateElement.getAttribute('datetime') || dateElement.textContent) : '';
        const date = dateStr ? new Date(dateStr) : new Date();
        
        // 내용 추출
        const contentElement = post.querySelector('.entry-content, .post-content, .wp-block-post-excerpt');
        const content = contentElement ? contentElement.textContent.trim() : '';
        
        return {
            element: post,
            title: title,
            categories: postCategories,
            date: date,
            content: content,
            visible: true
        };
    });
    
    // 카테고리 옵션 추가
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    updateResultsCounter();
    console.log(`${window.blogPosts.length}개 포스트와 ${categories.size}개 카테고리를 수집했습니다.`);
}

/**
 * 포스트 필터링 실행
 */
function filterPosts() {
    if (!window.blogPosts) return;
    
    showLoading();
    
    const searchTerm = document.getElementById('post-search').value.toLowerCase().trim();
    const selectedCategory = document.getElementById('category-filter').value;
    const sortOption = document.getElementById('sort-filter').value;
    
    // 필터링
    let filteredPosts = window.blogPosts.filter(post => {
        // 검색어 필터
        const matchesSearch = !searchTerm || 
            post.title.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm) ||
            post.categories.some(cat => cat.toLowerCase().includes(searchTerm));
        
        // 카테고리 필터
        const matchesCategory = !selectedCategory || 
            post.categories.includes(selectedCategory);
        
        return matchesSearch && matchesCategory;
    });
    
    // 정렬
    filteredPosts.sort((a, b) => {
        switch(sortOption) {
            case 'date-asc':
                return a.date - b.date;
            case 'date-desc':
                return b.date - a.date;
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'category':
                return (a.categories[0] || '').localeCompare(b.categories[0] || '');
            default:
                return b.date - a.date;
        }
    });
    
    // DOM 업데이트
    setTimeout(() => {
        updatePostVisibility(filteredPosts);
        updateResultsCounter(filteredPosts.length);
        updateActiveFilters(searchTerm, selectedCategory, sortOption);
        hideLoading();
        
        // 결과 없음 처리
        const noResults = document.getElementById('no-results');
        if (filteredPosts.length === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }, 300);
}

/**
 * 포스트 표시/숨김 처리
 */
function updatePostVisibility(filteredPosts) {
    const visiblePostElements = new Set(filteredPosts.map(post => post.element));
    
    window.blogPosts.forEach(post => {
        if (visiblePostElements.has(post.element)) {
            post.element.style.display = '';
            post.element.classList.remove('hidden');
            post.element.classList.add('highlighted');
            setTimeout(() => post.element.classList.remove('highlighted'), 500);
        } else {
            post.element.style.display = 'none';
            post.element.classList.add('hidden');
        }
    });
    
    // 필터된 순서대로 재배치
    const container = filteredPosts[0]?.element.parentNode;
    if (container && filteredPosts.length > 0) {
        filteredPosts.forEach(post => {
            container.appendChild(post.element);
        });
    }
}

/**
 * 결과 카운터 업데이트
 */
function updateResultsCounter(count = null) {
    const counter = document.getElementById('results-counter');
    if (!counter) return;
    
    const totalCount = window.blogPosts ? window.blogPosts.length : 0;
    const displayCount = count !== null ? count : totalCount;
    
    if (count === null) {
        counter.textContent = `${totalCount} posts`;
    } else if (displayCount === totalCount) {
        counter.textContent = `Showing all ${totalCount} posts`;
    } else {
        counter.textContent = `${displayCount} of ${totalCount} posts`;
    }
}

/**
 * 활성 필터 태그 업데이트
 */
function updateActiveFilters(searchTerm, category, sortOption) {
    const container = document.getElementById('active-filters');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (searchTerm) {
        container.innerHTML += `<span class="filter-tag">Search: "${searchTerm}" <span class="remove-filter" onclick="clearSearchFilter()">×</span></span>`;
    }
    
    if (category) {
        container.innerHTML += `<span class="filter-tag">Category: ${category} <span class="remove-filter" onclick="clearCategoryFilter()">×</span></span>`;
    }
    
    if (sortOption !== 'date-desc') {
        const sortLabels = {
            'date-asc': 'Oldest First',
            'title-asc': 'A-Z Title', 
            'title-desc': 'Z-A Title',
            'category': 'By Category'
        };
        container.innerHTML += `<span class="filter-tag">Sort: ${sortLabels[sortOption] || sortOption}</span>`;
    }
}

/**
 * 필터 제거 함수들
 */
function clearSearchFilter() {
    document.getElementById('post-search').value = '';
    filterPosts();
}

function clearCategoryFilter() {
    document.getElementById('category-filter').value = '';
    filterPosts();
}

function clearAllFilters() {
    document.getElementById('post-search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('sort-filter').value = 'date-desc';
    filterPosts();
}

/**
 * 로딩 표시기 제어
 */
function showLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) loading.style.display = 'none';
}

// 전역 함수로 노출 (HTML에서 호출 가능)
window.clearSearchFilter = clearSearchFilter;
window.clearCategoryFilter = clearCategoryFilter; 
window.clearAllFilters = clearAllFilters;

console.log('🎯 Blog Filter System loaded successfully!');