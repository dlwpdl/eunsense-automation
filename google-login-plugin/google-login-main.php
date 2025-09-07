<?php
/**
 * Plugin Name: Google Login for WordPress
 * Description: Google OAuth login integration for your automation system
 * Version: 1.0.0
 * Author: Eunsense Automation
 */

// 보안: 직접 접근 방지
if (!defined('ABSPATH')) {
    exit;
}

// 플러그인 메인 파일 로드
require_once plugin_dir_path(__FILE__) . 'wordpress-google-login.php';

// JavaScript 파일 enqueue
add_action('wp_enqueue_scripts', 'google_login_enqueue_scripts');

function google_login_enqueue_scripts() {
    wp_enqueue_script(
        'google-login-frontend', 
        plugin_dir_url(__FILE__) . 'google-login-frontend.js', 
        array(), 
        '1.0.0', 
        true
    );
}

// 숏코드 등록
add_shortcode('google_login', 'google_login_shortcode');

function google_login_shortcode() {
    return '
    <div id="google-login-container"></div>
    <div id="user-info-container"></div>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            if (window.googleLoginManager) {
                window.googleLoginManager.checkLoginStatus();
            }
        });
    </script>';
}

// 활성화 시 실행
register_activation_hook(__FILE__, 'google_login_activate');

function google_login_activate() {
    // 기본 설정값 추가
    add_option('google_oauth_client_id', '');
    add_option('google_oauth_client_secret', '');
}

// 비활성화 시 실행
register_deactivation_hook(__FILE__, 'google_login_deactivate');

function google_login_deactivate() {
    // 정리 작업 (선택사항)
}
?>