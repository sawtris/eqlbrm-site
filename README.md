# eqlbrm.io

Astro site (static) with a Sanity blog and a small Cloudflare Worker for the contact form, styled to the EQLBRM brand guidelines (v7).

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
- Replace the traced logo paths with your designer's SVG masters (see Brand below).

## Brand

- **Colors:** Midnight Navy `#0B132B`, Electric Teal `#00C2D1`, Bright Aqua `#2EE6D6`, Vivid Green `#31D16C`, Soft White `#F7F9FA`. Teal, aqua and green fail contrast for text on white, so text on light backgrounds uses navy, or Deep Teal `#007C89`. All tokens live at the top of `src/styles/global.css`.
- **Type:** Inter, using its optical-size axis so large headings get the tighter Display cut.
- **Logo:** `src/components/Logo.astro` draws the symbol, wordmark and lockup from `src/lib/logoPaths.ts`. Those paths were traced from the 600px PNGs in the brand book, so they are a stand-in. Ready-made copies are in `public/brand/`. When you have the designer's SVG masters, replace the paths (or the component) and the `public/brand/` files.
- **Motion:** the two halves of the symbol arrive and lock together on the home page. It is switched off for visitors who prefer reduced motion.
