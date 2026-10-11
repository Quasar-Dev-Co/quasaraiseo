<?php
/**
 * Settings tab: Tone & Language.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$s    = quasar_get_settings();
$tl   = $s['tone_language'];
$tones = Quasar_I18n::tones();
$langs = Quasar_I18n::languages();
$lengths = Quasar_I18n::answer_lengths();
?>
<form method="post" action="options.php">
	<?php settings_fields( 'quasar_settings_group' ); ?>
	<table class="form-table quasar-form-table">
		<tr>
			<th><label for="quasar_tone">Tone</label></th>
			<td>
				<select id="quasar_tone" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[tone_language][tone]">
					<?php foreach ( $tones as $value => $label ) : ?>
						<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $tl['tone'], $value ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr id="quasar-custom-tone-row" style="<?php echo 'custom' === $tl['tone'] ? '' : 'display:none;'; ?>">
			<th><label for="quasar_custom_tone">Custom Tone</label></th>
			<td><input type="text" id="quasar_custom_tone" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[tone_language][custom_tone]" value="<?php echo esc_attr( $tl['custom_tone'] ); ?>" placeholder="e.g. witty and technical" /></td>
		</tr>
		<tr>
			<th><label for="quasar_language">Output Language</label></th>
			<td>
				<select id="quasar_language" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[tone_language][output_language]">
					<?php foreach ( $langs as $code => $label ) : ?>
						<option value="<?php echo esc_attr( $code ); ?>" <?php selected( $tl['output_language'], $code ); ?>><?php echo esc_html( $label ); ?> (<?php echo esc_html( $code ); ?>)</option>
					<?php endforeach; ?>
				</select>
				<p class="description">AI-generated schema text (FAQ answers, descriptions) will be written in this language.</p>
			</td>
		</tr>
		<tr>
			<th>Respect WordPress locale</th>
			<td>
				<label>
					<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[tone_language][respect_wp_locale]" value="1" <?php checked( $tl['respect_wp_locale'], true ); ?> />
					Override the language above with the site's WordPress locale (<?php echo esc_html( get_locale() ); ?>).
				</label>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_answer_length">Answer Length</label></th>
			<td>
				<select id="quasar_answer_length" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[tone_language][answer_length]">
					<?php foreach ( $lengths as $value => $info ) : ?>
						<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $tl['answer_length'], $value ); ?>>
							<?php echo esc_html( $info['label'] ); ?>
						</option>
					<?php endforeach; ?>
				</select>
				<p class="description">Controls how long AI-generated FAQ answers and descriptions are. Small = concise, Large = detailed.</p>
			</td>
		</tr>
	</table>
	<p class="submit quasar-submit-row">
		<?php submit_button( 'Save Tone & Language', 'primary', 'submit', false ); ?>
	</p>
</form>

<script>
jQuery(function($){
	$('#quasar_tone').on('change', function(){
		$('#quasar-custom-tone-row').toggle( $(this).val() === 'custom' );
	});
});
</script>
