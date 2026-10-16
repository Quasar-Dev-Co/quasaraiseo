<?php
/**
 * MCP Chat tools for the Quasar dashboard connection (added in 2.2.0):
 * - exact post body route for small edits (patch_post_content);
 * - menus, site setup, media editing, the plugin list (read-only) and
 *   UpdraftPlus backups.
 * Every route uses the connection token (X-Quasar-Token) like the rest of the
 * connector. A site owner can switch the site tools (not the content route) off with:
 *   add_filter('quasar_ai_seo_site_tools_enabled', '__return_false');
 * Installing, updating or switching plugins on/off is deliberately not offered:
 * with it, anyone holding the token could run new code on the site.
 */

if (!defined('ABSPATH')) {
    exit;
}

function quasar_site_tools_permission($request) {
    if (!apply_filters('quasar_ai_seo_site_tools_enabled', true)) {
        return new WP_Error('site_tools_disabled', 'Site tools are switched off on this site.', ['status' => 403]);
    }
    return quasar_check_token($request);
}

function quasar_json_params($request) {
    $params = json_decode($request->get_body(), true);
    return is_array($params) ? $params : [];
}

function quasar_tools_admin_includes() {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/misc.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
}

// ─── Menus ───

function quasar_menu_item_payload($item) {
    return [
        'id'        => (int) $item->ID,
        'title'     => $item->title,
        'url'       => $item->url,
        'type'      => $item->type,        // custom, post_type, taxonomy
        'object'    => $item->object,      // page, post, category, custom...
        'object_id' => (int) $item->object_id,
        'parent_id' => (int) $item->menu_item_parent,
        'position'  => (int) $item->menu_order,
        'new_tab'   => $item->target === '_blank',
    ];
}

/** Arguments for wp_update_nav_menu_item() built from an existing item, so unspecified fields keep their values. */
function quasar_menu_item_args($item) {
    return [
        'menu-item-object-id'   => (int) $item->object_id,
        'menu-item-object'      => $item->object,
        'menu-item-parent-id'   => (int) $item->menu_item_parent,
        'menu-item-position'    => (int) $item->menu_order,
        'menu-item-type'        => $item->type,
        'menu-item-title'       => $item->title,
        'menu-item-url'         => $item->url,
        'menu-item-description' => $item->description,
        'menu-item-attr-title'  => $item->attr_title,
        'menu-item-target'      => $item->target,
        'menu-item-classes'     => is_array($item->classes) ? implode(' ', $item->classes) : '',
        'menu-item-xfn'         => $item->xfn,
        'menu-item-status'      => 'publish',
    ];
}

/** Sets what a menu item points to: an existing post/page/term (object_id) or a custom URL. */
function quasar_menu_item_target(array &$args, array $params) {
    if (!empty($params['object_id'])) {
        $object_id = (int) $params['object_id'];
        $kind = isset($params['object_type']) ? sanitize_key($params['object_type']) : '';
        if ($kind && taxonomy_exists($kind)) {
            $term = get_term($object_id, $kind);
            if (!$term || is_wp_error($term)) {
                return new WP_Error('not_found', 'That category or term does not exist.', ['status' => 404]);
            }
            $args['menu-item-type'] = 'taxonomy';
            $args['menu-item-object'] = $kind;
        } else {
            $post = get_post($object_id);
            if (!$post) {
                return new WP_Error('not_found', 'That post or page does not exist.', ['status' => 404]);
            }
            $args['menu-item-type'] = 'post_type';
            $args['menu-item-object'] = $post->post_type;
        }
        $args['menu-item-object-id'] = $object_id;
        $args['menu-item-url'] = '';
    } elseif (isset($params['url'])) {
        $url = esc_url_raw($params['url']);
        if ($url === '') {
            return new WP_Error('bad_request', 'The link is not a valid address.', ['status' => 400]);
        }
        $args['menu-item-type'] = 'custom';
        $args['menu-item-object'] = 'custom';
        $args['menu-item-object-id'] = 0;
        $args['menu-item-url'] = $url;
    }
    return true;
}

