<?php
/**
 * Admin dashboard and settings page for Quasar AI SEO Assistant plugin.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Quasar_Admin {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_menu_pages']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function add_menu_pages() {
        // Main dashboard page
        add_menu_page(
            'Quasar AI SEO',
            'Quasar AI SEO',
            'manage_options',
            'quasar-dashboard',
            [$this, 'render_dashboard'],
            'dashicons-chart-area',
            30
        );

        // Settings sub-page
        add_submenu_page(
            'quasar-dashboard',
            'Connection Settings',
            'Settings',
            'manage_options',
            'quasar-settings',
            [$this, 'render_settings']
        );
    }

    public function enqueue_assets($hook) {
        if (strpos($hook, 'quasar-') === false) {
            return;
        }
        wp_enqueue_style('quasar-admin', QUASAR_PLUGIN_URL . 'assets/css/admin.css', [], QUASAR_VERSION);
        wp_enqueue_script('quasar-admin', QUASAR_PLUGIN_URL . 'assets/js/admin.js', ['jquery'], QUASAR_VERSION, true);
        wp_localize_script('quasar-admin', 'quasarData', [
            'apiUrl'       => QUASAR_API_URL,
            'frontendUrl'  => QUASAR_FRONTEND_URL,
            'siteUrl'      => home_url(),
            'token'        => Quasar_Core::get_instance()->get_connection_token(),
            'connected'    => Quasar_Core::get_instance()->get_connection_status() === 'connected',
            'nonce'        => wp_create_nonce('quasar_admin'),
        ]);
    }

    public function render_dashboard() {
        $core = Quasar_Core::get_instance();
        $connected = $core->get_connection_status() === 'connected';
        $site_info = $core->get_site_info();

        // Fetch posts from WP REST API
        $app_password = get_option('quasar_app_password', '');
        $user_id = (int) get_option('quasar_user_id', 0);
        $user = get_userdata($user_id);

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

        // Also get all posts count
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
                <!-- Stats Cards -->
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

                <!-- Posts Table -->
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

                <!-- All Site Posts Summary -->
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

    public function render_settings() {
        $core = Quasar_Core::get_instance();
        $connected = $core->get_connection_status() === 'connected';
        $site_info = $core->get_site_info();
        $token = $core->get_connection_token();

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
}
