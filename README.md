# Palate

Honest restaurant reviews for Dhaka, and the Palate Guide.

Palate is a phone-first web app (installable like an app) with a review feed, an area map, Beli-style comparison scoring, a Bangla/English switch, and the Palate Guide (1–3 plates).

## How it runs

- **Demo mode:** while `config.js` is empty, the app runs entirely in the browser with sample restaurants and reviews. Nothing is saved to a server.
- **Live mode:** once `config.js` has your Supabase details, the app uses a real database, email sign-in and photo storage.

## Going live (one-time setup)

1. Create a free account at [supabase.com](https://supabase.com) and a new project named `palate` in the **Singapore** region.
2. In the project, open **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and press **Run**.
3. Open **Authentication → URL Configuration** and set **Site URL** to the app's address (for GitHub Pages: `https://numayrhabib.github.io/palate/`). Add the same address under **Redirect URLs**.
4. Open **Project Settings → API**, copy the **Project URL** and the **anon public** key into `config.js`. Never put the `service_role` key in this repo.

Supabase's built-in email sender only sends a few sign-in emails per hour. That's fine for testing; before launch, connect a free email provider (for example Resend) under **Authentication → SMTP Settings**.

## Hosting

The app is plain HTML, CSS and JavaScript with no build step. GitHub Pages serves it straight from the `main` branch (**Settings → Pages → Deploy from a branch → main / root**).

## Admin tasks (in the Supabase table editor)

- **Credibility badge:** set `profiles.trusted = true` for reviewers you trust.
- **Palate Guide awards:** set `restaurants.plates` to 1, 2 or 3.

Regular users can't change either of these; the database rules in `schema.sql` block it.

## Files

| File | What it does |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | Dark red and gold design |
| `app.js` | Screens and interactions |
| `data.js` | Talks to Supabase, or runs the demo |
| `i18n.js` | English and Bangla text |
| `config.js` | Your Supabase project details |
| `sw.js` | Lets the app install and open offline |
| `supabase/schema.sql` | Database tables and security rules |
