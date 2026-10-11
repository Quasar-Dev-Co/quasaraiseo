<?php
/**
 * Settings tab: FAQ Display — frontend appearance of the FAQ section.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$s  = quasar_get_settings();
$fd = $s['faq_display'];

// Get public post types for the "show on" checkboxes.
$all_types = get_post_types( array( 'public' => true ), 'objects' );
$exclude  = array( 'attachment' );
?>
<form method="post" action="options.php">
	<?php settings_fields( 'quasar_settings_group' ); ?>
	<table class="form-table quasar-form-table">
		<tr>
			<th>Enable FAQ display</th>
			<td>
				<label>
					<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][enabled]" value="1" <?php checked( $fd['enabled'], true ); ?> />
					Show the FAQ section under post content on the frontend.
				</label>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_title">FAQ Section Title</label></th>
			<td>
				<input type="text" id="quasar_faq_title" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][section_title]" value="<?php echo esc_attr( $fd['section_title'] ); ?>" />
				<p class="description">This heading appears above the FAQ accordion. You can also override it per-post in the meta box.</p>
			</td>
		</tr>
		<tr>
			<th>Show on post types</th>
			<td>
				<?php foreach ( $all_types as $slug => $obj ) :
					if ( in_array( $slug, $exclude, true ) ) { continue; }
					?>
					<label style="display:inline-block;margin-right:16px;">
						<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][show_on][]" value="<?php echo esc_attr( $slug ); ?>" <?php checked( in_array( $slug, $fd['show_on'], true ) ); ?> />
						<?php echo esc_html( $obj->labels->name ); ?>
					</label>
				<?php endforeach; ?>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_layout">Layout Style</label></th>
			<td>
				<select id="quasar_faq_layout" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][layout]">
					<option value="boxed" <?php selected( $fd['layout'], 'boxed' ); ?>>Boxed (cards with borders)</option>
					<option value="flat" <?php selected( $fd['layout'], 'flat' ); ?>>Flat (no card borders)</option>
					<option value="minimal" <?php selected( $fd['layout'], 'minimal' ); ?>>Minimal (underline only)</option>
				</select>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_icon">Expand Icon</label></th>
			<td>
				<select id="quasar_faq_icon" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][expand_icon]">
					<option value="chevron" <?php selected( $fd['expand_icon'], 'chevron' ); ?>>Chevron (v)</option>
					<option value="plus" <?php selected( $fd['expand_icon'], 'plus' ); ?>>Plus (+)</option>
					<option value="arrow" <?php selected( $fd['expand_icon'], 'arrow' ); ?>>Arrow (>)</option>
				</select>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_primary">Primary / Accent Color</label></th>
			<td>
				<input type="color" id="quasar_faq_primary" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][primary_color]" value="<?php echo esc_attr( $fd['primary_color'] ); ?>" class="quasar-color-picker" />
				<p class="description">Used for the title, icons, and active question highlight.</p>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_bg">Background Color</label></th>
			<td>
				<input type="color" id="quasar_faq_bg" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][bg_color]" value="<?php echo esc_attr( $fd['bg_color'] ); ?>" class="quasar-color-picker" />
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_text">Question Text Color</label></th>
			<td>
				<input type="color" id="quasar_faq_text" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][text_color]" value="<?php echo esc_attr( $fd['text_color'] ); ?>" class="quasar-color-picker" />
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_answer">Answer Text Color</label></th>
			<td>
				<input type="color" id="quasar_faq_answer" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][answer_color]" value="<?php echo esc_attr( $fd['answer_color'] ); ?>" class="quasar-color-picker" />
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_border">Border Color</label></th>
			<td>
				<input type="color" id="quasar_faq_border" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][border_color]" value="<?php echo esc_attr( $fd['border_color'] ); ?>" class="quasar-color-picker" />
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_radius">Border Radius (px)</label></th>
			<td>
				<input type="number" min="0" max="30" id="quasar_faq_radius" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][border_radius]" value="<?php echo esc_attr( $fd['border_radius'] ); ?>" />
				<p class="description">Rounded corners on FAQ cards (0 = sharp, 30 = very round).</p>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_faq_fontsize">Font Size (px)</label></th>
			<td>
				<input type="number" min="12" max="24" id="quasar_faq_fontsize" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][font_size]" value="<?php echo esc_attr( $fd['font_size'] ); ?>" />
			</td>
		</tr>
		<tr>
			<th>First FAQ open by default</th>
			<td>
				<label>
					<input type="checkbox" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[faq_display][first_open]" value="1" <?php checked( $fd['first_open'], true ); ?> />
					Automatically expand the first FAQ question when the page loads.
				</label>
			</td>
		</tr>
	</table>

	<h3 style="margin-top:24px;">Live Preview</h3>
	<div class="quasar-faq-preview" id="quasar-faq-preview">
		<div class="quasar-faq-section quasar-faq-layout-boxed" style="--quasar-primary:#6b46c1; --quasar-bg:#f8f6fc; --quasar-text:#333; --quasar-answer:#555; --quasar-border:#e0d8f0; --quasar-radius:8px; --quasar-fs:16px;">
			<h2 class="quasar-faq-title" style="color: var(--quasar-primary);">Frequently Asked Questions</h2>
			<div class="quasar-faq-item">
				<div class="quasar-faq-question" style="color: var(--quasar-text);">
					<span>What is this plugin about?</span>
					<span class="quasar-faq-icon quasar-faq-icon-chevron">⌄</span>
				</div>
				<div class="quasar-faq-answer" style="color: var(--quasar-answer);">
					<p>This is a preview of how your FAQ section will look on the frontend. The colors and layout update when you save.</p>
				</div>
			</div>
			<div class="quasar-faq-item">
				<div class="quasar-faq-question" style="color: var(--quasar-text);">
					<span>Can I customize the colors?</span>
					<span class="quasar-faq-icon quasar-faq-icon-chevron">⌄</span>
				</div>
				<div class="quasar-faq-answer" style="color: var(--quasar-answer);">
					<p>Yes! Use the color pickers above and save to see your changes reflected on the frontend.</p>
				</div>
			</div>
		</div>
	</div>

	<p class="submit quasar-submit-row">
		<?php submit_button( 'Save FAQ Display Settings', 'primary', 'submit', false ); ?>
	</p>
</form>

<script>
jQuery(function($){
	// Live preview update when color pickers / inputs change.
	function updatePreview() {
		var primary = $('#quasar_faq_primary').val();
		var bg = $('#quasar_faq_bg').val();
		var text = $('#quasar_faq_text').val();
		var answer = $('#quasar_faq_answer').val();
		var border = $('#quasar_faq_border').val();
		var radius = $('#quasar_faq_radius').val();
		var fs = $('#quasar_faq_fontsize').val();
		var title = $('#quasar_faq_title').val() || 'Frequently Asked Questions';
		var layout = $('#quasar_faq_layout').val();
		var icon = $('#quasar_faq_icon').val();

		var $section = $('#quasar-faq-preview .quasar-faq-section');
		$section.css({
			'--quasar-primary': primary,
			'--quasar-bg': bg,
			'--quasar-text': text,
			'--quasar-answer': answer,
			'--quasar-border': border,
			'--quasar-radius': radius + 'px',
			'--quasar-fs': fs + 'px'
		});
		$section.attr('class', 'quasar-faq-section quasar-faq-layout-' + layout);
		$section.find('.quasar-faq-title').text(title).css('color', primary);
		$section.find('.quasar-faq-icon').attr('class', 'quasar-faq-icon quasar-faq-icon-' + icon);
		$section.find('.quasar-faq-icon').text(icon === 'plus' ? '+' : (icon === 'arrow' ? '›' : '⌄'));
	}

	$('.quasar-color-picker, #quasar_faq_radius, #quasar_faq_fontsize, #quasar_faq_title, #quasar_faq_layout, #quasar_faq_icon').on('input change', updatePreview);

	// Preview accordion behavior.
	$(document).on('click', '#quasar-faq-preview .quasar-faq-question', function(){
		$(this).parent().toggleClass('quasar-faq-active');
		$(this).next('.quasar-faq-answer').slideToggle(200);
	});
});
</script>
