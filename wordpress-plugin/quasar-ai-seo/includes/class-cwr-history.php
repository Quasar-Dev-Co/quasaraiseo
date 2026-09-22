<?php
/**
 * History & Revert Manager for Custom Web Render.
 *
 * Tracks up to the last 20 changes (custom HTML, CSS, JS, SEO metadata,
 * and global settings), storing snapshots of previous and new values so
 * users can inspect diffs and safely revert changes.
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Custom_Web_Render_History {
    const MAX_ENTRIES = 20;
    const OPTION_KEY = 'cwr_change_history';

    /**
     * Get all recorded history entries, newest first.
     *
     * @return array List of history entries.
     */
    public static function get_history() {
        $history = get_option(self::OPTION_KEY, array());
        if (!is_array($history)) {
            return array();
        }
        return $history;
    }

    /**
     * Get a specific entry by its ID.
     *
     * @param string $entry_id
     * @return array|null
     */
    public static function get_entry($entry_id) {
        $history = self::get_history();
        foreach ($history as $item) {
            if (isset($item['id']) && $item['id'] === $entry_id) {
                return $item;
            }
        }
        return null;
    }

    /**
     * Record a new change in the history log.
     * Keeps up to 20 entries (rolling buffer).
     *
     * @param string $type        'post_update', 'global_update', 'import', 'revert'
     * @param int    $target_id   Post ID or 0 for global settings
     * @param string $target_title Post Title or 'Global Settings'
     * @param string $target_type 'page', 'post', 'global'
     * @param string $summary     Human readable summary of what changed
     * @param array  $previous    Snapshot of previous values
     * @param array  $new         Snapshot of new values
     * @param array  $changed_keys List of changed keys
     * @return string Entry ID
     */
    public static function log_change($type, $target_id, $target_title, $target_type, $summary, $previous, $new, $changed_keys = array()) {
        $current_user = wp_get_current_user();
        $user_name = ($current_user && (!method_exists($current_user, 'exists') || $current_user->exists()) && !empty($current_user->display_name))
            ? $current_user->display_name
            : __('System / MCP', 'custom-web-render');
        $user_id = $current_user && !empty($current_user->ID) ? absint($current_user->ID) : 0;

        $entry_id = 'cwr_' . time() . '_' . wp_generate_password(6, false);

        $entry = array(
            'id'             => $entry_id,
            'timestamp'      => time(),
            'formatted_date' => current_time('M j, Y, g:i a'),
            'user_id'        => $user_id,
            'user_name'      => $user_name,
            'type'           => sanitize_key($type),
            'target_id'      => absint($target_id),
            'target_title'   => sanitize_text_field($target_title),
            'target_type'    => sanitize_key($target_type),
            'summary'        => sanitize_text_field($summary),
            'changed_keys'   => array_values(array_map('sanitize_key', $changed_keys)),
            'previous'       => $previous,
            'new'            => $new,
            'reverted'       => false,
            'reverted_at'    => null,
        );

        $history = self::get_history();
        // Add new entry at top
        array_unshift($history, $entry);

        // Keep at most 20 entries
        if (count($history) > self::MAX_ENTRIES) {
            $history = array_slice($history, 0, self::MAX_ENTRIES);
        }

        update_option(self::OPTION_KEY, $history, false);
        return $entry_id;
    }

    /**
     * Revert a change by ID, restoring the previous snapshot values.
     *
     * @param string $entry_id
     * @return array array('success' => bool, 'message' => string)
     */
    public static function revert($entry_id) {
        $history = self::get_history();
        $found_index = -1;

        for ($i = 0; $i < count($history); $i++) {
            if (isset($history[$i]['id']) && $history[$i]['id'] === $entry_id) {
                $found_index = $i;
                break;
            }
        }

        if ($found_index === -1) {
            return array('success' => false, 'message' => __('History entry not found.', 'custom-web-render'));
        }

        $entry = $history[$found_index];
        $previous = isset($entry['previous']) && is_array($entry['previous']) ? $entry['previous'] : array();

        if (empty($previous)) {
            return array('success' => false, 'message' => __('No previous snapshot available to revert to.', 'custom-web-render'));
        }

        // Apply revert based on target type
        if ($entry['target_type'] === 'global') {
            foreach ($previous as $key => $value) {
                update_option($key, $value);
            }
            $revert_target_desc = __('Global Settings', 'custom-web-render');
        } else {
            $post_id = absint($entry['target_id']);
            if (!$post_id || !get_post($post_id)) {
                return array('success' => false, 'message' => __('Target post or page no longer exists.', 'custom-web-render'));
            }

            foreach ($previous as $meta_key => $value) {
                update_post_meta($post_id, $meta_key, $value);
            }
            $revert_target_desc = get_the_title($post_id) ?: sprintf(__('Post #%d', 'custom-web-render'), $post_id);
        }

        // Mark entry as reverted
        $history[$found_index]['reverted'] = true;
        $history[$found_index]['reverted_at'] = current_time('M j, Y, g:i a');
        update_option(self::OPTION_KEY, $history, false);

        // Record the revert action in history
        self::log_change(
            'revert',
            $entry['target_id'],
            $entry['target_title'],
            $entry['target_type'],
            sprintf(
                /* translators: 1: original change date, 2: target */
                __('Reverted change from %1$s on "%2$s"', 'custom-web-render'),
                $entry['formatted_date'],
                $revert_target_desc
            ),
            $entry['new'],
            $entry['previous'],
            $entry['changed_keys']
        );

        return array(
            'success' => true,
            'message' => sprintf(
                /* translators: 1: target */
                __('Successfully reverted change for "%s". Previous settings restored.', 'custom-web-render'),
                $revert_target_desc
            ),
        );
    }

    /**
     * Clear all recorded history.
     */
    public static function clear_all() {
        delete_option(self::OPTION_KEY);
    }

    /**
     * Render the History & Revert section UI.
     */
    public static function render_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $history = self::get_history();
        $total_count = count($history);
        ?>
        <div class="wrap cwr-wrap cwr-history-wrap">
            <h1><?php esc_html_e('Custom Web Render', 'custom-web-render'); ?></h1>

            <?php Custom_Web_Render::render_tabs('history'); ?>
            <?php Custom_Web_Render::render_admin_notice(); ?>

            <div class="cwr-history-header-panel cwr-panel">
                <div class="cwr-panel-header">
                    <div>
                        <h2><span class="dashicons dashicons-backup"></span> <?php esc_html_e('History & Change Log', 'custom-web-render'); ?></h2>
                        <p class="cwr-subtitle">
                            <?php
                            echo esc_html(
                                sprintf(
                                    /* translators: 1: current count, 2: maximum entries */
                                    __('Keeping track of the last %1$d changes (up to %2$d saved). You can compare previous vs new states and revert any change with one click.', 'custom-web-render'),
                                    $total_count,
                                    self::MAX_ENTRIES
                                )
                            );
                            ?>
                        </p>
                    </div>
                    <?php if ($total_count > 0) : ?>
                        <form method="post" onsubmit="return confirm('<?php echo esc_js(__('Are you sure you want to clear the entire change history? This action cannot be undone.', 'custom-web-render')); ?>');">
                            <?php wp_nonce_field('cwr_clear_history', 'cwr_history_nonce'); ?>
                            <button type="submit" name="cwr_clear_history" value="1" class="button button-secondary">
                                <span class="dashicons dashicons-trash"></span>
                                <?php esc_html_e('Clear History', 'custom-web-render'); ?>
                            </button>
                        </form>
                    <?php endif; ?>
                </div>

                <div class="cwr-history-stats-grid">
                    <div class="cwr-metric-card">
                        <strong><?php echo esc_html($total_count); ?> / <?php echo esc_html(self::MAX_ENTRIES); ?></strong>
                        <span><?php esc_html_e('Saved Changes', 'custom-web-render'); ?></span>
                    </div>
                    <div class="cwr-metric-card">
                        <strong><?php echo $total_count > 0 && !empty($history[0]['formatted_date']) ? esc_html($history[0]['formatted_date']) : '—'; ?></strong>
                        <span><?php esc_html_e('Latest Change', 'custom-web-render'); ?></span>
                    </div>
                    <div class="cwr-metric-card">
                        <?php
                        $revert_count = 0;
                        foreach ($history as $h) {
                            if (!empty($h['reverted'])) {
                                $revert_count++;
                            }
                        }
                        ?>
                        <strong><?php echo esc_html($revert_count); ?></strong>
                        <span><?php esc_html_e('Reverted Changes', 'custom-web-render'); ?></span>
                    </div>
                </div>
            </div>

            <?php if (empty($history)) : ?>
                <div class="cwr-panel cwr-empty-state" style="padding: 40px; text-align: center;">
                    <span class="dashicons dashicons-backup" style="font-size: 48px; width: 48px; height: 48px; color: #a7aaad; margin-bottom: 12px;"></span>
                    <h3><?php esc_html_e('No changes recorded yet', 'custom-web-render'); ?></h3>
                    <p class="description">
                        <?php esc_html_e('Changes to page render code (HTML, CSS, JS), SEO settings, or global configuration will be automatically logged here so you can inspect and revert them anytime.', 'custom-web-render'); ?>
                    </p>
                    <p style="margin-top: 16px;">
                        <a href="<?php echo esc_url(admin_url('admin.php?page=' . Custom_Web_Render::MENU_SLUG)); ?>" class="button button-primary">
                            <?php esc_html_e('Go to Web Render & Editor', 'custom-web-render'); ?>
                        </a>
                    </p>
                </div>
            <?php else : ?>
                <div class="cwr-history-list">
                    <?php foreach ($history as $entry) : ?>
                        <?php
                        $is_reverted = !empty($entry['reverted']);
                        $is_global = $entry['target_type'] === 'global';
                        $target_label = $is_global ? __('Global Settings', 'custom-web-render') : $entry['target_title'];
                        $target_link = !$is_global && !empty($entry['target_id']) ? add_query_arg(array('page' => Custom_Web_Render::MENU_SLUG, 'cwr_item' => $entry['target_id']), admin_url('admin.php')) : '';
                        $changed_keys = isset($entry['changed_keys']) && is_array($entry['changed_keys']) ? $entry['changed_keys'] : array();
                        ?>
                        <article class="cwr-panel cwr-history-card <?php echo $is_reverted ? 'is-reverted' : ''; ?>" id="history-entry-<?php echo esc_attr($entry['id']); ?>">
                            <div class="cwr-history-card-header">
                                <div class="cwr-history-card-info">
                                    <span class="cwr-history-badge cwr-badge-type-<?php echo esc_attr($entry['type']); ?>">
                                        <?php echo esc_html(ucfirst(str_replace('_', ' ', $entry['type']))); ?>
                                    </span>
                                    <h3>
                                        <?php if ($target_link) : ?>
                                            <a href="<?php echo esc_url($target_link); ?>"><?php echo esc_html($target_label); ?></a>
                                        <?php else : ?>
                                            <span><?php echo esc_html($target_label); ?></span>
                                        <?php endif; ?>
                                        <span class="cwr-history-target-type">(<?php echo esc_html(ucfirst($entry['target_type'])); ?>)</span>
                                    </h3>
                                    <div class="cwr-history-meta">
                                        <span><span class="dashicons dashicons-clock"></span> <?php echo esc_html($entry['formatted_date']); ?></span>
                                        <span><span class="dashicons dashicons-admin-users"></span> <?php echo esc_html($entry['user_name']); ?></span>
                                        <?php if ($is_reverted) : ?>
                                            <span class="cwr-badge-reverted"><span class="dashicons dashicons-undo"></span> <?php esc_html_e('Reverted', 'custom-web-render'); ?> (<?php echo esc_html($entry['reverted_at']); ?>)</span>
                                        <?php endif; ?>
                                    </div>
                                </div>

                                <div class="cwr-history-actions">
                                    <button type="button" class="button cwr-history-toggle-diff" data-target="diff-<?php echo esc_attr($entry['id']); ?>">
                                        <span class="dashicons dashicons-visibility"></span>
                                        <?php esc_html_e('View Changes', 'custom-web-render'); ?>
                                    </button>

                                    <?php if (!$is_reverted) : ?>
                                        <form method="post" style="display:inline-block;" onsubmit="return confirm('<?php echo esc_js(sprintf(__('Revert changes to "%s"? The previous snapshot will replace current values.', 'custom-web-render'), $target_label)); ?>');">
                                            <?php wp_nonce_field('cwr_revert_history', 'cwr_history_nonce'); ?>
                                            <input type="hidden" name="cwr_history_id" value="<?php echo esc_attr($entry['id']); ?>">
                                            <button type="submit" name="cwr_revert_entry" value="1" class="button button-primary">
                                                <span class="dashicons dashicons-undo"></span>
                                                <?php esc_html_e('Revert to Previous', 'custom-web-render'); ?>
                                            </button>
                                        </form>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <p class="cwr-history-summary">
                                <strong><?php esc_html_e('Changes:', 'custom-web-render'); ?></strong> <?php echo esc_html($entry['summary']); ?>
                                <?php if (!empty($changed_keys)) : ?>
                                    <span class="cwr-history-tags">
                                        <?php foreach ($changed_keys as $k) : ?>
                                            <span class="cwr-tag"><?php echo esc_html(str_replace(array('_cwr_', 'cwr_'), '', $k)); ?></span>
                                        <?php endforeach; ?>
                                    </span>
                                <?php endif; ?>
                            </p>

                            <div class="cwr-history-diff-view" id="diff-<?php echo esc_attr($entry['id']); ?>" style="display:none;">
                                <div class="cwr-diff-grid">
                                    <div class="cwr-diff-col cwr-diff-previous">
                                        <h4><span class="dashicons dashicons-arrow-left-alt"></span> <?php esc_html_e('Previous State (Before Change)', 'custom-web-render'); ?></h4>
                                        <div class="cwr-diff-content">
                                            <?php self::render_snapshot_preview($entry['previous'], $changed_keys); ?>
                                        </div>
                                    </div>
                                    <div class="cwr-diff-col cwr-diff-new">
                                        <h4><span class="dashicons dashicons-arrow-right-alt"></span> <?php esc_html_e('New State (Saved)', 'custom-web-render'); ?></h4>
                                        <div class="cwr-diff-content">
                                            <?php self::render_snapshot_preview($entry['new'], $changed_keys); ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Render formatted snapshot preview for previous or new states.
     *
     * @param array $snapshot
     * @param array $highlight_keys
     */
    private static function render_snapshot_preview($snapshot, $highlight_keys = array()) {
        if (empty($snapshot) || !is_array($snapshot)) {
            echo '<p class="description"><em>' . esc_html__('No data recorded for this state.', 'custom-web-render') . '</em></p>';
            return;
        }

        $code_keys = array('_cwr_html', '_cwr_css', '_cwr_js', 'cwr_global_header_code', 'cwr_global_footer_code', 'cwr_global_head_code');

        echo '<div class="cwr-snapshot-list">';
        foreach ($snapshot as $key => $val) {
            $clean_name = str_replace(array('_cwr_', 'cwr_global_', 'cwr_'), '', $key);
            $clean_name = ucwords(str_replace('_', ' ', $clean_name));
            $is_code = in_array($key, $code_keys, true);

            echo '<div class="cwr-snapshot-item">';
            echo '<div class="cwr-snapshot-key">' . esc_html($clean_name) . ':</div>';

            if ($is_code) {
                $code_text = (string) $val;
                $lines = substr_count($code_text, "\n") + 1;
                $display = trim($code_text) !== '' ? esc_html($code_text) : '<em>(' . esc_html__('empty', 'custom-web-render') . ')</em>';
                echo '<pre class="cwr-diff-code-box"><code>' . $display . '</code></pre>'; // phpcs:ignore
                echo '<span class="cwr-diff-lines">' . esc_html(sprintf(_n('%d line', '%d lines', $lines, 'custom-web-render'), $lines)) . '</span>';
            } else {
                $str_val = is_bool($val) ? ($val ? 'Yes (1)' : 'No (0)') : (string) $val;
                if ($str_val === '') {
                    $str_val = '<em>(' . esc_html__('empty', 'custom-web-render') . ')</em>';
                    echo '<div class="cwr-snapshot-value">' . $str_val . '</div>'; // phpcs:ignore
                } else {
                    echo '<div class="cwr-snapshot-value"><code>' . esc_html($str_val) . '</code></div>';
                }
            }
            echo '</div>';
        }
        echo '</div>';
    }
}
