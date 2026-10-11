<?php
/**
 * Uninstall — clean up all plugin data.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Options.
delete_option( 'quasar_settings' );
delete_option( 'quasar_reviews' );
delete_option( 'quasar_approval' );

// Transients.
delete_transient( 'quasar_openai_models' );

// Clear scheduled cron events.
wp_clear_scheduled_hook( 'quasar_generate_schema' );

// Post meta cleanup (batched).
global $wpdb;
$meta_keys = array(
	'_quasar_schema',
	'_quasar_schema_types',
	'_quasar_schema_statuses',
	'_quasar_schema_status',
	'_quasar_schema_updated',
	'_quasar_schema_error',
	'_quasar_faq_title_override',
);
foreach ( $meta_keys as $key ) {
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
			$key
		)
	);
}
