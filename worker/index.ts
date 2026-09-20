// Tiny Worker. It only runs for /api/* (see wrangler.jsonc). Every other URL is served from the static site.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESEND_API_KEY: string; // secret, set in the Cloudflare dashboard
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

const json = (body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const clean = (value: FormDataEntryValue | null, max: number) =>
  typeof value === 'string' ? value.replace(/\r/g, '').trim().slice(0, max) : '';

const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

async function handleContact(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'The form data could not be read.' }, 400);
  }

  // Spam trap: bots fill in every field, people never see this one.
  if (clean(form.get('company'), 200)) return json({ ok: true });

  const firstName = oneLine(clean(form.get('first_name'), 100));
  const lastName = oneLine(clean(form.get('last_name'), 100));
  const email = clean(form.get('email'), 254);
  const message = clean(form.get('message'), 5000);

  if (!firstName || !lastName || !message) {
    return json({ ok: false, error: 'Please fill in every field.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400);
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('Contact form is missing configuration (RESEND_API_KEY, CONTACT_TO_EMAIL, or CONTACT_FROM_EMAIL).');
    return json({ ok: false, error: 'The form is not set up yet.' }, 500);
  }

  const fullName = `${firstName} ${lastName}`;
  const text = `New message from the EQLBRM website\n\nName: ${fullName}\nEmail: ${email}\n\n${message}\n`;
  const html =
    `<p><strong>New message from the EQLBRM website</strong></p>` +
    `<p>Name: ${escapeHtml(fullName)}<br>Email: ${escapeHtml(email)}</p>` +
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `Website inquiry from ${fullName}`,
        text,
        html,
      }),
    });
  } catch (error) {
    console.error('Could not reach Resend', error);
    return json({ ok: false, error: 'The message did not send.' }, 502);
  }

  if (!response.ok) {
    console.error('Resend rejected the message', response.status, await response.text());
    return json({ ok: false, error: 'The message did not send.' }, 502);
  }

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'POST' });
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