add_action('rest_api_init', function () {
    $ns = 'quasar-ai-seo/v1';
    $perm = 'quasar_site_tools_permission';

    // ─── Exact post body (small edits from MCP Chat) ───
    // Reads and saves post_content for any post type. A save goes through the same
    // HTML filter as every other route (wp_kses_post), and is only made when that
    // filter would not remove or change anything real: at most it rewrites markup
    // formatting (" />" spacing, quote style, how entities are written).
    // When the post already has markup the filter removes (embeds, <style> blocks,
    // scripts, forms, special attributes), that markup is kept byte for byte and only
    // the rest is filtered (quasar_safe_body_save, 2.2.2). If the edit itself touches
    // that markup or adds markup the filter removes, nothing is saved and the reply
    // says exactly which markup it is.
    register_rest_route($ns, '/posts/(?P<id>\d+)/content', [
        [
            'methods'  => 'GET',
            'callback' => function ($request) {
                $post = get_post((int) $request['id']);
                if (!$post) {
                    return new WP_Error('not_found', 'Post not found.', ['status' => 404]);
                }
                return rest_ensure_response(quasar_content_payload($post));
            },
            'permission_callback' => function ($request) {
                return quasar_check_token($request);
            },
        ],
        [
            'methods'  => 'POST',
            'callback' => function ($request) {
                $post_id = (int) $request['id'];
                $post = get_post($post_id);
                if (!$post) {
                    return new WP_Error('not_found', 'Post not found.', ['status' => 404]);
                }
                $params = json_decode($request->get_body(), true);
                if (!is_array($params) || !isset($params['content']) || !is_string($params['content'])) {
                    return new WP_Error('bad_request', 'content (string) is required.', ['status' => 400]);
                }
                // Never overwrite an edit made after the caller read the post.
                if (!empty($params['expected_hash']) && !hash_equals(md5($post->post_content), (string) $params['expected_hash'])) {
                    return new WP_Error('changed', 'The post was changed after it was read.', ['status' => 409]);
                }
                $content = $params['content'];
                $filtered = wp_kses_post($content);
                $kept = [];
                if ($filtered !== $content && quasar_markup_canon($filtered) !== quasar_markup_canon($content)) {
                    $safe = quasar_safe_body_save($post->post_content, $content);
                    if (!$safe['ok']) {
                        return quasar_would_be_filtered_error($content, $safe);
                    }
                    $filtered = $safe['content'];
                    $kept = $safe['kept'];
                    $result = quasar_update_post_body_checked($post_id, $filtered);
                } else {
                    // wp_update_post expects slashed data; without wp_slash backslashes in
                    // block attributes (\u003c and similar) would be lost.
                    $result = wp_update_post(wp_slash(['ID' => $post_id, 'post_content' => $filtered]), true);
                }
                if (is_wp_error($result)) {
                    return new WP_Error('update_failed', 'WordPress did not save the post: ' . $result->get_error_message(), ['status' => 500]);
                }
                $purged = quasar_purge_page_cache($post_id);
                $payload = quasar_content_payload(get_post($post_id));
                $payload['reformatted'] = $filtered !== $content;
                $payload['kept_protected'] = $kept;
                $payload['cache_purged'] = $purged;
                return rest_ensure_response($payload);
            },
            'permission_callback' => function ($request) {
                return quasar_check_token($request);
            },
        ],
    ]);


    register_rest_route($ns, '/menus', [
        [
            'methods'  => 'GET',
            'callback' => function () {
                $assigned = get_nav_menu_locations();
                $menus = [];
                foreach (wp_get_nav_menus() as $menu) {
                    $menus[] = [
                        'id'        => (int) $menu->term_id,
                        'name'      => $menu->name,
                        'items'     => (int) $menu->count,
                        'locations' => array_keys(array_filter($assigned, function ($id) use ($menu) {
                            return (int) $id === (int) $menu->term_id;
                        })),
                    ];
                }
                $locations = [];
                foreach (get_registered_nav_menus() as $slug => $label) {
                    $locations[] = ['location' => $slug, 'label' => $label, 'menu_id' => (int) ($assigned[$slug] ?? 0)];
                }
                return rest_ensure_response(['success' => true, 'menus' => $menus, 'locations' => $locations]);
            },
            'permission_callback' => $perm,
        ],
        [
            'methods'  => 'POST',
            'callback' => function ($request) {
                $p = quasar_json_params($request);
                $name = isset($p['name']) ? sanitize_text_field($p['name']) : '';
                if ($name === '') {
                    return new WP_Error('bad_request', 'A menu name is required.', ['status' => 400]);
                }
                $id = wp_create_nav_menu($name);
                if (is_wp_error($id)) {
                    return new WP_Error('create_failed', $id->get_error_message(), ['status' => 400]);
                }
                return rest_ensure_response(['success' => true, 'id' => (int) $id, 'name' => $name]);
            },
            'permission_callback' => $perm,
        ],
    ]);

    register_rest_route($ns, '/menus/(?P<id>\d+)', [
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $menu = wp_get_nav_menu_object((int) $request['id']);
            if (!$menu) {
                return new WP_Error('not_found', 'Menu not found.', ['status' => 404]);
            }
            $result = wp_delete_nav_menu($menu->term_id);
            if (is_wp_error($result) || !$result) {
                return new WP_Error('delete_failed', is_wp_error($result) ? $result->get_error_message() : 'The menu could not be deleted.', ['status' => 500]);
            }
            return rest_ensure_response(['success' => true, 'deleted' => $menu->name]);
        },
        'permission_callback' => $perm,
    ]);

    register_rest_route($ns, '/menus/(?P<id>\d+)/items', [
        [
            'methods'  => 'GET',
            'callback' => function ($request) {
                $menu = wp_get_nav_menu_object((int) $request['id']);
                if (!$menu) {
                    return new WP_Error('not_found', 'Menu not found.', ['status' => 404]);
                }
                $items = wp_get_nav_menu_items($menu->term_id) ?: [];
                return rest_ensure_response(['success' => true, 'menu' => $menu->name, 'items' => array_map('quasar_menu_item_payload', $items)]);
            },
            'permission_callback' => $perm,
        ],
        [
            'methods'  => 'POST',
            'callback' => function ($request) {
                $menu = wp_get_nav_menu_object((int) $request['id']);
                if (!$menu) {
                    return new WP_Error('not_found', 'Menu not found.', ['status' => 404]);
                }
                $p = quasar_json_params($request);
                if (empty($p['object_id']) && empty($p['url'])) {
                    return new WP_Error('bad_request', 'Give either object_id (a page, post or category) or url.', ['status' => 400]);
                }
                $args = [
                    'menu-item-title'     => isset($p['title']) ? sanitize_text_field($p['title']) : '',
                    'menu-item-parent-id' => isset($p['parent_id']) ? (int) $p['parent_id'] : 0,
                    'menu-item-position'  => isset($p['position']) ? (int) $p['position'] : 0,
                    'menu-item-target'    => !empty($p['new_tab']) ? '_blank' : '',
                    'menu-item-status'    => 'publish',
                ];
                $target = quasar_menu_item_target($args, $p);
                if (is_wp_error($target)) {
                    return $target;
                }
                $id = wp_update_nav_menu_item($menu->term_id, 0, $args);
                if (is_wp_error($id)) {
                    return new WP_Error('create_failed', $id->get_error_message(), ['status' => 400]);
                }
                return rest_ensure_response(['success' => true, 'item' => quasar_menu_item_payload(wp_setup_nav_menu_item(get_post($id)))]);
            },
            'permission_callback' => $perm,
        ],
    ]);

    register_rest_route($ns, '/menu-items/(?P<id>\d+)', [
        [
            'methods'  => 'PATCH',
            'callback' => function ($request) {
                $post = get_post((int) $request['id']);
                if (!$post || $post->post_type !== 'nav_menu_item') {
                    return new WP_Error('not_found', 'Menu item not found.', ['status' => 404]);
                }
                $terms = wp_get_object_terms($post->ID, 'nav_menu', ['fields' => 'ids']);
                if (empty($terms) || is_wp_error($terms)) {
                    return new WP_Error('not_found', 'This menu item does not belong to a menu.', ['status' => 404]);
                }
                $item = wp_setup_nav_menu_item($post);
                $args = quasar_menu_item_args($item);
                $p = quasar_json_params($request);
                if (isset($p['title'])) {
                    $args['menu-item-title'] = sanitize_text_field($p['title']);
                }
                if (isset($p['parent_id'])) {
                    $args['menu-item-parent-id'] = (int) $p['parent_id'];
                }
                if (isset($p['position'])) {
                    $args['menu-item-position'] = (int) $p['position'];
                }
                if (isset($p['new_tab'])) {
                    $args['menu-item-target'] = $p['new_tab'] ? '_blank' : '';
                }
                $target = quasar_menu_item_target($args, $p);
                if (is_wp_error($target)) {
                    return $target;
                }
                $id = wp_update_nav_menu_item((int) $terms[0], $post->ID, $args);
                if (is_wp_error($id)) {
                    return new WP_Error('update_failed', $id->get_error_message(), ['status' => 400]);
                }
                return rest_ensure_response(['success' => true, 'item' => quasar_menu_item_payload(wp_setup_nav_menu_item(get_post($id)))]);
            },
            'permission_callback' => $perm,
        ],
        [
            'methods'  => 'DELETE',
            'callback' => function ($request) {
                $post = get_post((int) $request['id']);
                if (!$post || $post->post_type !== 'nav_menu_item') {
                    return new WP_Error('not_found', 'Menu item not found.', ['status' => 404]);
                }
                $title = wp_setup_nav_menu_item($post)->title;
                if (!wp_delete_post($post->ID, true)) {
                    return new WP_Error('delete_failed', 'The menu item could not be removed.', ['status' => 500]);
                }
                return rest_ensure_response(['success' => true, 'deleted' => $title]);
            },
            'permission_callback' => $perm,
        ],
    ]);

    register_rest_route($ns, '/menu-locations', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $p = quasar_json_params($request);
            $location = isset($p['location']) ? sanitize_key($p['location']) : '';
            $registered = get_registered_nav_menus();
            if (!isset($registered[$location])) {
                return new WP_Error('bad_request', 'This theme has no menu location "' . $location . '". Known: ' . implode(', ', array_keys($registered)), ['status' => 400]);
            }
            $menu_id = isset($p['menu_id']) ? (int) $p['menu_id'] : 0;
            if ($menu_id && !wp_get_nav_menu_object($menu_id)) {
                return new WP_Error('not_found', 'Menu not found.', ['status' => 404]);
            }
            $locations = get_theme_mod('nav_menu_locations');
            $locations = is_array($locations) ? $locations : [];
            $previous = (int) ($locations[$location] ?? 0);
            $locations[$location] = $menu_id;
            set_theme_mod('nav_menu_locations', $locations);
            return rest_ensure_response(['success' => true, 'location' => $location, 'menu_id' => $menu_id, 'previous_menu_id' => $previous]);
        },
        'permission_callback' => $perm,
    ]);

    // ─── Site setup ───

    register_rest_route($ns, '/site-setup', [
        [
            'methods'  => 'GET',
            'callback' => function () {
                return rest_ensure_response(['success' => true, 'setup' => quasar_site_setup_values()]);
            },
            'permission_callback' => $perm,
        ],
        [
            'methods'  => 'PATCH',
            'callback' => function ($request) {
                $p = quasar_json_params($request);
                $before = quasar_site_setup_values();
                $changed = [];
                foreach ($p as $key => $value) {
                    $result = quasar_apply_setup_option($key, $value);
                    if (is_wp_error($result)) {
                        return new WP_Error('bad_request', $result->get_error_message() . (empty($changed) ? '' : ' (Already changed: ' . implode(', ', $changed) . '.)'), ['status' => 400]);
                    }
                    $changed[] = $key;
                }
                if (empty($changed)) {
                    return new WP_Error('bad_request', 'Nothing to change.', ['status' => 400]);
                }
                return rest_ensure_response(['success' => true, 'changed' => $changed, 'before' => $before, 'setup' => quasar_site_setup_values()]);
            },
            'permission_callback' => $perm,
        ],
    ]);

    // ─── Media (list and read are in the main plugin file) ───

    register_rest_route($ns, '/media/(?P<id>\d+)', [
        [
            'methods'  => 'PATCH',
            'callback' => function ($request) {
                $id = (int) $request['id'];
                $post = get_post($id);
                if (!$post || $post->post_type !== 'attachment') {
                    return new WP_Error('not_found', 'Media item not found.', ['status' => 404]);
                }
                $p = quasar_json_params($request);
                $update = ['ID' => $id];
                if (isset($p['title'])) {
                    $update['post_title'] = sanitize_text_field($p['title']);
                }
                if (isset($p['caption'])) {
                    $update['post_excerpt'] = wp_kses_post($p['caption']);
                }
                if (isset($p['description'])) {
                    $update['post_content'] = wp_kses_post($p['description']);
                }
                if (count($update) > 1) {
                    $result = wp_update_post(wp_slash($update), true);
                    if (is_wp_error($result)) {
                        return new WP_Error('update_failed', $result->get_error_message(), ['status' => 500]);
                    }
                }
                if (isset($p['alt'])) {
                    update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field($p['alt']));
                }
                $post = get_post($id);
                return rest_ensure_response([
                    'success' => true,
                    'id'      => $id,
                    'title'   => $post->post_title,
                    'alt'     => get_post_meta($id, '_wp_attachment_image_alt', true),
                    'caption' => $post->post_excerpt,
                    'url'     => wp_get_attachment_url($id),
                ]);
            },
            'permission_callback' => $perm,
        ],
        [
            'methods'  => 'DELETE',
            'callback' => function ($request) {
                $id = (int) $request['id'];
                $post = get_post($id);
                if (!$post || $post->post_type !== 'attachment') {
                    return new WP_Error('not_found', 'Media item not found.', ['status' => 404]);
                }
                $used = quasar_media_usage($id);
                if (!empty($used) && $request->get_param('even_if_used') !== 'true') {
                    return new WP_Error('in_use', 'This file is used on the site, so it was not deleted.', ['status' => 409, 'used_in' => $used]);
                }
                $title = $post->post_title;
                if (!wp_delete_attachment($id, true)) {
                    return new WP_Error('delete_failed', 'The file could not be deleted.', ['status' => 500]);
                }
                return rest_ensure_response(['success' => true, 'deleted' => $title]);
            },
            'permission_callback' => $perm,
        ],
    ]);

    register_rest_route($ns, '/media/from-url', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $p = quasar_json_params($request);
            $url = isset($p['url']) ? esc_url_raw($p['url']) : '';
            if (!preg_match('#^https?://#i', $url)) {
                return new WP_Error('bad_request', 'A public http(s) file address is required.', ['status' => 400]);
            }
            quasar_tools_admin_includes();
            $tmp = download_url($url, 60); // wp_safe_remote_get: refuses private network addresses
            if (is_wp_error($tmp)) {
                return new WP_Error('download_failed', 'Could not download the file: ' . $tmp->get_error_message(), ['status' => 400]);
            }
            $name = sanitize_file_name(wp_basename((string) wp_parse_url($url, PHP_URL_PATH)));
            if (!preg_match('/\.[a-z0-9]{2,5}$/i', $name)) {
                $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'][wp_get_image_mime($tmp) ?: ''] ?? '';
                $name = ($name ?: 'file') . ($ext ? ".$ext" : '');
            }
            $file = ['name' => $name, 'tmp_name' => $tmp];
            $id = media_handle_sideload($file, isset($p['attach_to']) ? (int) $p['attach_to'] : 0, isset($p['title']) ? sanitize_text_field($p['title']) : null);
            if (is_wp_error($id)) {
                @unlink($tmp);
                return new WP_Error('upload_failed', $id->get_error_message(), ['status' => 400]);
            }
            if (isset($p['alt'])) {
                update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field($p['alt']));
            }
            return rest_ensure_response(['success' => true, 'id' => (int) $id, 'url' => wp_get_attachment_url($id), 'title' => get_the_title($id)]);
        },
        'permission_callback' => $perm,
    ]);

    // ─── Plugins (read-only) ───

    register_rest_route($ns, '/plugins', [
        'methods'  => 'GET',
        'callback' => function () {
            quasar_tools_admin_includes();
            $updates = get_site_transient('update_plugins');
            $list = [];
            foreach (get_plugins() as $file => $data) {
                $update = $updates && isset($updates->response[$file]) ? $updates->response[$file] : null;
                $list[] = [
                    'plugin'           => $file,
                    'name'             => $data['Name'],
                    'version'          => $data['Version'],
                    'active'           => is_plugin_active($file),
                    'update_available' => $update ? $update->new_version : null,
                ];
            }
            return rest_ensure_response(['success' => true, 'plugins' => $list]);
        },
        'permission_callback' => $perm,
    ]);

    // ─── Backups (UpdraftPlus) ───

    register_rest_route($ns, '/backups', [
        'methods'  => 'GET',
        'callback' => function () {
            return rest_ensure_response(array_merge(['success' => true], quasar_updraft_status()));
        },
        'permission_callback' => $perm,
    ]);

    register_rest_route($ns, '/backups/run', [
        'methods'  => 'POST',
        'callback' => function ($request) {
            $status = quasar_updraft_status();
            if (!$status['active']) {
                return new WP_Error('not_ready', 'UpdraftPlus is not installed and active on this site.', ['status' => 400]);
            }
            $p = quasar_json_params($request);
            $what = isset($p['what']) ? $p['what'] : 'all';
            $hooks = [
                'all'      => 'updraft_backupnow_backup_all',
                'database' => 'updraft_backupnow_backup_database',
                'files'    => 'updraft_backupnow_backup',
            ];
            if (!isset($hooks[$what])) {
                return new WP_Error('bad_request', 'what must be all, database or files.', ['status' => 400]);
            }
            $hook = $hooks[$what];
            if (!has_action($hook)) {
                return new WP_Error('not_supported', 'This UpdraftPlus version does not accept backup requests from other plugins. Start the backup in WordPress → Settings → UpdraftPlus Backups.', ['status' => 501]);
            }
            // The same background event UpdraftPlus's own "Backup Now" button queues.
            wp_schedule_single_event(time(), $hook, [['nocloud' => 0]]);
            spawn_cron();
            return rest_ensure_response([
                'success'    => true,
                'started'    => $what,
                'cron_off'   => defined('DISABLE_WP_CRON') && DISABLE_WP_CRON,
                'restore_url'=> $status['restore_url'],
            ]);
        },
        'permission_callback' => $perm,
    ]);
});

