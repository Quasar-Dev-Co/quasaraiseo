(function ($) {
	'use strict';

	var quasar = window.quasarAdmin || {};
	console.log('[QuasarAISEO] admin.js loaded');

	// ---- Resend approval email ----
	$(document).on('click', '#quasar-resend-approval', function () {
		var $btn = $(this);
		var $status = $('.quasar-resend-status');
		$btn.prop('disabled', true);
		$status.text('Sending...');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_resend_approval',
			nonce: quasar.nonce
		}, function (resp) {
			$btn.prop('disabled', false);
			if (resp && resp.success) {
				$status.text(resp.data.message).css('color', '#2a7f2a');
			} else {
				$status.text((resp && resp.data && resp.data.message) || quasar.i18n.error).css('color', '#c62828');
			}
		}).fail(function () {
			$btn.prop('disabled', false);
			$status.text(quasar.i18n.error).css('color', '#c62828');
		});
	});

	// ---- Bypass email verification ----
	$(document).on('click', '#quasar-bypass-btn', function () {
		var $btn = $(this);
		var $input = $('#quasar_bypass_password');
		var $status = $('.quasar-bypass-status');
		var password = ($input.val() || '').trim();
		if (!password) {
			$status.text('Please enter the master password.').css('color', '#c62828');
			return;
		}
		$btn.prop('disabled', true);
		$status.text('Verifying...');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_bypass_approval',
			nonce: quasar.nonce,
			password: password
		}, function (resp) {
			$btn.prop('disabled', false);
			if (resp && resp.success) {
				$status.text(resp.data.message || 'Activated!').css('color', '#2a7f2a');
				$input.val('');
				// Reload after short delay so the approval status updates.
				setTimeout(function () { window.location.reload(); }, 1200);
			} else {
				$status.text((resp && resp.data && resp.data.message) || 'Bypass failed.').css('color', '#c62828');
			}
		}).fail(function () {
			$btn.prop('disabled', false);
			$status.text(quasar.i18n.error || 'Request failed.').css('color', '#c62828');
		});
	});
	// Enter key triggers bypass button
	$(document).on('keydown', '#quasar_bypass_password', function (e) {
		if (e.keyCode === 13) {
			e.preventDefault();
			$('#quasar-bypass-btn').trigger('click');
		}
	});

	// ---- Media uploader for logo ----
	$(document).on('click', '.quasar-upload-logo', function (e) {
		e.preventDefault();
		var $input = $('#quasar_company_logo_url');
		var $preview = $('.quasar-logo-preview');
		var frame = wp.media({
			title: 'Select Company Logo',
			button: { text: 'Use this logo' },
			multiple: false
		});
		frame.on('select', function () {
			var attachment = frame.state().get('selection').first().toJSON();
			$input.val(attachment.url);
			$preview.html('<img src="' + attachment.url + '" alt="" />');
		});
		frame.open();
	});

	// ---- Repeater add/remove (sameAs + reviews) ----
	$(document).on('click', '.quasar-repeater-add', function (e) {
		e.preventDefault();
		var $container = $(this).closest('.quasar-repeater');
		var $row = $container.find('.quasar-repeater-row:first').clone();
		$row.find('input, textarea, select').val('');
		$container.find('.quasar-repeater-rows').append($row);
	});
	$(document).on('click', '.quasar-repeater-remove', function (e) {
		e.preventDefault();
		var $container = $(this).closest('.quasar-repeater');
		if ($container.find('.quasar-repeater-row').length > 1) {
			$(this).closest('.quasar-repeater-row').remove();
		}
	});

	// ---- Social platform quick-add chips ----
	$(document).on('click', '.quasar-social-chip', function (e) {
		e.preventDefault();
		var placeholder = $(this).data('placeholder') || '';
		var $repeater = $(this).closest('td').find('.quasar-repeater');
		var $rows = $repeater.find('.quasar-repeater-rows');
		var $row = $repeater.find('.quasar-repeater-row:first').clone();
		$row.find('input').val('').attr('placeholder', placeholder);
		$rows.append($row);
		// Focus the newly added input.
		$rows.find('.quasar-repeater-row:last input').focus();
	});

	// ---- Test OpenAI connection ----
	$(document).on('click', '#quasar-test-openai', function (e) {
		e.preventDefault();
		var $btn = $(this);
		var $result = $('.quasar-test-result');
		$btn.prop('disabled', true);
		$result.text('Testing...').attr('class', 'quasar-test-result');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_test_openai',
			nonce: quasar.nonce
		}, function (resp) {
			$btn.prop('disabled', false);
			if (resp && resp.success) {
				$result.text('Connection OK').addClass('ok');
			} else {
				$result.text((resp && resp.data && resp.data.message) || 'Failed').addClass('fail');
			}
		}).fail(function () {
			$btn.prop('disabled', false);
			$result.text('Failed').addClass('fail');
		});
	});

	// ---- Refresh models ----
	$(document).on('click', '#quasar-refresh-models', function (e) {
		e.preventDefault();
		var $btn = $(this);
		var $status = $('.quasar-refresh-models-status');
		var $select = $('#quasar_openai_model');
		var selectedVal = $select.val();
		$btn.prop('disabled', true);
		$status.text('Fetching models...').attr('style', 'font-style:italic;color:#555;');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_refresh_models',
			nonce: quasar.nonce
		}, function (resp) {
			$btn.prop('disabled', false);
			if (resp && resp.success && resp.data.models) {
				// Rebuild the dropdown.
				$select.empty();
				$.each(resp.data.models, function (id, label) {
					var $opt = $('<option></option>').attr('value', id).text(label);
					if (id === selectedVal) { $opt.prop('selected', true); }
					$select.append($opt);
				});
				$status.text(resp.data.message).css('color', '#2a7f2a');
			} else {
				$status.text((resp && resp.data && resp.data.message) || 'Failed to fetch models').css('color', '#c62828');
			}
		}).fail(function () {
			$btn.prop('disabled', false);
			$status.text('Failed to fetch models').css('color', '#c62828');
		});
	});

	// ---- Meta box: per-section actions ----
	// Get post ID from multiple possible sources (classic editor, block editor, meta box).
	function getPostId() {
		return $('#post_ID').val() ||
			$('.quasar-metabox').data('post-id') ||
			($('#quasar-metabox-post-id').val()) ||
			0;
	}
	var postId = getPostId();
	console.log('[QuasarAISEO] post ID:', postId);

	// Helper: update the combined JSON preview.
	function updateCombinedPreview() {
		$.post(quasar.ajaxUrl, {
			action: 'quasar_get_combined',
			nonce: quasar.nonce,
			post_id: postId
		}, function (resp) {
			if (resp && resp.success && resp.data.schema) {
				$('.quasar-combined-json').val(JSON.stringify(resp.data.schema, null, 2));
			}
		});
	}

	// Section collapse/expand.
	$(document).on('click', '.quasar-section-header', function () {
		$(this).closest('.quasar-section-card').toggleClass('collapsed');
	});

	// Regenerate ALL types.
	$(document).on('click', '.quasar-regenerate-all', function () {
		console.log('[QuasarAISEO] regenerate-all clicked');
		var $btn = $(this);
		var $msg = $('#quasar-metabox-global-msg');
		postId = getPostId();
		$btn.prop('disabled', true);
		$msg.text(quasar.i18n.regenerating).attr('class', 'quasar-metabox-msg');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_regenerate',
			nonce: quasar.nonce,
			post_id: postId
		}, function (resp) {
			$btn.prop('disabled', false);
			if (resp && resp.success) {
				// Update each section's editor + status.
				if (resp.data.types_meta) {
					$.each(resp.data.types_meta, function (type, node) {
						var $card = $('.quasar-section-card[data-type="' + type + '"]');
						$card.find('.quasar-type-json').val(JSON.stringify(node, null, 2));
						var st = (resp.data.statuses && resp.data.statuses[type]) || 'auto';
						$card.find('.quasar-status-badge')
							.attr('class', 'quasar-status-badge quasar-status-' + st)
							.text(st.charAt(0).toUpperCase() + st.slice(1));
					});
				}
				$msg.text(resp.data.message).addClass('success');
				updateCombinedPreview();
			} else {
				$msg.text((resp && resp.data && resp.data.message) || quasar.i18n.error).addClass('error');
			}
		}).fail(function () {
			$btn.prop('disabled', false);
			$msg.text(quasar.i18n.error).addClass('error');
		});
	});

	// Regenerate a single type.
	$(document).on('click', '.quasar-type-regenerate', function () {
		var $card = $(this).closest('.quasar-section-card');
		var type = $card.data('type');
		console.log('[QuasarAISEO] regenerate type:', type);
		var $btn = $(this);
		var $msg = $card.find('.quasar-section-msg');
		postId = getPostId();
		$btn.prop('disabled', true);
		$msg.text('Regenerating...').attr('class', 'quasar-section-msg');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_regenerate_type',
			nonce: quasar.nonce,
			post_id: postId,
			schema_type: type
		}, function (resp) {
			$btn.prop('disabled', false);
			if (resp && resp.success) {
				$card.find('.quasar-type-json').val(JSON.stringify(resp.data.node, null, 2));
				$card.find('.quasar-status-badge')
					.attr('class', 'quasar-status-badge quasar-status-' + resp.data.status)
					.text(resp.data.status.charAt(0).toUpperCase() + resp.data.status.slice(1));
				$msg.text(resp.data.message).addClass('success');
				updateCombinedPreview();
			} else {
				$msg.text((resp && resp.data && resp.data.message) || quasar.i18n.error).addClass('error');
			}
		}).fail(function () {
			$btn.prop('disabled', false);
			$msg.text(quasar.i18n.error).addClass('error');
		});
	});

	// Save a manual edit of a single type.
	$(document).on('click', '.quasar-type-save', function () {
		var $card = $(this).closest('.quasar-section-card');
		var type = $card.data('type');
		var $msg = $card.find('.quasar-section-msg');
		var json = $card.find('.quasar-type-json').val();
		postId = getPostId();
		$msg.text('Saving...').attr('class', 'quasar-section-msg');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_save_type',
			nonce: quasar.nonce,
			post_id: postId,
			schema_type: type,
			schema: json
		}, function (resp) {
			if (resp && resp.success) {
				$card.find('.quasar-status-badge')
					.attr('class', 'quasar-status-badge quasar-status-edited')
					.text('Edited');
				$msg.text(quasar.i18n.saved).addClass('success');
				updateCombinedPreview();
			} else {
				$msg.text((resp && resp.data && resp.data.message) || quasar.i18n.error).addClass('error');
			}
		}).fail(function () {
			$msg.text(quasar.i18n.error).addClass('error');
		});
	});

	// Delete a single type.
	$(document).on('click', '.quasar-type-delete', function () {
		if (!confirm(quasar.i18n.confirmDelete)) { return; }
		var $card = $(this).closest('.quasar-section-card');
		var type = $card.data('type');
		var $msg = $card.find('.quasar-section-msg');
		postId = getPostId();
		$msg.text('Deleting...').attr('class', 'quasar-section-msg');
		$.post(quasar.ajaxUrl, {
			action: 'quasar_delete_type',
			nonce: quasar.nonce,
			post_id: postId,
			schema_type: type
		}, function (resp) {
			if (resp && resp.success) {
				$card.find('.quasar-type-json').val('');
				$card.find('.quasar-status-badge')
					.attr('class', 'quasar-status-badge quasar-status-manual')
					.text('Manual');
				$msg.text(quasar.i18n.deleted).addClass('success');
				updateCombinedPreview();
			} else {
				$msg.text((resp && resp.data && resp.data.message) || quasar.i18n.error).addClass('error');
			}
		}).fail(function () {
			$msg.text(quasar.i18n.error).addClass('error');
		});
	});

})(jQuery);
