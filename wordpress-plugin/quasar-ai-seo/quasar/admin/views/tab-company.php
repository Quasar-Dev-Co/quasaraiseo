<?php
/**
 * Settings tab: Company Profile.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$s     = quasar_get_settings();
$c     = $s['company'];
$types = Quasar_I18n::org_types();
?>
<form method="post" action="options.php">
	<?php settings_fields( 'quasar_settings_group' ); ?>
	<input type="hidden" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][website]" value="<?php echo esc_attr( $c['website'] ); ?>" />
	<table class="form-table quasar-form-table">
		<tr>
			<th><label for="quasar_company_name">Organization Name *</label></th>
			<td><input type="text" id="quasar_company_name" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][name]" value="<?php echo esc_attr( $c['name'] ); ?>" required /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_legal_name">Legal Name</label></th>
			<td><input type="text" id="quasar_company_legal_name" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][legal_name]" value="<?php echo esc_attr( $c['legal_name'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_type">Organization Type</label></th>
			<td>
				<select id="quasar_company_type" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][type]">
					<?php foreach ( $types as $value => $label ) : ?>
						<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $c['type'], $value ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_company_description">Description</label></th>
			<td><textarea id="quasar_company_description" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][description]"><?php echo esc_textarea( $c['description'] ); ?></textarea></td>
		</tr>
		<tr>
			<th><label for="quasar_company_slogan">Slogan</label></th>
			<td><input type="text" id="quasar_company_slogan" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][slogan]" value="<?php echo esc_attr( $c['slogan'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_logo_url">Logo URL</label></th>
			<td>
				<input type="url" id="quasar_company_logo_url" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][logo_url]" value="<?php echo esc_attr( $c['logo_url'] ); ?>" />
				<button type="button" class="button quasar-upload-logo" style="vertical-align:top;">Choose</button>
				<div class="quasar-logo-preview"><?php echo $c['logo_url'] ? '<img src="' . esc_url( $c['logo_url'] ) . '" alt="" />' : ''; ?></div>
			</td>
		</tr>
		<tr>
			<th><label for="quasar_company_street">Street Address</label></th>
			<td><input type="text" id="quasar_company_street" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][street]" value="<?php echo esc_attr( $c['street'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_city">City</label></th>
			<td><input type="text" id="quasar_company_city" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][city]" value="<?php echo esc_attr( $c['city'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_region">Region / State</label></th>
			<td><input type="text" id="quasar_company_region" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][region]" value="<?php echo esc_attr( $c['region'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_postal_code">Postal Code</label></th>
			<td><input type="text" id="quasar_company_postal_code" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][postal_code]" value="<?php echo esc_attr( $c['postal_code'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_country">Country</label></th>
			<td><input type="text" id="quasar_company_country" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][country]" value="<?php echo esc_attr( $c['country'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_phone">Phone</label></th>
			<td><input type="text" id="quasar_company_phone" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][phone]" value="<?php echo esc_attr( $c['phone'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_email">Email</label></th>
			<td><input type="email" id="quasar_company_email" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][email]" value="<?php echo esc_attr( $c['email'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_founding_date">Founding Date</label></th>
			<td><input type="text" id="quasar_company_founding_date" placeholder="YYYY-MM-DD" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][founding_date]" value="<?php echo esc_attr( $c['founding_date'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_founder">Founder</label></th>
			<td><input type="text" id="quasar_company_founder" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][founder]" value="<?php echo esc_attr( $c['founder'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label for="quasar_company_employees">Number of Employees</label></th>
			<td><input type="text" id="quasar_company_employees" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][employees]" value="<?php echo esc_attr( $c['employees'] ); ?>" /></td>
		</tr>
		<tr>
			<th><label>Social Profiles (sameAs)</label></th>
			<td>
				<div class="quasar-repeater">
					<div class="quasar-repeater-rows">
						<?php if ( ! empty( $c['sameAs'] ) ) : foreach ( $c['sameAs'] as $url ) : ?>
							<div class="quasar-repeater-row">
								<input type="url" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][sameAs][]" value="<?php echo esc_attr( $url ); ?>" placeholder="https://twitter.com/yourorg" />
								<a href="#" class="quasar-repeater-remove">&times;</a>
							</div>
						<?php endforeach; else : ?>
							<div class="quasar-repeater-row">
								<input type="url" name="<?php echo esc_attr( QUASAR_OPTION ); ?>[company][sameAs][]" value="" placeholder="https://twitter.com/yourorg" />
								<a href="#" class="quasar-repeater-remove">&times;</a>
							</div>
						<?php endif; ?>
					</div>
					<a href="#" class="quasar-repeater-add button button-small">+ Add custom profile</a>
				</div>

				<div class="quasar-social-presets">
					<p class="description" style="margin-bottom:8px;">Quick add — click a platform to add it to the list:</p>
					<div class="quasar-social-chips">
						<?php
						$platforms = Quasar_I18n::social_platforms();
						foreach ( $platforms as $key => $info ) :
							?>
							<button type="button" class="button button-small quasar-social-chip"
								data-placeholder="<?php echo esc_attr( $info['placeholder'] ); ?>">
								<?php echo esc_html( $info['label'] ); ?>
							</button>
						<?php endforeach; ?>
					</div>
				</div>
			</td>
		</tr>
	</table>
	<p class="submit quasar-submit-row">
		<?php submit_button( 'Save Company Profile', 'primary', 'submit', false ); ?>
	</p>
</form>
