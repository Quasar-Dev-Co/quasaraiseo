<?php
/**
 * Streamable HTTP MCP server and administration UI.
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Custom_Web_Render_MCP {
    const MENU_SLUG = 'custom-web-render-mcp';
    const REST_NAMESPACE = 'custom-web-render/v1';
    const REST_ROUTE = '/mcp';
    const LATEST_PROTOCOL = '2025-11-25';

    const OPTION_ENABLED = 'cwr_mcp_enabled';
    const OPTION_TOKENS = 'cwr_mcp_tokens';
    const OPTION_AUDIT_LOG = 'cwr_mcp_audit_log';

    private static $active_token = null;

    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'register_admin_page'), 20);
        add_action('admin_init', array(__CLASS__, 'handle_admin_actions'));
        add_action('rest_api_init', array(__CLASS__, 'register_rest_route'));
        add_filter('rest_pre_serve_request', array(__CLASS__, 'serve_empty_response'), 10, 4);
    }

    public static function activate() {
        add_option(self::OPTION_ENABLED, '1');
        add_option(self::OPTION_TOKENS, array(), '', false);
        add_option(self::OPTION_AUDIT_LOG, array(), '', false);
    }

    public static function register_admin_page() {
        add_submenu_page(
            Custom_Web_Render::MENU_SLUG,
            __('MCP Server', 'custom-web-render'),
            __('MCP Server', 'custom-web-render'),
            'manage_options',
            self::MENU_SLUG,
            array(__CLASS__, 'render_admin_page')
        );
    }

    public static function handle_admin_actions() {
        if (!is_admin() || !current_user_can('manage_options')) {
            return;
        }

        // Gate all MCP admin actions behind the combined-plugin email approval.
        // Settings save is allowed so the admin can disable the server while
        // awaiting approval, but token creation and config downloads are blocked.
        $is_approval_gated = isset($_POST['cwr_mcp_create_token'])
            || isset($_POST['cwr_mcp_revoke_token'])
            || isset($_GET['cwr_mcp_download_config'])
            || isset($_GET['cwr_mcp_download_installer']);

        if ($is_approval_gated && function_exists('quasar_is_approved') && !quasar_is_approved()) {
            wp_die(
                esc_html__('This site is awaiting approval from team quasara. MCP token creation and client config downloads are disabled until the site is approved.', 'custom-web-render'),
                esc_html__('Approval required', 'custom-web-render'),
                array('response' => 403, 'back_link' => true)
            );
        }

        if (isset($_POST['cwr_mcp_save_settings'])) {
            check_admin_referer('cwr_mcp_save_settings', 'cwr_mcp_settings_nonce');
            update_option(self::OPTION_ENABLED, isset($_POST['cwr_mcp_enabled']) ? '1' : '0');
            self::admin_redirect('settings_saved');
        }

        if (isset($_POST['cwr_mcp_create_token'])) {
            check_admin_referer('cwr_mcp_create_token', 'cwr_mcp_token_nonce');
            self::create_token();
        }

        if (isset($_POST['cwr_mcp_revoke_token'])) {
            check_admin_referer('cwr_mcp_revoke_token', 'cwr_mcp_revoke_nonce');
            self::revoke_token();
        }

        if (isset($_GET['cwr_mcp_download_config'])) {
            self::handle_download_config();
        }

        if (isset($_GET['cwr_mcp_download_installer'])) {
            self::handle_download_installer();
        }
    }

    /**
     * Stream a ready-to-merge MCP config file for a given desktop client.
     * Triggered by the one-click "Download config" buttons.
     */
    private static function handle_download_config() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $client = isset($_GET['client']) ? sanitize_key(wp_unslash($_GET['client'])) : '';
        $token = isset($_GET['token']) ? sanitize_text_field(wp_unslash($_GET['token'])) : '';
        $endpoint = rest_url(self::REST_NAMESPACE . self::REST_ROUTE);
        $server_name = self::server_name();

        // Token is only shown once at creation; reuse the transient if present.
        if ($token === '') {
            $transient = get_transient('cwr_mcp_new_token_' . get_current_user_id());
            if ($transient) {
                $token = $transient;
            }
        }

        $configs = array(
            'claude-desktop' => array(
                'filename' => 'claude_desktop_config.json',
                'payload'  => array(
                    'mcpServers' => array(
                        $server_name => array(
                            'type'    => 'http',
                            'url'     => $endpoint,
                            'headers' => array('Authorization' => 'Bearer ' . $token),
                        ),
                    ),
                ),
            ),
            'windsurf' => array(
                'filename' => 'mcp_config.json',
                'payload'  => array(
                    'mcpServers' => array(
                        $server_name => array(
                            'url'     => $endpoint,
                            'headers' => array('Authorization' => 'Bearer ' . $token),
                        ),
                    ),
                ),
            ),
        );

        if (!isset($configs[$client])) {
            wp_die(esc_html__('Unknown MCP client.', 'custom-web-render'), 400);
        }

        $config = $configs[$client];
        $json = wp_json_encode($config['payload'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $config['filename'] . '"');
        header('Content-Length: ' . strlen($json));
        echo $json;
        exit;
    }

    /**
     * Generate a platform-appropriate installer script that auto-detects
     * the client config path, backs up the existing file, safely merges
     * the new MCP server (preserving existing servers), and writes it.
     *
     * Triggered by the "Install script" buttons. Detects macOS/Linux vs
     * Windows from the browser user-agent and serves a bash or PowerShell
     * script accordingly.
     */
    private static function handle_download_installer() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $client = isset($_GET['client']) ? sanitize_key(wp_unslash($_GET['client'])) : '';
        $token = isset($_GET['token']) ? sanitize_text_field(wp_unslash($_GET['token'])) : '';
        $endpoint = rest_url(self::REST_NAMESPACE . self::REST_ROUTE);
        $server_name = self::server_name();
        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);

        if ($token === '') {
            $transient = get_transient('cwr_mcp_new_token_' . get_current_user_id());
            if ($transient) {
                $token = $transient;
            }
        }

        $clients = array(
            'claude-desktop' => array(
                'mac_config'   => '$HOME/Library/Application Support/Claude/claude_desktop_config.json',
                'win_config'   => '$env:APPDATA\\Claude\\claude_desktop_config.json',
                'mac_dir'      => '"$HOME/Library/Application Support/Claude"',
                'win_dir'      => '$env:APPDATA\\Claude',
                'server_entry' => array(
                    'type'    => 'http',
                    'url'     => $endpoint,
                    'headers' => array('Authorization' => 'Bearer ' . $token),
                ),
                'app_name'      => 'Claude Desktop',
                'restart_hint_mac' => 'Quit Claude Desktop completely (Cmd+Q) and reopen it.',
                'restart_hint_win' => 'Quit Claude Desktop completely and reopen it.',
            ),
            'windsurf' => array(
                'mac_config'   => '$HOME/.codeium/windsurf/mcp_config.json',
                'win_config'   => '$env:USERPROFILE\\.codeium\\windsurf\\mcp_config.json',
                'mac_dir'      => '"$HOME/.codeium/windsurf"',
                'win_dir'      => '$env:USERPROFILE\\.codeium\\windsurf',
                'server_entry' => array(
                    'url'     => $endpoint,
                    'headers' => array('Authorization' => 'Bearer ' . $token),
                ),
                'app_name'      => 'Windsurf',
                'restart_hint_mac' => 'Restart Windsurf for the new MCP server to appear.',
                'restart_hint_win' => 'Restart Windsurf for the new MCP server to appear.',
            ),
        );

        if (!isset($clients[$client])) {
            wp_die(esc_html__('Unknown MCP client.', 'custom-web-render'), 400);
        }

        $cfg = $clients[$client];
        $ua = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
        $is_windows = (stripos($ua, 'Windows') !== false);
        $server_entry_json = wp_json_encode($cfg['server_entry'], JSON_UNESCAPED_SLASHES);

        if ($is_windows) {
            $script = self::build_powershell_installer($client, $cfg, $server_name, $site_name, $server_entry_json);
            $filename = 'install-mcp-' . $client . '.ps1';
            $mime = 'text/plain; charset=utf-8';
        } else {
            $script = self::build_bash_installer($client, $cfg, $server_name, $site_name, $server_entry_json);
            $filename = 'install-mcp-' . $client . '.sh';
            $mime = 'text/x-shellscript; charset=utf-8';
        }

        nocache_headers();
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($script));
        echo $script;
        exit;
    }

    /**
     * Build a bash installer script (macOS/Linux) that safely merges
     * the MCP server entry into the client config using Python 3.
     */
    private static function build_bash_installer($client, $cfg, $server_name, $site_name, $server_entry_json) {
        $config_path = $cfg['mac_config'];
        $config_dir = $cfg['mac_dir'];
        $app_name = $cfg['app_name'];
        $restart_hint = $cfg['restart_hint_mac'];
        $safe_site = escapeshellarg($site_name);
        $safe_entry = escapeshellarg($server_entry_json);
        $safe_name = escapeshellarg($server_name);

        return <<<BASH
#!/usr/bin/env bash
set -euo pipefail

#
# Auto-installer: {$app_name} MCP server for "{$site_name}"
# Generated by the Custom Web Render WordPress plugin.
#
# This script will:
#   1. Locate your {$app_name} MCP config file.
#   2. Back up the existing config.
#   3. Merge the "{$server_name}" server (preserving any existing servers).
#   4. Write the updated config.
#
# Run it in Terminal:  bash install-mcp-{$client}.sh
#

CONFIG_PATH="{$config_path}"
SERVER_NAME={$safe_name}
SERVER_ENTRY={$safe_entry}

echo ""
echo "  Custom Web Render → {$app_name} MCP installer"
echo "  Server:  \$SERVER_NAME"
echo "  Config:  \$CONFIG_PATH"
echo ""

if ! command -v python3 >/dev/null 2>&1; then
    echo "  ERROR: python3 is required but was not found."
    echo "  Install Python 3 from https://www.python.org/downloads/ and retry."
    exit 1
fi

mkdir -p {$config_dir}

python3 - <<'PYEOF'
import json, os, sys, shutil, datetime

config_path = os.path.expandvars("{$config_path}")
server_name = {$safe_name}
server_entry = json.loads({$safe_entry})

# Read existing config or start fresh.
if os.path.exists(config_path):
    with open(config_path, "r") as f:
        try:
            config = json.load(f)
        except json.JSONDecodeError:
            print("  WARNING: existing config was invalid JSON; starting fresh.")
            config = {}
    # Backup.
    backup = config_path + ".backup-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copy2(config_path, backup)
    print(f"  Backed up existing config to: {backup}")
else:
    config = {}
    print("  No existing config found; creating a new one.")

# Merge — preserve other servers, add/update ours.
config.setdefault("mcpServers", {})
config["mcpServers"][server_name] = server_entry

# Write.
with open(config_path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\\n")

print(f"  ✓ Added '{server_name}' to {config_path}")
print(f"  Existing MCP servers preserved: {', '.join(k for k in config['mcpServers'] if k != server_name) or 'none'}")
PYEOF

echo ""
echo "  Done! {$restart_hint}"
echo ""

BASH;
    }

    /**
     * Build a PowerShell installer script (Windows) that safely merges
     * the MCP server entry into the client config.
     */
    private static function build_powershell_installer($client, $cfg, $server_name, $site_name, $server_entry_json) {
        $config_path = $cfg['win_config'];
        $config_dir = $cfg['win_dir'];
        $app_name = $cfg['app_name'];
        $restart_hint = $cfg['restart_hint_win'];
        // Escape for PowerShell single-quoted strings.
        $ps_entry = str_replace("'", "''", $server_entry_json);
        $ps_name = str_replace("'", "''", $server_name);

        return <<<PWSH
# Auto-installer: {$app_name} MCP server for "{$site_name}"
# Generated by the Custom Web Render WordPress plugin.
#
# This script will:
#   1. Locate your {$app_name} MCP config file.
#   2. Back up the existing config.
#   3. Merge the "{$server_name}" server (preserving any existing servers).
#   4. Write the updated config.
#
# Run it in PowerShell:  .\\install-mcp-{$client}.ps1
#

\$ErrorActionPreference = "Stop"

\$ConfigPath = "{$config_path}"
\$ServerName = "{$ps_name}"
\$ServerEntry = '{$ps_entry}' | ConvertFrom-Json
\$ConfigDir = "{$config_dir}"

Write-Host ""
Write-Host "  Custom Web Render -> {$app_name} MCP installer"
Write-Host "  Server:  \$ServerName"
Write-Host "  Config:  \$ConfigPath"
Write-Host ""

if (-not (Test-Path \$ConfigDir)) {
    New-Item -ItemType Directory -Path \$ConfigDir -Force | Out-Null
}

if (Test-Path \$ConfigPath) {
    try {
        \$Config = Get-Content \$ConfigPath -Raw | ConvertFrom-Json
    } catch {
        Write-Host "  WARNING: existing config was invalid JSON; starting fresh."
        \$Config = [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
    }
    \$Backup = \$ConfigPath + ".backup-" + (Get-Date -Format "yyyyMMdd-HHmmss")
    Copy-Item \$ConfigPath \$Backup
    Write-Host "  Backed up existing config to: \$Backup"
} else {
    \$Config = [PSCustomObject]@{ mcpServers = [PSCustomObject]@{} }
    Write-Host "  No existing config found; creating a new one."
}

if (-not \$Config.mcpServers) {
    \$Config | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([PSCustomObject]@{})
}

# Add or update our server entry (preserving others).
\$Config.mcpServers | Add-Member -NotePropertyName \$ServerName -NotePropertyValue \$ServerEntry -Force

\$Config | ConvertTo-Json -Depth 10 | Set-Content \$ConfigPath -Encoding UTF8

Write-Host "  Done! Added '\$ServerName' to \$ConfigPath"
Write-Host "  {$restart_hint}"
Write-Host ""

PWSH;
    }

    /**
     * Build a slug-safe MCP server label from the site name so connected
     * clients display the website name. Falls back to "wordpress-site".
     */
    private static function server_name() {
        $name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        $name = trim($name);
        if ($name === '') {
            return 'wordpress-site';
        }
        // Lowercase, replace non-alphanumeric runs with hyphens, trim edges.
        $slug = strtolower($name);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        if ($slug === '') {
            return 'wordpress-site';
        }
        return $slug;
    }

    private static function create_token() {
        $name = isset($_POST['cwr_mcp_token_name'])
            ? sanitize_text_field(wp_unslash($_POST['cwr_mcp_token_name']))
            : '';
        if ($name === '') {
            $name = __('MCP client', 'custom-web-render');
        }

        $allowed_scopes = array('read', 'write', 'settings');
        $requested_scopes = isset($_POST['cwr_mcp_scopes'])
            ? (array) wp_unslash($_POST['cwr_mcp_scopes'])
            : array();
        $scopes = array_values(array_intersect($allowed_scopes, array_map('sanitize_key', $requested_scopes)));
        if (!$scopes) {
            $scopes = array('read');
        }

        $raw_token = 'cwr_' . self::base64url_encode(random_bytes(36));
        $token_id = wp_generate_uuid4();
        $tokens = self::get_tokens();
        $tokens[$token_id] = array(
            'id' => $token_id,
            'name' => $name,
            'hash' => self::hash_token($raw_token),
            'preview' => substr($raw_token, 0, 10) . '...' . substr($raw_token, -6),
            'scopes' => $scopes,
            'user_id' => get_current_user_id(),
            'created_at' => current_time('mysql', true),
            'last_used_at' => '',
        );

        update_option(self::OPTION_TOKENS, $tokens, false);
        set_transient('cwr_mcp_new_token_' . get_current_user_id(), $raw_token, 10 * MINUTE_IN_SECONDS);
        self::admin_redirect('token_created');
    }

    private static function revoke_token() {
        $token_id = isset($_POST['cwr_mcp_token_id']) ? sanitize_text_field(wp_unslash($_POST['cwr_mcp_token_id'])) : '';
        $tokens = self::get_tokens();
        if (isset($tokens[$token_id])) {
            unset($tokens[$token_id]);
            update_option(self::OPTION_TOKENS, $tokens, false);
        }
        self::admin_redirect('token_revoked');
    }

    private static function admin_redirect($notice) {
        wp_safe_redirect(
            add_query_arg(
                array(
                    'page' => self::MENU_SLUG,
                    'cwr_mcp_notice' => $notice,
                ),
                admin_url('admin.php')
            )
        );
        exit;
    }

    public static function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $enabled = get_option(self::OPTION_ENABLED, '1') === '1';
        $tokens = self::get_tokens();
        $audit_log = get_option(self::OPTION_AUDIT_LOG, array());
        $new_token_key = 'cwr_mcp_new_token_' . get_current_user_id();
        $new_token = get_transient($new_token_key);
        if ($new_token) {
            delete_transient($new_token_key);
        }
        $endpoint = rest_url(self::REST_NAMESPACE . self::REST_ROUTE);
        $display_token = $new_token ? $new_token : 'YOUR_TOKEN';
        $is_approved = !function_exists('quasar_is_approved') || quasar_is_approved();
        ?>
        <div class="wrap cwr-wrap cwr-mcp-wrap">
            <h1><?php esc_html_e('Custom Web Render MCP', 'custom-web-render'); ?></h1>
            <?php if (class_exists('Custom_Web_Render') && method_exists('Custom_Web_Render', 'render_tabs')) { Custom_Web_Render::render_tabs('mcp'); } ?>
            <p class="description"><?php esc_html_e('Connect Codex, Claude Code, or any Streamable HTTP MCP client to manage WordPress content securely.', 'custom-web-render'); ?></p>
            <?php self::render_admin_notice(); ?>

            <?php if (!$is_approved) : ?>
                <div class="notice notice-error inline">
                    <p><strong><?php esc_html_e('Awaiting approval from team quasara.', 'custom-web-render'); ?></strong></p>
                    <p><?php esc_html_e('MCP token creation, client config downloads, and all MCP tool calls are disabled until the site is approved. You can still toggle the server enabled/disabled setting below.', 'custom-web-render'); ?></p>
                    <p>
                        <a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=quasar-ai-seo&tab=status')); ?>">
                            <?php esc_html_e('Go to approval settings', 'custom-web-render'); ?>
                        </a>
                    </p>
                </div>
            <?php endif; ?>

            <?php if (strpos($endpoint, 'https://') !== 0) : ?>
                <div class="notice notice-warning inline">
                    <p><?php esc_html_e('Use HTTPS before connecting a remote MCP client. Bearer tokens must not travel over plain HTTP.', 'custom-web-render'); ?></p>
                </div>
            <?php endif; ?>

            <?php if ($new_token) : ?>
                <div class="cwr-panel cwr-mcp-secret">
                    <h2><?php esc_html_e('New token', 'custom-web-render'); ?></h2>
                    <p><?php esc_html_e('Copy this token now. For security, it will not be shown again.', 'custom-web-render'); ?></p>
                    <div class="cwr-copy-row">
                        <code id="cwr-new-token"><?php echo esc_html($new_token); ?></code>
                        <button type="button" class="button cwr-copy-button" data-copy-target="cwr-new-token"><?php esc_html_e('Copy token', 'custom-web-render'); ?></button>
                    </div>
                </div>
            <?php endif; ?>

            <div class="cwr-mcp-grid">
                <section class="cwr-panel cwr-panel-editor">
                    <div class="cwr-panel-header">
                        <div>
                            <h2><?php esc_html_e('Server', 'custom-web-render'); ?></h2>
                            <p class="cwr-subtitle"><?php esc_html_e('Stateless Streamable HTTP with bearer-token authentication.', 'custom-web-render'); ?></p>
                        </div>
                        <span class="cwr-badge <?php echo $enabled ? 'is-active' : 'is-inactive'; ?>">
                            <?php echo $enabled ? esc_html__('Enabled', 'custom-web-render') : esc_html__('Disabled', 'custom-web-render'); ?>
                        </span>
                    </div>
                    <p><strong><?php esc_html_e('Endpoint', 'custom-web-render'); ?></strong></p>
                    <div class="cwr-copy-row">
                        <code id="cwr-mcp-endpoint"><?php echo esc_html($endpoint); ?></code>
                        <button type="button" class="button cwr-copy-button" data-copy-target="cwr-mcp-endpoint"><?php esc_html_e('Copy', 'custom-web-render'); ?></button>
                    </div>
                    <form method="post" class="cwr-mcp-inline-form">
                        <?php wp_nonce_field('cwr_mcp_save_settings', 'cwr_mcp_settings_nonce'); ?>
                        <label>
                            <input type="checkbox" name="cwr_mcp_enabled" value="1" <?php checked($enabled); ?>>
                            <?php esc_html_e('Enable the MCP endpoint', 'custom-web-render'); ?>
                        </label>
                        <button type="submit" name="cwr_mcp_save_settings" value="1" class="button"><?php esc_html_e('Save', 'custom-web-render'); ?></button>
                    </form>
                </section>

                <section class="cwr-panel cwr-panel-editor">
                    <h2><?php esc_html_e('Create access token', 'custom-web-render'); ?></h2>
                    <?php if (!$is_approved) : ?>
                        <p class="description"><?php esc_html_e('Token creation is disabled until the site is approved by team quasara.', 'custom-web-render'); ?></p>
                        <p>
                            <a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=quasar-ai-seo&tab=status')); ?>">
                                <?php esc_html_e('Go to approval settings', 'custom-web-render'); ?>
                            </a>
                        </p>
                    <?php else : ?>
                    <form method="post" class="cwr-form">
                        <?php wp_nonce_field('cwr_mcp_create_token', 'cwr_mcp_token_nonce'); ?>
                        <label class="cwr-field">
                            <span><?php esc_html_e('Token name', 'custom-web-render'); ?></span>
                            <input type="text" name="cwr_mcp_token_name" class="regular-text" placeholder="<?php esc_attr_e('Codex on my laptop', 'custom-web-render'); ?>">
                        </label>
                        <fieldset class="cwr-mcp-scopes">
                            <legend><?php esc_html_e('Permissions', 'custom-web-render'); ?></legend>
                            <label><input type="checkbox" name="cwr_mcp_scopes[]" value="read" checked> <?php esc_html_e('Read content', 'custom-web-render'); ?></label>
                            <label><input type="checkbox" name="cwr_mcp_scopes[]" value="write" checked> <?php esc_html_e('Create, edit, publish, and schedule', 'custom-web-render'); ?></label>
                            <label><input type="checkbox" name="cwr_mcp_scopes[]" value="settings" checked> <?php esc_html_e('Edit global render settings', 'custom-web-render'); ?></label>
                        </fieldset>
                        <p class="description"><?php esc_html_e('Write access can publish content and store trusted HTML or JavaScript that runs on your site. Only issue tokens to clients you trust.', 'custom-web-render'); ?></p>
                        <button type="submit" name="cwr_mcp_create_token" value="1" class="button button-primary"><?php esc_html_e('Generate token', 'custom-web-render'); ?></button>
                    </form>
                    <?php endif; ?>
                </section>
            </div>

            <section class="cwr-panel cwr-panel-global cwr-mcp-connections">
                <h2><?php esc_html_e('Connect a client', 'custom-web-render'); ?></h2>
                <p class="cwr-subtitle"><?php esc_html_e('One click connects this site (shown by its name) to each AI coding client.', 'custom-web-render'); ?></p>
                <?php if (!$is_approved) : ?>
                    <p class="description"><?php esc_html_e('Client connections are disabled until the site is approved by team quasara.', 'custom-web-render'); ?></p>
                <?php else : ?>
                <div class="cwr-mcp-grid">
                    <?php
                    $server_name = self::server_name();
                    $has_real_token = ($display_token !== 'YOUR_TOKEN');

                    // --- Cursor: true browser deep link ---
                    $cursor_config = array(
                        'url'     => $endpoint,
                        'headers' => array('Authorization' => 'Bearer ' . $display_token),
                    );
                    $cursor_config_b64 = self::base64url_encode(wp_json_encode($cursor_config));
                    $cursor_url = 'cursor://anysphere.cursor-deeplink/mcp/install?name=' . rawurlencode($server_name) . '&config=' . $cursor_config_b64;
                    self::render_client_connector(
                        'cursor',
                        __('Cursor', 'custom-web-render'),
                        __('Open in Cursor', 'custom-web-render'),
                        $cursor_url,
                        'deeplink',
                        "claude mcp add --transport http " . $server_name . " '" . $endpoint . "' \\\n"
                            . "  --header 'Authorization: Bearer " . $display_token . "'",
                        'cwr-cursor-config',
                        __('Cursor also supports Claude Code CLI:', 'custom-web-render')
                    );

                    // --- Claude Desktop: installer script (primary) + raw JSON (secondary) ---
                    $claude_installer = add_query_arg(
                        array(
                            'cwr_mcp_download_installer' => '1',
                            'client'                     => 'claude-desktop',
                            'token'                      => $display_token,
                        ),
                        admin_url('admin.php')
                    );
                    $claude_json = add_query_arg(
                        array(
                            'cwr_mcp_download_config' => '1',
                            'client'                  => 'claude-desktop',
                            'token'                   => $display_token,
                        ),
                        admin_url('admin.php')
                    );
                    self::render_client_connector(
                        'claude-desktop',
                        __('Claude Desktop', 'custom-web-render'),
                        __('Download installer', 'custom-web-render'),
                        $claude_installer,
                        'installer',
                        wp_json_encode(
                            array(
                                'mcpServers' => array(
                                    $server_name => array(
                                        'type'    => 'http',
                                        'url'     => $endpoint,
                                        'headers' => array('Authorization' => 'Bearer ' . $display_token),
                                    ),
                                ),
                            ),
                            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
                        ),
                        'cwr-claude-desktop-config',
                        __('Or merge this JSON manually into claude_desktop_config.json:', 'custom-web-render'),
                        array('url' => $claude_json, 'label' => __('Raw JSON', 'custom-web-render'))
                    );

                    // --- Windsurf: installer script (primary) + raw JSON (secondary) ---
                    $windsurf_installer = add_query_arg(
                        array(
                            'cwr_mcp_download_installer' => '1',
                            'client'                     => 'windsurf',
                            'token'                      => $display_token,
                        ),
                        admin_url('admin.php')
                    );
                    $windsurf_json = add_query_arg(
                        array(
                            'cwr_mcp_download_config' => '1',
                            'client'                  => 'windsurf',
                            'token'                   => $display_token,
                        ),
                        admin_url('admin.php')
                    );
                    self::render_client_connector(
                        'windsurf',
                        __('Windsurf', 'custom-web-render'),
                        __('Download installer', 'custom-web-render'),
                        $windsurf_installer,
                        'installer',
                        wp_json_encode(
                            array(
                                'mcpServers' => array(
                                    $server_name => array(
                                        'url'     => $endpoint,
                                        'headers' => array('Authorization' => 'Bearer ' . $display_token),
                                    ),
                                ),
                            ),
                            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
                        ),
                        'cwr-windsurf-config',
                        __('Or merge this JSON manually into ~/.codeium/windsurf/mcp_config.json:', 'custom-web-render'),
                        array('url' => $windsurf_json, 'label' => __('Raw JSON', 'custom-web-render'))
                    );

                    // --- Codex: copy command ---
                    $codex_cmd = "export CWR_MCP_TOKEN='" . $display_token . "'\n"
                        . "codex mcp add " . $server_name . " --url '" . $endpoint . "' --bearer-token-env-var CWR_MCP_TOKEN";
                    self::render_client_connector(
                        'codex',
                        __('Codex', 'custom-web-render'),
                        __('Copy command', 'custom-web-render'),
                        '',
                        'copy',
                        $codex_cmd,
                        'cwr-codex-config',
                        __('Run this in your terminal:', 'custom-web-render')
                    );
                    ?>
                </div>
                <?php if (!$has_real_token) : ?>
                    <p class="description cwr-mcp-token-warn"><?php esc_html_e('Generate a token above first — the buttons above use YOUR_TOKEN as a placeholder until you do.', 'custom-web-render'); ?></p>
                <?php endif; ?>
                <?php endif; ?>
            </section>

            <section class="cwr-panel cwr-panel-global">
                <h2><?php esc_html_e('Active tokens', 'custom-web-render'); ?></h2>
                <div class="cwr-table-wrap cwr-mcp-table-wrap">
                    <table class="widefat striped">
                        <thead><tr>
                            <th><?php esc_html_e('Name', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Token', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Permissions', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Created', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Last used', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Action', 'custom-web-render'); ?></th>
                        </tr></thead>
                        <tbody>
                        <?php if ($tokens) : ?>
                            <?php foreach ($tokens as $token) : ?>
                                <tr>
                                    <td><strong><?php echo esc_html($token['name']); ?></strong></td>
                                    <td><code><?php echo esc_html($token['preview']); ?></code></td>
                                    <td><?php echo esc_html(implode(', ', $token['scopes'])); ?></td>
                                    <td><?php echo esc_html(self::format_utc_date($token['created_at'])); ?></td>
                                    <td><?php echo esc_html($token['last_used_at'] ? self::format_utc_date($token['last_used_at']) : __('Never', 'custom-web-render')); ?></td>
                                    <td>
                                        <form method="post">
                                            <?php wp_nonce_field('cwr_mcp_revoke_token', 'cwr_mcp_revoke_nonce'); ?>
                                            <input type="hidden" name="cwr_mcp_token_id" value="<?php echo esc_attr($token['id']); ?>">
                                            <button type="submit" name="cwr_mcp_revoke_token" value="1" class="button button-small cwr-confirm-revoke"><?php esc_html_e('Revoke', 'custom-web-render'); ?></button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <tr><td colspan="6"><?php esc_html_e('No access tokens yet.', 'custom-web-render'); ?></td></tr>
                        <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="cwr-panel cwr-panel-global">
                <h2><?php esc_html_e('Available MCP tools', 'custom-web-render'); ?></h2>
                <div class="cwr-tool-grid">
                    <?php foreach (self::get_tools(array('read', 'write', 'settings')) as $tool) : ?>
                        <article class="cwr-tool-card">
                            <code><?php echo esc_html($tool['name']); ?></code>
                            <p><?php echo esc_html($tool['description']); ?></p>
                        </article>
                    <?php endforeach; ?>
                </div>
            </section>

            <section class="cwr-panel cwr-panel-global">
                <h2><?php esc_html_e('Recent activity', 'custom-web-render'); ?></h2>
                <div class="cwr-table-wrap cwr-mcp-table-wrap">
                    <table class="widefat striped">
                        <thead><tr>
                            <th><?php esc_html_e('Time', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Client', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Tool', 'custom-web-render'); ?></th>
                            <th><?php esc_html_e('Result', 'custom-web-render'); ?></th>
                        </tr></thead>
                        <tbody>
                        <?php if ($audit_log) : ?>
                            <?php foreach (array_slice($audit_log, 0, 50) as $entry) : ?>
                                <tr>
                                    <td><?php echo esc_html(self::format_utc_date($entry['time'])); ?></td>
                                    <td><?php echo esc_html($entry['client']); ?></td>
                                    <td><code><?php echo esc_html($entry['tool']); ?></code></td>
                                    <td><?php echo esc_html($entry['result']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <tr><td colspan="4"><?php esc_html_e('No MCP tool calls yet.', 'custom-web-render'); ?></td></tr>
                        <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
        <?php
    }

    /**
     * Render a one-click client connector card.
     *
     * @param string $slug      Client slug (used for CSS class).
     * @param string $title     Card title.
     * @param string $cta_label Primary button label.
     * @param string $cta_url   Primary action URL (deep link, installer, or download URL). Empty for copy-only.
     * @param string $cta_type  'deeplink', 'installer', 'download', or 'copy'.
     * @param string $snippet   Fallback snippet to show + copy.
     * @param string $snippet_id DOM id for the snippet <pre> (copy target).
     * @param string $snippet_label Optional label above the snippet.
     * @param array  $secondary  Optional secondary action: array('url'=>, 'label'=>, 'type'=>'download').
     */
    private static function render_client_connector($slug, $title, $cta_label, $cta_url, $cta_type, $snippet, $snippet_id, $snippet_label = '', $secondary = array()) {
        $card_class = 'cwr-connection-card cwr-connector-' . $slug;
        ?>
        <div class="<?php echo esc_attr($card_class); ?>">
            <h3><?php echo esc_html($title); ?></h3>
            <?php if ($cta_type === 'deeplink' && $cta_url !== '') : ?>
                <p class="cwr-connector-actions">
                    <a class="button button-primary cwr-deeplink-button" href="<?php echo esc_attr($cta_url); ?>"><?php echo esc_html($cta_label); ?></a>
                </p>
                <p class="cwr-connector-hint"><?php esc_html_e('Opens the Cursor app and pre-fills the MCP install dialog. Click Install there to finish.', 'custom-web-render'); ?></p>
            <?php elseif ($cta_type === 'installer' && $cta_url !== '') : ?>
                <p class="cwr-connector-actions">
                    <a class="button button-primary cwr-download-button" href="<?php echo esc_attr($cta_url); ?>"><?php echo esc_html($cta_label); ?></a>
                    <?php if (!empty($secondary['url'])) : ?>
                        <a class="button cwr-secondary-button" href="<?php echo esc_attr($secondary['url']); ?>"><?php echo esc_html($secondary['label']); ?></a>
                    <?php endif; ?>
                </p>
                <p class="cwr-connector-hint"><?php esc_html_e('Downloads an installer script. Run it in Terminal and it auto-merges into your config — no manual editing needed.', 'custom-web-render'); ?></p>
            <?php elseif ($cta_type === 'download' && $cta_url !== '') : ?>
                <p class="cwr-connector-actions">
                    <a class="button button-primary cwr-download-button" href="<?php echo esc_attr($cta_url); ?>"><?php echo esc_html($cta_label); ?></a>
                </p>
                <p class="cwr-connector-hint"><?php esc_html_e('Downloads a ready config file. Merge it into the client config (see below).', 'custom-web-render'); ?></p>
            <?php else : ?>
                <p class="cwr-connector-actions">
                    <button type="button" class="button button-primary cwr-copy-button" data-copy-target="<?php echo esc_attr($snippet_id); ?>"><?php echo esc_html($cta_label); ?></button>
                </p>
            <?php endif; ?>

            <?php if ($snippet_label !== '') : ?>
                <p class="cwr-connector-fallback-label"><?php echo esc_html($snippet_label); ?></p>
            <?php endif; ?>
            <pre id="<?php echo esc_attr($snippet_id); ?>"><code><?php echo esc_html($snippet); ?></code></pre>
            <button type="button" class="button button-small cwr-copy-button" data-copy-target="<?php echo esc_attr($snippet_id); ?>"><?php esc_html_e('Copy', 'custom-web-render'); ?></button>
        </div>
        <?php
    }

    private static function render_admin_notice() {
        $notice = isset($_GET['cwr_mcp_notice']) ? sanitize_key(wp_unslash($_GET['cwr_mcp_notice'])) : '';
        $messages = array(
            'settings_saved' => __('MCP server settings saved.', 'custom-web-render'),
            'token_created' => __('Access token created.', 'custom-web-render'),
            'token_revoked' => __('Access token revoked.', 'custom-web-render'),
        );
        if (!isset($messages[$notice])) {
            return;
        }
        ?>
        <div class="notice notice-success is-dismissible"><p><?php echo esc_html($messages[$notice]); ?></p></div>
        <?php
    }

    public static function register_rest_route() {
        register_rest_route(
            self::REST_NAMESPACE,
            self::REST_ROUTE,
            array(
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array(__CLASS__, 'handle_mcp_request'),
                    'permission_callback' => array(__CLASS__, 'authenticate_request'),
                ),
                array(
                    'methods' => array(WP_REST_Server::READABLE, WP_REST_Server::DELETABLE),
                    'callback' => array(__CLASS__, 'method_not_allowed'),
                    'permission_callback' => array(__CLASS__, 'authenticate_request'),
                ),
            )
        );
    }

    public static function method_not_allowed() {
        return new WP_REST_Response(null, 405);
    }

    public static function authenticate_request($request) {
        if (get_option(self::OPTION_ENABLED, '1') !== '1') {
            return new WP_Error('cwr_mcp_disabled', __('The MCP server is disabled.', 'custom-web-render'), array('status' => 503));
        }

        // Combined plugin approval gate — block MCP access until team quasara approves.
        if (function_exists('quasar_is_approved') && !quasar_is_approved()) {
            return new WP_Error('cwr_mcp_not_approved', __('This site is awaiting approval from team quasara. MCP tools are disabled until approved.', 'custom-web-render'), array('status' => 403));
        }

        $origin = $request->get_header('origin');
        if ($origin) {
            $origin_host = wp_parse_url($origin, PHP_URL_HOST);
            $site_host = wp_parse_url(home_url('/'), PHP_URL_HOST);
            if (!$origin_host || !$site_host || strtolower($origin_host) !== strtolower($site_host)) {
                return new WP_Error('cwr_mcp_invalid_origin', __('The request origin is not allowed.', 'custom-web-render'), array('status' => 403));
            }
        }

        $protocol_version = $request->get_header('mcp-protocol-version');
        if ($protocol_version && !in_array($protocol_version, array(self::LATEST_PROTOCOL, '2025-06-18', '2025-03-26'), true)) {
            return new WP_Error('cwr_mcp_protocol_version', __('The MCP protocol version is not supported.', 'custom-web-render'), array('status' => 400));
        }

        $authorization = $request->get_header('authorization');
        if (!$authorization && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authorization = sanitize_text_field(wp_unslash($_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
        }
        if (!preg_match('/^Bearer\s+(.+)$/i', (string) $authorization, $matches)) {
            return new WP_Error('cwr_mcp_unauthorized', __('A bearer token is required.', 'custom-web-render'), array('status' => 401));
        }

        $presented_hash = self::hash_token(trim($matches[1]));
        foreach (self::get_tokens() as $token_id => $token) {
            if (!isset($token['hash']) || !hash_equals($token['hash'], $presented_hash)) {
                continue;
            }

            $user = get_user_by('id', isset($token['user_id']) ? absint($token['user_id']) : 0);
            if (!$user || !user_can($user, 'manage_options')) {
                return new WP_Error('cwr_mcp_token_owner_invalid', __('The token owner is no longer an administrator.', 'custom-web-render'), array('status' => 403));
            }

            self::$active_token = $token;
            wp_set_current_user($user->ID);
            self::touch_token($token_id);

            if (!self::check_rate_limit($token_id)) {
                return new WP_Error('cwr_mcp_rate_limited', __('Too many MCP requests. Try again in one minute.', 'custom-web-render'), array('status' => 429));
            }
            return true;
        }

        return new WP_Error('cwr_mcp_unauthorized', __('The bearer token is invalid or revoked.', 'custom-web-render'), array('status' => 401));
    }

    public static function handle_mcp_request($request) {
        $body = $request->get_json_params();
        if (!is_array($body)) {
            $body = json_decode($request->get_body(), true);
        }
        if (!is_array($body)) {
            return self::mcp_http_response(self::rpc_error(null, -32700, 'Parse error'), 400);
        }

        if (self::is_list($body)) {
            $responses = array();
            foreach ($body as $message) {
                $response = self::dispatch_message($message);
                if ($response !== null) {
                    $responses[] = $response;
                }
            }
            return self::mcp_http_response($responses ? $responses : null, $responses ? 200 : 202);
        }

        $response = self::dispatch_message($body);
        return self::mcp_http_response($response, $response === null ? 202 : 200);
    }

    private static function dispatch_message($message) {
        if (is_array($message) && !isset($message['method']) && array_key_exists('id', $message) && (array_key_exists('result', $message) || array_key_exists('error', $message))) {
            return null;
        }
        if (!is_array($message) || !isset($message['method']) || !is_string($message['method'])) {
            return self::rpc_error(isset($message['id']) ? $message['id'] : null, -32600, 'Invalid Request');
        }

        $id = array_key_exists('id', $message) ? $message['id'] : null;
        $is_notification = !array_key_exists('id', $message);
        $method = $message['method'];
        $params = isset($message['params']) && is_array($message['params']) ? $message['params'] : array();

        if ($method === 'notifications/initialized' || $method === 'notifications/cancelled') {
            return null;
        }

        if ($method === 'initialize') {
            $requested_version = isset($params['protocolVersion']) ? (string) $params['protocolVersion'] : '';
            $supported = array(self::LATEST_PROTOCOL, '2025-06-18', '2025-03-26');
            $protocol_version = in_array($requested_version, $supported, true) ? $requested_version : self::LATEST_PROTOCOL;
            return self::rpc_result(
                $id,
                array(
                    'protocolVersion' => $protocol_version,
                    'capabilities' => array('tools' => array('listChanged' => false)),
                    'serverInfo' => array(
                        'name' => 'custom-web-render-wordpress',
                        'title' => 'Custom Web Render WordPress MCP',
                        'version' => Custom_Web_Render::VERSION,
                    ),
                    'instructions' => implode(' ', array(
                        'This MCP server manages a WordPress site.',
                        'Workflow: call get_site_info first to learn the site name, timezone, and supported post types (page, post).',
                        'To find content, use list_content with a search term, or get_content with an id or slug.',
                        'To create content, use create_content with post_type (page or post), title, content, and optional status (draft, pending, private, publish).',
                        'To edit content, use update_content with the id or slug of the target plus any fields to change.',
                        'To publish a draft immediately, use publish_content. To schedule future publication, use schedule_content with an ISO 8601 scheduled_at datetime.',
                        'To delete content, use delete_content with force=false (moves to trash, reversible) or force=true (permanent, irreversible).',
                        'To manage categories and tags, first call list_categories or list_tags to find IDs, then pass category_ids or tag_names to create_content or update_content.',
                        'To view revision history, use get_revisions. To update SEO metadata (title, description, focus keyword, canonical, robots, schema, social), use update_seo. To run an SEO audit, use analyze_seo.',
                        'Custom render: use update_custom_render to enable full-page HTML/CSS/JS rendering for a post or page. Use get_global_render and update_global_render for site-wide header/footer/head code.',
                        'All times use the WordPress site timezone unless an ISO 8601 offset is supplied.',
                        'Never put secrets or bearer tokens into post content.',
                    )),
                )
            );
        }

        if ($method === 'ping') {
            return self::rpc_result($id, new stdClass());
        }

        if ($method === 'tools/list') {
            return self::rpc_result($id, array('tools' => self::get_tools(self::active_scopes())));
        }

        if ($method === 'tools/call') {
            $result = self::call_tool($params);
            return self::rpc_result($id, $result);
        }

        return $is_notification ? null : self::rpc_error($id, -32601, 'Method not found');
    }

    private static function call_tool($params) {
        $name = isset($params['name']) ? sanitize_key($params['name']) : '';
        $arguments = isset($params['arguments']) && is_array($params['arguments']) ? $params['arguments'] : array();
        $required_scope = self::tool_scope($name);

        if (!$required_scope) {
            return self::tool_error('Unknown tool: ' . $name);
        }
        if (!in_array($required_scope, self::active_scopes(), true)) {
            return self::tool_error('This token does not have the required ' . $required_scope . ' permission.');
        }

        try {
            $data = self::execute_tool($name, $arguments);
            if (is_wp_error($data)) {
                self::write_audit_log($name, 'error: ' . $data->get_error_code());
                return self::tool_error($data->get_error_message());
            }
            self::write_audit_log($name, 'success');
            return self::tool_success($data);
        } catch (Throwable $error) {
            self::write_audit_log($name, 'error: exception');
            return self::tool_error($error->getMessage());
        }
    }

    private static function execute_tool($name, $arguments) {
        switch ($name) {
            case 'get_site_info':
                return self::tool_get_site_info();
            case 'list_content':
                return self::tool_list_content($arguments);
            case 'get_content':
                return self::format_post(self::resolve_post($arguments), true);
            case 'create_content':
                return self::tool_create_content($arguments);
            case 'update_content':
                return self::tool_update_content($arguments);
            case 'update_seo':
                return self::tool_update_seo($arguments);
            case 'analyze_seo':
                return self::tool_analyze_seo($arguments);
            case 'publish_content':
                return self::tool_publish_content($arguments);
            case 'schedule_content':
                return self::tool_schedule_content($arguments);
            case 'update_custom_render':
                return self::tool_update_custom_render($arguments);
            case 'get_global_render':
                return self::tool_get_global_render();
            case 'update_global_render':
                return self::tool_update_global_render($arguments);
            case 'delete_content':
                return self::tool_delete_content($arguments);
            case 'list_categories':
                return self::tool_list_categories($arguments);
            case 'list_tags':
                return self::tool_list_tags($arguments);
            case 'get_revisions':
                return self::tool_get_revisions($arguments);
            case 'list_media':
                return self::tool_list_media($arguments);
            case 'get_media':
                return self::tool_get_media($arguments);
            case 'get_schema':
                return self::tool_get_schema($arguments);
            case 'generate_schema':
                return self::tool_generate_schema($arguments);
            case 'regenerate_schema_type':
                return self::tool_regenerate_schema_type($arguments);
            case 'save_schema_type':
                return self::tool_save_schema_type($arguments);
            case 'delete_schema_type':
                return self::tool_delete_schema_type($arguments);
            case 'get_schema_settings':
                return self::tool_get_schema_settings();
            case 'update_schema_settings':
                return self::tool_update_schema_settings($arguments);
        }
        return new WP_Error('unknown_tool', __('Unknown MCP tool.', 'custom-web-render'));
    }

    private static function tool_get_site_info() {
        return array(
            'name' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'url' => home_url('/'),
            'rest_url' => rest_url(),
            'timezone' => wp_timezone_string(),
            'language' => get_bloginfo('language'),
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => Custom_Web_Render::VERSION,
            'supported_post_types' => array('page', 'post'),
            'schema_system_active' => class_exists('Quasar_Schema_Generator'),
            'is_approved' => function_exists('quasar_is_approved') ? quasar_is_approved() : true,
        );
    }

    private static function tool_list_content($args) {
        $post_type = isset($args['post_type']) ? sanitize_key($args['post_type']) : 'any';
        if (!in_array($post_type, array('any', 'page', 'post'), true)) {
            return new WP_Error('invalid_post_type', __('post_type must be any, page, or post.', 'custom-web-render'));
        }
        $status = isset($args['status']) ? sanitize_key($args['status']) : 'any';
        $allowed_statuses = array('any', 'publish', 'draft', 'pending', 'private', 'future');
        if (!in_array($status, $allowed_statuses, true)) {
            return new WP_Error('invalid_status', __('Unsupported post status.', 'custom-web-render'));
        }

        $per_page = isset($args['per_page']) ? min(100, max(1, absint($args['per_page']))) : 20;
        $page = isset($args['page']) ? max(1, absint($args['page'])) : 1;
        $query = new WP_Query(
            array(
                'post_type' => $post_type === 'any' ? array('page', 'post') : $post_type,
                'post_status' => $status === 'any' ? array('publish', 'draft', 'pending', 'private', 'future') : $status,
                's' => isset($args['search']) ? sanitize_text_field($args['search']) : '',
                'posts_per_page' => $per_page,
                'paged' => $page,
                'orderby' => isset($args['orderby']) && in_array($args['orderby'], array('date', 'modified', 'title'), true) ? $args['orderby'] : 'modified',
                'order' => isset($args['order']) && strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC',
            )
        );

        return array(
            'items' => array_map(
                function ($post) {
                    return self::format_post($post, false);
                },
                $query->posts
            ),
            'page' => $page,
            'per_page' => $per_page,
            'total' => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
        );
    }

    private static function tool_create_content($args) {
        $post_type = isset($args['post_type']) ? sanitize_key($args['post_type']) : 'post';
        if (!in_array($post_type, array('page', 'post'), true)) {
            return new WP_Error('invalid_post_type', __('post_type must be page or post.', 'custom-web-render'));
        }
        if (!current_user_can($post_type === 'page' ? 'edit_pages' : 'edit_posts')) {
            return new WP_Error('forbidden', __('The token owner cannot create this content type.', 'custom-web-render'));
        }

        $status = isset($args['status']) ? sanitize_key($args['status']) : 'draft';
        if (!in_array($status, array('draft', 'pending', 'private', 'publish'), true)) {
            return new WP_Error('invalid_status', __('Use draft, pending, private, or publish. Use schedule_content for future publication.', 'custom-web-render'));
        }
        if (in_array($status, array('publish', 'private'), true) && !current_user_can($post_type === 'page' ? 'publish_pages' : 'publish_posts')) {
            return new WP_Error('forbidden', __('The token owner cannot publish this content type.', 'custom-web-render'));
        }

        $postarr = array(
            'post_type' => $post_type,
            'post_status' => $status,
            'post_title' => isset($args['title']) ? (string) $args['title'] : '',
            'post_content' => isset($args['content']) ? (string) $args['content'] : '',
            'post_excerpt' => isset($args['excerpt']) ? (string) $args['excerpt'] : '',
        );
        if (!empty($args['slug'])) {
            $postarr['post_name'] = sanitize_title($args['slug']);
        }
        if (!empty($args['parent_id']) && $post_type === 'page') {
            $postarr['post_parent'] = absint($args['parent_id']);
        }

        $post_id = wp_insert_post(wp_slash($postarr), true);
        if (is_wp_error($post_id)) {
            return $post_id;
        }

        self::apply_optional_taxonomy($post_id, $args);
        self::apply_optional_seo($post_id, $args);
        self::apply_optional_render($post_id, $args);
        return self::format_post(get_post($post_id), true);
    }

    private static function tool_update_content($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this item.', 'custom-web-render'));
        }

        $postarr = array('ID' => $post->ID);
        $field_map = array(
            'title' => 'post_title',
            'content' => 'post_content',
            'excerpt' => 'post_excerpt',
        );
        foreach ($field_map as $argument => $post_field) {
            if (array_key_exists($argument, $args)) {
                $postarr[$post_field] = (string) $args[$argument];
            }
        }
        if (array_key_exists('new_slug', $args)) {
            $postarr['post_name'] = sanitize_title($args['new_slug']);
        }
        if (array_key_exists('parent_id', $args) && $post->post_type === 'page') {
            $postarr['post_parent'] = absint($args['parent_id']);
        }
        if (isset($args['status'])) {
            $status = sanitize_key($args['status']);
            if (!in_array($status, array('draft', 'pending', 'private', 'publish'), true)) {
                return new WP_Error('invalid_status', __('Use draft, pending, private, or publish. Use schedule_content for future publication.', 'custom-web-render'));
            }
            if (in_array($status, array('publish', 'private'), true) && !self::can_publish_post($post)) {
                return new WP_Error('forbidden', __('The token owner cannot publish this item.', 'custom-web-render'));
            }
            $postarr['post_status'] = $status;
        }

        $updated_id = wp_update_post(wp_slash($postarr), true);
        if (is_wp_error($updated_id)) {
            return $updated_id;
        }
        self::apply_optional_taxonomy($post->ID, $args);
        self::apply_optional_seo($post->ID, $args);
        self::apply_optional_render($post->ID, $args);
        return self::format_post(get_post($post->ID), true);
    }

    private static function tool_update_seo($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this item.', 'custom-web-render'));
        }
        $allowed = array_keys(self::seo_schema_properties());
        $has_field = false;
        foreach ($allowed as $field) {
            if (array_key_exists($field, $args)) {
                $has_field = true;
                break;
            }
        }
        if (!$has_field) {
            return new WP_Error('missing_fields', __('Provide at least one SEO field to update.', 'custom-web-render'));
        }
        self::apply_optional_seo($post->ID, $args);
        return self::format_post(get_post($post->ID), true);
    }

    private static function tool_analyze_seo($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot analyze this item.', 'custom-web-render'));
        }
        $use_ai = array_key_exists('use_ai', $args) ? self::to_boolean($args['use_ai']) : true;
        return Custom_Web_Render::analyze_post_seo($post->ID, $use_ai);
    }

    private static function tool_publish_content($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!self::can_publish_post($post)) {
            return new WP_Error('forbidden', __('The token owner cannot publish this item.', 'custom-web-render'));
        }
        $now = current_time('mysql');
        $updated_id = wp_update_post(
            array(
                'ID' => $post->ID,
                'post_status' => 'publish',
                'post_date' => $now,
                'post_date_gmt' => get_gmt_from_date($now),
            ),
            true
        );
        return is_wp_error($updated_id) ? $updated_id : self::format_post(get_post($post->ID), true);
    }

    private static function tool_schedule_content($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!self::can_publish_post($post)) {
            return new WP_Error('forbidden', __('The token owner cannot schedule this item.', 'custom-web-render'));
        }
        if (empty($args['scheduled_at']) || !is_string($args['scheduled_at'])) {
            return new WP_Error('missing_scheduled_at', __('scheduled_at is required in ISO 8601 format.', 'custom-web-render'));
        }

        try {
            $scheduled = new DateTimeImmutable($args['scheduled_at'], wp_timezone());
        } catch (Exception $error) {
            return new WP_Error('invalid_scheduled_at', __('scheduled_at must be a valid ISO 8601 date and time.', 'custom-web-render'));
        }
        $site_time = $scheduled->setTimezone(wp_timezone());
        $now = new DateTimeImmutable('now', wp_timezone());
        if ($site_time <= $now) {
            return new WP_Error('schedule_not_future', __('scheduled_at must be in the future.', 'custom-web-render'));
        }

        $local_date = $site_time->format('Y-m-d H:i:s');
        $updated_id = wp_update_post(
            array(
                'ID' => $post->ID,
                'post_status' => 'future',
                'post_date' => $local_date,
                'post_date_gmt' => get_gmt_from_date($local_date),
                // WordPress otherwise clears an explicit date when a never-published draft is updated.
                'edit_date' => true,
            ),
            true
        );
        return is_wp_error($updated_id) ? $updated_id : self::format_post(get_post($post->ID), true);
    }

    private static function tool_delete_content($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('delete_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot delete this item.', 'custom-web-render'));
        }

        $force = isset($args['force']) && self::to_boolean($args['force']);
        $post_id = $post->ID;
        $title = get_the_title($post);
        $url = get_permalink($post);

        if ($force) {
            $result = wp_delete_post($post_id, true);
        } else {
            $result = wp_trash_post($post_id);
        }

        if (!$result) {
            return new WP_Error('delete_failed', __('Failed to delete the item.', 'custom-web-render'));
        }

        return array(
            'deleted' => true,
            'permanent' => $force,
            'id' => $post_id,
            'title' => $title,
            'url' => $url,
            'message' => $force
                ? sprintf(__('"%s" permanently deleted.', 'custom-web-render'), $title)
                : sprintf(__('"%s" moved to trash. Use force=true to delete permanently.', 'custom-web-render'), $title),
        );
    }

    private static function tool_list_categories($args) {
        $search = isset($args['search']) ? sanitize_text_field($args['search']) : '';
        $hide_empty = isset($args['hide_empty']) && self::to_boolean($args['hide_empty']);

        $query_args = array(
            'taxonomy' => 'category',
            'hide_empty' => $hide_empty,
            'orderby' => 'name',
            'order' => 'ASC',
            'number' => 200,
        );
        if ($search !== '') {
            $query_args['search'] = $search;
        }

        $terms = get_terms($query_args);
        if (is_wp_error($terms)) {
            return new WP_Error('fetch_failed', $terms->get_error_message());
        }

        return array(
            'categories' => array_map(function ($term) {
                return array(
                    'id' => (int) $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'count' => (int) $term->count,
                    'parent_id' => (int) $term->parent,
                );
            }, $terms),
            'total' => count($terms),
        );
    }

    private static function tool_list_tags($args) {
        $search = isset($args['search']) ? sanitize_text_field($args['search']) : '';
        $hide_empty = isset($args['hide_empty']) && self::to_boolean($args['hide_empty']);

        $query_args = array(
            'taxonomy' => 'post_tag',
            'hide_empty' => $hide_empty,
            'orderby' => 'name',
            'order' => 'ASC',
            'number' => 200,
        );
        if ($search !== '') {
            $query_args['search'] = $search;
        }

        $terms = get_terms($query_args);
        if (is_wp_error($terms)) {
            return new WP_Error('fetch_failed', $terms->get_error_message());
        }

        return array(
            'tags' => array_map(function ($term) {
                return array(
                    'id' => (int) $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'count' => (int) $term->count,
                );
            }, $terms),
            'total' => count($terms),
        );
    }

    private static function tool_get_revisions($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot view revisions for this item.', 'custom-web-render'));
        }

        $revisions = wp_get_post_revisions($post->ID, array('orderby' => 'modified', 'order' => 'DESC'));
        $result = array();

        foreach ($revisions as $rev) {
            $result[] = array(
                'id' => (int) $rev->ID,
                'author' => get_the_author_meta('display_name', $rev->post_author),
                'date' => get_post_modified_time(DATE_ATOM, false, $rev),
                'title' => get_the_title($rev),
                'preview_url' => get_permalink($post->ID) . '?preview=true&revision=' . $rev->ID,
                'restore_url' => admin_url('revision.php?revision=' . $rev->ID),
            );
        }

        return array(
            'post_id' => (int) $post->ID,
            'title' => get_the_title($post),
            'revisions' => $result,
            'total' => count($result),
        );
    }

    /**
     * Search and list WordPress media library attachments.
     *
     * Designed for the "user mentions an image name while writing a blog
     * post or page" workflow: pass the mentioned image name as the search
     * term and receive matching attachments with their public URLs ready
     * to embed in content.
     */
    private static function tool_list_media($args) {
        if (!current_user_can('upload_files')) {
            return new WP_Error('forbidden', __('The token owner cannot read the media library.', 'custom-web-render'));
        }

        $search = isset($args['search']) ? sanitize_text_field((string) $args['search']) : '';
        $mime_type = isset($args['mime_type']) ? sanitize_text_field((string) $args['mime_type']) : '';
        $per_page = isset($args['per_page']) ? min(100, max(1, absint($args['per_page']))) : 20;
        $page = isset($args['page']) ? max(1, absint($args['page'])) : 1;

        $query_args = array(
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'DESC',
            'no_found_rows' => false,
        );

        if ($search !== '') {
            // WP_Query "s" matches the post title and content; attachment
            // titles are the user-facing media names, so this finds images
            // by the name the user mentioned. We also filter by filename
            // below via a posts_search filter for stronger name matching.
            $query_args['s'] = $search;
        }
        if ($mime_type !== '') {
            $query_args['post_mime_type'] = $mime_type;
        }

        $filename_search = $search;
        add_filter('posts_search', function ($search_sql, $query) use ($filename_search) {
            if (!$filename_search || empty($query->query_vars['s'])) {
                return $search_sql;
            }
            global $wpdb;
            $like = '%' . $wpdb->esc_like($filename_search) . '%';
            $filename_clause = $wpdb->prepare(
                " OR {$wpdb->posts}.guid LIKE %s",
                $like
            );
            // Append the filename match to the existing title/content search.
            return preg_replace('/\)\s*$/', $filename_clause . ')', $search_sql, 1);
        }, 10, 2);

        $query = new WP_Query($query_args);

        // Always remove the filter to avoid leaking into other queries.
        remove_all_filters('posts_search');

        $items = array();
        foreach ($query->posts as $attachment) {
            $items[] = self::format_media_item($attachment, false);
        }

        return array(
            'items' => $items,
            'page' => $page,
            'per_page' => $per_page,
            'total' => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
        );
    }

    /**
     * Get a single media library attachment by ID or by name (title or
     * filename). Returns full details including every registered image
     * size, ready to embed in blog posts and pages.
     */
    private static function tool_get_media($args) {
        if (!current_user_can('upload_files')) {
            return new WP_Error('forbidden', __('The token owner cannot read the media library.', 'custom-web-render'));
        }

        $attachment = null;

        if (!empty($args['id'])) {
            $attachment = get_post(absint($args['id']));
        } elseif (!empty($args['name'])) {
            $name = sanitize_text_field((string) $args['name']);
            $attachment = self::find_media_by_name($name);
        }

        if (!$attachment || $attachment->post_type !== 'attachment') {
            return new WP_Error('media_not_found', __('Media item was not found. Provide a valid id or name. Use list_media to search by image name.', 'custom-web-render'));
        }

        return self::format_media_item($attachment, true);
    }

    /**
     * Locate a media attachment by title or filename (with or without
     * extension). Returns the first best match or null.
     */
    private static function find_media_by_name($name) {
        if ($name === '') {
            return null;
        }

        // 1. Exact title match.
        $exact = get_posts(
            array(
                'post_type' => 'attachment',
                'post_status' => 'inherit',
                'title' => $name,
                'numberposts' => 1,
            )
        );
        if (!empty($exact)) {
            return $exact[0];
        }

        // 2. Search title and content (WP_Query "s").
        $search = get_posts(
            array(
                'post_type' => 'attachment',
                'post_status' => 'inherit',
                's' => $name,
                'numberposts' => 1,
            )
        );
        if (!empty($search)) {
            return $search[0];
        }

        // 3. Match against the filename stored in the guid / post_name.
        global $wpdb;
        $raw_like = '%' . $wpdb->esc_like($name) . '%';
        $slug_like = '%' . $wpdb->esc_like(sanitize_title($name)) . '%';
        $post = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->posts}
                 WHERE post_type = 'attachment'
                   AND post_status = 'inherit'
                   AND (guid LIKE %s OR post_name LIKE %s OR post_title LIKE %s)
                 ORDER BY post_date DESC
                 LIMIT 1",
                $raw_like,
                $slug_like,
                $raw_like
            )
        );
        if ($post) {
            return $post;
        }

        return null;
    }

    /**
     * Format an attachment post into a media item response array.
     *
     * @param WP_Post $attachment
     * @param bool    $include_sizes Whether to include every registered
     *                               image size with URL/width/height.
     * @return array
     */
    private static function format_media_item($attachment, $include_sizes) {
        $id = (int) $attachment->ID;
        $url = wp_get_attachment_url($id);
        $alt = (string) get_post_meta($id, '_wp_attachment_image_alt', true);
        $attached_file = (string) get_post_meta($id, '_wp_attachment_metadata', true);
        $metadata = $attached_file ? maybe_unserialize($attached_file) : array();
        if (!is_array($metadata)) {
            $metadata = array();
        }

        $data = array(
            'id' => $id,
            'title' => get_the_title($attachment),
            'url' => (string) $url,
            'alt' => $alt,
            'caption' => (string) $attachment->post_excerpt,
            'description' => (string) $attachment->post_content,
            'filename' => isset($metadata['file']) ? basename((string) $metadata['file']) : basename((string) $url),
            'mime_type' => (string) $attachment->post_mime_type,
            'filesize' => (int) filesize(get_attached_file($id)),
            'date' => get_post_time(DATE_ATOM, false, $attachment),
            'dimensions' => array(),
            'sizes' => array(),
        );

        if (isset($metadata['width'], $metadata['height'])) {
            $data['dimensions'] = array(
                'width' => (int) $metadata['width'],
                'height' => (int) $metadata['height'],
            );
        }

        if ($include_sizes) {
            $sizes = isset($metadata['sizes']) && is_array($metadata['sizes']) ? $metadata['sizes'] : array();
            foreach ($sizes as $size_name => $size_data) {
                $src = wp_get_attachment_image_src($id, $size_name);
                $data['sizes'][$size_name] = array(
                    'url' => $src ? (string) $src[0] : '',
                    'width' => $src ? (int) $src[1] : (isset($size_data['width']) ? (int) $size_data['width'] : 0),
                    'height' => $src ? (int) $src[2] : (isset($size_data['height']) ? (int) $size_data['height'] : 0),
                );
            }
            // Always include the "full" size for convenience.
            if (!isset($data['sizes']['full'])) {
                $full = wp_get_attachment_image_src($id, 'full');
                $data['sizes']['full'] = array(
                    'url' => $full ? (string) $full[0] : (string) $url,
                    'width' => $full ? (int) $full[1] : (isset($metadata['width']) ? (int) $metadata['width'] : 0),
                    'height' => $full ? (int) $full[2] : (isset($metadata['height']) ? (int) $metadata['height'] : 0),
                );
            }
        } else {
            // Lightweight preview: just the thumbnail URL.
            $thumb = wp_get_attachment_image_src($id, 'thumbnail');
            $data['thumbnail_url'] = $thumb ? (string) $thumb[0] : (string) $url;
        }

        return $data;
    }

    /* ===== QuasarAISEO Schema tools ===== */

    /**
     * Check that the QuasarAISEO Schema system is loaded and the site is
     * approved. Returns a WP_Error if not available or not approved.
     */
    private static function require_schema_system() {
        if (!class_exists('Quasar_Schema_Generator')) {
            return new WP_Error('schema_system_unavailable', __('The QuasarAISEO Schema system is not loaded.', 'custom-web-render'));
        }
        if (function_exists('quasar_is_approved') && !quasar_is_approved()) {
            return new WP_Error('schema_not_approved', __('This site is awaiting approval from team quasara. Schema generation is disabled until approved.', 'custom-web-render'));
        }
        return true;
    }

    /**
     * get_schema — return the combined JSON-LD @graph for a post.
     */
    private static function tool_get_schema($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        $post_id = $post->ID;

        $combined = get_post_meta($post_id, '_quasar_schema', true);
        $types_meta = get_post_meta($post_id, '_quasar_schema_types', true);
        $statuses = get_post_meta($post_id, '_quasar_schema_statuses', true);
        $updated = get_post_meta($post_id, '_quasar_schema_updated', true);
        $error = get_post_meta($post_id, '_quasar_schema_error', true);

        return array(
            'post_id' => $post_id,
            'post_title' => get_the_title($post),
            'post_type' => $post->post_type,
            'schema' => $combined ?: null,
            'types' => is_array($types_meta) ? $types_meta : array(),
            'statuses' => is_array($statuses) ? $statuses : array(),
            'last_updated' => $updated ? gmdate('Y-m-d H:i:s', (int) $updated) . ' UTC' : '',
            'error' => $error ?: '',
            'output_url' => get_permalink($post_id),
        );
    }

    /**
     * generate_schema — AI-generate all enabled schema types for a post.
     */
    private static function tool_generate_schema($args) {
        $check = self::require_schema_system();
        if (is_wp_error($check)) {
            return $check;
        }
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this content.', 'custom-web-render'));
        }

        // Reset "edited" statuses so auto-gen regenerates everything.
        $statuses = get_post_meta($post->ID, '_quasar_schema_statuses', true);
        if (is_array($statuses)) {
            foreach ($statuses as $k => $v) {
                $statuses[$k] = 'auto';
            }
            update_post_meta($post->ID, '_quasar_schema_statuses', $statuses);
        }

        $result = Quasar_Schema_Generator::generate_for_post($post->ID);
        if (is_wp_error($result)) {
            return $result;
        }

        $types_meta = get_post_meta($post->ID, '_quasar_schema_types', true);
        $statuses = get_post_meta($post->ID, '_quasar_schema_statuses', true);

        return array(
            'post_id' => $post->ID,
            'post_title' => get_the_title($post),
            'message' => 'Schema generated successfully.',
            'schema' => $result,
            'types' => is_array($types_meta) ? $types_meta : array(),
            'statuses' => is_array($statuses) ? $statuses : array(),
        );
    }

    /**
     * regenerate_schema_type — AI-regenerate a single schema type.
     */
    private static function tool_regenerate_schema_type($args) {
        $check = self::require_schema_system();
        if (is_wp_error($check)) {
            return $check;
        }
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this content.', 'custom-web-render'));
        }

        $type = isset($args['schema_type']) ? sanitize_key($args['schema_type']) : '';
        $valid_types = function_exists('quasar_type_keys') ? quasar_type_keys() : array('faq', 'organization', 'article', 'review');
        if (!in_array($type, $valid_types, true)) {
            return new WP_Error('invalid_schema_type', __('schema_type must be one of: faq, organization, article, review.', 'custom-web-render'));
        }

        $result = Quasar_Schema_Generator::regenerate_type_for_post($post->ID, $type);
        if (is_wp_error($result)) {
            return $result;
        }

        $label = function_exists('quasar_type_label') ? quasar_type_label($type) : ucfirst($type);

        return array(
            'post_id' => $post->ID,
            'post_title' => get_the_title($post),
            'message' => $label . ' schema regenerated.',
            'schema_type' => $type,
            'node' => $result,
            'status' => 'auto',
        );
    }

    /**
     * save_schema_type — manually save a JSON-LD node for a single type.
     */
    private static function tool_save_schema_type($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this content.', 'custom-web-render'));
        }

        $type = isset($args['schema_type']) ? sanitize_key($args['schema_type']) : '';
        $valid_types = function_exists('quasar_type_keys') ? quasar_type_keys() : array('faq', 'organization', 'article', 'review');
        if (!in_array($type, $valid_types, true)) {
            return new WP_Error('invalid_schema_type', __('schema_type must be one of: faq, organization, article, review.', 'custom-web-render'));
        }

        $json = isset($args['schema_json']) ? (string) $args['schema_json'] : '';
        if ($json === '') {
            return new WP_Error('missing_schema', __('schema_json is required and must be a valid JSON string.', 'custom-web-render'));
        }

        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            return new WP_Error('invalid_json', __('schema_json must be valid JSON.', 'custom-web-render'));
        }

        $types_meta = get_post_meta($post->ID, '_quasar_schema_types', true);
        if (!is_array($types_meta)) {
            $types_meta = array();
        }
        $statuses = get_post_meta($post->ID, '_quasar_schema_statuses', true);
        if (!is_array($statuses)) {
            $statuses = array();
        }

        $types_meta[$type] = $decoded;
        $statuses[$type] = 'edited';

        update_post_meta($post->ID, '_quasar_schema_types', $types_meta);
        update_post_meta($post->ID, '_quasar_schema_statuses', $statuses);
        update_post_meta($post->ID, '_quasar_schema_updated', time());

        Quasar_Schema_Generator::rebuild_combined($post->ID, $types_meta);

        $label = function_exists('quasar_type_label') ? quasar_type_label($type) : ucfirst($type);

        return array(
            'post_id' => $post->ID,
            'post_title' => get_the_title($post),
            'message' => $label . ' schema saved manually.',
            'schema_type' => $type,
            'status' => 'edited',
        );
    }

    /**
     * delete_schema_type — remove a single schema type from a post.
     */
    private static function tool_delete_schema_type($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this content.', 'custom-web-render'));
        }

        $type = isset($args['schema_type']) ? sanitize_key($args['schema_type']) : '';
        $valid_types = function_exists('quasar_type_keys') ? quasar_type_keys() : array('faq', 'organization', 'article', 'review');
        if (!in_array($type, $valid_types, true)) {
            return new WP_Error('invalid_schema_type', __('schema_type must be one of: faq, organization, article, review.', 'custom-web-render'));
        }

        $types_meta = get_post_meta($post->ID, '_quasar_schema_types', true);
        if (is_array($types_meta)) {
            unset($types_meta[$type]);
            update_post_meta($post->ID, '_quasar_schema_types', $types_meta);
        }
        $statuses = get_post_meta($post->ID, '_quasar_schema_statuses', true);
        if (is_array($statuses)) {
            $statuses[$type] = 'manual';
            update_post_meta($post->ID, '_quasar_schema_statuses', $statuses);
        }
        update_post_meta($post->ID, '_quasar_schema_updated', time());

        Quasar_Schema_Generator::rebuild_combined($post->ID, $types_meta);

        $label = function_exists('quasar_type_label') ? quasar_type_label($type) : ucfirst($type);

        return array(
            'post_id' => $post->ID,
            'post_title' => get_the_title($post),
            'message' => $label . ' schema deleted.',
            'schema_type' => $type,
        );
    }

    /**
     * get_schema_settings — return the QuasarAISEO settings.
     */
    private static function tool_get_schema_settings() {
        if (!function_exists('quasar_get_settings')) {
            return new WP_Error('schema_system_unavailable', __('The QuasarAISEO Schema system is not loaded.', 'custom-web-render'));
        }

        $settings = quasar_get_settings();
        $approval = get_option(QUASAR_APPROVAL_OPTION, array());
        $is_approved = function_exists('quasar_is_approved') ? quasar_is_approved() : false;

        return array(
            'settings' => $settings,
            'is_approved' => $is_approved,
            'approval' => array(
                'approved' => $is_approved,
                'install_date' => isset($approval['install_date']) ? gmdate('Y-m-d H:i:s', (int) $approval['install_date']) . ' UTC' : '',
                'approved_date' => !empty($approval['approved_date']) ? gmdate('Y-m-d H:i:s', (int) $approval['approved_date']) . ' UTC' : '',
                'site_url' => isset($approval['site_url']) ? $approval['site_url'] : home_url(),
                'admin_email' => isset($approval['admin_email']) ? $approval['admin_email'] : get_option('admin_email'),
            ),
            'available_models' => function_exists('quasar_get_models') ? quasar_get_models() : array(),
            'available_languages' => class_exists('Quasar_I18n') ? Quasar_I18n::languages() : array(),
            'available_tones' => class_exists('Quasar_I18n') ? Quasar_I18n::tones() : array(),
        );
    }

    /**
     * update_schema_settings — update the QuasarAISEO settings.
     */
    private static function tool_update_schema_settings($args) {
        if (!function_exists('quasar_get_settings') || !class_exists('Quasar_Settings')) {
            return new WP_Error('schema_system_unavailable', __('The QuasarAISEO Schema system is not loaded.', 'custom-web-render'));
        }

        $current = quasar_get_settings();
        $out = $current;

        // Company profile.
        if (isset($args['company']) && is_array($args['company'])) {
            $c = $args['company'];
            $company_fields = array('name', 'legal_name', 'description', 'type', 'street', 'city', 'region', 'postal_code', 'country', 'phone', 'email', 'website', 'logo_url', 'founding_date', 'founder', 'employees', 'slogan');
            foreach ($company_fields as $field) {
                if (isset($c[$field])) {
                    if ($field === 'description') {
                        $out['company'][$field] = sanitize_textarea_field($c[$field]);
                    } elseif ($field === 'email') {
                        $out['company'][$field] = sanitize_email($c[$field]);
                    } elseif (in_array($field, array('website', 'logo_url'), true)) {
                        $out['company'][$field] = esc_url_raw($c[$field]);
                    } else {
                        $out['company'][$field] = sanitize_text_field($c[$field]);
                    }
                }
            }
            if (isset($c['sameAs']) && is_array($c['sameAs'])) {
                $sameAs = array();
                foreach ($c['sameAs'] as $url) {
                    $url = esc_url_raw(trim($url));
                    if ($url) {
                        $sameAs[] = $url;
                    }
                }
                $out['company']['sameAs'] = $sameAs;
            }
        }

        // Schema settings.
        if (isset($args['schema']) && is_array($args['schema'])) {
            $s = $args['schema'];
            if (isset($s['auto_generate_on_save'])) {
                $out['schema']['auto_generate_on_save'] = (bool) $s['auto_generate_on_save'];
            }
            if (isset($s['types_enabled']) && is_array($s['types_enabled'])) {
                $types = array();
                foreach ($s['types_enabled'] as $t) {
                    if (in_array($t, array('faq', 'organization', 'article', 'review'), true)) {
                        $types[] = sanitize_key($t);
                    }
                }
                $out['schema']['types_enabled'] = $types;
            }
            if (isset($s['openai_model'])) {
                $out['schema']['openai_model'] = sanitize_text_field($s['openai_model']);
            }
            if (isset($s['faq_question_count'])) {
                $out['schema']['faq_question_count'] = max(2, min(10, intval($s['faq_question_count'])));
            }
            if (isset($s['max_content_chars'])) {
                $out['schema']['max_content_chars'] = max(1000, intval($s['max_content_chars']));
            }
        }

        // Tone & language.
        if (isset($args['tone_language']) && is_array($args['tone_language'])) {
            $tl = $args['tone_language'];
            if (isset($tl['tone'])) {
                $out['tone_language']['tone'] = sanitize_text_field($tl['tone']);
            }
            if (isset($tl['custom_tone'])) {
                $out['tone_language']['custom_tone'] = sanitize_text_field($tl['custom_tone']);
            }
            if (isset($tl['output_language'])) {
                $out['tone_language']['output_language'] = sanitize_text_field($tl['output_language']);
            }
            if (isset($tl['respect_wp_locale'])) {
                $out['tone_language']['respect_wp_locale'] = (bool) $tl['respect_wp_locale'];
            }
            if (isset($tl['answer_length'])) {
                $valid_lengths = array('short', 'medium', 'long');
                $out['tone_language']['answer_length'] = in_array($tl['answer_length'], $valid_lengths, true) ? $tl['answer_length'] : 'medium';
            }
        }

        // Reviews.
        if (isset($args['reviews_enabled'])) {
            $out['reviews_enabled'] = (bool) $args['reviews_enabled'];
        }
        if (isset($args['aggregate_rating']) && is_array($args['aggregate_rating'])) {
            $ar = $args['aggregate_rating'];
            $ar_fields = array('rating_value', 'review_count', 'worst', 'best');
            foreach ($ar_fields as $field) {
                if (isset($ar[$field])) {
                    $out['aggregate_rating'][$field] = sanitize_text_field($ar[$field]);
                }
            }
        }

        // FAQ display.
        if (isset($args['faq_display']) && is_array($args['faq_display'])) {
            $fd = $args['faq_display'];
            if (isset($fd['enabled'])) {
                $out['faq_display']['enabled'] = (bool) $fd['enabled'];
            }
            if (isset($fd['section_title'])) {
                $out['faq_display']['section_title'] = sanitize_text_field($fd['section_title']);
            }
            if (isset($fd['layout'])) {
                $out['faq_display']['layout'] = in_array($fd['layout'], array('boxed', 'flat', 'minimal'), true) ? $fd['layout'] : 'boxed';
            }
            $color_fields = array('primary_color', 'bg_color', 'text_color', 'answer_color', 'border_color');
            foreach ($color_fields as $field) {
                if (isset($fd[$field])) {
                    $out['faq_display'][$field] = sanitize_hex_color($fd[$field]) ?: $out['faq_display'][$field];
                }
            }
            if (isset($fd['border_radius'])) {
                $out['faq_display']['border_radius'] = max(0, min(30, intval($fd['border_radius'])));
            }
            if (isset($fd['expand_icon'])) {
                $out['faq_display']['expand_icon'] = in_array($fd['expand_icon'], array('chevron', 'plus', 'arrow'), true) ? $fd['expand_icon'] : 'chevron';
            }
            if (isset($fd['first_open'])) {
                $out['faq_display']['first_open'] = (bool) $fd['first_open'];
            }
            if (isset($fd['font_size'])) {
                $out['faq_display']['font_size'] = max(12, min(24, intval($fd['font_size'])));
            }
            if (isset($fd['show_on']) && is_array($fd['show_on'])) {
                $show_on = array();
                foreach ($fd['show_on'] as $pt) {
                    $pt = sanitize_key($pt);
                    if (post_type_exists($pt)) {
                        $show_on[] = $pt;
                    }
                }
                $out['faq_display']['show_on'] = $show_on;
            }
        }

        update_option(QUASAR_OPTION, $out, false);

        return array(
            'message' => 'Schema settings updated.',
            'settings' => $out,
        );
    }

    private static function apply_optional_taxonomy($post_id, $args) {
        if (isset($args['category_ids']) && is_array($args['category_ids'])) {
            $ids = array_filter(array_map('absint', $args['category_ids']));
            // Allow clearing categories by passing an empty array — WordPress
            // requires at least the default category, so an empty array resets
            // to the site default rather than leaving none assigned.
            wp_set_post_categories($post_id, $ids);
        }
        if (isset($args['category_names']) && is_array($args['category_names'])) {
            $names = array_filter(array_map('sanitize_text_field', $args['category_names']));
            $ids = array();
            foreach ($names as $name) {
                $term = get_term_by('name', $name, 'category');
                if ($term) {
                    $ids[] = (int) $term->term_id;
                }
            }
            wp_set_post_categories($post_id, $ids);
        }
        if (isset($args['tag_names']) && is_array($args['tag_names'])) {
            $tags = array_filter(array_map('sanitize_text_field', $args['tag_names']));
            wp_set_post_tags($post_id, $tags, false);
        }
    }

    private static function tool_update_custom_render($args) {
        $post = self::resolve_post($args);
        if (is_wp_error($post)) {
            return $post;
        }
        if (!current_user_can('edit_post', $post->ID)) {
            return new WP_Error('forbidden', __('The token owner cannot edit this item.', 'custom-web-render'));
        }
        self::apply_render_fields($post->ID, $args);
        return self::format_post(get_post($post->ID), true);
    }

    private static function tool_get_global_render() {
        if (!current_user_can('manage_options')) {
            return new WP_Error('forbidden', __('The token owner cannot read global render settings.', 'custom-web-render'));
        }
        return array(
            'header_type' => (string) get_option(Custom_Web_Render::OPTION_HEADER_TYPE, 'custom'),
            'header_elementor_id' => (int) get_option(Custom_Web_Render::OPTION_HEADER_ELEMENTOR_ID, 0),
            'header_html' => (string) get_option(Custom_Web_Render::OPTION_HEADER, ''),
            'footer_type' => (string) get_option(Custom_Web_Render::OPTION_FOOTER_TYPE, 'custom'),
            'footer_elementor_id' => (int) get_option(Custom_Web_Render::OPTION_FOOTER_ELEMENTOR_ID, 0),
            'footer_html' => (string) get_option(Custom_Web_Render::OPTION_FOOTER, ''),
            'head_html' => (string) get_option(Custom_Web_Render::OPTION_HEAD, ''),
        );
    }

    private static function tool_update_global_render($args) {
        if (!current_user_can('manage_options')) {
            return new WP_Error('forbidden', __('The token owner cannot edit global render settings.', 'custom-web-render'));
        }
        if (array_key_exists('header_type', $args)) {
            $type = sanitize_key($args['header_type']);
            if (in_array($type, array('custom', 'elementor', 'theme', 'extracted'), true)) {
                update_option(Custom_Web_Render::OPTION_HEADER_TYPE, $type);
            }
        }
        if (array_key_exists('header_elementor_id', $args)) {
            update_option(Custom_Web_Render::OPTION_HEADER_ELEMENTOR_ID, absint($args['header_elementor_id']));
        }
        if (array_key_exists('header_html', $args)) {
            update_option(Custom_Web_Render::OPTION_HEADER, (string) $args['header_html']);
        }
        if (array_key_exists('footer_type', $args)) {
            $type = sanitize_key($args['footer_type']);
            if (in_array($type, array('custom', 'elementor', 'theme', 'extracted'), true)) {
                update_option(Custom_Web_Render::OPTION_FOOTER_TYPE, $type);
            }
        }
        if (array_key_exists('footer_elementor_id', $args)) {
            update_option(Custom_Web_Render::OPTION_FOOTER_ELEMENTOR_ID, absint($args['footer_elementor_id']));
        }
        if (array_key_exists('footer_html', $args)) {
            update_option(Custom_Web_Render::OPTION_FOOTER, (string) $args['footer_html']);
        }
        if (array_key_exists('head_html', $args)) {
            update_option(Custom_Web_Render::OPTION_HEAD, (string) $args['head_html']);
        }
        return self::tool_get_global_render();
    }

    private static function resolve_post($args) {
        $post = null;
        if (!empty($args['id'])) {
            $post = get_post(absint($args['id']));
        } elseif (!empty($args['slug'])) {
            $post_type = isset($args['post_type']) && in_array($args['post_type'], array('page', 'post'), true)
                ? $args['post_type']
                : array('page', 'post');
            $posts = get_posts(
                array(
                    'name' => sanitize_title($args['slug']),
                    'post_type' => $post_type,
                    'post_status' => array('publish', 'draft', 'pending', 'private', 'future', 'trash'),
                    'numberposts' => 1,
                )
            );
            $post = $posts ? $posts[0] : null;
        }

        if (!$post || !in_array($post->post_type, array('page', 'post'), true)) {
            return new WP_Error('content_not_found', __('Content was not found. Provide a valid id or slug.', 'custom-web-render'));
        }
        return $post;
    }

    private static function can_publish_post($post) {
        $post_type_object = get_post_type_object($post->post_type);
        return $post_type_object
            && isset($post_type_object->cap->publish_posts)
            && current_user_can($post_type_object->cap->publish_posts);
    }

    private static function format_terms($terms) {
        if (is_wp_error($terms) || !is_array($terms)) {
            return array();
        }
        return array_map(function ($term) {
            return array('id' => (int) $term->term_id, 'name' => $term->name, 'slug' => $term->slug);
        }, $terms);
    }

    private static function format_post($post, $include_content) {
        if (is_wp_error($post)) {
            return $post;
        }
        $data = array(
            'id' => (int) $post->ID,
            'post_type' => $post->post_type,
            'status' => $post->post_status,
            'title' => get_the_title($post),
            'slug' => $post->post_name,
            'url' => get_permalink($post),
            'preview_url' => get_preview_post_link($post),
            'date' => get_post_time(DATE_ATOM, false, $post),
            'modified' => get_post_modified_time(DATE_ATOM, false, $post),
            'parent_id' => (int) $post->post_parent,
            'categories' => self::format_terms(wp_get_post_terms($post->ID, 'category', array('fields' => 'all'))),
            'tags' => self::format_terms(wp_get_post_terms($post->ID, 'post_tag', array('fields' => 'all'))),
            'seo' => array(
                'meta_title' => Custom_Web_Render::get_meta_title($post->ID),
                'meta_description' => Custom_Web_Render::get_meta_description($post->ID),
                'focus_keyword' => (string) get_post_meta($post->ID, Custom_Web_Render::META_FOCUS_KEYWORD, true),
                'canonical_url' => (string) get_post_meta($post->ID, Custom_Web_Render::META_CANONICAL, true),
                'robots' => array(
                    'noindex' => get_post_meta($post->ID, Custom_Web_Render::META_ROBOTS_NOINDEX, true) === '1',
                    'nofollow' => get_post_meta($post->ID, Custom_Web_Render::META_ROBOTS_NOFOLLOW, true) === '1',
                ),
                'schema_type' => (string) get_post_meta($post->ID, Custom_Web_Render::META_SCHEMA_TYPE, true),
                'social_title' => (string) get_post_meta($post->ID, Custom_Web_Render::META_SOCIAL_TITLE, true),
                'social_description' => (string) get_post_meta($post->ID, Custom_Web_Render::META_SOCIAL_DESCRIPTION, true),
                'social_image' => (string) get_post_meta($post->ID, Custom_Web_Render::META_SOCIAL_IMAGE, true),
                'analysis' => Custom_Web_Render::get_saved_seo_analysis($post->ID),
            ),
            'custom_render' => array(
                'enabled' => get_post_meta($post->ID, Custom_Web_Render::META_ENABLED, true) === '1',
                'use_global_header' => get_post_meta($post->ID, Custom_Web_Render::META_USE_HEADER, true) === '1',
                'header_type' => (string) get_post_meta($post->ID, Custom_Web_Render::META_HEADER_TYPE, true) ?: 'global',
                'header_elementor_id' => (int) get_post_meta($post->ID, Custom_Web_Render::META_HEADER_ELEMENTOR_ID, true),
                'use_global_footer' => get_post_meta($post->ID, Custom_Web_Render::META_USE_FOOTER, true) === '1',
                'footer_type' => (string) get_post_meta($post->ID, Custom_Web_Render::META_FOOTER_TYPE, true) ?: 'global',
                'footer_elementor_id' => (int) get_post_meta($post->ID, Custom_Web_Render::META_FOOTER_ELEMENTOR_ID, true),
            ),
        );
        if ($include_content) {
            $data['content'] = $post->post_content;
            $data['excerpt'] = $post->post_excerpt;
            $data['custom_render']['html'] = (string) get_post_meta($post->ID, Custom_Web_Render::META_HTML, true);
            $data['custom_render']['css'] = (string) get_post_meta($post->ID, Custom_Web_Render::META_CSS, true);
            $data['custom_render']['javascript'] = (string) get_post_meta($post->ID, Custom_Web_Render::META_JS, true);
        }
        return $data;
    }

    private static function apply_optional_seo($post_id, $args) {
        foreach (array_keys(self::seo_schema_properties()) as $key) {
            if (array_key_exists($key, $args)) {
                self::apply_seo_fields($post_id, $args);
                return;
            }
        }
    }

    private static function normalize_schema_type($schema_type) {
        $schema_type = (string) $schema_type;
        $map = array(
            '' => 'WebPage',
            'webpage' => 'WebPage',
            'article' => 'Article',
            'blogposting' => 'BlogPosting',
            'faqpage' => 'FAQPage',
            'howto' => 'HowTo',
            'product' => 'Product',
            'localbusiness' => 'LocalBusiness',
            'service' => 'Service',
            'none' => 'none',
        );
        $key = strtolower(str_replace(array('-', '_', ' '), '', $schema_type));
        return isset($map[$key]) ? $map[$key] : 'WebPage';
    }

    private static function update_seo_meta_pair($post_id, $meta_key, $value) {
        update_post_meta($post_id, $meta_key, $value);
    }

    private static function update_seo_plugin_meta($post_id, $title, $description, $focus_keyword, $canonical, $noindex, $nofollow) {
        update_post_meta($post_id, '_yoast_wpseo_title', $title);
        update_post_meta($post_id, 'rank_math_title', $title);
        update_post_meta($post_id, '_seopress_titles_title', $title);
        update_post_meta($post_id, '_yoast_wpseo_metadesc', $description);
        update_post_meta($post_id, 'rank_math_description', $description);
        update_post_meta($post_id, '_seopress_titles_desc', $description);
        update_post_meta($post_id, '_yoast_wpseo_focuskw', $focus_keyword);
        update_post_meta($post_id, 'rank_math_focus_keyword', $focus_keyword);
        update_post_meta($post_id, '_yoast_wpseo_canonical', $canonical);
        update_post_meta($post_id, 'rank_math_canonical_url', $canonical);
        update_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', $noindex ? '1' : '0');
        update_post_meta($post_id, '_yoast_wpseo_meta-robots-nofollow', $nofollow ? '1' : '0');
        update_post_meta($post_id, 'rank_math_robots', array($noindex ? 'noindex' : 'index', $nofollow ? 'nofollow' : 'follow'));
    }

    private static function apply_seo_fields($post_id, $args) {
        if (array_key_exists('meta_title', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_TITLE, sanitize_text_field((string) $args['meta_title']));
        }
        if (array_key_exists('meta_description', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_DESCRIPTION, sanitize_textarea_field((string) $args['meta_description']));
        }
        if (array_key_exists('focus_keyword', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_FOCUS_KEYWORD, sanitize_text_field((string) $args['focus_keyword']));
        }
        if (array_key_exists('canonical_url', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_CANONICAL, esc_url_raw((string) $args['canonical_url']));
        }
        if (array_key_exists('robots_noindex', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_ROBOTS_NOINDEX, self::to_boolean($args['robots_noindex']) ? '1' : '0');
        }
        if (array_key_exists('robots_nofollow', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_ROBOTS_NOFOLLOW, self::to_boolean($args['robots_nofollow']) ? '1' : '0');
        }
        if (array_key_exists('schema_type', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_SCHEMA_TYPE, self::normalize_schema_type($args['schema_type']));
        }
        if (array_key_exists('social_title', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_SOCIAL_TITLE, sanitize_text_field((string) $args['social_title']));
        }
        if (array_key_exists('social_description', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_SOCIAL_DESCRIPTION, sanitize_textarea_field((string) $args['social_description']));
        }
        if (array_key_exists('social_image', $args)) {
            self::update_seo_meta_pair($post_id, Custom_Web_Render::META_SOCIAL_IMAGE, esc_url_raw((string) $args['social_image']));
        }

        self::update_seo_plugin_meta(
            $post_id,
            (string) get_post_meta($post_id, Custom_Web_Render::META_TITLE, true),
            (string) get_post_meta($post_id, Custom_Web_Render::META_DESCRIPTION, true),
            (string) get_post_meta($post_id, Custom_Web_Render::META_FOCUS_KEYWORD, true),
            (string) get_post_meta($post_id, Custom_Web_Render::META_CANONICAL, true),
            get_post_meta($post_id, Custom_Web_Render::META_ROBOTS_NOINDEX, true) === '1',
            get_post_meta($post_id, Custom_Web_Render::META_ROBOTS_NOFOLLOW, true) === '1'
        );
    }

    private static function apply_optional_render($post_id, $args) {
        $render_keys = array(
            'render_enabled', 'render_html', 'render_css', 'render_javascript',
            'use_global_header', 'header_type', 'header_elementor_id',
            'use_global_footer', 'footer_type', 'footer_elementor_id',
        );
        foreach ($render_keys as $key) {
            if (array_key_exists($key, $args)) {
                self::apply_render_fields($post_id, $args);
                return;
            }
        }
    }

    private static function apply_render_fields($post_id, $args) {
        $boolean_fields = array(
            'render_enabled' => Custom_Web_Render::META_ENABLED,
            'use_global_header' => Custom_Web_Render::META_USE_HEADER,
            'use_global_footer' => Custom_Web_Render::META_USE_FOOTER,
        );
        foreach ($boolean_fields as $argument => $meta_key) {
            if (array_key_exists($argument, $args)) {
                update_post_meta($post_id, $meta_key, self::to_boolean($args[$argument]) ? '1' : '0');
            }
        }
        $code_fields = array(
            'render_html' => Custom_Web_Render::META_HTML,
            'render_css' => Custom_Web_Render::META_CSS,
            'render_javascript' => Custom_Web_Render::META_JS,
        );
        foreach ($code_fields as $argument => $meta_key) {
            if (array_key_exists($argument, $args)) {
                update_post_meta($post_id, $meta_key, (string) $args[$argument]);
            }
        }
        if (array_key_exists('header_type', $args)) {
            $type = sanitize_key($args['header_type']);
            if (in_array($type, array('global', 'custom', 'elementor', 'theme', 'extracted', 'none'), true)) {
                update_post_meta($post_id, Custom_Web_Render::META_HEADER_TYPE, $type);
            }
        }
        if (array_key_exists('header_elementor_id', $args)) {
            update_post_meta($post_id, Custom_Web_Render::META_HEADER_ELEMENTOR_ID, absint($args['header_elementor_id']));
        }
        if (array_key_exists('footer_type', $args)) {
            $type = sanitize_key($args['footer_type']);
            if (in_array($type, array('global', 'custom', 'elementor', 'theme', 'extracted', 'none'), true)) {
                update_post_meta($post_id, Custom_Web_Render::META_FOOTER_TYPE, $type);
            }
        }
        if (array_key_exists('footer_elementor_id', $args)) {
            update_post_meta($post_id, Custom_Web_Render::META_FOOTER_ELEMENTOR_ID, absint($args['footer_elementor_id']));
        }
    }

    private static function get_tools($scopes) {
        $content_locator = array(
            'id' => array('type' => 'integer', 'description' => 'WordPress post or page ID. Preferred way to identify content. Use list_content to find the ID if unknown.'),
            'slug' => array('type' => 'string', 'description' => 'Post or page slug (the URL-friendly name). Use this when the ID is unknown. Combined with post_type to disambiguate.'),
            'post_type' => array('type' => 'string', 'enum' => array('page', 'post'), 'description' => 'Content type when using slug to locate an item. Omit to search both pages and posts.'),
        );
        $taxonomy_properties = array(
            'category_ids' => array('type' => 'array', 'items' => array('type' => 'integer'), 'description' => 'Category IDs to assign. Replaces existing categories. Use list_categories to find IDs. Pass [] to clear (resets to default category).'),
            'category_names' => array('type' => 'array', 'items' => array('type' => 'string'), 'description' => 'Category names to assign (categories must already exist). Replaces existing categories. Use list_categories to find valid names.'),
            'tag_names' => array('type' => 'array', 'items' => array('type' => 'string'), 'description' => 'Tag names to assign. Replaces existing tags. Tags are created if they do not exist. Pass [] to clear all tags.'),
        );
        $tools = array(
            self::tool_definition('get_site_info', 'Get site information', 'Returns the WordPress site name, description, URL, REST URL, timezone, language, WordPress version, plugin version, and supported post types (page, post). Call this first to understand the site context.', array('type' => 'object', 'properties' => new stdClass()), 'read', true, true),
            self::tool_definition('list_content', 'List and search pages and posts', 'Search and paginate existing pages and posts. Filter by post_type (any, page, post), status (any, publish, draft, pending, private, future), and search term. Returns paginated results with id, title, slug, url, status, date, categories, tags, and SEO summary for each item. Use this to find content before editing when the ID is unknown.', array(
                'type' => 'object',
                'properties' => array(
                    'post_type' => array('type' => 'string', 'enum' => array('any', 'page', 'post'), 'default' => 'any', 'description' => 'Filter by content type. Use "any" for both pages and posts.'),
                    'status' => array('type' => 'string', 'enum' => array('any', 'publish', 'draft', 'pending', 'private', 'future'), 'default' => 'any', 'description' => 'Filter by publication status. "future" = scheduled, "publish" = live, "draft" = unpublished.'),
                    'search' => array('type' => 'string', 'description' => 'Search term to match against title and content.'),
                    'page' => array('type' => 'integer', 'minimum' => 1, 'default' => 1, 'description' => 'Page number for pagination.'),
                    'per_page' => array('type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 20, 'description' => 'Results per page (max 100).'),
                    'orderby' => array('type' => 'string', 'enum' => array('date', 'modified', 'title'), 'default' => 'modified', 'description' => 'Sort field.'),
                    'order' => array('type' => 'string', 'enum' => array('ASC', 'DESC'), 'default' => 'DESC', 'description' => 'Sort direction.'),
                ),
            ), 'read', true, true),
            self::tool_definition('get_content', 'Get a single page or post', 'Returns the complete content, SEO metadata, categories, tags, and custom render code for one page or post. Provide either an id (preferred) or a slug. Use list_content first to find the id if unknown.', array('type' => 'object', 'properties' => $content_locator), 'read', true, true),
            self::tool_definition('create_content', 'Create a page or post', 'Create a new page or post. Required: post_type (page or post) and title. Optional: content (HTML body), excerpt, slug, status (draft, pending, private, publish — default draft), parent_id (pages only), category_ids, category_names, tag_names, SEO fields, and custom render fields. Use status "draft" to create without publishing, then use publish_content when ready to go live. Use schedule_content for future publication.', array(
                'type' => 'object',
                'required' => array('post_type', 'title'),
                'properties' => array_merge(
                    array(
                        'post_type' => array('type' => 'string', 'enum' => array('page', 'post')),
                        'title' => array('type' => 'string'),
                        'content' => array('type' => 'string'),
                        'excerpt' => array('type' => 'string'),
                        'slug' => array('type' => 'string'),
                        'status' => array('type' => 'string', 'enum' => array('draft', 'pending', 'private', 'publish'), 'default' => 'draft'),
                        'parent_id' => array('type' => 'integer'),
                    ),
                    $taxonomy_properties,
                    self::seo_schema_properties(),
                    self::render_schema_properties()
                ),
            ), 'write', false, false),
            self::tool_definition('update_content', 'Edit a page or post', 'Edit an existing page or post. Provide either id or slug to locate the item, then any fields to change: title, content, excerpt, new_slug, status, parent_id, category_ids, category_names, tag_names, SEO fields, and custom render fields. Pass category_ids: [] to clear all categories (resets to default). Pass tag_names: [] to clear all tags. Only the fields you provide are changed; others remain untouched.', array(
                'type' => 'object',
                'properties' => array_merge(
                    $content_locator,
                    array(
                        'title' => array('type' => 'string'),
                        'content' => array('type' => 'string'),
                        'excerpt' => array('type' => 'string'),
                        'new_slug' => array('type' => 'string', 'description' => 'Replacement slug. The slug field itself is used to locate content.'),
                        'status' => array('type' => 'string', 'enum' => array('draft', 'pending', 'private', 'publish')),
                        'parent_id' => array('type' => 'integer'),
                    ),
                    $taxonomy_properties,
                    self::seo_schema_properties(),
                    self::render_schema_properties()
                ),
            ), 'write', false, true),
            self::tool_definition('delete_content', 'Delete a page or post', 'Move a page or post to trash, or permanently delete it. Use force=true for permanent deletion. Trashed items can be found by id and permanently deleted with force=true.', array(
                'type' => 'object',
                'properties' => array_merge(
                    $content_locator,
                    array('force' => array('type' => 'boolean', 'default' => false, 'description' => 'If true, permanently delete instead of moving to trash. This cannot be undone.'))
                ),
            ), 'write', false, true, true),
            self::tool_definition('list_categories', 'List categories', 'List all WordPress post categories with IDs, names, slugs, post counts, and parent IDs. Use this to find category IDs before passing them to create_content or update_content via category_ids. Optionally filter by name with search, or hide empty categories with hide_empty=true.', array(
                'type' => 'object',
                'properties' => array(
                    'search' => array('type' => 'string', 'description' => 'Filter categories by name (partial match).'),
                    'hide_empty' => array('type' => 'boolean', 'default' => false, 'description' => 'If true, hide categories with no published posts.'),
                ),
            ), 'read', true, true),
            self::tool_definition('list_tags', 'List tags', 'List all WordPress post tags with IDs, names, slugs, and post counts. Use this to find existing tag names before passing them to create_content or update_content via tag_names. Optionally filter by name with search, or hide empty tags with hide_empty=true.', array(
                'type' => 'object',
                'properties' => array(
                    'search' => array('type' => 'string', 'description' => 'Filter tags by name (partial match).'),
                    'hide_empty' => array('type' => 'boolean', 'default' => false, 'description' => 'If true, hide tags with no published posts.'),
                ),
            ), 'read', true, true),
            self::tool_definition('get_revisions', 'Get revision history', 'List all saved revisions for a page or post. Each revision includes the revision ID, author name, modification date, title, preview URL, and restore URL in the WordPress admin. Use this to review change history or find a previous version to restore.', array(
                'type' => 'object',
                'properties' => $content_locator,
            ), 'read', true, true),
            self::tool_definition('update_seo', 'Update SEO metadata', 'Set or clear SEO metadata on an existing page or post. Provide id or slug plus any SEO fields: meta_title, meta_description, focus_keyword, canonical_url, robots_noindex, robots_nofollow, schema_type, social_title, social_description, social_image. Pass an empty string to clear a field. Also syncs to Yoast, Rank Math, and SEOPress if installed.', array(
                'type' => 'object',
                'properties' => array_merge($content_locator, self::seo_schema_properties()),
            ), 'write', false, true),
            self::tool_definition('analyze_seo', 'Analyze SEO', 'Run the built-in SEO audit for one page or post. Returns a score, issue list, and recommendations. Uses OpenRouter AI when an API key is configured unless use_ai is false. Results are saved and shown in the admin dashboard.', array(
                'type' => 'object',
                'properties' => array_merge(
                    $content_locator,
                    array('use_ai' => array('type' => 'boolean', 'default' => true, 'description' => 'Set to false to use the local rule-based audit instead of AI.'))
                ),
            ), 'write', false, true),
            self::tool_definition('publish_content', 'Publish content now', 'Immediately publish an existing page, post, draft, or scheduled item. Sets the publication date to now. The item must already exist — use create_content with status "publish" to create and publish in one step.', array('type' => 'object', 'properties' => $content_locator), 'write', false, true),
            self::tool_definition('schedule_content', 'Schedule publication', 'Schedule an existing page or post for future automatic publication. Required: scheduled_at as an ISO 8601 datetime (e.g. "2025-12-25T09:00:00-05:00"). The time must be in the future. WordPress will automatically publish the item at the scheduled time. Uses the site timezone if no offset is supplied.', array(
                'type' => 'object',
                'required' => array('scheduled_at'),
                'properties' => array_merge($content_locator, array('scheduled_at' => array('type' => 'string', 'format' => 'date-time', 'description' => 'ISO 8601 datetime. Uses the site timezone if no offset is supplied. Must be in the future.'))),
            ), 'write', false, true),
            self::tool_definition('update_custom_render', 'Update custom page rendering', 'Enable or edit trusted full-page HTML, CSS, and JavaScript rendering for a specific page or post. When enabled, the custom code replaces the theme output for that page. Set render_enabled to true to activate. Optionally set use_global_header and use_global_footer to include site-wide header/footer code. This is trusted code — it runs directly on the page without escaping.', array(
                'type' => 'object',
                'properties' => array_merge($content_locator, self::render_schema_properties()),
            ), 'write', false, true),
            self::tool_definition('get_global_render', 'Get global render code', 'Read the reusable global header, footer, and head-injection HTML code. These are inserted into custom-rendered pages when use_global_header or use_global_footer is enabled on the item.', array('type' => 'object', 'properties' => new stdClass()), 'read', true, true),
            self::tool_definition('update_global_render', 'Update global render code', 'Edit the reusable trusted global header, footer, and head-injection HTML code. This code is inserted into custom-rendered pages when the item has use_global_header or use_global_footer enabled. This is trusted code — it runs directly on rendered pages without escaping. Requires settings permission.', array(
                'type' => 'object',
                'properties' => array(
                    'header_type' => array('type' => 'string', 'enum' => array('custom', 'elementor', 'theme', 'extracted'), 'description' => 'Global header source.'),
                    'header_elementor_id' => array('type' => 'integer', 'description' => 'Elementor template ID when header_type is elementor.'),
                    'header_html' => array('type' => 'string', 'description' => 'Custom header HTML.'),
                    'footer_type' => array('type' => 'string', 'enum' => array('custom', 'elementor', 'theme', 'extracted'), 'description' => 'Global footer source.'),
                    'footer_elementor_id' => array('type' => 'integer', 'description' => 'Elementor template ID when footer_type is elementor.'),
                    'footer_html' => array('type' => 'string', 'description' => 'Custom footer HTML.'),
                    'head_html' => array('type' => 'string', 'description' => 'Custom Google/Search Console head injection HTML.'),
                ),
            ), 'settings', false, true),
            self::tool_definition('list_media', 'Search and list media library images', 'Search the WordPress media library by file name or title and return matching attachments. Use this whenever a user mentions a media image name while writing a blog post or page — pass the image name as the search term to find its URL for embedding. Returns paginated results with id, title, url, alt text, filename, mime type, file size, dimensions, and available image sizes with their URLs. Filter by mime_type (e.g. image/jpeg) to restrict to specific file kinds.', array(
                'type' => 'object',
                'properties' => array(
                    'search' => array('type' => 'string', 'description' => 'Search term matched against the attachment title and filename. Use the image name the user mentioned (e.g. "hero-banner", "logo", "team-photo").'),
                    'mime_type' => array('type' => 'string', 'description' => 'Optional MIME type filter, e.g. image/jpeg, image/png, image/webp, image/svg+xml, application/pdf.'),
                    'page' => array('type' => 'integer', 'minimum' => 1, 'default' => 1, 'description' => 'Page number for pagination.'),
                    'per_page' => array('type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 20, 'description' => 'Results per page (max 100).'),
                ),
            ), 'read', true, true),
            self::tool_definition('get_media', 'Get a single media library item', 'Return full details for one media library item by id or by name (matched against the attachment title and filename). Use this after list_media to fetch complete details, or directly when the user mentions a specific image name while writing a blog post or page. Returns id, title, url, alt text, caption, description, filename, mime type, file size, dimensions, and every registered image size with its URL, width, and height — ready to embed in content.', array(
                'type' => 'object',
                'properties' => array(
                    'id' => array('type' => 'integer', 'description' => 'WordPress attachment ID. Preferred way to identify a media item. Use list_media to find the ID if unknown.'),
                    'name' => array('type' => 'string', 'description' => 'Attachment title or filename (with or without extension) to locate the item when the ID is unknown. The first best match is returned.'),
                ),
            ), 'read', true, true),
            self::tool_definition('get_schema', 'Get JSON-LD schema for a post', 'Returns the combined schema.org JSON-LD @graph block stored for a page or post by the QuasarAISEO Schema system. Includes all enabled schema types (FAQ, Organization, Article, Review) merged into one @graph. Also returns per-type breakdown and generation statuses. Use this to inspect or verify the structured data that will be output in wp_head.', array(
                'type' => 'object',
                'properties' => $content_locator,
            ), 'read', true, true),
            self::tool_definition('generate_schema', 'AI-generate all schema for a post', 'Trigger AI-powered JSON-LD schema generation for all enabled types (FAQ, Organization, Article, Review) on a page or post. Uses OpenAI to generate schema from the post content and the company profile. Overwrites auto-generated schema but preserves manually edited types. Returns the combined @graph block. Requires the site to be approved by team quasara.', array(
                'type' => 'object',
                'properties' => $content_locator,
            ), 'write', false, true),
            self::tool_definition('regenerate_schema_type', 'AI-regenerate one schema type', 'Regenerate a single schema type (faq, organization, article, or review) for a page or post using OpenAI. Overwrites the existing schema for that type, even if it was manually edited. Returns the generated schema node. Requires the site to be approved by team quasara.', array(
                'type' => 'object',
                'required' => array('schema_type'),
                'properties' => array_merge(
                    $content_locator,
                    array('schema_type' => array('type' => 'string', 'enum' => array('faq', 'organization', 'article', 'review'), 'description' => 'Schema type to regenerate.'))
                ),
            ), 'write', false, true),
            self::tool_definition('save_schema_type', 'Manually save schema JSON for a post', 'Manually set the JSON-LD schema for a single type on a page or post. Provide the schema as a JSON object string. The schema is marked as "edited" so it will not be overwritten by auto-generation. Use this to apply custom schema or corrections. The schema must be a valid JSON-LD node object.', array(
                'type' => 'object',
                'required' => array('schema_type', 'schema_json'),
                'properties' => array_merge(
                    $content_locator,
                    array(
                        'schema_type' => array('type' => 'string', 'enum' => array('faq', 'organization', 'article', 'review'), 'description' => 'Schema type to save.'),
                        'schema_json' => array('type' => 'string', 'description' => 'JSON-LD node object as a JSON string. Example: {"@type":"FAQPage","mainEntity":[...]}.'),
                    )
                ),
            ), 'write', false, true),
            self::tool_definition('delete_schema_type', 'Delete one schema type from a post', 'Remove a single schema type (faq, organization, article, or review) from a page or post. The combined @graph is rebuilt after deletion. The type status is set to "manual" so it will not be auto-regenerated on the next save.', array(
                'type' => 'object',
                'required' => array('schema_type'),
                'properties' => array_merge(
                    $content_locator,
                    array('schema_type' => array('type' => 'string', 'enum' => array('faq', 'organization', 'article', 'review'), 'description' => 'Schema type to delete.'))
                ),
            ), 'write', false, true, true),
            self::tool_definition('get_schema_settings', 'Get QuasarAISEO schema settings', 'Returns the QuasarAISEO Schema plugin settings: company profile (name, type, address, contact, logo, social profiles), schema configuration (enabled types, OpenAI model, FAQ question count, max content chars), tone and language settings, reviews configuration, FAQ display settings, and approval status. Use this to understand the current schema configuration before making changes.', array('type' => 'object', 'properties' => new stdClass()), 'read', true, true),
            self::tool_definition('update_schema_settings', 'Update QuasarAISEO schema settings', 'Update the QuasarAISEO Schema plugin settings. Provide any subset of the settings to change. Supports: company (name, legal_name, description, type, street, city, region, postal_code, country, phone, email, website, logo_url, founding_date, founder, employees, slogan, sameAs array), schema (auto_generate_on_save, types_enabled array, openai_model, faq_question_count, max_content_chars), tone_language (tone, custom_tone, output_language, respect_wp_locale, answer_length), reviews_enabled, aggregate_rating (rating_value, review_count, worst, best), faq_display (enabled, section_title, show_on, layout, colors, expand_icon, first_open, font_size). Only the fields you provide are changed; others remain untouched. Requires settings permission.', array(
                'type' => 'object',
                'properties' => array(
                    'company' => array('type' => 'object', 'description' => 'Company profile fields.', 'properties' => array(
                        'name' => array('type' => 'string'),
                        'legal_name' => array('type' => 'string'),
                        'description' => array('type' => 'string'),
                        'type' => array('type' => 'string', 'enum' => array('Organization', 'LocalBusiness', 'Corporation', 'EducationalOrganization', 'GovernmentOrganization', 'MedicalOrganization', 'NGO', 'SportsOrganization', 'Team')),
                        'street' => array('type' => 'string'),
                        'city' => array('type' => 'string'),
                        'region' => array('type' => 'string'),
                        'postal_code' => array('type' => 'string'),
                        'country' => array('type' => 'string'),
                        'phone' => array('type' => 'string'),
                        'email' => array('type' => 'string'),
                        'website' => array('type' => 'string'),
                        'logo_url' => array('type' => 'string'),
                        'founding_date' => array('type' => 'string'),
                        'founder' => array('type' => 'string'),
                        'employees' => array('type' => 'string'),
                        'slogan' => array('type' => 'string'),
                        'sameAs' => array('type' => 'array', 'items' => array('type' => 'string'), 'description' => 'Social profile URLs.'),
                    )),
                    'schema' => array('type' => 'object', 'description' => 'Schema generation settings.', 'properties' => array(
                        'auto_generate_on_save' => array('type' => 'boolean'),
                        'types_enabled' => array('type' => 'array', 'items' => array('type' => 'string', 'enum' => array('faq', 'organization', 'article', 'review'))),
                        'openai_model' => array('type' => 'string'),
                        'faq_question_count' => array('type' => 'integer', 'minimum' => 2, 'maximum' => 10),
                        'max_content_chars' => array('type' => 'integer', 'minimum' => 1000),
                    )),
                    'tone_language' => array('type' => 'object', 'description' => 'Tone and language for AI-generated text.', 'properties' => array(
                        'tone' => array('type' => 'string', 'enum' => array('professional', 'friendly', 'casual', 'authoritative', 'conversational', 'custom')),
                        'custom_tone' => array('type' => 'string'),
                        'output_language' => array('type' => 'string', 'description' => 'ISO 639-1 language code (en, es, de, fr, etc.).'),
                        'respect_wp_locale' => array('type' => 'boolean'),
                        'answer_length' => array('type' => 'string', 'enum' => array('short', 'medium', 'long')),
                    )),
                    'reviews_enabled' => array('type' => 'boolean'),
                    'aggregate_rating' => array('type' => 'object', 'properties' => array(
                        'rating_value' => array('type' => 'string'),
                        'review_count' => array('type' => 'string'),
                        'worst' => array('type' => 'string'),
                        'best' => array('type' => 'string'),
                    )),
                    'faq_display' => array('type' => 'object', 'description' => 'Frontend FAQ accordion display settings.', 'properties' => array(
                        'enabled' => array('type' => 'boolean'),
                        'section_title' => array('type' => 'string'),
                        'show_on' => array('type' => 'array', 'items' => array('type' => 'string')),
                        'layout' => array('type' => 'string', 'enum' => array('boxed', 'flat', 'minimal')),
                        'primary_color' => array('type' => 'string'),
                        'bg_color' => array('type' => 'string'),
                        'text_color' => array('type' => 'string'),
                        'answer_color' => array('type' => 'string'),
                        'border_color' => array('type' => 'string'),
                        'border_radius' => array('type' => 'integer', 'minimum' => 0, 'maximum' => 30),
                        'expand_icon' => array('type' => 'string', 'enum' => array('chevron', 'plus', 'arrow')),
                        'first_open' => array('type' => 'boolean'),
                        'font_size' => array('type' => 'integer', 'minimum' => 12, 'maximum' => 24),
                    )),
                ),
            ), 'settings', false, true),
        );

        $visible = array();
        foreach ($tools as $tool) {
            if (in_array($tool['_scope'], $scopes, true)) {
                unset($tool['_scope']);
                $visible[] = $tool;
            }
        }
        return $visible;
    }

    private static function tool_definition($name, $title, $description, $schema, $scope, $read_only, $idempotent, $destructive = false) {
        return array(
            'name' => $name,
            'title' => $title,
            'description' => $description,
            'inputSchema' => $schema,
            'annotations' => array(
                'readOnlyHint' => $read_only,
                'destructiveHint' => $destructive,
                'idempotentHint' => $idempotent,
                'openWorldHint' => false,
            ),
            '_scope' => $scope,
        );
    }

    private static function seo_schema_properties() {
        return array(
            'meta_title' => array('type' => 'string', 'description' => 'SEO/browser title. Empty string clears it.'),
            'meta_description' => array('type' => 'string', 'description' => 'SEO meta description. Empty string clears it.'),
            'focus_keyword' => array('type' => 'string', 'description' => 'Primary target keyword or phrase.'),
            'canonical_url' => array('type' => 'string', 'description' => 'Canonical URL. Empty string uses the permalink.'),
            'robots_noindex' => array('type' => 'boolean', 'description' => 'Whether search engines should not index the URL.'),
            'robots_nofollow' => array('type' => 'boolean', 'description' => 'Whether search engines should not follow links on the URL.'),
            'schema_type' => array('type' => 'string', 'enum' => array('none', 'WebPage', 'Article', 'BlogPosting', 'FAQPage', 'HowTo', 'Product', 'LocalBusiness', 'Service')),
            'social_title' => array('type' => 'string', 'description' => 'Open Graph/Twitter title override.'),
            'social_description' => array('type' => 'string', 'description' => 'Open Graph/Twitter description override.'),
            'social_image' => array('type' => 'string', 'description' => 'Open Graph/Twitter image URL.'),
        );
    }

    private static function render_schema_properties() {
        return array(
            'render_enabled' => array('type' => 'boolean', 'description' => 'Enable custom rendering for this page/post. When true, the render_html/css/javascript replaces the theme output.'),
            'render_html' => array('type' => 'string', 'description' => 'Full-page HTML content. Can be a complete HTML document or a body fragment. Trusted code — runs without escaping.'),
            'render_css' => array('type' => 'string', 'description' => 'CSS to inject into the rendered page. Trusted code — runs without escaping.'),
            'render_javascript' => array('type' => 'string', 'description' => 'JavaScript to inject into the rendered page. Trusted code — runs without escaping.'),
            'use_global_header' => array('type' => 'boolean', 'description' => 'If true, enable the header on the rendered page.'),
            'header_type' => array('type' => 'string', 'enum' => array('global', 'custom', 'elementor', 'theme', 'extracted', 'none'), 'description' => 'Header source: global, custom, elementor, theme, extracted, or none.'),
            'header_elementor_id' => array('type' => 'integer', 'description' => 'Elementor template ID when header_type is elementor.'),
            'use_global_footer' => array('type' => 'boolean', 'description' => 'If true, enable the footer on the rendered page.'),
            'footer_type' => array('type' => 'string', 'enum' => array('global', 'custom', 'elementor', 'theme', 'extracted', 'none'), 'description' => 'Footer source: global, custom, elementor, theme, extracted, or none.'),
            'footer_elementor_id' => array('type' => 'integer', 'description' => 'Elementor template ID when footer_type is elementor.'),
        );
    }

    private static function tool_scope($name) {
        $map = array(
            'get_site_info' => 'read',
            'list_content' => 'read',
            'get_content' => 'read',
            'create_content' => 'write',
            'update_content' => 'write',
            'delete_content' => 'write',
            'list_categories' => 'read',
            'list_tags' => 'read',
            'get_revisions' => 'read',
            'update_seo' => 'write',
            'analyze_seo' => 'write',
            'publish_content' => 'write',
            'schedule_content' => 'write',
            'update_custom_render' => 'write',
            'get_global_render' => 'read',
            'update_global_render' => 'settings',
            'list_media' => 'read',
            'get_media' => 'read',
            'get_schema' => 'read',
            'generate_schema' => 'write',
            'regenerate_schema_type' => 'write',
            'save_schema_type' => 'write',
            'delete_schema_type' => 'write',
            'get_schema_settings' => 'read',
            'update_schema_settings' => 'settings',
        );
        return isset($map[$name]) ? $map[$name] : '';
    }

    private static function tool_success($data) {
        return array(
            'content' => array(array('type' => 'text', 'text' => wp_json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))),
            'structuredContent' => is_array($data) ? $data : array('value' => $data),
            'isError' => false,
        );
    }

    private static function tool_error($message) {
        return array(
            'content' => array(array('type' => 'text', 'text' => (string) $message)),
            'isError' => true,
        );
    }

    private static function rpc_result($id, $result) {
        return array('jsonrpc' => '2.0', 'id' => $id, 'result' => $result);
    }

    private static function rpc_error($id, $code, $message) {
        return array('jsonrpc' => '2.0', 'id' => $id, 'error' => array('code' => $code, 'message' => $message));
    }

    private static function mcp_http_response($data, $status) {
        $response = new WP_REST_Response($data, $status);
        $response->header('Content-Type', 'application/json; charset=' . get_option('blog_charset'));
        $response->header('MCP-Protocol-Version', self::LATEST_PROTOCOL);
        if ($status === 202) {
            $response->header('X-CWR-MCP-Empty', '1');
        }
        return $response;
    }

    public static function serve_empty_response($served, $result, $request, $server) {
        if ($request->get_route() !== '/' . self::REST_NAMESPACE . self::REST_ROUTE) {
            return $served;
        }
        if ($result instanceof WP_HTTP_Response && $result->get_status() === 202 && $result->get_data() === null) {
            status_header(202);
            return true;
        }
        return $served;
    }

    private static function get_tokens() {
        $tokens = get_option(self::OPTION_TOKENS, array());
        return is_array($tokens) ? $tokens : array();
    }

    private static function hash_token($token) {
        return hash_hmac('sha256', (string) $token, wp_salt('auth'));
    }

    private static function base64url_encode($value) {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function active_scopes() {
        return self::$active_token && isset(self::$active_token['scopes']) && is_array(self::$active_token['scopes'])
            ? self::$active_token['scopes']
            : array();
    }

    private static function touch_token($token_id) {
        $tokens = self::get_tokens();
        if (!isset($tokens[$token_id])) {
            return;
        }
        $last_used = !empty($tokens[$token_id]['last_used_at']) ? strtotime($tokens[$token_id]['last_used_at'] . ' UTC') : 0;
        if ($last_used && $last_used > time() - HOUR_IN_SECONDS) {
            return;
        }
        $tokens[$token_id]['last_used_at'] = current_time('mysql', true);
        update_option(self::OPTION_TOKENS, $tokens, false);
    }

    private static function check_rate_limit($token_id) {
        $key = 'cwr_mcp_rate_' . md5($token_id);
        $count = (int) get_transient($key);
        if ($count >= 120) {
            return false;
        }
        set_transient($key, $count + 1, MINUTE_IN_SECONDS);
        return true;
    }

    private static function write_audit_log($tool, $result) {
        $log = get_option(self::OPTION_AUDIT_LOG, array());
        if (!is_array($log)) {
            $log = array();
        }
        array_unshift(
            $log,
            array(
                'time' => current_time('mysql', true),
                'client' => self::$active_token && isset(self::$active_token['name']) ? self::$active_token['name'] : 'Unknown',
                'tool' => $tool,
                'result' => $result,
            )
        );
        update_option(self::OPTION_AUDIT_LOG, array_slice($log, 0, 100), false);
    }

    private static function format_utc_date($date) {
        if (!$date) {
            return '';
        }
        $timestamp = strtotime($date . ' UTC');
        return $timestamp ? wp_date(get_option('date_format') . ' ' . get_option('time_format'), $timestamp) : $date;
    }

    private static function to_boolean($value) {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private static function is_list($array) {
        if ($array === array()) {
            return true;
        }
        return array_keys($array) === range(0, count($array) - 1);
    }
}
