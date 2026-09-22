<?php
/**
 * Full-page render template for Custom Web Render.
 *
 * This template intentionally bypasses the active theme markup.
 */

if (!defined('ABSPATH')) {
    exit;
}

Custom_Web_Render::render_custom_page(get_queried_object_id());
