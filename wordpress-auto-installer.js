/**
 * WordPress 블로그 필터링 시스템 자동 설치기
 * WordPress REST API를 사용하여 자동으로 코드 적용
 */

const WORDPRESS_BASE_URL = 'https://eunsense.com';
const FILTER_SYSTEM_CODE = `
// === Eunsense 블로그 필터링 시스템 ===
// 자동 설치됨 - ${new Date().toISOString()}

function eunsense_enqueue_blog_filter_scripts() {
    if (is_home() || is_category() || is_tag() || is_archive() || is_search()) {
        
        wp_add_inline_style('wp-block-library', '
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
                
                const filterHTML = \`
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
                </div>\`;
                
                blogContainer.insertAdjacentHTML("beforebegin", filterHTML);
                
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
                
                const categoryFilter = document.getElementById("category-filter");
                Array.from(categories).sort().forEach(category => {
                    const option = document.createElement("option");
                    option.value = option.textContent = category;
                    categoryFilter.appendChild(option);
                });
                
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
                    
                    filtered.sort((a, b) => {
                        switch(sortOption) {
                            case "date-asc": return a.date - b.date;
                            case "title-asc": return a.title.localeCompare(b.title);
                            case "title-desc": return b.title.localeCompare(a.title);
                            default: return b.date - a.date;
                        }
                    });
                    
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
                    
                    const container = filtered[0]?.element.parentNode;
                    if (container) filtered.forEach(post => container.appendChild(post.element));
                    
                    const total = window.blogPosts.length;
                    document.getElementById("results-counter").textContent = 
                        filtered.length === total ? \`All \${total} posts\` : \`\${filtered.length} of \${total} posts\`;
                    document.getElementById("no-results").style.display = filtered.length ? "none" : "block";
                }
                
                document.getElementById("results-counter").textContent = \`\${window.blogPosts.length} posts\`;
            });
        })();
        ');
    }
}
add_action("wp_enqueue_scripts", "eunsense_enqueue_blog_filter_scripts");
`;

/**
 * WordPress에 자동으로 필터 시스템 설치
 */
