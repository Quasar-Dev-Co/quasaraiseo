<?php
/**
 * Frontend FAQ renderer — appends an accordion FAQ section after post content.
 *
 * Reads the FAQ schema stored in post meta and renders it as a visible,
 * interactive accordion on the frontend. Appearance is controlled by the
 * faq_display settings (colors, layout, icons, etc.).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_FAQ_Display {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_filter( 'the_content', array( __CLASS__, 'append_faq' ), 20 );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Append the FAQ accordion after post content.
	 *
	 * @param string $content Post content.
	 * @return string
	 */
	public static function append_faq( $content ) {
		if ( ! is_singular() || is_admin() ) {
			return $content;
		}

		$settings = quasar_get_settings();
		$fd       = $settings['faq_display'];

		// Check if FAQ display is enabled.
		if ( empty( $fd['enabled'] ) ) {
			return $content;
		}

		// Check if this post type should show the FAQ.
		$post_type = get_post_type();
		if ( ! empty( $fd['show_on'] ) && ! in_array( $post_type, $fd['show_on'], true ) ) {
			return $content;
		}

		// Only show in the main query / main loop.
		if ( ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}

		// Get the FAQ data from post meta.
		$post_id  = get_queried_object_id();
		$types_meta = get_post_meta( $post_id, '_quasar_schema_types', true );
		if ( ! is_array( $types_meta ) || empty( $types_meta['faq'] ) ) {
			return $content;
		}

		$faq_node = $types_meta['faq'];
		$questions = $faq_node['mainEntity'] ?? array();
		if ( empty( $questions ) || ! is_array( $questions ) ) {
			return $content;
		}

		// Allow per-post title override.
		$per_post_title = get_post_meta( $post_id, '_quasar_faq_title_override', true );
		$title = $per_post_title ? $per_post_title : $fd['section_title'];

		// Build the HTML.
		$html = self::render_faq_html( $questions, $fd, $title, $post_id );
		return $content . $html;
	}

	/**
	 * Render the FAQ accordion HTML.
	 *
	 * @param array  $questions FAQ questions array.
	 * @param array  $fd        FAQ display settings.
	 * @param string $title     Section title.
	 * @param int    $post_id   Post ID.
	 * @return string
	 */
	public static function render_faq_html( $questions, $fd, $title, $post_id ) {
		$layout     = $fd['layout'] ?? 'boxed';
		$icon       = $fd['expand_icon'] ?? 'chevron';
		$first_open = ! empty( $fd['first_open'] );

		// CSS custom properties for theming.
		$style_vars = sprintf(
			'--quasar-primary:%s;--quasar-bg:%s;--quasar-text:%s;--quasar-answer:%s;--quasar-border:%s;--quasar-radius:%spx;--quasar-fs:%spx;',
			esc_attr( $fd['primary_color'] ?? '#6b46c1' ),
			esc_attr( $fd['bg_color'] ?? '#f8f6fc' ),
			esc_attr( $fd['text_color'] ?? '#333333' ),
			esc_attr( $fd['answer_color'] ?? '#555555' ),
			esc_attr( $fd['border_color'] ?? '#e0d8f0' ),
			esc_attr( $fd['border_radius'] ?? 8 ),
			esc_attr( $fd['font_size'] ?? 16 )
		);

		$icon_chars = array(
			'chevron' => '⌄',
			'plus'    => '+',
			'arrow'   => '›',
		);
		$icon_char = $icon_chars[ $icon ] ?? '⌄';

		$html  = "\n\n<!-- QuasarAISEO FAQ Section -->\n";
		$html .= '<div class="quasar-faq-section quasar-faq-layout-' . esc_attr( $layout ) . '" ';
		$html .= 'style="' . $style_vars . '" ';
		$html .= 'data-first-open="' . ( $first_open ? '1' : '0' ) . '" ';
		$html .= 'data-icon="' . esc_attr( $icon ) . '" ';
		$html .= 'data-post-id="' . esc_attr( $post_id ) . "\">\n";

		if ( $title ) {
			$html .= '	<h2 class="quasar-faq-title">' . esc_html( $title ) . "</h2>\n";
		}

		$html .= "	<div class=\"quasar-faq-list\">\n";

		$index = 0;
		foreach ( $questions as $q ) {
			$question = $q['name'] ?? '';
			$answer   = $q['acceptedAnswer']['text'] ?? '';
			if ( ! $question || ! $answer ) {
				continue;
			}
			$is_first  = ( 0 === $index );
			$open_class = ( $is_first && $first_open ) ? ' quasar-faq-active' : '';
			$answer_style = ( $is_first && $first_open ) ? '' : ' style="display:none;"';

			$html .= "		<div class=\"quasar-faq-item" . $open_class . "\">\n";
			$html .= '			<div class="quasar-faq-question" tabindex="0" role="button" aria-expanded="' . ( $open_class ? 'true' : 'false' ) . '">' . "\n";
			$html .= '				<span class="quasar-faq-q-text">' . esc_html( $question ) . "</span>\n";
			$html .= '				<span class="quasar-faq-icon quasar-faq-icon-' . esc_attr( $icon ) . '">' . esc_html( $icon_char ) . "</span>\n";
			$html .= "			</div>\n";
			$html .= '			<div class="quasar-faq-answer"' . $answer_style . ">\n";
			$html .= '				<p>' . nl2br( esc_html( $answer ) ) . "</p>\n";
			$html .= "			</div>\n";
			$html .= "		</div>\n";
			$index++;
		}

		$html .= "	</div>\n";
		$html .= "</div>\n<!-- /QuasarAISEO FAQ Section -->\n\n";

		return $html;
	}

	/**
	 * Enqueue frontend CSS/JS on singular pages.
	 */
	public static function enqueue_assets() {
		if ( ! is_singular() ) {
			return;
		}
		$settings = quasar_get_settings();
		if ( empty( $settings['faq_display']['enabled'] ) ) {
			return;
		}

		// Only enqueue if this post type is in the show_on list.
		$post_type = get_post_type();
		if ( ! empty( $settings['faq_display']['show_on'] ) && ! in_array( $post_type, $settings['faq_display']['show_on'], true ) ) {
			return;
		}

		wp_enqueue_style(
			'quasar-faq',
			QUASAR_URL . 'assets/css/faq-frontend.css',
			array(),
			QUASAR_VERSION
		);
		wp_enqueue_script(
			'quasar-faq',
			QUASAR_URL . 'assets/js/faq-frontend.js',
			array(),
			QUASAR_VERSION,
			true
		);
	}
}
