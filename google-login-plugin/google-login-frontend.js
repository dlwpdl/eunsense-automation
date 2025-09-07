/**
 * Google 로그인 프론트엔드 JavaScript
 * WordPress 테마에 포함하여 사용
 */

class GoogleLoginManager {
    constructor() {
        this.apiBase = '/wp-json/google-auth/v1';
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
        this.handleLoginCallback();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Google 로그인 버튼
        document.addEventListener('click', (e) => {
            if (e.target.matches('#google-login-btn, .google-login-btn')) {
                e.preventDefault();
                this.startGoogleLogin();
            }
        });

        // 로그아웃 버튼
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logout-btn, .logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    /**
     * Google 로그인 시작
     */
    async startGoogleLogin() {
        try {
            const response = await fetch(`${this.apiBase}/login-url`);
            const data = await response.json();
            
            if (data.login_url) {
                // Google OAuth 페이지로 리다이렉트
                window.location.href = data.login_url;
            }
        } catch (error) {
            console.error('Google 로그인 URL 생성 실패:', error);
            this.showError('로그인 중 오류가 발생했습니다.');
        }
    }

    /**
     * 로그인 상태 확인
     */
    async checkLoginStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const data = await response.json();
            
            this.updateUI(data);
        } catch (error) {
            console.error('로그인 상태 확인 실패:', error);
        }
    }

    /**
     * 로그아웃 처리
     */
    async logout() {
        try {
            const response = await fetch(`${this.apiBase}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateUI({ logged_in: false, user: null });
                this.showSuccess('성공적으로 로그아웃되었습니다.');
                
                // 페이지 새로고침 또는 홈으로 이동
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        } catch (error) {
            console.error('로그아웃 실패:', error);
            this.showError('로그아웃 중 오류가 발생했습니다.');
        }
    }

    /**
     * UI 업데이트
     */
    updateUI(loginData) {
        const loginContainer = document.getElementById('google-login-container');
        const userContainer = document.getElementById('user-info-container');
        
        if (!loginContainer && !userContainer) {
            return; // 컨테이너가 없으면 종료
        }

        if (loginData.logged_in) {
            // 로그인됨
            if (loginContainer) {
                loginContainer.style.display = 'none';
            }
            
            if (userContainer) {
                userContainer.style.display = 'block';
                userContainer.innerHTML = this.generateUserHTML(loginData.user);
            }
        } else {
            // 로그인 안됨
            if (loginContainer) {
                loginContainer.style.display = 'block';
                loginContainer.innerHTML = this.generateLoginHTML();
            }
            
            if (userContainer) {
                userContainer.style.display = 'none';
            }
        }
    }

    /**
     * 로그인 HTML 생성
     */
    generateLoginHTML() {
        return `
            <div class="google-login-wrapper">
                <button id="google-login-btn" class="google-login-btn">
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" height="20">
                    Google로 로그인
                </button>
            </div>
        `;
    }

    /**
     * 사용자 정보 HTML 생성
     */
    generateUserHTML(user) {
        const avatarUrl = user.google_profile_picture || user.avatar;
        
        return `
            <div class="user-info-wrapper">
                <div class="user-avatar">
                    <img src="${avatarUrl}" alt="${user.name}" width="40" height="40" style="border-radius: 50%;">
                </div>
                <div class="user-details">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <div class="user-actions">
                    <button id="logout-btn" class="logout-btn">로그아웃</button>
                </div>
            </div>
        `;
    }

    /**
     * 로그인 콜백 처리 (URL 파라미터 확인)
     */
    handleLoginCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const loginStatus = urlParams.get('login');
        
        if (loginStatus === 'success') {
            this.showSuccess('Google 로그인이 완료되었습니다!');
            this.checkLoginStatus();
            
            // URL에서 파라미터 제거
            const newUrl = window.location.pathname;
            window.history.replaceState(null, null, newUrl);
        } else if (loginStatus === 'error') {
            this.showError('로그인 중 오류가 발생했습니다.');
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 메시지 표시
     */
    showMessage(message, type) {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.google-auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `google-auth-message ${type}`;
        messageDiv.textContent = message;
        
        // 스타일 적용
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

/**
 * CSS 스타일 추가
 */
function addGoogleLoginCSS() {
    const css = `
        .google-login-wrapper {
            text-align: center;
            margin: 20px 0;
        }

        .google-login-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: white;
            color: #333;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .google-login-btn:hover {
            background-color: #f8f9fa;
            border-color: #dadce0;
            box-shadow: 0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
        }

        .user-info-wrapper {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }

        .user-details {
            flex: 1;
        }

        .user-name {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .user-email {
            font-size: 14px;
            color: #666;
        }

        .logout-btn {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 3px;
            background-color: white;
            color: #333;
            cursor: pointer;
            font-size: 14px;
        }

        .logout-btn:hover {
            background-color: #f5f5f5;
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    addGoogleLoginCSS();
    window.googleLoginManager = new GoogleLoginManager();
});

/**
 * WordPress에서 사용할 수 있는 간편 함수들
 */
window.GoogleLogin = {
    init: () => new GoogleLoginManager(),
    login: () => window.googleLoginManager?.startGoogleLogin(),
    logout: () => window.googleLoginManager?.logout(),
    checkStatus: () => window.googleLoginManager?.checkLoginStatus()
};