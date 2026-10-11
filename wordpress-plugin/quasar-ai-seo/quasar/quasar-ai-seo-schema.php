<?php
/**
 * QuasarAISEO Schema module — AI-powered JSON-LD schema generator.
 *
 * This file is loaded by the QuasarAISEO Addons Pack main plugin file.
 * It is not a standalone plugin; it runs as a module inside the combined
 * plugin. The activation/deactivation hooks are handled by the parent
 * plugin file.
 *
 * @package QuasarAISEO_Addons_Pack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'QUASAR_VERSION' ) ) {
	define( 'QUASAR_VERSION', '1.0.0' );
}
if ( ! defined( 'QUASAR_PATH' ) ) {
	define( 'QUASAR_PATH', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'QUASAR_URL' ) ) {
	define( 'QUASAR_URL', plugin_dir_url( __FILE__ ) );
}
if ( ! defined( 'QUASAR_BASENAME' ) ) {
	define( 'QUASAR_BASENAME', 'quasar-ai-seo/quasar/quasar-ai-seo-schema.php' );
}
if ( ! defined( 'QUASAR_OPTION' ) ) {
	define( 'QUASAR_OPTION', 'quasar_settings' );
}
if ( ! defined( 'QUASAR_REVIEWS_OPTION' ) ) {
	define( 'QUASAR_REVIEWS_OPTION', 'quasar_reviews' );
}
if ( ! defined( 'QUASAR_APPROVAL_OPTION' ) ) {
	define( 'QUASAR_APPROVAL_OPTION', 'quasar_approval' );
}
if ( ! defined( 'QUASAR_CRON_HOOK' ) ) {
	define( 'QUASAR_CRON_HOOK', 'quasar_generate_schema' );
}
if ( ! defined( 'QUASAR_REST_NAMESPACE' ) ) {
	define( 'QUASAR_REST_NAMESPACE', 'quasar-ai-seo/v1' );
}

require_once QUASAR_PATH . 'includes/class-quasar-constants.php';

/**
 * Autoloader for plugin classes.
 */
spl_autoload_register(
	function ( $class ) {
		if ( strpos( $class, 'Quasar_' ) !== 0 ) {
			return;
		}
		$file = 'class-' . str_replace( '_', '-', strtolower( $class ) ) . '.php';
		$path = QUASAR_PATH . 'includes/' . $file;
		if ( file_exists( $path ) ) {
			require_once $path;
		}
	}
);

/**
 * Boot the plugin.
 */
function quasar_boot() {
	require_once QUASAR_PATH . 'includes/class-quasar-activator.php';

	// Internationalization.
	Quasar_I18n::init();

	// Approval REST endpoint + admin notices.
	Quasar_Approvals::init();

	// Settings page.
	Quasar_Settings::init();

	// Reviews data layer.
	Quasar_Reviews::init();

	// OpenAI client + generators.
	Quasar_OpenAI_Client::init();
	Quasar_Schema_Generator::init();
	Quasar_Post_Handler::init();

	// Output + meta box.
	Quasar_Schema_Output::init();
	Quasar_Meta_Box::init();

	// Frontend FAQ display.
	Quasar_FAQ_Display::init();

	// Logger (loaded on demand).
	Quasar_Logger::init();

	// Admin assets.
	add_action( 'admin_enqueue_scripts', 'quasar_admin_assets' );
}

// Boot is called by the parent plugin (quasar-ai-seo-addons-pack.php)
// via quasar_boot() after both systems are loaded. The activation and
// deactivation hooks are also handled by the parent plugin.

/**
 * Enqueue admin assets on all admin pages.
 *
 * The JS uses delegated event handlers ($(document).on('click',...)) so it
 * is harmless on pages where the plugin's elements don't exist. Loading on
 * all pages avoids issues with the block editor hook detection.
 *
 * @param string $hook Current admin page hook suffix.
 */
function quasar_admin_assets( $hook ) {
	wp_enqueue_style(
		'quasar-admin',
		QUASAR_URL . 'admin/css/admin.css',
		array(),
		QUASAR_VERSION
	);
	wp_enqueue_script(
		'quasar-admin',
		QUASAR_URL . 'admin/js/admin.js',
		array( 'jquery', 'wp-util' ),
		QUASAR_VERSION,
		true
	);
	wp_enqueue_media();

	wp_localize_script(
		'quasar-admin',
		'quasarAdmin',
		array(
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'quasar_admin_nonce' ),
			'i18n'    => array(
				'regenerating'  => __( 'Regenerating schema with AI...', 'quasar-ai-seo' ),
				'saved'         => __( 'Schema saved.', 'quasar-ai-seo' ),
				'deleted'       => __( 'Schema deleted.', 'quasar-ai-seo' ),
				'confirmDelete' => __( 'Delete the schema for this post?', 'quasar-ai-seo' ),
				'error'         => __( 'Request failed. Please try again.', 'quasar-ai-seo' ),
			),
		)
	);
}

