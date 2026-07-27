<?php
/**
 * Core class for Quasar AI SEO Assistant plugin.
 * Handles activation, connection tokens, and WordPress Application Passwords.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Quasar_Core {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        add_action('rest_api_init', [$this, 'maybe_generate_app_password']);
    }

    /**
     * On plugin activation, generate a connection token.
     */
    public function activate() {
        $token = get_option('quasar_connection_token', '');
        if (empty($token)) {
            $token = wp_generate_password(64, false, false);
            update_option('quasar_connection_token', $token);
        }
        update_option('quasar_connection_status', 'disconnected');
    }

    /**
     * On deactivation, clean up.
     */
    public function deactivate() {
        delete_option('quasar_connection_token');
        delete_option('quasar_connection_status');
        delete_option('quasar_app_password');
        delete_option('quasar_app_password_id');
        delete_option('quasar_user_id');
    }

    /**
     * Generate or retrieve the Application Password for Quasar.
     */
    public function get_or_create_app_password() {
        $existing = get_option('quasar_app_password', '');
        $existing_id = get_option('quasar_app_password_id', 0);

        // Check if the app password still exists
        if (!empty($existing) && $existing_id) {
            $user_id = (int) get_option('quasar_user_id', 0);
            if ($user_id && class_exists('WP_Application_Passwords')) {
                $app_passwords = WP_Application_Passwords::get_user_application_passwords($user_id);
                $found = false;
                foreach ($app_passwords as $ap) {
                    if ((int) $ap['uuid'] === (int) $existing_id) {
                        $found = true;
                        break;
                    }
                }
                if ($found) {
                    return $existing;
                }
            }
        }

        // Need to create a new one
        $user_id = get_current_user_id();
        if (!$user_id) {
            return false;
        }

        if (!class_exists('WP_Application_Passwords')) {
            return false;
        }

        $result = WP_Application_Passwords::create_new_application_password($user_id, [
            'name' => 'Quasar AI SEO Assistant',
        ]);

        if (is_wp_error($result)) {
            return false;
        }

        $password = $result[1];
        $uuid = $result[0]['uuid'];

        update_option('quasar_app_password', $password);
        update_option('quasar_app_password_id', $uuid);
        update_option('quasar_user_id', $user_id);

        return $password;
    }

    /**
     * Get the connection token.
     */
    public function get_connection_token() {
        return get_option('quasar_connection_token', '');
    }

    /**
     * Get connection status.
     */
    public function get_connection_status() {
        return get_option('quasar_connection_status', 'disconnected');
    }

    /**
     * Set connection status.
     */
    public function set_connection_status($status) {
        update_option('quasar_connection_status', $status);
    }

    /**
     * Get site info for the Quasar connection.
     */
    public function get_site_info() {
        return [
            'site_url'      => home_url(),
            'site_name'     => get_bloginfo('name'),
            'site_desc'     => get_bloginfo('description'),
            'wp_version'    => get_bloginfo('version'),
            'language'      => get_bloginfo('language'),
            'timezone'      => wp_timezone_string(),
            'admin_email'   => get_option('admin_email'),
            'connected'     => $this->get_connection_status() === 'connected',
            'token'         => $this->get_connection_token(),
        ];
    }

    /**
     * Verify a token matches our connection token.
     */
    public function verify_token($token) {
        $stored = $this->get_connection_token();
        return !empty($stored) && hash_equals($stored, $token);
    }

    /**
     * Get the Basic Auth credentials for WordPress REST API.
     */
    public function get_auth_header() {
        $user_id = (int) get_option('quasar_user_id', 0);
        $password = get_option('quasar_app_password', '');
        if (!$user_id || empty($password)) {
            return false;
        }
        $user = get_userdata($user_id);
        if (!$user) {
            return false;
        }
        return 'Basic ' . base64_encode($user->user_login . ':' . $password);
    }

    public function maybe_generate_app_password() {
        // Auto-generate on first REST request if not exists
        if (get_option('quasar_connection_status', '') === 'connected') {
            $this->get_or_create_app_password();
        }
    }
}
