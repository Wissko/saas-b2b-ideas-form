const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_TO = 'Wissem.sghaier.ws@gmail.com';
const DEFAULT_FROM = 'SaaS B2B Ideas <onboarding@resend.dev>';

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const readBody = async (request) =>
  new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (body.length > 20_000) {
        reject(new Error('Payload too large'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    sendJson(response, 503, { ok: false, error: 'Email service is not configured' });
    return;
  }

  try {
    const body = JSON.parse(await readBody(request));
    const ideaOne = String(body.ideaOne || '').trim();
    const ideaTwo = String(body.ideaTwo || '').trim();
    const email = String(body.email || '').trim();
    const submittedAt = String(body.submittedAt || '').trim();
    const summary = String(body.summary || '').trim();
    const nextStep = String(body.nextStep || '').trim();
    const structuredMessage = String(body.structuredMessage || '').trim();

    if (ideaOne.length < 20 || ideaTwo.length < 20) {
      sendJson(response, 400, { ok: false, error: 'Both ideas are required' });
      return;
    }

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#14130f;max-width:720px">
        <h1 style="font-size:24px;margin:0 0 16px">Nouvelle soumission - Idées SaaS B2B</h1>
        <p><strong>Contact :</strong> ${escapeHtml(email || 'Non renseigné')}</p>
        <p><strong>Date :</strong> ${escapeHtml(submittedAt)}</p>
        <hr />
        <h2>Résumé automatique</h2>
        <p>${escapeHtml(summary)}</p>
        <h2>Idée SaaS B2B n°1</h2>
        <p>${escapeHtml(ideaOne)}</p>
        <h2>Idée SaaS B2B n°2</h2>
        <p>${escapeHtml(ideaTwo)}</p>
        <h2>Prochaine étape recommandée</h2>
        <p>${escapeHtml(nextStep)}</p>
        <hr />
        <h2>Message structuré complet</h2>
        <pre style="white-space:pre-wrap;background:#f6f1e8;padding:16px;border-radius:12px">${escapeHtml(structuredMessage)}</pre>
      </div>
    `;

    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [process.env.SUBMISSION_TO_EMAIL || DEFAULT_TO],
        reply_to: email || undefined,
        subject: 'Nouvelle soumission - Idées SaaS B2B',
        html,
        text: structuredMessage,
      }),
    });

    const resendPayload = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      sendJson(response, 502, { ok: false, error: 'Email provider rejected the message', details: resendPayload });
      return;
    }

    sendJson(response, 200, { ok: true, id: resendPayload.id });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message || 'Unexpected error' });
  }
};
