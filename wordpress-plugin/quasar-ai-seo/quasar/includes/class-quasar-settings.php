<?php
/**
 * Settings page — top-level menu with 5 tabs.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Settings {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	/**
	 * Add the top-level menu.
	 */
	public static function add_menu() {
		add_menu_page(
			'QuasarAISEO Schema',
			'QuasarAISEO',
			'manage_options',
			'quasar-ai-seo',
			array( __CLASS__, 'render_page' ),
			'dashicons-chart-area',
			58
		);
	}

	/**
	 * Register settings + sanitization.
	 */
	public static function register_settings() {
		register_setting( 'quasar_settings_group', QUASAR_OPTION, array( __CLASS__, 'sanitize' ) );
		register_setting( 'quasar_settings_group', QUASAR_REVIEWS_OPTION, array( __CLASS__, 'sanitize_reviews' ) );
	}

	/**
	 * Sanitize the main settings array.
	 *
	 * @param array $input Raw input.
	 * @return array
	 */
	public static function sanitize( $input ) {
		$current = quasar_get_settings();
		$out     = $current;

		// Company.
		if ( isset( $input['company'] ) && is_array( $input['company'] ) ) {
			$c = $input['company'];
			$out['company']['name']          = sanitize_text_field( $c['name'] ?? '' );
			$out['company']['legal_name']    = sanitize_text_field( $c['legal_name'] ?? '' );
			$out['company']['description']   = sanitize_textarea_field( $c['description'] ?? '' );
			$out['company']['type']          = sanitize_text_field( $c['type'] ?? 'Organization' );
			$out['company']['street']        = sanitize_text_field( $c['street'] ?? '' );
			$out['company']['city']          = sanitize_text_field( $c['city'] ?? '' );
			$out['company']['region']        = sanitize_text_field( $c['region'] ?? '' );
			$out['company']['postal_code']   = sanitize_text_field( $c['postal_code'] ?? '' );
			$out['company']['country']       = sanitize_text_field( $c['country'] ?? '' );
			$out['company']['phone']         = sanitize_text_field( $c['phone'] ?? '' );
			$out['company']['email']         = sanitize_email( $c['email'] ?? '' );
			$out['company']['website']       = esc_url_raw( $c['website'] ?? home_url() );
			$out['company']['logo_url']      = esc_url_raw( $c['logo_url'] ?? '' );
			$out['company']['founding_date'] = sanitize_text_field( $c['founding_date'] ?? '' );
			$out['company']['founder']       = sanitize_text_field( $c['founder'] ?? '' );
			$out['company']['employees']     = sanitize_text_field( $c['employees'] ?? '' );
			$out['company']['slogan']        = sanitize_text_field( $c['slogan'] ?? '' );

			$sameAs = array();
			if ( ! empty( $c['sameAs'] ) && is_array( $c['sameAs'] ) ) {
				foreach ( $c['sameAs'] as $url ) {
					$url = esc_url_raw( trim( $url ) );
					if ( $url ) {
						$sameAs[] = $url;
					}
				}
			}
			$out['company']['sameAs'] = $sameAs;
		}

		// Schema.
		if ( isset( $input['schema'] ) && is_array( $input['schema'] ) ) {
			$s = $input['schema'];
			$out['schema']['auto_generate_on_save'] = ! empty( $s['auto_generate_on_save'] );
			$types = array();
			if ( ! empty( $s['types_enabled'] ) && is_array( $s['types_enabled'] ) ) {
				foreach ( $s['types_enabled'] as $t ) {
					if ( in_array( $t, array( 'faq', 'organization', 'article', 'review' ), true ) ) {
						$types[] = $t;
					}
				}
			}
			$out['schema']['types_enabled']      = $types;
			$out['schema']['openai_model']       = sanitize_text_field( $s['openai_model'] ?? QUASAR_OPENAI_DEFAULT_MODEL );
			$out['schema']['faq_question_count'] = max( 2, min( 10, intval( $s['faq_question_count'] ?? 5 ) ) );
			$out['schema']['max_content_chars']  = max( 1000, intval( $s['max_content_chars'] ?? 8000 ) );
		}

		// Tone & language.
		if ( isset( $input['tone_language'] ) && is_array( $input['tone_language'] ) ) {
			$tl = $input['tone_language'];
			$out['tone_language']['tone']             = sanitize_text_field( $tl['tone'] ?? 'professional' );
			$out['tone_language']['custom_tone']      = sanitize_text_field( $tl['custom_tone'] ?? '' );
			$out['tone_language']['output_language']  = sanitize_text_field( $tl['output_language'] ?? 'en' );
			$out['tone_language']['respect_wp_locale'] = ! empty( $tl['respect_wp_locale'] );
			$answer_length = sanitize_text_field( $tl['answer_length'] ?? 'medium' );
			$valid_lengths = array_keys( Quasar_I18n::answer_lengths() );
			$out['tone_language']['answer_length'] = in_array( $answer_length, $valid_lengths, true ) ? $answer_length : 'medium';
		}

		// Reviews.
		$out['reviews_enabled'] = ! empty( $input['reviews_enabled'] );
		if ( isset( $input['aggregate_rating'] ) && is_array( $input['aggregate_rating'] ) ) {
			$ar = $input['aggregate_rating'];
			$out['aggregate_rating']['rating_value'] = sanitize_text_field( $ar['rating_value'] ?? '' );
			$out['aggregate_rating']['review_count'] = sanitize_text_field( $ar['review_count'] ?? '' );
			$out['aggregate_rating']['worst']        = sanitize_text_field( $ar['worst'] ?? '1' );
			$out['aggregate_rating']['best']         = sanitize_text_field( $ar['best'] ?? '5' );
		}

		// FAQ Display.
		if ( isset( $input['faq_display'] ) && is_array( $input['faq_display'] ) ) {
			$fd = $input['faq_display'];
			$out['faq_display']['enabled']       = ! empty( $fd['enabled'] );
			$out['faq_display']['section_title'] = sanitize_text_field( $fd['section_title'] ?? 'Frequently Asked Questions' );
			$out['faq_display']['layout']        = in_array( $fd['layout'] ?? '', array( 'boxed', 'flat', 'minimal' ), true ) ? $fd['layout'] : 'boxed';
			$out['faq_display']['primary_color'] = sanitize_hex_color( $fd['primary_color'] ?? '#6b46c1' ) ?: '#6b46c1';
			$out['faq_display']['bg_color']      = sanitize_hex_color( $fd['bg_color'] ?? '#f8f6fc' ) ?: '#f8f6fc';
			$out['faq_display']['text_color']    = sanitize_hex_color( $fd['text_color'] ?? '#333333' ) ?: '#333333';
			$out['faq_display']['answer_color']  = sanitize_hex_color( $fd['answer_color'] ?? '#555555' ) ?: '#555555';
			$out['faq_display']['border_color']  = sanitize_hex_color( $fd['border_color'] ?? '#e0d8f0' ) ?: '#e0d8f0';
			$out['faq_display']['border_radius'] = max( 0, min( 30, intval( $fd['border_radius'] ?? 8 ) ) );
			$out['faq_display']['expand_icon']   = in_array( $fd['expand_icon'] ?? '', array( 'chevron', 'plus', 'arrow' ), true ) ? $fd['expand_icon'] : 'chevron';
			$out['faq_display']['first_open']    = ! empty( $fd['first_open'] );
			$out['faq_display']['font_size']     = max( 12, min( 24, intval( $fd['font_size'] ?? 16 ) ) );

			// Show on post types.
			$show_on = array();
			if ( ! empty( $fd['show_on'] ) && is_array( $fd['show_on'] ) ) {
				foreach ( $fd['show_on'] as $pt ) {
					if ( post_type_exists( sanitize_key( $pt ) ) ) {
						$show_on[] = sanitize_key( $pt );
					}
				}
			}
			$out['faq_display']['show_on'] = $show_on;
		}

		return $out;
	}

	/**
	 * Sanitize the reviews option.
	 *
	 * @param array $input Raw reviews.
	 * @return array
	 */
	public static function sanitize_reviews( $input ) {
		$out = array();
		if ( ! is_array( $input ) ) {
			return $out;
		}
		foreach ( $input as $review ) {
			$out[] = array(
				'author' => sanitize_text_field( $review['author'] ?? '' ),
				'rating' => max( 1, min( 5, intval( $review['rating'] ?? 5 ) ) ),
				'body'   => sanitize_textarea_field( $review['body'] ?? '' ),
				'date'   => sanitize_text_field( $review['date'] ?? '' ),
				'source' => esc_url_raw( $review['source'] ?? '' ),
			);
		}
		return $out;
	}

	/**
	 * Render the settings page with tabs.
	 */
	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$tabs = array(
			'company'    => 'Company Profile',
			'schema'     => 'Schema',
			'reviews'    => 'Reviews',
			'tone'       => 'Tone & Language',
			'faqdisplay' => 'FAQ Display',
			'status'     => 'Status',
		);
		$current = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'company';
		if ( ! isset( $tabs[ $current ] ) ) {
			$current = 'company';
		}
		?>
		<div class="wrap quasar-wrap">
			<h1>QuasarAISEO Schema <span class="quasar-version">v<?php echo esc_html( QUASAR_VERSION ); ?></span></h1>
			<?php if ( ! quasar_is_approved() ) : ?>
				<div class="quasar-banner">Awaiting approval from team quasara — AI generation is disabled.</div>
			<?php endif; ?>

			<h2 class="nav-tab-wrapper quasar-tabs">
				<?php foreach ( $tabs as $slug => $label ) : ?>
					<a href="<?php echo esc_url( add_query_arg( array( 'page' => 'quasar-ai-seo', 'tab' => $slug ), admin_url( 'admin.php' ) ) ); ?>"
						class="nav-tab <?php echo $current === $slug ? 'nav-tab-active' : ''; ?>">
						<?php echo esc_html( $label ); ?>
					</a>
				<?php endforeach; ?>
			</h2>

			<div class="quasar-tab-content">
				<?php
				$view = QUASAR_PATH . 'admin/views/tab-' . $current . '.php';
				if ( file_exists( $view ) ) {
					include $view;
				} else {
					echo '<p>Tab not found.</p>';
				}
				?>
			</div>
		</div>
		<?php
	}
}
