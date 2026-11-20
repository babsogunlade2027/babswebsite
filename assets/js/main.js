/* ==========================================================================
   Hon. Babatunde Sunday Ogunlade (BABS) | Official Website
   assets/js/main.js
   Vanilla JavaScript: navigation, smooth scrolling, scroll effects,
   form validation and submission feedback.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Configuration
     FORM_ENDPOINT is a same-origin Cloudflare Pages Function
     (functions/api/contact.js), allowed by the CSP "connect-src 'self'".
     ---------------------------------------------------------------------- */
  var CONFIG = {
    FORM_ENDPOINT: '/api/contact',
    REQUEST_TIMEOUT_MS: 15000,
    SCROLL_HEADER_OFFSET: 20,
    BACK_TO_TOP_THRESHOLD: 500,
    SUBMIT_TEXT: 'Join Team Babs'
  };

  /* ----------------------------------------------------------------------
     Helpers
     ---------------------------------------------------------------------- */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ----------------------------------------------------------------------
     Elements
     ---------------------------------------------------------------------- */
  var header = $('#site-header');
  var menuToggle = $('#menu-toggle');
  var mobileMenu = $('#mobile-menu');
  var iconOpen = $('#icon-open');
  var iconClose = $('#icon-close');
  var backToTop = $('#back-to-top');

  /* ----------------------------------------------------------------------
     1. Footer year
     ---------------------------------------------------------------------- */
  var yearEl = $('#year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ----------------------------------------------------------------------
     2. Mobile navigation
     ---------------------------------------------------------------------- */
  function isMenuOpen() {
    return menuToggle && menuToggle.getAttribute('aria-expanded') === 'true';
  }

  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;

    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('hidden', !open);

    if (iconOpen) iconOpen.classList.toggle('hidden', open);
    if (iconClose) iconClose.classList.toggle('hidden', !open);

    if (header) header.classList.toggle('menu-open', open);
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      setMenu(!isMenuOpen());
    });

    // Close when a mobile link is chosen
    $all('.mobile-link', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });

    // Close on Escape and return focus to the toggle
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isMenuOpen()) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    // Close when clicking outside the header
    document.addEventListener('click', function (event) {
      if (isMenuOpen() && header && !header.contains(event.target)) {
        setMenu(false);
      }
    });

    // Reset when resizing up to desktop width
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && isMenuOpen()) {
        setMenu(false);
      }
    });
  }

  /* ----------------------------------------------------------------------
     3. Smooth scrolling for in-page links (with fixed-header offset)
     ---------------------------------------------------------------------- */
  function scrollToTarget(target) {
    var headerHeight = header ? header.offsetHeight : 0;
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + CONFIG.SCROLL_HEADER_OFFSET;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  $all('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      var target = null;
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch (e) {
        target = null;
      }
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);

      // Keep the URL hash in sync and move keyboard focus to the section
      if (history.pushState) {
        history.pushState(null, '', hash);
      }
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------------------------------------
     4. Header state, back-to-top button
     ---------------------------------------------------------------------- */
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    if (header) {
      header.classList.toggle('scrolled', y > 10);
    }
    if (backToTop) {
      backToTop.classList.toggle('show', y > CONFIG.BACK_TO_TOP_THRESHOLD);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------------------
     5. Scroll spy: highlight the nav link for the section in view
     ---------------------------------------------------------------------- */
  var navLinks = $all('.nav-link[href^="#"]');
  var sectionIds = ['home', 'about', 'vision', 'news', 'volunteer', 'contact'];

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

    sectionIds.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
     6. Scroll-reveal animations
     ---------------------------------------------------------------------- */
  var revealEls = $all('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion()) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ----------------------------------------------------------------------
     7. Join Team Babs form
     ---------------------------------------------------------------------- */
  var form = $('#volunteer-form');
  var statusBox = $('#form-status');
  var submitBtn = $('#submit-btn');
  var submitLabel = $('#submit-label');
  var messageField = $('#message');
  var messageCount = $('#message-count');

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_PATTERN = /^[+()\d][\d\s().-]{6,19}$/;

  // Each validator returns an error string, or '' when the field is valid.
  var validators = {
    fullname: function (field) {
      var value = field.value.trim();
      if (!value) return 'Please enter your full name.';
      if (value.length < 2) return 'Your name must be at least 2 characters.';
      return '';
    },
    ward: function (field) {
      var value = field.value.trim();
      if (!value) return 'Please tell us your ward or location in Ibarapa East.';
      if (value.length < 2) return 'Please enter at least 2 characters.';
      return '';
    },
    phone: function (field) {
      var value = field.value.trim();
      if (!value) return 'Please enter your phone or WhatsApp number.';
      if (!PHONE_PATTERN.test(value)) return 'Please enter a valid phone number.';
      return '';
    },
    email: function (field) {
      var value = field.value.trim();
      if (!value) return ''; // optional
      if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email address.';
      return '';
    },
    interest: function (field) {
      if (!field.value) return 'Please choose an area of interest.';
      return '';
    },
    message: function (field) {
      if (field.value.trim().length > 1000) return 'Your message must be 1000 characters or fewer.';
      return ''; // optional
    },
    consent: function (field) {
      if (!field.checked) return 'Please tick this box so we can contact you.';
      return '';
    }
  };

  function getErrorEl(name) {
    return form ? $('[data-error-for="' + name + '"]', form) : null;
  }

  function showFieldState(field, message) {
    var errorEl = getErrorEl(field.name);

    if (errorEl) {
      errorEl.textContent = message;
    }

    if (message) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
      var hasValue = field.type === 'checkbox' ? field.checked : field.value.trim() !== '';
      field.classList.toggle('is-valid', hasValue && field.type !== 'checkbox');
    }
  }

  function validateField(field) {
    var validator = validators[field.name];
    if (!validator) return true;
    var message = validator(field);
    showFieldState(field, message);
    return message === '';
  }

  function hideStatus() {
    if (!statusBox) return;
    statusBox.classList.add('hidden');
    statusBox.classList.remove('success', 'error');
    statusBox.textContent = '';
  }

  function showStatus(type, message) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.classList.remove('hidden', 'success', 'error');
    statusBox.classList.add(type);
    statusBox.focus({ preventScroll: true });
    var top = statusBox.getBoundingClientRect().top;
    if (top < (header ? header.offsetHeight : 0) + 10 || top > window.innerHeight - 100) {
      scrollToTarget(statusBox);
    }
  }

  function setLoading(isLoading) {
    if (!submitBtn || !submitLabel) return;
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitLabel.textContent = isLoading ? 'Sending' : CONFIG.SUBMIT_TEXT;
  }

  function updateMessageCount() {
    if (!messageField || !messageCount) return;
    var length = messageField.value.length;
    messageCount.textContent = length + ' / 1000';
    messageCount.style.color = length >= 950 ? '#dc2626' : '';
  }

  function resetFormState() {
    form.reset();
    $all('.form-input, input[type="checkbox"]', form).forEach(function (field) {
      field.classList.remove('is-invalid', 'is-valid');
      field.removeAttribute('aria-invalid');
      delete field.dataset.touched;
    });
    $all('.field-error', form).forEach(function (el) {
      el.textContent = '';
    });
    updateMessageCount();
  }

  function buildPayload() {
    return {
      fullname: form.fullname.value.trim(),
      ward: form.ward.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      interest: form.interest.value,
      message: form.message.value.trim(),
      consent: form.consent.checked,
      page: window.location.href,
      submittedAt: new Date().toISOString()
    };
  }

  function sendForm(payload) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller
      ? window.setTimeout(function () { controller.abort(); }, CONFIG.REQUEST_TIMEOUT_MS)
      : null;

    return fetch(CONFIG.FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      if (timer) window.clearTimeout(timer);
      if (!response.ok) {
        throw new Error('Request failed with status ' + response.status);
      }
      return response;
    }, function (error) {
      if (timer) window.clearTimeout(timer);
      throw error;
    });
  }

  if (form) {
    var fields = $all('.form-input, input[type="checkbox"]', form).filter(function (field) {
      return field.name && field.name !== 'website';
    });

    // Live feedback: validate on blur, then on every change once touched
    fields.forEach(function (field) {
      var eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'blur';

      field.addEventListener(eventName, function () {
        field.dataset.touched = 'true';
        validateField(field);
      });

      field.addEventListener('input', function () {
        if (field.dataset.touched === 'true' || field.classList.contains('is-invalid')) {
          validateField(field);
        }
      });
    });

    if (messageField) {
      messageField.addEventListener('input', updateMessageCount);
      updateMessageCount();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      hideStatus();

      // Validate every field and focus the first invalid one
      var firstInvalid = null;
      fields.forEach(function (field) {
        field.dataset.touched = 'true';
        if (!validateField(field) && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        showStatus('error', 'Please fix the highlighted fields and try again.');
        firstInvalid.focus();
        return;
      }

      // Honeypot: bots fill the hidden field. Pretend success and stop.
      var honeypot = form.elements['website'];
      if (honeypot && honeypot.value) {
        showStatus('success', 'Welcome to Team Babs! Your details have been received.');
        resetFormState();
        return;
      }

      var firstName = form.fullname.value.trim().split(/\s+/)[0];
      setLoading(true);

      sendForm(buildPayload())
        .then(function () {
          showStatus(
            'success',
            'Welcome to Team Babs, ' + firstName + '! Your details have been received and the campaign team will reach out to you soon.'
          );
          resetFormState();
        })
        .catch(function () {
          showStatus(
            'error',
            'Sorry, we could not send your details right now. Please check your connection and try again in a moment.'
          );
        })
        .then(function () {
          setLoading(false);
        });
    });
  }
})();
