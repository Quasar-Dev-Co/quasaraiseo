<?php
/**
 * Schema output — prints JSON-LD in wp_head.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Schema_Output {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'wp_head', array( __CLASS__, 'output_schema' ), 20 );
	}

	/**
	 * Output JSON-LD schema in <head>.
	 */
	public static function output_schema() {
		if ( is_admin() ) {
			return;
		}
		$settings = quasar_get_settings();
		$types    = $settings['schema']['types_enabled'];
		$graph    = array();

		// Site-wide Organization node on all pages (when enabled).
		if ( in_array( 'organization', $types, true ) ) {
			$org = Quasar_Schema_Org::build_from_profile( $settings );
			if ( Quasar_Schema_Org::validate( $org ) ) {
				$graph[] = $org;
			}
		}

		// Per-post schema on singular pages.
		if ( is_singular() ) {
			$post_id = get_queried_object_id();
			$stored  = get_post_meta( $post_id, '_quasar_schema', true );
			if ( is_array( $stored ) && ! empty( $stored['@graph'] ) ) {
				// Merge per-post graph, but replace the Organization node with
				// the site-wide one (already added above) to avoid duplicates.
				foreach ( $stored['@graph'] as $node ) {
					if ( 'Organization' === ( $node['@type'] ?? '' ) || 'LocalBusiness' === ( $node['@type'] ?? '' ) ) {
						continue; // already in $graph from site-wide.
					}
					$graph[] = $node;
				}
			}
		}

		if ( empty( $graph ) ) {
			return;
		}

		$block = array(
			'@context' => 'https://schema.org',
			'@graph'   => $graph,
		);

		echo "\n<!-- QuasarAISEO Schema -->\n";
		echo '<script type="application/ld+json">';
		echo wp_json_encode( $block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
		echo "</script>\n";
	}
}
