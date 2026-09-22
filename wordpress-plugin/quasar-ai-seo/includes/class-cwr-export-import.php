<?php
/**
 * Export & Import Manager for Custom Web Render.
 *
 * Provides a robust export and import system for all pages, posts,
 * custom HTML/CSS/JS render payloads, SEO metadata, Schema configurations,
 * and global layout code.
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Custom_Web_Render_Export_Import {

    /**
     * Handle the export request and stream the JSON file for download.
     */
    public static function handle_export() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to export data.', 'custom-web-render'));
        }

        check_admin_referer('cwr_export_data', 'cwr_export_nonce');

        $scope = isset($_POST['cwr_export_scope']) ? sanitize_key($_POST['cwr_export_scope']) : 'all';
        $include_global = !empty($_POST['cwr_export_include_global']);

        $query_args = array(
            'post_type'   => array('page', 'post'),
            'post_status' => array('publish', 'draft', 'pending', 'private', 'future'),
            'numberposts' => -1,
            'orderby'     => 'date',
            'order'       => 'DESC',
        );

        if ($scope === 'render_active') {
            $query_args['meta_query'] = array(
                array(
                    'key'   => Custom_Web_Render::META_ENABLED,
                    'value' => '1',
                ),
            );
        }

        $posts = get_posts($query_args);
        $items = array();

        $cwr_meta_keys = array(
            Custom_Web_Render::META_ENABLED,
            Custom_Web_Render::META_HTML,
            Custom_Web_Render::META_CSS,
            Custom_Web_Render::META_JS,
            Custom_Web_Render::META_USE_HEADER,
            Custom_Web_Render::META_HEADER_TYPE,
            Custom_Web_Render::META_HEADER_ELEMENTOR_ID,
            Custom_Web_Render::META_USE_FOOTER,
            Custom_Web_Render::META_FOOTER_TYPE,
            Custom_Web_Render::META_FOOTER_ELEMENTOR_ID,
            Custom_Web_Render::META_TITLE,
            Custom_Web_Render::META_DESCRIPTION,
            Custom_Web_Render::META_FOCUS_KEYWORD,
            Custom_Web_Render::META_CANONICAL,
            Custom_Web_Render::META_ROBOTS_NOINDEX,
            Custom_Web_Render::META_ROBOTS_NOFOLLOW,
            Custom_Web_Render::META_SCHEMA_TYPE,
            Custom_Web_Render::META_SOCIAL_TITLE,
            Custom_Web_Render::META_SOCIAL_DESCRIPTION,
            Custom_Web_Render::META_SOCIAL_IMAGE,
            Custom_Web_Render::META_SEO_SCORE,
            Custom_Web_Render::META_SEO_ISSUES,
            Custom_Web_Render::META_SEO_ANALYSIS,
        );

        $quasar_meta_keys = array(
            '_quasar_schema',
            '_quasar_schema_types',
            '_quasar_schema_statuses',
            '_quasar_schema_status',
            '_quasar_schema_updated',
            '_quasar_faq_title_override',
        );

        foreach ($posts as $post) {
            $meta = array();
            foreach (array_merge($cwr_meta_keys, $quasar_meta_keys) as $key) {
                $val = get_post_meta($post->ID, $key, true);
                if ($val !== '' && $val !== null && $val !== false) {
                    $meta[$key] = $val;
                }
            }

            // Categories and tags
            $categories = wp_get_post_categories($post->ID, array('fields' => 'names'));
            $tags = wp_get_post_tags($post->ID, array('fields' => 'names'));

            $items[] = array(
                'id'            => $post->ID,
                'title'         => $post->post_title,
                'slug'          => $post->post_name,
                'post_type'     => $post->post_type,
                'post_status'   => $post->post_status,
                'content'       => $post->post_content,
                'excerpt'       => $post->post_excerpt,
                'post_date'     => $post->post_date,
                'post_modified' => $post->post_modified,
                'categories'    => is_array($categories) ? $categories : array(),
                'tags'          => is_array($tags) ? $tags : array(),
                'meta'          => $meta,
            );
        }

        $global_settings = array();
        if ($include_global) {
            $global_options = array(
                Custom_Web_Render::OPTION_HEADER,
                Custom_Web_Render::OPTION_HEADER_TYPE,
                Custom_Web_Render::OPTION_HEADER_ELEMENTOR_ID,
                Custom_Web_Render::OPTION_FOOTER,
                Custom_Web_Render::OPTION_FOOTER_TYPE,
                Custom_Web_Render::OPTION_FOOTER_ELEMENTOR_ID,
                Custom_Web_Render::OPTION_HEAD,
                Custom_Web_Render::OPTION_OPENROUTER_MODEL,
                Custom_Web_Render::OPTION_OPENROUTER_SYSTEM_PROMPT,
                'cwr_hide_posts_on_deactivation',
            );
            foreach ($global_options as $opt) {
                $val = get_option($opt, null);
                if ($val !== null) {
                    $global_settings[$opt] = $val;
                }
            }

            // Quasar Schema Settings if available
            if (defined('QUASAR_OPTION')) {
                $global_settings[QUASAR_OPTION] = get_option(QUASAR_OPTION, array());
            }
            if (defined('QUASAR_REVIEWS_OPTION')) {
                $global_settings[QUASAR_REVIEWS_OPTION] = get_option(QUASAR_REVIEWS_OPTION, array());
            }
        }

        $export_payload = array(
            'format'          => 'quasar_ai_seo_export',
            'version'         => Custom_Web_Render::VERSION,
            'exported_at'     => current_time('mysql'),
            'exported_at_gmt' => gmdate('Y-m-d H:i:s'),
            'site_url'        => home_url(),
            'item_count'      => count($items),
            'scope'           => $scope,
            'has_global'      => $include_global,
            'global_settings' => $global_settings,
            'items'           => $items,
        );

        $filename = 'quasar-ai-seo-export-' . gmdate('Y-m-d-His') . '.json';
        $json_data = wp_json_encode($export_payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($json_data));

        echo $json_data; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        exit;
    }

    /**
     * Handle JSON import.
     *
     * @return array array('success' => bool, 'message' => string, 'details' => array)
     */
    public static function handle_import() {
        if (!current_user_can('manage_options')) {
            return array('success' => false, 'message' => __('You do not have permission to import data.', 'custom-web-render'));
        }

        check_admin_referer('cwr_import_data', 'cwr_import_nonce');

        $json_string = '';

        // Check if file was uploaded
        if (!empty($_FILES['cwr_import_file']['tmp_name'])) {
            $tmp_file = $_FILES['cwr_import_file']['tmp_name']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
            if (is_uploaded_file($tmp_file)) {
                $json_string = file_get_contents($tmp_file); // phpcs:ignore WordPress.WP.AlternativeFunctions
            }
        }

        // Fallback: check raw text input
        if (empty($json_string) && !empty($_POST['cwr_import_text'])) {
            $json_string = wp_unslash($_POST['cwr_import_text']); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
        }

        if (empty($json_string)) {
            return array('success' => false, 'message' => __('Please select a JSON export file or paste JSON content to import.', 'custom-web-render'));
        }

        $data = json_decode($json_string, true);
        if (!is_array($data) || !isset($data['items']) || !is_array($data['items'])) {
            return array('success' => false, 'message' => __('Invalid export file format. Could not find items to import.', 'custom-web-render'));
        }

        $match_mode = isset($_POST['cwr_import_match_mode']) ? sanitize_key($_POST['cwr_import_match_mode']) : 'update';
        $status_mode = isset($_POST['cwr_import_status_mode']) ? sanitize_key($_POST['cwr_import_status_mode']) : 'keep';
        $import_global = !empty($_POST['cwr_import_global_settings']) && !empty($data['global_settings']);

        $updated_count = 0;
        $created_count = 0;
        $skipped_count = 0;

        foreach ($data['items'] as $item) {
            $post_type = isset($item['post_type']) && in_array($item['post_type'], array('page', 'post'), true) ? $item['post_type'] : 'page';
            $title = isset($item['title']) ? (string) $item['title'] : '';
            $slug = isset($item['slug']) ? sanitize_title($item['slug']) : '';
            $content = isset($item['content']) ? (string) $item['content'] : '';
            $excerpt = isset($item['excerpt']) ? (string) $item['excerpt'] : '';

            $status = 'publish';
            if ($status_mode === 'draft') {
                $status = 'draft';
            } elseif (isset($item['post_status']) && in_array($item['post_status'], array('publish', 'draft', 'pending', 'private', 'future'), true)) {
                $status = $item['post_status'];
            }

            $target_post_id = 0;

            if ($match_mode === 'update') {
                // Find existing item by slug and post_type
                if ($slug !== '') {
                    $existing = get_page_by_path($slug, OBJECT, $post_type);
                    if ($existing) {
                        $target_post_id = $existing->ID;
                    }
                }
                // If not found by slug, try by title
                if (!$target_post_id && $title !== '') {
                    $found = get_posts(array(
                        'post_type'   => $post_type,
                        'title'       => $title,
                        'post_status' => 'any',
                        'numberposts' => 1,
                    ));
                    if (!empty($found)) {
                        $target_post_id = $found[0]->ID;
                    }
                }
            }

            if ($target_post_id > 0) {
                // Update existing
                $postarr = array(
                    'ID'           => $target_post_id,
                    'post_title'   => $title,
                    'post_content' => $content,
                    'post_excerpt' => $excerpt,
                    'post_status'  => $status,
                );
                if ($slug !== '') {
                    $postarr['post_name'] = $slug;
                }
                wp_update_post(wp_slash($postarr));
                $post_id = $target_post_id;
                $updated_count++;
            } else {
                // Create new
                $postarr = array(
                    'post_type'    => $post_type,
                    'post_title'   => $title,
                    'post_name'    => $slug,
                    'post_content' => $content,
                    'post_excerpt' => $excerpt,
                    'post_status'  => $status,
                );
                $post_id = wp_insert_post(wp_slash($postarr));
                if (is_wp_error($post_id) || !$post_id) {
                    $skipped_count++;
                    continue;
                }
                $created_count++;
            }

            // Restore all metadata
            if (isset($item['meta']) && is_array($item['meta'])) {
                foreach ($item['meta'] as $m_key => $m_val) {
                    update_post_meta($post_id, sanitize_key($m_key), $m_val);
                }
            }

            // Restore categories
            if (!empty($item['categories']) && is_array($item['categories']) && $post_type === 'post') {
                wp_set_object_terms($post_id, array_map('sanitize_text_field', $item['categories']), 'category');
            }

            // Restore tags
            if (!empty($item['tags']) && is_array($item['tags'])) {
                wp_set_object_terms($post_id, array_map('sanitize_text_field', $item['tags']), 'post_tag');
            }
        }

        // Restore global settings if requested
        $global_updated = false;
        if ($import_global && !empty($data['global_settings']) && is_array($data['global_settings'])) {
            $allowed_global = array(
                Custom_Web_Render::OPTION_HEADER,
                Custom_Web_Render::OPTION_HEADER_TYPE,
                Custom_Web_Render::OPTION_HEADER_ELEMENTOR_ID,
                Custom_Web_Render::OPTION_FOOTER,
                Custom_Web_Render::OPTION_FOOTER_TYPE,
                Custom_Web_Render::OPTION_FOOTER_ELEMENTOR_ID,
                Custom_Web_Render::OPTION_HEAD,
                Custom_Web_Render::OPTION_OPENROUTER_MODEL,
                Custom_Web_Render::OPTION_OPENROUTER_SYSTEM_PROMPT,
                'cwr_hide_posts_on_deactivation',
            );
            foreach ($allowed_global as $opt_key) {
                if (array_key_exists($opt_key, $data['global_settings'])) {
                    update_option($opt_key, $data['global_settings'][$opt_key]);
                    $global_updated = true;
                }
            }
            if (defined('QUASAR_OPTION') && isset($data['global_settings'][QUASAR_OPTION])) {
                update_option(QUASAR_OPTION, $data['global_settings'][QUASAR_OPTION]);
                $global_updated = true;
            }
            if (defined('QUASAR_REVIEWS_OPTION') && isset($data['global_settings'][QUASAR_REVIEWS_OPTION])) {
                update_option(QUASAR_REVIEWS_OPTION, $data['global_settings'][QUASAR_REVIEWS_OPTION]);
                $global_updated = true;
            }
        }

        // Log import event into History
        if (class_exists('Custom_Web_Render_History')) {
            Custom_Web_Render_History::log_change(
                'import',
                0,
                __('Bulk Import', 'custom-web-render'),
                'import',
                sprintf(
                    /* translators: 1: created count, 2: updated count, 3: source */
                    __('Imported %1$d new items and updated %2$d items from JSON backup.', 'custom-web-render'),
                    $created_count,
                    $updated_count
                ),
                array(),
                array('created' => $created_count, 'updated' => $updated_count, 'global_updated' => $global_updated),
                array('import_batch')
            );
        }

        $total_processed = $updated_count + $created_count;
        $msg = sprintf(
            /* translators: 1: total items, 2: created, 3: updated, 4: skipped */
            __('Import complete! Processed %1$d items: %2$d created, %3$d updated, %4$d skipped.%5$s', 'custom-web-render'),
            $total_processed,
            $created_count,
            $updated_count,
            $skipped_count,
            $global_updated ? ' ' . __('Global settings were also restored.', 'custom-web-render') : ''
        );

        return array(
            'success' => true,
            'message' => $msg,
            'details' => array(
                'total'   => $total_processed,
                'created' => $created_count,
                'updated' => $updated_count,
                'skipped' => $skipped_count,
            ),
        );
    }

    /**
     * Render the Export & Import management tab.
     */
    public static function render_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $items_count = count(get_posts(array(
            'post_type'   => array('page', 'post'),
            'post_status' => array('publish', 'draft', 'pending', 'private', 'future'),
            'numberposts' => -1,
            'fields'      => 'ids',
        )));

        $cwr_active_count = count(get_posts(array(
            'post_type'   => array('page', 'post'),
            'post_status' => array('publish', 'draft', 'pending', 'private', 'future'),
            'numberposts' => -1,
            'fields'      => 'ids',
            'meta_query'  => array(
                array(
                    'key'   => Custom_Web_Render::META_ENABLED,
                    'value' => '1',
                ),
            ),
        )));
        ?>
        <div class="wrap cwr-wrap cwr-export-import-wrap">
            <h1><?php esc_html_e('Custom Web Render', 'custom-web-render'); ?></h1>

            <?php Custom_Web_Render::render_tabs('export-import'); ?>
            <?php Custom_Web_Render::render_admin_notice(); ?>

            <div class="cwr-export-import-grid">
                <!-- EXPORT SECTION -->
                <section class="cwr-panel cwr-export-card">
                    <div class="cwr-panel-header">
                        <div>
                            <h2><span class="dashicons dashicons-download"></span> <?php esc_html_e('Export Pages & Posts', 'custom-web-render'); ?></h2>
                            <p class="cwr-subtitle"><?php esc_html_e('Download all your pages, posts, custom HTML/CSS/JS render code, SEO meta, schema, and global settings into a portable JSON file.', 'custom-web-render'); ?></p>
                        </div>
                    </div>

                    <div class="cwr-export-stats">
                        <div class="cwr-metric-card">
                            <strong><?php echo esc_html($items_count); ?></strong>
                            <span><?php esc_html_e('Total Pages & Posts', 'custom-web-render'); ?></span>
                        </div>
                        <div class="cwr-metric-card">
                            <strong><?php echo esc_html($cwr_active_count); ?></strong>
                            <span><?php esc_html_e('Custom Render Active', 'custom-web-render'); ?></span>
                        </div>
                    </div>

                    <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=custom-web-render-export-import')); ?>" class="cwr-export-form">
                        <?php wp_nonce_field('cwr_export_data', 'cwr_export_nonce'); ?>

                        <div class="cwr-field">
                            <span class="cwr-field-label"><?php esc_html_e('Export Scope:', 'custom-web-render'); ?></span>
                            <div class="cwr-radio-group">
                                <label>
                                    <input type="radio" name="cwr_export_scope" value="all" checked>
                                    <strong><?php esc_html_e('All Pages & Posts', 'custom-web-render'); ?></strong>
                                    <span class="description"><?php esc_html_e('Exports every page and post on this site along with any custom render and SEO data.', 'custom-web-render'); ?></span>
                                </label>
                                <label>
                                    <input type="radio" name="cwr_export_scope" value="render_active">
                                    <strong><?php esc_html_e('Only Custom Render Pages & Posts', 'custom-web-render'); ?></strong>
                                    <span class="description"><?php esc_html_e('Exports only the pages and posts that have Custom Web Render enabled.', 'custom-web-render'); ?></span>
                                </label>
                            </div>
                        </div>

                        <div class="cwr-field">
                            <label>
                                <input type="checkbox" name="cwr_export_include_global" value="1" checked>
                                <strong><?php esc_html_e('Include Global Settings & Code', 'custom-web-render'); ?></strong>
                            </label>
                            <p class="description" style="margin-left: 24px;">
                                <?php esc_html_e('Includes Global Header code, Global Footer code, Head code injection, and AI configuration.', 'custom-web-render'); ?>
                            </p>
                        </div>

                        <div class="cwr-form-submit">
                            <button type="submit" name="cwr_do_export" value="1" class="button button-primary button-large">
                                <span class="dashicons dashicons-download"></span>
                                <?php esc_html_e('Download JSON Export', 'custom-web-render'); ?>
                            </button>
                        </div>
                    </form>
                </section>

                <!-- IMPORT SECTION -->
                <section class="cwr-panel cwr-import-card">
                    <div class="cwr-panel-header">
                        <div>
                            <h2><span class="dashicons dashicons-upload"></span> <?php esc_html_e('Import Pages & Posts', 'custom-web-render'); ?></h2>
                            <p class="cwr-subtitle"><?php esc_html_e('Restore pages, posts, custom render code (HTML, CSS, JS), SEO metadata, and global settings from a JSON export file.', 'custom-web-render'); ?></p>
                        </div>
                    </div>

                    <form method="post" enctype="multipart/form-data" action="<?php echo esc_url(admin_url('admin.php?page=custom-web-render-export-import')); ?>" class="cwr-import-form">
                        <?php wp_nonce_field('cwr_import_data', 'cwr_import_nonce'); ?>

                        <div class="cwr-field">
                            <label for="cwr_import_file" class="cwr-field-label"><strong><?php esc_html_e('Select Export JSON File:', 'custom-web-render'); ?></strong></label>
                            <div class="cwr-dropzone" id="cwr-dropzone">
                                <span class="dashicons dashicons-media-code" style="font-size: 36px; width: 36px; height: 36px; color: #646970;"></span>
                                <p><?php esc_html_e('Choose a .json file or drag & drop it here', 'custom-web-render'); ?></p>
                                <input type="file" id="cwr_import_file" name="cwr_import_file" accept=".json,application/json">
                                <div id="cwr-selected-filename" style="margin-top: 8px; font-weight: bold; color: #2271b1;"></div>
                            </div>
                        </div>

                        <details class="cwr-import-paste-toggle" style="margin-bottom: 18px;">
                            <summary style="cursor: pointer; color: #2271b1; font-weight: 600;">
                                <?php esc_html_e('Or paste raw JSON export content', 'custom-web-render'); ?>
                            </summary>
                            <div style="margin-top: 10px;">
                                <textarea name="cwr_import_text" class="large-text code" rows="6" placeholder="<?php esc_attr_e('Paste JSON data here...', 'custom-web-render'); ?>"></textarea>
                            </div>
                        </details>

                        <div class="cwr-field">
                            <span class="cwr-field-label"><strong><?php esc_html_e('Existing Items Matching Rule:', 'custom-web-render'); ?></strong></span>
                            <div class="cwr-radio-group">
                                <label>
                                    <input type="radio" name="cwr_import_match_mode" value="update" checked>
                                    <strong><?php esc_html_e('Update existing items (match by slug / title)', 'custom-web-render'); ?></strong>
                                    <span class="description"><?php esc_html_e('If an existing post or page has the same slug or title, update its content, HTML, CSS, JS, and SEO fields. Otherwise, create a new item.', 'custom-web-render'); ?></span>
                                </label>
                                <label>
                                    <input type="radio" name="cwr_import_match_mode" value="always_new">
                                    <strong><?php esc_html_e('Always create as new items', 'custom-web-render'); ?></strong>
                                    <span class="description"><?php esc_html_e('Creates new posts and pages for everything in the export file without modifying existing items.', 'custom-web-render'); ?></span>
                                </label>
                            </div>
                        </div>

                        <div class="cwr-field">
                            <span class="cwr-field-label"><strong><?php esc_html_e('Import Status:', 'custom-web-render'); ?></strong></span>
                            <label>
                                <input type="radio" name="cwr_import_status_mode" value="keep" checked>
                                <?php esc_html_e('Preserve original status (Publish, Draft, etc.)', 'custom-web-render'); ?>
                            </label>
                            &nbsp;&nbsp;
                            <label>
                                <input type="radio" name="cwr_import_status_mode" value="draft">
                                <?php esc_html_e('Import all as Draft (review before publishing)', 'custom-web-render'); ?>
                            </label>
                        </div>

                        <div class="cwr-field">
                            <label>
                                <input type="checkbox" name="cwr_import_global_settings" value="1" checked>
                                <strong><?php esc_html_e('Import Global Settings if present', 'custom-web-render'); ?></strong>
                            </label>
                        </div>

                        <div class="cwr-form-submit">
                            <button type="submit" name="cwr_do_import" value="1" class="button button-primary button-large" onclick="return confirm('<?php echo esc_js(__('Start importing? This will add or update pages and posts based on your settings.', 'custom-web-render')); ?>');">
                                <span class="dashicons dashicons-upload"></span>
                                <?php esc_html_e('Start Import', 'custom-web-render'); ?>
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            <!-- LIFECYCLE & ISOLATION SAFETY CARD -->
            <div class="cwr-panel cwr-safety-card" style="margin-top: 20px;">
                <div class="cwr-panel-header">
                    <div>
                        <h3><span class="dashicons dashicons-shield"></span> <?php esc_html_e('Data Safety & Plugin Isolation Guarantee', 'custom-web-render'); ?></h3>
                        <p class="cwr-subtitle"><?php esc_html_e('How your custom HTML, CSS, JavaScript, and generated content are protected across deactivation and reactivation.', 'custom-web-render'); ?></p>
                    </div>
                    <span class="cwr-badge is-active"><?php esc_html_e('Protected', 'custom-web-render'); ?></span>
                </div>
                <div class="cwr-safety-content">
                    <p>
                        <?php esc_html_e('This plugin includes automated lifecycle protection for all your custom-rendered pages and posts:', 'custom-web-render'); ?>
                    </p>
                    <ul style="list-style: disc; margin-left: 20px; line-height: 1.6;">
                        <li><strong><?php esc_html_e('Invisible on Deactivation:', 'custom-web-render'); ?></strong> <?php esc_html_e('If this plugin is deactivated or removed, all pages and posts with custom HTML, CSS, and JS rendering are automatically set to Draft (invisible to visitors). This prevents visitors from seeing broken, unstyled fallback theme layouts.', 'custom-web-render'); ?></li>
                        <li><strong><?php esc_html_e('Automatic Reappearance on Reactivation:', 'custom-web-render'); ?></strong> <?php esc_html_e('When you reactivate the plugin, all your generated and custom-rendered pages automatically return to their exact previous publication status (e.g. Published) with full HTML, CSS, and JS intact.', 'custom-web-render'); ?></li>
                        <li><strong><?php esc_html_e('Zero Data Loss Uninstall:', 'custom-web-render'); ?></strong> <?php esc_html_e('All custom HTML, CSS, JS, and SEO metadata are preserved in the database by default so deleting and reinstalling the plugin will never erase your designs.', 'custom-web-render'); ?></li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }
}
