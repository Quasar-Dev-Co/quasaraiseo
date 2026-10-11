/* QuasarAISEO FAQ Frontend JavaScript
 * Accordion expand/collapse behavior for the FAQ section.
 */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var sections = document.querySelectorAll('.quasar-faq-section');
		if (!sections.length) {
			return;
		}

		sections.forEach(function (section) {
			var questions = section.querySelectorAll('.quasar-faq-question');

			questions.forEach(function (q) {
				q.addEventListener('click', function () {
					toggleItem(q.parentElement);
				});

				// Keyboard support (Enter / Space).
				q.addEventListener('keydown', function (e) {
					if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
						e.preventDefault();
						toggleItem(q.parentElement);
					}
				});
			});
		});

		function toggleItem(item) {
			var answer = item.querySelector('.quasar-faq-answer');
			var question = item.querySelector('.quasar-faq-question');
			var isActive = item.classList.contains('quasar-faq-active');

			if (isActive) {
				// Collapse.
				item.classList.remove('quasar-faq-active');
				question.setAttribute('aria-expanded', 'false');
				slideUp(answer);
			} else {
				// Expand.
				item.classList.add('quasar-faq-active');
				question.setAttribute('aria-expanded', 'true');
				slideDown(answer);
			}
		}

		// Smooth slide animations without jQuery.
		function slideDown(el) {
			el.style.display = 'block';
			el.style.height = '0';
			el.style.overflow = 'hidden';
			el.style.transition = 'height 0.25s ease';
			var targetHeight = el.scrollHeight;
			el.style.height = targetHeight + 'px';
			setTimeout(function () {
				el.style.height = '';
				el.style.overflow = '';
				el.style.transition = '';
			}, 260);
		}

		function slideUp(el) {
			el.style.height = el.scrollHeight + 'px';
			el.style.overflow = 'hidden';
			el.style.transition = 'height 0.25s ease';
			// Force reflow.
			el.offsetHeight;
			el.style.height = '0';
			setTimeout(function () {
				el.style.display = 'none';
				el.style.height = '';
				el.style.overflow = '';
				el.style.transition = '';
			}, 260);
		}
	});
})();
