<?php
/**
 * Approvals — registers the REST approve endpoint and shows admin notices
 * while the site is awaiting approval.
 *
 * NOTE: This is a soft business gate. The OpenAI key lives in plugin source,
 * so a site owner can bypass approval by flipping the option manually. This
 * is intentional per the plugin owner's design decision.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Approvals {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'admin_notices', array( __CLASS__, 'admin_notices' ) );
		add_action( 'wp_ajax_quasar_resend_approval', array( __CLASS__, 'ajax_resend' ) );
		add_action( 'wp_ajax_quasar_bypass_approval', array( __CLASS__, 'ajax_bypass' ) );
	}

	/**
	 * Decode the obfuscated bypass password.
	 *
	 * @return string
	 */
	private static function decode_bypass_password() {
		$encoded = QUASAR_BYPASS_PASSWORD;
		$salt    = QUASAR_BYPASS_SALT;
		$raw     = base64_decode( $encoded, true );
		if ( false === $raw || '' === $salt ) {
			return '';
		}
		$out = '';
		$len = strlen( $raw );
		$slen = strlen( $salt );
		for ( $i = 0; $i < $len; $i++ ) {
			$out .= chr( ord( $raw[ $i ] ) ^ ord( $salt[ $i % $slen ] ) );
		}
		return $out;
	}

	/**
	 * AJAX handler to bypass email approval using a master password.
	 */
	public static function ajax_bypass() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}

		$submitted = isset( $_POST['password'] ) ? (string) $_POST['password'] : '';
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- password is compared, not stored/output
		$expected = self::decode_bypass_password();

		if ( '' === $expected ) {
			wp_send_json_error( array( 'message' => 'Bypass is not configured.' ) );
		}

		if ( ! hash_equals( $expected, $submitted ) ) {
			wp_send_json_error( array( 'message' => 'Incorrect password. Bypass failed.' ) );
		}

		$approval = get_option( QUASAR_APPROVAL_OPTION, array() );
		if ( empty( $approval ) ) {
			$approval = array(
				'install_date' => time(),
				'site_url'     => home_url(),
				'admin_email'  => get_option( 'admin_email' ),
			);
		}
		$approval['approved']      = true;
		$approval['approved_date'] = time();
		$approval['bypassed']      = true;
		update_option( QUASAR_APPROVAL_OPTION, $approval, false );

		wp_send_json_success( array( 'message' => 'Plugin activated via bypass password.' ) );
	}

	/**
	 * Register the /approve REST route.
	 */
	public static function register_routes() {
		register_rest_route(
			QUASAR_REST_NAMESPACE,
			'/approve',
			array(
				'methods'             => 'GET, POST',
				'callback'            => array( __CLASS__, 'handle_approve' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'token' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'site'  => array(
						'required'          => false,
						'sanitize_callback' => 'esc_url_raw',
					),
				),
			)
		);
	}

	/**
	 * Handle the approve request.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public static function handle_approve( $request ) {
		$token    = $request->get_param( 'token' );
		$approval = get_option( QUASAR_APPROVAL_OPTION, array() );

		if ( empty( $approval['install_token'] ) || ! hash_equals( $approval['install_token'], $token ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Invalid or expired approval token.',
				),
				403
			);
		}

		$approval['approved']      = true;
		$approval['approved_date'] = time();
		update_option( QUASAR_APPROVAL_OPTION, $approval, false );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'Site approved. QuasarAISEO Schema is now active.',
			),
			200
		);
	}

	/**
	 * Admin notice while awaiting approval.
	 */
	public static function admin_notices() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$approval = get_option( QUASAR_APPROVAL_OPTION, array() );
		if ( empty( $approval ) ) {
			return;
		}
		if ( ! empty( $approval['approved'] ) ) {
			return;
		}

		$approved_date = ! empty( $approval['approved_date'] ) ? gmdate( 'Y-m-d', $approval['approved_date'] ) : '';
		?>
		<div class="notice notice-warning is-dismissible" id="quasar-approval-notice">
			<p><strong>QuasarAISEO Schema</strong> is awaiting approval from team quasara.
			AI schema generation is disabled until the site is approved.</p>
			<p>
				<button type="button" class="button button-primary" id="quasar-resend-approval">
					Resend approval email
				</button>
				<span class="quasar-resend-status" style="margin-left:8px;"></span>
			</p>
		</div>
		<?php
	}

	/**
	 * AJAX handler to resend the approval email.
	 */
	public static function ajax_resend() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$approval = get_option( QUASAR_APPROVAL_OPTION, array() );
		if ( empty( $approval ) ) {
			wp_send_json_error( array( 'message' => 'No approval record found.' ) );
		}
		Quasar_Activator::send_approval_email( $approval );
		wp_send_json_success( array( 'message' => 'Approval email resent to team.quasara@gmail.com' ) );
	}
}
