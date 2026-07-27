/* Quasar AI SEO Assistant - Admin JavaScript */

(function($) {
    'use strict';

    function showToast(message, type) {
        var toast = $('<div class="quasar-toast quasar-toast-' + (type || 'success') + '">' + message + '</div>');
        $('body').append(toast);
        setTimeout(function() {
            toast.fadeOut(300, function() { $(this).remove(); });
        }, 4000);
    }

    // Connect button
    $(document).on('click', '#quasar-connect-btn', function(e) {
        e.preventDefault();
        var btn = $(this);
        var originalText = btn.html();

        btn.prop('disabled', true).html('<span class="quasar-loading"></span> Connecting...');

        // First, establish connection via our own REST API (generate app password)
        $.ajax({
            url: quasarData.apiUrl + '/api/wordpress/connect',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                site_url: quasarData.siteUrl,
                token: quasarData.token,
            }),
            timeout: 15000,
            success: function(response) {
                if (response.success) {
                    // Also call the local REST to establish connection
                    $.ajax({
                        url: quasarData.siteUrl + '/wp-json/quasar-ai-seo/v1/connect',
                        method: 'POST',
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('X-Quasar-Token', quasarData.token);
                        },
                        success: function() {
                            showToast('Successfully connected to Quasar AI SEO!', 'success');
                            setTimeout(function() {
                                window.location.reload();
                            }, 1500);
                        },
                        error: function() {
                            // Connection registered on backend, local may have issues
                            showToast('Connected! Redirecting...', 'success');
                            setTimeout(function() {
                                window.location.reload();
                            }, 1500);
                        }
                    });
                } else {
                    btn.prop('disabled', false).html(originalText);
                    showToast(response.message || 'Connection failed. Please try again.', 'error');
                }
            },
            error: function(xhr) {
                btn.prop('disabled', false).html(originalText);
                var msg = 'Connection failed. Please check your internet connection.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message;
                }
                showToast(msg, 'error');
            }
        });
    });

    // Disconnect button
    $(document).on('click', '#quasar-disconnect-btn', function(e) {
        e.preventDefault();
        if (!confirm('Are you sure you want to disconnect from Quasar AI SEO?')) {
            return;
        }

        var btn = $(this);
        btn.prop('disabled', true).html('<span class="quasar-loading"></span> Disconnecting...');

        $.ajax({
            url: quasarData.apiUrl + '/api/wordpress/disconnect',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                site_url: quasarData.siteUrl,
            }),
            success: function() {
                showToast('Disconnected successfully.', 'success');
                setTimeout(function() {
                    window.location.reload();
                }, 1500);
            },
            error: function() {
                btn.prop('disabled', false).html('Disconnect from Quasar AI SEO');
                showToast('Failed to disconnect. Please try again.', 'error');
            }
        });
    });

})(jQuery);