/**
 * Helper: is this site approved?
 *
 * @return bool
 */
function quasar_is_approved() {
	$approval = get_option( QUASAR_APPROVAL_OPTION, array() );
	return ! empty( $approval['approved'] );
}

/**
 * Helper: get settings merged with defaults.
 *
 * @return array
 */
function quasar_get_settings() {
	$defaults = array(
		'company'   => array(
			'name'         => '',
			'legal_name'   => '',
			'description'  => '',
			'type'         => 'Organization',
			'street'       => '',
			'city'         => '',
			'region'       => '',
			'postal_code'  => '',
			'country'      => '',
			'phone'        => '',
			'email'        => '',
			'website'      => home_url(),
			'logo_url'     => '',
			'sameAs'       => array(),
			'founding_date' => '',
			'founder'      => '',
			'employees'    => '',
			'slogan'       => '',
		),
		'schema'    => array(
			'auto_generate_on_save' => true,
			'types_enabled'         => array( 'faq', 'organization', 'article', 'review' ),
			'openai_model'          => QUASAR_OPENAI_DEFAULT_MODEL,
			'faq_question_count'    => 5,
			'max_content_chars'     => 8000,
		),
		'tone_language' => array(
			'tone'             => 'professional',
			'custom_tone'      => '',
			'output_language'  => 'en',
			'respect_wp_locale' => false,
			'answer_length'    => 'medium',
		),
		'reviews_enabled' => false,
		'aggregate_rating' => array(
			'rating_value' => '',
			'review_count' => '',
			'worst'        => '1',
			'best'         => '5',
		),
		'faq_display' => array(
			'enabled'        => true,
			'section_title'  => 'Frequently Asked Questions',
			'show_on'        => array( 'post' ), // post types to display on
			'layout'         => 'boxed',        // boxed | flat | minimal
			'primary_color'  => '#6b46c1',
			'bg_color'       => '#f8f6fc',
			'text_color'     => '#333333',
			'answer_color'   => '#555555',
			'border_color'   => '#e0d8f0',
			'border_radius'  => 8,
			'expand_icon'    => 'chevron',      // chevron | plus | arrow
			'first_open'     => false,          // open first FAQ by default
			'font_size'      => 16,
		),
	);
	$stored = get_option( QUASAR_OPTION, array() );
	return wp_parse_args( $stored, $defaults );
}

/**
 * Helper: fallback model list (used when the OpenAI /models endpoint
 * is unreachable or hasn't been refreshed yet).
 *
 * @return array model_id => label
 */
function quasar_fallback_models() {
	return array(
		'gpt-5.6-luna'  => 'GPT 5.6 Luna',
		'gpt-5.6'       => 'GPT 5.6',
		'sol'           => 'Sol',
		'luna'          => 'Luna',
		'gpt-4o'        => 'GPT 4o',
		'gpt-4o-mini'   => 'GPT 4o Mini',
		'gpt-4-turbo'   => 'GPT 4 Turbo',
		'gpt-3.5-turbo' => 'GPT 3.5 Turbo',
	);
}

/**
 * Helper: get available models. Checks transient first (populated by
 * the Refresh models button), falls back to the hardcoded list.
 *
 * @param bool $force_refresh If true, ignore the transient.
 * @return array model_id => label
 */
function quasar_get_models( $force_refresh = false ) {
	if ( ! $force_refresh ) {
		$cached = get_transient( QUASAR_MODEL_TRANSIENT );
		if ( is_array( $cached ) && ! empty( $cached ) ) {
			return $cached;
		}
	}
	// Try a live fetch.
	$fetched = Quasar_OpenAI_Client::fetch_models();
	if ( ! is_wp_error( $fetched ) && ! empty( $fetched ) ) {
		set_transient( QUASAR_MODEL_TRANSIENT, $fetched, QUASAR_MODEL_TRANSIENT_EXPIRY );
		return $fetched;
	}
	return quasar_fallback_models();
}

/**
 * Helper: get per-type schema meta keys.
 *
 * @return array
 */
function quasar_type_keys() {
	return array( 'faq', 'organization', 'article', 'review' );
}

/**
 * Helper: human label for a schema type.
 *
 * @param string $type Type key.
 * @return string
 */
function quasar_type_label( $type ) {
	$labels = array(
		'faq'          => 'FAQPage',
		'organization' => 'Organization',
		'article'      => 'Article / BlogPosting',
		'review'       => 'Review / AggregateRating',
	);
	return $labels[ $type ] ?? ucfirst( $type );
}
