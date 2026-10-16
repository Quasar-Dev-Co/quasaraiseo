<?php
/**
 * Safe writes for the Quasar dashboard connection (added in 2.2.2).
 *
 * 1. quasar_update_post_keep_body(): change a post's title, excerpt, slug, status or
 *    date without running the stored body through WordPress's HTML filter again.
 *    The connection token has no WordPress user, so a plain wp_update_post() filters
 *    the whole body (wp_filter_post_kses) and deletes embeds, <style> blocks, forms,
 *    scripts and inline designs the site owner put there - even when only the title
 *    changed.
 * 2. SEO title / description / focus keyword written to every place a page can read
 *    them from (Custom Web Render, Yoast, Rank Math, SEOPress, The SEO Framework), and
 *    the page caches emptied, so a saved SEO title is the one visitors and Google see.
 * 3. quasar_safe_body_save(): save a small edit to a post that contains markup the HTML
 *    filter would remove. Markup that was already in the post is kept byte for byte;
 *    everything else goes through the filter. See the function for the exact rules.
 */

if (!defined('ABSPATH')) {
    exit;
}

// ─── Saving post fields without filtering the body again ───

/**
 * wp_update_post() for everything except the body: the stored post_content is saved
 * back exactly as it is. Use only when $postarr has no post_content.
 */
function quasar_update_post_keep_body(array $postarr) {
    unset($postarr['post_content'], $postarr['post_content_filtered']);
    $removed = [];
    foreach (['content_save_pre', 'content_filtered_save_pre'] as $hook) {
        $priority = has_filter($hook, 'wp_filter_post_kses');
        if ($priority !== false) {
            remove_filter($hook, 'wp_filter_post_kses', $priority);
            $removed[$hook] = $priority;
        }
    }
    $result = wp_update_post(wp_slash($postarr), true);
    foreach ($removed as $hook => $priority) {
        add_filter($hook, 'wp_filter_post_kses', $priority);
    }
    return $result;
}

/** Saves a body that was already checked (quasar_safe_body_save) without filtering it again. */
function quasar_update_post_body_checked($post_id, $content) {
    $removed = [];
    foreach (['content_save_pre', 'content_filtered_save_pre'] as $hook) {
        $priority = has_filter($hook, 'wp_filter_post_kses');
        if ($priority !== false) {
            remove_filter($hook, 'wp_filter_post_kses', $priority);
            $removed[$hook] = $priority;
        }
    }
    $result = wp_update_post(wp_slash(['ID' => $post_id, 'post_content' => $content]), true);
    foreach ($removed as $hook => $priority) {
        add_filter($hook, 'wp_filter_post_kses', $priority);
    }
    return $result;
}

// ─── SEO fields ───

/** The SEO plugin that writes the <title> and meta description on normal pages. */
function quasar_seo_plugin() {
    if (defined('WPSEO_VERSION')) {
        return 'yoast';
    }
    if (defined('RANK_MATH_VERSION') || class_exists('RankMath')) {
        return 'rankmath';
    }
    if (defined('SEOPRESS_VERSION')) {
        return 'seopress';
    }
    if (defined('AIOSEO_VERSION') || function_exists('aioseo')) {
        return 'aioseo';
    }
    if (defined('THE_SEO_FRAMEWORK_VERSION')) {
        return 'seoframework';
    }
    if (defined('SQ_VERSION')) {
        return 'squirrly';
    }
    return 'none';
}

/** Post meta keys that hold the SEO title, description and focus keyword, per plugin. */
function quasar_seo_store_keys() {
    return [
        'cwr'          => ['title' => '_cwr_meta_title', 'description' => '_cwr_meta_description', 'keyword' => '_cwr_focus_keyword'],
        'yoast'        => ['title' => '_yoast_wpseo_title', 'description' => '_yoast_wpseo_metadesc', 'keyword' => '_yoast_wpseo_focuskw'],
        'rankmath'     => ['title' => 'rank_math_title', 'description' => 'rank_math_description', 'keyword' => 'rank_math_focus_keyword'],
        'seopress'     => ['title' => '_seopress_titles_title', 'description' => '_seopress_titles_desc', 'keyword' => '_seopress_analysis_target_kw'],
        'seoframework' => ['title' => '_genesis_title', 'description' => '_genesis_description', 'keyword' => ''],
    ];
}

