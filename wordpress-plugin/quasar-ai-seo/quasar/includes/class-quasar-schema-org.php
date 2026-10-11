<?php
/**
 * Organization / LocalBusiness schema generator.
 *
 * Core fields come from the company profile (no AI needed). AI is only used
 * to write a description / knowsAbout / slogan when missing.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_Schema_Org {

	/**
	 * Build the Organization node from the company profile.
	 *
	 * @param array $settings Plugin settings.
	 * @return array
	 */
	public static function build_from_profile( $settings ) {
		$c   = $settings['company'];
		$org = array(
			'@type' => $c['type'] ?: 'Organization',
			'@id'   => home_url() . '#organization',
			'name'  => $c['name'],
			'url'   => home_url(),
		);

		if ( $c['legal_name'] ) {
			$org['legalName'] = $c['legal_name'];
		}
		if ( $c['description'] ) {
			$org['description'] = $c['description'];
		}
		if ( $c['slogan'] ) {
			$org['slogan'] = $c['slogan'];
		}
		if ( $c['logo_url'] ) {
			$org['logo'] = array(
				'@type' => 'ImageObject',
				'url'   => $c['logo_url'],
			);
		}
		if ( $c['email'] ) {
			$org['email'] = $c['email'];
		}
		if ( $c['phone'] ) {
			$org['telephone'] = $c['phone'];
		}
		if ( $c['founding_date'] ) {
			$org['foundingDate'] = $c['founding_date'];
		}
		if ( $c['founder'] ) {
			$org['founder'] = array( '@type' => 'Person', 'name' => $c['founder'] );
		}
		if ( $c['employees'] ) {
			$org['numberOfEmployees'] = array( '@type' => 'QuantitativeValue', 'value' => $c['employees'] );
		}
		if ( ! empty( $c['sameAs'] ) ) {
			$org['sameAs'] = array_values( $c['sameAs'] );
		}

		// Address (only if any address field present).
		if ( $c['street'] || $c['city'] || $c['region'] || $c['postal_code'] || $c['country'] ) {
			$address = array( '@type' => 'PostalAddress' );
			if ( $c['street'] ) {
				$address['streetAddress'] = $c['street'];
			}
			if ( $c['city'] ) {
				$address['addressLocality'] = $c['city'];
			}
			if ( $c['region'] ) {
				$address['addressRegion'] = $c['region'];
			}
			if ( $c['postal_code'] ) {
				$address['postalCode'] = $c['postal_code'];
			}
			if ( $c['country'] ) {
				$address['addressCountry'] = $c['country'];
			}
			$org['address'] = $address;
		}

		return $org;
	}

	/**
	 * Generate the Organization node. Uses AI only to fill missing
	 * description / knowsAbout when description is empty.
	 *
	 * @param WP_Post $post     Post object (context for AI description).
	 * @param array   $settings Plugin settings.
	 * @return array|WP_Error
	 */
	public static function generate( $post, $settings ) {
		$org = self::build_from_profile( $settings );

		if ( empty( $org['name'] ) ) {
			return new WP_Error( 'quasar_org_no_name', 'Company name is required in settings.' );
		}

		// If description missing, ask AI to draft one from the company name + site.
		if ( empty( $org['description'] ) ) {
			$system = 'You are a brand copywriter. Write a concise factual organization description (max 160 chars) for schema.org. Return JSON: {"description":"...","knowsAbout":["..."]}.';
			$user   = 'Organization name: ' . $settings['company']['name'] . "\n"
				. 'Website: ' . home_url() . "\n"
				. 'Output language: ' . ( $settings['tone_language']['output_language'] ?? 'en' ) . "\n"
				. 'Tone: ' . ( $settings['tone_language']['tone'] ?? 'professional' );

			$result = Quasar_OpenAI_Client::chat( $system, $user, $settings['schema']['openai_model'] );
			if ( ! is_wp_error( $result ) ) {
				if ( ! empty( $result['description'] ) ) {
					$org['description'] = sanitize_textarea_field( $result['description'] );
				}
				if ( ! empty( $result['knowsAbout'] ) && is_array( $result['knowsAbout'] ) ) {
					$org['knowsAbout'] = array_map( 'sanitize_text_field', $result['knowsAbout'] );
				}
			}
		}

		return self::validate( $org ) ? $org : new WP_Error( 'quasar_org_invalid', 'Organization node failed validation.' );
	}

	/**
	 * Validate the Organization node.
	 *
	 * @param array $node Org node.
	 * @return bool
	 */
	public static function validate( $node ) {
		if ( empty( $node['@type'] ) ) {
			return false;
		}
		if ( empty( $node['name'] ) ) {
			return false;
		}
		if ( empty( $node['url'] ) ) {
			return false;
		}
		return true;
	}
}
