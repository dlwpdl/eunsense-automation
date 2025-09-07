<?php
/**
 * Google OAuth 로그인 WordPress 플러그인
 * 현재 자동화 시스템과 통합
 */

// WordPress REST API 엔드포인트 추가
add_action('rest_api_init', 'register_google_auth_endpoints');

function register_google_auth_endpoints() {
    // Google OAuth 콜백 처리
    register_rest_route('google-auth/v1', '/callback', array(
        'methods' => 'GET',
        'callback' => 'handle_google_oauth_callback',
        'permission_callback' => '__return_true'
    ));
    
    // 로그인 상태 확인
    register_rest_route('google-auth/v1', '/status', array(
        'methods' => 'GET',
        'callback' => 'get_login_status',
        'permission_callback' => '__return_true'
    ));
    
    // 로그아웃
    register_rest_route('google-auth/v1', '/logout', array(
        'methods' => 'POST',
        'callback' => 'handle_logout',
        'permission_callback' => 'is_user_logged_in' // 로그인한 사용자만 호출 가능하도록 변경
    ));
}

/**
 * Google OAuth 설정
 */
function get_google_oauth_config() {
    return array(
        'client_id' => get_option('google_oauth_client_id', ''),
        'client_secret' => get_option('google_oauth_client_secret', ''),
        'redirect_uri' => home_url('/wp-json/google-auth/v1/callback'),
        'scope' => 'openid email profile'
    );
}

/**
 * Google OAuth 콜백 처리 (보안 강화)
 */
function handle_google_oauth_callback($request) {
    $code = $request->get_param('code');
    $state = $request->get_param('state');

    // --- CSRF 공격 방지 보안 검증 --- 
    if (empty($state)) {
        return new WP_Error('invalid_state', 'State parameter is missing.', array('status' => 400));
    }

    $transient_key = 'google_oauth_state_' . sanitize_key($state);
    $is_valid_state = get_transient($transient_key);

    if (false === $is_valid_state) {
        return new WP_Error('invalid_state', 'Invalid or expired state. CSRF attack detected?', array('status' => 403));
    }

    // 검증 후 즉시 삭제하여 재사용 방지
    delete_transient($transient_key);
    // --- 보안 검증 끝 ---
    
    if (!$code) {
        return new WP_Error('no_code', 'Authorization code not provided', array('status' => 400));
    }
    
    $config = get_google_oauth_config();
    
    $token_response = wp_remote_post('https://oauth2.googleapis.com/token', array(
        'body' => array(
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $config['redirect_uri']
        )
    ));
    
    if (is_wp_error($token_response)) {
        return new WP_Error('token_error', 'Failed to exchange token', array('status' => 500));
    }
    
    $token_data = json_decode(wp_remote_retrieve_body($token_response), true);
    
    if (!isset($token_data['access_token'])) {
        return new WP_Error('invalid_token', 'Invalid token response', array('status' => 400));
    }
    
    $user_response = wp_remote_get('https://www.googleapis.com/oauth2/v2/userinfo', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token_data['access_token']
        )
    ));
    
    if (is_wp_error($user_response)) {
        return new WP_Error('user_info_error', 'Failed to get user info', array('status' => 500));
    }
    
    $user_data = json_decode(wp_remote_retrieve_body($user_response), true);
    
    $user = handle_google_user($user_data);
    
    if (is_wp_error($user)) {
        return $user;
    }
    
    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, true);
    
    wp_redirect(home_url('/?login=success'));
    exit;
}

/**
 * Google 사용자 정보로 WordPress 사용자 처리
 */