/** Every SEO store's current values for a post, keyed by meta key. */
function quasar_seo_stores($post_id) {
    $out = [];
    foreach (quasar_seo_store_keys() as $keys) {
        foreach ($keys as $key) {
            if ($key !== '') {
                $out[$key] = (string) get_post_meta($post_id, $key, true);
            }
        }
    }
    return $out;
}

/** True when a page is shown through Custom Web Render (the theme and wp_head do not run). */
function quasar_is_custom_rendered($post_id) {
    if (get_post_meta($post_id, Custom_Web_Render::META_ENABLED, true) !== '1') {
        return false;
    }
    return trim((string) get_post_meta($post_id, Custom_Web_Render::META_HTML, true)) !== '';
}

/**
 * Writes the SEO title, description and/or focus keyword (null = leave as is) to
 * Custom Web Render and every SEO plugin store, so whichever one renders the page shows
 * the same value. Returns the stores that were written.
 */
function quasar_write_seo_fields($post_id, $title, $description, $keyword) {
    $written = [];
    $active = quasar_seo_plugin();
    foreach (quasar_seo_store_keys() as $store => $keys) {
        // The SEO Framework fields only matter when it is the plugin in use.
        if ($store === 'seoframework' && $active !== 'seoframework') {
            continue;
        }
        foreach (['title' => $title, 'description' => $description, 'keyword' => $keyword] as $field => $value) {
            if ($value === null || $keys[$field] === '') {
                continue;
            }
            $clean = $field === 'description' ? sanitize_textarea_field($value) : sanitize_text_field($value);
            update_post_meta($post_id, $keys[$field], wp_slash($clean));
            $written[$store] = true;
        }
    }
    return array_keys($written);
}

/**
 * What the page uses now: the SEO plugin's own field first (it is what its editor box
 * changes), then Custom Web Render's, then the others. Mirrors Custom_Web_Render.
 */
function quasar_effective_seo($post_id) {
    $post = get_post($post_id);
    $plugin = quasar_seo_plugin();
    $title = Custom_Web_Render::get_meta_title($post_id);
    $description = Custom_Web_Render::get_meta_description($post_id);
    return [
        'plugin'           => $plugin,
        'supported'        => !in_array($plugin, ['aioseo', 'squirrly'], true),
        'custom_render'    => quasar_is_custom_rendered($post_id),
        'title'            => $title !== '' ? $title : ($post ? $post->post_title : ''),
        'title_is_default' => $title === '',
        'description'      => $description,
        'focus_keyword'    => (string) Custom_Web_Render::get_focus_keyword($post_id),
        'stores'           => quasar_seo_stores($post_id),
    ];
}

/** Empties the page caches that hold this post, for the cache plugins that allow it. */
function quasar_purge_page_cache($post_id) {
    $url = get_permalink($post_id);
    $purged = [];
    clean_post_cache($post_id);
    if (defined('LSCWP_V') || has_action('litespeed_purge_post')) {
        do_action('litespeed_purge_post', $post_id);
        $purged[] = 'LiteSpeed Cache';
    }
    if (function_exists('rocket_clean_post')) {
        rocket_clean_post($post_id);
        $purged[] = 'WP Rocket';
    }
    if (function_exists('w3tc_flush_post')) {
        w3tc_flush_post($post_id);
        $purged[] = 'W3 Total Cache';
    }
    if (function_exists('wpsc_delete_post_cache')) {
        wpsc_delete_post_cache($post_id);
        $purged[] = 'WP Super Cache';
    }
    if (function_exists('wpfc_clear_post_cache_by_id')) {
        wpfc_clear_post_cache_by_id($post_id);
        $purged[] = 'WP Fastest Cache';
    }
    if (function_exists('sg_cachepress_purge_cache') && $url) {
        sg_cachepress_purge_cache($url);
        $purged[] = 'SiteGround Optimizer';
    }
    if (has_action('rt_nginx_helper_purge_url') && $url) {
        do_action('rt_nginx_helper_purge_url', $url);
        $purged[] = 'Nginx Helper';
    }
    if (has_action('breeze_clear_all_cache')) {
        do_action('breeze_clear_all_cache');
        $purged[] = 'Breeze';
    }
    return $purged;
}

// ─── Reading HTML the way a browser does ───

