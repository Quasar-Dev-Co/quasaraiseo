<?php
/**
 * Constants class — holds the OpenAI API key and endpoint.
 *
 * The API key is stored XOR-encrypted + base64-encoded so it does not
 * appear as plaintext in the source. It is decoded at runtime via
 * quasar_decode_key().
 *
 * NOTE: This is obfuscation, not real encryption — a determined user
 * with the plugin source can still recover the key by tracing the
 * decode function. For true protection, proxy AI requests through a
 * server you control. Rotate the key periodically and monitor usage
 * at https://platform.openai.com/usage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Decode the obfuscated API key.
 *
 * @return string The plaintext OpenAI API key.
 */
function quasar_decode_key() {
	// XOR cipher salt (kept separate from the encoded blob).
	$salt = 'quasara_team_2026_secret_salt_x9k2';

	// The API key, XOR-encrypted with the salt, then base64-encoded.
	$encoded = 'Ah5MAxMdC3I1SDdaOmVlcAQ0ADc0CAc6CTgyXjhqVWYvfwI+AxgyKFQOISclLGZ5QV99GB4UBEsvECcXGC4YDU18LgMhORI9IwEDM0I2CQ9rfmQBdDMRDiU4Dx0oKgIZESVVTQNFCzg7HjFFGSgiMSAIFkR4BVkNFjAMAicBHDYHFjs0Dk0RSBoPDAZRQzINQwQVGihjdENsOzkQUhk9FjcLCi0=';

	$raw     = base64_decode( $encoded );
	$decoded = '';
	$slen    = strlen( $salt );
	for ( $i = 0, $n = strlen( $raw ); $i < $n; $i++ ) {
		$decoded .= chr( ord( $raw[ $i ] ) ^ ord( $salt[ $i % $slen ] ) );
	}
	return $decoded;
}

if ( ! defined( 'QUASAR_OPENAI_API_KEY' ) ) {
	define( 'QUASAR_OPENAI_API_KEY', quasar_decode_key() );
}

if ( ! defined( 'QUASAR_OPENAI_ENDPOINT' ) ) {
	define( 'QUASAR_OPENAI_ENDPOINT', 'https://api.openai.com/v1/chat/completions' );
}

if ( ! defined( 'QUASAR_OPENAI_MODELS_ENDPOINT' ) ) {
	define( 'QUASAR_OPENAI_MODELS_ENDPOINT', 'https://api.openai.com/v1/models' );
}

if ( ! defined( 'QUASAR_OPENAI_DEFAULT_MODEL' ) ) {
	define( 'QUASAR_OPENAI_DEFAULT_MODEL', 'gpt-5.6-luna' );
}

if ( ! defined( 'QUASAR_MODEL_TRANSIENT' ) ) {
	define( 'QUASAR_MODEL_TRANSIENT', 'quasar_openai_models' );
}

if ( ! defined( 'QUASAR_MODEL_TRANSIENT_EXPIRY' ) ) {
	define( 'QUASAR_MODEL_TRANSIENT_EXPIRY', 12 * HOUR_IN_SECONDS );
}

if ( ! defined( 'QUASAR_OPENAI_DEFAULT_TEMP' ) ) {
	define( 'QUASAR_OPENAI_DEFAULT_TEMP', 0.3 );
}

/**
 * Bypass password — allows instant activation without waiting for email approval.
 * Stored XOR-encrypted + base64-encoded (same approach as the API key).
 * Note: this is obfuscation, not real encryption. Anyone with the plugin source
 * can recover the password. This is a soft gate, not a security boundary.
 */
if ( ! defined( 'QUASAR_BYPASS_PASSWORD' ) ) {
	define( 'QUASAR_BYPASS_PASSWORD', 'Q0VRQ1BDUGciKAM=' );
}
if ( ! defined( 'QUASAR_BYPASS_SALT' ) ) {
	define( 'QUASAR_BYPASS_SALT', 'quasara_bypass_2026_x9k2' );
}
