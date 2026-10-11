<?php
/**
 * Logger — optional debug log to wp-content/quasar-debug.log.
 *
 * Logging is gated by the QUASAR_DEBUG constant (define in wp-config.php).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Logger {

	/**
	 * Hook into WordPress (no-op unless debug is on).
	 */
	public static function init() {
		// Nothing to wire; logging is on-demand.
	}

	/**
	 * Write a line to the debug log.
	 *
	 * @param string $message Message.
	 */
	public static function log( $message ) {
		if ( ! defined( 'QUASAR_DEBUG' ) || ! QUASAR_DEBUG ) {
			return;
		}
		$log_file = WP_CONTENT_DIR . '/quasar-debug.log';
		$line     = '[' . gmdate( 'Y-m-d H:i:s' ) . '] ' . $message . "\n";
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents
		@file_put_contents( $log_file, $line, FILE_APPEND );
	}
}