/** Elements whose content is text, not markup, until their own end tag. */
function quasar_raw_text_elements() {
    return ['script', 'style', 'textarea', 'title', 'iframe', 'noscript', 'noembed', 'noframes', 'xmp'];
}

function quasar_is_html_space($c) {
    return $c === ' ' || $c === "\t" || $c === "\n" || $c === "\f" || $c === "\r";
}

function quasar_is_ascii_letter($c) {
    return $c !== '' && (($c >= 'a' && $c <= 'z') || ($c >= 'A' && $c <= 'Z'));
}

/**
 * Where a tag ends (the index after its ">"), following the HTML tokenizer's tag and
 * attribute states: a ">" inside a quoted attribute value does not end the tag, and a
 * quote only starts a value after "=". $p is the index right after "<" or "</".
 * Returns false when the tag never ends.
 */
function quasar_tag_end($html, $p) {
    $len = strlen($html);
    $state = 'name';
    $quote = '';
    for (; $p < $len; $p++) {
        $c = $html[$p];
        switch ($state) {
            case 'name':
                if ($c === '>') {
                    return $p + 1;
                }
                if (quasar_is_html_space($c)) {
                    $state = 'before_attr';
                } elseif ($c === '/') {
                    $state = 'self_closing';
                }
                break;
            case 'before_attr':
                if (quasar_is_html_space($c)) {
                    break;
                }
                if ($c === '/') {
                    $state = 'self_closing';
                } elseif ($c === '>') {
                    return $p + 1;
                } else {
                    $state = 'attr_name'; // "=" here starts a name, as in browsers
                }
                break;
            case 'attr_name':
                if (quasar_is_html_space($c)) {
                    $state = 'after_attr';
                } elseif ($c === '/') {
                    $state = 'self_closing';
                } elseif ($c === '>') {
                    return $p + 1;
                } elseif ($c === '=') {
                    $state = 'before_value';
                }
                break;
            case 'after_attr':
                if (quasar_is_html_space($c)) {
                    break;
                }
                if ($c === '/') {
                    $state = 'self_closing';
                } elseif ($c === '=') {
                    $state = 'before_value';
                } elseif ($c === '>') {
                    return $p + 1;
                } else {
                    $state = 'attr_name';
                }
                break;
            case 'before_value':
                if (quasar_is_html_space($c)) {
                    break;
                }
                if ($c === '"' || $c === "'") {
                    $quote = $c;
                    $state = 'quoted';
                } elseif ($c === '>') {
                    return $p + 1;
                } else {
                    $state = 'unquoted';
                }
                break;
            case 'quoted':
                if ($c === $quote) {
                    $state = 'after_quoted';
                }
                break;
            case 'after_quoted':
                if (quasar_is_html_space($c)) {
                    $state = 'before_attr';
                } elseif ($c === '/') {
                    $state = 'self_closing';
                } elseif ($c === '>') {
                    return $p + 1;
                } else {
                    $state = 'before_attr';
                    $p--; // read this character again as the start of a name
                }
                break;
            case 'unquoted':
                if (quasar_is_html_space($c)) {
                    $state = 'before_attr';
                } elseif ($c === '>') {
                    return $p + 1;
                }
                break;
            case 'self_closing':
                if ($c === '>') {
                    return $p + 1;
                }
                $state = 'before_attr';
                $p--;
                break;
        }
    }
    return false;
}

/** The end of a raw-text element's end tag ("</script ...>"), or false when it has none. */
function quasar_raw_text_end($html, $from, $name) {
    $len = strlen($html);
    $n = strlen($name);
    $p = $from;
    while (($p = stripos($html, '</' . $name, $p)) !== false) {
        $after = $p + 2 + $n;
        $c = $after < $len ? $html[$after] : '';
        if ($c === '>' || $c === '/' || quasar_is_html_space($c)) {
            $end = quasar_tag_end($html, $p + 2);
            return $end === false ? false : [$p, $end];
        }
        $p = $after;
    }
    return false;
}

/**
 * Splits HTML into the pieces a browser's tokenizer sees: text, tags, comments,
 * "raw" elements (script, style, iframe, textarea... with their content and end tag)
 * and "bogus" comments (<!...>, <?...>, </1...>). Each piece is [type, start, end, name].
 * Returns null for HTML this reader does not follow exactly (a tag or comment that
 * never ends, <plaintext>, a script containing "<!--"), so callers don't rely on it.
 */
