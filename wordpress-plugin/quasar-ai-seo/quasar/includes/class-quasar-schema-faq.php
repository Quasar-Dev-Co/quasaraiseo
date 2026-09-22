<?php
/**
 * FAQPage schema generator.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Schema_FAQ {

	/**
	 * Build the OpenAI prompts for FAQ generation.
	 *
	 * @param WP_Post $post      Post object.
	 * @param array   $settings  Plugin settings.
	 * @return array {system, user}
	 */
	public static function build_prompt( $post, $settings ) {
		$count     = intval( $settings['schema']['faq_question_count'] ?? 5 );
		$max_chars = intval( $settings['schema']['max_content_chars'] ?? 8000 );
		$content   = wp_strip_all_tags( $post->post_content );
		if ( strlen( $content ) > $max_chars ) {
			$content = substr( $content, 0, $max_chars );
		}

		$language = $settings['tone_language']['output_language'] ?? 'en';
		$tone     = $settings['tone_language']['tone'] ?? 'professional';
		$custom   = $settings['tone_language']['custom_tone'] ?? '';
		$tone_str = 'custom' === $tone && $custom ? $custom : $tone;

		$answer_length = $settings['tone_language']['answer_length'] ?? 'medium';
		$range         = Quasar_I18n::answer_length_range( $answer_length );
		$min_words     = intval( $range['min'] );
		$max_words     = intval( $range['max'] );

		$system = 'You are an SEO structured-data expert. Generate schema.org FAQPage JSON-LD strictly from the provided page content. Do not invent facts not present in the content. Return ONLY a JSON object with this shape: {"mainEntity":[{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}]}. Answers should be ' . $min_words . '-' . $max_words . ' words, factual, and grounded in the content. Use the requested tone and language.';

		$user = "Generate {$count} FAQ question/answer pairs from the following content.\n\n"
			. "Title: " . $post->post_title . "\n"
			. "Tone: {$tone_str}\n"
			. "Output language: {$language}\n"
			. "Answer length: {$min_words}-{$max_words} words per answer\n"
			. "Content:\n" . $content . "\n\n"
			. 'Return JSON: {"mainEntity":[...]}';

		return array( $system, $user );
	}

	/**
	 * Generate the FAQPage node.
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
		$main_entity = $result['mainEntity'] ?? array();
		if ( ! is_array( $main_entity ) || count( $main_entity ) < 2 ) {
			return new WP_Error( 'quasar_faq_too_few', 'FAQ generation returned fewer than 2 questions.' );
		}

		$node = array(
			'@type'       => 'FAQPage',
			'@id'         => get_permalink( $post ) . '#faq',
			'mainEntity'  => array(),
		);
		foreach ( $main_entity as $q ) {
			$node['mainEntity'][] = array(
				'@type'          => 'Question',
				'name'           => sanitize_text_field( $q['name'] ?? '' ),
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => sanitize_textarea_field( $q['acceptedAnswer']['text'] ?? '' ),
				),
			);
		}
		return self::validate( $node ) ? $node : new WP_Error( 'quasar_faq_invalid', 'FAQ node failed validation.' );
	}

	/**
	 * Validate the FAQ node.
	 *
	 * @param array $node FAQ node.
	 * @return bool
	 */
	public static function validate( $node ) {
		if ( 'FAQPage' !== ( $node['@type'] ?? '' ) ) {
			return false;
		}
		if ( ! isset( $node['mainEntity'] ) || ! is_array( $node['mainEntity'] ) ) {
			return false;
		}
		if ( count( $node['mainEntity'] ) < 2 ) {
			return false;
		}
		foreach ( $node['mainEntity'] as $q ) {
			if ( empty( $q['name'] ) || empty( $q['acceptedAnswer']['text'] ) ) {
				return false;
			}
		}
		return true;
	}
}
