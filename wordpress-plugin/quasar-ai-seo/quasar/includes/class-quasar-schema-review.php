<?php
/**
 * Review / AggregateRating schema generator.
 *
 * Reviews come from the quasar_reviews option (managed in the Reviews tab).
 * AggregateRating is computed from stored reviews unless manually overridden.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Schema_Review {

	/**
	 * Generate the Review + AggregateRating nodes for a post.
	 *
	 * @param WP_Post $post     Post object.
	 * @param array   $settings Plugin settings.
	 * @return array|WP_Error  Array of nodes (Review[] + AggregateRating), or WP_Error.
	 */
	public static function generate( $post, $settings ) {
		if ( empty( $settings['reviews_enabled'] ) ) {
			return new WP_Error( 'quasar_review_disabled', 'Reviews are disabled in settings.' );
		}

		$reviews = Quasar_Reviews::all();
		$nodes   = array();
		$permalink = get_permalink( $post );

		foreach ( $reviews as $r ) {
			if ( empty( $r['author'] ) || empty( $r['rating'] ) ) {
				continue;
			}
			$nodes[] = array(
				'@type'         => 'Review',
				'@id'           => $permalink . '#review-' . sanitize_title( $r['author'] ),
				'author'        => array( '@type' => 'Person', 'name' => $r['author'] ),
				'reviewRating'  => array(
					'@type'       => 'Rating',
					'ratingValue' => (string) $r['rating'],
					'bestRating'  => '5',
					'worstRating' => '1',
				),
				'reviewBody'    => $r['body'],
				'datePublished' => $r['date'],
			);
		}

		// AggregateRating.
		$ar = $settings['aggregate_rating'];
		$rating_value = $ar['rating_value'];
		$review_count = $ar['review_count'];

		// Auto-compute if manual values empty.
		if ( '' === $rating_value || '' === $review_count ) {
			$computed = Quasar_Reviews::compute_aggregate();
			if ( '' === $rating_value ) {
				$rating_value = $computed['rating_value'];
			}
			if ( '' === $review_count ) {
				$review_count = $computed['review_count'];
			}
		}

		if ( $rating_value && $review_count ) {
			$nodes[] = array(
				'@type'         => 'AggregateRating',
				'@id'           => $permalink . '#aggregaterating',
				'ratingValue'   => (string) $rating_value,
				'reviewCount'   => (int) $review_count,
				'worstRating'   => (string) ( $ar['worst'] ?: '1' ),
				'bestRating'    => (string) ( $ar['best'] ?: '5' ),
				'itemReviewed'  => array( '@id' => $permalink . '#article' ),
			);
		}

		if ( empty( $nodes ) ) {
			return new WP_Error( 'quasar_review_empty', 'No reviews or aggregate rating available.' );
		}

		foreach ( $nodes as $n ) {
			if ( ! self::validate( $n ) ) {
				return new WP_Error( 'quasar_review_invalid', 'Review node failed validation.' );
			}
		}

		return $nodes;
	}

	/**
	 * Validate a Review or AggregateRating node.
	 *
	 * @param array $node Node.
	 * @return bool
	 */
	public static function validate( $node ) {
		$type = $node['@type'] ?? '';
		if ( 'Review' === $type ) {
			return ! empty( $node['author']['name'] ) && ! empty( $node['reviewRating']['ratingValue'] );
		}
		if ( 'AggregateRating' === $type ) {
			return ! empty( $node['ratingValue'] ) && ! empty( $node['reviewCount'] );
		}
		return false;
	}
}
