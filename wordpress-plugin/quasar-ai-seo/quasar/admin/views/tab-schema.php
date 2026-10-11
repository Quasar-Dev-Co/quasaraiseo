<?php
/**
 * Settings tab: Schema.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$s     = quasar_get_settings();
$sc    = $s['schema'];
$types = array(
	'faq'          => 'FAQPage (AI-generated Q&A from content)',
	'organization' => 'Organization / LocalBusiness (from company profile)',
	'article'      => 'Article / BlogPosting (AI-generated metadata)',
	'review'       => 'Review / AggregateRating (from reviews tab)',
);
?>
<form method="post" action="options.php">
	<?php settings_fields( 'quasar_settings_group' ); ?>
	<table class="form-table quasar-form-table">
		<tr>
			<th>Auto-generate on save</th>
			<td>
				<label>
					<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[schema][auto_generate_on_save]" value="1" <?php checked( $sc['auto_generate_on_save'], true ); ?> />
					Automatically generate schema when a post/page is published or updated.
				</label>
			</td>
		</tr>
		<tr>
			<th>Enabled schema types</th>
			<td>
				<?php foreach ( $types as $key => $label ) : ?>
					<label style="display:block;margin-bottom:6px;">
						<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[schema][types_enabled][]" value="<?php echo esc_attr( $key ); ?>" <?php checked( in_array( $key, $sc['types_enabled'], true ) ); ?> />
						<?php echo esc_html( $label ); ?>
					</label>
				<?php endforeach; ?>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_openai_model">OpenAI Model</label></th>
			<td>
				<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
					<select id="quasar_openai_model" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[schema][openai_model]">
						<?php
						$models = quasar_get_models();
						// Ensure the currently selected model is always present in the list.
						if ( ! empty( $sc['openai_model'] ) && ! isset( $models[ $sc['openai_model'] ] ) ) {
							$models[ $sc['openai_model'] ] = $sc['openai_model'] . ' (saved)';
						}
						foreach ( $models as $id => $label ) :
							?>
							<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $sc['openai_model'], $id ); ?>><?php echo esc_html( $label ); ?></option>
						<?php endforeach; ?>
					</select>
					<button type="button" class="button" id="quasar-refresh-models">Refresh models</button>
					<span class="quasar-refresh-models-status" style="font-style:italic;"></span>
				</div>
				<p class="description">Default: <strong><?php echo esc_html( QUASAR_OPENAI_DEFAULT_MODEL ); ?></strong>. Click "Refresh models" to fetch the live list from OpenAI.</p>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_count">FAQ Questions per post</label></th>
			<td>
				<input type="number" min="2" max="10" id="quasar_faq_count" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[schema][faq_question_count]" value="<?php echo esc_attr( $sc['faq_question_count'] ); ?>" />
				<p class="description">Min 2, max 10.</p>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_max_chars">Max content chars sent to AI</label></th>
			<td>
				<input type="number" min="1000" step="500" id="quasar_max_chars" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[schema][max_content_chars]" value="<?php echo esc_attr( $sc['max_content_chars'] ); ?>" />
				<p class="description">Larger posts are truncated to this length before sending to OpenAI.</p>
			</td>
		</tr>
		<tr>
			<th>OpenAI connection</th>
			<td>
				<button type="button" class="button" id="quasar-test-openai">Test OpenAI connection</button>
				<span class="quasar-test-result"></span>
			</td>
		</tr>
	</table>
	<p class="submit quasar-submit-row">
		<?php submit_button( 'Save Schema Settings', 'primary', 'submit', false ); ?>
	</p>
</form>