function handle_google_user($google_user) {
    $email = sanitize_email($google_user['email']);
    $name = sanitize_text_field($google_user['name']);
    $google_id = sanitize_text_field($google_user['id']);
    
    $existing_user = get_user_by('email', $email);
    
    if ($existing_user) {
        update_user_meta($existing_user->ID, 'google_id', $google_id);
        return $existing_user;
    }
    
    $username = sanitize_user(str_replace(' ', '_', strtolower($name)), true);
    $username = wp_unique_username($username);
    
    $user_id = wp_create_user($username, wp_generate_password(), $email);
    
    if (is_wp_error($user_id)) {
        return $user_id;
    }
    
    update_user_meta($user_id, 'google_id', $google_id);
    update_user_meta($user_id, 'first_name', sanitize_text_field($google_user['given_name'] ?? ''));
    update_user_meta($user_id, 'last_name', sanitize_text_field($google_user['family_name'] ?? ''));
    
    if (isset($google_user['picture'])) {
        update_user_meta($user_id, 'google_profile_picture', esc_url_raw($google_user['picture']));
    }
    
    return get_user_by('id', $user_id);
}

/**
 * 로그인 상태 확인
 */
function get_login_status($request) {
    $current_user = wp_get_current_user();
    
    if ($current_user->ID === 0) {
        return array('logged_in' => false, 'user' => null);
    }
    
    return array(
        'logged_in' => true,
        'user' => array(
            'id' => $current_user->ID,
            'name' => $current_user->display_name,
            'email' => $current_user->user_email,
            'avatar' => get_avatar_url($current_user->ID),
            'google_profile_picture' => get_user_meta($current_user->ID, 'google_profile_picture', true)
        )
    );
}

/**
 * 로그아웃 처리
 */
function handle_logout($request) {
    wp_logout();
    return array('success' => true, 'message' => 'Successfully logged out');
}

/**
 * 관리자 설정 페이지 추가
 */
add_action('admin_menu', 'add_google_oauth_admin_menu');

function add_google_oauth_admin_menu() {
    add_options_page(
        'Google OAuth Settings',
        'Google OAuth',
        'manage_options',
        'google-oauth',
        'google_oauth_admin_page'
    );
}

function google_oauth_admin_page() {
    if (isset($_POST['submit'])) {
        check_admin_referer('google_oauth_settings'); // Nonce 검증 추가
        update_option('google_oauth_client_id', sanitize_text_field($_POST['client_id']));
        update_option('google_oauth_client_secret', sanitize_text_field($_POST['client_secret']));
        echo '<div class="notice notice-success"><p>설정이 저장되었습니다.</p></div>';
    }
    
    $client_id = get_option('google_oauth_client_id', '');
    $client_secret = get_option('google_oauth_client_secret', '');
    ?>
    <div class="wrap">
        <h1>Google OAuth 설정</h1>
        <form method="post">
            <?php wp_nonce_field('google_oauth_settings'); // Nonce 필드 추가 ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Client ID</th>
                    <td><input type="text" name="client_id" value="<?php echo esc_attr($client_id); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row">Client Secret</th>
                    <td><input type="password" name="client_secret" value="<?php echo esc_attr($client_secret); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th scope="row">리다이렉트 URI</th>
                    <td>
                        <code><?php echo esc_url(home_url('/wp-json/google-auth/v1/callback')); ?></code>
                        <p class="description">Google Cloud Console에서 이 URI를 승인된 리다이렉트 URI로 추가하세요.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

/**
 * Google 로그인 URL 생성
 */
function get_google_login_url($state = '') {
    $config = get_google_oauth_config();
    
    $params = array(
        'client_id' => $config['client_id'],
        'redirect_uri' => $config['redirect_uri'],
        'scope' => $config['scope'],
        'response_type' => 'code',
        'access_type' => 'offline',
        'state' => $state
    );
    
    return 'https://accounts.google.com/oauth/authorize?' . http_build_query($params);
}

// REST API로 로그인 URL 제공 (보안 강화)
add_action('rest_api_init', function() {
    register_rest_route('google-auth/v1', '/login-url', array(
        'methods' => 'GET',
        'callback' => function($request) {
            // CSRF 방지를 위한 state 값 생성
            $state = bin2hex(random_bytes(16));
            // 생성된 state를 15분간 임시 저장
            set_transient('google_oauth_state_' . $state, 'valid', 15 * MINUTE_IN_SECONDS);
            
            return array('login_url' => get_google_login_url($state));
        },
        'permission_callback' => '__return_true'
    ));
});
?>