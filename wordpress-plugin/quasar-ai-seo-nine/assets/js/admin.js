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

    // Copy token button
    $(document).on('click', '#quasar-copy-token', function(e) {
        e.preventDefault();
        var token = $(this).data('token');
        if (navigator.clipboard && token) {
            navigator.clipboard.writeText(token).then(function() {
                showToast('Token copied to clipboard!', 'success');
            }, function() {
                showToast('Failed to copy token.', 'error');
            });
        } else {
            // Fallback for older browsers
            var $temp = $('<textarea>');
            $('body').append($temp);
            $temp.val(token).select();
            try {
                document.execCommand('copy');
                showToast('Token copied to clipboard!', 'success');
            } catch (err) {
                showToast('Failed to copy token.', 'error');
            }
            $temp.remove();
        }
    });

    // Disconnect button — delete local app password and connection status
    $(document).on('click', '#quasar-disconnect-btn', function(e) {
        e.preventDefault();
        if (!confirm('Are you sure you want to disconnect from Quasar AI SEO?')) {
            return;
        }

        var btn = $(this);
        btn.prop('disabled', true).html('<span class="quasar-loading"></span> Disconnecting...');

        $.ajax({
            url: quasarData.siteUrl + '/wp-json/quasar-ai-seo/v1/disconnect',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-Quasar-Token', quasarData.token);
            },
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