async function installBlogFilterSystem(username, password) {
    try {
        console.log('🔄 WordPress 블로그 필터 시스템 설치 시작...');
        
        // 1. WordPress REST API 인증 테스트
        const authTest = await testWordPressAuth(username, password);
        if (!authTest.success) {
            throw new Error(`인증 실패: ${authTest.error}`);
        }
        console.log('✅ WordPress 인증 성공');
        
        // 2. 현재 테마의 functions.php 내용 가져오기
        const currentFunctions = await getCurrentFunctionsContent(username, password);
        console.log('📄 현재 functions.php 내용 조회 완료');
        
        // 3. 필터 시스템 코드가 이미 있는지 확인
        if (currentFunctions.includes('eunsense_enqueue_blog_filter_scripts')) {
            console.log('⚠️ 필터 시스템이 이미 설치되어 있습니다.');
            return { success: true, message: '이미 설치됨 - 업데이트가 필요하면 수동으로 교체하세요' };
        }
        
        // 4. 새 코드 추가
        const updatedFunctions = currentFunctions + '\n\n' + FILTER_SYSTEM_CODE;
        
        // 5. functions.php 업데이트
        const updateResult = await updateFunctionsFile(updatedFunctions, username, password);
        if (!updateResult.success) {
            throw new Error(`파일 업데이트 실패: ${updateResult.error}`);
        }
        
        console.log('🎉 블로그 필터 시스템 설치 완료!');
        return {
            success: true,
            message: '설치 완료! 블로그 페이지를 새로고침하여 확인하세요.',
            url: `${WORDPRESS_BASE_URL}/blog`
        };
        
    } catch (error) {
        console.error('❌설치 실패:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * WordPress REST API 인증 테스트
 */
async function testWordPressAuth(username, password) {
    try {
        const response = await fetch(`${WORDPRESS_BASE_URL}/wp-json/wp/v2/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(username + ':' + password)}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            return { 
                success: true, 
                user: { name: user.name, roles: user.roles } 
            };
        } else {
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * 현재 functions.php 내용 가져오기
 * (WordPress는 직접적인 파일 편집 API가 없으므로 대안 방법 사용)
 */
async function getCurrentFunctionsContent(username, password) {
    // WordPress에서 직접 파일을 읽을 수는 없으므로 
    // 플러그인이나 테마 편집 권한을 사용해야 합니다
    
    // 대안: 빈 문자열 반환하고 사용자가 수동으로 추가하도록 안내
    console.log('⚠️ WordPress API로는 직접 functions.php를 편집할 수 없습니다.');
    return '';
}

/**
 * functions.php 업데이트 (실제로는 불가능 - 안내만 제공)
 */
async function updateFunctionsFile(content, username, password) {
    // WordPress REST API로는 직접 파일 편집이 불가능합니다
    // 대신 사용자에게 코드를 제공하고 수동 설치 안내
    
    console.log('📋 다음 코드를 functions.php에 수동으로 추가하세요:');
    console.log('='.repeat(50));
    console.log(FILTER_SYSTEM_CODE);
    console.log('='.repeat(50));
    
    return { 
        success: false, 
        error: 'WordPress API로는 직접 파일 편집이 불가능합니다. 수동 설치가 필요합니다.' 
    };
}

/**
 * 대안: WordPress 플러그인 생성 및 설치
 */
async function createAndInstallPlugin(username, password) {
    const pluginCode = `<?php
/**
 * Plugin Name: Eunsense Blog Filter
 * Description: Advanced blog filtering and sorting system
 * Version: 1.0.0
 * Author: Claude Code Assistant
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

${FILTER_SYSTEM_CODE}
?>`;

    try {
        // WordPress의 플러그인 설치 API를 사용할 수 있다면 여기에 구현
        // 하지만 보안상의 이유로 대부분의 WordPress 사이트에서는 제한됩니다
        
        console.log('🔌 플러그인 코드 생성 완료');
        console.log('📁 파일명: eunsense-blog-filter.php');
        console.log('📍 설치 경로: /wp-content/plugins/eunsense-blog-filter/');
        
        return {
            success: false,
            pluginCode: pluginCode,
            instructions: '플러그인을 수동으로 업로드하거나 functions.php에 코드를 추가하세요.'
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * 메인 설치 함수 (브라우저에서 실행 가능)
 */
async function autoInstall() {
    console.log('🚀 Eunsense 블로그 필터 자동 설치기');
    console.log('WordPress 사이트:', WORDPRESS_BASE_URL);
    
    // WordPress 관리자 인증 정보 요청
    const username = prompt('WordPress 관리자 사용자명:');
    const password = prompt('WordPress 관리자 비밀번호:');
    
    if (!username || !password) {
        alert('사용자명과 비밀번호가 필요합니다.');
        return;
    }
    
    // 설치 실행
    const result = await installBlogFilterSystem(username, password);
    
    if (result.success) {
        alert(`✅ ${result.message}`);
        if (result.url) {
            window.open(result.url, '_blank');
        }
    } else {
        alert(`❌ 설치 실패: ${result.error}`);
        console.log('\n📋 수동 설치 코드:');
        console.log(FILTER_SYSTEM_CODE);
    }
}

// Node.js 환경에서의 export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        installBlogFilterSystem,
        FILTER_SYSTEM_CODE,
        autoInstall
    };
}

// 브라우저 환경에서의 전역 함수
if (typeof window !== 'undefined') {
    window.installBlogFilter = autoInstall;
    window.FILTER_SYSTEM_CODE = FILTER_SYSTEM_CODE;
}

console.log('🎯 WordPress 블로그 필터 설치기 로드 완료');
console.log('브라우저에서 사용: window.installBlogFilter()');
console.log('Node.js에서 사용: require("./wordpress-auto-installer")');