function quasar_html_tokens($html) {
    $len = strlen($html);
    $tokens = [];
    $text_start = 0;
    $i = 0;
    while (($lt = strpos($html, '<', $i)) !== false) {
        $next = $lt + 1 < $len ? $html[$lt + 1] : '';
        $type = '';
        $name = '';
        $end = false;
        if (quasar_is_ascii_letter($next)) {
            $end = quasar_tag_end($html, $lt + 1);
            if ($end === false) {
                return null;
            }
            $type = 'tag';
            preg_match('/[^\s\/>]*/A', $html, $m, 0, $lt + 1);
            $name = strtolower($m[0]);
            if ($name === 'plaintext') {
                return null;
            }
            if (in_array($name, quasar_raw_text_elements(), true)) {
                $close = quasar_raw_text_end($html, $end, $name);
                if ($close === false) {
                    return null;
                }
                // "<!--" inside a script switches browsers to states where "</script>" may not end it.
                if ($name === 'script' && strpos(substr($html, $end, $close[0] - $end), '<!--') !== false) {
                    return null;
                }
                $type = 'raw';
                $end = $close[1];
            }
        } elseif ($next === '/') {
            $after = $lt + 2 < $len ? $html[$lt + 2] : '';
            if (quasar_is_ascii_letter($after)) {
                $end = quasar_tag_end($html, $lt + 2);
                if ($end === false) {
                    return null;
                }
                $type = 'tag';
                preg_match('/[^\s\/>]*/A', $html, $m, 0, $lt + 2);
                $name = '/' . strtolower($m[0]);
            } elseif ($after === '') {
                $i = $lt + 1; // "</" at the very end is text
                continue;
            } else {
                $gt = strpos($html, '>', $lt + 2);
                if ($gt === false) {
                    return null;
                }
                $type = 'bogus';
                $end = $gt + 1;
            }
        } elseif ($next === '!') {
            if (substr($html, $lt + 2, 2) === '--') {
                $p = $lt + 4;
                if (substr($html, $p, 1) === '>') {
                    $end = $p + 1;
                } elseif (substr($html, $p, 2) === '->') {
                    $end = $p + 2;
                } else {
                    $a = strpos($html, '-->', $p);
                    $b = strpos($html, '--!>', $p);
                    if ($a === false && $b === false) {
                        return null;
                    }
                    $end = ($b !== false && ($a === false || $b < $a)) ? $b + 4 : $a + 3;
                }
                $type = 'comment';
            } else {
                $gt = strpos($html, '>', $lt + 2);
                if ($gt === false) {
                    return null;
                }
                $type = 'bogus';
                $end = $gt + 1;
            }
        } elseif ($next === '?') {
            $gt = strpos($html, '>', $lt + 2);
            if ($gt === false) {
                return null;
            }
            $type = 'bogus';
            $end = $gt + 1;
        } else {
            $i = $lt + 1; // "<" followed by anything else is text
            continue;
        }
        if ($lt > $text_start) {
            $tokens[] = ['text', $text_start, $lt, ''];
        }
        $tokens[] = [$type, $lt, $end, $name];
        $i = $text_start = $end;
    }
    if ($text_start < $len) {
        $tokens[] = ['text', $text_start, $len, ''];
    }
    return $tokens;
}

/** True when the HTML filter would remove or change something real in this piece. */
function quasar_piece_is_filtered($piece) {
    $filtered = wp_kses_post($piece);
    return $filtered !== $piece && quasar_markup_canon($filtered) !== quasar_markup_canon($piece);
}

/**
 * The pieces of $html the filter would remove or change (tags, raw elements, bogus
 * comments; text and comments are checked with the whole document), as strings in
 * document order, plus whether the HTML has inline SVG/MathML next to scripts or styles.
 * Null when the HTML can't be read exactly.
 */
function quasar_filtered_pieces($html) {
    $tokens = quasar_html_tokens($html);
    if ($tokens === null) {
        return null;
    }
    $pieces = [];
    $foreign = false;
    $raw_code = false;
    foreach ($tokens as $t) {
        list($type, $start, $end, $name) = $t;
        if ($type === 'tag' && ($name === 'svg' || $name === 'math')) {
            $foreign = true;
        }
        if ($type === 'raw' && in_array($name, ['script', 'style'], true)) {
            $raw_code = true;
        }
        if ($type === 'text' || $type === 'comment') {
            continue;
        }
        $piece = substr($html, $start, $end - $start);
        if (quasar_piece_is_filtered($piece)) {
            $pieces[] = $piece;
        }
    }
    // Inside <svg>/<math> browsers read <script> and <style> differently, so don't rely
    // on this reader there.
    if ($foreign && $raw_code) {
        return null;
    }
    return $pieces;
}

