<?php
/**
 * OpenAI client — wraps wp_remote_post calls to the chat completions endpoint.
 *
 * Returns decoded JSON arrays (response_format: json_object) or WP_Error.
 * Includes automatic fallback to a known-valid model if the selected model
 * is rejected by OpenAI (HTTP 400).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_OpenAI_Client {

	/**
	 * Fallback model — a known-valid OpenAI model used when the configured
	 * model returns HTTP 400 (invalid/unknown model).
	 */
	const FALLBACK_MODEL = 'gpt-4o-mini';

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'wp_ajax_quasar_test_openai', array( __CLASS__, 'ajax_test_connection' ) );
		add_action( 'wp_ajax_quasar_refresh_models', array( __CLASS__, 'ajax_refresh_models' ) );
	}

	/**
	 * AJAX: test the OpenAI connection.
	 */
	public static function ajax_test_connection() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		// Clear any stale cached models before testing.
		delete_transient( QUASAR_MODEL_TRANSIENT );
		$result = self::test_connection();
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		wp_send_json_success( array( 'message' => 'Connection OK — API key is valid.' ) );
	}

	/**
	 * Call the OpenAI chat completions endpoint.
	 *
	 * If the selected model returns HTTP 400, automatically retries with
	 * the fallback model (gpt-4o-mini).
	 *
	 * @param string $system      System prompt.
	 * @param string $user        User prompt.
	 * @param string $model       Model name.
	 * @param float  $temperature Temperature.
	 * @return array|WP_Error Decoded JSON array or WP_Error.
	 */
	public static function chat( $system, $user, $model = '', $temperature = null ) {
		if ( ! quasar_is_approved() ) {
			return new WP_Error( 'quasar_not_approved', 'Site is not approved yet.' );
		}

		$settings    = quasar_get_settings();
		$model       = $model ? $model : ( $settings['schema']['openai_model'] ?: QUASAR_OPENAI_DEFAULT_MODEL );
		$temperature = null === $temperature ? QUASAR_OPENAI_DEFAULT_TEMP : $temperature;

		$result = self::raw_chat( $system, $user, $model, $temperature );

		// If 400 (bad model), retry with fallback model.
		if ( is_wp_error( $result ) && 'quasar_openai_http' === $result->get_error_code() ) {
			$error_data = $result->get_error_data();
			$http_code  = is_array( $error_data ) ? ( $error_data['http_code'] ?? 0 ) : 0;

			if ( 400 === (int) $http_code ) {
				Quasar_Logger::log( "OpenAI 400 for model '$model' — retrying with fallback '" . self::FALLBACK_MODEL . "'" );
				$result = self::raw_chat( $system, $user, self::FALLBACK_MODEL, $temperature );
			}
		}

		return $result;
	}

	/**
	 * Low-level chat call — sends the request and parses the response.
	 *
	 * @param string $system      System prompt.
	 * @param string $user        User prompt.
	 * @param string $model       Model name.
	 * @param float  $temperature Temperature.
	 * @return array|WP_Error
	 */
	protected static function raw_chat( $system, $user, $model, $temperature ) {
		$body = array(
			'model'       => $model,
			'messages'    => array(
				array( 'role' => 'system', 'content' => $system ),
				array( 'role' => 'user',   'content' => $user ),
			),
			'temperature' => $temperature,
			'response_format' => array( 'type' => 'json_object' ),
		);

		$response = wp_remote_post(
			QUASAR_OPENAI_ENDPOINT,
			array(
				'timeout' => 60,
				'headers' => array(
					'Authorization' => 'Bearer ' . QUASAR_OPENAI_API_KEY,
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			Quasar_Logger::log( 'OpenAI request failed: ' . $response->get_error_message() );
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$raw  = wp_remote_retrieve_body( $response );

		if ( $code < 200 || $code >= 300 ) {
			Quasar_Logger::log( "OpenAI HTTP $code (model: $model): $raw" );

			// Parse OpenAI's error message for a user-friendly message.
			$friendly = self::extract_error_message( $raw, $code );
			return new WP_Error(
				'quasar_openai_http',
				$friendly,
				array( 'http_code' => $code, 'raw' => $raw )
			);
		}

		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) ) {
			Quasar_Logger::log( 'OpenAI: invalid outer JSON: ' . $raw );
			return new WP_Error( 'quasar_openai_json', 'OpenAI returned invalid JSON.' );
		}

		$content = $decoded['choices'][0]['message']['content'] ?? '';
		if ( '' === $content ) {
			Quasar_Logger::log( 'OpenAI: empty content. Full response: ' . $raw );
			return new WP_Error( 'quasar_openai_empty', 'OpenAI returned empty content.' );
		}

		$parsed = json_decode( $content, true );
		if ( ! is_array( $parsed ) ) {
			Quasar_Logger::log( 'OpenAI: content not JSON. Content: ' . $content );
			return new WP_Error( 'quasar_openai_content_json', 'OpenAI content was not valid JSON.' );
		}

		return $parsed;
	}

	/**
	 * Extract a user-friendly error message from an OpenAI error response.
	 *
	 * @param string $raw Raw response body.
	 * @param int    $code HTTP status code.
	 * @return string
	 */
	protected static function extract_error_message( $raw, $code ) {
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) && ! empty( $decoded['error']['message'] ) ) {
			$msg = $decoded['error']['message'];
			// Truncate very long error messages.
			if ( strlen( $msg ) > 300 ) {
				$msg = substr( $msg, 0, 300 ) . '...';
			}
			return "OpenAI HTTP $code: $msg";
		}
		return "OpenAI returned HTTP $code.";
	}

	/**
	 * Quick connection test. Uses the fallback model (gpt-4o-mini) which
	 * is guaranteed to exist, so the test validates the API key without
	 * being affected by an invalid model selection.
	 *
	 * @return bool|WP_Error
	 */
	public static function test_connection() {
		$result = self::raw_chat(
			'You are a JSON responder. Reply with valid JSON only.',
			'Reply with {"status":"ok"}.',
			self::FALLBACK_MODEL,
			0.0
		);
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return true;
	}

	/**
	 * Fetch the list of available models from OpenAI's /v1/models endpoint.
	 *
	 * @return array|WP_Error model_id => label
	 */
	public static function fetch_models() {
		$response = wp_remote_get(
			QUASAR_OPENAI_MODELS_ENDPOINT,
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Bearer ' . QUASAR_OPENAI_API_KEY,
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			Quasar_Logger::log( 'OpenAI models fetch failed: ' . $response->get_error_message() );
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$raw  = wp_remote_retrieve_body( $response );

		if ( $code < 200 || $code >= 300 ) {
			Quasar_Logger::log( "OpenAI models HTTP $code: $raw" );
			$friendly = self::extract_error_message( $raw, $code );
			return new WP_Error( 'quasar_openai_models_http', $friendly );
		}

		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) || empty( $decoded['data'] ) ) {
			Quasar_Logger::log( 'OpenAI models: invalid response: ' . $raw );
			return new WP_Error( 'quasar_openai_models_json', 'OpenAI returned invalid models response.' );
		}

		// Build id => label map for all models (don't filter — show everything
		// available to this API key so the user sees the real list).
		$models = array();
		foreach ( $decoded['data'] as $m ) {
			$id = $m['id'] ?? '';
			if ( ! $id ) {
				continue;
			}
			$models[ $id ] = $id;
		}

		// Sort alphabetically.
		ksort( $models );

		if ( empty( $models ) ) {
			return new WP_Error( 'quasar_openai_models_empty', 'No models found in the OpenAI response.' );
		}

		return $models;
	}

	/**
	 * AJAX: refresh the models list from OpenAI and cache in transient.
	 */
	public static function ajax_refresh_models() {
		check_ajax_referer( 'quasar_admin_nonce', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
		}
		$models = self::fetch_models();
		if ( is_wp_error( $models ) ) {
			wp_send_json_error( array( 'message' => $models->get_error_message() ) );
		}
		set_transient( QUASAR_MODEL_TRANSIENT, $models, QUASAR_MODEL_TRANSIENT_EXPIRY );
		wp_send_json_success(
			array(
				'message' => sprintf( 'Found %d models.', count( $models ) ),
				'models'  => $models,
			)
		);
	}
}
