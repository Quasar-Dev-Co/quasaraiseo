<?php
/**
 * Article / BlogPosting schema generator.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Schema_Article {

	/**
	 * Build the OpenAI prompts for Article generation.
	 *
	 * @param WP_Post $post     Post object.
	 * @param array   $settings Plugin settings.
	 * @return array {system, user}
	 */
	public static function build_prompt( $post, $settings ) {
		$max_chars = intval( $settings['schema']['max_content_chars'] ?? 8000 );
		$content   = wp_strip_all_tags( $post->post_content );
		if ( strlen( $content ) > $max_chars ) {
			$content = substr( $content, 0, $max_chars );
		}

		$language = $settings['tone_language']['output_language'] ?? 'en';
		$tone     = $settings['tone_language']['tone'] ?? 'professional';

		$system = 'You are an SEO structured-data expert. Generate schema.org Article metadata strictly from the provided content. Do not invent facts. Return ONLY a JSON object with this shape: {"headline":"max 110 chars","description":"150-160 chars meta description","keywords":["..."],"articleBody":"first 200 chars excerpt"}. Use the requested language and tone.';

		$user = "Generate Article schema metadata.\n"
			. "Title: " . $post->post_title . "\n"
			. "Tone: {$tone}\n"
			. "Output language: {$language}\n"
			. "Content:\n" . $content;

		return array( $system, $user );
	}

	/**
	 * Generate the Article/BlogPosting node.
	 *
	 * @param WP_Post $post     Post object.
	 * @param array   $settings Plugin settings.
	 * @return array|WP_Error
	 */
	public static function generate( $post, $settings ) {
		list( $system, $user ) = self::build_prompt( $post, $settings );
		$result = Quasar_OpenAI_Client::chat( $system, $user, $settings['schema']['openai_model'] );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$type      = ( 'page' === $post->post_type ) ? 'Article' : 'BlogPosting';
		$permalink = get_permalink( $post );
		$author    = get_userdata( $post->post_author );

		$node = array(
			'@type'            => $type,
			'@id'              => $permalink . '#article',
			'headline'         => sanitize_text_field( $result['headline'] ?? $post->post_title ),
			'description'      => sanitize_textarea_field( $result['description'] ?? '' ),
			'datePublished'    => mysql2date( 'Y-m-d', $post->post_date ),
			'dateModified'     => mysql2date( 'Y-m-d', $post->post_modified ),
			'author'           => array(
				'@type' => 'Person',
				'@id'   => home_url() . '#person-' . $post->post_author,
				'name'  => $author ? $author->display_name : '',
			),
			'publisher'        => array( '@id' => home_url() . '#organization' ),
			'mainEntityOfPage' => array(
				'@type' => 'WebPage',
				'@id'   => $permalink,
			),
		);

		if ( ! empty( $result['keywords'] ) && is_array( $result['keywords'] ) ) {
			$node['keywords'] = array_map( 'sanitize_text_field', $result['keywords'] );
		}
		if ( ! empty( $result['articleBody'] ) ) {
			$node['articleBody'] = sanitize_textarea_field( $result['articleBody'] );
		}

		// Featured image.
		$thumb_id = get_post_thumbnail_id( $post->ID );
		if ( $thumb_id ) {
			$img = wp_get_attachment_image_src( $thumb_id, 'full' );
			if ( $img ) {
				$node['image'] = array(
					'@type' => 'ImageObject',
					'@id'   => $permalink . '#primaryimage',
					'url'   => $img[0],
					'width' => (int) $img[1],
					'height' => (int) $img[2],
				);
			}
		}

		return self::validate( $node ) ? $node : new WP_Error( 'quasar_article_invalid', 'Article node failed validation.' );
	}

	/**
	 * Validate the Article node.
	 *
	 * @param array $node Article node.
	 * @return bool
	 */
	public static function validate( $node ) {
		if ( empty( $node['@type'] ) ) {
			return false;
		}
		if ( empty( $node['headline'] ) ) {
			return false;
		}
		if ( empty( $node['datePublished'] ) ) {
			return false;
		}
		if ( empty( $node['author']['name'] ) ) {
			return false;
		}
		if ( strlen( $node['headline'] ) > 110 ) {
			return false;
		}
		return true;
	}
}
