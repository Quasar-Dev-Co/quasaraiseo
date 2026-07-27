<?php
/**
 * Plugin Name: Quasar AI SEO Assistant
 * Description: Connect your WordPress site with Quasar AI SEO to publish AI-generated content directly from your Quasar dashboard.
 * Version: 1.0.0
 * Author: Quasar AI SEO
 * Author URI: https://seo.quasarasoft.com
 * License: GPL-2.0+
 * Text Domain: quasar-ai-seo-assistant
 */

if (!defined('ABSPATH')) {
    exit;
}

define('QUASAR_VERSION', '1.0.0');
define('QUASAR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('QUASAR_PLUGIN_URL', plugin_dir_url(__FILE__));
define('QUASAR_API_URL', 'https://seo.teamcmp.cloud');
define('QUASAR_FRONTEND_URL', 'https://seo.quasarasoft.com');

require_once QUASAR_PLUGIN_DIR . 'includes/class-quasar-core.php';
require_once QUASAR_PLUGIN_DIR . 'includes/class-quasar-rest.php';
require_once QUASAR_PLUGIN_DIR . 'includes/class-quasar-admin.php';

Quasar_Core::get_instance();
Quasar_REST::get_instance();
Quasar_Admin::get_instance();
