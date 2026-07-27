<?php
/**
 * Plugin Name: Quasar AI SEO
 * Description: Connect your WordPress site with Quasar AI SEO to publish AI-generated content directly from your Quasar dashboard.
 * Version: 2.0.0
 * Author: Quasar AI SEO
 * Author URI: https://seo.quasarasoft.com
 * License: GPL-2.0+
 * Text Domain: quasar-ai-seo
 */

if (!defined('ABSPATH')) {
    exit;
}

define('QUASAR_VERSION', '2.0.0');
define('QUASAR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('QUASAR_PLUGIN_URL', plugin_dir_url(__FILE__));
define('QUASAR_API_URL', 'https://seo.teamcmp.cloud');
define('QUASAR_FRONTEND_URL', 'https://seo.quasarasoft.com');

// Activation: generate token and store admin user ID
register_activation_hook(__FILE__, function () {
    $token = get_option('quasar_connection_token', '');
    if (empty($token)) {
        $token = wp_generate_password(64, false, false);
        update_option('quasar_connection_token', $token);
    }
    update_option('quasar_connection_status', 'disconnected');
    // Store the activating admin user's ID for REST API app password creation
    $user_id = get_current_user_id();
    if ($user_id) {
        update_option('quasar_user_id', $user_id);
    }
});

// Deactivation: cleanup
register_deactivation_hook(__FILE__, function () {
    delete_option('quasar_connection_token');
    delete_option('quasar_connection_status');
    delete_option('quasar_app_password');
    delete_option('quasar_app_password_id');
    delete_option('quasar_user_id');
});

// REST API endpoints
add_action('rest_api_init', function () {
    $namespace = 'quasar-ai-seo/v1';

    register_rest_route($namespace, '/verify', [
        'methods'  => 'GET',
        'callback' => function ($request) {
            return rest_ensure_response([
                'success'   => true,
                'site_info' => quasar_get_site_info(),
            ]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/site-info', [
        'methods'  => 'GET',
        'callback' => function ($request) {
            return rest_ensure_response(quasar_get_site_info());
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/posts', [
        'methods'  => 'GET',
        'callback' => function ($request) {
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
                    'id'           => $post->ID,
                    'title'        => $post->post_title,
                    'status'       => $post->post_status,
                    'date'         => $post->post_date,
                    'modified'     => $post->post_modified,
                    'excerpt'      => get_the_excerpt($post),
                    'permalink'    => get_permalink($post->ID),
                    'author'       => get_the_author_meta('display_name', $post->post_author),
                    'featured_img' => get_the_post_thumbnail_url($post->ID, 'medium') ?: null,
                    'categories'   => wp_get_post_categories($post->ID, ['fields' => 'names']),
                    'quasar_post'  => (bool) get_post_meta($post->ID, '_quasar_ai_seo_post', true),
                ];
            }

            return rest_ensure_response([
                'posts'       => $posts,
                'total'       => (int) $query->found_posts,
                'total_pages' => (int) $query->max_num_pages,
                'page'        => $page,
            ]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/posts', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $params = json_decode($request->get_body(), true);

            $title   = isset($params['title']) ? sanitize_text_field($params['title']) : '';
            $content = isset($params['content']) ? wp_kses_post($params['content']) : '';
            $excerpt = isset($params['excerpt']) ? sanitize_text_field($params['excerpt']) : '';
            $status  = isset($params['status']) ? sanitize_text_field($params['status']) : 'draft';
            $categories = isset($params['categories']) ? (array) $params['categories'] : [];
            $tags    = isset($params['tags']) ? (array) $params['tags'] : [];
            $featured_img = isset($params['featured_image']) ? esc_url_raw($params['featured_image']) : '';
            $scheduled = isset($params['scheduled_date']) ? sanitize_text_field($params['scheduled_date']) : '';

            if (empty($title) || empty($content)) {
                return new WP_Error('missing_fields', 'Title and content are required.', ['status' => 400]);
            }

            $post_data = [
                'post_title'   => $title,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
                'post_status'  => $status,
                'post_type'    => 'post',
            ];

            if (!empty($scheduled) && $status === 'future') {
                $post_data['post_date'] = $scheduled;
                $post_data['post_date_gmt'] = get_gmt_from_date($scheduled);
            }

            $post_id = wp_insert_post($post_data, true);

            if (is_wp_error($post_id)) {
                return new WP_Error('insert_failed', $post_id->get_error_message(), ['status' => 500]);
            }

            update_post_meta($post_id, '_quasar_ai_seo_post', true);
            update_post_meta($post_id, '_quasar_created_at', current_time('mysql'));

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

            if (!empty($tags)) {
                wp_set_post_tags($post_id, $tags, true);
            }

            if (!empty($featured_img)) {
                if (!function_exists('media_sideload_image')) {
                    require_once ABSPATH . 'wp-admin/includes/media.php';
                    require_once ABSPATH . 'wp-admin/includes/file.php';
                    require_once ABSPATH . 'wp-admin/includes/image.php';
                }
                $attachment_id = media_sideload_image($featured_img, $post_id, null, 'id');
                if (!is_wp_error($attachment_id)) {
                    set_post_thumbnail($post_id, $attachment_id);
                }
            }

            $post = get_post($post_id);

            return rest_ensure_response([
                'success' => true,
                'post_id' => $post_id,
                'post'    => [
                    'id'        => $post->ID,
                    'title'     => $post->post_title,
                    'status'    => $post->post_status,
                    'date'      => $post->post_date,
                    'permalink' => get_permalink($post_id),
                ],
            ]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/posts/(?P<id>\\d+)', [
        'methods'  => 'PATCH',
        'callback' => function ($request) {
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
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/posts/(?P<id>\\d+)', [
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $force = $request->get_param('force') === 'true';

            $result = wp_delete_post($post_id, $force);

            if (!$result) {
                return new WP_Error('delete_failed', 'Failed to delete post.', ['status' => 500]);
            }

            return rest_ensure_response(['success' => true]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/categories', [
        'methods'  => 'GET',
        'callback' => function ($request) {
            $categories = get_categories([
                'taxonomy'   => 'category',
                'hide_empty' => false,
                'number'     => 100,
            ]);

            $result = [];
            foreach ($categories as $cat) {
                $result[] = [
                    'id'    => (int) $cat->term_id,
                    'name'  => $cat->name,
                    'slug'  => $cat->slug,
                    'count' => (int) $cat->count,
                ];
            }

            return rest_ensure_response(['categories' => $result]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/connect', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $password = quasar_get_or_create_app_password();

            if (!$password) {
                return new WP_Error(
                    'app_password_failed',
                    'Failed to create Application Password. Ensure WordPress 5.6+ and Application Passwords are enabled.',
                    ['status' => 500]
                );
            }

            update_option('quasar_connection_status', 'connected');

            $user_id = (int) get_option('quasar_user_id', 0);
            $user = get_userdata($user_id);

            return rest_ensure_response([
                'success'      => true,
                'site_url'     => home_url(),
                'site_name'    => get_bloginfo('name'),
                'username'     => $user ? $user->user_login : '',
                'app_password' => $password,
            ]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);

    register_rest_route($namespace, '/disconnect', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            update_option('quasar_connection_status', 'disconnected');

            $user_id = (int) get_option('quasar_user_id', 0);

            if ($user_id && function_exists('wp_delete_application_password') && class_exists('WP_Application_Passwords')) {
                $passwords = WP_Application_Passwords::get_user_application_passwords($user_id);
                foreach ($passwords as $pass) {
                    if (strpos($pass['name'], 'Quasar AI SEO') !== false) {
                        wp_delete_application_password($user_id, $pass['uuid']);
                    }
                }
            }

            delete_option('quasar_app_password');

            return rest_ensure_response(['success' => true]);
        },
        'permission_callback' => function ($request) {
            return quasar_check_token($request);
        },
    ]);
});

// Admin menu
add_action('admin_menu', function () {
    add_menu_page(
        'Quasar AI SEO',
        'Quasar AI SEO',
        'manage_options',
        'quasar-dashboard',
        'quasar_render_dashboard',
        'dashicons-chart-area',
        30
    );

    add_submenu_page(
        'quasar-dashboard',
        'Connection Settings',
        'Settings',
        'manage_options',
        'quasar-settings',
        'quasar_render_settings'
    );
});

// Enqueue assets
add_action('admin_enqueue_scripts', function ($hook) {
    if (strpos($hook, 'quasar-') === false) {
        return;
    }
    wp_enqueue_style('quasar-admin', QUASAR_PLUGIN_URL . 'assets/css/admin.css', [], QUASAR_VERSION);
    wp_enqueue_script('quasar-admin', QUASAR_PLUGIN_URL . 'assets/js/admin.js', ['jquery'], QUASAR_VERSION, true);
    wp_localize_script('quasar-admin', 'quasarData', [
        'apiUrl'      => QUASAR_API_URL,
        'frontendUrl' => QUASAR_FRONTEND_URL,
        'siteUrl'     => home_url(),
        'token'       => get_option('quasar_connection_token', ''),
        'connected'   => get_option('quasar_connection_status', 'disconnected') === 'connected',
        'nonce'       => wp_create_nonce('quasar_admin'),
    ]);
});

// Helper functions
function quasar_check_token($request) {
    $token = $request->get_header('x_quasar_token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }
    $stored = get_option('quasar_connection_token', '');
    return !empty($stored) && !empty($token) && hash_equals($stored, $token);
}

function quasar_get_site_info() {
    return [
        'site_url'    => home_url(),
        'site_name'   => get_bloginfo('name'),
        'site_desc'   => get_bloginfo('description'),
        'wp_version'  => get_bloginfo('version'),
        'language'    => get_bloginfo('language'),
        'timezone'    => wp_timezone_string(),
        'admin_email' => get_option('admin_email'),
        'connected'   => get_option('quasar_connection_status', 'disconnected') === 'connected',
        'token'       => get_option('quasar_connection_token', ''),
    ];
}

function quasar_get_or_create_app_password() {
    $existing = get_option('quasar_app_password', '');
    $existing_id = get_option('quasar_app_password_id', 0);

    if (!empty($existing) && $existing_id) {
        $user_id = (int) get_option('quasar_user_id', 0);
        if ($user_id && class_exists('WP_Application_Passwords')) {
            $app_passwords = WP_Application_Passwords::get_user_application_passwords($user_id);
            foreach ($app_passwords as $ap) {
                if ((int) $ap['uuid'] === (int) $existing_id) {
                    return $existing;
                }
            }
        }
    }

    // Use stored admin user ID (REST API has no logged-in user)
    $user_id = (int) get_option('quasar_user_id', 0);
    if (!$user_id) {
        // Fallback: try current user, then admin user (ID 1)
        $user_id = get_current_user_id();
        if (!$user_id) {
            $admin = get_users(['role' => 'administrator', 'number' => 1]);
            if (!empty($admin)) {
                $user_id = $admin[0]->ID;
            }
        }
    }
    if (!$user_id) {
        return false;
    }

    if (!class_exists('WP_Application_Passwords')) {
        return false;
    }

    $result = WP_Application_Passwords::create_new_application_password($user_id, [
        'name' => 'Quasar AI SEO Assistant',
    ]);

    if (is_wp_error($result)) {
        return false;
    }

    $password = $result[1];
    $uuid = $result[0]['uuid'];

    update_option('quasar_app_password', $password);
    update_option('quasar_app_password_id', $uuid);
    update_option('quasar_user_id', $user_id);

    return $password;
}

function quasar_render_dashboard() {
    $connected = get_option('quasar_connection_status', 'disconnected') === 'connected';
    $token = get_option('quasar_connection_token', '');

    $quasar_posts = [];
    $total_published = 0;
    $total_drafts = 0;
    $total_scheduled = 0;

    if ($connected) {
        $args = [
            'post_type'      => 'post',
            'post_status'    => ['publish', 'draft', 'future'],
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'meta_key'       => '_quasar_ai_seo_post',
            'meta_value'     => '1',
        ];
        $query = new WP_Query($args);

        foreach ($query->posts as $post) {
            $quasar_posts[] = [
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'status'    => $post->post_status,
                'date'      => $post->post_date,
                'permalink' => get_permalink($post->ID),
                'excerpt'   => get_the_excerpt($post),
            ];

            if ($post->post_status === 'publish') $total_published++;
            if ($post->post_status === 'draft') $total_drafts++;
            if ($post->post_status === 'future') $total_scheduled++;
        }
    }

    $all_posts_count = wp_count_posts('post');
    $total_all_published = (int) $all_posts_count->publish;
    $total_all_drafts = (int) $all_posts_count->draft;
    $total_all_scheduled = (int) $all_posts_count->future;

    ?>
    <div class="wrap quasar-wrap">
        <div class="quasar-header">
            <div class="quasar-header-left">
                <h1>Quasar AI SEO Dashboard</h1>
                <p class="quasar-subtitle">Manage your AI-generated content and WordPress connection</p>
            </div>
            <div class="quasar-header-right">
                <?php if ($connected): ?>
                    <span class="quasar-badge quasar-badge-connected">
                        <span class="quasar-dot quasar-dot-green"></span>
                        Connected to Quasar AI SEO
                    </span>
                <?php else: ?>
                    <span class="quasar-badge quasar-badge-disconnected">
                        <span class="quasar-dot quasar-dot-red"></span>
                        Not Connected
                    </span>
                <?php endif; ?>
            </div>
        </div>

        <?php if (!$connected): ?>
            <div class="quasar-card quasar-connect-card">
                <div class="quasar-connect-icon">
                    <span class="dashicons dashicons-admin-links"></span>
                </div>
                <h2>Connect to Quasar AI SEO</h2>
                <p>Click the button below to open Quasar AI SEO and complete the connection. This will enable one-click publishing of AI-generated content directly to your site.</p>

                <div class="quasar-token-box">
                    <label>Connection Token</label>
                    <code class="quasar-token"><?php echo esc_html($token); ?></code>
                    <button type="button" class="quasar-btn quasar-btn-outline quasar-btn-sm" id="quasar-copy-token" data-token="<?php echo esc_attr($token); ?>">
                        Copy Token
                    </button>
                </div>

                <?php
                $connect_url = add_query_arg([
                    'siteUrl' => rawurlencode(home_url()),
                    'token'   => rawurlencode($token),
                ], QUASAR_FRONTEND_URL . '/wordpress');
                ?>
                <a id="quasar-connect-btn" href="<?php echo esc_url($connect_url); ?>" target="_blank" class="quasar-btn quasar-btn-primary">
                    <span class="dashicons dashicons-admin-plugins"></span>
                    Connect to Quasar AI SEO
                </a>
                <p class="quasar-connect-help">
                    Don't have a Quasar AI SEO account? <a href="<?php echo esc_url(QUASAR_FRONTEND_URL . '/signup'); ?>" target="_blank">Sign up free</a>
                </p>
            </div>
        <?php else: ?>
            <div class="quasar-stats-grid">
                <div class="quasar-stat-card">
                    <div class="quasar-stat-icon quasar-stat-icon-blue">
                        <span class="dashicons dashicons-megaphone"></span>
                    </div>
                    <div class="quasar-stat-content">
                        <div class="quasar-stat-value"><?php echo esc_html($total_published); ?></div>
                        <div class="quasar-stat-label">Published Posts</div>
                    </div>
                </div>
                <div class="quasar-stat-card">
                    <div class="quasar-stat-icon quasar-stat-icon-orange">
                        <span class="dashicons dashicons-edit-page"></span>
                    </div>
                    <div class="quasar-stat-content">
                        <div class="quasar-stat-value"><?php echo esc_html($total_drafts); ?></div>
                        <div class="quasar-stat-label">Draft Posts</div>
                    </div>
                </div>
                <div class="quasar-stat-card">
                    <div class="quasar-stat-icon quasar-stat-icon-purple">
                        <span class="dashicons dashicons-clock"></span>
                    </div>
                    <div class="quasar-stat-content">
                        <div class="quasar-stat-value"><?php echo esc_html($total_scheduled); ?></div>
                        <div class="quasar-stat-label">Scheduled Posts</div>
                    </div>
                </div>
                <div class="quasar-stat-card">
                    <div class="quasar-stat-icon quasar-stat-icon-green">
                        <span class="dashicons dashicons-analytics"></span>
                    </div>
                    <div class="quasar-stat-content">
                        <div class="quasar-stat-value"><?php echo esc_html(count($quasar_posts)); ?></div>
                        <div class="quasar-stat-label">Total Quasar Posts</div>
                    </div>
                </div>
            </div>

            <div class="quasar-card">
                <div class="quasar-card-header">
                    <h2>Posts Published via Quasar AI SEO</h2>
                    <a href="<?php echo esc_url(QUASAR_FRONTEND_URL . '/post-create'); ?>" target="_blank" class="quasar-btn quasar-btn-primary quasar-btn-sm">
                        <span class="dashicons dashicons-plus-alt"></span>
                        Create New Post
                    </a>
                </div>
                <?php if (empty($quasar_posts)): ?>
                    <div class="quasar-empty-state">
                        <span class="dashicons dashicons-welcome-write-blog"></span>
                        <h3>No posts yet</h3>
                        <p>Posts created from Quasar AI SEO will appear here.</p>
                        <a href="<?php echo esc_url(QUASAR_FRONTEND_URL . '/post-create'); ?>" target="_blank" class="quasar-btn quasar-btn-primary">
                            Create Your First Post
                        </a>
                    </div>
                <?php else: ?>
                    <table class="quasar-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($quasar_posts as $p): ?>
                                <tr>
                                    <td class="quasar-post-title">
                                        <a href="<?php echo esc_url($p['permalink']); ?>" target="_blank"><?php echo esc_html($p['title']); ?></a>
                                    </td>
                                    <td>
                                        <?php
                                        $status_class = $p['status'] === 'publish' ? 'quasar-status-published' : ($p['status'] === 'future' ? 'quasar-status-scheduled' : 'quasar-status-draft');
                                        $status_label = $p['status'] === 'publish' ? 'Published' : ($p['status'] === 'future' ? 'Scheduled' : 'Draft');
                                        ?>
                                        <span class="quasar-status-badge <?php echo esc_attr($status_class); ?>"><?php echo esc_html($status_label); ?></span>
                                    </td>
                                    <td><?php echo esc_html(date('M j, Y', strtotime($p['date']))); ?></td>
                                    <td>
                                        <a href="<?php echo esc_url(get_edit_post_link($p['id'])); ?>" class="quasar-btn quasar-btn-sm quasar-btn-outline">Edit</a>
                                        <a href="<?php echo esc_url($p['permalink']); ?>" target="_blank" class="quasar-btn quasar-btn-sm quasar-btn-outline">View</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>

            <div class="quasar-card">
                <div class="quasar-card-header">
                    <h2>Site Overview</h2>
                </div>
                <div class="quasar-overview-grid">
                    <div class="quasar-overview-item">
                        <span class="dashicons dashicons-megaphone"></span>
                        <span class="quasar-overview-value"><?php echo esc_html($total_all_published); ?></span>
                        <span class="quasar-overview-label">Total Published</span>
                    </div>
                    <div class="quasar-overview-item">
                        <span class="dashicons dashicons-edit-page"></span>
                        <span class="quasar-overview-value"><?php echo esc_html($total_all_drafts); ?></span>
                        <span class="quasar-overview-label">Total Drafts</span>
                    </div>
                    <div class="quasar-overview-item">
                        <span class="dashicons dashicons-clock"></span>
                        <span class="quasar-overview-value"><?php echo esc_html($total_all_scheduled); ?></span>
                        <span class="quasar-overview-label">Total Scheduled</span>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
    <?php
}

function quasar_render_settings() {
    $connected = get_option('quasar_connection_status', 'disconnected') === 'connected';
    $token = get_option('quasar_connection_token', '');

    ?>
    <div class="wrap quasar-wrap">
        <h1>Quasar AI SEO Settings</h1>

        <div class="quasar-card">
            <div class="quasar-card-header">
                <h2>Connection Details</h2>
            </div>
            <table class="form-table">
                <tr>
                    <th scope="row">Connection Status</th>
                    <td>
                        <?php if ($connected): ?>
                            <span class="quasar-badge quasar-badge-connected">
                                <span class="quasar-dot quasar-dot-green"></span>
                                Connected
                            </span>
                        <?php else: ?>
                            <span class="quasar-badge quasar-badge-disconnected">
                                <span class="quasar-dot quasar-dot-red"></span>
                                Not Connected
                            </span>
                        <?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Site URL</th>
                    <td><code><?php echo esc_html(home_url()); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">Site Name</th>
                    <td><?php echo esc_html(get_bloginfo('name')); ?></td>
                </tr>
                <tr>
                    <th scope="row">Connection Token</th>
                    <td><code class="quasar-token"><?php echo esc_html($token); ?></code></td>
                </tr>
                <tr>
                    <th scope="row">REST API Endpoint</th>
                    <td><code><?php echo esc_url(rest_url('quasar-ai-seo/v1')); ?></code></td>
                </tr>
            </table>
        </div>

        <?php if ($connected): ?>
            <div class="quasar-card">
                <div class="quasar-card-header">
                    <h2>Disconnect</h2>
                </div>
                <p>Disconnecting will remove the connection between this site and your Quasar AI SEO account. You can reconnect at any time.</p>
                <button id="quasar-disconnect-btn" class="quasar-btn quasar-btn-danger">
                    Disconnect from Quasar AI SEO
                </button>
            </div>
        <?php endif; ?>

        <div class="quasar-card">
            <div class="quasar-card-header">
                <h2>About Quasar AI SEO</h2>
            </div>
            <p>Quasar AI SEO is a comprehensive SEO platform that helps you audit websites, track rankings, and generate AI-powered content. With this plugin, you can publish AI-generated blog posts directly to your WordPress site with one click.</p>
            <p>
                <a href="<?php echo esc_url(QUASAR_FRONTEND_URL); ?>" target="_blank" class="quasar-btn quasar-btn-primary">Visit Quasar AI SEO</a>
                <a href="<?php echo esc_url(QUASAR_FRONTEND_URL . '/post-create'); ?>" target="_blank" class="quasar-btn quasar-btn-outline">Create a Post</a>
            </p>
        </div>
    </div>
    <?php
}