// ─── Helpers ───

function quasar_site_setup_values() {
    $theme = wp_get_theme();
    $page_title = function ($id) {
        return $id ? get_the_title($id) : '';
    };
    return [
        'blogname'               => get_option('blogname'),
        'blogdescription'        => get_option('blogdescription'),
        'show_on_front'          => get_option('show_on_front'),
        'page_on_front'          => (int) get_option('page_on_front'),
        'page_on_front_title'    => $page_title((int) get_option('page_on_front')),
        'page_for_posts'         => (int) get_option('page_for_posts'),
        'page_for_posts_title'   => $page_title((int) get_option('page_for_posts')),
        'permalink_structure'    => get_option('permalink_structure'),
        'timezone_string'        => get_option('timezone_string'),
        'date_format'            => get_option('date_format'),
        'time_format'            => get_option('time_format'),
        'start_of_week'          => (int) get_option('start_of_week'),
        'posts_per_page'         => (int) get_option('posts_per_page'),
        'blog_public'            => (int) get_option('blog_public'),
        'default_comment_status' => get_option('default_comment_status'),
        'site_icon'              => (int) get_option('site_icon'),
        'theme'                  => $theme->get('Name') . ' ' . $theme->get('Version'),
        'wp_version'             => get_bloginfo('version'),
    ];
}

