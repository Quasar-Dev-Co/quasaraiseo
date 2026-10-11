<?php
/**
 * Activator — runs on plugin activation/deactivation.
 *
 * On activation: generate an install token, store the (unapproved) approval
 * record, and email an approval request to team.quasara@gmail.com with an
 * Approve button linking to the plugin's REST approve endpoint.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Activator {

	/**
	 * Activation handler.
	 */
	public static function activate() {
		// Don't re-create the approval record if it already exists (re-activation).
		$existing = get_option( QUASAR_APPROVAL_OPTION, array() );
		if ( empty( $existing ) ) {
			$token = wp_generate_password( 32, false );
			$approval = array(
				'approved'      => false,
				'install_token' => $token,
				'install_date'  => time(),
				'approved_date' => '',
				'site_url'      => home_url(),
				'admin_email'   => get_option( 'admin_email' ),
			);
			update_option( QUASAR_APPROVAL_OPTION, $approval, false );
		} else {
			$approval = $existing;
		}

		// Schedule cron hook if not already scheduled.
		if ( ! wp_next_scheduled( QUASAR_CRON_HOOK ) ) {
			wp_schedule_event( time() + 60, 'hourly', QUASAR_CRON_HOOK );
		}

		// Send the approval email.
		self::send_approval_email( $approval );

		// Default settings if none exist.
		if ( false === get_option( QUASAR_OPTION, false ) ) {
			update_option( QUASAR_OPTION, array(), false );
		}
		if ( false === get_option( QUASAR_REVIEWS_OPTION, false ) ) {
			update_option( QUASAR_REVIEWS_OPTION, array(), false );
		}

		flush_rewrite_rules();
	}

	/**
	 * Deactivation handler.
	 */
	public static function deactivate() {
		$timestamp = wp_next_scheduled( QUASAR_CRON_HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, QUASAR_CRON_HOOK );
		}
		wp_clear_scheduled_hook( QUASAR_CRON_HOOK );
		flush_rewrite_rules();
	}

	/**
	 * Send the approval request email to team.quasara@gmail.com.
	 *
	 * @param array $approval Approval record.
	 */
	public static function send_approval_email( $approval ) {
		$to      = 'team.quasara@gmail.com';
		$subject = 'QuasarAISEO Schema — New Site Approval Request';

		$approve_url = add_query_arg(
			array(
				'token' => rawurlencode( $approval['install_token'] ),
				'site'  => rawurlencode( $approval['site_url'] ),
			),
			rest_url( QUASAR_REST_NAMESPACE . '/approve' )
		);

		$message  = '<html><body style="font-family:Arial,sans-serif;font-size:14px;color:#222;">';
		$message .= '<h2 style="color:#6b46c1;">QuasarAISEO Schema — New Install</h2>';
		$message .= '<p>A new website has installed the QuasarAISEO Schema plugin and is awaiting approval.</p>';
		$message .= '<table style="border-collapse:collapse;margin:12px 0;">';
		$message .= '<tr><td style="padding:6px 12px;background:#f3f3f3;font-weight:bold;">Site URL</td><td style="padding:6px 12px;">' . esc_html( $approval['site_url'] ) . '</td></tr>';
		$message .= '<tr><td style="padding:6px 12px;background:#f3f3f3;font-weight:bold;">Admin Email</td><td style="padding:6px 12px;">' . esc_html( $approval['admin_email'] ) . '</td></tr>';
		$message .= '<tr><td style="padding:6px 12px;background:#f3f3f3;font-weight:bold;">Installed</td><td style="padding:6px 12px;">' . esc_html( gmdate( 'Y-m-d H:i:s', $approval['install_date'] ) ) . ' UTC</td></tr>';
		$message .= '</table>';
		$message .= '<p style="margin:24px 0;">';
		$message .= '<a href="' . esc_url( $approve_url ) . '" style="background:#6b46c1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">Approve this site</a>';
		$message .= '</p>';
		$message .= '<p style="color:#888;font-size:12px;">If you did not expect this install, you can safely ignore this email.</p>';
		$message .= '</body></html>';

		$headers = array( 'Content-Type: text/html; charset=UTF-8' );

		wp_mail( $to, $subject, $message, $headers );
	}
}
