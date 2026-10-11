<?php
/**
 * Settings tab: Status (approval status + resend + debug log viewer).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$approval = get_option( QUASAR_APPROVAL_OPTION, array() );
$approved = ! empty( $approval['approved'] );
$install_date  = ! empty( $approval['install_date'] ) ? gmdate( 'Y-m-d H:i:s', $approval['install_date'] ) . ' UTC' : '—';
$approved_date = ! empty( $approval['approved_date'] ) ? gmdate( 'Y-m-d H:i:s', $approval['approved_date'] ) . ' UTC' : '—';
$site_url      = $approval['site_url'] ?? home_url();
$admin_email   = $approval['admin_email'] ?? get_option( 'admin_email' );

$log_file = WP_CONTENT_DIR . '/quasar-debug.log';
$log      = file_exists( $log_file ) ? file_get_contents( $log_file ) : '';
?>
<div class="quasar-status-grid">
	<div class="quasar-status-item">
		<strong>Approval Status</strong>
		<span class="value <?php echo $approved ? 'quasar-status-yes' : 'quasar-status-no'; ?>">
			<?php echo $approved ? 'Approved' : 'Awaiting approval'; ?>
		</span>
	</div>
	<div class="quasar-status-item">
		<strong>Site URL</strong>
		<span class="value"><?php echo esc_html( $site_url ); ?></span>
	</div>
	<div class="quasar-status-item">
		<strong>Admin Email</strong>
		<span class="value"><?php echo esc_html( $admin_email ); ?></span>
	</div>
	<div class="quasar-status-item">
		<strong>Install Date</strong>
		<span class="value"><?php echo esc_html( $install_date ); ?></span>
	</div>
	<div class="quasar-status-item">
		<strong>Approved Date</strong>
		<span class="value"><?php echo esc_html( $approved_date ); ?></span>
	</div>
	<div class="quasar-status-item">
		<strong>Plugin Version</strong>
		<span class="value"><?php echo esc_html( QUASAR_VERSION ); ?></span>
	</div>
</div>

<p style="margin-top:20px;">
	<button type="button" class="button button-primary" id="quasar-resend-approval">
		Resend approval email to team.quasara@gmail.com
	</button>
	<span class="quasar-resend-status" style="margin-left:8px;"></span>
</p>

<?php if ( ! $approved ) : ?>
<div class="quasar-bypass-section">
	<h3>Bypass Email Verification</h3>
	<p class="description">If you have a master password from team quasara, enter it below to instantly activate the plugin without waiting for email approval.</p>
	<div class="quasar-bypass-form">
		<input type="password" id="quasar_bypass_password" class="quasar-bypass-input" placeholder="Enter master password" autocomplete="off" />
		<button type="button" class="button button-primary" id="quasar-bypass-btn">Activate</button>
		<span class="quasar-bypass-status"></span>
	</div>
</div>
<?php else : ?>
<div class="quasar-bypass-section quasar-bypass-done">
	<h3>Bypass Email Verification</h3>
	<p>Plugin is already active. No bypass needed.</p>
</div>
<?php endif; ?>

<?php if ( defined( 'QUASAR_DEBUG' ) && QUASAR_DEBUG && $log ) : ?>
	<h3>Debug Log</h3>
	<textarea class="quasar-json-editor" rows="14" readonly><?php echo esc_textarea( $log ); ?></textarea>
<?php endif; ?>
