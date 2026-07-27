<?php
/**
 * REST API endpoints for Quasar AI SEO Assistant plugin.
 * Allows the Quasar backend to verify connection, fetch posts, and publish content.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('Quasar_REST')) {
class Quasar_REST {

    private static $instance = null;
    private $namespace = 'quasar-ai-seo/v1';

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // Verify connection token
        register_rest_route($this->namespace, '/verify', [
            'methods'  => 'GET',
            'callback' => [$this, 'verify_connection'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Get site info
        register_rest_route($this->namespace, '/site-info', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_site_info'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Get published posts
        register_rest_route($this->namespace, '/posts', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_posts'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Publish a post
        register_rest_route($this->namespace, '/posts', [
            'methods'  => 'POST',
            'callback' => [$this, 'publish_post'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Update a post
        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', [
            'methods'  => 'PATCH',
            'callback' => [$this, 'update_post'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Delete a post
        register_rest_route($this->namespace, '/posts/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'delete_post'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Get categories
        register_rest_route($this->namespace, '/categories', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_categories'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Mark connection as established
        register_rest_route($this->namespace, '/connect', [
            'methods'  => 'POST',
            'callback' => [$this, 'establish_connection'],
            'permission_callback' => [$this, 'check_token'],
        ]);

        // Disconnect
        register_rest_route($this->namespace, '/disconnect', [
            'methods'  => 'POST',
            'callback' => [$this, 'disconnect_connection'],
            'permission_callback' => [$this, 'check_token'],
        ]);
    }

    /**
     * Check if the request has a valid token.
     */
    public function check_token($request) {
        $token = $request->get_header('x_quasar_token');
        if (empty($token)) {
            $token = $request->get_param('token');
        }
        $core = Quasar_Core::get_instance();
        return $core->verify_token($token);
    }

    /**
     * Verify connection - returns site info.
     */
    public function verify_connection($request) {
        $core = Quasar_Core::get_instance();
        return rest_ensure_response([
            'success'   => true,
            'site_info' => $core->get_site_info(),
        ]);
    }

    /**
     * Get site info.
     */
    public function get_site_info($request) {
        $core = Quasar_Core::get_instance();
        return rest_ensure_response($core->get_site_info());
    }

    /**
     * Establish connection - mark as connected and generate app password.
     */
    public function establish_connection($request) {
        $core = Quasar_Core::get_instance();
        $password = $core->get_or_create_app_password();

        if (!$password) {
            return new WP_Error(
                'app_password_failed',
                'Failed to create Application Password. Ensure WordPress 5.6+ and Application Passwords are enabled.',
                ['status' => 500]
            );
        }

        $core->set_connection_status('connected');

        $user_id = (int) get_option('quasar_user_id', 0);
        $user = get_userdata($user_id);

        return rest_ensure_response([
            'success'      => true,
            'site_url'     => home_url(),
            'site_name'    => get_bloginfo('name'),
            'username'     => $user ? $user->user_login : '',
            'app_password' => $password,
        ]);
    }

    /**
     * Disconnect - remove app password and connection status.
     */
    public function disconnect_connection($request) {
        $core = Quasar_Core::get_instance();
        $core->set_connection_status('disconnected');

        $user_id = (int) get_option('quasar_user_id', 0);
        $user = get_userdata($user_id);

        if ($user && function_exists('wp_delete_application_password')) {
            $passwords = WP_Application_Passwords::get_user_application_passwords($user_id);
            foreach ($passwords as $pass) {
                if (strpos($pass['name'], 'Quasar AI SEO') !== false) {
                    wp_delete_application_password($user_id, $pass['uuid']);
                }
            }
        }

        delete_option('quasar_app_password');

        return rest_ensure_response(['success' => true]);
    }

    /**
     * Get posts with optional filtering.
     */
    public function get_posts($request) {
        $per_page = (int) $request->get_param('per_page') ?: 10;
        $page = (int) $request->get_param('page') ?: 1;
        $status = $request->get_param('status') ?: 'any';
        $search = $request->get_param('search');

        $args = [
            'post_type'      => 'post',
            'post_status'    => $status === 'any' ? ['publish', 'draft', 'pending', 'future'] : $status,
            'posts_per_page' => min($per_page, 100),
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ];

        if (!empty($search)) {
            $args['s'] = $search;
        }

        $query = new WP_Query($args);
        $posts = [];

        foreach ($query->posts as $post) {
            $posts[] = [
                'id'            => $post->ID,
                'title'         => $post->post_title,
                'status'        => $post->post_status,
                'date'          => $post->post_date,
                'modified'      => $post->post_modified,
                'excerpt'       => get_the_excerpt($post),
                'permalink'     => get_permalink($post->ID),
                'author'        => get_the_author_meta('display_name', $post->post_author),
                'featured_img'  => get_the_post_thumbnail_url($post->ID, 'medium') ?: null,
                'categories'    => wp_get_post_categories($post->ID, ['fields' => 'names']),
                'quasar_post'   => (bool) get_post_meta($post->ID, '_quasar_ai_seo_post', true),
            ];
        }

        return rest_ensure_response([
            'posts'       => $posts,
            'total'       => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
            'page'        => $page,
        ]);
    }

    /**
     * Publish a post from Quasar AI SEO.
     */
    public function publish_post($request) {
        $params = json_decode($request->get_body(), true);

        $title       = isset($params['title']) ? sanitize_text_field($params['title']) : '';
        $content     = isset($params['content']) ? wp_kses_post($params['content']) : '';
        $excerpt     = isset($params['excerpt']) ? sanitize_text_field($params['excerpt']) : '';
        $status      = isset($params['status']) ? sanitize_text_field($params['status']) : 'draft';
        $categories  = isset($params['categories']) ? (array) $params['categories'] : [];
        $tags        = isset($params['tags']) ? (array) $params['tags'] : [];
        $featured_img = isset($params['featured_image']) ? esc_url_raw($params['featured_image']) : '';
        $scheduled   = isset($params['scheduled_date']) ? sanitize_text_field($params['scheduled_date']) : '';

        if (empty($title) || empty($content)) {
            return new WP_Error(
                'missing_fields',
                'Title and content are required.',
                ['status' => 400]
            );
        }

        $post_data = [
            'post_title'   => $title,
            'post_content' => $content,
            'post_excerpt' => $excerpt,
            'post_status'  => $status,
            'post_type'    => 'post',
        ];

        // Handle scheduled posts
        if (!empty($scheduled) && $status === 'future') {
            $post_data['post_date'] = $scheduled;
            $post_data['post_date_gmt'] = get_gmt_from_date($scheduled);
        }

        $post_id = wp_insert_post($post_data, true);

        if (is_wp_error($post_id)) {
            return new WP_Error(
                'insert_failed',
                $post_id->get_error_message(),
                ['status' => 500]
            );
        }

        // Mark as Quasar post
        update_post_meta($post_id, '_quasar_ai_seo_post', true);
        update_post_meta($post_id, '_quasar_created_at', current_time('mysql'));

        // Set categories
        if (!empty($categories)) {
            $cat_ids = [];
            foreach ($categories as $cat_name) {
                $cat = get_term_by('name', $cat_name, 'category');
                if (!$cat) {
                    $cat = wp_insert_term($cat_name, 'category');
                    if (!is_wp_error($cat)) {
                        $cat_ids[] = (int) $cat['term_id'];
                    }
                } else {
                    $cat_ids[] = (int) $cat->term_id;
                }
            }
            if (!empty($cat_ids)) {
                wp_set_post_categories($post_id, $cat_ids);
            }
        }

        // Set tags
        if (!empty($tags)) {
            wp_set_post_tags($post_id, $tags, true);
        }

        // Handle featured image
        if (!empty($featured_img)) {
            $this->sideload_featured_image($post_id, $featured_img);
        }

        $post = get_post($post_id);

        return rest_ensure_response([
            'success'   => true,
            'post_id'   => $post_id,
            'post'      => [
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'status'    => $post->post_status,
                'date'      => $post->post_date,
                'permalink' => get_permalink($post_id),
            ],
        ]);
    }

    /**
     * Update a post.
     */
    public function update_post($request) {
        $post_id = (int) $request['id'];
        $params = json_decode($request->get_body(), true);

        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('not_found', 'Post not found.', ['status' => 404]);
        }

        $post_data = ['ID' => $post_id];

        if (isset($params['title'])) {
            $post_data['post_title'] = sanitize_text_field($params['title']);
        }
        if (isset($params['content'])) {
            $post_data['post_content'] = wp_kses_post($params['content']);
        }
        if (isset($params['status'])) {
            $post_data['post_status'] = sanitize_text_field($params['status']);
        }
        if (isset($params['excerpt'])) {
            $post_data['post_excerpt'] = sanitize_text_field($params['excerpt']);
        }

        $result = wp_update_post($post_data, true);

        if (is_wp_error($result)) {
            return new WP_Error('update_failed', $result->get_error_message(), ['status' => 500]);
        }

        $post = get_post($post_id);
        return rest_ensure_response([
            'success' => true,
            'post'    => [
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'status'    => $post->post_status,
                'date'      => $post->post_date,
                'permalink' => get_permalink($post_id),
            ],
        ]);
    }

    /**
     * Delete a post.
     */
    public function delete_post($request) {
        $post_id = (int) $request['id'];
        $force = $request->get_param('force') === 'true';

        $result = wp_delete_post($post_id, $force);

        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete post.', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true]);
    }

    /**
     * Get categories.
     */
    public function get_categories($request) {
        $categories = get_categories([
            'taxonomy'   => 'category',
            'hide_empty' => false,
            'number'     => 100,
        ]);

        $result = [];
        foreach ($categories as $cat) {
            $result[] = [
                'id'   => (int) $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'count' => (int) $cat->count,
            ];
        }

        return rest_ensure_response(['categories' => $result]);
    }

    /**
     * Sideload a featured image from a URL.
     */
    private function sideload_featured_image($post_id, $image_url) {
        if (!function_exists('media_sideload_image')) {
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $attachment_id = media_sideload_image($image_url, $post_id, null, 'id');

        if (!is_wp_error($attachment_id)) {
            set_post_thumbnail($post_id, $attachment_id);
        }
    }
}
} // end class_exists guard
