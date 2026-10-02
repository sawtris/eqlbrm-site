// Tiny Worker. It only runs for /api/* (see wrangler.jsonc). Every other URL is served from the static site.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESEND_API_KEY: string; // secret, set in the Cloudflare dashboard
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
  KIT_API_KEY?: string; // secret, set in the Cloudflare dashboard once Kit is set up
  KIT_FORM_ID?: string; // the Kit form new subscribers are added to
  SANITY_WEBHOOK_SECRET?: string; // secret, shared with the Sanity "new post" webhook
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

async function handleInquiry(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'The form data could not be read.' }, 400);
  }

  // Spam trap: bots fill in every field, people never see this one.
  if (clean(form.get('company'), 200)) return json({ ok: true, engagement: 'paid' });

  const firstName = oneLine(clean(form.get('first_name'), 100));
  const lastName = oneLine(clean(form.get('last_name'), 100));
  const email = clean(form.get('email'), 254);
  const message = clean(form.get('message'), 5000);
  const barter = clean(form.get('engagement'), 20) === 'barter';
  const tradeOffer = clean(form.get('trade_offer'), 3000);

  if (!firstName || !lastName || !message) {
    return json({ ok: false, error: 'Please fill in every field.' }, 400);
  }
  if (barter && !tradeOffer) {
    return json({ ok: false, error: 'Please tell us what you could offer in trade.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400);
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('Contact form is missing configuration (RESEND_API_KEY, CONTACT_TO_EMAIL, or CONTACT_FROM_EMAIL).');
    return json({ ok: false, error: 'The form is not set up yet.' }, 500);
  }

  const fullName = `${firstName} ${lastName}`;
  const kind = barter ? 'Services trade (barter)' : 'Paid engagement';
  const text =
    `New services inquiry from the EQLBRM website\n\nName: ${fullName}\nEmail: ${email}\nType: ${kind}\n\n` +
    `What they need:\n${message}\n` +
    (barter ? `\nWhat they could offer in trade:\n${tradeOffer}\n` : '');
  const html =
    `<p><strong>New services inquiry from the EQLBRM website</strong></p>` +
    `<p>Name: ${escapeHtml(fullName)}<br>Email: ${escapeHtml(email)}<br>Type: ${escapeHtml(kind)}</p>` +
    `<p><strong>What they need</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>` +
    (barter
      ? `<p><strong>What they could offer in trade</strong></p><p style="white-space:pre-wrap">${escapeHtml(tradeOffer)}</p>`
      : '');

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `${barter ? 'Services trade' : 'Services'} inquiry from ${fullName}`,
        text,
        html,
      }),
    });
  } catch (error) {
    console.error('Could not reach Resend', error);
    return json({ ok: false, error: 'The inquiry did not send.' }, 502);
  }

  if (!response.ok) {
    console.error('Resend rejected the inquiry', response.status, await response.text());
    return json({ ok: false, error: 'The inquiry did not send.' }, 502);
  }

  return json({ ok: true, engagement: barter ? 'barter' : 'paid' });
}

// Newsletter sign-up. Adds the email to a Kit form. Until Kit is connected (no KIT_API_KEY / KIT_FORM_ID),
// each sign-up is emailed to CONTACT_TO_EMAIL instead, so nobody who subscribes is lost.
async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'The form data could not be read.' }, 400);
  }

  // Spam trap: bots fill in every field, people never see this one.
  if (clean(form.get('company'), 200)) return json({ ok: true });

  const email = clean(form.get('email'), 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400);
  }
  const referrer = clean(request.headers.get('referer'), 500);

  if (env.KIT_API_KEY && env.KIT_FORM_ID) {
    const headers = { 'X-Kit-Api-Key': env.KIT_API_KEY, 'content-type': 'application/json', accept: 'application/json' };
    try {
      // Kit requires the subscriber to exist before it can be added to a form.
      const created = await fetch('https://api.kit.com/v4/subscribers', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email_address: email }),
      });
      if (!created.ok) {
        console.error('Kit rejected the subscriber', created.status, await created.text());
        return json({ ok: false, error: 'The sign-up did not go through.' }, 502);
      }
      const added = await fetch(`https://api.kit.com/v4/forms/${encodeURIComponent(env.KIT_FORM_ID)}/subscribers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email_address: email, ...(referrer ? { referrer } : {}) }),
      });
      if (!added.ok) {
        console.error('Kit could not add the subscriber to the form', added.status, await added.text());
        return json({ ok: false, error: 'The sign-up did not go through.' }, 502);
      }
      return json({ ok: true });
    } catch (error) {
      console.error('Could not reach Kit', error);
      return json({ ok: false, error: 'The sign-up did not go through.' }, 502);
    }
  }

  // Fallback until Kit is connected.
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    console.error('Subscribe form has neither Kit nor Resend configured.');
    return json({ ok: false, error: 'Sign-ups are not set up yet.' }, 500);
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        subject: `New newsletter sign-up: ${email}`,
        text: `New newsletter sign-up from the EQLBRM website\n\nEmail: ${email}\nPage: ${referrer || 'unknown'}\n\nAdd them to Kit once it is set up.\n`,
      }),
    });
    if (!response.ok) {
      console.error('Resend rejected the sign-up notice', response.status, await response.text());
      return json({ ok: false, error: 'The sign-up did not go through.' }, 502);
    }
  } catch (error) {
    console.error('Could not reach Resend', error);
    return json({ ok: false, error: 'The sign-up did not go through.' }, 502);
  }
  return json({ ok: true });
}

// ---------- New blog post -> Kit draft broadcast ----------
// Sanity calls this (signed webhook) when a post is first published. It creates a DRAFT broadcast in Kit
// (teaser + link) and emails a heads-up. Nothing is sent to subscribers until Tristan presses Send in Kit.

const SITE_URL = 'https://www.eqlbrm.io';

// Sanity signs webhooks as `t=<ms timestamp>,v1=<base64url HMAC-SHA256 of "<t>.<body>">`.
async function sanitySignatureIsValid(header: string | null, body: string, secret: string): Promise<boolean> {
  const match = header?.trim().match(/^t=(\d+)[, ]+v1=([^, ]+)$/);
  if (!match) return false;
  const [, timestamp, received] = match;
  // Reject anything older than an hour (leaves room for Sanity's retries). A replay could only ever create a duplicate draft.
  if (Math.abs(Date.now() - Number(timestamp)) > 60 * 60 * 1000) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${body}`)));
  const expected = btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
}