/** Changes one site setting after checking the value. */
function quasar_apply_setup_option($key, $value) {
    switch ($key) {
        case 'blogname':
        case 'blogdescription':
            update_option($key, sanitize_text_field((string) $value));
            return true;
        case 'show_on_front':
            if (!in_array($value, ['posts', 'page'], true)) {
                return new WP_Error('bad', 'show_on_front must be "posts" or "page".');
            }
            update_option($key, $value);
            return true;
        case 'page_on_front':
        case 'page_for_posts':
            $id = (int) $value;
            if ($id && (!get_post($id) || get_post_type($id) !== 'page')) {
                return new WP_Error('bad', "$key must be the ID of an existing page (or 0).");
            }
            update_option($key, $id);
            return true;
        case 'permalink_structure':
            global $wp_rewrite;
            $structure = sanitize_option('permalink_structure', (string) $value);
            $wp_rewrite->set_permalink_structure($structure);
            flush_rewrite_rules(false);
            return true;
        case 'timezone_string':
            if (!in_array($value, timezone_identifiers_list(), true)) {
                return new WP_Error('bad', 'timezone_string must be a time zone like "Europe/Amsterdam".');
            }
            update_option($key, $value);
            update_option('gmt_offset', '');
            return true;
        case 'date_format':
        case 'time_format':
            update_option($key, sanitize_option($key, (string) $value));
            return true;
        case 'start_of_week':
            $day = (int) $value;
            if ($day < 0 || $day > 6) {
                return new WP_Error('bad', 'start_of_week must be 0 (Sunday) to 6 (Saturday).');
            }
            update_option($key, $day);
            return true;
        case 'posts_per_page':
            $n = (int) $value;
            if ($n < 1 || $n > 100) {
                return new WP_Error('bad', 'posts_per_page must be between 1 and 100.');
            }
            update_option($key, $n);
            return true;
        case 'blog_public':
            update_option($key, $value ? 1 : 0);
            return true;
        case 'default_comment_status':
            if (!in_array($value, ['open', 'closed'], true)) {
                return new WP_Error('bad', 'default_comment_status must be "open" or "closed".');
            }
            update_option($key, $value);
            return true;
        case 'site_icon':
            $id = (int) $value;
            if ($id && !wp_attachment_is_image($id)) {
                return new WP_Error('bad', 'site_icon must be the ID of an image in the media library (or 0).');
            }
            update_option($key, $id);
            return true;
    }
    return new WP_Error('bad', "\"$key\" can't be changed here.");
}

