<?php
/**
 * Eunsense 블로그 필터링 시스템 WordPress 통합 코드
 * 
 * 설치 방법:
 * 1. WordPress 관리자 → 외모 → 테마 편집기
 * 2. functions.php 파일에 이 코드 추가
 * 3. 또는 차일드 테마의 functions.php에 추가
 */

// 블로그 페이지에서만 필터링 시스템 로드
function eunsense_enqueue_blog_filter_scripts() {
    // 블로그 페이지, 카테고리 페이지, 아카이브 페이지에서만 로드
    if (is_home() || is_category() || is_tag() || is_archive() || is_search()) {
        
        // CSS 인라인 추가
        wp_add_inline_style('wp-block-library', '
        /* Eunsense Blog Filter System Styles */
        #blog-filter-system {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            color: white;
            font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            position: relative;
            overflow: hidden;
        }
        
        #blog-filter-system::before {
            content: "";
            position: absolute;
            top: -50%;
            right: -20%;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        }
        
        .filter-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            align-items: center;
            justify-content: space-between;
            position: relative;
            z-index: 1;
        }
        
        .filter-input-group {
            flex: 1;
            min-width: 200px;
        }
        
        #post-search {
            width: 100%;
            padding: 12px 20px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            background: rgba(255,255,255,0.95);
            outline: none;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        #post-search:focus {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            background: rgba(255,255,255,1);
        }
        
        .filter-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .filter-label {
            font-weight: 600;
            font-size: 14px;
            opacity: 0.9;
            white-space: nowrap;
        }
        
        .filter-select {
            padding: 12px 18px;
            border: none;
            border-radius: 20px;
            background: rgba(255,255,255,0.95);
            color: #333;
            font-size: 14px;
            font-weight: 500;
            min-width: 140px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .filter-select:hover {
            background: rgba(255,255,255,1);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        }
        
        #results-counter {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.9;
            background: rgba(255,255,255,0.1);
            padding: 8px 16px;
            border-radius: 15px;
            border: 1px solid rgba(255,255,255,0.2);
            white-space: nowrap;
        }
        
        #active-filters {
            margin-top: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .filter-tag {
            background: rgba(255,255,255,0.2) !important;
            color: white !important;
            padding: 8px 14px !important;
            border-radius: 20px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
            transition: all 0.3s ease !important;
        }
        
        .filter-tag .remove-filter {
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            opacity: 0.8;
            margin-left: 5px;
        }
        
        #loading-indicator {
            display: none;
            text-align: center;
            padding: 50px 20px;
            font-size: 16px;
            color: #666;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #no-results {
            display: none;
            text-align: center;
            padding: 80px 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 20px;
            color: #6c757d;
            margin: 30px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .post-item {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .post-item.hidden {
            display: none !important;
        }
        
        .post-item.highlighted {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.25);
        }
        
        @media (max-width: 768px) {
            .filter-controls {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 15px;
            }
            
            .filter-group {
                justify-content: space-between;
            }
            
            .filter-input-group {
                min-width: auto;
            }
            
            .filter-select {
                min-width: 120px;
            }
        }
        ');
        
        // JavaScript 인라인 추가
        wp_add_inline_script('wp-dom-ready', '
        (function() {
            // DOM이 로드된 후 실행
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initBlogFilter);
            } else {
                initBlogFilter();
            }
            
            function initBlogFilter() {
                // 블로그 포스트 컨테이너 찾기
                const containers = [
                    ".wp-block-query .wp-block-post-template",
                    ".wp-block-latest-posts",
                    "main .wp-block-post",
                    ".posts-container",
                    ".blog-posts",
                    "main article",
                    ".content-area"
                ];
                
                let blogContainer = null;
                for (const selector of containers) {
                    blogContainer = document.querySelector(selector);
                    if (blogContainer) break;
                }
                
                if (!blogContainer) {
                    console.warn("블로그 컨테이너를 찾을 수 없습니다.");
                    return;
                }
                
                // 필터 UI 삽입
                insertFilterUI(blogContainer);
                
                // 포스트 데이터 수집
                collectPosts();
                
                // 이벤트 리스너 설정
                setupEventListeners();
            }
            
            function insertFilterUI(blogContainer) {
                const filterHTML = `
                <div id="blog-filter-system">
                    <div class="filter-controls">
                        <div class="filter-input-group">
                            <input type="text" id="post-search" placeholder="🔍 Search posts..." />
                        </div>
                        
                        <div class="filter-group">
                            <label class="filter-label">📂 Category:</label>
                            <select id="category-filter" class="filter-select">
                                <option value="">All Categories</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
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
                    
                    <div id="active-filters"></div>
                </div>
                
                <div id="loading-indicator">
                    <div class="loading-spinner"></div>
                    <div>Filtering posts...</div>
                </div>
                
                <div id="no-results">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>No posts found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
                `;
                
                blogContainer.insertAdjacentHTML("beforebegin", filterHTML);
            }
            
            function collectPosts() {
                const postSelectors = [
                    "article",
                    ".wp-block-post",
                    ".post",
                    ".blog-post",
                    ".entry"
                ];
                
                let posts = [];
                for (const selector of postSelectors) {
                    posts = document.querySelectorAll(selector);
                    if (posts.length > 0) break;
                }
                
                const categories = new Set();
                
                window.blogPosts = Array.from(posts).map(post => {
                    // 제목 추출
                    const titleElement = post.querySelector("h1, h2, h3, .entry-title, .post-title, .wp-block-post-title");
                    const title = titleElement ? titleElement.textContent.trim() : "";
                    
                    // 카테고리 추출
                    const categoryElements = post.querySelectorAll(".category, .post-categories a, .wp-block-post-terms a, .cat-links a");
                    const postCategories = Array.from(categoryElements).map(cat => cat.textContent.trim());
                    postCategories.forEach(cat => categories.add(cat));
                    
                    // 날짜 추출
                    const dateElement = post.querySelector("time, .post-date, .entry-date, .wp-block-post-date");
                    let date = new Date();
                    if (dateElement) {
                        const dateStr = dateElement.getAttribute("datetime") || dateElement.textContent;
                        if (dateStr) {
                            date = new Date(dateStr);
                        }
                    }
                    
                    // 내용 추출
                    const contentElement = post.querySelector(".entry-content, .post-content, .wp-block-post-excerpt, .excerpt");
                    const content = contentElement ? contentElement.textContent.trim() : "";
                    
                    // 포스트에 클래스 추가
                    post.classList.add("post-item");
                    
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
                const categoryFilter = document.getElementById("category-filter");
                if (categoryFilter) {
                    Array.from(categories).sort().forEach(category => {
                        const option = document.createElement("option");
                        option.value = category;
                        option.textContent = category;
                        categoryFilter.appendChild(option);
                    });
                }
                
                updateResultsCounter();
                console.log(`${window.blogPosts.length}개 포스트와 ${categories.size}개 카테고리를 수집했습니다.`);
            }
            
            function setupEventListeners() {
                // 검색 입력
                const searchInput = document.getElementById("post-search");
                if (searchInput) {
                    let searchTimeout;
                    searchInput.addEventListener("input", function() {
                        clearTimeout(searchTimeout);
                        searchTimeout = setTimeout(filterPosts, 300);
                    });
                }
                
                // 필터 변경
                const categoryFilter = document.getElementById("category-filter");
                const sortFilter = document.getElementById("sort-filter");
                
                if (categoryFilter) categoryFilter.addEventListener("change", filterPosts);
                if (sortFilter) sortFilter.addEventListener("change", filterPosts);
            }
            
            function filterPosts() {
                if (!window.blogPosts) return;
                
                showLoading();
                
                const searchTerm = document.getElementById("post-search").value.toLowerCase().trim();
                const selectedCategory = document.getElementById("category-filter").value;
                const sortOption = document.getElementById("sort-filter").value;
                
                // 필터링
                let filteredPosts = window.blogPosts.filter(post => {
                    const matchesSearch = !searchTerm || 
                        post.title.toLowerCase().includes(searchTerm) ||
                        post.content.toLowerCase().includes(searchTerm) ||
                        post.categories.some(cat => cat.toLowerCase().includes(searchTerm));
                    
                    const matchesCategory = !selectedCategory || 
                        post.categories.includes(selectedCategory);
                    
                    return matchesSearch && matchesCategory;
                });
                
                // 정렬
                filteredPosts.sort((a, b) => {
                    switch(sortOption) {
                        case "date-asc":
                            return a.date - b.date;
                        case "date-desc":
                            return b.date - a.date;
                        case "title-asc":
                            return a.title.localeCompare(b.title);
                        case "title-desc":
                            return b.title.localeCompare(a.title);
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
                    
                    const noResults = document.getElementById("no-results");
                    if (filteredPosts.length === 0) {
                        noResults.style.display = "block";
                    } else {
                        noResults.style.display = "none";
                    }
                }, 200);
            }
            
            function updatePostVisibility(filteredPosts) {
                const visiblePostElements = new Set(filteredPosts.map(post => post.element));
                
                window.blogPosts.forEach(post => {
                    if (visiblePostElements.has(post.element)) {
                        post.element.style.display = "";
                        post.element.classList.remove("hidden");
                        post.element.classList.add("highlighted");
                        setTimeout(() => post.element.classList.remove("highlighted"), 500);
                    } else {
                        post.element.style.display = "none";
                        post.element.classList.add("hidden");
                    }
                });
                
                // 정렬된 순서로 재배치
                const container = filteredPosts[0]?.element.parentNode;
                if (container && filteredPosts.length > 0) {
                    filteredPosts.forEach(post => {
                        container.appendChild(post.element);
                    });
                }
            }
            
            function updateResultsCounter(count = null) {
                const counter = document.getElementById("results-counter");
                if (!counter) return;
                
                const totalCount = window.blogPosts ? window.blogPosts.length : 0;
                const displayCount = count !== null ? count : totalCount;
                
                if (count === null) {
                    counter.textContent = `${totalCount} posts`;
                } else if (displayCount === totalCount) {
                    counter.textContent = `All ${totalCount} posts`;
                } else {
                    counter.textContent = `${displayCount} of ${totalCount} posts`;
                }
            }
            
            function updateActiveFilters(searchTerm, category, sortOption) {
                const container = document.getElementById("active-filters");
                if (!container) return;
                
                container.innerHTML = "";
                
                if (searchTerm) {
                    container.innerHTML += `<span class="filter-tag">Search: "${searchTerm}" <span class="remove-filter" onclick="clearSearchFilter()">×</span></span>`;
                }
                
                if (category) {
                    container.innerHTML += `<span class="filter-tag">Category: ${category} <span class="remove-filter" onclick="clearCategoryFilter()">×</span></span>`;
                }
            }
            
            function showLoading() {
                const loading = document.getElementById("loading-indicator");
                if (loading) loading.style.display = "block";
            }
            
            function hideLoading() {
                const loading = document.getElementById("loading-indicator");
                if (loading) loading.style.display = "none";
            }
            
            // 전역 함수
            window.clearSearchFilter = function() {
                document.getElementById("post-search").value = "";
                filterPosts();
            };
            
            window.clearCategoryFilter = function() {
                document.getElementById("category-filter").value = "";
                filterPosts();
            };
            
            window.filterPosts = filterPosts;
        })();
        ');
    }
}
add_action('wp_enqueue_scripts', 'eunsense_enqueue_blog_filter_scripts');