interface NewPost {
  _id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  publishedAt?: string;
  coverUrl?: string;
  coverAlt?: string;
}

function broadcastHtml(post: Required<Pick<NewPost, 'title' | 'slug'>> & NewPost): string {
  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const image = post.coverUrl
    ? `<p><a href="${url}"><img src="${escapeHtml(post.coverUrl)}?w=1200&amp;fit=max&amp;auto=format" alt="${escapeHtml(post.coverAlt ?? '')}" width="600" style="max-width:100%;height:auto;border-radius:10px" /></a></p>`
    : '';
  return (
    image +
    `<h1>${escapeHtml(post.title)}</h1>` +
    (post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : '') +
    `<p><a href="${url}" style="display:inline-block;padding:12px 22px;background:#0B132B;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600">Read the post</a></p>` +
    `<p>Grow with balance.<br>Tristan</p>`
  );
}

async function handleNewPost(request: Request, env: Env): Promise<Response> {
  if (!env.SANITY_WEBHOOK_SECRET) return json({ ok: false, error: 'Not configured.' }, 500);
  const body = await request.text();
  if (!(await sanitySignatureIsValid(request.headers.get('sanity-webhook-signature'), body, env.SANITY_WEBHOOK_SECRET))) {
    return json({ ok: false, error: 'Invalid signature.' }, 401);
  }

  let post: NewPost;
  try {
    post = JSON.parse(body);
  } catch {
    return json({ ok: false, error: 'Body is not JSON.' }, 400);
  }
  // Ignore drafts and incomplete posts. Returning 200 stops Sanity retrying them.
  if (!post.title || !post.slug || post._id?.startsWith('drafts.')) return json({ ok: true, skipped: true });
  if (!env.KIT_API_KEY) return json({ ok: false, error: 'Kit is not connected.' }, 500);

  const kit = await fetch('https://api.kit.com/v4/broadcasts', {
    method: 'POST',
    headers: { 'X-Kit-Api-Key': env.KIT_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      subject: post.title,
      preview_text: (post.excerpt ?? '').slice(0, 150),
      description: `Blog: ${post.title}`,
      content: broadcastHtml({ ...post, title: post.title, slug: post.slug }),
      public: false,
      send_at: null, // draft: nothing goes out until it is sent from Kit
    }),
  });
  if (!kit.ok) {
    // A non-2xx makes Sanity retry later, which is what we want if Kit is briefly down.
    console.error('Kit rejected the broadcast draft', kit.status, await kit.text());
    return json({ ok: false, error: 'Kit rejected the draft.' }, 502);
  }

  // Heads-up email. Best effort: the draft already exists, so a failure here is only logged.
  if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) {
    const future = post.publishedAt && Date.parse(post.publishedAt) > Date.now();
    const text =
      `A draft newsletter for your new post is ready in Kit.\n\n` +
      `Post: ${post.title}\nLink: ${SITE_URL}/blog/${post.slug}\n\n` +
      (future ? `Heads up: this post is scheduled for ${post.publishedAt}. Wait until it is live before sending.\n\n` : '') +
      `Open Kit, go to Broadcasts, check the draft and press Send when you're happy.\n`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        subject: `Newsletter draft ready: ${oneLine(post.title)}`,
        text,
      }),
    }).catch((error) => console.error('Could not send the draft heads-up', error));
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

    if (url.pathname === '/api/inquiry') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'POST' });
      return handleInquiry(request, env);
    }

    if (url.pathname === '/api/subscribe') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'POST' });
      return handleSubscribe(request, env);
    }

    if (url.pathname === '/api/hooks/new-post') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'POST' });
      return handleNewPost(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
