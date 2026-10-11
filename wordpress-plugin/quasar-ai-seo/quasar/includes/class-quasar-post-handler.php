<?php
/**
 * Post handler — auto-generate schema on save_post (async via cron).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Post_Handler {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'save_post', array( __CLASS__, 'on_save_post' ), 20, 3 );
	}

	/**
	 * Fired on save_post. Schedules async generation when appropriate.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @param bool    $update  Whether this is an update.
	 */
	public static function on_save_post( $post_id, $post, $update ) {
		// Skip autosave.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		// Skip revisions.
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		// Skip quick edit / inline save (AJAX) — these don't change content.
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			return;
		}
		// Skip non-public post types.
		if ( ! in_array( $post->post_type, array( 'post', 'page' ), true ) && ! is_post_type_viewable( $post->post_type ) ) {
			return;
		}
		// Skip non-published.
		if ( 'publish' !== $post->post_status ) {
			return;
		}
		// Skip if user can't edit (e.g. cron).
		// (cron runs as guest, so we don't cap-check here — the cron callback is safe.)

		$settings = quasar_get_settings();
		if ( empty( $settings['schema']['auto_generate_on_save'] ) ) {
			return;
		}
		if ( ! quasar_is_approved() ) {
			return;
		}

		// Don't regenerate if the user manually edited the schema (status = edited)
		// unless this save explicitly changed content.
		$status = get_post_meta( $post_id, '_quasar_schema_status', true );
		if ( 'edited' === $status ) {
			return;
		}

		// Schedule async generation (debounced: clear any pending, schedule new).
		$args = array( $post_id );
		wp_clear_scheduled_hook( QUASAR_CRON_HOOK, $args );
		wp_schedule_single_event( time() + 10, QUASAR_CRON_HOOK, $args );
	}
}
