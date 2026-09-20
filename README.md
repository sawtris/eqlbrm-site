# eqlbrm.io

Astro site (static) with a Sanity blog and a small Cloudflare Worker for the contact form.

```
src/            pages, components, styles
src/config.ts   site facts (email, GTM ID, booking link, social links)
src/data.ts     services, stats, testimonial, client names
worker/         contact form handler (runs only for /api/*)
studio/         Sanity Studio (the blog editor)
public/         favicon, OG image, robots.txt, headers
```

## Add your own assets

- **Founder photo:** save as `public/images/tristan.jpg` (or .png / .webp). It appears in the About section automatically.
- **Client logos:** save as `public/logos/<name>.svg` (or .png / .webp) using these names: `razorfish`, `equinox`, `fhitting-room`, `pwc`, `aescape`. Each one replaces its text name automatically.
- **Booking button:** paste your Cal.com link into `bookingUrl` in `src/config.ts`.

## Run it locally (optional)

Needs Node 22.12 or newer.

```
npm install
npm run dev
```

No connection to Sanity? Build without it: `SKIP_SANITY=1 npm run build`.

## Deploy on Cloudflare (Workers with static assets)

1. Push this repo to GitHub.
2. Cloudflare dashboard, Workers & Pages, Create, import the repo.
3. Worker name must be `eqlbrm-site` (it matches `wrangler.jsonc`).
4. Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
5. Settings, Variables and Secrets, add a **secret** named `RESEND_API_KEY`.

If Sanity is unreachable during a build, the build fails on purpose. The live site stays as it was.

## Blog editor (Sanity Studio)

```
cd studio
npm install
npx sanity login
npx sanity deploy
```

The editor then lives at `https://eqlbrm.sanity.studio`.

## Auto-rebuild when you publish a post

1. Cloudflare: your Worker, Settings, Builds, Deploy Hooks, create one for the `main` branch. Copy the URL.
2. Sanity: sanity.io/manage, your project, API, Webhooks, create one.
   - URL: the deploy hook URL
   - Dataset: `production`
   - Trigger on: create, update, delete
   - Filter: `_type == "post"`
   - Method: POST

Treat the deploy hook URL like a password.

## Contact form email

The form posts to `/api/contact`, which sends the message through Resend to `CONTACT_TO_EMAIL`.

- Until the domain is verified in Resend, the sender in `wrangler.jsonc` is `onboarding@resend.dev`. It only delivers to the email you signed up to Resend with.
- After verifying eqlbrm.io in Resend, change `CONTACT_FROM_EMAIL` to `EQLBRM Website <website@eqlbrm.io>`.
- Spam protection is a hidden field only. If spam shows up, add Cloudflare Turnstile.

## Before launch

- Have someone review `src/pages/privacy.astro`. It is a plain-language starting point, not legal advice.
- Replace the placeholder blog intro line in `src/pages/blog.astro`.
- Swap the wordmark and `public/og-default.png` after the logo redesign.