/** Posts and pages that show this file (as featured image or in their content). */
function quasar_media_usage($id) {
    global $wpdb;
    $used = [];
    $featured = $wpdb->get_col($wpdb->prepare("SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_thumbnail_id' AND meta_value = %d LIMIT 20", $id));
    $file = get_post_meta($id, '_wp_attached_file', true);
    $in_content = [];
    if ($file) {
        $base = preg_replace('/\.[^.]+$/', '', wp_basename($file));
        $in_content = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM $wpdb->posts WHERE post_status IN ('publish','draft','future','pending','private') AND post_type NOT IN ('attachment','revision') AND post_content LIKE %s LIMIT 20",
            '%' . $wpdb->esc_like($base) . '%'
        ));
    }
    foreach (array_unique(array_merge($featured, $in_content)) as $post_id) {
        $used[] = ['id' => (int) $post_id, 'title' => get_the_title($post_id), 'featured' => in_array($post_id, $featured)];
    }
    return $used;
}

function quasar_find_plugin_file($slug) {
    quasar_tools_admin_includes();
    foreach (array_keys(get_plugins()) as $file) {
        if (strpos($file, $slug . '/') === 0 || $file === $slug . '.php') {
            return $file;
        }
    }
    return '';
}

function quasar_updraft_status() {
    $file = quasar_find_plugin_file('updraftplus');
    $active = $file && is_plugin_active($file);
    $history = [];
    if ($active) {
        if (class_exists('UpdraftPlus_Backup_History') && method_exists('UpdraftPlus_Backup_History', 'get_history')) {
            $history = UpdraftPlus_Backup_History::get_history();
        } else {
            $history = get_option('updraft_backup_history', []);
        }
    }
    $backups = [];
    if (is_array($history)) {
        krsort($history);
        foreach (array_slice($history, 0, 20, true) as $timestamp => $set) {
            $parts = [];
            foreach (['db', 'plugins', 'themes', 'uploads', 'others'] as $part) {
                if (!empty($set[$part])) {
                    $parts[] = $part === 'db' ? 'database' : $part;
                }
            }
            $backups[] = [
                'timestamp' => (int) $timestamp,
                'date'      => wp_date('Y-m-d H:i', (int) $timestamp),
                'contains'  => $parts,
            ];
        }
    }
    global $wpdb;
    $running = $active ? (int) $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->options WHERE option_name LIKE 'updraft_jobdata_%'") : 0;
    return [
        'installed'   => (bool) $file,
        'active'      => $active,
        'plugin'      => $file,
        'version'     => $file ? (get_plugins()[$file]['Version'] ?? '') : '',
        'backups'     => $backups,
        'jobs_in_progress' => $running,
        'restore_url' => admin_url('options-general.php?page=updraftplus'),
    ];
}