/** A short, readable name for a piece the filter removes, e.g. "<iframe> element". */
function quasar_describe_filtered_piece($piece) {
    if (!preg_match('/^<\/?([a-zA-Z][^\s\/>]*)/', $piece, $m)) {
        if (strpos($piece, '<!') === 0 || strpos($piece, '<?') === 0) {
            return 'special markup (' . esc_html(substr($piece, 0, 30)) . ')';
        }
        return 'text';
    }
    $name = strtolower($m[1]);
    $closing = strpos($piece, '</') === 0;
    $filtered = wp_kses_post($piece);
    if (in_array($name, quasar_raw_text_elements(), true) && !$closing) {
        $labels = ['script' => '<script> code', 'style' => '<style> block', 'iframe' => '<iframe> embed', 'noscript' => '<noscript> block'];
        return isset($labels[$name]) ? $labels[$name] : "<$name> element";
    }
    if (trim($filtered) === '' || !preg_match('/^<\/?' . preg_quote($name, '/') . '\b/i', $filtered)) {
        return $closing ? "</$name> tag" : "<$name> element";
    }
    // The element is allowed; some of its attributes are not.
    preg_match_all('/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|\'[^\']*\'|[^\s>]*))?/', substr($piece, strlen($m[0])), $a);
    preg_match_all('/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|\'[^\']*\'|[^\s>]*))?/', substr($filtered, strlen($m[0])), $b);
    $before = array_combine(array_map('strtolower', $a[1]), $a[2]) ?: [];
    $after = array_combine(array_map('strtolower', $b[1]), $b[2]) ?: [];
    $parts = [];
    foreach ($before as $attr => $value) {
        if (!array_key_exists($attr, $after)) {
            $parts[] = "$attr attribute";
        } elseif ($attr === 'style' && trim($value, '"\' ') !== trim($after[$attr], '"\' ')) {
            $parts[] = 'part of the inline style';
        } elseif (trim($value, '"\' ') !== trim($after[$attr], '"\' ') && in_array($attr, ['href', 'src', 'action', 'data'], true)) {
            $parts[] = "$attr link";
        }
    }
    return $parts ? implode(', ', array_unique($parts)) . " on <$name>" : "<$name> markup";
}

/** "2 × <iframe> embed, <style> block" for a list of pieces. */
function quasar_summarize_pieces(array $pieces, $limit = 8) {
    $counts = [];
    foreach ($pieces as $piece) {
        $label = quasar_describe_filtered_piece($piece);
        $counts[$label] = isset($counts[$label]) ? $counts[$label] + 1 : 1;
    }
    $out = [];
    foreach ($counts as $label => $n) {
        $out[] = ($n > 1 ? "$n × " : '') . $label;
    }
    if (count($out) > $limit) {
        $rest = count($out) - $limit;
        $out = array_slice($out, 0, $limit);
        $out[] = "$rest more";
    }
    return $out;
}

/**
 * Saves an edited body for a post whose current body has markup the HTML filter would
 * remove (embeds, <style> blocks, scripts, forms, special attributes). Returns
 * ['ok' => true, 'content' => final body] or ['ok' => false, 'code', 'message', 'details'].
 *
 * The rules, which keep the token from adding anything the filter would not allow:
 * - Every filtered piece of the old body (a whole tag, or a whole script/style/iframe
 *   element with its content) must be in the new body unchanged, in the same order, and
 *   the new body may not have filtered pieces of its own.
 * - Those pieces are swapped for placeholders, the rest of the new body goes through
 *   wp_kses_post, and nothing but markup formatting may change there.
 * - Each placeholder must come out of the filter as its own comment, outside any tag;
 *   then the old pieces are put back in their places.
 * So the saved body is WordPress's filtered output plus markup that was already in the
 * post, byte for byte.
 */
