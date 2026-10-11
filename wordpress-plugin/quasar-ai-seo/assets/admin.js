(function ($) {
    if (!$) {
        return;
    }

    function showRawCodeArea(textarea) {
        if (!textarea || !window.jQuery) {
            return;
        }

        window.jQuery(textarea)
            .removeClass('cwr-codemirror-ready')
            .css({
                display: 'block',
                visibility: 'visible',
                opacity: 1
            });
    }

    function initCodeEditor(id, type) {
        var textarea = document.getElementById(id);

        if (!textarea) {
            return;
        }

        if (!window.wp || !wp.codeEditor || !window.CWRAdmin || !CWRAdmin.codeEditor) {
            showRawCodeArea(textarea);
            return;
        }

        try {
            var settings = $.extend(true, {}, CWRAdmin.codeEditor);
            settings.codemirror = settings.codemirror || {};
            settings.codemirror.mode = type;
            settings.codemirror.lineNumbers = true;
            settings.codemirror.lineWrapping = true;

            var editor = wp.codeEditor.initialize(textarea, settings);

            if (editor && editor.codemirror) {
                $(textarea).addClass('cwr-codemirror-ready');
                $(textarea).data('codemirror', editor.codemirror);
                editor.codemirror.setSize(null, id === 'cwr_html' ? 420 : 260);
                window.setTimeout(function () {
                    editor.codemirror.refresh();
                }, 50);
            } else {
                showRawCodeArea(textarea);
            }
        } catch (err) {
            showRawCodeArea(textarea);
            if (window.console && console.warn) {
                console.warn('CWR code editor init failed for ' + id, err);
            }
        }
    }

    $(function () {
        if (window.CWRSeoRuntimeReady) {
            return;
        }
        window.CWRSeoRuntimeReady = true;

        var cfg = window.CWRAdmin || {};
        var ajaxUrl = cfg.ajaxUrl || window.ajaxurl || '';

        function i18n(key, fallback) {
            return cfg[key] || fallback;
        }

        function setEditorContent(id, value) {
            var el = document.getElementById(id);
            if (!el) {
                return;
            }
            var cm = $(el).data('codemirror');
            if (cm && typeof cm.setValue === 'function') {
                cm.setValue(value);
                cm.refresh();
            } else {
                el.value = value;
            }
        }

        function refreshEditor(id) {
            var el = document.getElementById(id);
            if (!el) {
                return;
            }
            var cm = $(el).data('codemirror');
            if (cm && typeof cm.refresh === 'function') {
                window.setTimeout(function () {
                    cm.refresh();
                }, 60);
            }
        }

        try {
            initCodeEditor('cwr_html', 'htmlmixed');
            initCodeEditor('cwr_css', 'css');
            initCodeEditor('cwr_js', 'javascript');
            initCodeEditor('cwr_global_header', 'htmlmixed');
            initCodeEditor('cwr_global_footer', 'htmlmixed');
            initCodeEditor('cwr_global_head', 'htmlmixed');
        } catch (err) {
            if (window.console && console.warn) {
                console.warn('CWR code editors did not fully load', err);
            }
        }

        $('.cwr-copy-button').on('click', function () {
            var button = this;
            var target = document.getElementById(button.getAttribute('data-copy-target'));

            if (!target) {
                return;
            }

            function showCopied() {
                var originalText = button.textContent;
                button.textContent = 'Copied';
                window.setTimeout(function () {
                    button.textContent = originalText;
                }, 1400);
            }

            if (navigator.clipboard) {
                navigator.clipboard.writeText(target.textContent).then(showCopied);
                return;
            }

            var helper = document.createElement('textarea');
            helper.value = target.textContent;
            helper.setAttribute('readonly', 'readonly');
            helper.style.position = 'fixed';
            helper.style.opacity = '0';
            document.body.appendChild(helper);
            helper.select();
            document.execCommand('copy');
            document.body.removeChild(helper);
            showCopied();
        });

        $('.cwr-confirm-revoke').on('click', function (event) {
            if (!window.confirm('Revoke this MCP token? Connected clients will stop working immediately.')) {
                event.preventDefault();
            }
        });

        $('.cwr-design-download').on('click', function () {
            var button = this;
            var targetId = button.getAttribute('data-target');
            var filename = button.getAttribute('data-filename') || (targetId + '.html');
            var target = document.getElementById(targetId);

            if (!target) {
                return;
            }

            var text = target.textContent || '';
            var blob = new Blob([text], { type: 'text/html;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            var originalText = button.textContent;
            button.textContent = 'Saved';
            window.setTimeout(function () {
                button.textContent = originalText;
            }, 1400);
        });

        function setCustomModelVisibility() {
            var select = $('#cwr_openrouter_model');
            var custom = $('#cwr_openrouter_custom_model');

            if (!select.length || !custom.length) {
                return;
            }

            custom.closest('.cwr-field').toggle(select.val() === 'custom');
        }

        $('#cwr_openrouter_model').on('change', setCustomModelVisibility);
        setCustomModelVisibility();

        function actionText(button) {
            var mode = button.data('mode') || 'local';
            var originalText = button.data('original-text');

            if (originalText) {
                return originalText;
            }

            if (mode === 'ai') {
                return i18n('aiAnalyzeText', 'AI Analyze');
            }
            if (mode === 'fix') {
                return i18n('aiFixText', 'AI Fix All');
            }
            if (button.text().trim() === i18n('rescanText', 'Rescan')) {
                return i18n('rescanText', 'Rescan');
            }
            return i18n('analyzeText', 'Scan SEO');
        }

        function updateAnalyzeButton(button, isLoading) {
            if (!button.data('original-text')) {
                button.data('original-text', button.text().trim());
            }

            button.prop('disabled', isLoading);
            button.text(isLoading ? i18n('analyzingText', 'Analyzing...') : actionText(button));
        }

        function refreshSeoFields(fields) {
            if (!fields) {
                return;
            }

            $.each(fields, function (name, value) {
                var field = $('[name="' + name + '"]');

                if (!field.length) {
                    return;
                }

                if (field.attr('type') === 'checkbox') {
                    field.prop('checked', !!value);
                    return;
                }

                field.val(value);
            });
        }

        function runSeoAnalysis(button) {
            var postId = button.data('post-id');
            var mode = button.data('mode') || 'local';
            var report = $('[data-cwr-seo-report="' + postId + '"]');
            var scoreCell = $('[data-cwr-row-score="' + postId + '"]');

            if (!postId || !ajaxUrl) {
                if (report.length) {
                    report.html('<div class="notice notice-error inline"><p>SEO buttons could not find the WordPress AJAX URL. Refresh the admin page and try again.</p></div>');
                } else {
                    scoreCell.html('<span class="cwr-score-badge is-poor">AJAX missing</span>');
                }
                return $.Deferred().reject().promise();
            }

            updateAnalyzeButton(button, true);
            if (report.length) {
                report.html('<div class="cwr-empty-report is-loading">' + i18n('analyzingText', 'Analyzing...') + '</div>');
            } else if (scoreCell.length) {
                scoreCell.html('<span class="cwr-score-badge is-empty">' + i18n('analyzingText', 'Analyzing...') + '</span>');
            }

            return $.post(ajaxUrl, {
                action: 'cwr_analyze_seo',
                nonce: cfg.seoNonce,
                post_id: postId,
                mode: mode
            }).done(function (response) {
                if (!response || !response.success || !response.data) {
                    if (report.length) {
                        report.html('<div class="notice notice-error inline"><p>' + i18n('analysisErrorText', 'SEO analysis failed.') + '</p></div>');
                    } else if (scoreCell.length) {
                        scoreCell.html('<span class="cwr-score-badge is-poor">Failed</span>');
                    }
                    return;
                }

                if (report.length) {
                    report.html(response.data.html);
                }
                $('[data-cwr-row-score="' + postId + '"]').html(response.data.badgeHtml);
                refreshSeoFields(response.data.fields);
            }).fail(function (xhr) {
                var message = xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message
                    ? xhr.responseJSON.data.message
                    : i18n('analysisErrorText', 'SEO analysis failed.');
                if (report.length) {
                    report.html('<div class="notice notice-error inline"><p>' + message + '</p></div>');
                } else if (scoreCell.length) {
                    scoreCell.html('<span class="cwr-score-badge is-poor">Failed</span>');
                }
            }).always(function () {
                updateAnalyzeButton(button, false);
            });
        }

        $(document).on('click', '.cwr-seo-analyze', function (event) {
            event.preventDefault();
            runSeoAnalysis($(this));
        });

        $(document).on('click', '.cwr-seo-analyze-all', function (event) {
            event.preventDefault();
            var button = $(this);
            var queue = $('.cwr-items-table .cwr-seo-analyze[data-mode="local"]').toArray();
            var originalText = button.text();

            button.prop('disabled', true).text(i18n('analyzingText', 'Analyzing...'));

            function next() {
                var item = queue.shift();
                if (!item) {
                    button.prop('disabled', false).text(originalText);
                    return;
                }
                runSeoAnalysis($(item)).always(next);
            }

            next();
        });

        function loadSeoProblems(button) {
            var panel = $('[data-cwr-seo-problems]');

            if (!panel.length || !ajaxUrl) {
                return;
            }

            if (panel.is(':visible') && button.data('loaded')) {
                panel.prop('hidden', true);
                button.text(i18n('viewProblemsText', 'View SEO Problems'));
                return;
            }

            panel.prop('hidden', false).html('<div class="cwr-empty-report is-loading">' + i18n('loadingProblemsText', 'Loading SEO problems...') + '</div>');
            button.prop('disabled', true).text(i18n('loadingProblemsText', 'Loading SEO problems...'));

            $.post(ajaxUrl, {
                action: 'cwr_load_seo_problems',
                nonce: cfg.problemsNonce
            }).done(function (response) {
                if (!response || !response.success || !response.data) {
                    panel.html('<div class="notice notice-error inline"><p>' + i18n('analysisErrorText', 'SEO analysis failed.') + '</p></div>');
                    return;
                }

                panel.html(response.data.html || '');
                if (response.data.badges) {
                    $.each(response.data.badges, function (postId, badgeHtml) {
                        $('[data-cwr-row-score="' + postId + '"]').html(badgeHtml);
                    });
                }
                button.data('loaded', true).text(i18n('hideProblemsText', 'Hide SEO Problems'));
            }).fail(function (xhr) {
                var message = xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message
                    ? xhr.responseJSON.data.message
                    : i18n('analysisErrorText', 'SEO analysis failed.');
                panel.html('<div class="notice notice-error inline"><p>' + message + '</p></div>');
            }).always(function () {
                button.prop('disabled', false);
                button.text(panel.is(':visible') && button.data('loaded') ? i18n('hideProblemsText', 'Hide SEO Problems') : i18n('viewProblemsText', 'View SEO Problems'));
            });
        }

        $(document).on('click', '.cwr-seo-problems-view', function (event) {
            event.preventDefault();
            loadSeoProblems($(this));
        });

        function setOpenRouterStatus(message, type) {
            var status = $('#cwr-openrouter-status');

            if (!status.length) {
                return;
            }

            status.removeClass('is-success is-error is-loading');
            if (type) {
                status.addClass('is-' + type);
            }
            status.text(message || '');
        }

        function selectedOpenRouterModel() {
            var model = $('#cwr_openrouter_model').val();

            if (model === 'custom') {
                return $('#cwr_openrouter_custom_model').val();
            }

            return model;
        }

        function openRouterPayload() {
            return {
                nonce: cfg.settingsNonce,
                api_key: $('#cwr_openrouter_api_key').val(),
                model: $('#cwr_openrouter_model').val(),
                custom_model: $('#cwr_openrouter_custom_model').val(),
                system_prompt: $('#cwr_openrouter_system_prompt').val()
            };
        }

        function optionWithValue(select, value) {
            return select.find('option').filter(function () {
                return this.value === value;
            });
        }

        $(document).on('click', '#cwr-openrouter-load-models', function (event) {
            event.preventDefault();
            var button = $(this);
            var originalText = button.text();

            button.prop('disabled', true).text(i18n('loadingModelsText', 'Loading models...'));
            setOpenRouterStatus(i18n('loadingModelsText', 'Loading models...'), 'loading');

            $.post(ajaxUrl, $.extend({ action: 'cwr_openrouter_models' }, openRouterPayload()))
                .done(function (response) {
                    var select = $('#cwr_openrouter_model');
                    var current = selectedOpenRouterModel();

                    if (!response || !response.success || !response.data || !response.data.models) {
                        setOpenRouterStatus(i18n('settingsErrorText', 'OpenRouter request failed.'), 'error');
                        return;
                    }

                    $.each(response.data.models, function (id, label) {
                        if (!optionWithValue(select, id).length) {
                            $('<option>').val(id).text(label).insertBefore(select.find('option[value="custom"]'));
                        }
                    });

                    if (current && optionWithValue(select, current).length) {
                        select.val(current);
                    }

                    setCustomModelVisibility();
                    setOpenRouterStatus(response.data.message || i18n('modelsLoadedText', 'Models loaded.'), 'success');
                })
                .fail(function (xhr) {
                    var message = xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message
                        ? xhr.responseJSON.data.message
                        : i18n('settingsErrorText', 'OpenRouter request failed.');
                    setOpenRouterStatus(message, 'error');
                })
                .always(function () {
                    button.prop('disabled', false).text(originalText);
                });
        });

        $(document).on('click', '#cwr-openrouter-test', function (event) {
            event.preventDefault();
            var button = $(this);
            var originalText = button.text();

            button.prop('disabled', true).text(i18n('testingText', 'Testing...'));
            setOpenRouterStatus(i18n('testingText', 'Testing...'), 'loading');

            $.post(ajaxUrl, $.extend({ action: 'cwr_openrouter_test' }, openRouterPayload()))
                .done(function (response) {
                    if (!response || !response.success || !response.data) {
                        setOpenRouterStatus(i18n('settingsErrorText', 'OpenRouter request failed.'), 'error');
                        return;
                    }
                    setOpenRouterStatus(response.data.message || 'Connection works.', 'success');
                })
                .fail(function (xhr) {
                    var message = xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message
                        ? xhr.responseJSON.data.message
                        : i18n('settingsErrorText', 'OpenRouter request failed.');
                    setOpenRouterStatus(message, 'error');
                })
                .always(function () {
                    button.prop('disabled', false).text(originalText);
                });
        });

        // Source Pill switching in Global Settings
        $('.cwr-source-radio').on('change', function () {
            var radio = $(this);
            var section = radio.data('section');
            var val = radio.val();
            var box = radio.closest('.cwr-hf-box');

            box.find('.cwr-source-pill').removeClass('is-active');
            radio.closest('.cwr-source-pill').addClass('is-active');

            box.find('.cwr-hf-pane').hide();
            var targetPane = $('#cwr-' + section + '-pane-' + val);
            targetPane.show();

            if (val === 'custom') {
                refreshEditor('cwr_global_' + section);
            }

            var labels = {
                custom: 'Custom Code',
                elementor: 'Elementor Template',
                theme: section === 'footer' ? 'Existing Theme Footer' : 'Existing Theme Header',
                extracted: 'Live Landing Page'
            };
            box.find('.cwr-badge').text(labels[val] || val).removeClass('is-inactive').addClass('is-active');
        });

        // Item Editor Header/Footer controls
        $('#cwr_item_use_header').on('change', function () {
            $('#cwr-item-header-group').toggle(this.checked);
        });
        $('#cwr_item_use_footer').on('change', function () {
            $('#cwr-item-footer-group').toggle(this.checked);
        });

        $('.cwr-item-hf-select').on('change', function () {
            var select = $(this);
            var section = select.data('section');
            var val = select.val();
            $('#cwr-item-' + section + '-elementor-sub').toggle(val === 'elementor');
        });

        // 1-Click Import Existing Site Code to Global Custom Editor
        $(document).on('click', '.cwr-import-existing-btn', function (event) {
            event.preventDefault();
            var button = $(this);
            var section = button.data('section');
            var originalText = button.html();

            button.prop('disabled', true).text('Importing...');

            $.post(ajaxUrl, {
                action: 'cwr_get_existing_site_code',
                nonce: cfg.designNonce,
                section: section
            })
            .done(function (response) {
                if (response && response.success && response.data && response.data.html) {
                    setEditorContent('cwr_global_' + section, response.data.html);
                    button.html('<span class="dashicons dashicons-yes"></span> Imported!');
                    window.setTimeout(function () {
                        button.prop('disabled', false).html(originalText);
                    }, 2000);
                } else {
                    var msg = (response && response.data && response.data.message) ? response.data.message : 'Import failed.';
                    alert(msg);
                    button.prop('disabled', false).html(originalText);
                }
            })
            .fail(function () {
                alert('Request failed. Please try again.');
                button.prop('disabled', false).html(originalText);
            });
        });

        // 1-Click Import Elementor Template to Global Custom Editor
        $(document).on('click', '.cwr-import-elementor-btn', function (event) {
            event.preventDefault();
            var button = $(this);
            var section = button.data('section');
            var selectId = button.data('select');
            var templateId = $('#' + selectId).val();
            var originalText = button.html();

            if (!templateId || templateId === '0') {
                alert('Please select an Elementor template first from the "Elementor Template" option.');
                return;
            }

            button.prop('disabled', true).text('Importing...');

            $.post(ajaxUrl, {
                action: 'cwr_get_elementor_code',
                nonce: cfg.elementorNonce,
                template_id: templateId
            })
            .done(function (response) {
                if (response && response.success && response.data && response.data.html) {
                    setEditorContent('cwr_global_' + section, response.data.html);
                    button.html('<span class="dashicons dashicons-yes"></span> Imported!');
                    window.setTimeout(function () {
                        button.prop('disabled', false).html(originalText);
                    }, 2000);
                } else {
                    var msg = (response && response.data && response.data.message) ? response.data.message : 'Import failed.';
                    alert(msg);
                    button.prop('disabled', false).html(originalText);
                }
            })
            .fail(function () {
                alert('Request failed. Please try again.');
                button.prop('disabled', false).html(originalText);
            });
        });

        // Set as Global Header / Footer on Design Code Page
        $(document).on('click', '.cwr-set-global-btn', function (event) {
            event.preventDefault();
            var button = $(this);
            var section = button.data('section');
            var originalText = button.html();

            button.prop('disabled', true).text('Saving...');

            $.post(ajaxUrl, {
                action: 'cwr_set_design_global',
                nonce: cfg.designNonce,
                section: section
            })
            .done(function (response) {
                if (response && response.success) {
                    button.html('<span class="dashicons dashicons-yes"></span> Global Code Set!');
                    window.setTimeout(function () {
                        button.prop('disabled', false).html(originalText);
                    }, 2500);
                } else {
                    var msg = (response && response.data && response.data.message) ? response.data.message : 'Failed to set global code.';
                    alert(msg);
                    button.prop('disabled', false).html(originalText);
                }
            })
            .fail(function () {
                alert('Request failed. Please try again.');
                button.prop('disabled', false).html(originalText);
            });
        });

        // History Diff Toggle
        $(document).on('click', '.cwr-history-toggle-diff', function (event) {
            event.preventDefault();
            var button = $(this);
            var targetId = button.data('target');
            var diffView = $('#' + targetId);

            if (diffView.is(':visible')) {
                diffView.slideUp(180);
                button.html('<span class="dashicons dashicons-visibility"></span> ' + (cfg.viewChangesText || 'View Changes'));
            } else {
                diffView.slideDown(200);
                button.html('<span class="dashicons dashicons-hidden"></span> ' + (cfg.hideChangesText || 'Hide Changes'));
            }
        });

        // Import Drag & Drop & File Selection
        var dropzone = $('#cwr-dropzone');
        var fileInput = $('#cwr_import_file');
        var filenameDisplay = $('#cwr-selected-filename');

        if (fileInput.length && dropzone.length) {
            fileInput.on('change', function () {
                if (this.files && this.files.length) {
                    var file = this.files[0];
                    filenameDisplay.text(file.name + ' (' + Math.round(file.size / 1024) + ' KB)');
                } else {
                    filenameDisplay.text('');
                }
            });

            dropzone.on('dragover dragenter', function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.addClass('is-dragover');
            });

            dropzone.on('dragleave drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.removeClass('is-dragover');
            });

            dropzone.on('drop', function (e) {
                var dt = e.originalEvent.dataTransfer;
                if (dt && dt.files && dt.files.length) {
                    fileInput[0].files = dt.files;
                    fileInput.trigger('change');
                }
            });
        }

    });
})(window.jQuery);

