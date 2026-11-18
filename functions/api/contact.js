/* ==========================================================================
   Hon. Babatunde Sunday Ogunlade (BABS) | Official Website
   functions/api/contact.js
   Cloudflare Pages Function: POST /api/contact

   Required environment variables (Cloudflare Pages > Settings >
   Variables and Secrets):
     RESEND_API_KEY      (Secret)  API key from resend.com
     CONTACT_TO_EMAIL    (Text)    Inbox that receives the sign-ups
     CONTACT_FROM_EMAIL  (Text)    Verified sender, e.g.
                                   BABS Website <website@babatundeogunlade.com>
   ========================================================================== */

const MAX_BODY_BYTES = 10 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+()\d][\d\s().-]{6,19}$/;

const INTERESTS = {
  volunteer: 'Volunteer',
  media: 'Media & Publicity',
  logistics: 'Logistics',
  youth: 'Youth Mobilization',
  farming: 'Farming Sector Policy',
  other: 'Other'
};

/* ---------- Helpers ---------- */

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

// Single-line text: strips control characters (prevents header injection)
function cleanLine(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Multi-line text: keeps line breaks, strips other control characters
function cleanMultiline(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, '')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlEmail(data, interestLabel, receivedAt) {
  var row = function (label, value) {
    return (
      '<tr>' +
      '<td style="padding:10px 14px;font-weight:700;color:#0B1B3D;background:#f8fafc;border-bottom:1px solid #e2e8f0;width:150px;vertical-align:top;">' + label + '</td>' +
      '<td style="padding:10px 14px;color:#1F2421;border-bottom:1px solid #e2e8f0;">' + value + '</td>' +
      '</tr>'
    );
  };

  var emailCell = data.email
    ? '<a href="mailto:' + escapeHtml(data.email) + '" style="color:#0b5d34;">' + escapeHtml(data.email) + '</a>'
    : 'Not provided';

  var phoneCell = '<a href="tel:' + escapeHtml(data.phone.replace(/[^\d+]/g, '')) + '" style="color:#0b5d34;">' + escapeHtml(data.phone) + '</a>';

  return (
    '<div style="font-family:Montserrat,Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">' +
    '<div style="background:#0b5d34;padding:20px 24px;">' +
    '<h1 style="margin:0;font-size:20px;color:#f5b301;">New Team Babs sign-up</h1>' +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
    row('Name', escapeHtml(data.fullname)) +
    row('Ward / Location', escapeHtml(data.ward)) +
    row('Phone / WhatsApp', phoneCell) +
    row('Email', emailCell) +
    row('Area of interest', escapeHtml(interestLabel)) +
    row('Message', data.message ? escapeHtml(data.message).replace(/\n/g, '<br>') : 'Not provided') +
    row('Consent', 'Agreed to be contacted') +
    row('Received', escapeHtml(receivedAt)) +
    '</table>' +
    '<p style="margin:0;padding:14px 24px;font-size:12px;color:#64748b;background:#f8fafc;">' +
    (data.email ? 'Reply directly to this email to respond to the sender.' : 'No email was provided. Contact the sender by phone or WhatsApp.') +
    '</p>' +
    '</div>'
  );
}

function buildTextEmail(data, interestLabel, receivedAt) {
  return [
    'New Team Babs sign-up',
    '',
    'Name: ' + data.fullname,
    'Ward / Location: ' + data.ward,
    'Phone / WhatsApp: ' + data.phone,
    'Email: ' + (data.email || 'Not provided'),
    'Area of interest: ' + interestLabel,
    'Received: ' + receivedAt,
    '',
    'Message:',
    data.message || 'Not provided',
    '',
    'Consent: Agreed to be contacted'
  ].join('\n');
}

/* ---------- POST /api/contact ---------- */

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env;

  try {
    // 1. Same-origin check: only accept submissions from this site
    var origin = request.headers.get('Origin');
    var siteOrigin = new URL(request.url).origin;
    if (!origin || origin !== siteOrigin) {
      return jsonResponse({ ok: false, error: 'Forbidden.' }, 403);
    }

    // 2. Content type and size limits
    var contentType = request.headers.get('Content-Type') || '';
    if (contentType.indexOf('application/json') === -1) {
      return jsonResponse({ ok: false, error: 'Unsupported content type.' }, 415);
    }

    var raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false, error: 'Request too large.' }, 413);
    }

    // 3. Parse JSON
    var body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      return jsonResponse({ ok: false, error: 'Invalid request.' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ ok: false, error: 'Invalid request.' }, 400);
    }

    // 4. Sanitise
    var data = {
      fullname: cleanLine(body.fullname, 100),
      ward: cleanLine(body.ward, 100),
      phone: cleanLine(body.phone, 20),
      email: cleanLine(body.email, 254),
      interest: cleanLine(body.interest, 30),
      message: cleanMultiline(body.message, 1000),
      consent: body.consent === true
    };

    // 5. Validate (mirrors the checks in main.js)
    var errors = {};
    if (data.fullname.length < 2) errors.fullname = 'Please enter your full name.';
    if (data.ward.length < 2) errors.ward = 'Please enter your ward or location.';
    if (!PHONE_PATTERN.test(data.phone)) errors.phone = 'Please enter a valid phone number.';
    if (data.email && !EMAIL_PATTERN.test(data.email)) errors.email = 'Please enter a valid email address.';
    if (!Object.prototype.hasOwnProperty.call(INTERESTS, data.interest)) errors.interest = 'Please choose an option.';
    if (!data.consent) errors.consent = 'Consent is required.';

    if (Object.keys(errors).length > 0) {
      return jsonResponse({ ok: false, error: 'Validation failed.', fields: errors }, 422);
    }

    // 6. Check server configuration
    if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
      console.error('Contact form is missing RESEND_API_KEY, CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL.');
      return jsonResponse({ ok: false, error: 'The contact service is not configured.' }, 500);
    }

    // 7. Send the email through Resend
    var interestLabel = INTERESTS[data.interest];
    var receivedAt = new Date().toUTCString();

    var emailPayload = {
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      subject: 'Team Babs sign-up: ' + data.fullname + ' (' + interestLabel + ')',
      html: buildHtmlEmail(data, interestLabel, receivedAt),
      text: buildTextEmail(data, interestLabel, receivedAt)
    };
    if (data.email) {
      emailPayload.reply_to = data.email;
    }

    var emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload),
      signal: AbortSignal.timeout(10000)
    });

    if (!emailResponse.ok) {
      var detail = await emailResponse.text();
      console.error('Resend error ' + emailResponse.status + ': ' + detail);
      return jsonResponse({ ok: false, error: 'Could not deliver your message.' }, 502);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('Contact function error:', error && error.message ? error.message : error);
    return jsonResponse({ ok: false, error: 'Something went wrong.' }, 500);
  }
}

/* ---------- Any other method ---------- */

export async function onRequest() {
  var response = jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
  response.headers.set('Allow', 'POST');
  return response;
}