function quasar_safe_body_save($old, $new) {
    $old_pieces = quasar_filtered_pieces($old);
    $new_tokens = quasar_html_tokens($new);
    if ($old_pieces === null || $new_tokens === null) {
        return [
            'ok' => false, 'code' => 'unreadable_markup',
            'message' => 'The post has markup this check cannot read with certainty (an unclosed tag or comment, a script containing "<!--", or inline SVG next to scripts or styles).',
            'details' => [],
        ];
    }

    // Filtered pieces of the new body, and the positions to swap for placeholders.
    $new_pieces = [];
    $spots = [];
    foreach ($new_tokens as $t) {
        list($type, $start, $end) = $t;
        if ($type === 'text' || $type === 'comment') {
            continue;
        }
        $piece = substr($new, $start, $end - $start);
        if (quasar_piece_is_filtered($piece)) {
            $new_pieces[] = $piece;
            $spots[] = [$start, $end];
        }
    }

    if ($new_pieces !== $old_pieces) {
        $old_left = $old_pieces;
        $added = [];
        foreach ($new_pieces as $piece) {
            $at = array_search($piece, $old_left, true);
            if ($at === false) {
                $added[] = $piece;
            } else {
                unset($old_left[$at]);
            }
        }
        if ($added) {
            // Something old is missing too: the edit changed it.
            if ($old_left) {
                return [
                    'ok' => false, 'code' => 'touches_protected_markup',
                    'message' => 'The edit changes markup that WordPress would filter (only an administrator in WordPress can save that markup).',
                    'details' => quasar_summarize_pieces(array_values($old_left)),
                ];
            }
            return [
                'ok' => false, 'code' => 'new_markup_not_allowed',
                'message' => 'The new text contains markup WordPress does not accept through the dashboard connection.',
                'details' => quasar_summarize_pieces($added),
            ];
        }
        return [
            'ok' => false, 'code' => 'touches_protected_markup',
            'message' => 'The edit changes, moves or removes markup that WordPress would filter (only an administrator in WordPress can save that markup).',
            'details' => quasar_summarize_pieces(array_values($old_left) ?: $old_pieces),
        ];
    }

    if (!$old_pieces) {
        return ['ok' => false, 'code' => 'nothing_protected', 'message' => 'The post has no protected markup.', 'details' => []];
    }

    $nonce = strtolower(wp_generate_password(12, false));
    $mark = function ($n) use ($nonce) {
        return "<!--quasar-keep-$nonce-$n-->";
    };
    $masked = '';
    $cursor = 0;
    foreach ($spots as $n => $spot) {
        $masked .= substr($new, $cursor, $spot[0] - $cursor) . $mark($n);
        $cursor = $spot[1];
    }
    $masked .= substr($new, $cursor);

    $filtered = wp_kses_post($masked);
    if ($filtered !== $masked && quasar_markup_canon($filtered) !== quasar_markup_canon($masked)) {
        return [
            'ok' => false, 'code' => 'rest_would_be_filtered',
            'message' => 'WordPress would also change other parts of the post (not only the protected markup).',
            'details' => [],
        ];
    }

    // Every placeholder must be a comment of its own, outside any tag, in order.
    $tokens = quasar_html_tokens($filtered);
    if ($tokens === null) {
        return ['ok' => false, 'code' => 'unreadable_markup', 'message' => 'The filtered post could not be read back with certainty.', 'details' => []];
    }
    $found = [];
    foreach ($tokens as $t) {
        if ($t[0] === 'comment' && preg_match('/^<!--quasar-keep-' . $nonce . '-(\d+)-->$/', substr($filtered, $t[1], $t[2] - $t[1]), $m)) {
            $found[] = [(int) $m[1], $t[1], $t[2]];
        }
    }
    if (count($found) !== count($spots) || substr_count($filtered, "quasar-keep-$nonce") !== count($spots)) {
        return ['ok' => false, 'code' => 'placement', 'message' => 'The protected markup would not stay where it was.', 'details' => []];
    }
    $out = '';
    $cursor = 0;
    foreach ($found as $k => $f) {
        if ($f[0] !== $k) {
            return ['ok' => false, 'code' => 'placement', 'message' => 'The protected markup would not stay in its order.', 'details' => []];
        }
        $out .= substr($filtered, $cursor, $f[1] - $cursor) . $new_pieces[$k];
        $cursor = $f[2];
    }
    $out .= substr($filtered, $cursor);

    return ['ok' => true, 'content' => $out, 'kept' => quasar_summarize_pieces($old_pieces)];
}
