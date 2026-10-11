<?php
/**
 * Reviews data layer — CRUD over the quasar_reviews option.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Reviews {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		// No actions needed here; data is managed via the Reviews settings tab.
	}

	/**
	 * Get all reviews.
	 *
	 * @return array
	 */
	public static function all() {
		$reviews = get_option( QUASAR_REVIEWS_OPTION, array() );
		return is_array( $reviews ) ? $reviews : array();
	}

	/**
	 * Compute aggregate rating from stored reviews.
	 *
	 * @return array {rating_value, review_count}
	 */
	public static function compute_aggregate() {
		$reviews = self::all();
		$count   = count( $reviews );
		if ( 0 === $count ) {
			return array( 'rating_value' => '', 'review_count' => '' );
		}
		$sum = 0;
		foreach ( $reviews as $r ) {
			$sum += intval( $r['rating'] ?? 0 );
		}
		return array(
			'rating_value' => round( $sum / $count, 1 ),
			'review_count' => $count,
		);
	}
}
