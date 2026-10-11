<?php
/**
 * Cleanup for QuasarAISEO Addons Pack.
 *
 * Removes all data for both the Custom Web Render system and the
 * QuasarAISEO Schema system when the plugin is deleted.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

/**
 * Preserve all data by default so a delete + reinstall can recover
 * existing page/post renders, SEO metadata, schema, and settings.
 *
 * Sites that intentionally want a destructive uninstall can define this in
 * wp-config.php before deleting the plugin:
 *
 * define('CWR_DELETE_DATA_ON_UNINSTALL', true);
 */
if (!defined('CWR_DELETE_DATA_ON_UNINSTALL') || !CWR_DELETE_DATA_ON_UNINSTALL) {
    return;
}

// Custom Web Render + MCP options.
$cwr_options = array(
    'cwr_global_header_code',
    'cwr_global_header_type',
    'cwr_global_header_elementor_id',
    'cwr_global_footer_code',
    'cwr_global_footer_type',
    'cwr_global_footer_elementor_id',
    'cwr_global_head_code',
    'cwr_openrouter_api_key',
    'cwr_openrouter_model',
    'cwr_openrouter_system_prompt',
    'cwr_openrouter_models',
    'cwr_mcp_enabled',
    'cwr_mcp_tokens',
    'cwr_mcp_audit_log',
);

// QuasarAISEO Schema options.
$quasar_options = array(
    'quasar_settings',
    'quasar_reviews',
    'quasar_approval',
    'quasar_connection_token',
    'quasar_connection_status',
    'quasar_app_password',
    'quasar_app_password_id',
    'quasar_user_id',
    'quasar_global_header',
    'quasar_global_footer',
    'quasar_global_head',
);

foreach (array_merge($cwr_options, $quasar_options) as $option) {
    delete_option($option);
}

// Quasar transients.
delete_transient('quasar_openai_models');

// Clear scheduled cron events.
wp_clear_scheduled_hook('quasar_generate_schema');

// Custom Web Render post meta.
$cwr_meta_keys = array(
    '_cwr_enabled',
    '_cwr_html',
    '_cwr_css',
    '_cwr_js',
    '_cwr_use_global_header',
    '_cwr_header_type',
    '_cwr_header_elementor_id',
    '_cwr_use_global_footer',
    '_cwr_footer_type',
    '_cwr_footer_elementor_id',
    '_cwr_meta_title',
    '_cwr_meta_description',
    '_cwr_focus_keyword',
    '_cwr_canonical_url',
    '_cwr_robots_noindex',
    '_cwr_robots_nofollow',
    '_cwr_schema_type',
    '_cwr_social_title',
    '_cwr_social_description',
    '_cwr_social_image',
    '_cwr_seo_analysis',
    '_cwr_seo_score',
    '_cwr_seo_issues',
);

// Quasar Schema post meta.
$quasar_meta_keys = array(
    '_quasar_schema',
    '_quasar_schema_types',
    '_quasar_schema_statuses',
    '_quasar_schema_status',
    '_quasar_schema_updated',
    '_quasar_schema_error',
    '_quasar_faq_title_override',
);

foreach (array_merge($cwr_meta_keys, $quasar_meta_keys) as $key) {
    delete_post_meta_by_key($key);
}
