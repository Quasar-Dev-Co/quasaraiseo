<?php
/**
 * Meta box — per-section schema editor on the post edit screen.
 *
 * Each enabled schema type gets its own card with a JSON editor and
 * Regenerate / Save / Delete buttons. A combined preview is shown at
 * the bottom.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Meta_Box {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_box' ) );
		add_action( 'save_post', array( __CLASS__, 'save_faq_title_override' ), 15, 2 );
	}

	/**
	 * Save the per-post FAQ title override.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public static function save_faq_title_override( $post_id, $post ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		if ( ! isset( $_POST['quasar_metabox_nonce'] ) || ! wp_verify_nonce( $_POST['quasar_metabox_nonce'], 'quasar_metabox' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$title = isset( $_POST['quasar_faq_title_override'] ) ? sanitize_text_field( wp_unslash( $_POST['quasar_faq_title_override'] ) ) : '';
		if ( $title ) {
			update_post_meta( $post_id, '_quasar_faq_title_override', $title );
		} else {
			delete_post_meta( $post_id, '_quasar_faq_title_override' );
		}
	}

	/**
	 * Register the meta box on enabled post types.
	 */
	public static function add_meta_box() {
		$types = array( 'post', 'page' );
		foreach ( $types as $type ) {
			add_meta_box(
				'quasar_schema_metabox',
				'QuasarAISEO Schema',
				array( __CLASS__, 'render' ),
				$type,
				'normal',
				'high'
			);
		}
	}

	/**
	 * Render the meta box with per-section editors.
	 *
	 * @param WP_Post $post Post object.
	 */
	public static function render( $post ) {
		$settings     = quasar_get_settings();
		$types_enabled = $settings['schema']['types_enabled'];
		$types_meta   = get_post_meta( $post->ID, '_quasar_schema_types', true );
		$statuses     = get_post_meta( $post->ID, '_quasar_schema_statuses', true );
		$updated      = get_post_meta( $post->ID, '_quasar_schema_updated', true );
		$error        = get_post_meta( $post->ID, '_quasar_schema_error', true );
		$approved     = quasar_is_approved();
		$combined     = get_post_meta( $post->ID, '_quasar_schema', true );
		$faq_title_override = get_post_meta( $post->ID, '_quasar_faq_title_override', true );

		if ( ! is_array( $types_meta ) ) {
			$types_meta = array();
		}
		if ( ! is_array( $statuses ) ) {
			$statuses = array();
		}

		wp_nonce_field( 'quasar_metabox', 'quasar_metabox_nonce' );
		?>
		<div class="quasar-metabox" data-post-id="<?php echo esc_attr( $post->ID ); ?>">

			<?php if ( ! $approved ) : ?>
				<div class="quasar-metabox-notice">
					Site is awaiting approval from team quasara. AI generation is disabled.
				</div>
			<?php endif; ?>

			<?php if ( $error ) : ?>
				<div class="quasar-metabox-error">Last error: <?php echo esc_html( $error ); ?></div>
			<?php endif; ?>

			<div class="quasar-metabox-toolbar">
				<button type="button" class="button button-primary quasar-regenerate-all" <?php echo $approved ? '' : 'disabled'; ?>>
					Regenerate all with AI
				</button>
				<?php if ( $updated ) : ?>
					<span class="quasar-updated">Last updated: <?php echo esc_html( gmdate( 'Y-m-d H:i', (int) $updated ) ); ?> UTC</span>
				<?php endif; ?>
				<span class="quasar-metabox-msg" id="quasar-metabox-global-msg"></span>
			</div>

			<div class="quasar-faq-title-override">
				<label for="quasar_faq_title_override">
					<strong>FAQ Section Title (frontend display):</strong>
					<input type="text" id="quasar_faq_title_override" class="quasar-faq-title-input" value="<?php echo esc_attr( $faq_title_override ); ?>" placeholder="Leave empty to use the default from settings" />
				</label>
				<p class="description">Override the FAQ heading shown under the post content for this specific post. Leave empty to use the default title from FAQ Display settings.</p>
			</div>

			<div class="quasar-sections">
				<?php foreach ( quasar_type_keys() as $type ) :
					if ( ! in_array( $type, $types_enabled, true ) ) {
						continue;
					}
					$node    = $types_meta[ $type ] ?? null;
					$status  = $statuses[ $type ] ?? 'empty';
					$json    = $node ? wp_json_encode( $node, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) : '';
					?>
					<div class="quasar-section-card" data-type="<?php echo esc_attr( $type ); ?>">
						<div class="quasar-section-header">
							<span class="quasar-section-toggle dashicons dashicons-arrow-down"></span>
							<span class="quasar-section-title"><?php echo esc_html( quasar_type_label( $type ) ); ?></span>
							<span class="quasar-status-badge quasar-status-<?php echo esc_attr( $status ); ?>">
								<?php echo esc_html( ucfirst( $status ) ); ?>
							</span>
						</div>
						<div class="quasar-section-body">
							<textarea class="quasar-json-editor quasar-type-json" rows="10" spellcheck="false"><?php echo esc_textarea( $json ); ?></textarea>
							<div class="quasar-section-actions">
								<button type="button" class="button button-primary quasar-type-regenerate"
									<?php echo $approved ? '' : 'disabled'; ?>>
									Regenerate
								</button>
								<button type="button" class="button quasar-type-save">Save edit</button>
								<button type="button" class="button button-link-delete quasar-type-delete">Delete</button>
								<span class="quasar-section-msg"></span>
							</div>
						</div>
					</div>
				<?php endforeach; ?>
			</div>

			<div class="quasar-section-card quasar-combined-card">
				<div class="quasar-section-header">
					<span class="quasar-section-toggle dashicons dashicons-arrow-down"></span>
					<span class="quasar-section-title">Combined JSON-LD Output</span>
				</div>
				<div class="quasar-section-body">
					<textarea class="quasar-json-editor quasar-combined-json" rows="14" spellcheck="false" readonly><?php
						echo esc_textarea(
							$combined
								? wp_json_encode( $combined, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT )
								: ''
						);
					?></textarea>
					<p class="description">This is the final JSON-LD output in <code>&lt;head&gt;</code>. It updates automatically when you save or regenerate individual sections.</p>
				</div>
			</div>

		</div>
		<?php
	}
}
