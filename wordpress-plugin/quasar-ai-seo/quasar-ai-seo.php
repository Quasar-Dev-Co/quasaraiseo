<?php
/**
 * Plugin Name: Quasar AI SEO
 * Plugin URI:  https://seo.quasarasoft.com
 * Description: One plugin for the Quasar dashboard connection, custom page rendering, the MCP server, and AI JSON-LD schema.
 * Version:     2.1.0
 * Author:      Quasar AI SEO
 * Author URI:  https://seo.quasarasoft.com
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: quasar-ai-seo
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Combined plugin version.
 */
define('QUASAR_ADDONS_VERSION', '2.1.0');
define('QUASAR_ADDONS_PATH', plugin_dir_path(__FILE__));
define('QUASAR_ADDONS_URL', plugin_dir_url(__FILE__));
define('QUASAR_ADDONS_BASENAME', plugin_basename(__FILE__));

// Schema owns QUASAR_VERSION / QUASAR_PATH. Set the basename first so its
// languages path matches this plugin folder, and so the connector does not
// redefine QUASAR_VERSION.
if (!defined('QUASAR_VERSION')) {
    define('QUASAR_VERSION', '2.1.0');
}
if (!defined('QUASAR_BASENAME')) {
    define('QUASAR_BASENAME', 'quasar-ai-seo/quasar/quasar-ai-seo-schema.php');
}

// Load the QuasarAISEO Schema module (constants, autoloader, helpers).
require_once QUASAR_ADDONS_PATH . 'quasar/quasar-ai-seo-schema.php';
require_once QUASAR_ADDONS_PATH . 'includes/class-cwr-history.php';
require_once QUASAR_ADDONS_PATH . 'includes/class-cwr-export-import.php';

final class Custom_Web_Render {
    const VERSION = '2.1.0';
    const MENU_SLUG = 'custom-web-render';
    const DESIGN_CODE_SLUG = 'custom-web-render-design-code';
    const HISTORY_SLUG = 'custom-web-render-history';
    const EXPORT_IMPORT_SLUG = 'custom-web-render-export-import';

    const OPTION_HIDE_ON_DEACTIVATE = 'cwr_hide_posts_on_deactivation';
    const OPTION_DEACTIVATED_POSTS = 'cwr_deactivated_posts';
    const META_PRE_DEACTIVATION_STATUS = '_cwr_pre_deactivation_status';

    const META_ENABLED = '_cwr_enabled';
    const META_HTML = '_cwr_html';
    const META_CSS = '_cwr_css';
    const META_JS = '_cwr_js';
    const META_USE_HEADER = '_cwr_use_global_header';
    const META_HEADER_TYPE = '_cwr_header_type';
    const META_HEADER_ELEMENTOR_ID = '_cwr_header_elementor_id';
    const META_USE_FOOTER = '_cwr_use_global_footer';
    const META_FOOTER_TYPE = '_cwr_footer_type';
    const META_FOOTER_ELEMENTOR_ID = '_cwr_footer_elementor_id';
    const META_TITLE = '_cwr_meta_title';
    const META_DESCRIPTION = '_cwr_meta_description';
    const META_FOCUS_KEYWORD = '_cwr_focus_keyword';
    const META_CANONICAL = '_cwr_canonical_url';
    const META_ROBOTS_NOINDEX = '_cwr_robots_noindex';
    const META_ROBOTS_NOFOLLOW = '_cwr_robots_nofollow';
    const META_SCHEMA_TYPE = '_cwr_schema_type';
    const META_SOCIAL_TITLE = '_cwr_social_title';
    const META_SOCIAL_DESCRIPTION = '_cwr_social_description';
    const META_SOCIAL_IMAGE = '_cwr_social_image';
    const META_SEO_ANALYSIS = '_cwr_seo_analysis';
    const META_SEO_SCORE = '_cwr_seo_score';
    const META_SEO_ISSUES = '_cwr_seo_issues';

    const OPTION_HEADER = 'cwr_global_header_code';
    const OPTION_HEADER_TYPE = 'cwr_global_header_type';
    const OPTION_HEADER_ELEMENTOR_ID = 'cwr_global_header_elementor_id';
    const OPTION_FOOTER = 'cwr_global_footer_code';
    const OPTION_FOOTER_TYPE = 'cwr_global_footer_type';
    const OPTION_FOOTER_ELEMENTOR_ID = 'cwr_global_footer_elementor_id';
    const OPTION_HEAD = 'cwr_global_head_code';
    const OPTION_OPENROUTER_API_KEY = 'cwr_openrouter_api_key';
    const OPTION_OPENROUTER_MODEL = 'cwr_openrouter_model';
    const OPTION_OPENROUTER_SYSTEM_PROMPT = 'cwr_openrouter_system_prompt';
    const OPTION_OPENROUTER_MODELS = 'cwr_openrouter_models';

