<?php
/**
 * Internationalization — load textdomain + language list.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Quasar_I18n {

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'load_textdomain' ) );
	}

	/**
	 * Load the plugin textdomain.
	 */
	public static function load_textdomain() {
		load_plugin_textdomain( 'quasar-ai-seo', false, dirname( QUASAR_BASENAME ) . '/languages' );
	}

	/**
	 * Available output languages for AI generation.
	 *
	 * @return array code => label
	 */
	public static function languages() {
		return array(
			'en' => 'English',
			'es' => 'Spanish',
			'de' => 'German',
			'fr' => 'French',
			'it' => 'Italian',
			'pt' => 'Portuguese',
			'nl' => 'Dutch',
			'ru' => 'Russian',
			'ja' => 'Japanese',
			'zh' => 'Chinese',
			'ko' => 'Korean',
			'ar' => 'Arabic',
			'hi' => 'Hindi',
			'bn' => 'Bengali',
			'tr' => 'Turkish',
			'pl' => 'Polish',
			'sv' => 'Swedish',
			'no' => 'Norwegian',
			'da' => 'Danish',
			'fi' => 'Finnish',
			'cs' => 'Czech',
			'el' => 'Greek',
			'he' => 'Hebrew',
			'th' => 'Thai',
			'vi' => 'Vietnamese',
			'id' => 'Indonesian',
			'ms' => 'Malay',
			'uk' => 'Ukrainian',
			'ro' => 'Romanian',
			'hu' => 'Hungarian',
		);
	}

	/**
	 * Available tones.
	 *
	 * @return array
	 */
	public static function tones() {
		return array(
			'professional'  => 'Professional',
			'friendly'      => 'Friendly',
			'casual'        => 'Casual',
			'authoritative' => 'Authoritative',
			'conversational' => 'Conversational',
			'custom'        => 'Custom',
		);
	}

	/**
	 * Available answer lengths for AI-generated text (FAQ answers, descriptions).
	 * Each key maps to a word-count range used in the AI prompt.
	 *
	 * @return array {
	 *     @type string $label  Human-readable label.
	 *     @type int    $min    Minimum word count.
	 *     @type int    $max    Maximum word count.
	 * }
	 */
	public static function answer_lengths() {
		return array(
			'small'  => array( 'label' => 'Small  (20-30 words)',  'min' => 20, 'max' => 30 ),
			'medium' => array( 'label' => 'Medium (40-60 words)',  'min' => 40, 'max' => 60 ),
			'large'  => array( 'label' => 'Large  (80-120 words)', 'min' => 80, 'max' => 120 ),
		);
	}

	/**
	 * Get the word-count range for a given answer length key.
	 *
	 * @param string $key Answer length key (small|medium|large).
	 * @return array {min, max} Defaults to medium.
	 */
	public static function answer_length_range( $key ) {
		$lengths = self::answer_lengths();
		if ( isset( $lengths[ $key ] ) ) {
			return array( 'min' => $lengths[ $key ]['min'], 'max' => $lengths[ $key ]['max'] );
		}
		return array( 'min' => 40, 'max' => 60 ); // medium default
	}

	/**
	 * Available organization types.
	 *
	 * @return array
	 */
	public static function org_types() {
		return array(
			// General.
			'Organization'            => 'Organization (General)',
			'LocalBusiness'           => 'Local Business',
			'Corporation'             => 'Corporation',
			'OnlineStore'             => 'Online Store',
			'Store'                   => 'Store',
			// Real Estate.
			'RealEstateAgent'         => 'Real Estate Agent',
			'ApartmentComplex'        => 'Apartment Complex',
			// Tech / Software.
			'SoftwareApplication'     => 'Software Application',
			'WebSite'                 => 'Website / Web Service',
			'Project'                 => 'Software Project',
			// Professional Services.
			'ProfessionalService'     => 'Professional Service',
			'LegalService'            => 'Legal Service',
			'AccountingService'       => 'Accounting Service',
			'InsuranceAgency'         => 'Insurance Agency',
			'FinancialService'        => 'Financial Service',
			// Marketing / SEO.
			'AdvertisingAgency'       => 'Advertising Agency',
			'MarketingAgency'         => 'Marketing Agency (SEO / Digital)',
			// Education.
			'EducationalOrganization' => 'Educational Organization',
			'CollegeOrUniversity'     => 'College or University',
			'School'                  => 'School',
			// Health.
			'MedicalOrganization'     => 'Medical Organization',
			'Dentist'                 => 'Dentist',
			'Pharmacy'                => 'Pharmacy',
			'Physician'               => 'Physician / Doctor',
			'Hospital'                => 'Hospital',
			// Food & Hospitality.
			'Restaurant'              => 'Restaurant',
			'CafeOrCoffeeShop'        => 'Cafe or Coffee Shop',
			'BarOrPub'                => 'Bar or Pub',
			'Hotel'                   => 'Hotel',
			'BedAndBreakfast'         => 'Bed and Breakfast',
			// Travel.
			'Airline'                 => 'Airline',
			'TouristAttraction'       => 'Tourist Attraction',
			'TravelAgency'            => 'Travel Agency',
			// Entertainment.
			'SportsOrganization'      => 'Sports Organization',
			'MusicGroup'              => 'Music Group / Band',
			'TheaterGroup'            => 'Theater Group',
			'PerformingGroup'         => 'Performing Arts Group',
			// Non-profit / Gov.
			'NGO'                     => 'NGO / Non-profit',
			'GovernmentOrganization'  => 'Government Organization',
			'ReligiousOrganization'   => 'Religious Organization',
			// Home Services.
			'Electrician'             => 'Electrician',
			'Plumber'                 => 'Plumber',
			'HousePainter'            => 'House Painter',
			'RoofingContractor'       => 'Roofing Contractor',
			'Locksmith'               => 'Locksmith',
			// Automotive.
			'AutoRepair'              => 'Auto Repair',
			'AutoDealer'              => 'Auto Dealer',
			// Beauty & Fitness.
			'HealthAndBeautyBusiness' => 'Health & Beauty Business',
			'BeautySalon'             => 'Beauty Salon',
			'HealthClub'              => 'Health Club / Gym',
			'Spa'                     => 'Spa',
			// Other.
			'EmploymentAgency'        => 'Employment Agency',
			'ChildCare'               => 'Child Care',
			'PetStore'                => 'Pet Store',
			'VeterinaryCare'          => 'Veterinary Care',
			'Library'                 => 'Library',
			'Museum'                  => 'Museum',
		);
	}

	/**
	 * Social media platforms for the sameAs repeater.
	 * Provides preset suggestions the user can click to add quickly.
	 *
	 * @return array platform_key => {label, url_template}
	 */
	public static function social_platforms() {
		return array(
			'website'    => array( 'label' => 'Website',           'placeholder' => 'https://yoursite.com' ),
			'twitter'    => array( 'label' => 'Twitter / X',       'placeholder' => 'https://twitter.com/yourhandle' ),
			'facebook'   => array( 'label' => 'Facebook',          'placeholder' => 'https://facebook.com/yourpage' ),
			'instagram'  => array( 'label' => 'Instagram',         'placeholder' => 'https://instagram.com/yourhandle' ),
			'youtube'    => array( 'label' => 'YouTube',           'placeholder' => 'https://youtube.com/@yourchannel' ),
			'linkedin'   => array( 'label' => 'LinkedIn (Company)','placeholder' => 'https://linkedin.com/company/yourcompany' ),
			'linkedin_me'=> array( 'label' => 'LinkedIn (Personal)','placeholder'=> 'https://linkedin.com/in/yourprofile' ),
			'tiktok'     => array( 'label' => 'TikTok',            'placeholder' => 'https://tiktok.com/@yourhandle' ),
			'pinterest'  => array( 'label' => 'Pinterest',         'placeholder' => 'https://pinterest.com/yourhandle' ),
			'github'     => array( 'label' => 'GitHub',            'placeholder' => 'https://github.com/yourorg' ),
			'gitlab'     => array( 'label' => 'GitLab',            'placeholder' => 'https://gitlab.com/yourorg' ),
			'medium'     => array( 'label' => 'Medium',            'placeholder' => 'https://medium.com/@yourhandle' ),
			'reddit'     => array( 'label' => 'Reddit',            'placeholder' => 'https://reddit.com/user/yourusername' ),
			'quora'      => array( 'label' => 'Quora',             'placeholder' => 'https://quora.com/profile/yourprofile' ),
			'tumblr'     => array( 'label' => 'Tumblr',            'placeholder' => 'https://yourblog.tumblr.com' ),
			'vimeo'      => array( 'label' => 'Vimeo',             'placeholder' => 'https://vimeo.com/yourchannel' ),
			'dribbble'   => array( 'label' => 'Dribbble',          'placeholder' => 'https://dribbble.com/yourhandle' ),
			'behance'    => array( 'label' => 'Behance',           'placeholder' => 'https://behance.net/yourhandle' ),
			'flickr'     => array( 'label' => 'Flickr',            'placeholder' => 'https://flickr.com/people/yourhandle' ),
			'soundcloud' => array( 'label' => 'SoundCloud',        'placeholder' => 'https://soundcloud.com/yourhandle' ),
			'spototify'  => array( 'label' => 'Spotify',           'placeholder' => 'https://open.spotify.com/artist/yourid' ),
			'telegram'   => array( 'label' => 'Telegram',          'placeholder' => 'https://t.me/yourhandle' ),
			'whatsapp'   => array( 'label' => 'WhatsApp',          'placeholder' => 'https://wa.me/yournumber' ),
			'discord'    => array( 'label' => 'Discord',           'placeholder' => 'https://discord.gg/yourinvite' ),
			'threads'    => array( 'label' => 'Threads',           'placeholder' => 'https://threads.net/@yourhandle' ),
			'mastodon'   => array( 'label' => 'Mastodon',          'placeholder' => 'https://mastodon.social/@yourhandle' ),
			'bluesky'    => array( 'label' => 'Bluesky',           'placeholder' => 'https://bsky.app/profile/yourhandle' ),
			'xing'       => array( 'label' => 'Xing',              'placeholder' => 'https://xing.com/profile/yourprofile' ),
			'crunchbase' => array( 'label' => 'Crunchbase',        'placeholder' => 'https://crunchbase.com/organization/yourorg' ),
			'clutch'     => array( 'label' => 'Clutch',            'placeholder' => 'https://clutch.co/profile/yourcompany' ),
			'yelp'       => array( 'label' => 'Yelp',              'placeholder' => 'https://yelp.com/biz/yourbusiness' ),
			'trustpilot' => array( 'label' => 'Trustpilot',        'placeholder' => 'https://trustpilot.com/review/yoursite.com' ),
			'gmb'        => array( 'label' => 'Google Business',   'placeholder' => 'https://g.page/yourbusiness' ),
			'wikipedia'  => array( 'label' => 'Wikipedia',         'placeholder' => 'https://en.wikipedia.org/wiki/YourTopic' ),
			'podcast'    => array( 'label' => 'Podcast (Apple)',   'placeholder' => 'https://podcasts.apple.com/podcast/yourpodcast' ),
		);
	}
}