/** The address a post will have once published (drafts get their future link). */
if (!function_exists('quasar_final_permalink')) {
    function quasar_final_permalink($post) {
        if (!$post) {
            return '';
        }
        if (!in_array($post->post_status, ['draft', 'pending', 'auto-draft'], true)) {
            return get_permalink($post);
        }
        if (!function_exists('get_sample_permalink')) {
            require_once ABSPATH . 'wp-admin/includes/post.php';
        }
        list($template, $name) = get_sample_permalink($post->ID);
        if (strpos($template, '%postname%') === false && strpos($template, '%pagename%') === false) {
            return get_permalink($post);
        }
        return str_replace(['%postname%', '%pagename%'], $name, $template);
    }
}

/**
 * HTML reduced to what matters for comparing it before and after wp_kses_post:
 * markup formatting is ignored (" />" vs "/>", quote style, entity spelling,
 * whitespace runs), while HTML comments - which hold Gutenberg block settings -
 * must match exactly.
 */
function quasar_markup_canon($html) {
    $parts = preg_split('/(<!--.*?-->)/s', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
    $out = '';
    foreach ($parts as $i => $part) {
        if ($i % 2 === 1) {
            $out .= $part;
            continue;
        }
        $part = preg_replace('/\s*\/\s*>/', '>', $part);
        $part = html_entity_decode($part, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $part = str_replace(['"', "'"], '', $part);
        $out .= preg_replace('/\s+/', ' ', $part);
    }
    return $out;
}

/** What the /posts/{id}/content route returns: the exact stored body and how it is shown. */
function quasar_content_payload($post) {
    $protected = quasar_filtered_pieces($post->post_content);
    return [
        'success'   => true,
        'id'        => $post->ID,
        'post_type' => $post->post_type,
        'status'    => $post->post_status,
        'title'     => $post->post_title,
        'link'      => quasar_final_permalink($post),
        'content'   => $post->post_content,
        'hash'      => md5($post->post_content),
        'builder'   => get_post_meta($post->ID, '_elementor_edit_mode', true) === 'builder' ? 'elementor' : '',
        // Markup WordPress's filter would remove (kept as is by small edits), or null when
        // the body can't be read with certainty.
        'protected_markup' => $protected === null ? null : quasar_summarize_pieces($protected),
        'plugin_version'   => QUASAR_ADDONS_VERSION,
    ];
}

/** The 422 reply for a body the filter would change: what, why, and what can be done. */
function quasar_would_be_filtered_error($content, array $safe) {
    $pieces = quasar_filtered_pieces($content);
    $filtered_markup = $pieces === null ? [] : quasar_summarize_pieces($pieces);
    $reason = $safe['code'] === 'nothing_protected' ? 'rest_would_be_filtered' : $safe['code'];
    $text = $safe['code'] === 'nothing_protected'
        ? 'WordPress would change the text or block settings of this post when saving it.'
        : $safe['message'];
    if (!empty($safe['details'])) {
        $text .= ' (' . implode(', ', $safe['details']) . ')';
    }
    return new WP_Error(
        'would_be_filtered',
        'Not saved: ' . $text,
        [
            'status'          => 422,
            'reason'          => $reason,
            'reason_text'     => $text,
            'details'         => $safe['details'],
            'filtered_markup' => $filtered_markup,
            'plugin_version'  => QUASAR_ADDONS_VERSION,
        ]
    );
}