// 관리자 페이지에서 사용법 가이드 추가 (선택사항)
function eunsense_blog_filter_admin_notice() {
    if (current_user_can('manage_options')) {
        echo '<div class="notice notice-info"><p>';
        echo '<strong>Eunsense Blog Filter:</strong> 블로그 페이지에 필터링 및 정렬 기능이 활성화되었습니다. ';
        echo '문제가 있다면 테마의 functions.php에서 eunsense_enqueue_blog_filter_scripts 함수를 확인하세요.';
        echo '</p></div>';
    }
}
// 필요시 주석 해제: add_action('admin_notices', 'eunsense_blog_filter_admin_notice');

/**
 * REST API 엔드포인트 추가 (고급 기능)
 * AJAX 기반 무한 스크롤이나 더 복잡한 필터링을 원할 경우 사용
 */
function eunsense_register_blog_filter_api() {
    register_rest_route('eunsense/v1', '/filter-posts', array(
        'methods' => 'GET',
        'callback' => 'eunsense_filter_posts_callback',
        'permission_callback' => '__return_true',
        'args' => array(
            'search' => array(
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'category' => array(
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'sort' => array(
                'default' => 'date-desc',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'page' => array(
                'default' => 1,
                'sanitize_callback' => 'absint',
            ),
            'per_page' => array(
                'default' => 10,
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
}
add_action('rest_api_init', 'eunsense_register_blog_filter_api');

function eunsense_filter_posts_callback($request) {
    $search = $request->get_param('search');
    $category = $request->get_param('category');
    $sort = $request->get_param('sort');
    $page = $request->get_param('page');
    $per_page = min($request->get_param('per_page'), 50); // 최대 50개 제한
    
    $args = array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
    );
    
    // 검색어 처리
    if (!empty($search)) {
        $args['s'] = $search;
    }
    
    // 카테고리 처리
    if (!empty($category)) {
        $args['category_name'] = $category;
    }
    
    // 정렬 처리
    switch ($sort) {
        case 'date-asc':
            $args['orderby'] = 'date';
            $args['order'] = 'ASC';
            break;
        case 'title-asc':
            $args['orderby'] = 'title';
            $args['order'] = 'ASC';
            break;
        case 'title-desc':
            $args['orderby'] = 'title';
            $args['order'] = 'DESC';
            break;
        default:
            $args['orderby'] = 'date';
            $args['order'] = 'DESC';
    }
    
    $query = new WP_Query($args);
    
    $posts = array();
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            
            $categories = get_the_category();
            $category_names = array();
            foreach ($categories as $cat) {
                $category_names[] = $cat->name;
            }
            
            $posts[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title(),
                'excerpt' => get_the_excerpt(),
                'permalink' => get_permalink(),
                'date' => get_the_date('c'),
                'categories' => $category_names,
                'author' => get_the_author(),
                'featured_image' => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
            );
        }
    }
    
    wp_reset_postdata();
    
    return new WP_REST_Response(array(
        'posts' => $posts,
        'total' => $query->found_posts,
        'pages' => $query->max_num_pages,
        'current_page' => $page,
    ), 200);
}

?>