<?php
/**
 * Schema generator orchestrator.
 *
 * Runs each enabled schema generator and stores per-type schema in post meta.
 * The combined @graph is rebuilt from the per-type nodes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Schema_Generator {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( QUASAR_CRON_HOOK, array( __CLASS__, 'generate_for_post' ) );
		add_action( 'wp_ajax_quasar_regenerate', array( __CLASS__, 'ajax_regenerate' ) );
		add_action( 'wp_ajax_quasar_regenerate_type', array( __CLASS__, 'ajax_regenerate_type' ) );
		add_action( 'wp_ajax_quasar_save_type', array( __CLASS__, 'ajax_save_type' ) );
		add_action( 'wp_ajax_quasar_delete_type', array( __CLASS__, 'ajax_delete_type' ) );
		add_action( 'wp_ajax_quasar_get_combined', array( __CLASS__, 'ajax_get_combined' ) );
	}

	// ------------------------------------------------------------------
	// Generation
	// ------------------------------------------------------------------

	/**
	 * Generate all enabled schema types for a post and store them.
	 *
	 * @param int $post_id Post ID.
	 * @return array|WP_Error The combined @graph, or WP_Error.
	 */
	public static function generate_for_post( $post_id ) {
		if ( ! quasar_is_approved() ) {
			return new WP_Error( 'quasar_not_approved', 'Site is not approved yet.' );
		}

		$post = get_post( $post_id );
		if ( ! $post || in_array( $post->post_status, array( 'auto-draft', 'trash', 'inherit' ), true ) ) {
			return new WP_Error( 'quasar_skip_post', 'Post not eligible.' );
		}

		$settings      = quasar_get_settings();
		$types_enabled = $settings['schema']['types_enabled'];
		$types_meta    = get_post_meta( $post_id, '_quasar_schema_types', true );
		if ( ! is_array( $types_meta ) ) {
			$types_meta = array();
		}
		$statuses = get_post_meta( $post_id, '_quasar_schema_statuses', true );
		if ( ! is_array( $statuses ) ) {
			$statuses = array();
		}

		$errors = array();

		foreach ( quasar_type_keys() as $type ) {
			if ( ! in_array( $type, $types_enabled, true ) ) {
				continue;
			}
			// Skip types the user has manually edited — don't overwrite on auto-gen.
			if ( isset( $statuses[ $type ] ) && 'edited' === $statuses[ $type ] ) {
				continue;
			}
			$node = self::generate_type( $post, $settings, $type );
			if ( is_wp_error( $node ) ) {
				$errors[ $type ] = $node->get_error_message();
				continue;
			}
			$types_meta[ $type ]   = $node;
			$statuses[ $type ]     = 'auto';
		}

		update_post_meta( $post_id, '_quasar_schema_types', $types_meta );
		update_post_meta( $post_id, '_quasar_schema_statuses', $statuses );
		update_post_meta( $post_id, '_quasar_schema_updated', time() );

		if ( ! empty( $errors ) ) {
			update_post_meta( $post_id, '_quasar_schema_error', implode( ' | ', $errors ) );
		} else {
			delete_post_meta( $post_id, '_quasar_schema_error' );
		}

		$combined = self::rebuild_combined( $post_id, $types_meta );
		return $combined;
	}

	/**
	 * Generate a single schema type for a post.
	 *
	 * @param WP_Post $post     Post object.
	 * @param array   $settings Plugin settings.
	 * @param string  $type     Type key (faq|organization|article|review).
	 * @return array|WP_Error
	 */
	public static function generate_type( $post, $settings, $type ) {
		switch ( $type ) {
			case 'faq':
				return Quasar_Schema_FAQ::generate( $post, $settings );
			case 'organization':
				return Quasar_Schema_Org::generate( $post, $settings );
			case 'article':
				return Quasar_Schema_Article::generate( $post, $settings );
			case 'review':
				return Quasar_Schema_Review::generate( $post, $settings );
			default:
				return new WP_Error( 'quasar_unknown_type', 'Unknown schema type: ' . $type );
		}
	}

	/**
	 * Regenerate a single type for a post (ignores "edited" guard).
	 *
	 * @param int    $post_id Post ID.
	 * @param string $type    Type key.
	 * @return array|WP_Error
	 */
	public static function regenerate_type_for_post( $post_id, $type ) {
		if ( ! quasar_is_approved() ) {
			return new WP_Error( 'quasar_not_approved', 'Site is not approved yet.' );
		}
		$post = get_post( $post_id );
		if ( ! $post ) {
			return new WP_Error( 'quasar_no_post', 'Post not found.' );
		}
		$settings = quasar_get_settings();
		$node     = self::generate_type( $post, $settings, $type );
		if ( is_wp_error( $node ) ) {
			return $node;
		}

		$types_meta = get_post_meta( $post_id, '_quasar_schema_types', true );
		if ( ! is_array( $types_meta ) ) {
			$types_meta = array();
		}
		$statuses = get_post_meta( $post_id, '_quasar_schema_statuses', true );
		if ( ! is_array( $statuses ) ) {
			$statuses = array();
		}

		$types_meta[ $type ] = $node;
		$statuses[ $type ]   = 'auto';

		update_post_meta( $post_id, '_quasar_schema_types', $types_meta );
		update_post_meta( $post_id, '_quasar_schema_statuses', $statuses );
		update_post_meta( $post_id, '_quasar_schema_updated', time() );

		self::rebuild_combined( $post_id, $types_meta );
		return $node;
	}

	/**
	 * Rebuild the combined @graph from per-type meta and store it.
	 *
	 * @param int   $post_id    Post ID.
	 * @param array $types_meta Optional — pass the types meta to avoid re-reading.
	 * @return array The combined @graph block.
	 */
	public static function rebuild_combined( $post_id, $types_meta = null ) {
		if ( null === $types_meta ) {
			$types_meta = get_post_meta( $post_id, '_quasar_schema_types', true );
		}
		if ( ! is_array( $types_meta ) ) {
			$types_meta = array();
		}

		$graph = array();
		foreach ( quasar_type_keys() as $type ) {
			if ( ! isset( $types_meta[ $type ] ) ) {
				continue;
			}
			$node = $types_meta[ $type ];
			// Review returns an array of nodes; others are single nodes.
			if ( 'review' === $type && is_array( $node ) && self::is_node_list( $node ) ) {
				foreach ( $node as $sub ) {
					$graph[] = $sub;
				}
			} else {
				$graph[] = $node;
			}
		}

		$block = array(
			'@context' => 'https://schema.org',
			'@graph'   => $graph,
		);

		update_post_meta( $post_id, '_quasar_schema', $block );
		return $block;
	}

	/**
	 * Check if an array is a list of schema nodes (not a single node).
	 *
	 * @param array $arr Array to check.
	 * @return bool
	 */
	protected static function is_node_list( $arr ) {
		if ( empty( $arr ) ) {
			return false;
		}
		// A single node has @type as a string key. A list has numeric keys.
		$first = reset( $arr );
		return is_array( $first ) && isset( $first['@type'] );
	}

	// ------------------------------------------------------------------
	// AJAX handlers
	// ------------------------------------------------------------------

	/**
	 * AJAX: regenerate all schema types for a post.
	 */
	public static function ajax_regenerate() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$post_id = intval( $_POST['post_id'] ?? 0 );
		if ( ! $post_id ) {
			wp_send_json_error( array( 'message' => 'Missing post ID.' ) );
		}

		// Clear "edited" statuses so auto-gen regenerates everything.
		$statuses = get_post_meta( $post_id, '_quasar_schema_statuses', true );
		if ( is_array( $statuses ) ) {
			foreach ( $statuses as $k => $v ) {
				$statuses[ $k ] = 'auto';
			}
			update_post_meta( $post_id, '_quasar_schema_statuses', $statuses );
		}

		$result = self::generate_for_post( $post_id );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		$types_meta = get_post_meta( $post_id, '_quasar_schema_types', true );
		$statuses   = get_post_meta( $post_id, '_quasar_schema_statuses', true );
		wp_send_json_success(
			array(
				'message'    => 'Schema regenerated.',
				'schema'     => $result,
				'types_meta' => $types_meta,
				'statuses'   => $statuses,
			)
		);
	}

	/**
	 * AJAX: regenerate a single schema type for a post.
	 */
	public static function ajax_regenerate_type() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$post_id = intval( $_POST['post_id'] ?? 0 );
		$type    = sanitize_text_field( $_POST['schema_type'] ?? '' );
		if ( ! $post_id || ! $type ) {
			wp_send_json_error( array( 'message' => 'Missing post ID or schema type.' ) );
		}
		$result = self::regenerate_type_for_post( $post_id, $type );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		wp_send_json_success(
			array(
				'message' => quasar_type_label( $type ) . ' regenerated.',
				'node'    => $result,
				'status'  => 'auto',
			)
		);
	}

	/**
	 * AJAX: save a manual edit of a single schema type.
	 */
	public static function ajax_save_type() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$post_id = intval( $_POST['post_id'] ?? 0 );
		$type    = sanitize_text_field( $_POST['schema_type'] ?? '' );
		$json    = wp_unslash( $_POST['schema'] ?? '' );
		if ( ! $post_id || ! $type || ! $json ) {
			wp_send_json_error( array( 'message' => 'Missing data.' ) );
		}
		$decoded = json_decode( $json, true );
		if ( ! is_array( $decoded ) ) {
			wp_send_json_error( array( 'message' => 'Invalid JSON.' ) );
		}

		$types_meta = get_post_meta( $post_id, '_quasar_schema_types', true );
		if ( ! is_array( $types_meta ) ) {
			$types_meta = array();
		}
		$statuses = get_post_meta( $post_id, '_quasar_schema_statuses', true );
		if ( ! is_array( $statuses ) ) {
			$statuses = array();
		}

		$types_meta[ $type ] = $decoded;
		$statuses[ $type ]   = 'edited';

		update_post_meta( $post_id, '_quasar_schema_types', $types_meta );
		update_post_meta( $post_id, '_quasar_schema_statuses', $statuses );
		update_post_meta( $post_id, '_quasar_schema_updated', time() );

		self::rebuild_combined( $post_id, $types_meta );
		wp_send_json_success( array( 'message' => quasar_type_label( $type ) . ' saved.' ) );
	}

	/**
	 * AJAX: delete a single schema type for a post.
	 */
	public static function ajax_delete_type() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$post_id = intval( $_POST['post_id'] ?? 0 );
		$type    = sanitize_text_field( $_POST['schema_type'] ?? '' );
		if ( ! $post_id || ! $type ) {
			wp_send_json_error( array( 'message' => 'Missing data.' ) );
		}

		$types_meta = get_post_meta( $post_id, '_quasar_schema_types', true );
		if ( is_array( $types_meta ) ) {
			unset( $types_meta[ $type ] );
			update_post_meta( $post_id, '_quasar_schema_types', $types_meta );
		}
		$statuses = get_post_meta( $post_id, '_quasar_schema_statuses', true );
		if ( is_array( $statuses ) ) {
			$statuses[ $type ] = 'manual';
			update_post_meta( $post_id, '_quasar_schema_statuses', $statuses );
		}
		update_post_meta( $post_id, '_quasar_schema_updated', time() );

		self::rebuild_combined( $post_id, $types_meta );
		wp_send_json_success( array( 'message' => quasar_type_label( $type ) . ' deleted.' ) );
	}

	/**
	 * AJAX: return the combined @graph for the preview.
	 */
	public static function ajax_get_combined() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$post_id = intval( $_POST['post_id'] ?? 0 );
		if ( ! $post_id ) {
			wp_send_json_error( array( 'message' => 'Missing post ID.' ) );
		}
		$combined = get_post_meta( $post_id, '_quasar_schema', true );
		wp_send_json_success( array( 'schema' => $combined ) );
	}
}