    const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'register_admin_menu'));
        add_action('admin_menu', array(__CLASS__, 'register_design_code_page'), 11);
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_admin_assets'));
        add_action('admin_init', array(__CLASS__, 'handle_admin_saves'));
        add_action('wp_ajax_cwr_analyze_seo', array(__CLASS__, 'ajax_analyze_seo'));
        add_action('wp_ajax_cwr_load_seo_problems', array(__CLASS__, 'ajax_load_seo_problems'));
        add_action('wp_ajax_cwr_openrouter_models', array(__CLASS__, 'ajax_openrouter_models'));
        add_action('wp_ajax_cwr_openrouter_test', array(__CLASS__, 'ajax_openrouter_test'));
        add_action('wp_ajax_cwr_set_design_global', array(__CLASS__, 'ajax_set_design_global'));
        add_action('wp_ajax_cwr_get_elementor_code', array(__CLASS__, 'ajax_get_elementor_code'));
        add_action('wp_ajax_cwr_get_existing_site_code', array(__CLASS__, 'ajax_get_existing_site_code'));
        add_filter('template_include', array(__CLASS__, 'maybe_use_custom_template'), 999);
        add_filter('single_template', array(__CLASS__, 'maybe_use_custom_template'), 999);
        add_filter('page_template', array(__CLASS__, 'maybe_use_custom_template'), 999);
        add_filter('pre_get_document_title', array(__CLASS__, 'filter_document_title'), 99);
        add_action('wp_head', array(__CLASS__, 'output_seo_tags'), 1);

        // Approval gate notice on CWR admin pages.
        add_action('admin_notices', array(__CLASS__, 'maybe_show_approval_notice'));
    }

    public static function activate() {
        add_option(self::OPTION_HEADER, '');
        add_option(self::OPTION_HEADER_TYPE, 'custom');
        add_option(self::OPTION_HEADER_ELEMENTOR_ID, 0);
        add_option(self::OPTION_FOOTER, '');
        add_option(self::OPTION_FOOTER_TYPE, 'custom');
        add_option(self::OPTION_FOOTER_ELEMENTOR_ID, 0);
        add_option(self::OPTION_HEAD, '');
        add_option(self::OPTION_OPENROUTER_MODEL, self::DEFAULT_OPENROUTER_MODEL);
        add_option(self::OPTION_OPENROUTER_SYSTEM_PROMPT, self::default_openrouter_system_prompt());
        add_option(self::OPTION_OPENROUTER_MODELS, array(), '', false);
        add_option(self::OPTION_HIDE_ON_DEACTIVATE, '1');

        if (class_exists('Custom_Web_Render_MCP')) {
            Custom_Web_Render_MCP::activate();
        }
    }

    /**
     * Show an approval notice on Custom Web Render admin pages when the
     * combined plugin has not yet been approved by team quasara.
     */
    public static function maybe_show_approval_notice() {
        if (!current_user_can('manage_options')) {
            return;
        }
        if (function_exists('quasar_is_approved') && quasar_is_approved()) {
            return;
        }
        $screen = get_current_screen();
        if (!$screen) {
            return;
        }
        // Only show on our plugin's admin pages.
        if (strpos($screen->id, 'custom-web-render') === false) {
            return;
        }
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><strong>Quasar AI SEO</strong> is awaiting approval from team quasara.
            Custom render, MCP server, and AI SEO features are limited until the site is approved.</p>
            <p>
                <a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=quasar-ai-seo&tab=status')); ?>">
                    Go to approval settings
                </a>
            </p>
        </div>
        <?php
    }

    public static function register_admin_menu() {
        add_menu_page(
            __('Custom Web Render', 'custom-web-render'),
            __('Custom Web Render', 'custom-web-render'),
            'manage_options',
            self::MENU_SLUG,
            array(__CLASS__, 'render_admin_page'),
            'dashicons-editor-code',
            58
        );

        // Submenu: History & Revert
        add_submenu_page(
            self::MENU_SLUG,
            __('History & Revert', 'custom-web-render'),
            __('History & Revert', 'custom-web-render'),
            'manage_options',
            self::HISTORY_SLUG,
            array('Custom_Web_Render_History', 'render_page')
        );

        // Submenu: Export & Import
        add_submenu_page(
            self::MENU_SLUG,
            __('Export & Import', 'custom-web-render'),
            __('Export & Import', 'custom-web-render'),
            'manage_options',
            self::EXPORT_IMPORT_SLUG,
            array('Custom_Web_Render_Export_Import', 'render_page')
        );
    }

    /**
     * Render the unified plugin tabs navigation across all plugin pages.
     *
     * @param string $active_tab 'render', 'history', 'export-import', 'design-code', 'mcp'
     */
    public static function render_tabs($active_tab = 'render') {
        $tabs = array(
            'render'        => array(
                'label' => __('Web Render & Editor', 'custom-web-render'),
                'icon'  => 'dashicons-editor-code',
                'url'   => admin_url('admin.php?page=' . self::MENU_SLUG),
            ),
            'history'       => array(
                'label' => __('History & Revert', 'custom-web-render'),
                'icon'  => 'dashicons-backup',
                'url'   => admin_url('admin.php?page=' . self::HISTORY_SLUG),
            ),
            'export-import' => array(
                'label' => __('Export & Import', 'custom-web-render'),
                'icon'  => 'dashicons-database-export',
                'url'   => admin_url('admin.php?page=' . self::EXPORT_IMPORT_SLUG),
            ),
            'design-code'   => array(
                'label' => __('Design Code', 'custom-web-render'),
                'icon'  => 'dashicons-art',
                'url'   => admin_url('admin.php?page=' . self::DESIGN_CODE_SLUG),
            ),
            'mcp'           => array(
                'label' => __('MCP Server', 'custom-web-render'),
                'icon'  => 'dashicons-rest-api',
                'url'   => admin_url('admin.php?page=' . Custom_Web_Render_MCP::MENU_SLUG),
            ),
        );
        ?>
        <nav class="nav-tab-wrapper cwr-nav-tabs" style="margin-bottom: 18px;">
            <?php foreach ($tabs as $slug => $tab) : ?>
                <a href="<?php echo esc_url($tab['url']); ?>" class="nav-tab <?php echo $active_tab === $slug ? 'nav-tab-active' : ''; ?>">
                    <span class="dashicons <?php echo esc_attr($tab['icon']); ?>" style="vertical-align: text-bottom; margin-right: 4px;"></span>
                    <?php echo esc_html($tab['label']); ?>
                </a>
            <?php endforeach; ?>
        </nav>
        <?php
    }

    /**
     * Register the "Design Code" submenu page.
     *
     * This page presents the website's main landing-page design code in
     * three read-only sections — Header, Footer, and Head/Body injection —
     * so administrators can quickly copy the raw code that drives the
     * global layout of custom-rendered pages.
     */
    public static function register_design_code_page() {
        add_submenu_page(
            self::MENU_SLUG,
            __('Design Code', 'custom-web-render'),
            __('Design Code', 'custom-web-render'),
            'manage_options',
            self::DESIGN_CODE_SLUG,
            array(__CLASS__, 'render_design_code_page')
        );
    }

    public static function enqueue_admin_assets($hook) {
        $allowed_hooks = array(
            'toplevel_page_' . self::MENU_SLUG,
            self::MENU_SLUG . '_page_' . Custom_Web_Render_MCP::MENU_SLUG,
            self::MENU_SLUG . '_page_' . self::DESIGN_CODE_SLUG,
            self::MENU_SLUG . '_page_' . self::HISTORY_SLUG,
            self::MENU_SLUG . '_page_' . self::EXPORT_IMPORT_SLUG,
        );

        if (!in_array($hook, $allowed_hooks, true)) {
            return;
        }

        wp_enqueue_style(
            'cwr-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.css',
            array(),
            self::VERSION
        );

        $code_editor_settings = wp_enqueue_code_editor(array('type' => 'text/html'));
        wp_enqueue_script('wp-theme-plugin-editor');
        wp_enqueue_style('wp-codemirror');

        wp_enqueue_script(
            'cwr-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.js',
            array('jquery'),
            self::VERSION,
            true
        );

        wp_localize_script(
            'cwr-admin',
            'CWRAdmin',
            array(
                'codeEditor' => $code_editor_settings,
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'seoNonce' => wp_create_nonce('cwr_analyze_seo'),
                'problemsNonce' => wp_create_nonce('cwr_load_seo_problems'),
                'settingsNonce' => wp_create_nonce('cwr_openrouter_settings'),
                'designNonce' => wp_create_nonce('cwr_design_action'),
                'elementorNonce' => wp_create_nonce('cwr_elementor_action'),
                'analyzingText' => __('Analyzing...', 'custom-web-render'),
                'analyzeText' => __('Scan SEO', 'custom-web-render'),
                'viewProblemsText' => __('View SEO Problems', 'custom-web-render'),
                'hideProblemsText' => __('Hide SEO Problems', 'custom-web-render'),
                'loadingProblemsText' => __('Loading SEO problems...', 'custom-web-render'),
                'aiAnalyzeText' => __('AI Analyze', 'custom-web-render'),
                'aiFixText' => __('AI Fix All', 'custom-web-render'),
                'rescanText' => __('Rescan', 'custom-web-render'),
                'analysisErrorText' => __('SEO analysis failed. Please check the API key, model, and server logs.', 'custom-web-render'),
                'loadModelsText' => __('Load Models', 'custom-web-render'),
                'loadingModelsText' => __('Loading models...', 'custom-web-render'),
                'testText' => __('Test Connection', 'custom-web-render'),
                'testingText' => __('Testing...', 'custom-web-render'),
                'modelsLoadedText' => __('Models loaded. Choose one, then save AI settings.', 'custom-web-render'),
                'settingsErrorText' => __('OpenRouter request failed. Check the key and model.', 'custom-web-render'),
                'importSuccessText' => __('Imported into code editor.', 'custom-web-render'),
                'setGlobalSuccessText' => __('Saved as Global!', 'custom-web-render'),
            )
        );

    }

    public static function handle_admin_saves() {
        if (!is_admin() || !current_user_can('manage_options')) {
            return;
        }

        if (isset($_POST['cwr_save_global']) || isset($_POST['cwr_save_ai_settings'])) {
            self::save_global_settings(isset($_POST['cwr_save_ai_settings']) ? 'ai_saved' : 'global_saved');
        }

        if (isset($_POST['cwr_save_item'])) {
            self::save_item_settings();
        }

        if (isset($_POST['cwr_refresh_design'])) {
            check_admin_referer('cwr_refresh_design', 'cwr_design_nonce');
            delete_transient('cwr_design_extract');
            self::redirect_with_notice('design_refreshed', 0, self::DESIGN_CODE_SLUG);
        }

        if (isset($_POST['cwr_set_global_section'])) {
            check_admin_referer('cwr_set_global_section', 'cwr_global_section_nonce');
            $section = isset($_POST['cwr_section']) ? sanitize_key($_POST['cwr_section']) : '';
            $design = self::get_design_extract();
            if ($section === 'header' && !empty($design['header'])) {
                update_option(self::OPTION_HEADER, $design['header']);
                update_option(self::OPTION_HEADER_TYPE, 'custom');
                self::redirect_with_notice('header_set_global', 0, self::DESIGN_CODE_SLUG);
            } elseif ($section === 'footer' && !empty($design['footer'])) {
                update_option(self::OPTION_FOOTER, $design['footer']);
                update_option(self::OPTION_FOOTER_TYPE, 'custom');
                self::redirect_with_notice('footer_set_global', 0, self::DESIGN_CODE_SLUG);
            }
        }

        // Revert change in History
        if (isset($_POST['cwr_revert_entry'])) {
            check_admin_referer('cwr_revert_history', 'cwr_history_nonce');
            $entry_id = isset($_POST['cwr_history_id']) ? sanitize_text_field(wp_unslash($_POST['cwr_history_id'])) : '';
            if (class_exists('Custom_Web_Render_History')) {
                $result = Custom_Web_Render_History::revert($entry_id);
                if (!empty($result['success'])) {
                    self::redirect_with_notice('history_reverted', 0, self::HISTORY_SLUG);
                } else {
                    self::redirect_with_notice('history_revert_failed', 0, self::HISTORY_SLUG);
                }
            }
        }

        // Clear History
        if (isset($_POST['cwr_clear_history'])) {
            check_admin_referer('cwr_clear_history', 'cwr_history_nonce');
            if (class_exists('Custom_Web_Render_History')) {
                Custom_Web_Render_History::clear_all();
            }
            self::redirect_with_notice('history_cleared', 0, self::HISTORY_SLUG);
        }

        // Export Data
        if (isset($_POST['cwr_do_export'])) {
            if (class_exists('Custom_Web_Render_Export_Import')) {
                Custom_Web_Render_Export_Import::handle_export();
            }
        }

        // Import Data
        if (isset($_POST['cwr_do_import'])) {
            if (class_exists('Custom_Web_Render_Export_Import')) {
                $result = Custom_Web_Render_Export_Import::handle_import();
                if (!empty($result['success'])) {
                    set_transient('cwr_import_notice', $result['message'], 60);
                    self::redirect_with_notice('import_success', 0, self::EXPORT_IMPORT_SLUG);
                } else {
                    set_transient('cwr_import_error', $result['message'], 60);
                    self::redirect_with_notice('import_failed', 0, self::EXPORT_IMPORT_SLUG);
                }
            }
        }
    }

    private static function save_global_settings($notice = 'global_saved') {
        check_admin_referer('cwr_save_global_settings', 'cwr_global_nonce');

        $tracked_global_keys = array(
            self::OPTION_HEADER,
            self::OPTION_FOOTER,
            self::OPTION_HEAD,
            self::OPTION_HEADER_TYPE,
            self::OPTION_HEADER_ELEMENTOR_ID,
            self::OPTION_FOOTER_TYPE,
            self::OPTION_FOOTER_ELEMENTOR_ID,
            self::OPTION_OPENROUTER_MODEL,
            self::OPTION_OPENROUTER_SYSTEM_PROMPT,
            self::OPTION_HIDE_ON_DEACTIVATE,
        );
        $previous = array();
        foreach ($tracked_global_keys as $gk) {
            $previous[$gk] = get_option($gk, '');
        }

        update_option(self::OPTION_HEADER, self::trusted_code_from_post('cwr_global_header'));
        update_option(self::OPTION_FOOTER, self::trusted_code_from_post('cwr_global_footer'));
        update_option(self::OPTION_HEAD, self::trusted_code_from_post('cwr_global_head'));

        $header_type = isset($_POST['cwr_global_header_type']) ? sanitize_key($_POST['cwr_global_header_type']) : 'custom';
        if (!in_array($header_type, array('custom', 'elementor', 'theme', 'extracted'), true)) {
            $header_type = 'custom';
        }
        update_option(self::OPTION_HEADER_TYPE, $header_type);
        update_option(self::OPTION_HEADER_ELEMENTOR_ID, isset($_POST['cwr_global_header_elementor_id']) ? absint($_POST['cwr_global_header_elementor_id']) : 0);

        $footer_type = isset($_POST['cwr_global_footer_type']) ? sanitize_key($_POST['cwr_global_footer_type']) : 'custom';
        if (!in_array($footer_type, array('custom', 'elementor', 'theme', 'extracted'), true)) {
            $footer_type = 'custom';
        }
        update_option(self::OPTION_FOOTER_TYPE, $footer_type);
        update_option(self::OPTION_FOOTER_ELEMENTOR_ID, isset($_POST['cwr_global_footer_elementor_id']) ? absint($_POST['cwr_global_footer_elementor_id']) : 0);

        if (isset($_POST['cwr_hide_posts_on_deactivation'])) {
            update_option(self::OPTION_HIDE_ON_DEACTIVATE, '1');
        } else {
            update_option(self::OPTION_HIDE_ON_DEACTIVATE, '0');
        }

        self::save_openrouter_settings();

        $new = array();
        $changed_keys = array();
        foreach ($tracked_global_keys as $gk) {
            $new_val = get_option($gk, '');
            $new[$gk] = $new_val;
            if ($new_val !== $previous[$gk]) {
                $changed_keys[] = $gk;
            }
        }

        if (!empty($changed_keys) && class_exists('Custom_Web_Render_History')) {
            Custom_Web_Render_History::log_change(
                'global_update',
                0,
                __('Global Settings', 'custom-web-render'),
                'global',
                __('Updated Global Layout and Settings', 'custom-web-render'),
                $previous,
                $new,
                $changed_keys
            );
        }

        self::redirect_with_notice($notice);
    }

    private static function save_openrouter_settings() {
        if (isset($_POST['cwr_openrouter_clear_key'])) {
            delete_option(self::OPTION_OPENROUTER_API_KEY);
        }

        if (isset($_POST['cwr_openrouter_api_key'])) {
            $api_key = sanitize_text_field(wp_unslash($_POST['cwr_openrouter_api_key']));
            if ($api_key !== '') {
                update_option(self::OPTION_OPENROUTER_API_KEY, $api_key, false);
            }
        }

        $model = isset($_POST['cwr_openrouter_model'])
            ? sanitize_text_field(wp_unslash($_POST['cwr_openrouter_model']))
            : self::DEFAULT_OPENROUTER_MODEL;
        if ($model === 'custom') {
            $model = isset($_POST['cwr_openrouter_custom_model'])
                ? sanitize_text_field(wp_unslash($_POST['cwr_openrouter_custom_model']))
                : '';
        }
        update_option(self::OPTION_OPENROUTER_MODEL, self::normalize_model_slug($model), false);

        $system_prompt = isset($_POST['cwr_openrouter_system_prompt'])
            ? sanitize_textarea_field(wp_unslash($_POST['cwr_openrouter_system_prompt']))
            : '';
        update_option(
            self::OPTION_OPENROUTER_SYSTEM_PROMPT,
            $system_prompt !== '' ? $system_prompt : self::default_openrouter_system_prompt(),
            false
        );
    }

    private static function save_item_settings() {
        check_admin_referer('cwr_save_item_settings', 'cwr_item_nonce');

        $post_id = isset($_POST['cwr_post_id']) ? absint($_POST['cwr_post_id']) : 0;
        if (!$post_id || !self::is_supported_post($post_id) || !current_user_can('edit_post', $post_id)) {
            wp_die(esc_html__('You do not have permission to edit this item.', 'custom-web-render'));
        }

        $tracked_meta_keys = array(
            self::META_ENABLED,
            self::META_USE_HEADER,
            self::META_USE_FOOTER,
            self::META_HEADER_TYPE,
            self::META_HEADER_ELEMENTOR_ID,
            self::META_FOOTER_TYPE,
            self::META_FOOTER_ELEMENTOR_ID,
            self::META_HTML,
            self::META_CSS,
            self::META_JS,
            self::META_TITLE,
            self::META_DESCRIPTION,
            self::META_FOCUS_KEYWORD,
            self::META_CANONICAL,
            self::META_ROBOTS_NOINDEX,
            self::META_ROBOTS_NOFOLLOW,
            self::META_SCHEMA_TYPE,
            self::META_SOCIAL_TITLE,
            self::META_SOCIAL_DESCRIPTION,
            self::META_SOCIAL_IMAGE,
        );
        $previous = array();
        foreach ($tracked_meta_keys as $k) {
            $previous[$k] = get_post_meta($post_id, $k, true);
        }

        update_post_meta($post_id, self::META_ENABLED, isset($_POST['cwr_enabled']) ? '1' : '0');
        update_post_meta($post_id, self::META_USE_HEADER, isset($_POST['cwr_use_global_header']) ? '1' : '0');
        update_post_meta($post_id, self::META_USE_FOOTER, isset($_POST['cwr_use_global_footer']) ? '1' : '0');

        $header_type = isset($_POST['cwr_header_type']) ? sanitize_key($_POST['cwr_header_type']) : 'global';
        if (!in_array($header_type, array('global', 'custom', 'elementor', 'theme', 'extracted', 'none'), true)) {
            $header_type = 'global';
        }
        update_post_meta($post_id, self::META_HEADER_TYPE, $header_type);
        update_post_meta($post_id, self::META_HEADER_ELEMENTOR_ID, isset($_POST['cwr_header_elementor_id']) ? absint($_POST['cwr_header_elementor_id']) : 0);

        $footer_type = isset($_POST['cwr_footer_type']) ? sanitize_key($_POST['cwr_footer_type']) : 'global';
        if (!in_array($footer_type, array('global', 'custom', 'elementor', 'theme', 'extracted', 'none'), true)) {
            $footer_type = 'global';
        }
        update_post_meta($post_id, self::META_FOOTER_TYPE, $footer_type);
        update_post_meta($post_id, self::META_FOOTER_ELEMENTOR_ID, isset($_POST['cwr_footer_elementor_id']) ? absint($_POST['cwr_footer_elementor_id']) : 0);

        update_post_meta($post_id, self::META_HTML, self::trusted_code_from_post('cwr_html'));
        update_post_meta($post_id, self::META_CSS, self::trusted_code_from_post('cwr_css'));
        update_post_meta($post_id, self::META_JS, self::trusted_code_from_post('cwr_js'));
        self::save_post_seo_settings($post_id);

        $new = array();
        $changed_keys = array();
        foreach ($tracked_meta_keys as $k) {
            $new_val = get_post_meta($post_id, $k, true);
            $new[$k] = $new_val;
            if ($new_val !== $previous[$k]) {
                $changed_keys[] = $k;
            }
        }

        if (!empty($changed_keys) && class_exists('Custom_Web_Render_History')) {
            $summary_parts = array();
            if (in_array(self::META_HTML, $changed_keys, true)) $summary_parts[] = 'HTML';
            if (in_array(self::META_CSS, $changed_keys, true)) $summary_parts[] = 'CSS';
            if (in_array(self::META_JS, $changed_keys, true)) $summary_parts[] = 'JS';
            if (in_array(self::META_TITLE, $changed_keys, true) || in_array(self::META_DESCRIPTION, $changed_keys, true)) $summary_parts[] = 'SEO Meta';
            if (in_array(self::META_ENABLED, $changed_keys, true)) $summary_parts[] = 'Render Status';
            if (empty($summary_parts)) $summary_parts[] = 'Settings';

            $summary = sprintf(
                /* translators: 1: changed sections, 2: post title */
                __('Updated %1$s for "%2$s"', 'custom-web-render'),
                implode(', ', $summary_parts),
                get_the_title($post_id) ?: sprintf(__('Post #%d', 'custom-web-render'), $post_id)
            );

            Custom_Web_Render_History::log_change(
                'post_update',
                $post_id,
                get_the_title($post_id) ?: sprintf(__('Post #%d', 'custom-web-render'), $post_id),
                get_post_type($post_id),
                $summary,
                $previous,
                $new,
                $changed_keys
            );
        }

        self::redirect_with_notice('item_saved', $post_id);
    }

    private static function save_post_seo_settings($post_id) {
        $fields = array(
            self::META_TITLE => 'cwr_meta_title',
            self::META_DESCRIPTION => 'cwr_meta_description',
            self::META_FOCUS_KEYWORD => 'cwr_focus_keyword',
            self::META_SOCIAL_TITLE => 'cwr_social_title',
            self::META_SOCIAL_DESCRIPTION => 'cwr_social_description',
        );

        foreach ($fields as $meta_key => $post_key) {
            $value = isset($_POST[$post_key]) ? sanitize_text_field(wp_unslash($_POST[$post_key])) : '';
            if ($meta_key === self::META_DESCRIPTION || $meta_key === self::META_SOCIAL_DESCRIPTION) {
                $value = isset($_POST[$post_key]) ? sanitize_textarea_field(wp_unslash($_POST[$post_key])) : '';
            }
            update_post_meta($post_id, $meta_key, $value);
        }

        $canonical = isset($_POST['cwr_canonical_url']) ? esc_url_raw(wp_unslash($_POST['cwr_canonical_url'])) : '';
        update_post_meta($post_id, self::META_CANONICAL, $canonical);

        $social_image = isset($_POST['cwr_social_image']) ? esc_url_raw(wp_unslash($_POST['cwr_social_image'])) : '';
        update_post_meta($post_id, self::META_SOCIAL_IMAGE, $social_image);

        $schema_type = isset($_POST['cwr_schema_type']) ? sanitize_key(wp_unslash($_POST['cwr_schema_type'])) : 'WebPage';
        update_post_meta($post_id, self::META_SCHEMA_TYPE, self::normalize_schema_type($schema_type));

        update_post_meta($post_id, self::META_ROBOTS_NOINDEX, isset($_POST['cwr_robots_noindex']) ? '1' : '0');
        update_post_meta($post_id, self::META_ROBOTS_NOFOLLOW, isset($_POST['cwr_robots_nofollow']) ? '1' : '0');

        self::sync_compatible_seo_meta($post_id);
    }

    private static function sync_compatible_seo_meta($post_id) {
        $meta_title = (string) get_post_meta($post_id, self::META_TITLE, true);
        $meta_description = (string) get_post_meta($post_id, self::META_DESCRIPTION, true);
        $focus_keyword = (string) self::first_meta_value($post_id, array(self::META_FOCUS_KEYWORD, '_yoast_wpseo_focuskw', 'rank_math_focus_keyword'));
        $canonical = (string) get_post_meta($post_id, self::META_CANONICAL, true);
        $noindex = get_post_meta($post_id, self::META_ROBOTS_NOINDEX, true) === '1';
        $nofollow = get_post_meta($post_id, self::META_ROBOTS_NOFOLLOW, true) === '1';

        update_post_meta($post_id, '_yoast_wpseo_title', $meta_title);
        update_post_meta($post_id, 'rank_math_title', $meta_title);
        update_post_meta($post_id, '_seopress_titles_title', $meta_title);
        update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta_description);
        update_post_meta($post_id, 'rank_math_description', $meta_description);
        update_post_meta($post_id, '_seopress_titles_desc', $meta_description);
        update_post_meta($post_id, '_yoast_wpseo_focuskw', $focus_keyword);
        update_post_meta($post_id, 'rank_math_focus_keyword', $focus_keyword);
        update_post_meta($post_id, '_yoast_wpseo_canonical', $canonical);
        update_post_meta($post_id, 'rank_math_canonical_url', $canonical);
        update_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', $noindex ? '1' : '0');
        update_post_meta($post_id, '_yoast_wpseo_meta-robots-nofollow', $nofollow ? '1' : '0');
        update_post_meta($post_id, 'rank_math_robots', array($noindex ? 'noindex' : 'index', $nofollow ? 'nofollow' : 'follow'));
    }

    private static function trusted_code_from_post($key) {
        if (!isset($_POST[$key])) {
            return '';
        }

        $value = wp_unslash($_POST[$key]);
        return is_string($value) ? $value : '';
    }

    private static function redirect_with_notice($notice, $post_id = 0, $page_slug = '') {
        $args = array(
            'page' => $page_slug !== '' ? $page_slug : self::MENU_SLUG,
            'cwr_notice' => $notice,
        );

        if ($post_id) {
            $args['cwr_item'] = $post_id;
        }

        wp_safe_redirect(add_query_arg($args, admin_url('admin.php')));
        exit;
    }

    public static function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $current_tab = isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'render';
        if ($current_tab === 'history') {
            if (class_exists('Custom_Web_Render_History')) {
                Custom_Web_Render_History::render_page();
                return;
            }
        }
        if ($current_tab === 'export-import') {
            if (class_exists('Custom_Web_Render_Export_Import')) {
                Custom_Web_Render_Export_Import::render_page();
                return;
            }
        }

        $selected_id = isset($_GET['cwr_item']) ? absint($_GET['cwr_item']) : 0;
        $selected_post = $selected_id && self::is_supported_post($selected_id) ? get_post($selected_id) : null;
        $items = self::get_supported_posts();

        $current_orderby = isset($_GET['cwr_orderby']) ? sanitize_key($_GET['cwr_orderby']) : 'date';
        $current_order = isset($_GET['cwr_order']) ? strtoupper(sanitize_key($_GET['cwr_order'])) : 'DESC';
        ?>
        <div class="wrap cwr-wrap">
            <h1><?php esc_html_e('Custom Web Render', 'custom-web-render'); ?></h1>

            <?php self::render_tabs('render'); ?>
            <?php self::render_admin_notice(); ?>
            <?php self::render_seo_overview($items); ?>

            <div class="cwr-layout">
                <section class="cwr-panel cwr-panel-list">
                    <div class="cwr-panel-header">
                        <div>
                            <h2><?php esc_html_e('Pages & Posts', 'custom-web-render'); ?></h2>
                            <p class="cwr-subtitle"><?php esc_html_e('Sorted by most recent first', 'custom-web-render'); ?></p>
                        </div>
                        <div class="cwr-sort-controls">
                            <form method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>" class="cwr-sort-form">
                                <input type="hidden" name="page" value="<?php echo esc_attr(self::MENU_SLUG); ?>">
                                <?php if ($selected_id) : ?>
                                    <input type="hidden" name="cwr_item" value="<?php echo esc_attr($selected_id); ?>">
                                <?php endif; ?>
                                <select name="cwr_orderby" onchange="this.form.submit();" aria-label="<?php esc_attr_e('Sort field', 'custom-web-render'); ?>">
                                    <option value="date" <?php selected($current_orderby, 'date'); ?>><?php esc_html_e('Date Created (Newest Top)', 'custom-web-render'); ?></option>
                                    <option value="modified" <?php selected($current_orderby, 'modified'); ?>><?php esc_html_e('Date Modified (Recent Top)', 'custom-web-render'); ?></option>
                                    <option value="title" <?php selected($current_orderby, 'title'); ?>><?php esc_html_e('Title (A-Z)', 'custom-web-render'); ?></option>
                                    <option value="post_type" <?php selected($current_orderby, 'post_type'); ?>><?php esc_html_e('Post Type', 'custom-web-render'); ?></option>
                                </select>
                                <select name="cwr_order" onchange="this.form.submit();" aria-label="<?php esc_attr_e('Sort order', 'custom-web-render'); ?>">
                                    <option value="DESC" <?php selected($current_order, 'DESC'); ?>><?php esc_html_e('Descending (Recent First)', 'custom-web-render'); ?></option>
                                    <option value="ASC" <?php selected($current_order, 'ASC'); ?>><?php esc_html_e('Ascending', 'custom-web-render'); ?></option>
                                </select>
                            </form>
                        </div>
                    </div>

                    <div class="cwr-table-wrap">
                        <table class="widefat striped cwr-items-table">
                            <thead>
                                <tr>
                                    <th><?php esc_html_e('Title', 'custom-web-render'); ?></th>
                                    <th><?php esc_html_e('Type', 'custom-web-render'); ?></th>
                                    <th><?php esc_html_e('Status', 'custom-web-render'); ?></th>
                                    <th><?php esc_html_e('Date / Time', 'custom-web-render'); ?></th>
                                    <th><?php esc_html_e('SEO', 'custom-web-render'); ?></th>
                                    <th><?php esc_html_e('Render', 'custom-web-render'); ?></th>
                                    <th><?php esc_html_e('Action', 'custom-web-render'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($items) : ?>
                                    <?php foreach ($items as $item) : ?>
                                        <?php
                                        $enabled = get_post_meta($item->ID, self::META_ENABLED, true) === '1';
                                        $load_url = add_query_arg(
                                            array(
                                                'page'        => self::MENU_SLUG,
                                                'cwr_item'    => $item->ID,
                                                'cwr_orderby' => $current_orderby,
                                                'cwr_order'   => $current_order,
                                            ),
                                            admin_url('admin.php')
                                        );
                                        $analysis = self::get_saved_seo_analysis($item->ID);
                                        $score = isset($analysis['score']) ? (int) $analysis['score'] : null;
                                        $issue_count = isset($analysis['issue_count']) ? (int) $analysis['issue_count'] : null;
                                        ?>
                                        <tr class="<?php echo $selected_id === $item->ID ? 'is-selected' : ''; ?>">
                                            <td>
                                                <strong><?php echo esc_html(get_the_title($item) ?: __('(no title)', 'custom-web-render')); ?></strong>
                                                <div class="cwr-row-url"><?php echo esc_html(get_permalink($item)); ?></div>
                                            </td>
                                            <td><?php echo esc_html(ucfirst($item->post_type)); ?></td>
                                            <td><?php echo esc_html(ucfirst($item->post_status)); ?></td>
                                            <td>
                                                <div class="cwr-date-primary"><?php echo esc_html(get_the_date('M j, Y', $item)); ?></div>
                                                <div class="cwr-time-secondary"><?php echo esc_html(get_the_date('g:i a', $item)); ?></div>
                                            </td>
                                            <td data-cwr-row-score="<?php echo esc_attr($item->ID); ?>">
                                                <?php self::render_score_badge($score, $issue_count); ?>
                                            </td>
                                            <td>
                                                <span class="cwr-badge <?php echo $enabled ? 'is-active' : 'is-inactive'; ?>">
                                                    <?php echo $enabled ? esc_html__('Active', 'custom-web-render') : esc_html__('Inactive', 'custom-web-render'); ?>
                                                </span>
                                            </td>
                                            <td>
                                                <a class="button button-small" href="<?php echo esc_url($load_url); ?>">
                                                    <?php esc_html_e('Load', 'custom-web-render'); ?>
                                                </a>
                                                <button type="button" class="button button-small cwr-seo-analyze" data-mode="local" data-post-id="<?php echo esc_attr($item->ID); ?>">
                                                    <?php esc_html_e('Scan SEO', 'custom-web-render'); ?>
                                                </button>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else : ?>
                                    <tr>
                                        <td colspan="7"><?php esc_html_e('No pages or posts found.', 'custom-web-render'); ?></td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section class="cwr-panel cwr-panel-editor">
                    <?php self::render_item_editor($selected_post); ?>
                </section>

                <section class="cwr-panel cwr-panel-global">
                    <?php self::render_global_settings(); ?>
                </section>
            </div>
        </div>
        <?php
    }

    /**
     * Render the "Design Code" admin page.
     *
     * Fetches the live homepage HTML, parses it with DOMDocument, and
     * extracts the real header, footer, body, head, logo image, colors,
     * fonts, and navigation links — so the user can copy the actual
     * landing-page design code.
     */
    public static function render_design_code_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $design = self::get_design_extract();
        $has_error = !empty($design['error']);
        ?>
        <div class="wrap cwr-wrap cwr-design-code-wrap">
            <h1><?php esc_html_e('Design Code', 'custom-web-render'); ?></h1>
            <?php self::render_tabs('design-code'); ?>
            <p class="description"><?php esc_html_e('The raw design code extracted from your website main landing page. Copy any section below and reuse it in your theme, child theme, or external project.', 'custom-web-render'); ?></p>

            <?php self::render_admin_notice(); ?>

            <div class="cwr-design-toolbar">
                <form method="post" class="cwr-design-refresh-form">
                    <?php wp_nonce_field('cwr_refresh_design', 'cwr_design_nonce'); ?>
                    <button type="submit" name="cwr_refresh_design" value="1" class="button button-primary">
                        <span class="dashicons dashicons-update"></span>
                        <?php esc_html_e('Re-extract from Live Page', 'custom-web-render'); ?>
                    </button>
                </form>
                <?php if (!$has_error && !empty($design['extracted_at'])) : ?>
                    <span class="cwr-design-meta">
                        <?php
                        echo esc_html(
                            sprintf(
                                /* translators: 1: extraction date, 2: source URL. */
                                __('Extracted: %1$s · Source: %2$s', 'custom-web-render'),
                                self::format_design_date($design['extracted_at']),
                                $design['page_url']
                            )
                        );
                        ?>
                    </span>
                <?php endif; ?>
            </div>

            <?php if ($has_error) : ?>
                <div class="notice notice-error inline">
                    <p><?php echo esc_html($design['error']); ?></p>
                    <p><?php esc_html_e('Click "Re-extract from Live Page" to try again.', 'custom-web-render'); ?></p>
                </div>
                <?php
                return;
            endif;
            ?>

            <?php
            $header_html = isset($design['header']) ? $design['header'] : '';
            $footer_html = isset($design['footer']) ? $design['footer'] : '';
            $body_html = isset($design['body']) ? $design['body'] : '';
            $head_html = isset($design['head']) ? $design['head'] : '';
            $logo = isset($design['logo']) ? $design['logo'] : null;
            $colors = isset($design['colors']) ? $design['colors'] : array();
            $fonts = isset($design['fonts']) ? $design['fonts'] : array();
            $links = isset($design['links']) ? $design['links'] : array();
            $meta = isset($design['meta']) ? $design['meta'] : array();

            $code_sections = array(
                array(
                    'id' => 'cwr-design-header',
                    'label' => __('Header Code', 'custom-web-render'),
                    'description' => __('The <header> element extracted from the live landing page — navigation, logo, and top bar markup.', 'custom-web-render'),
                    'code' => $header_html,
                    'icon' => 'dashicons-arrow-up-alt',
                ),
                array(
                    'id' => 'cwr-design-footer',
                    'label' => __('Footer Code', 'custom-web-render'),
                    'description' => __('The <footer> element extracted from the live landing page — copyright, widgets, and bottom links.', 'custom-web-render'),
                    'code' => $footer_html,
                    'icon' => 'dashicons-arrow-down-alt',
                ),
                array(
                    'id' => 'cwr-design-body',
                    'label' => __('Body Code', 'custom-web-render'),
                    'description' => __('The main content area extracted from the live landing page — sections, hero, content blocks between header and footer.', 'custom-web-render'),
                    'code' => $body_html,
                    'icon' => 'dashicons-align-center',
                ),
                array(
                    'id' => 'cwr-design-head',
                    'label' => __('Head Code', 'custom-web-render'),
                    'description' => __('The <head> element — meta tags, stylesheet links, font imports, and scripts from the live landing page.', 'custom-web-render'),
                    'code' => $head_html,
                    'icon' => 'dashicons-admin-generic',
                ),
            );
            ?>

            <div class="cwr-design-grid">
                <?php foreach ($code_sections as $section) : ?>
                    <?php
                    $is_empty = trim($section['code']) === '';
                    $line_count = $is_empty ? 1 : max(1, substr_count($section['code'], "\n") + 1);
                    ?>
                    <section class="cwr-panel cwr-design-card <?php echo $is_empty ? 'is-empty' : ''; ?>">
                        <div class="cwr-panel-header">
                            <div class="cwr-design-card-title">
                                <span class="dashicons <?php echo esc_attr($section['icon']); ?>"></span>
                                <div>
                                    <h2><?php echo esc_html($section['label']); ?></h2>
                                    <p class="cwr-subtitle"><?php echo esc_html($section['description']); ?></p>
                                </div>
                            </div>
                            <span class="cwr-badge <?php echo $is_empty ? 'is-inactive' : 'is-active'; ?>">
                                <?php echo $is_empty ? esc_html__('Not found', 'custom-web-render') : esc_html__('Ready', 'custom-web-render'); ?>
                            </span>
                        </div>

                        <div class="cwr-design-code-actions">
                            <button type="button" class="button button-primary cwr-copy-button" data-copy-target="<?php echo esc_attr($section['id']); ?>">
                                <?php esc_html_e('Copy Code', 'custom-web-render'); ?>
                            </button>
                            <button type="button" class="button cwr-design-download" data-target="<?php echo esc_attr($section['id']); ?>" data-filename="<?php echo esc_attr($section['id']); ?>.html">
                                <?php esc_html_e('Download', 'custom-web-render'); ?>
                            </button>
                            <?php if ($section['id'] === 'cwr-design-header') : ?>
                                <button type="button" class="button button-secondary cwr-set-global-btn" data-section="header" data-target="cwr-design-header">
                                    <span class="dashicons dashicons-admin-appearance"></span>
                                    <?php esc_html_e('Set as Global Header', 'custom-web-render'); ?>
                                </button>
                            <?php elseif ($section['id'] === 'cwr-design-footer') : ?>
                                <button type="button" class="button button-secondary cwr-set-global-btn" data-section="footer" data-target="cwr-design-footer">
                                    <span class="dashicons dashicons-admin-appearance"></span>
                                    <?php esc_html_e('Set as Global Footer', 'custom-web-render'); ?>
                                </button>
                            <?php endif; ?>
                            <span class="cwr-design-line-count"><?php echo esc_html(sprintf(_n('%s line', '%s lines', $line_count, 'custom-web-render'), number_format_i18n($line_count))); ?></span>
                        </div>

                        <pre id="<?php echo esc_attr($section['id']); ?>" class="cwr-design-pre"><code><?php echo esc_html($section['code'] !== '' ? $section['code'] : __('/* No matching element found on the landing page. */', 'custom-web-render')); ?></code></pre>
                    </section>
                <?php endforeach; ?>
            </div>

            <div class="cwr-design-info-grid">
                <?php if ($logo) : ?>
                    <section class="cwr-panel cwr-design-info-card">
                        <h2><span class="dashicons dashicons-format-image"></span> <?php esc_html_e('Logo Image', 'custom-web-render'); ?></h2>
                        <?php if (!empty($logo['url'])) : ?>
                            <img src="<?php echo esc_url($logo['url']); ?>" alt="<?php echo esc_attr($logo['alt']); ?>" class="cwr-design-logo-preview" loading="lazy">
                        <?php endif; ?>
                        <table class="widefat striped cwr-design-info-table">
                            <tbody>
                                <tr><th>URL</th><td><code><?php echo esc_html($logo['url']); ?></code> <button type="button" class="button button-small cwr-copy-button" data-copy-target="cwr-logo-url"><?php esc_html_e('Copy', 'custom-web-render'); ?></button></td></tr>
                                <tr><th>Alt Text</th><td><?php echo esc_html($logo['alt']); ?></td></tr>
                                <?php if (!empty($logo['width'])) : ?><tr><th>Dimensions</th><td><?php echo esc_html($logo['width'] . ' × ' . $logo['height'] . ' px'); ?></td></tr><?php endif; ?>
                                <?php if (!empty($logo['srcset'])) : ?><tr><th>Srcset</th><td><code><?php echo esc_html($logo['srcset']); ?></code></td></tr><?php endif; ?>
                            </tbody>
                        </table>
                        <pre id="cwr-logo-url" hidden><code><?php echo esc_html($logo['url']); ?></code></pre>
                        <?php if (!empty($logo['html'])) : ?>
                            <p class="cwr-design-subsection"><?php esc_html_e('Logo HTML snippet:', 'custom-web-render'); ?></p>
                            <div class="cwr-design-code-actions">
                                <button type="button" class="button button-small cwr-copy-button" data-copy-target="cwr-logo-html"><?php esc_html_e('Copy', 'custom-web-render'); ?></button>
                            </div>
                            <pre id="cwr-logo-html" class="cwr-design-pre cwr-design-pre-sm"><code><?php echo esc_html($logo['html']); ?></code></pre>
                        <?php endif; ?>
                    </section>
                <?php endif; ?>

                <?php if ($colors) : ?>
                    <section class="cwr-panel cwr-design-info-card">
                        <h2><span class="dashicons dashicons-art"></span> <?php esc_html_e('Colors', 'custom-web-render'); ?></h2>
                        <p class="cwr-subtitle"><?php esc_html_e('Color values found in the landing page CSS and inline styles.', 'custom-web-render'); ?></p>
                        <div class="cwr-design-color-grid">
                            <?php foreach ($colors as $color => $count) : ?>
                                <div class="cwr-design-color-item">
                                    <span class="cwr-design-swatch" style="background: <?php echo esc_attr($color); ?>;" title="<?php echo esc_attr($color); ?>"></span>
                                    <code><?php echo esc_html($color); ?></code>
                                    <span class="cwr-design-color-count"><?php echo esc_html(sprintf(_n('%d use', '%d uses', $count, 'custom-web-render'), $count)); ?></span>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </section>
                <?php endif; ?>

                <?php if (!empty($fonts['families'])) : ?>
                    <section class="cwr-panel cwr-design-info-card">
                        <h2><span class="dashicons dashicons-editor-textcolor"></span> <?php esc_html_e('Fonts', 'custom-web-render'); ?></h2>
                        <p class="cwr-subtitle"><?php esc_html_e('Font families and Google Font links found on the landing page.', 'custom-web-render'); ?></p>
                        <ul class="cwr-plain-list cwr-design-font-list">
                            <?php foreach ($fonts['families'] as $family) : ?>
                                <li><span class="dashicons dashicons-editor-textcolor"></span> <?php echo esc_html($family); ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <?php if (!empty($fonts['google_font_links'])) : ?>
                            <p class="cwr-design-subsection"><?php esc_html_e('Google Font links:', 'custom-web-render'); ?></p>
                            <ul class="cwr-plain-list cwr-design-font-list">
                                <?php foreach ($fonts['google_font_links'] as $link) : ?>
                                    <li><code><?php echo esc_html($link); ?></code></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </section>
                <?php endif; ?>

                <?php if ($links) : ?>
                    <section class="cwr-panel cwr-design-info-card">
                        <h2><span class="dashicons dashicons-admin-links"></span> <?php esc_html_e('Navigation Links', 'custom-web-render'); ?></h2>
                        <p class="cwr-subtitle"><?php esc_html_e('Links extracted from the header navigation menu.', 'custom-web-render'); ?></p>
                        <table class="widefat striped cwr-design-info-table">
                            <thead><tr><th>Text</th><th>URL</th></tr></thead>
                            <tbody>
                                <?php foreach ($links as $link) : ?>
                                    <tr>
                                        <td><?php echo esc_html($link['text']); ?></td>
                                        <td><a href="<?php echo esc_url($link['href']); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($link['href']); ?></a></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </section>
                <?php endif; ?>

                <?php if ($meta) : ?>
                    <section class="cwr-panel cwr-design-info-card">
                        <h2><span class="dashicons dashicons-info"></span> <?php esc_html_e('Page Meta', 'custom-web-render'); ?></h2>
                        <table class="widefat striped cwr-design-info-table">
                            <tbody>
                                <?php foreach ($meta as $key => $value) : ?>
                                    <tr><th><?php echo esc_html(ucfirst(str_replace('_', ' ', $key))); ?></th><td><?php echo esc_html($value); ?></td></tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </section>
                <?php endif; ?>
            </div>

            <section class="cwr-panel cwr-panel-global cwr-design-help">
                <h2><?php esc_html_e('How to use this code', 'custom-web-render'); ?></h2>
                <ul class="cwr-plain-list">
                    <li><?php esc_html_e('Header, Footer, and Body Code are extracted from the live homepage using DOMDocument parsing.', 'custom-web-render'); ?></li>
                    <li><?php esc_html_e('Colors and Fonts are parsed from inline styles, <style> blocks, and the first few external stylesheets.', 'custom-web-render'); ?></li>
                    <li><?php esc_html_e('Logo Image is detected from the WordPress custom logo, header images, or the first image in the header.', 'custom-web-render'); ?></li>
                    <li><?php esc_html_e('Navigation Links are pulled from <nav> elements in the header.', 'custom-web-render'); ?></li>
                    <li><?php esc_html_e('Click "Re-extract from Live Page" after changing your homepage to refresh the extracted code.', 'custom-web-render'); ?></li>
                    <li><?php esc_html_e('Use Copy Code to grab any section, or Download to save it as a file.', 'custom-web-render'); ?></li>
                </ul>
            </section>
        </div>
        <?php
    }

    /* ===== Landing page design extraction ===== */

    /**
     * Get the cached design extract, or fetch and parse the live homepage.
     *
     * @return array Extracted design data.
     */
    private static function get_design_extract() {
        $cached = get_transient('cwr_design_extract');
        if (is_array($cached) && !empty($cached)) {
            return $cached;
        }
        $design = self::extract_landing_page_design();
        set_transient('cwr_design_extract', $design, 6 * HOUR_IN_SECONDS);
        return $design;
    }

    /**
     * Fetch the live homepage HTML and extract all design information.
     *
     * @return array
     */
    private static function extract_landing_page_design() {
        $url = home_url('/');
        $response = wp_remote_get($url, array(
            'timeout' => 20,
            'sslverify' => is_ssl(),
            'redirection' => 5,
        ));

        if (is_wp_error($response)) {
            return array('error' => sprintf(__('Could not fetch the homepage: %s', 'custom-web-render'), $response->get_error_message()));
        }

        $html = wp_remote_retrieve_body($response);
        if (empty($html)) {
            return array('error' => __('The homepage returned an empty response.', 'custom-web-render'));
        }

        $charset = wp_remote_retrieve_header($response, 'content-type');
        // Ensure UTF-8 parsing.
        if (function_exists('mb_convert_encoding') && stripos($charset, 'utf-8') === false) {
            $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        }

        $previous = libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        // Collect all CSS once — inline styles, <style> blocks, and external stylesheets.
        $all_css = self::collect_all_css($dom);

        $header_html = self::extract_dom_section($dom, 'header');
        $footer_html = self::extract_dom_section($dom, 'footer');
        $body_html = self::extract_dom_body($dom);
        $head_html = self::extract_dom_head($dom);
        $logo = self::extract_logo($dom);
        $colors = self::extract_colors_from_css($all_css);
        $fonts = self::extract_fonts_from_css($all_css, $dom);
        $links = self::extract_nav_links($dom);
        $meta = self::extract_page_meta($dom);

        return array(
            'header' => $header_html,
            'footer' => $footer_html,
            'body' => $body_html,
            'head' => $head_html,
            'logo' => $logo,
            'colors' => $colors,
            'fonts' => $fonts,
            'links' => $links,
            'meta' => $meta,
            'extracted_at' => current_time('mysql', true),
            'page_url' => $url,
        );
    }

    /**
     * Extract the largest element matching a tag name (header, footer).
     */
    private static function extract_dom_section($dom, $tag) {
        $nodes = $dom->getElementsByTagName($tag);
        if ($nodes->length === 0) {
            // Fallback: look for elements with role or class matching the tag.
            $xpath = new DOMXPath($dom);
            $fallback = $xpath->query(
                "//*[contains(@class, '" . $tag . "') or contains(@id, '" . $tag . "') or @role='" . ($tag === 'header' ? 'banner' : 'contentinfo') . "']"
            );
            if ($fallback->length > 0) {
                $best = null;
                $best_len = 0;
                foreach ($fallback as $node) {
                    $len = strlen($dom->saveHTML($node));
                    if ($len > $best_len) {
                        $best = $node;
                        $best_len = $len;
                    }
                }
                return $best ? trim($dom->saveHTML($best)) : '';
            }
            return '';
        }

        $best = null;
        $best_len = 0;
        foreach ($nodes as $node) {
            $len = strlen($dom->saveHTML($node));
            if ($len > $best_len) {
                $best = $node;
                $best_len = $len;
            }
        }
        return $best ? trim($dom->saveHTML($best)) : '';
    }

    /**
     * Extract the body inner HTML, excluding script/style noise.
     */
    private static function extract_dom_body($dom) {
        $bodies = $dom->getElementsByTagName('body');
        if ($bodies->length === 0) {
            return '';
        }
        $body = $bodies->item(0);
        $html = '';
        foreach ($body->childNodes as $child) {
            if ($child->nodeName === 'script' || $child->nodeName === 'style') {
                continue;
            }
            $html .= $dom->saveHTML($child);
        }
        // Limit to 500KB to keep the display manageable.
        if (strlen($html) > 512000) {
            $html = substr($html, 0, 512000) . "\n<!-- ... truncated ... -->";
        }
        return trim($html);
    }

    /**
     * Extract the head inner HTML.
     */
    private static function extract_dom_head($dom) {
        $heads = $dom->getElementsByTagName('head');
        if ($heads->length === 0) {
            return '';
        }
        $head = $heads->item(0);
        $html = '';
        foreach ($head->childNodes as $child) {
            $html .= $dom->saveHTML($child);
        }
        return trim($html);
    }

    /**
     * Detect the logo image from the page.
     */
    private static function extract_logo($dom) {
        $xpath = new DOMXPath($dom);

        // 1. WordPress custom-logo class.
        $logos = $xpath->query("//img[contains(@class, 'custom-logo')]");
        if ($logos->length > 0) {
            return self::format_logo_from_img($logos->item(0), $dom);
        }

        // 2. Any img with "logo" in class, id, or alt.
        $imgs = $dom->getElementsByTagName('img');
        foreach ($imgs as $img) {
            $haystack = $img->getAttribute('class') . ' ' . $img->getAttribute('id') . ' ' . $img->getAttribute('alt') . ' ' . $img->getAttribute('src');
            if (preg_match('/logo/i', $haystack)) {
                return self::format_logo_from_img($img, $dom);
            }
        }

        // 3. <a> with "logo" in class/id containing an img.
        $logo_links = $xpath->query("//a[contains(@class, 'logo') or contains(@id, 'logo')]//img");
        if ($logo_links->length > 0) {
            return self::format_logo_from_img($logo_links->item(0), $dom);
        }

        // 4. First img inside <header>.
        $headers = $dom->getElementsByTagName('header');
        if ($headers->length > 0) {
            $header_imgs = $headers->item(0)->getElementsByTagName('img');
            if ($header_imgs->length > 0) {
                return self::format_logo_from_img($header_imgs->item(0), $dom);
            }
        }

        // 5. WordPress custom logo via function (fallback).
        if (function_exists('get_custom_logo') && has_custom_logo()) {
            $logo_id = get_theme_mod('custom_logo');
            if ($logo_id) {
                return self::format_logo_from_id((int) $logo_id);
            }
        }

        return null;
    }

    private static function format_logo_from_img($img, $dom) {
        $url = $img->getAttribute('src');
        return array(
            'url' => self::resolve_url($url),
            'alt' => $img->getAttribute('alt'),
            'width' => $img->getAttribute('width'),
            'height' => $img->getAttribute('height'),
            'srcset' => $img->getAttribute('srcset'),
            'html' => trim($dom->saveHTML($img)),
        );
    }

    private static function format_logo_from_id($attachment_id) {
        $url = wp_get_attachment_url($attachment_id);
        $metadata = wp_get_attachment_metadata($attachment_id);
        return array(
            'url' => (string) $url,
            'alt' => (string) get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
            'width' => isset($metadata['width']) ? $metadata['width'] : '',
            'height' => isset($metadata['height']) ? $metadata['height'] : '',
            'srcset' => wp_get_attachment_image_srcset($attachment_id, 'full'),
            'html' => wp_get_attachment_image($attachment_id, 'full'),
        );
    }

    /**
     * Collect all CSS content: inline styles, <style> blocks, and up to 3
     * external stylesheets fetched via HTTP.
     */
    private static function collect_all_css($dom) {
        $css = '';

        // Inline styles from all elements.
        foreach ($dom->getElementsByTagName('*') as $el) {
            $style = $el->getAttribute('style');
            if ($style !== '') {
                $css .= ' ' . $style;
            }
        }

        // <style> blocks.
        foreach ($dom->getElementsByTagName('style') as $style) {
            $css .= "\n" . $style->textContent;
        }

        // External stylesheets — fetch up to 3 to stay fast.
        $fetched = 0;
        foreach ($dom->getElementsByTagName('link') as $link) {
            if ($fetched >= 3) {
                break;
            }
            $rel = strtolower($link->getAttribute('rel'));
            $href = $link->getAttribute('href');
            if (strpos($rel, 'stylesheet') !== false && $href !== '') {
                $resolved = self::resolve_url($href);
                $content = self::fetch_css_content($resolved);
                if ($content !== '') {
                    $css .= "\n" . $content;
                    $fetched++;
                }
            }
        }

        return $css;
    }

    /**
     * Fetch a CSS file's content via HTTP.
     */
    private static function fetch_css_content($url) {
        $response = wp_remote_get($url, array(
            'timeout' => 10,
            'sslverify' => is_ssl(),
        ));
        if (is_wp_error($response)) {
            return '';
        }
        $body = wp_remote_retrieve_body($response);
        // Limit to 500KB per stylesheet.
        if (strlen($body) > 512000) {
            $body = substr($body, 0, 512000);
        }
        return $body;
    }

    /**
     * Extract unique color values from CSS, sorted by frequency.
     */
    private static function extract_colors_from_css($css) {
        $colors = array();

        // Hex colors (#fff, #ffffff).
        preg_match_all('/#(?:[0-9a-fA-F]{3}){1,2}\b/', $css, $hex);
        // rgb/rgba colors.
        preg_match_all('/rgba?\s*\([^)]+\)/i', $css, $rgb);

        $all = array_merge($hex[0], $rgb[0]);
        foreach ($all as $color) {
            $color = strtolower(trim($color));
            // Skip transparent / rgba(0,0,0,0).
            if ($color === 'rgba(0,0,0,0)' || $color === 'transparent') {
                continue;
            }
            $colors[$color] = isset($colors[$color]) ? $colors[$color] + 1 : 1;
        }

        arsort($colors);
        return array_slice($colors, 0, 40, true);
    }

    /**
     * Extract font families and Google Font links from CSS and DOM.
     */
    private static function extract_fonts_from_css($css, $dom) {
        $families = array();
        $google_links = array();

        // Google Fonts <link> tags.
        foreach ($dom->getElementsByTagName('link') as $link) {
            $href = $link->getAttribute('href');
            if (strpos($href, 'fonts.googleapis.com') !== false || strpos($href, 'fonts.gstatic.com') !== false) {
                $google_links[] = $href;
                if (preg_match('/family=([^&:]+)/', $href, $m)) {
                    $family = str_replace('+', ' ', $m[1]);
                    if (!in_array($family, $families, true)) {
                        $families[] = $family;
                    }
                }
            }
        }

        // @import url(*fonts.googleapis.com*) in CSS.
        preg_match_all('/@import\s+(?:url\()?["\']?(https?:\/\/fonts\.googleapis\.com[^"\')\s]+)["\']?\)?/i', $css, $imports);
        foreach ($imports[1] as $import_url) {
            if (!in_array($import_url, $google_links, true)) {
                $google_links[] = $import_url;
            }
            if (preg_match('/family=([^&:]+)/', $import_url, $m)) {
                $family = str_replace('+', ' ', $m[1]);
                if (!in_array($family, $families, true)) {
                    $families[] = $family;
                }
            }
        }

        // font-family declarations.
        preg_match_all('/font-family\s*:\s*([^;}"\']+)/i', $css, $matches);
        foreach ($matches[1] as $family) {
            $family = trim($family, " \t\n\r,");
            if ($family !== '' && !in_array($family, $families, true)) {
                $families[] = $family;
            }
        }

        return array(
            'families' => array_slice($families, 0, 30),
            'google_font_links' => array_slice($google_links, 0, 10),
        );
    }

    /**
     * Extract navigation links from <nav> elements (primarily in the header).
     */
    private static function extract_nav_links($dom) {
        $links = array();
        $seen = array();

        $navs = $dom->getElementsByTagName('nav');
        if ($navs->length === 0) {
            // Fallback: look in header for menu links.
            $headers = $dom->getElementsByTagName('header');
            if ($headers->length > 0) {
                $navs = $headers->item(0)->getElementsByTagName('a');
                foreach ($navs as $a) {
                    self::collect_nav_link($a, $links, $seen);
                }
                return $links;
            }
            return $links;
        }

        foreach ($navs as $nav) {
            foreach ($nav->getElementsByTagName('a') as $a) {
                self::collect_nav_link($a, $links, $seen);
            }
        }
        return array_slice($links, 0, 50);
    }

    private static function collect_nav_link($a, &$links, &$seen) {
        $href = $a->getAttribute('href');
        $text = trim($a->textContent);
        if ($href === '' || $text === '' || $href === '#') {
            return;
        }
        $key = $href . '|' . $text;
        if (isset($seen[$key])) {
            return;
        }
        $seen[$key] = true;
        $links[] = array(
            'text' => $text,
            'href' => self::resolve_url($href),
        );
    }

    /**
     * Extract page meta information (title, description, favicon, etc.).
     */
    private static function extract_page_meta($dom) {
        $meta = array();

        // Title.
        $titles = $dom->getElementsByTagName('title');
        if ($titles->length > 0) {
            $meta['title'] = trim($titles->item(0)->textContent);
        }

        // Meta description.
        $xpath = new DOMXPath($dom);
        $desc = $xpath->query('//meta[@name="description"]/@content');
        if ($desc->length > 0) {
            $meta['description'] = trim($desc->item(0)->value);
        }

        // Charset.
        $charset = $xpath->query('//meta[@charset]/@charset');
        if ($charset->length > 0) {
            $meta['charset'] = trim($charset->item(0)->value);
        }

        // Viewport.
        $viewport = $xpath->query('//meta[@name="viewport"]/@content');
        if ($viewport->length > 0) {
            $meta['viewport'] = trim($viewport->item(0)->value);
        }

        // Favicon.
        $favicon = $xpath->query('//link[contains(@rel, "icon")]/@href');
        if ($favicon->length > 0) {
            $meta['favicon'] = self::resolve_url($favicon->item(0)->value);
        }

        // Generator.
        $generator = $xpath->query('//meta[@name="generator"]/@content');
        if ($generator->length > 0) {
            $meta['generator'] = trim($generator->item(0)->value);
        }

        // Stylesheet count.
        $stylesheets = $dom->getElementsByTagName('link');
        $css_count = 0;
        foreach ($stylesheets as $link) {
            if (strpos(strtolower($link->getAttribute('rel')), 'stylesheet') !== false) {
                $css_count++;
            }
        }
        $meta['stylesheets'] = (string) $css_count;

        // Script count.
        $scripts = $dom->getElementsByTagName('script');
        $meta['scripts'] = (string) $scripts->length;

        // Total images.
        $meta['images'] = (string) $dom->getElementsByTagName('img')->length;

        return $meta;
    }

    /**
     * Resolve a potentially relative URL to an absolute URL.
     */
    private static function resolve_url($url) {
        if (empty($url)) {
            return '';
        }
        if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
            return $url;
        }
        if (strpos($url, '//') === 0) {
            return set_url_scheme($url);
        }
        return home_url($url);
    }

    /**
     * Format a UTC timestamp for the design page.
     */
    private static function format_design_date($utc_date) {
        if (!$utc_date) {
            return '';
        }
        $timestamp = strtotime($utc_date . ' UTC');
        return $timestamp ? wp_date(get_option('date_format') . ' ' . get_option('time_format'), $timestamp) : $utc_date;
    }

    public static function render_admin_notice() {
        if (empty($_GET['cwr_notice'])) {
            return;
        }

        $notice = sanitize_key($_GET['cwr_notice']);
        $messages = array(
            'global_saved'          => __('Global render and AI SEO settings saved.', 'custom-web-render'),
            'ai_saved'              => __('OpenRouter AI settings saved.', 'custom-web-render'),
            'item_saved'            => __('Custom render and SEO settings saved for this item.', 'custom-web-render'),
            'design_refreshed'      => __('Design code re-extracted from the live landing page.', 'custom-web-render'),
            'header_set_global'     => __('Extracted landing page header saved as Global Header Code.', 'custom-web-render'),
            'footer_set_global'     => __('Extracted landing page footer saved as Global Footer Code.', 'custom-web-render'),
            'history_reverted'      => __('Change successfully reverted. Previous settings restored.', 'custom-web-render'),
            'history_revert_failed' => __('Failed to revert change. Target post may no longer exist.', 'custom-web-render'),
            'history_cleared'       => __('Change history log cleared.', 'custom-web-render'),
            'import_success'        => get_transient('cwr_import_notice') ?: __('Import completed successfully.', 'custom-web-render'),
            'import_failed'         => get_transient('cwr_import_error') ?: __('Import failed. Please check the JSON format.', 'custom-web-render'),
        );

        delete_transient('cwr_import_notice');
        delete_transient('cwr_import_error');

        if (!isset($messages[$notice])) {
            return;
        }

        $is_error = in_array($notice, array('history_revert_failed', 'import_failed'), true);
        $notice_class = $is_error ? 'notice notice-error' : 'notice notice-success';
        ?>
        <div class="<?php echo esc_attr($notice_class); ?> is-dismissible">
            <p><?php echo esc_html($messages[$notice]); ?></p>
        </div>
        <?php
    }

    private static function render_item_editor($post) {
        if (!$post) {
            ?>
            <div class="cwr-empty-state">
                <h2><?php esc_html_e('Load a page or post', 'custom-web-render'); ?></h2>
                <p><?php esc_html_e('Choose an item from the list to add custom HTML, CSS, JavaScript, and rendering rules.', 'custom-web-render'); ?></p>
            </div>
            <?php
            return;
        }

        $enabled = get_post_meta($post->ID, self::META_ENABLED, true) === '1';
        $use_header = get_post_meta($post->ID, self::META_USE_HEADER, true) === '1';
        $use_footer = get_post_meta($post->ID, self::META_USE_FOOTER, true) === '1';
        $html = get_post_meta($post->ID, self::META_HTML, true);
        $css = get_post_meta($post->ID, self::META_CSS, true);
        $js = get_post_meta($post->ID, self::META_JS, true);
        $has_html = trim((string) $html) !== '';
        $has_css = trim((string) $css) !== '';
        $has_js = trim((string) $js) !== '';
        $has_render_payload = self::has_custom_render_payload($post->ID);
        $meta_title = self::get_meta_title($post->ID);
        $meta_description = self::get_meta_description($post->ID);
        $focus_keyword = self::first_meta_value($post->ID, array(self::META_FOCUS_KEYWORD, '_yoast_wpseo_focuskw', 'rank_math_focus_keyword'));
        $canonical = self::first_meta_value($post->ID, array(self::META_CANONICAL, '_yoast_wpseo_canonical', 'rank_math_canonical_url'));
        $schema_type = self::normalize_schema_type(get_post_meta($post->ID, self::META_SCHEMA_TYPE, true));
        $social_title = get_post_meta($post->ID, self::META_SOCIAL_TITLE, true);
        $social_description = get_post_meta($post->ID, self::META_SOCIAL_DESCRIPTION, true);
        $social_image = get_post_meta($post->ID, self::META_SOCIAL_IMAGE, true);
        $noindex = get_post_meta($post->ID, self::META_ROBOTS_NOINDEX, true) === '1';
        $nofollow = get_post_meta($post->ID, self::META_ROBOTS_NOFOLLOW, true) === '1';
        $analysis = self::get_saved_seo_analysis($post->ID);
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=' . self::MENU_SLUG)); ?>" class="cwr-form">
            <?php wp_nonce_field('cwr_save_item_settings', 'cwr_item_nonce'); ?>
            <input type="hidden" name="cwr_post_id" value="<?php echo esc_attr($post->ID); ?>">

            <div class="cwr-panel-header">
                <div>
                    <h2><?php echo esc_html(get_the_title($post) ?: __('(no title)', 'custom-web-render')); ?></h2>
                    <p class="cwr-subtitle">
                        <?php echo esc_html(ucfirst($post->post_type)); ?> ·
                        <a href="<?php echo esc_url(get_permalink($post)); ?>" target="_blank" rel="noopener noreferrer">
                            <?php esc_html_e('View page', 'custom-web-render'); ?>
                        </a>
                    </p>
                </div>
                <button type="submit" name="cwr_save_item" value="1" class="button button-primary button-large">
                    <?php esc_html_e('Publish Render', 'custom-web-render'); ?>
                </button>
            </div>

            <?php
            $item_header_type = get_post_meta($post->ID, self::META_HEADER_TYPE, true) ?: 'global';
            $item_header_elementor_id = (int) get_post_meta($post->ID, self::META_HEADER_ELEMENTOR_ID, true);
            $item_footer_type = get_post_meta($post->ID, self::META_FOOTER_TYPE, true) ?: 'global';
            $item_footer_elementor_id = (int) get_post_meta($post->ID, self::META_FOOTER_ELEMENTOR_ID, true);
            $item_elementor_headers = self::get_elementor_templates('header');
            $item_elementor_footers = self::get_elementor_templates('footer');
            $has_elementor_templates = !empty($item_elementor_headers) || !empty($item_elementor_footers);
            ?>
            <div class="cwr-switch-row">
                <label>
                    <input type="checkbox" name="cwr_enabled" value="1" <?php checked($enabled); ?>>
                    <?php esc_html_e('Activate custom render for this page/post', 'custom-web-render'); ?>
                </label>
                <label>
                    <input type="checkbox" name="cwr_use_global_header" value="1" <?php checked($use_header); ?> id="cwr_item_use_header">
                    <?php esc_html_e('Use header', 'custom-web-render'); ?>
                </label>
                <label>
                    <input type="checkbox" name="cwr_use_global_footer" value="1" <?php checked($use_footer); ?> id="cwr_item_use_footer">
                    <?php esc_html_e('Use footer', 'custom-web-render'); ?>
                </label>
            </div>

            <div class="cwr-item-hf-row" id="cwr-item-hf-row">
                <div class="cwr-item-hf-group" id="cwr-item-header-group" <?php if (!$use_header) echo 'style="display:none;"'; ?>>
                    <label>
                        <span><?php esc_html_e('Header Source', 'custom-web-render'); ?></span>
                        <select name="cwr_header_type" id="cwr_item_header_type" class="cwr-item-hf-select" data-section="header">
                            <option value="global" <?php selected($item_header_type, 'global'); ?>><?php esc_html_e('Use Global Setting', 'custom-web-render'); ?></option>
                            <option value="elementor" <?php selected($item_header_type, 'elementor'); ?> <?php disabled(!$has_elementor_templates); ?>><?php esc_html_e('Pick Elementor Template', 'custom-web-render'); ?></option>
                            <option value="theme" <?php selected($item_header_type, 'theme'); ?>><?php esc_html_e('Existing Theme Header', 'custom-web-render'); ?></option>
                            <option value="extracted" <?php selected($item_header_type, 'extracted'); ?>><?php esc_html_e('Live Landing Page Header', 'custom-web-render'); ?></option>
                            <option value="none" <?php selected($item_header_type, 'none'); ?>><?php esc_html_e('None (No Header)', 'custom-web-render'); ?></option>
                        </select>
                    </label>
                    <div class="cwr-item-elementor-sub" id="cwr-item-header-elementor-sub" <?php if ($item_header_type !== 'elementor') echo 'style="display:none;"'; ?>>
                        <select name="cwr_header_elementor_id" class="large-text">
                            <option value="0"><?php esc_html_e('-- Choose Elementor Template --', 'custom-web-render'); ?></option>
                            <?php foreach ($item_elementor_headers as $t_id => $tmpl) : ?>
                                <option value="<?php echo esc_attr($t_id); ?>" <?php selected($item_header_elementor_id, $t_id); ?>>
                                    <?php echo esc_html($tmpl['title']); ?> (ID: <?php echo esc_html($t_id); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="cwr-item-hf-group" id="cwr-item-footer-group" <?php if (!$use_footer) echo 'style="display:none;"'; ?>>
                    <label>
                        <span><?php esc_html_e('Footer Source', 'custom-web-render'); ?></span>
                        <select name="cwr_footer_type" id="cwr_item_footer_type" class="cwr-item-hf-select" data-section="footer">
                            <option value="global" <?php selected($item_footer_type, 'global'); ?>><?php esc_html_e('Use Global Setting', 'custom-web-render'); ?></option>
                            <option value="elementor" <?php selected($item_footer_type, 'elementor'); ?> <?php disabled(!$has_elementor_templates); ?>><?php esc_html_e('Pick Elementor Template', 'custom-web-render'); ?></option>
                            <option value="theme" <?php selected($item_footer_type, 'theme'); ?>><?php esc_html_e('Existing Theme Footer', 'custom-web-render'); ?></option>
                            <option value="extracted" <?php selected($item_footer_type, 'extracted'); ?>><?php esc_html_e('Live Landing Page Footer', 'custom-web-render'); ?></option>
                            <option value="none" <?php selected($item_footer_type, 'none'); ?>><?php esc_html_e('None (No Footer)', 'custom-web-render'); ?></option>
                        </select>
                    </label>
                    <div class="cwr-item-elementor-sub" id="cwr-item-footer-elementor-sub" <?php if ($item_footer_type !== 'elementor') echo 'style="display:none;"'; ?>>
                        <select name="cwr_footer_elementor_id" class="large-text">
                            <option value="0"><?php esc_html_e('-- Choose Elementor Template --', 'custom-web-render'); ?></option>
                            <?php foreach ($item_elementor_footers as $t_id => $tmpl) : ?>
                                <option value="<?php echo esc_attr($t_id); ?>" <?php selected($item_footer_elementor_id, $t_id); ?>>
                                    <?php echo esc_html($tmpl['title']); ?> (ID: <?php echo esc_html($t_id); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
            </div>

            <section class="cwr-code-editor-panel">
                <div class="cwr-panel-header">
                    <div>
                        <h3><?php esc_html_e('Render Code', 'custom-web-render'); ?></h3>
                        <p class="cwr-subtitle"><?php esc_html_e('Paste the HTML, CSS, and JavaScript that should render this exact page/post.', 'custom-web-render'); ?></p>
                    </div>
                    <div class="cwr-code-flags">
                        <span class="cwr-code-flag <?php echo $enabled ? 'is-good' : 'is-muted'; ?>"><?php echo $enabled ? esc_html__('Render active', 'custom-web-render') : esc_html__('Render inactive', 'custom-web-render'); ?></span>
                        <span class="cwr-code-flag <?php echo $has_html ? 'is-good' : 'is-warn'; ?>"><?php echo $has_html ? esc_html__('HTML saved', 'custom-web-render') : esc_html__('HTML missing', 'custom-web-render'); ?></span>
                        <span class="cwr-code-flag <?php echo $has_css ? 'is-good' : 'is-muted'; ?>"><?php echo $has_css ? esc_html__('CSS saved', 'custom-web-render') : esc_html__('CSS optional', 'custom-web-render'); ?></span>
                        <span class="cwr-code-flag <?php echo $has_js ? 'is-good' : 'is-muted'; ?>"><?php echo $has_js ? esc_html__('JS saved', 'custom-web-render') : esc_html__('JS optional', 'custom-web-render'); ?></span>
                    </div>
                </div>

                <?php if ($enabled && !$has_render_payload) : ?>
                    <div class="notice notice-warning inline cwr-code-warning">
                        <p><?php esc_html_e('Custom render is active but no HTML/header/footer code is saved. The public page will use the normal WordPress template until render code exists.', 'custom-web-render'); ?></p>
                    </div>
                <?php endif; ?>

                <div class="cwr-code-guide">
                    <strong><?php esc_html_e('Render guidelines', 'custom-web-render'); ?></strong>
                    <ul>
                        <li><?php esc_html_e('HTML can be a full document or a body fragment. If it is a full document, the plugin injects saved SEO, CSS, JS, header, and footer into it.', 'custom-web-render'); ?></li>
                        <li><?php esc_html_e('CSS goes in the CSS box without wrapping style tags. It is added inside one style tag on the rendered page.', 'custom-web-render'); ?></li>
                        <li><?php esc_html_e('JavaScript goes in the JS box without wrapping script tags. It is printed before the closing body tag.', 'custom-web-render'); ?></li>
                        <li><?php esc_html_e('If custom render is active and HTML/header/footer are empty, the plugin safely falls back to the theme to avoid a blank page.', 'custom-web-render'); ?></li>
                        <li><strong><?php esc_html_e('Deactivation Safe:', 'custom-web-render'); ?></strong> <?php esc_html_e('If this plugin is ever deactivated, all pages and posts with custom HTML, CSS, and JS are automatically set to Draft (invisible) to protect your site. When reactivated, they automatically reappear with their original status and designs intact.', 'custom-web-render'); ?></li>
                    </ul>
                </div>

                <label class="cwr-field">
                    <span><?php esc_html_e('Custom HTML', 'custom-web-render'); ?></span>
                    <textarea id="cwr_html" name="cwr_html" class="large-text code cwr-codearea" rows="18" spellcheck="false"><?php echo esc_textarea($html); ?></textarea>
                </label>

                <label class="cwr-field">
                    <span><?php esc_html_e('Custom CSS', 'custom-web-render'); ?></span>
                    <textarea id="cwr_css" name="cwr_css" class="large-text code cwr-codearea" rows="10" spellcheck="false"><?php echo esc_textarea($css); ?></textarea>
                </label>

                <label class="cwr-field">
                    <span><?php esc_html_e('Custom JavaScript', 'custom-web-render'); ?></span>
                    <textarea id="cwr_js" name="cwr_js" class="large-text code cwr-codearea" rows="10" spellcheck="false"><?php echo esc_textarea($js); ?></textarea>
                </label>
            </section>

            <section class="cwr-seo-editor">
                <div class="cwr-panel-header">
                    <div>
                        <h3><?php esc_html_e('SEO Fixer', 'custom-web-render'); ?></h3>
                        <p class="cwr-subtitle"><?php esc_html_e('Analyze the page, score it, and store the fixes beside the post.', 'custom-web-render'); ?></p>
                    </div>
                    <div class="cwr-seo-actions">
                        <span data-cwr-row-score="<?php echo esc_attr($post->ID); ?>"><?php self::render_score_badge(isset($analysis['score']) ? (int) $analysis['score'] : null, isset($analysis['issue_count']) ? (int) $analysis['issue_count'] : null); ?></span>
                        <button type="button" class="button cwr-seo-analyze" data-mode="local" data-post-id="<?php echo esc_attr($post->ID); ?>">
                            <?php esc_html_e('Scan SEO', 'custom-web-render'); ?>
                        </button>
                        <button type="button" class="button cwr-seo-analyze" data-mode="ai" data-post-id="<?php echo esc_attr($post->ID); ?>">
                            <?php esc_html_e('AI Analyze', 'custom-web-render'); ?>
                        </button>
                        <button type="button" class="button cwr-seo-analyze" data-mode="fix" data-post-id="<?php echo esc_attr($post->ID); ?>">
                            <?php esc_html_e('AI Fix All', 'custom-web-render'); ?>
                        </button>
                        <button type="button" class="button cwr-seo-analyze" data-mode="local" data-post-id="<?php echo esc_attr($post->ID); ?>">
                            <?php esc_html_e('Rescan', 'custom-web-render'); ?>
                        </button>
                    </div>
                </div>

                <div class="cwr-seo-grid">
                    <label class="cwr-field">
                        <span><?php esc_html_e('Focus Keyword', 'custom-web-render'); ?></span>
                        <input type="text" name="cwr_focus_keyword" class="regular-text" value="<?php echo esc_attr($focus_keyword); ?>" placeholder="<?php esc_attr_e('primary keyword', 'custom-web-render'); ?>">
                    </label>
                    <label class="cwr-field">
                        <span><?php esc_html_e('SEO Title', 'custom-web-render'); ?></span>
                        <input type="text" name="cwr_meta_title" class="large-text" value="<?php echo esc_attr($meta_title); ?>" maxlength="80">
                    </label>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Canonical URL', 'custom-web-render'); ?></span>
                        <input type="url" name="cwr_canonical_url" class="large-text" value="<?php echo esc_url($canonical); ?>" placeholder="<?php echo esc_attr(get_permalink($post)); ?>">
                    </label>
                    <label class="cwr-field cwr-field-wide">
                        <span><?php esc_html_e('Meta Description', 'custom-web-render'); ?></span>
                        <textarea name="cwr_meta_description" class="large-text" rows="3" maxlength="220"><?php echo esc_textarea($meta_description); ?></textarea>
                    </label>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Schema Type', 'custom-web-render'); ?></span>
                        <select name="cwr_schema_type">
                            <?php foreach (self::schema_type_options() as $value => $label) : ?>
                                <option value="<?php echo esc_attr($value); ?>" <?php selected($schema_type, $value); ?>><?php echo esc_html($label); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                    <div class="cwr-field cwr-robots-field">
                        <span><?php esc_html_e('Robots', 'custom-web-render'); ?></span>
                        <label><input type="checkbox" name="cwr_robots_noindex" value="1" <?php checked($noindex); ?>> <?php esc_html_e('Noindex', 'custom-web-render'); ?></label>
                        <label><input type="checkbox" name="cwr_robots_nofollow" value="1" <?php checked($nofollow); ?>> <?php esc_html_e('Nofollow', 'custom-web-render'); ?></label>
                    </div>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Social Title', 'custom-web-render'); ?></span>
                        <input type="text" name="cwr_social_title" class="large-text" value="<?php echo esc_attr($social_title); ?>">
                    </label>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Social Image URL', 'custom-web-render'); ?></span>
                        <input type="url" name="cwr_social_image" class="large-text" value="<?php echo esc_url($social_image); ?>">
                    </label>
                    <label class="cwr-field cwr-field-wide">
                        <span><?php esc_html_e('Social Description', 'custom-web-render'); ?></span>
                        <textarea name="cwr_social_description" class="large-text" rows="2"><?php echo esc_textarea($social_description); ?></textarea>
                    </label>
                </div>

                <div class="cwr-serp-preview">
                    <span><?php echo esc_html($meta_title !== '' ? $meta_title : (get_the_title($post) ?: __('Untitled page', 'custom-web-render'))); ?></span>
                    <code><?php echo esc_html(get_permalink($post)); ?></code>
                    <p><?php echo esc_html($meta_description !== '' ? $meta_description : __('Meta description will appear here after you add one.', 'custom-web-render')); ?></p>
                </div>

                <div class="cwr-seo-report" data-cwr-seo-report="<?php echo esc_attr($post->ID); ?>">
                    <?php self::render_seo_report($analysis); ?>
                </div>
            </section>
        </form>
        <?php
    }

    private static function render_global_settings() {
        $header = get_option(self::OPTION_HEADER, '');
        $footer = get_option(self::OPTION_FOOTER, '');
        $head = get_option(self::OPTION_HEAD, '');
        $api_key = self::get_openrouter_api_key();
        $model = self::get_openrouter_model();
        $model_options = self::openrouter_model_options();
        $is_custom_model = !isset($model_options[$model]);
        $system_prompt = get_option(self::OPTION_OPENROUTER_SYSTEM_PROMPT, self::default_openrouter_system_prompt());
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=' . self::MENU_SLUG)); ?>" class="cwr-form">
            <?php wp_nonce_field('cwr_save_global_settings', 'cwr_global_nonce'); ?>
            <div class="cwr-panel-header">
                <div>
                    <h2><?php esc_html_e('Global Code', 'custom-web-render'); ?></h2>
                    <p class="cwr-subtitle"><?php esc_html_e('Save once, then tick header/footer on any page or post.', 'custom-web-render'); ?></p>
                </div>
                <button type="submit" name="cwr_save_global" value="1" class="button">
                    <?php esc_html_e('Save Global Code', 'custom-web-render'); ?>
                </button>
            </div>

            <?php
            $header_type = get_option(self::OPTION_HEADER_TYPE, 'custom');
            $header_elementor_id = (int) get_option(self::OPTION_HEADER_ELEMENTOR_ID, 0);
            $footer_type = get_option(self::OPTION_FOOTER_TYPE, 'custom');
            $footer_elementor_id = (int) get_option(self::OPTION_FOOTER_ELEMENTOR_ID, 0);
            $elementor_headers = self::get_elementor_templates('header');
            $elementor_footers = self::get_elementor_templates('footer');
            $has_elementor = class_exists('\Elementor\Plugin') || !empty($elementor_headers) || !empty($elementor_footers);
            $current_theme_name = wp_get_theme()->get('Name');
            ?>

            <!-- Global Header Control -->
            <div class="cwr-hf-box">
                <div class="cwr-hf-box-header">
                    <div>
                        <label class="cwr-hf-title">
                            <span class="dashicons dashicons-arrow-up-alt"></span>
                            <strong><?php esc_html_e('Global Header', 'custom-web-render'); ?></strong>
                        </label>
                        <p class="cwr-subtitle"><?php esc_html_e('Select whether to use Custom Code, an Elementor template, or your existing site header.', 'custom-web-render'); ?></p>
                    </div>
                    <span class="cwr-badge <?php echo $header_type === 'custom' && trim($header) === '' ? 'is-inactive' : 'is-active'; ?>">
                        <?php echo esc_html(self::get_source_label($header_type)); ?>
                    </span>
                </div>

                <div class="cwr-source-pill-row">
                    <label class="cwr-source-pill <?php echo $header_type === 'custom' ? 'is-active' : ''; ?>">
                        <input type="radio" name="cwr_global_header_type" value="custom" <?php checked($header_type, 'custom'); ?> class="cwr-source-radio" data-section="header">
                        <span><?php esc_html_e('Custom Code', 'custom-web-render'); ?></span>
                    </label>
                    <label class="cwr-source-pill <?php echo $header_type === 'elementor' ? 'is-active' : ''; ?> <?php echo !$has_elementor ? 'is-disabled' : ''; ?>">
                        <input type="radio" name="cwr_global_header_type" value="elementor" <?php checked($header_type, 'elementor'); ?> class="cwr-source-radio" data-section="header" <?php disabled(!$has_elementor); ?>>
                        <span><?php esc_html_e('Elementor Template', 'custom-web-render'); ?></span>
                    </label>
                    <label class="cwr-source-pill <?php echo $header_type === 'theme' ? 'is-active' : ''; ?>">
                        <input type="radio" name="cwr_global_header_type" value="theme" <?php checked($header_type, 'theme'); ?> class="cwr-source-radio" data-section="header">
                        <span><?php esc_html_e('Existing Theme Header', 'custom-web-render'); ?></span>
                    </label>
                    <label class="cwr-source-pill <?php echo $header_type === 'extracted' ? 'is-active' : ''; ?>">
                        <input type="radio" name="cwr_global_header_type" value="extracted" <?php checked($header_type, 'extracted'); ?> class="cwr-source-radio" data-section="header">
                        <span><?php esc_html_e('Live Landing Page', 'custom-web-render'); ?></span>
                    </label>
                </div>

                <!-- Elementor Template Picker -->
                <div class="cwr-hf-pane" id="cwr-header-pane-elementor" <?php if ($header_type !== 'elementor') echo 'style="display:none;"'; ?>>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Choose Elementor Header Template', 'custom-web-render'); ?></span>
                        <select name="cwr_global_header_elementor_id" id="cwr_global_header_elementor_id" class="large-text">
                            <option value="0"><?php esc_html_e('-- Select an Elementor Header Template --', 'custom-web-render'); ?></option>
                            <?php foreach ($elementor_headers as $t_id => $tmpl) : ?>
                                <option value="<?php echo esc_attr($t_id); ?>" <?php selected($header_elementor_id, $t_id); ?>>
                                    <?php echo esc_html($tmpl['title']); ?> (ID: <?php echo esc_html($t_id); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                    <p class="description"><?php esc_html_e('This template and its compiled styles (fonts, widgets, container rules) will be rendered into the header of custom-rendered pages.', 'custom-web-render'); ?></p>
                </div>

                <!-- Theme Header Info -->
                <div class="cwr-hf-pane" id="cwr-header-pane-theme" <?php if ($header_type !== 'theme') echo 'style="display:none;"'; ?>>
                    <div class="notice notice-info inline">
                        <p>
                            <strong><?php echo esc_html(sprintf(__('Active Theme: %s', 'custom-web-render'), $current_theme_name)); ?></strong><br>
                            <?php esc_html_e('Pages using global header will display the header layout from your active theme or theme builder layout.', 'custom-web-render'); ?>
                        </p>
                    </div>
                </div>

                <!-- Extracted Landing Page Info -->
                <div class="cwr-hf-pane" id="cwr-header-pane-extracted" <?php if ($header_type !== 'extracted') echo 'style="display:none;"'; ?>>
                    <div class="notice notice-info inline">
                        <p>
                            <?php esc_html_e('Pages using global header will render the <header> element extracted from your live homepage.', 'custom-web-render'); ?>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=' . self::DESIGN_CODE_SLUG)); ?>"><?php esc_html_e('Inspect in Design Code', 'custom-web-render'); ?> &rarr;</a>
                        </p>
                    </div>
                </div>

                <!-- Custom Code Editor -->
                <div class="cwr-hf-pane" id="cwr-header-pane-custom" <?php if ($header_type !== 'custom') echo 'style="display:none;"'; ?>>
                    <div class="cwr-hf-code-bar">
                        <span><?php esc_html_e('Custom HTML Code', 'custom-web-render'); ?></span>
                        <div class="cwr-hf-import-btns">
                            <button type="button" class="button button-small cwr-import-existing-btn" data-section="header">
                                <span class="dashicons dashicons-download"></span>
                                <?php esc_html_e('Import from Existing Site', 'custom-web-render'); ?>
                            </button>
                            <?php if ($has_elementor && !empty($elementor_headers)) : ?>
                                <button type="button" class="button button-small cwr-import-elementor-btn" data-section="header" data-select="cwr_global_header_elementor_id">
                                    <span class="dashicons dashicons-admin-plugins"></span>
                                    <?php esc_html_e('Import from Elementor', 'custom-web-render'); ?>
                                </button>
                            <?php endif; ?>
                        </div>
                    </div>
                    <textarea id="cwr_global_header" name="cwr_global_header" class="large-text code cwr-codearea" rows="9" spellcheck="false"><?php echo esc_textarea($header); ?></textarea>
                </div>
            </div>

            <!-- Global Footer Section -->
            <div class="cwr-hf-box">
                <div class="cwr-hf-box-header">
                    <div>
                        <label class="cwr-hf-title">
                            <span class="dashicons dashicons-arrow-down-alt"></span>
                            <strong><?php esc_html_e('Global Footer', 'custom-web-render'); ?></strong>
                        </label>
                        <p class="cwr-subtitle"><?php esc_html_e('Select whether to use Custom Code, an Elementor template, or your existing site footer.', 'custom-web-render'); ?></p>
                    </div>
                    <span class="cwr-badge <?php echo $footer_type === 'custom' && trim($footer) === '' ? 'is-inactive' : 'is-active'; ?>">
                        <?php echo esc_html(self::get_source_label($footer_type)); ?>
                    </span>
                </div>

                <div class="cwr-source-pill-row">
                    <label class="cwr-source-pill <?php echo $footer_type === 'custom' ? 'is-active' : ''; ?>">
                        <input type="radio" name="cwr_global_footer_type" value="custom" <?php checked($footer_type, 'custom'); ?> class="cwr-source-radio" data-section="footer">
                        <span><?php esc_html_e('Custom Code', 'custom-web-render'); ?></span>
                    </label>
                    <label class="cwr-source-pill <?php echo $footer_type === 'elementor' ? 'is-active' : ''; ?> <?php echo !$has_elementor ? 'is-disabled' : ''; ?>">
                        <input type="radio" name="cwr_global_footer_type" value="elementor" <?php checked($footer_type, 'elementor'); ?> class="cwr-source-radio" data-section="footer" <?php disabled(!$has_elementor); ?>>
                        <span><?php esc_html_e('Elementor Template', 'custom-web-render'); ?></span>
                    </label>
                    <label class="cwr-source-pill <?php echo $footer_type === 'theme' ? 'is-active' : ''; ?>">
                        <input type="radio" name="cwr_global_footer_type" value="theme" <?php checked($footer_type, 'theme'); ?> class="cwr-source-radio" data-section="footer">
                        <span><?php esc_html_e('Existing Theme Footer', 'custom-web-render'); ?></span>
                    </label>
                    <label class="cwr-source-pill <?php echo $footer_type === 'extracted' ? 'is-active' : ''; ?>">
                        <input type="radio" name="cwr_global_footer_type" value="extracted" <?php checked($footer_type, 'extracted'); ?> class="cwr-source-radio" data-section="footer">
                        <span><?php esc_html_e('Live Landing Page', 'custom-web-render'); ?></span>
                    </label>
                </div>

                <!-- Elementor Template Picker -->
                <div class="cwr-hf-pane" id="cwr-footer-pane-elementor" <?php if ($footer_type !== 'elementor') echo 'style="display:none;"'; ?>>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Choose Elementor Footer Template', 'custom-web-render'); ?></span>
                        <select name="cwr_global_footer_elementor_id" id="cwr_global_footer_elementor_id" class="large-text">
                            <option value="0"><?php esc_html_e('-- Select an Elementor Footer Template --', 'custom-web-render'); ?></option>
                            <?php foreach ($elementor_footers as $t_id => $tmpl) : ?>
                                <option value="<?php echo esc_attr($t_id); ?>" <?php selected($footer_elementor_id, $t_id); ?>>
                                    <?php echo esc_html($tmpl['title']); ?> (ID: <?php echo esc_html($t_id); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                    <p class="description"><?php esc_html_e('This template and its compiled styles (fonts, widgets, container rules) will be rendered into the footer of custom-rendered pages.', 'custom-web-render'); ?></p>
                </div>

                <!-- Theme Footer Info -->
                <div class="cwr-hf-pane" id="cwr-footer-pane-theme" <?php if ($footer_type !== 'theme') echo 'style="display:none;"'; ?>>
                    <div class="notice notice-info inline">
                        <p>
                            <strong><?php echo esc_html(sprintf(__('Active Theme: %s', 'custom-web-render'), $current_theme_name)); ?></strong><br>
                            <?php esc_html_e('Pages using global footer will display the footer layout from your active theme or theme builder layout.', 'custom-web-render'); ?>
                        </p>
                    </div>
                </div>

                <!-- Extracted Landing Page Info -->
                <div class="cwr-hf-pane" id="cwr-footer-pane-extracted" <?php if ($footer_type !== 'extracted') echo 'style="display:none;"'; ?>>
                    <div class="notice notice-info inline">
                        <p>
                            <?php esc_html_e('Pages using global footer will render the <footer> element extracted from your live homepage.', 'custom-web-render'); ?>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=' . self::DESIGN_CODE_SLUG)); ?>"><?php esc_html_e('Inspect in Design Code', 'custom-web-render'); ?> &rarr;</a>
                        </p>
                    </div>
                </div>

                <!-- Custom Code Editor -->
                <div class="cwr-hf-pane" id="cwr-footer-pane-custom" <?php if ($footer_type !== 'custom') echo 'style="display:none;"'; ?>>
                    <div class="cwr-hf-code-bar">
                        <span><?php esc_html_e('Custom HTML Code', 'custom-web-render'); ?></span>
                        <div class="cwr-hf-import-btns">
                            <button type="button" class="button button-small cwr-import-existing-btn" data-section="footer">
                                <span class="dashicons dashicons-download"></span>
                                <?php esc_html_e('Import from Existing Site', 'custom-web-render'); ?>
                            </button>
                            <?php if ($has_elementor && !empty($elementor_footers)) : ?>
                                <button type="button" class="button button-small cwr-import-elementor-btn" data-section="footer" data-select="cwr_global_footer_elementor_id">
                                    <span class="dashicons dashicons-admin-plugins"></span>
                                    <?php esc_html_e('Import from Elementor', 'custom-web-render'); ?>
                                </button>
                            <?php endif; ?>
                        </div>
                    </div>
                    <textarea id="cwr_global_footer" name="cwr_global_footer" class="large-text code cwr-codearea" rows="9" spellcheck="false"><?php echo esc_textarea($footer); ?></textarea>
                </div>
            </div>

            <label class="cwr-field">
                <span><?php esc_html_e('Google/Search Console Head Injection', 'custom-web-render'); ?></span>
                <textarea id="cwr_global_head" name="cwr_global_head" class="large-text code cwr-codearea" rows="7" spellcheck="false"><?php echo esc_textarea($head); ?></textarea>
            </label>

            <div class="cwr-ai-settings">
                <div class="cwr-panel-header">
                    <div>
                        <h3><?php esc_html_e('OpenRouter AI SEO', 'custom-web-render'); ?></h3>
                        <p class="cwr-subtitle"><?php esc_html_e('Optional. Without an API key, the analyzer still runs local technical SEO checks.', 'custom-web-render'); ?></p>
                    </div>
                    <span class="cwr-badge <?php echo $api_key !== '' ? 'is-active' : 'is-inactive'; ?>">
                        <?php echo $api_key !== '' ? esc_html__('AI Ready', 'custom-web-render') : esc_html__('Local Only', 'custom-web-render'); ?>
                    </span>
                </div>

                <div class="cwr-seo-grid">
                    <label class="cwr-field">
                        <span><?php esc_html_e('OpenRouter API Key', 'custom-web-render'); ?></span>
                        <input type="password" id="cwr_openrouter_api_key" name="cwr_openrouter_api_key" class="regular-text" autocomplete="off" placeholder="<?php echo esc_attr($api_key !== '' ? self::mask_secret($api_key) : __('Paste key to enable AI', 'custom-web-render')); ?>">
                    </label>
                    <div class="cwr-field cwr-robots-field">
                        <span><?php esc_html_e('Key Status', 'custom-web-render'); ?></span>
                        <label><input type="checkbox" name="cwr_openrouter_clear_key" value="1"> <?php esc_html_e('Remove saved key', 'custom-web-render'); ?></label>
                    </div>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Model', 'custom-web-render'); ?></span>
                        <select name="cwr_openrouter_model" id="cwr_openrouter_model">
                            <?php foreach ($model_options as $value => $label) : ?>
                                <option value="<?php echo esc_attr($value); ?>" <?php selected($model, $value); ?>><?php echo esc_html($label); ?></option>
                            <?php endforeach; ?>
                            <option value="custom" <?php selected($is_custom_model); ?>><?php esc_html_e('Custom model slug', 'custom-web-render'); ?></option>
                        </select>
                    </label>
                    <label class="cwr-field">
                        <span><?php esc_html_e('Custom Model Slug', 'custom-web-render'); ?></span>
                        <input type="text" name="cwr_openrouter_custom_model" id="cwr_openrouter_custom_model" class="regular-text" value="<?php echo esc_attr($is_custom_model ? $model : ''); ?>" placeholder="provider/model-name">
                    </label>
                    <label class="cwr-field cwr-field-wide">
                        <span><?php esc_html_e('AI System Prompt', 'custom-web-render'); ?></span>
                        <textarea name="cwr_openrouter_system_prompt" id="cwr_openrouter_system_prompt" class="large-text" rows="5"><?php echo esc_textarea($system_prompt); ?></textarea>
                    </label>
                </div>
                <div class="cwr-ai-actions">
                    <button type="button" class="button" id="cwr-openrouter-load-models"><?php esc_html_e('Load Models', 'custom-web-render'); ?></button>
                    <button type="button" class="button" id="cwr-openrouter-test"><?php esc_html_e('Test Connection', 'custom-web-render'); ?></button>
                    <button type="submit" name="cwr_save_ai_settings" value="1" class="button button-primary"><?php esc_html_e('Save AI Settings', 'custom-web-render'); ?></button>
                    <span id="cwr-openrouter-status" class="cwr-inline-status" aria-live="polite"></span>
                </div>
            </div>

            <div class="cwr-panel cwr-lifecycle-box" style="margin-top: 18px; padding: 14px; background: #f0f6fc; border: 1px solid #c8d8f0; border-radius: 6px;">
                <div class="cwr-panel-header" style="margin-bottom: 8px;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px;"><span class="dashicons dashicons-shield"></span> <?php esc_html_e('Deactivation & Lifecycle Protection', 'custom-web-render'); ?></h4>
                        <p class="cwr-subtitle"><?php esc_html_e('Ensure generated and custom-rendered pages are protected if this plugin is ever deactivated.', 'custom-web-render'); ?></p>
                    </div>
                </div>
                <label style="font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" name="cwr_hide_posts_on_deactivation" value="1" <?php checked(get_option(self::OPTION_HIDE_ON_DEACTIVATE, '1') === '1'); ?>>
                    <?php esc_html_e('Automatically set custom-rendered pages and posts to Draft (invisible to visitors) if this plugin is deactivated, and restore them when reactivated.', 'custom-web-render'); ?>
                </label>
            </div>
        </form>
        <?php
    }

    private static function render_seo_overview($items) {
        $total = count($items);
        $analyzed = 0;
        $score_total = 0;
        $good = 0;
        $needs_work = 0;
        $poor = 0;
        $missing_keyword = 0;
        $missing_meta = 0;
        $noindex = 0;

        foreach ($items as $item) {
            $analysis = self::get_saved_seo_analysis($item->ID);
            if ($analysis && isset($analysis['score'])) {
                $analyzed++;
                $score = (int) $analysis['score'];
                $score_total += $score;
                if ($score >= 80) {
                    $good++;
                } elseif ($score >= 60) {
                    $needs_work++;
                } else {
                    $poor++;
                }
            }
            if (trim((string) self::first_meta_value($item->ID, array(self::META_FOCUS_KEYWORD, '_yoast_wpseo_focuskw', 'rank_math_focus_keyword'))) === '') {
                $missing_keyword++;
            }
            if (trim((string) self::get_meta_title($item->ID)) === '' || trim((string) self::get_meta_description($item->ID)) === '') {
                $missing_meta++;
            }
            if (get_post_meta($item->ID, self::META_ROBOTS_NOINDEX, true) === '1') {
                $noindex++;
            }
        }

        $average = $analyzed ? round($score_total / $analyzed) : 0;
        ?>
        <section class="cwr-panel cwr-seo-overview">
            <div class="cwr-panel-header">
                <div>
                    <h2><?php esc_html_e('SEO Metrics', 'custom-web-render'); ?></h2>
                    <p class="cwr-subtitle"><?php esc_html_e('Site-wide page and post optimization snapshot.', 'custom-web-render'); ?></p>
                </div>
                <div class="cwr-seo-overview-actions">
                    <button type="button" class="button cwr-seo-problems-view"><?php esc_html_e('View SEO Problems', 'custom-web-render'); ?></button>
                    <button type="button" class="button cwr-seo-analyze-all"><?php esc_html_e('Analyze All Visible', 'custom-web-render'); ?></button>
                </div>
            </div>
            <div class="cwr-metric-grid">
                <?php self::render_metric_card(__('Average Score', 'custom-web-render'), $analyzed ? $average . '/100' : __('No data', 'custom-web-render')); ?>
                <?php self::render_metric_card(__('Analyzed', 'custom-web-render'), $analyzed . '/' . $total); ?>
                <?php self::render_metric_card(__('Good', 'custom-web-render'), (string) $good); ?>
                <?php self::render_metric_card(__('Needs Work', 'custom-web-render'), (string) $needs_work); ?>
                <?php self::render_metric_card(__('Poor', 'custom-web-render'), (string) $poor); ?>
                <?php self::render_metric_card(__('Missing Keyword', 'custom-web-render'), (string) $missing_keyword); ?>
                <?php self::render_metric_card(__('Missing Meta', 'custom-web-render'), (string) $missing_meta); ?>
                <?php self::render_metric_card(__('Noindex', 'custom-web-render'), (string) $noindex); ?>
            </div>
            <div class="cwr-seo-problems-panel" data-cwr-seo-problems hidden>
                <div class="cwr-empty-report"><?php esc_html_e('Click View SEO Problems to load the current problem list for all pages and posts.', 'custom-web-render'); ?></div>
            </div>
        </section>
        <?php
    }

    private static function render_metric_card($label, $value) {
        ?>
        <div class="cwr-metric-card">
            <strong><?php echo esc_html($value); ?></strong>
            <span><?php echo esc_html($label); ?></span>
        </div>
        <?php
    }

    private static function render_score_badge($score, $issue_count = null) {
        if ($score === null || $score === '') {
            ?>
            <span class="cwr-score-badge is-empty"><?php esc_html_e('Not analyzed', 'custom-web-render'); ?></span>
            <?php
            return;
        }

        $score = max(0, min(100, (int) $score));
        $class = $score >= 80 ? 'is-good' : ($score >= 60 ? 'is-ok' : 'is-poor');
        $issue_text = $issue_count === null ? '' : sprintf(
            /* translators: %d: SEO issue count. */
            _n('%d issue', '%d issues', (int) $issue_count, 'custom-web-render'),
            (int) $issue_count
        );
        ?>
        <span class="cwr-score-badge <?php echo esc_attr($class); ?>">
            <strong><?php echo esc_html($score); ?></strong>
            <span><?php echo esc_html($issue_text); ?></span>
        </span>
        <?php
    }

    private static function render_seo_report($analysis) {
        if (!$analysis) {
            ?>
            <div class="cwr-empty-report">
                <?php esc_html_e('No SEO report yet. Click Scan SEO for local details, or AI Analyze for OpenRouter recommendations.', 'custom-web-render'); ?>
            </div>
            <?php
            return;
        }

        $issues = isset($analysis['issues']) && is_array($analysis['issues']) ? $analysis['issues'] : array();
        $metrics = isset($analysis['metrics']) && is_array($analysis['metrics']) ? $analysis['metrics'] : array();
        $ai = isset($analysis['ai']) && is_array($analysis['ai']) ? $analysis['ai'] : array();
        ?>
        <div class="cwr-report-summary">
            <div>
                <?php self::render_score_badge(isset($analysis['score']) ? (int) $analysis['score'] : null, isset($analysis['issue_count']) ? (int) $analysis['issue_count'] : count($issues)); ?>
            </div>
            <div>
                <strong><?php echo esc_html(isset($analysis['summary']) ? $analysis['summary'] : __('SEO analysis completed.', 'custom-web-render')); ?></strong>
                <p>
                    <?php
                    echo esc_html(
                        sprintf(
                            /* translators: 1: model/local mode, 2: generated date. */
                            __('Mode: %1$s. Last analyzed: %2$s', 'custom-web-render'),
                            !empty($analysis['ai_enabled']) ? (isset($analysis['model']) ? $analysis['model'] : __('OpenRouter', 'custom-web-render')) : __('Local checks', 'custom-web-render'),
                            isset($analysis['generated_at']) ? self::format_utc_date($analysis['generated_at']) : __('Unknown', 'custom-web-render')
                        )
                    );
                    ?>
                </p>
            </div>
        </div>

        <?php if (!empty($analysis['ai_error'])) : ?>
            <div class="notice notice-warning inline"><p><?php echo esc_html($analysis['ai_error']); ?></p></div>
        <?php endif; ?>

        <?php if ($metrics) : ?>
            <div class="cwr-report-metrics">
                <?php foreach ($metrics as $label => $value) : ?>
                    <span><strong><?php echo esc_html(self::metric_label($label)); ?></strong><?php echo esc_html((string) $value); ?></span>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($analysis['applied_fixes']) && is_array($analysis['applied_fixes'])) : ?>
            <div class="cwr-ai-fixes">
                <h4><?php esc_html_e('Applied AI Fixes', 'custom-web-render'); ?></h4>
                <ul class="cwr-plain-list">
                    <?php foreach ($analysis['applied_fixes'] as $fix) : ?>
                        <li><?php echo esc_html((string) $fix); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if ($issues) : ?>
            <div class="cwr-fix-list">
                <?php foreach ($issues as $issue) : ?>
                    <details class="cwr-fix-item is-<?php echo esc_attr(isset($issue['severity']) ? $issue['severity'] : 'medium'); ?>">
                        <summary>
                            <strong><?php echo esc_html(isset($issue['title']) ? $issue['title'] : __('SEO issue', 'custom-web-render')); ?></strong>
                            <span><?php echo esc_html(ucfirst(isset($issue['severity']) ? $issue['severity'] : 'medium') . ' · ' . (isset($issue['category']) ? $issue['category'] : __('SEO', 'custom-web-render'))); ?></span>
                        </summary>
                        <div class="cwr-fix-detail">
                            <p><b><?php esc_html_e('Problem:', 'custom-web-render'); ?></b> <?php echo esc_html(isset($issue['problem']) ? $issue['problem'] : ''); ?></p>
                            <p><b><?php esc_html_e('How to fix:', 'custom-web-render'); ?></b> <?php echo esc_html(isset($issue['fix']) ? $issue['fix'] : ''); ?></p>
                        </div>
                    </details>
                <?php endforeach; ?>
            </div>
        <?php else : ?>
            <div class="cwr-empty-report"><?php esc_html_e('No critical problems found in the local checks.', 'custom-web-render'); ?></div>
        <?php endif; ?>

        <?php if (!empty($ai['priority_fixes']) && is_array($ai['priority_fixes'])) : ?>
            <div class="cwr-ai-fixes">
                <h4><?php esc_html_e('AI Priority Fixes', 'custom-web-render'); ?></h4>
                <?php foreach ($ai['priority_fixes'] as $fix) : ?>
                    <details class="cwr-fix-item is-ai" open>
                        <summary>
                            <strong><?php echo esc_html(isset($fix['title']) ? $fix['title'] : __('Recommended fix', 'custom-web-render')); ?></strong>
                            <span><?php echo esc_html(isset($fix['impact']) ? ucfirst((string) $fix['impact']) : __('AI', 'custom-web-render')); ?></span>
                        </summary>
                        <div class="cwr-fix-detail">
                            <p><b><?php esc_html_e('Why it matters:', 'custom-web-render'); ?></b> <?php echo esc_html(isset($fix['why']) ? $fix['why'] : ''); ?></p>
                            <p><b><?php esc_html_e('How to fix:', 'custom-web-render'); ?></b> <?php echo esc_html(isset($fix['how_to_fix']) ? $fix['how_to_fix'] : ''); ?></p>
                        </div>
                    </details>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($ai['snippet_suggestions']) && is_array($ai['snippet_suggestions'])) : ?>
            <div class="cwr-ai-fixes">
                <h4><?php esc_html_e('AI Snippet Suggestions', 'custom-web-render'); ?></h4>
                <div class="cwr-report-metrics">
                    <?php foreach ($ai['snippet_suggestions'] as $label => $value) : ?>
                        <?php if (trim((string) $value) !== '') : ?>
                            <span><strong><?php echo esc_html(self::metric_label($label)); ?></strong><?php echo esc_html((string) $value); ?></span>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>

        <?php if (!empty($ai['technical_fixes']) && is_array($ai['technical_fixes'])) : ?>
            <div class="cwr-ai-fixes">
                <h4><?php esc_html_e('AI Technical Fixes', 'custom-web-render'); ?></h4>
                <ul class="cwr-plain-list">
                    <?php foreach ($ai['technical_fixes'] as $fix) : ?>
                        <li><?php echo esc_html((string) $fix); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if (!empty($ai['content_recommendations']) && is_array($ai['content_recommendations'])) : ?>
            <div class="cwr-ai-fixes">
                <h4><?php esc_html_e('AI Content Recommendations', 'custom-web-render'); ?></h4>
                <ul class="cwr-plain-list">
                    <?php foreach ($ai['content_recommendations'] as $fix) : ?>
                        <li><?php echo esc_html((string) $fix); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if (!empty($analysis['checks']) && is_array($analysis['checks'])) : ?>
            <details class="cwr-check-details">
                <summary><?php esc_html_e('View All SEO Check Details', 'custom-web-render'); ?></summary>
                <div class="cwr-check-grid">
                    <?php foreach ($analysis['checks'] as $check) : ?>
                        <span class="<?php echo !empty($check['passed']) ? 'is-pass' : 'is-fail'; ?>">
                            <?php echo esc_html((!empty($check['passed']) ? 'Pass: ' : 'Fail: ') . (isset($check['title']) ? $check['title'] : __('SEO check', 'custom-web-render'))); ?>
                        </span>
                    <?php endforeach; ?>
                </div>
            </details>
        <?php endif; ?>
        <?php
    }

    private static function render_seo_report_html($analysis) {
        ob_start();
        self::render_seo_report($analysis);
        return ob_get_clean();
    }

    public static function ajax_load_seo_problems() {
        check_ajax_referer('cwr_load_seo_problems', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to load SEO problems.', 'custom-web-render')), 403);
        }

        $items = self::get_supported_posts();
        $badges = array();

        foreach ($items as $item) {
            if (!current_user_can('edit_post', $item->ID)) {
                continue;
            }

            $analysis = self::analyze_post_seo($item->ID, false);

            $badges[$item->ID] = self::render_score_badge_html(
                isset($analysis['score']) ? (int) $analysis['score'] : null,
                isset($analysis['issue_count']) ? (int) $analysis['issue_count'] : null
            );
        }

        wp_send_json_success(
            array(
                'html' => self::render_seo_problem_list_html($items),
                'badges' => $badges,
            )
        );
    }

    private static function render_seo_problem_list_html($items) {
        ob_start();
        self::render_seo_problem_list($items);
        return ob_get_clean();
    }

    private static function render_seo_problem_list($items) {
        $problem_groups = array();
        $total_issues = 0;

        foreach ($items as $item) {
            if (!current_user_can('edit_post', $item->ID)) {
                continue;
            }

            $analysis = self::get_saved_seo_analysis($item->ID);
            if (!$analysis || !isset($analysis['issues'])) {
                $analysis = self::analyze_post_seo($item->ID, false);
            }

            $issues = isset($analysis['issues']) && is_array($analysis['issues']) ? $analysis['issues'] : array();
            if (!$issues) {
                continue;
            }

            $total_issues += count($issues);
            $problem_groups[] = array(
                'post' => $item,
                'analysis' => $analysis,
                'issues' => $issues,
            );
        }

        if (!$problem_groups) {
            ?>
            <div class="cwr-empty-report">
                <?php esc_html_e('No SEO problems found in the current local checks.', 'custom-web-render'); ?>
            </div>
            <?php
            return;
        }
        ?>
        <div class="cwr-problem-summary">
            <strong>
                <?php
                echo esc_html(
                    sprintf(
                        /* translators: 1: issue count, 2: page/post count. */
                        _n('%1$d SEO problem across %2$d page/post', '%1$d SEO problems across %2$d pages/posts', $total_issues, 'custom-web-render'),
                        $total_issues,
                        count($problem_groups)
                    )
                );
                ?>
            </strong>
            <span><?php esc_html_e('Local checks refresh when this problem list opens.', 'custom-web-render'); ?></span>
        </div>
        <div class="cwr-problem-list">
            <?php foreach ($problem_groups as $group) : ?>
                <?php
                $post = $group['post'];
                $analysis = $group['analysis'];
                $issues = $group['issues'];
                $load_url = add_query_arg(
                    array(
                        'page' => self::MENU_SLUG,
                        'cwr_item' => $post->ID,
                    ),
                    admin_url('admin.php')
                );
                ?>
                <article class="cwr-problem-card">
                    <header>
                        <div>
                            <h3><?php echo esc_html(get_the_title($post) ?: __('(no title)', 'custom-web-render')); ?></h3>
                            <p>
                                <?php echo esc_html(ucfirst($post->post_type)); ?> ·
                                <a href="<?php echo esc_url(get_permalink($post)); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('View page', 'custom-web-render'); ?></a> ·
                                <a href="<?php echo esc_url($load_url); ?>"><?php esc_html_e('Load editor', 'custom-web-render'); ?></a>
                            </p>
                        </div>
                        <?php self::render_score_badge(isset($analysis['score']) ? (int) $analysis['score'] : null, count($issues)); ?>
                    </header>

                    <div class="cwr-fix-list">
                        <?php foreach ($issues as $issue) : ?>
                            <details class="cwr-fix-item is-<?php echo esc_attr(isset($issue['severity']) ? $issue['severity'] : 'medium'); ?>" open>
                                <summary>
                                    <strong><?php echo esc_html(isset($issue['title']) ? $issue['title'] : __('SEO issue', 'custom-web-render')); ?></strong>
                                    <span><?php echo esc_html(ucfirst(isset($issue['severity']) ? $issue['severity'] : 'medium') . ' · ' . (isset($issue['category']) ? $issue['category'] : __('SEO', 'custom-web-render'))); ?></span>
                                </summary>
                                <div class="cwr-fix-detail">
                                    <p><b><?php esc_html_e('Problem:', 'custom-web-render'); ?></b> <?php echo esc_html(isset($issue['problem']) ? $issue['problem'] : ''); ?></p>
                                    <p><b><?php esc_html_e('How to fix:', 'custom-web-render'); ?></b> <?php echo esc_html(isset($issue['fix']) ? $issue['fix'] : ''); ?></p>
                                </div>
                            </details>
                        <?php endforeach; ?>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
        <?php
    }

    public static function ajax_analyze_seo() {
        check_ajax_referer('cwr_analyze_seo', 'nonce');

        $post_id = isset($_POST['post_id']) ? absint($_POST['post_id']) : 0;
        if (!$post_id || !self::is_supported_post($post_id) || !current_user_can('edit_post', $post_id)) {
            wp_send_json_error(array('message' => __('You do not have permission to analyze this item.', 'custom-web-render')), 403);
        }

        $mode = isset($_POST['mode']) ? sanitize_key(wp_unslash($_POST['mode'])) : 'local';
        if ($mode === 'fix') {
            $analysis = self::fix_post_seo_with_ai($post_id);
        } else {
            $analysis = self::analyze_post_seo($post_id, $mode === 'ai');
        }
        $badge_html = self::render_score_badge_html(isset($analysis['score']) ? (int) $analysis['score'] : null, isset($analysis['issue_count']) ? (int) $analysis['issue_count'] : null);

        wp_send_json_success(
            array(
                'score' => isset($analysis['score']) ? (int) $analysis['score'] : 0,
                'issueCount' => isset($analysis['issue_count']) ? (int) $analysis['issue_count'] : 0,
                'html' => self::render_seo_report_html($analysis),
                'badgeHtml' => $badge_html,
                'fields' => self::get_post_seo_form_values($post_id),
            )
        );
    }

    private static function get_post_seo_form_values($post_id) {
        return array(
            'cwr_focus_keyword' => self::first_meta_value($post_id, array(self::META_FOCUS_KEYWORD, '_yoast_wpseo_focuskw', 'rank_math_focus_keyword')),
            'cwr_meta_title' => self::get_meta_title($post_id),
            'cwr_canonical_url' => self::first_meta_value($post_id, array(self::META_CANONICAL, '_yoast_wpseo_canonical', 'rank_math_canonical_url')),
            'cwr_meta_description' => self::get_meta_description($post_id),
            'cwr_schema_type' => self::normalize_schema_type(get_post_meta($post_id, self::META_SCHEMA_TYPE, true)),
            'cwr_robots_noindex' => get_post_meta($post_id, self::META_ROBOTS_NOINDEX, true) === '1',
            'cwr_robots_nofollow' => get_post_meta($post_id, self::META_ROBOTS_NOFOLLOW, true) === '1',
            'cwr_social_title' => (string) get_post_meta($post_id, self::META_SOCIAL_TITLE, true),
            'cwr_social_image' => (string) get_post_meta($post_id, self::META_SOCIAL_IMAGE, true),
            'cwr_social_description' => (string) get_post_meta($post_id, self::META_SOCIAL_DESCRIPTION, true),
        );
    }

    public static function ajax_openrouter_models() {
        check_ajax_referer('cwr_openrouter_settings', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to load models.', 'custom-web-render')), 403);
        }

        $api_key = self::ajax_openrouter_api_key();
        if ($api_key === '') {
            wp_send_json_error(array('message' => __('Add and save an OpenRouter API key first, or paste one before loading models.', 'custom-web-render')), 400);
        }

        $response = wp_remote_get(
            'https://openrouter.ai/api/v1/models?sort=most-popular&output_modalities=text',
            array(
                'timeout' => 30,
                'redirection' => 3,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'HTTP-Referer' => home_url('/'),
                    'X-Title' => get_bloginfo('name') ?: 'Custom Web Render',
                ),
            )
        );

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()), 500);
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($status < 200 || $status >= 300 || !isset($body['data']) || !is_array($body['data'])) {
            $message = isset($body['error']['message']) ? sanitize_text_field($body['error']['message']) : sprintf(__('OpenRouter returned HTTP %d.', 'custom-web-render'), $status);
            wp_send_json_error(array('message' => $message), $status ?: 500);
        }

        $models = array();
        foreach ($body['data'] as $model) {
            if (empty($model['id'])) {
                continue;
            }
            $id = sanitize_text_field((string) $model['id']);
            $name = !empty($model['name']) ? sanitize_text_field((string) $model['name']) : $id;
            $models[$id] = $name . ' (' . $id . ')';
            if (count($models) >= 120) {
                break;
            }
        }

        if (!$models) {
            wp_send_json_error(array('message' => __('No text models were returned by OpenRouter.', 'custom-web-render')), 500);
        }

        update_option(self::OPTION_OPENROUTER_MODELS, $models, false);

        wp_send_json_success(
            array(
                'models' => $models,
                'message' => sprintf(
                    /* translators: %d: number of loaded models. */
                    __('Loaded %d OpenRouter models. Choose one and click Save AI Settings.', 'custom-web-render'),
                    count($models)
                ),
            )
        );
    }

    public static function ajax_openrouter_test() {
        check_ajax_referer('cwr_openrouter_settings', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to test OpenRouter.', 'custom-web-render')), 403);
        }

        $api_key = self::ajax_openrouter_api_key();
        if ($api_key === '') {
            wp_send_json_error(array('message' => __('Add an OpenRouter API key before testing.', 'custom-web-render')), 400);
        }

        $model = self::ajax_openrouter_model();
        $payload = array(
            'model' => $model,
            'messages' => array(
                array('role' => 'system', 'content' => 'Return exactly: OK'),
                array('role' => 'user', 'content' => 'Test this OpenRouter connection.'),
            ),
            'temperature' => 0,
            'max_tokens' => 16,
        );

        $response = wp_remote_post(
            'https://openrouter.ai/api/v1/chat/completions',
            array(
                'timeout' => 30,
                'redirection' => 3,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => home_url('/'),
                    'X-Title' => get_bloginfo('name') ?: 'Custom Web Render',
                ),
                'body' => wp_json_encode($payload),
            )
        );

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()), 500);
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if ($status < 200 || $status >= 300) {
            $message = isset($body['error']['message']) ? sanitize_text_field($body['error']['message']) : sprintf(__('OpenRouter returned HTTP %d.', 'custom-web-render'), $status);
            wp_send_json_error(array('message' => $message), $status ?: 500);
        }

        wp_send_json_success(
            array(
                'message' => sprintf(
                    /* translators: %s: OpenRouter model slug. */
                    __('OpenRouter connection works with %s. Click Save AI Settings to keep these credentials.', 'custom-web-render'),
                    $model
                ),
            )
        );
    }

    private static function ajax_openrouter_api_key() {
        $api_key = isset($_POST['api_key']) ? sanitize_text_field(wp_unslash($_POST['api_key'])) : '';
        return $api_key !== '' ? $api_key : self::get_openrouter_api_key();
    }

    private static function ajax_openrouter_model() {
        $model = isset($_POST['model']) ? sanitize_text_field(wp_unslash($_POST['model'])) : '';
        if ($model === 'custom') {
            $model = isset($_POST['custom_model']) ? sanitize_text_field(wp_unslash($_POST['custom_model'])) : '';
        }
        return $model !== '' ? $model : self::get_openrouter_model();
    }

    private static function fix_post_seo_with_ai($post_id) {
        $analysis = self::analyze_post_seo($post_id, true);
        if (empty($analysis['ai_enabled']) || !empty($analysis['ai_error'])) {
            return $analysis;
        }

        $applied = self::apply_ai_fix_suggestions($post_id, $analysis);
        if (!$applied) {
            $analysis['applied_fixes'] = array(__('AI returned guidance, but no safe metadata fixes were available to apply automatically.', 'custom-web-render'));
            update_post_meta($post_id, self::META_SEO_ANALYSIS, $analysis);
            return $analysis;
        }

        $rescanned = self::analyze_post_seo($post_id, false);
        $rescanned['ai_enabled'] = true;
        $rescanned['model'] = isset($analysis['model']) ? $analysis['model'] : self::get_openrouter_model();
        $rescanned['ai'] = isset($analysis['ai']) ? $analysis['ai'] : array();
        $rescanned['applied_fixes'] = $applied;
        $rescanned['summary'] = __('AI fixes were applied to safe SEO metadata. Rescan again after manual content/code fixes.', 'custom-web-render');

        update_post_meta($post_id, self::META_SEO_ANALYSIS, $rescanned);
        update_post_meta($post_id, self::META_SEO_SCORE, (string) $rescanned['score']);
        update_post_meta($post_id, self::META_SEO_ISSUES, (string) $rescanned['issue_count']);

        return $rescanned;
    }

    private static function apply_ai_fix_suggestions($post_id, $analysis) {
        $ai = isset($analysis['ai']) && is_array($analysis['ai']) ? $analysis['ai'] : array();
        $snippets = isset($ai['snippet_suggestions']) && is_array($ai['snippet_suggestions']) ? $ai['snippet_suggestions'] : array();
        $applied = array();

        if (!empty($snippets['meta_title'])) {
            update_post_meta($post_id, self::META_TITLE, sanitize_text_field((string) $snippets['meta_title']));
            $applied[] = __('Updated SEO title from AI suggestion.', 'custom-web-render');
        }
        if (!empty($snippets['meta_description'])) {
            update_post_meta($post_id, self::META_DESCRIPTION, sanitize_textarea_field((string) $snippets['meta_description']));
            $applied[] = __('Updated meta description from AI suggestion.', 'custom-web-render');
        }
        if (!empty($snippets['focus_keyword'])) {
            update_post_meta($post_id, self::META_FOCUS_KEYWORD, sanitize_text_field((string) $snippets['focus_keyword']));
            $applied[] = __('Updated focus keyword from AI suggestion.', 'custom-web-render');
        }
        if (!empty($snippets['social_title'])) {
            update_post_meta($post_id, self::META_SOCIAL_TITLE, sanitize_text_field((string) $snippets['social_title']));
            $applied[] = __('Updated social title from AI suggestion.', 'custom-web-render');
        }
        if (!empty($snippets['social_description'])) {
            update_post_meta($post_id, self::META_SOCIAL_DESCRIPTION, sanitize_textarea_field((string) $snippets['social_description']));
            $applied[] = __('Updated social description from AI suggestion.', 'custom-web-render');
        }
        if (!empty($snippets['schema_type'])) {
            update_post_meta($post_id, self::META_SCHEMA_TYPE, self::normalize_schema_type($snippets['schema_type']));
            $applied[] = __('Updated schema type from AI suggestion.', 'custom-web-render');
        } elseif (self::normalize_schema_type(get_post_meta($post_id, self::META_SCHEMA_TYPE, true)) === 'none') {
            $post = get_post($post_id);
            update_post_meta($post_id, self::META_SCHEMA_TYPE, $post && $post->post_type === 'post' ? 'Article' : 'WebPage');
            $applied[] = __('Set a default schema type.', 'custom-web-render');
        }

        if (trim((string) get_post_meta($post_id, self::META_CANONICAL, true)) === '') {
            update_post_meta($post_id, self::META_CANONICAL, esc_url_raw(get_permalink($post_id)));
            $applied[] = __('Set canonical URL to the page permalink.', 'custom-web-render');
        }

        if (get_post_meta($post_id, self::META_ROBOTS_NOINDEX, true) === '1') {
            update_post_meta($post_id, self::META_ROBOTS_NOINDEX, '0');
            $applied[] = __('Removed noindex robots directive.', 'custom-web-render');
        }
        if (get_post_meta($post_id, self::META_ROBOTS_NOFOLLOW, true) === '1') {
            update_post_meta($post_id, self::META_ROBOTS_NOFOLLOW, '0');
            $applied[] = __('Removed nofollow robots directive.', 'custom-web-render');
        }

        $meta_title = self::get_meta_title($post_id);
        $meta_description = self::get_meta_description($post_id);
        if (trim((string) get_post_meta($post_id, self::META_SOCIAL_TITLE, true)) === '' && trim($meta_title) !== '') {
            update_post_meta($post_id, self::META_SOCIAL_TITLE, $meta_title);
            $applied[] = __('Copied SEO title into social title.', 'custom-web-render');
        }
        if (trim((string) get_post_meta($post_id, self::META_SOCIAL_DESCRIPTION, true)) === '' && trim($meta_description) !== '') {
            update_post_meta($post_id, self::META_SOCIAL_DESCRIPTION, $meta_description);
            $applied[] = __('Copied meta description into social description.', 'custom-web-render');
        }
        if (trim((string) get_post_meta($post_id, self::META_SOCIAL_IMAGE, true)) === '') {
            $featured = get_the_post_thumbnail_url($post_id, 'full');
            if ($featured) {
                update_post_meta($post_id, self::META_SOCIAL_IMAGE, esc_url_raw($featured));
                $applied[] = __('Set featured image as social image.', 'custom-web-render');
            }
        }

        if ($applied) {
            self::sync_compatible_seo_meta($post_id);
        }

        return array_values(array_unique($applied));
    }

    public static function analyze_post_seo($post_id, $use_ai = true) {
        $post = get_post($post_id);
        if (!$post || !self::is_supported_post($post_id)) {
            return array(
                'score' => 0,
                'issue_count' => 1,
                'summary' => __('Post or page not found.', 'custom-web-render'),
                'issues' => array(),
                'metrics' => array(),
            );
        }

        $local = self::build_local_seo_audit($post);
        $analysis = array(
            'score' => $local['score'],
            'issue_count' => count($local['issues']),
            'summary' => self::summary_for_score($local['score']),
            'generated_at' => current_time('mysql', true),
            'post_id' => (int) $post_id,
            'post_title' => get_the_title($post),
            'url' => get_permalink($post),
            'metrics' => $local['metrics'],
            'checks' => $local['checks'],
            'issues' => $local['issues'],
            'ai_enabled' => false,
            'model' => '',
            'ai' => array(),
            'ai_error' => '',
        );

        if ($use_ai && self::get_openrouter_api_key() === '') {
            $analysis['ai_error'] = __('OpenRouter API key is not configured. Add the key, click Save AI Settings, then run AI Analyze again.', 'custom-web-render');
        } elseif ($use_ai) {
            $ai = self::request_openrouter_analysis($analysis);
            if (is_wp_error($ai)) {
                $analysis['ai_error'] = $ai->get_error_message();
            } else {
                $analysis['ai_enabled'] = true;
                $analysis['model'] = self::get_openrouter_model();
                $analysis['ai'] = $ai;
                if (!empty($ai['summary'])) {
                    $analysis['summary'] = (string) $ai['summary'];
                }
                if (isset($ai['score']) && is_numeric($ai['score'])) {
                    $analysis['score'] = max(0, min(100, (int) round((float) $ai['score'])));
                }
            }
        }

        update_post_meta($post_id, self::META_SEO_ANALYSIS, $analysis);
        update_post_meta($post_id, self::META_SEO_SCORE, (string) $analysis['score']);
        update_post_meta($post_id, self::META_SEO_ISSUES, (string) $analysis['issue_count']);

        return $analysis;
    }

    private static function build_local_seo_audit($post) {
        $post_id = $post->ID;
        $source = self::get_analysis_source($post);
        $html = $source['html'];
        $text = self::normalize_text(wp_strip_all_tags(strip_shortcodes($html)));
        $words = self::word_count($text);
        $meta_title = self::get_meta_title($post_id);
        $fallback_title = get_the_title($post);
        $effective_title = trim($meta_title) !== '' ? $meta_title : $fallback_title;
        $description = self::get_meta_description($post_id);
        $focus_keyword = (string) get_post_meta($post_id, self::META_FOCUS_KEYWORD, true);
        $canonical = self::get_canonical_url($post_id);
        $schema_type = self::normalize_schema_type(get_post_meta($post_id, self::META_SCHEMA_TYPE, true));
        $social_title = self::get_social_title($post_id);
        $social_description = self::get_social_description($post_id);
        $social_image = self::get_social_image($post_id);
        $url = get_permalink($post);
        $home_scheme = wp_parse_url(home_url('/'), PHP_URL_SCHEME);

        $h1_count = preg_match_all('/<h1\b[^>]*>/i', $html);
        if (!$source['custom_render'] && trim($fallback_title) !== '') {
            $h1_count = max(1, (int) $h1_count);
        }
        $h2_count = preg_match_all('/<h2\b[^>]*>/i', $html);
        $image_count = preg_match_all('/<img\b[^>]*>/i', $html, $image_matches);
        $missing_alt = 0;
        if (!empty($image_matches[0])) {
            foreach ($image_matches[0] as $image_tag) {
                if (!preg_match('/\salt\s*=\s*(["\'])(.*?)\1/i', $image_tag, $alt_match) || trim($alt_match[2]) === '') {
                    $missing_alt++;
                }
            }
        }
        $links = self::count_links($html);
        $css_bytes = strlen($source['css']);
        $js_bytes = strlen($source['js']);

        $metrics = array(
            'word_count' => $words,
            'title_length' => self::string_length($effective_title),
            'description_length' => self::string_length($description),
            'focus_keyword' => $focus_keyword !== '' ? $focus_keyword : __('Missing', 'custom-web-render'),
            'h1_count' => (int) $h1_count,
            'h2_count' => (int) $h2_count,
            'images' => (int) $image_count,
            'missing_alt' => (int) $missing_alt,
            'internal_links' => $links['internal'],
            'external_links' => $links['external'],
            'schema' => $schema_type,
            'canonical' => $canonical,
            'robots' => self::robots_content($post_id),
            'css_kb' => round($css_bytes / 1024, 1),
            'js_kb' => round($js_bytes / 1024, 1),
        );

        $score = 100;
        $issues = array();
        $checks = array();

        self::check_condition($checks, $issues, $score, trim($effective_title) !== '', 'high', 'Meta', __('Missing SEO title', 'custom-web-render'), __('Search engines need a clear title for this URL.', 'custom-web-render'), __('Add a unique SEO title around 30-60 characters that includes the focus keyword.', 'custom-web-render'));
        if (trim($effective_title) !== '') {
            self::check_condition($checks, $issues, $score, self::string_length($effective_title) >= 30 && self::string_length($effective_title) <= 60, 'medium', 'Meta', __('SEO title length needs work', 'custom-web-render'), __('The SEO title is outside the recommended 30-60 character range.', 'custom-web-render'), __('Rewrite the title so it is specific, readable, and close to search-result length.', 'custom-web-render'));
        }

        self::check_condition($checks, $issues, $score, trim($description) !== '', 'high', 'Meta', __('Missing meta description', 'custom-web-render'), __('The page has no saved meta description.', 'custom-web-render'), __('Add a persuasive 120-160 character summary that includes the main keyword and a reason to click.', 'custom-web-render'));
        if (trim($description) !== '') {
            self::check_condition($checks, $issues, $score, self::string_length($description) >= 120 && self::string_length($description) <= 160, 'medium', 'Meta', __('Meta description length needs work', 'custom-web-render'), __('The meta description is outside the recommended 120-160 character range.', 'custom-web-render'), __('Tighten or expand the description so it reads naturally in search results.', 'custom-web-render'));
        }

        self::check_condition($checks, $issues, $score, trim($focus_keyword) !== '', 'high', 'Keyword', __('Missing focus keyword', 'custom-web-render'), __('The analyzer cannot judge keyword targeting without a focus keyword.', 'custom-web-render'), __('Add the main search phrase you want this page to rank for.', 'custom-web-render'));
        if (trim($focus_keyword) !== '') {
            self::check_condition($checks, $issues, $score, self::contains_phrase($effective_title, $focus_keyword), 'medium', 'Keyword', __('Keyword missing from SEO title', 'custom-web-render'), __('The focus keyword does not appear in the SEO title.', 'custom-web-render'), __('Place the focus keyword near the start of the title if it still reads naturally.', 'custom-web-render'));
            self::check_condition($checks, $issues, $score, self::contains_phrase($description, $focus_keyword), 'medium', 'Keyword', __('Keyword missing from meta description', 'custom-web-render'), __('The focus keyword does not appear in the meta description.', 'custom-web-render'), __('Add the keyword once in a natural sentence that explains the page value.', 'custom-web-render'));
            self::check_condition($checks, $issues, $score, self::contains_phrase($post->post_name, sanitize_title($focus_keyword)) || self::contains_phrase($post->post_name, $focus_keyword), 'low', 'Keyword', __('Keyword missing from slug', 'custom-web-render'), __('The URL slug does not reflect the focus keyword.', 'custom-web-render'), __('Use a short, readable slug that includes the target phrase when possible.', 'custom-web-render'));
            self::check_condition($checks, $issues, $score, self::contains_phrase(self::first_words($text, 140), $focus_keyword), 'medium', 'Content', __('Keyword missing near introduction', 'custom-web-render'), __('The focus keyword does not appear early in the visible copy.', 'custom-web-render'), __('Mention the keyword naturally in the opening section so searchers and crawlers understand the topic.', 'custom-web-render'));
        }

        self::check_condition($checks, $issues, $score, $words >= 300, 'high', 'Content', __('Thin content', 'custom-web-render'), __('The page has fewer than 300 visible words.', 'custom-web-render'), __('Add useful copy that answers search intent, covers subtopics, and links to relevant pages.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, $words >= 600, 'low', 'Content', __('Content depth could improve', 'custom-web-render'), __('The page has fewer than 600 visible words.', 'custom-web-render'), __('Expand the page with examples, FAQs, comparisons, proof, or next-step guidance where appropriate.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, (int) $h1_count === 1, (int) $h1_count === 0 ? 'high' : 'medium', 'Headings', __('H1 structure problem', 'custom-web-render'), __('The page should have exactly one primary H1 heading.', 'custom-web-render'), __('Use one H1 for the page topic, then structure supporting sections with H2/H3 headings.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, (int) $h2_count >= 1, 'low', 'Headings', __('No H2 sections found', 'custom-web-render'), __('The page does not appear to use H2 section headings.', 'custom-web-render'), __('Break the copy into scannable H2 sections that match related search questions.', 'custom-web-render'));

        if ((int) $image_count > 0) {
            self::check_condition($checks, $issues, $score, (int) $missing_alt === 0, 'medium', 'Images', __('Image alt text missing', 'custom-web-render'), __('One or more images are missing descriptive alt text.', 'custom-web-render'), __('Add concise alt text that describes the image and, when relevant, supports the topic.', 'custom-web-render'));
        }

        self::check_condition($checks, $issues, $score, $links['internal'] >= 1, 'medium', 'Links', __('No internal links found', 'custom-web-render'), __('The page does not link to another page on this site.', 'custom-web-render'), __('Add internal links to related service pages, supporting articles, or conversion pages.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, $links['external'] >= 1, 'low', 'Links', __('No external citations found', 'custom-web-render'), __('The page does not cite any external source.', 'custom-web-render'), __('Add a useful external reference when it supports trust, data, or definitions.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, get_post_meta($post_id, self::META_ROBOTS_NOINDEX, true) !== '1', 'high', 'Indexing', __('Page is set to noindex', 'custom-web-render'), __('Search engines are instructed not to index this URL.', 'custom-web-render'), __('Remove noindex unless this page intentionally should not appear in search results.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, $schema_type !== 'none', 'medium', 'Schema', __('Schema disabled', 'custom-web-render'), __('No structured data type is selected for this page.', 'custom-web-render'), __('Choose WebPage, Article, FAQPage, HowTo, Product, LocalBusiness, or another appropriate schema type.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, trim($social_title) !== '' && trim($social_description) !== '' && trim($social_image) !== '', 'low', 'Social', __('Open Graph data incomplete', 'custom-web-render'), __('Social title, description, or image is missing.', 'custom-web-render'), __('Add social metadata so Facebook, LinkedIn, X/Twitter, and chat apps show a strong preview.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, self::string_length((string) wp_parse_url($url, PHP_URL_PATH)) <= 90, 'low', 'URL', __('URL path is long', 'custom-web-render'), __('The URL path is longer than ideal for readability.', 'custom-web-render'), __('Use a shorter slug that keeps the main keyword and removes filler words.', 'custom-web-render'));
        self::check_condition($checks, $issues, $score, $home_scheme === 'https', 'medium', 'Technical', __('Site is not using HTTPS', 'custom-web-render'), __('The site URL does not appear to use HTTPS.', 'custom-web-render'), __('Serve the site over HTTPS and redirect HTTP URLs to their HTTPS versions.', 'custom-web-render'));

        if ($source['custom_render'] && $source['full_document']) {
            self::check_condition($checks, $issues, $score, preg_match('/<meta\b[^>]*name\s*=\s*(["\'])viewport\1/i', $html), 'medium', 'Technical', __('Custom render missing viewport tag', 'custom-web-render'), __('The full custom HTML document does not include a viewport meta tag.', 'custom-web-render'), __('Add a responsive viewport tag in the head: width=device-width, initial-scale=1.', 'custom-web-render'));
        }

        self::check_condition($checks, $issues, $score, ($css_bytes + $js_bytes) <= 180000, 'low', 'Performance', __('Large custom CSS/JS payload', 'custom-web-render'), __('The saved custom CSS and JavaScript are large enough to affect load time.', 'custom-web-render'), __('Remove unused code, defer non-critical scripts, and compress repeated styles.', 'custom-web-render'));

        return array(
            'score' => max(0, min(100, (int) $score)),
            'metrics' => $metrics,
            'checks' => $checks,
            'issues' => $issues,
        );
    }

    private static function check_condition(&$checks, &$issues, &$score, $passed, $severity, $category, $title, $problem, $fix) {
        $checks[] = array(
            'title' => $title,
            'category' => $category,
            'passed' => (bool) $passed,
            'severity' => $severity,
        );

        if ($passed) {
            return;
        }

        $deductions = array('high' => 10, 'medium' => 6, 'low' => 3);
        $score -= isset($deductions[$severity]) ? $deductions[$severity] : 5;
        $issues[] = array(
            'severity' => $severity,
            'category' => $category,
            'title' => $title,
            'problem' => $problem,
            'fix' => $fix,
        );
    }

    private static function request_openrouter_analysis($analysis) {
        $api_key = self::get_openrouter_api_key();
        if ($api_key === '') {
            return new WP_Error('openrouter_missing_key', __('OpenRouter API key is not configured; local SEO checks were saved.', 'custom-web-render'));
        }

        $model = self::get_openrouter_model();
        $prompt = "Return JSON only. Review this WordPress SEO audit and provide a practical fix plan. "
            . "Keep the existing score unless you strongly disagree, and if you change it, stay within 10 points. "
            . "Schema: {\"score\": number, \"summary\": string, \"priority_fixes\": [{\"title\": string, \"why\": string, \"how_to_fix\": string, \"impact\": \"high|medium|low\"}], \"snippet_suggestions\": {\"meta_title\": string, \"meta_description\": string, \"focus_keyword\": string, \"social_title\": string, \"social_description\": string, \"schema_type\": string}, \"technical_fixes\": [string], \"content_recommendations\": [string]}. "
            . "Audit: " . wp_json_encode(self::compact_analysis_for_ai($analysis), JSON_UNESCAPED_SLASHES);

        $messages = array(
            array(
                'role' => 'system',
                'content' => get_option(self::OPTION_OPENROUTER_SYSTEM_PROMPT, self::default_openrouter_system_prompt()),
            ),
            array(
                'role' => 'user',
                'content' => $prompt,
            ),
        );

        $payload = array(
            'model' => $model,
            'messages' => $messages,
            'temperature' => 0.2,
            'max_tokens' => 1500,
            'response_format' => array('type' => 'json_object'),
        );

        $body = self::openrouter_chat_request($api_key, $payload);

        // Some models do not support response_format; retry once without it.
        if (is_wp_error($body) && $body->get_error_code() === 'openrouter_http_error') {
            unset($payload['response_format']);
            $body = self::openrouter_chat_request($api_key, $payload);
        }

        if (is_wp_error($body)) {
            return $body;
        }

        $content = isset($body['choices'][0]['message']['content']) ? (string) $body['choices'][0]['message']['content'] : '';
        $json = self::decode_ai_json($content);
        if (!is_array($json)) {
            return new WP_Error('openrouter_invalid_json', __('OpenRouter responded, but the AI result was not valid JSON. Local checks were saved.', 'custom-web-render'));
        }

        return self::sanitize_ai_payload($json);
    }

    /**
     * Perform a chat completion request against OpenRouter.
     *
     * @return array|WP_Error Decoded response body, or WP_Error on failure.
     */
    private static function openrouter_chat_request($api_key, array $payload) {
        $response = wp_remote_post(
            'https://openrouter.ai/api/v1/chat/completions',
            array(
                'timeout' => 45,
                'redirection' => 3,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => home_url('/'),
                    'X-Title' => get_bloginfo('name') ?: 'Custom Web Render',
                ),
                'body' => wp_json_encode($payload),
            )
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status < 200 || $status >= 300) {
            $message = isset($body['error']['message']) && $body['error']['message'] !== ''
                ? $body['error']['message']
                : sprintf(
                    /* translators: 1: HTTP status code, 2: model slug. */
                    __('OpenRouter returned HTTP %1$d for model "%2$s". Check the model slug and your API credits.', 'custom-web-render'),
                    $status,
                    isset($payload['model']) ? $payload['model'] : ''
                );
            return new WP_Error('openrouter_http_error', sanitize_text_field($message));
        }

        if (!is_array($body)) {
            return new WP_Error('openrouter_invalid_json', __('OpenRouter returned an unreadable response.', 'custom-web-render'));
        }

        return $body;
    }

    private static function compact_analysis_for_ai($analysis) {
        return array(
            'score' => isset($analysis['score']) ? (int) $analysis['score'] : 0,
            'summary' => isset($analysis['summary']) ? $analysis['summary'] : '',
            'url' => isset($analysis['url']) ? $analysis['url'] : '',
            'post_title' => isset($analysis['post_title']) ? $analysis['post_title'] : '',
            'metrics' => isset($analysis['metrics']) ? $analysis['metrics'] : array(),
            'issues' => isset($analysis['issues']) ? array_slice($analysis['issues'], 0, 20) : array(),
        );
    }

    private static function decode_ai_json($content) {
        $content = trim((string) $content);
        $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
        $content = preg_replace('/\s*```$/', '', $content);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        $start = strpos($content, '{');
        $end = strrpos($content, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $decoded = json_decode(substr($content, $start, $end - $start + 1), true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private static function sanitize_ai_payload($value, $depth = 0) {
        if ($depth > 5) {
            return '';
        }
        if (is_array($value)) {
            $clean = array();
            foreach ($value as $key => $item) {
                $clean_key = is_string($key) ? sanitize_key($key) : $key;
                $clean[$clean_key] = self::sanitize_ai_payload($item, $depth + 1);
            }
            return $clean;
        }
        if (is_numeric($value)) {
            return $value;
        }
        if (is_bool($value)) {
            return $value;
        }
        return self::truncate_text(sanitize_textarea_field((string) $value), 1200);
    }

    private static function get_analysis_source($post) {
        $post_id = $post->ID;
        $custom_render = get_post_meta($post_id, self::META_ENABLED, true) === '1';
        $html = $post->post_content . "\n" . $post->post_excerpt;
        $css = '';
        $js = '';
        if ($custom_render) {
            $header_bundle = self::resolve_header($post_id);
            $footer_bundle = self::resolve_footer($post_id);
            $header = $header_bundle['html'];
            $footer = $footer_bundle['html'];
            $html = $header . "\n" . (string) get_post_meta($post_id, self::META_HTML, true) . "\n" . $footer;
            $css = $header_bundle['css'] . "\n" . (string) get_post_meta($post_id, self::META_CSS, true) . "\n" . $footer_bundle['css'];
            $js = (string) get_post_meta($post_id, self::META_JS, true);
        }

        return array(
            'html' => $html,
            'css' => $css,
            'js' => $js,
            'custom_render' => $custom_render,
            'full_document' => (bool) preg_match('/<(?:!doctype|html)\b/i', $html),
        );
    }

    private static function count_links($html) {
        $counts = array('internal' => 0, 'external' => 0);
        if (!preg_match_all('/<a\b[^>]*href\s*=\s*(["\'])(.*?)\1/i', $html, $matches)) {
            return $counts;
        }

        $home_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
        foreach ($matches[2] as $href) {
            $href = trim($href);
            if ($href === '' || strpos($href, '#') === 0 || stripos($href, 'mailto:') === 0 || stripos($href, 'tel:') === 0) {
                continue;
            }
            $host = strtolower((string) wp_parse_url($href, PHP_URL_HOST));
            if ($host === '' || $host === $home_host) {
                $counts['internal']++;
            } else {
                $counts['external']++;
            }
        }
        return $counts;
    }

    public static function get_saved_seo_analysis($post_id) {
        $analysis = get_post_meta($post_id, self::META_SEO_ANALYSIS, true);
        if (is_string($analysis) && $analysis !== '') {
            $decoded = json_decode($analysis, true);
            if (is_array($decoded)) {
                $analysis = $decoded;
            }
        }
        if (is_array($analysis)) {
            return $analysis;
        }

        $score = get_post_meta($post_id, self::META_SEO_SCORE, true);
        if ($score !== '') {
            return array(
                'score' => (int) $score,
                'issue_count' => (int) get_post_meta($post_id, self::META_SEO_ISSUES, true),
                'summary' => self::summary_for_score((int) $score),
                'issues' => array(),
                'metrics' => array(),
            );
        }
        return null;
    }

    private static function render_score_badge_html($score, $issue_count = null) {
        ob_start();
        self::render_score_badge($score, $issue_count);
        return ob_get_clean();
    }

    private static function summary_for_score($score) {
        $score = (int) $score;
        if ($score >= 85) {
            return __('Strong SEO health. Keep refining content depth and internal links.', 'custom-web-render');
        }
        if ($score >= 70) {
            return __('Good foundation with a few important SEO fixes remaining.', 'custom-web-render');
        }
        if ($score >= 50) {
            return __('SEO needs work. Fix the highest-impact metadata, content, and technical issues first.', 'custom-web-render');
        }
        return __('SEO risk is high. Address indexability, metadata, headings, and content quality before publishing.', 'custom-web-render');
    }

    private static function metric_label($key) {
        $labels = array(
            'word_count' => __('Words', 'custom-web-render'),
            'title_length' => __('Title chars', 'custom-web-render'),
            'description_length' => __('Description chars', 'custom-web-render'),
            'focus_keyword' => __('Focus keyword', 'custom-web-render'),
            'h1_count' => __('H1', 'custom-web-render'),
            'h2_count' => __('H2', 'custom-web-render'),
            'images' => __('Images', 'custom-web-render'),
            'missing_alt' => __('Missing alt', 'custom-web-render'),
            'internal_links' => __('Internal links', 'custom-web-render'),
            'external_links' => __('External links', 'custom-web-render'),
            'schema' => __('Schema', 'custom-web-render'),
            'canonical' => __('Canonical', 'custom-web-render'),
            'robots' => __('Robots', 'custom-web-render'),
            'css_kb' => __('CSS KB', 'custom-web-render'),
            'js_kb' => __('JS KB', 'custom-web-render'),
            'meta_title' => __('Meta title', 'custom-web-render'),
            'meta_description' => __('Meta description', 'custom-web-render'),
            'social_title' => __('Social title', 'custom-web-render'),
            'social_description' => __('Social description', 'custom-web-render'),
            'schema_type' => __('Schema type', 'custom-web-render'),
        );
        return isset($labels[$key]) ? $labels[$key] . ': ' : ucwords(str_replace('_', ' ', $key)) . ': ';
    }

    private static function normalize_text($text) {
        return trim(preg_replace('/\s+/u', ' ', (string) $text));
    }

    private static function word_count($text) {
        $text = self::normalize_text($text);
        if ($text === '') {
            return 0;
        }
        $words = preg_split('/\s+/u', $text);
        return is_array($words) ? count(array_filter($words)) : 0;
    }

    private static function first_words($text, $limit) {
        $words = preg_split('/\s+/u', self::normalize_text($text));
        if (!is_array($words)) {
            return '';
        }
        return implode(' ', array_slice($words, 0, $limit));
    }

    private static function contains_phrase($haystack, $needle) {
        $haystack = strtolower(remove_accents((string) $haystack));
        $needle = strtolower(remove_accents((string) $needle));
        if (trim($needle) === '') {
            return false;
        }
        return strpos($haystack, $needle) !== false;
    }

    private static function string_length($value) {
        $value = (string) $value;
        return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
    }

    private static function truncate_text($value, $limit) {
        $value = (string) $value;
        if (self::string_length($value) <= $limit) {
            return $value;
        }
        if (function_exists('mb_substr')) {
            return mb_substr($value, 0, $limit);
        }
        return substr($value, 0, $limit);
    }

    private static function openrouter_model_options() {
        $defaults = array(
            'openai/gpt-4o-mini' => __('OpenAI GPT-4o Mini (fast, low cost)', 'custom-web-render'),
            'openai/gpt-4o' => __('OpenAI GPT-4o', 'custom-web-render'),
            'anthropic/claude-3.5-sonnet' => __('Claude 3.5 Sonnet', 'custom-web-render'),
            'google/gemini-2.5-flash' => __('Gemini 2.5 Flash', 'custom-web-render'),
            'deepseek/deepseek-chat' => __('DeepSeek Chat', 'custom-web-render'),
            'openrouter/auto' => __('Auto (let OpenRouter choose)', 'custom-web-render'),
        );
        $loaded = get_option(self::OPTION_OPENROUTER_MODELS, array());
        if (!is_array($loaded)) {
            $loaded = array();
        }
        $loaded = array_map('sanitize_text_field', $loaded);
        return $defaults + $loaded;
    }

    private static function get_openrouter_api_key() {
        return trim((string) get_option(self::OPTION_OPENROUTER_API_KEY, ''));
    }

    private static function get_openrouter_model() {
        $model = trim((string) get_option(self::OPTION_OPENROUTER_MODEL, self::DEFAULT_OPENROUTER_MODEL));
        return self::normalize_model_slug($model);
    }

    /**
     * Ensure the stored model is a valid OpenRouter slug (provider/model-name).
     * Legacy installs saved an invalid "~openai/gpt-latest" alias that always
     * returned an HTTP error, so migrate any invalid value to a working default.
     */
    private static function normalize_model_slug($model) {
        $model = trim((string) $model);

        if ($model === '' || $model[0] === '~' || strpos($model, '/') === false) {
            return self::DEFAULT_OPENROUTER_MODEL;
        }

        return $model;
    }

    private static function default_openrouter_system_prompt() {
        return 'You are a senior technical SEO auditor for WordPress. Be specific, practical, and concise. Prioritize fixes that improve crawlability, indexability, snippets, content relevance, schema, internal links, and conversion intent. Return valid JSON only.';
    }

    private static function mask_secret($secret) {
        $secret = (string) $secret;
        if (self::string_length($secret) <= 10) {
            return str_repeat('*', self::string_length($secret));
        }
        return substr($secret, 0, 4) . str_repeat('*', 10) . substr($secret, -4);
    }

    public static function get_supported_posts($orderby = null, $order = null) {
        $valid_orderby = array('date', 'modified', 'title', 'post_type');
        $valid_order = array('ASC', 'DESC');

        if ($orderby === null) {
            $orderby = isset($_GET['cwr_orderby']) && in_array(sanitize_key($_GET['cwr_orderby']), $valid_orderby, true)
                ? sanitize_key($_GET['cwr_orderby'])
                : 'date';
        }
        if ($order === null) {
            $order = isset($_GET['cwr_order']) && in_array(strtoupper(sanitize_key($_GET['cwr_order'])), $valid_order, true)
                ? strtoupper(sanitize_key($_GET['cwr_order']))
                : 'DESC';
        }

        return get_posts(
            array(
                'post_type'   => array('page', 'post'),
                'post_status' => array('publish', 'draft', 'pending', 'private', 'future'),
                'numberposts' => -1,
                'orderby'     => $orderby,
                'order'       => $order,
            )
        );
    }

    private static function is_supported_post($post_id) {
        $post = get_post($post_id);
        return $post && in_array($post->post_type, array('page', 'post'), true);
    }

    private static function schema_type_options() {
        return array(
            'none' => __('None', 'custom-web-render'),
            'WebPage' => __('WebPage', 'custom-web-render'),
            'Article' => __('Article', 'custom-web-render'),
            'BlogPosting' => __('BlogPosting', 'custom-web-render'),
            'FAQPage' => __('FAQPage', 'custom-web-render'),
            'HowTo' => __('HowTo', 'custom-web-render'),
            'Product' => __('Product', 'custom-web-render'),
            'LocalBusiness' => __('LocalBusiness', 'custom-web-render'),
            'Service' => __('Service', 'custom-web-render'),
        );
    }

    private static function normalize_schema_type($schema_type) {
        $schema_type = (string) $schema_type;
        $map = array(
            '' => 'WebPage',
            'webpage' => 'WebPage',
            'article' => 'Article',
            'blogposting' => 'BlogPosting',
            'faqpage' => 'FAQPage',
            'howto' => 'HowTo',
            'product' => 'Product',
            'localbusiness' => 'LocalBusiness',
            'service' => 'Service',
            'none' => 'none',
        );
        $key = strtolower(str_replace(array('-', '_', ' '), '', $schema_type));
        return isset($map[$key]) ? $map[$key] : 'WebPage';
    }

    private static function get_canonical_url($post_id) {
        $canonical = trim((string) self::first_meta_value($post_id, array(self::META_CANONICAL, '_yoast_wpseo_canonical', 'rank_math_canonical_url')));
        return $canonical !== '' ? $canonical : (string) get_permalink($post_id);
    }

    private static function robots_content($post_id) {
        $robots = array();
        $robots[] = get_post_meta($post_id, self::META_ROBOTS_NOINDEX, true) === '1' ? 'noindex' : 'index';
        $robots[] = get_post_meta($post_id, self::META_ROBOTS_NOFOLLOW, true) === '1' ? 'nofollow' : 'follow';
        $robots[] = 'max-snippet:-1';
        $robots[] = 'max-image-preview:large';
        $robots[] = 'max-video-preview:-1';
        return implode(', ', $robots);
    }

    private static function get_social_title($post_id) {
        $social_title = trim((string) get_post_meta($post_id, self::META_SOCIAL_TITLE, true));
        return $social_title !== '' ? $social_title : self::get_meta_title($post_id);
    }

    private static function get_social_description($post_id) {
        $social_description = trim((string) get_post_meta($post_id, self::META_SOCIAL_DESCRIPTION, true));
        return $social_description !== '' ? $social_description : self::get_meta_description($post_id);
    }

    private static function get_social_image($post_id) {
        $social_image = trim((string) get_post_meta($post_id, self::META_SOCIAL_IMAGE, true));
        if ($social_image !== '') {
            return $social_image;
        }
        $featured = get_the_post_thumbnail_url($post_id, 'full');
        return $featured ? $featured : '';
    }

    public static function maybe_use_custom_template($template) {
        if (!is_singular(array('page', 'post'))) {
            return $template;
        }

        $post_id = get_queried_object_id();
        if (!$post_id || get_post_meta($post_id, self::META_ENABLED, true) !== '1') {
            return $template;
        }
        if (!self::has_custom_render_payload($post_id)) {
            return $template;
        }

        $custom_template = plugin_dir_path(__FILE__) . 'templates/render.php';
        return file_exists($custom_template) ? $custom_template : $template;
    }

    /**
     * Retrieve all Elementor templates available on the site.
     *
     * Supports Elementor Library (elementor_library) and Elementor Header &
     * Footer Builder plugin (elementor-hf).
     *
     * @param string $type Desired template type ('header' or 'footer').
     * @return array Associative array of template data keyed by template ID.
     */
    public static function get_elementor_templates($type = 'header') {
        $templates = array();

        // 1. Elementor Library (elementor_library)
        $posts = get_posts(array(
            'post_type'        => 'elementor_library',
            'posts_per_page'   => -1,
            'post_status'      => array('publish', 'private'),
            'orderby'          => 'title',
            'order'            => 'ASC',
            'suppress_filters' => false,
        ));

        if (!empty($posts) && is_array($posts)) {
            foreach ($posts as $post) {
                $template_type = (string) get_post_meta($post->ID, '_elementor_template_type', true);
                $title = $post->post_title ? $post->post_title : sprintf(__('Template #%d', 'custom-web-render'), $post->ID);
                $type_label = $template_type ? ucfirst(str_replace(array('_', '-'), ' ', $template_type)) : __('Library', 'custom-web-render');

                $is_matched = false;
                if ($type === 'header' && in_array($template_type, array('header', 'section', 'container'), true)) {
                    $is_matched = true;
                } elseif ($type === 'footer' && in_array($template_type, array('footer', 'section', 'container'), true)) {
                    $is_matched = true;
                }

                $templates[$post->ID] = array(
                    'id'         => $post->ID,
                    'title'      => $title . ' [' . $type_label . ']',
                    'raw_title'  => $title,
                    'type'       => $template_type,
                    'source'     => 'elementor_library',
                    'is_matched' => $is_matched,
                );
            }
        }

        // 2. Elementor Header & Footer Builder plugin (elementor-hf)
        $hf_posts = get_posts(array(
            'post_type'        => 'elementor-hf',
            'posts_per_page'   => -1,
            'post_status'      => array('publish', 'private'),
            'orderby'          => 'title',
            'order'            => 'ASC',
            'suppress_filters' => false,
        ));

        if (!empty($hf_posts) && is_array($hf_posts)) {
            foreach ($hf_posts as $post) {
                $hf_type = (string) get_post_meta($post->ID, 'ehf_template_type', true);
                $title = $post->post_title ? $post->post_title : sprintf(__('Template #%d', 'custom-web-render'), $post->ID);
                $type_label = $hf_type ? ucfirst(str_replace(array('type_', '_'), ' ', $hf_type)) : 'EHF';

                $is_matched = false;
                if ($type === 'header' && strpos($hf_type, 'header') !== false) {
                    $is_matched = true;
                } elseif ($type === 'footer' && strpos($hf_type, 'footer') !== false) {
                    $is_matched = true;
                }

                $templates[$post->ID] = array(
                    'id'         => $post->ID,
                    'title'      => $title . ' [' . $type_label . ']',
                    'raw_title'  => $title,
                    'type'       => $hf_type,
                    'source'     => 'elementor-hf',
                    'is_matched' => $is_matched,
                );
            }
        }

        return $templates;
    }

    /**
     * Check if Elementor Pro Theme Builder or Elementor Header & Footer
     * Builder has an active template assigned to this location.
     *
     * @param string $location 'header' or 'footer'
     * @return int Template post ID or 0
     */
    public static function detect_active_elementor_theme_location($location = 'header') {
        // Elementor Pro Theme Builder locations manager
        if (class_exists('\ElementorPro\Modules\ThemeBuilder\Module')) {
            try {
                $locations_manager = \ElementorPro\Modules\ThemeBuilder\Module::instance()->get_locations_manager();
                if ($locations_manager && method_exists($locations_manager, 'get_location_templates')) {
                    $templates = $locations_manager->get_location_templates($location);
                    if (!empty($templates) && is_array($templates)) {
                        $first = reset($templates);
                        if ($first) {
                            return absint($first);
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Ignore gracefully.
            }
        }

        // Elementor Header & Footer Builder (HFE)
        if ($location === 'header' && function_exists('hfe_get_header_id')) {
            $hfe_id = hfe_get_header_id();
            if ($hfe_id) {
                return absint($hfe_id);
            }
        }
        if ($location === 'footer' && function_exists('hfe_get_footer_id')) {
            $hfe_id = hfe_get_footer_id();
            if ($hfe_id) {
                return absint($hfe_id);
            }
        }

        return 0;
    }

    /**
     * Safely render an Elementor template by ID.
     *
     * Guards against recursion, restores global $post, collects compiled
     * post CSS and global styles, and injects needed assets.
     *
     * @param int $template_id
     * @param int $current_post_id
     * @return array array('html' => string, 'css' => string, 'head' => string, 'js' => string)
     */
    public static function render_elementor_template($template_id, $current_post_id = 0) {
        $template_id = absint($template_id);
        if (!$template_id) {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        // Prevent recursion
        if ($current_post_id && $template_id === $current_post_id) {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        $template_post = get_post($template_id);
        if (!$template_post || !in_array($template_post->post_status, array('publish', 'private'), true)) {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        $html = '';
        $css = '';
        $head = '';
        $js = '';

        global $post;
        $prev_post = $post;

        try {
            if (class_exists('\Elementor\Plugin')) {
                $elementor = \Elementor\Plugin::instance();

                if (isset($elementor->frontend)) {
                    $html = $elementor->frontend->get_builder_content_for_display($template_id, true);
                }

                // Compiled Post CSS
                if (class_exists('\Elementor\Core\Files\CSS\Post')) {
                    $post_css_file = new \Elementor\Core\Files\CSS\Post($template_id);
                    $template_css = $post_css_file->get_content();
                    if (!empty($template_css)) {
                        $css .= "\n/* Elementor Template #{$template_id} CSS */\n" . $template_css;
                    }
                    $css_url = $post_css_file->get_url();
                    if (!empty($css_url)) {
                        $head .= '<link rel="stylesheet" href="' . esc_url($css_url) . '">' . "\n";
                    }
                }

                // Global Elementor CSS
                if (class_exists('\Elementor\Core\Files\CSS\Global_CSS')) {
                    $global_css_file = new \Elementor\Core\Files\CSS\Global_CSS();
                    $global_css = $global_css_file->get_content();
                    if (!empty($global_css)) {
                        $css .= "\n/* Elementor Global CSS */\n" . $global_css;
                    }
                }

                // Elementor core frontend CSS
                if (defined('ELEMENTOR_ASSETS_URL')) {
                    $head .= '<link rel="stylesheet" href="' . esc_url(ELEMENTOR_ASSETS_URL . 'css/frontend.min.css') . '">' . "\n";
                }
            } else {
                $html = apply_filters('the_content', $template_post->post_content);
            }
        } catch (\Throwable $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Custom Web Render: Elementor render error: ' . $e->getMessage());
            }
            $html = '';
        }

        $post = $prev_post;
        if ($post instanceof \WP_Post) {
            setup_postdata($post);
        }

        return array(
            'html' => trim((string) $html),
            'css'  => trim((string) $css),
            'head' => trim((string) $head),
            'js'   => trim((string) $js),
        );
    }

    /**
     * Resolve the active theme or live landing-page section (header/footer).
     *
     * @param string $type 'header' or 'footer'
     * @return array
     */
    public static function resolve_theme_or_extracted_section($type = 'header') {
        // 1. Check if Elementor Pro Theme Builder or HFE has an active template
        $active_elementor_id = self::detect_active_elementor_theme_location($type);
        if ($active_elementor_id) {
            $rendered = self::render_elementor_template($active_elementor_id);
            if (!empty($rendered['html'])) {
                return $rendered;
            }
        }

        // 2. Use extracted landing-page design
        $design = self::get_design_extract();
        $html = isset($design[$type]) ? $design[$type] : '';
        $head = '';
        $css = '';

        if (!empty($design['fonts']['google_font_links']) && is_array($design['fonts']['google_font_links'])) {
            foreach ($design['fonts']['google_font_links'] as $link) {
                $head .= '<link rel="stylesheet" href="' . esc_url($link) . '">' . "\n";
            }
        }

        return array(
            'html' => trim((string) $html),
            'css'  => $css,
            'head' => $head,
            'js'   => '',
        );
    }

    /**
     * Resolve the header payload for a given post.
     *
     * @param int $post_id
     * @return array
     */
    public static function resolve_header($post_id) {
        $use_header = get_post_meta($post_id, self::META_USE_HEADER, true) === '1';
        if (!$use_header) {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        $header_type = get_post_meta($post_id, self::META_HEADER_TYPE, true);
        if (empty($header_type) || $header_type === 'global') {
            $header_type = get_option(self::OPTION_HEADER_TYPE, 'custom');
        }

        if ($header_type === 'none') {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        if ($header_type === 'elementor') {
            $template_id = (int) get_post_meta($post_id, self::META_HEADER_ELEMENTOR_ID, true);
            if (!$template_id) {
                $template_id = (int) get_option(self::OPTION_HEADER_ELEMENTOR_ID, 0);
            }
            if ($template_id) {
                $rendered = self::render_elementor_template($template_id, $post_id);
                if (!empty($rendered['html'])) {
                    return $rendered;
                }
            }
            // Fallback to custom code if template ID is empty or failed
            return array(
                'html' => (string) get_option(self::OPTION_HEADER, ''),
                'css'  => '',
                'head' => '',
                'js'   => '',
            );
        }

        if ($header_type === 'theme' || $header_type === 'extracted') {
            return self::resolve_theme_or_extracted_section('header');
        }

        // Default 'custom'
        return array(
            'html' => (string) get_option(self::OPTION_HEADER, ''),
            'css'  => '',
            'head' => '',
            'js'   => '',
        );
    }

    /**
     * Resolve the footer payload for a given post.
     *
     * @param int $post_id
     * @return array
     */
    public static function resolve_footer($post_id) {
        $use_footer = get_post_meta($post_id, self::META_USE_FOOTER, true) === '1';
        if (!$use_footer) {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        $footer_type = get_post_meta($post_id, self::META_FOOTER_TYPE, true);
        if (empty($footer_type) || $footer_type === 'global') {
            $footer_type = get_option(self::OPTION_FOOTER_TYPE, 'custom');
        }

        if ($footer_type === 'none') {
            return array('html' => '', 'css' => '', 'head' => '', 'js' => '');
        }

        if ($footer_type === 'elementor') {
            $template_id = (int) get_post_meta($post_id, self::META_FOOTER_ELEMENTOR_ID, true);
            if (!$template_id) {
                $template_id = (int) get_option(self::OPTION_FOOTER_ELEMENTOR_ID, 0);
            }
            if ($template_id) {
                $rendered = self::render_elementor_template($template_id, $post_id);
                if (!empty($rendered['html'])) {
                    return $rendered;
                }
            }
            // Fallback to custom code if template ID is empty or failed
            return array(
                'html' => (string) get_option(self::OPTION_FOOTER, ''),
                'css'  => '',
                'head' => '',
                'js'   => '',
            );
        }

        if ($footer_type === 'theme' || $footer_type === 'extracted') {
            return self::resolve_theme_or_extracted_section('footer');
        }

        // Default 'custom'
        return array(
            'html' => (string) get_option(self::OPTION_FOOTER, ''),
            'css'  => '',
            'head' => '',
            'js'   => '',
        );
    }

    /**
     * Human-friendly label for header/footer source type.
     *
     * @param string $source
     * @return string
     */
    public static function get_source_label($source) {
        $labels = array(
            'custom'    => __('Custom Code', 'custom-web-render'),
            'elementor' => __('Elementor Template', 'custom-web-render'),
            'theme'     => __('Existing Site / Theme', 'custom-web-render'),
            'extracted' => __('Live Extracted', 'custom-web-render'),
            'none'      => __('None', 'custom-web-render'),
        );
        return isset($labels[$source]) ? $labels[$source] : ucfirst((string) $source);
    }

    /**
     * AJAX handler: Set an extracted section (header/footer) as the Global Code.
     */
    public static function ajax_set_design_global() {
        check_ajax_referer('cwr_design_action', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied.', 'custom-web-render')));
        }

        $section = isset($_POST['section']) ? sanitize_key($_POST['section']) : '';
        $design = self::get_design_extract();

        if ($section === 'header') {
            $code = isset($design['header']) ? $design['header'] : '';
            if (empty($code)) {
                wp_send_json_error(array('message' => __('No extracted header code found.', 'custom-web-render')));
            }
            update_option(self::OPTION_HEADER, $code);
            update_option(self::OPTION_HEADER_TYPE, 'custom');
            wp_send_json_success(array('message' => __('Extracted header saved as Global Header Code!', 'custom-web-render')));
        } elseif ($section === 'footer') {
            $code = isset($design['footer']) ? $design['footer'] : '';
            if (empty($code)) {
                wp_send_json_error(array('message' => __('No extracted footer code found.', 'custom-web-render')));
            }
            update_option(self::OPTION_FOOTER, $code);
            update_option(self::OPTION_FOOTER_TYPE, 'custom');
            wp_send_json_success(array('message' => __('Extracted footer saved as Global Footer Code!', 'custom-web-render')));
        }

        wp_send_json_error(array('message' => __('Invalid section requested.', 'custom-web-render')));
    }

    /**
     * AJAX handler: Fetch rendered HTML and CSS for an Elementor template.
     */
    public static function ajax_get_elementor_code() {
        check_ajax_referer('cwr_elementor_action', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied.', 'custom-web-render')));
        }

        $template_id = isset($_POST['template_id']) ? absint($_POST['template_id']) : 0;
        if (!$template_id) {
            wp_send_json_error(array('message' => __('Please select an Elementor template first.', 'custom-web-render')));
        }

        $rendered = self::render_elementor_template($template_id);
        if (empty($rendered['html'])) {
            wp_send_json_error(array('message' => __('Could not render Elementor template content.', 'custom-web-render')));
        }

        wp_send_json_success(array(
            'html' => $rendered['html'],
            'css'  => $rendered['css'],
        ));
    }

    /**
     * AJAX handler: Fetch extracted landing page header or footer HTML.
     */
    public static function ajax_get_existing_site_code() {
        check_ajax_referer('cwr_design_action', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied.', 'custom-web-render')));
        }

        $section = isset($_POST['section']) ? sanitize_key($_POST['section']) : 'header';
        $design = self::get_design_extract();
        $code = isset($design[$section]) ? $design[$section] : '';

        if (empty($code)) {
            wp_send_json_error(array('message' => sprintf(__('No extracted %s found on the live homepage.', 'custom-web-render'), $section)));
        }

        wp_send_json_success(array(
            'html' => $code,
        ));
    }

    public static function render_custom_page($post_id) {
        if (!$post_id || get_post_meta($post_id, self::META_ENABLED, true) !== '1') {
            return;
        }
        if (!self::has_custom_render_payload($post_id)) {
            wp_safe_redirect(get_permalink($post_id));
            exit;
        }

        status_header(200);
        nocache_headers();

        $html = (string) get_post_meta($post_id, self::META_HTML, true);
        $css = (string) get_post_meta($post_id, self::META_CSS, true);
        $js = (string) get_post_meta($post_id, self::META_JS, true);
        $head = (string) get_option(self::OPTION_HEAD, '');

        $header_bundle = self::resolve_header($post_id);
        $footer_bundle = self::resolve_footer($post_id);

        $header = $header_bundle['html'];
        $footer = $footer_bundle['html'];

        if (!empty($header_bundle['head'])) {
            $head = $header_bundle['head'] . "\n" . $head;
        }
        if (!empty($footer_bundle['head'])) {
            $head = $footer_bundle['head'] . "\n" . $head;
        }
        if (!empty($header_bundle['css'])) {
            $css = $header_bundle['css'] . "\n" . $css;
        }
        if (!empty($footer_bundle['css'])) {
            $css = $footer_bundle['css'] . "\n" . $css;
        }
        if (!empty($header_bundle['js'])) {
            $js = $header_bundle['js'] . "\n" . $js;
        }
        if (!empty($footer_bundle['js'])) {
            $js = $footer_bundle['js'] . "\n" . $js;
        }

        $meta_title = self::get_meta_title($post_id);
        $meta_description = self::get_meta_description($post_id);
        $fallback_title = (string) get_the_title($post_id);

        echo self::build_frontend_document($post_id, $html, $css, $js, $header, $footer, $head, $meta_title, $meta_description, $fallback_title); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        exit;
    }

    private static function has_custom_render_payload($post_id) {
        $html = trim((string) get_post_meta($post_id, self::META_HTML, true));
        $header_bundle = self::resolve_header($post_id);
        $footer_bundle = self::resolve_footer($post_id);

        return $html !== '' || trim($header_bundle['html']) !== '' || trim($footer_bundle['html']) !== '';
    }

    private static function build_frontend_document($post_id, $html, $css, $js, $header, $footer, $head, $meta_title, $meta_description, $fallback_title) {
        $style = trim($css) !== '' ? "\n<style>\n" . $css . "\n</style>\n" : '';
        $script = trim($js) !== '' ? "\n<script>\n" . $js . "\n</script>\n" : '';
        $has_full_document = preg_match('/<(?:!doctype|html)\b/i', $html);

        if ($has_full_document) {
            $document = $html;
            $document = self::apply_seo_to_document($post_id, $document, $meta_title, $meta_description, $fallback_title);
            $document = self::inject_before_closing_tag($document, 'head', $head . $style);
            $document = self::inject_after_opening_body($document, $header);
            $document = self::inject_before_closing_tag($document, 'body', $footer . $script);
            return $document;
        }

        $charset = esc_attr(get_bloginfo('charset'));
        $language_attributes = get_language_attributes();
        $document_title = trim($meta_title) !== '' ? $meta_title : $fallback_title;
        $seo_head = self::build_seo_head($post_id, $document_title, $meta_description);

        return '<!doctype html>' . "\n"
            . '<html ' . $language_attributes . '>' . "\n"
            . '<head>' . "\n"
            . '<meta charset="' . $charset . '">' . "\n"
            . '<meta name="viewport" content="width=device-width, initial-scale=1">' . "\n"
            . $seo_head
            . $head . "\n"
            . $style
            . '</head>' . "\n"
            . '<body>' . "\n"
            . $header . "\n"
            . $html . "\n"
            . $footer . "\n"
            . $script
            . '</body>' . "\n"
            . '</html>';
    }

    private static function apply_seo_to_document($post_id, $document, $meta_title, $meta_description, $fallback_title) {
        $title = trim($meta_title) !== '' ? $meta_title : $fallback_title;
        $has_title = preg_match('/<title\b[^>]*>.*?<\/title>/is', $document);

        if (trim($meta_title) !== '') {
            $document = preg_replace('/<title\b[^>]*>.*?<\/title>/is', '', $document);
            $has_title = false;
        }

        if (trim($meta_description) !== '') {
            $document = preg_replace('/<meta\b(?=[^>]*\bname\s*=\s*(["\'])description\1)[^>]*>/i', '', $document);
        }

        $seo_head = '';
        if (!$has_title && trim($title) !== '') {
            $seo_head .= '<title>' . esc_html($title) . '</title>' . "\n";
        }
        $seo_head .= self::build_seo_head($post_id, '', $meta_description, false);

        return self::inject_before_closing_tag($document, 'head', $seo_head);
    }

    private static function build_seo_head($post_id, $title, $description, $include_title = true) {
        $head = '';
        if ($include_title && trim($title) !== '') {
            $head .= '<title>' . esc_html($title) . '</title>' . "\n";
        }
        if (trim($description) !== '') {
            $head .= '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        }
        if ($post_id) {
            $head .= self::build_extended_seo_head($post_id, $title, $description);
        }
        return $head;
    }

    public static function filter_document_title($title) {
        if (!is_singular(array('page', 'post'))) {
            return $title;
        }

        $meta_title = self::get_meta_title(get_queried_object_id());
        return trim($meta_title) !== '' ? $meta_title : $title;
    }

    public static function output_seo_tags() {
        if (!is_singular(array('page', 'post')) || self::has_known_seo_plugin()) {
            return;
        }

        $post_id = get_queried_object_id();
        $title = self::get_meta_title($post_id);
        $description = self::get_meta_description(get_queried_object_id());
        echo self::build_seo_head($post_id, $title, $description, false); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    private static function build_extended_seo_head($post_id, $title, $description) {
        $post = get_post($post_id);
        if (!$post) {
            return '';
        }

        $url = self::get_canonical_url($post_id);
        $title = trim((string) $title) !== '' ? $title : (self::get_meta_title($post_id) ?: get_the_title($post_id));
        $description = trim((string) $description) !== '' ? $description : self::get_meta_description($post_id);
        $social_title = self::get_social_title($post_id);
        $social_description = self::get_social_description($post_id);
        $social_image = self::get_social_image($post_id);
        $head = '';

        $head .= '<link rel="canonical" href="' . esc_url($url) . '">' . "\n";
        $head .= '<meta name="robots" content="' . esc_attr(self::robots_content($post_id)) . '">' . "\n";
        $head .= '<meta property="og:type" content="' . ($post->post_type === 'post' ? 'article' : 'website') . '">' . "\n";
        $head .= '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        if (trim($social_title) !== '' || trim($title) !== '') {
            $head .= '<meta property="og:title" content="' . esc_attr($social_title !== '' ? $social_title : $title) . '">' . "\n";
            $head .= '<meta name="twitter:title" content="' . esc_attr($social_title !== '' ? $social_title : $title) . '">' . "\n";
        }
        if (trim($social_description) !== '' || trim($description) !== '') {
            $head .= '<meta property="og:description" content="' . esc_attr($social_description !== '' ? $social_description : $description) . '">' . "\n";
            $head .= '<meta name="twitter:description" content="' . esc_attr($social_description !== '' ? $social_description : $description) . '">' . "\n";
        }
        if (trim($social_image) !== '') {
            $head .= '<meta property="og:image" content="' . esc_url($social_image) . '">' . "\n";
            $head .= '<meta name="twitter:image" content="' . esc_url($social_image) . '">' . "\n";
            $head .= '<meta name="twitter:card" content="summary_large_image">' . "\n";
        } else {
            $head .= '<meta name="twitter:card" content="summary">' . "\n";
        }

        $schema = self::build_schema_graph($post_id, $title, $description, $url, $social_image);
        if ($schema) {
            $head .= '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
        }

        return $head;
    }

    private static function build_schema_graph($post_id, $title, $description, $url, $image) {
        $schema_type = self::normalize_schema_type(get_post_meta($post_id, self::META_SCHEMA_TYPE, true));
        if ($schema_type === 'none') {
            return null;
        }

        $post = get_post($post_id);
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => $schema_type,
            'mainEntityOfPage' => array(
                '@type' => 'WebPage',
                '@id' => $url,
            ),
            'headline' => $title,
            'description' => $description,
            'url' => $url,
            'datePublished' => get_post_time(DATE_ATOM, false, $post),
            'dateModified' => get_post_modified_time(DATE_ATOM, false, $post),
            'author' => array(
                '@type' => 'Person',
                'name' => get_the_author_meta('display_name', $post->post_author),
            ),
            'publisher' => array(
                '@type' => 'Organization',
                'name' => get_bloginfo('name'),
                'url' => home_url('/'),
            ),
        );
        if ($image) {
            $schema['image'] = array($image);
        }
        return array_filter($schema);
    }

    private static function has_known_seo_plugin() {
        return defined('WPSEO_VERSION')
            || defined('RANK_MATH_VERSION')
            || defined('SEOPRESS_VERSION');
    }

    public static function get_meta_title($post_id) {
        return self::first_meta_value(
            $post_id,
            array(self::META_TITLE, '_yoast_wpseo_title', 'rank_math_title', '_seopress_titles_title')
        );
    }

    public static function get_meta_description($post_id) {
        return self::first_meta_value(
            $post_id,
            array(self::META_DESCRIPTION, '_yoast_wpseo_metadesc', 'rank_math_description', '_seopress_titles_desc')
        );
    }

    private static function first_meta_value($post_id, $keys) {
        foreach ($keys as $key) {
            $value = (string) get_post_meta($post_id, $key, true);
            if (trim($value) !== '') {
                return $value;
            }
        }
        return '';
    }

    private static function inject_after_opening_body($document, $injection) {
        if (trim($injection) === '') {
            return $document;
        }

        $updated = preg_replace_callback(
            '/(<body\b[^>]*>)/i',
            function ($matches) use ($injection) {
                return $matches[1] . $injection;
            },
            $document,
            1,
            $count
        );
        if ($count > 0) {
            return $updated;
        }

        return $injection . $document;
    }

    private static function inject_before_closing_tag($document, $tag, $injection) {
        if (trim($injection) === '') {
            return $document;
        }

        $pattern = '/(<\/' . preg_quote($tag, '/') . '>)/i';
        $updated = preg_replace_callback(
            $pattern,
            function ($matches) use ($injection) {
                return $injection . $matches[1];
            },
            $document,
            1,
            $count
        );
        if ($count > 0) {
            return $updated;
        }

        return $document . $injection;
    }
}

require_once plugin_dir_path(__FILE__) . 'includes/class-cwr-mcp-server.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-quasar-connector.php';

/**
 * Combined activation — runs both the Custom Web Render and the Quasar
 * Schema activators, restores any posts hidden during deactivation,
 * and sends the approval email to team quasara.
 */
function quasar_addons_activate() {
    // Custom Web Render activation.
    Custom_Web_Render::activate();

    // Restore any posts/pages that were set to draft on deactivation.
    $hidden_posts = get_posts(array(
        'post_type'   => array('page', 'post'),
        'post_status' => 'draft',
        'numberposts' => -1,
        'meta_query'  => array(
            array(
                'key'     => Custom_Web_Render::META_PRE_DEACTIVATION_STATUS,
                'compare' => 'EXISTS',
            ),
        ),
    ));
    if (!empty($hidden_posts) && is_array($hidden_posts)) {
        foreach ($hidden_posts as $p) {
            $orig_status = get_post_meta($p->ID, Custom_Web_Render::META_PRE_DEACTIVATION_STATUS, true);
            if ($orig_status && in_array($orig_status, array('publish', 'pending', 'private', 'future'), true)) {
                wp_update_post(array(
                    'ID'          => $p->ID,
                    'post_status' => $orig_status,
                ));
            }
            delete_post_meta($p->ID, Custom_Web_Render::META_PRE_DEACTIVATION_STATUS);
        }
    }
    delete_option(Custom_Web_Render::OPTION_DEACTIVATED_POSTS);

    // Quasar Schema activation (approval email, cron, default options).
    if (class_exists('Quasar_Activator')) {
        Quasar_Activator::activate();
    }

    // Dashboard connection token. Kept across later deactivations.
    if (function_exists('quasar_connector_activate')) {
        quasar_connector_activate();
    }

    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'quasar_addons_activate');

/**
 * Combined deactivation — runs both deactivators.
 * Safely hides all custom-rendered pages and posts (sets them to Draft)
 * so visitors and search engines never see broken, unstyled fallback theme layouts.
 */
function quasar_addons_deactivate() {
    // Hide generated / custom render posts so visitors do not see broken fallback theme layouts.
    $hide_on_deactivate = get_option(Custom_Web_Render::OPTION_HIDE_ON_DEACTIVATE, '1');
    if ($hide_on_deactivate !== '0') {
        $render_posts = get_posts(array(
            'post_type'   => array('page', 'post'),
            'post_status' => array('publish', 'pending', 'private', 'future'),
            'numberposts' => -1,
            'meta_query'  => array(
                array(
                    'key'   => Custom_Web_Render::META_ENABLED,
                    'value' => '1',
                ),
            ),
        ));
        $deactivated_ids = array();
        if (!empty($render_posts) && is_array($render_posts)) {
            foreach ($render_posts as $p) {
                update_post_meta($p->ID, Custom_Web_Render::META_PRE_DEACTIVATION_STATUS, $p->post_status);
                wp_update_post(array(
                    'ID'          => $p->ID,
                    'post_status' => 'draft',
                ));
                $deactivated_ids[] = $p->ID;
            }
        }
        update_option(Custom_Web_Render::OPTION_DEACTIVATED_POSTS, $deactivated_ids, false);
    }

    if (class_exists('Quasar_Activator')) {
        Quasar_Activator::deactivate();
    }

    // Leave quasar_connection_token in place so the site stays linked to the
    // Quasar dashboard. Disconnect from the plugin settings to drop the link.
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'quasar_addons_deactivate');

/**
 * Boot both systems.
 */
function quasar_addons_boot() {
    // Boot the Custom Web Render system.
    Custom_Web_Render::init();
    Custom_Web_Render_MCP::init();

    // Boot the QuasarAISEO Schema system.
    if (function_exists('quasar_boot')) {
        quasar_boot();
    }
}
add_action('plugins_loaded', 'quasar_addons_boot');
