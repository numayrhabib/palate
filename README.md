# Palate

Honest restaurant reviews for Dhaka, earned critics, and the Palate Guide.

| Folder | What it is |
| --- | --- |
| `mobile/` | The Palate app for Android (and later iPhone), built with React Native and Expo |
| `site/` | The download page and the admin dashboard (`site/admin/`) |
| `supabase/` | Database tables, security rules and demo data |
| `.github/workflows/` | Automatic builds: the Android APK and the website |

## How it gets built

Every push to `main`:

- **Android app** (`android.yml`) builds `palate.apk` and publishes it as a GitHub release. The download page always links to the latest one.
- **Website** (`site.yml`) publishes the download page, the admin dashboard and a browser preview of the app to GitHub Pages at <https://numayrhabib.github.io/palate/>.

## Database

1. `supabase/schema.sql` creates every table, view and security rule. **It deletes existing Palate tables first.**
2. `supabase/seed.sql` adds demo restaurants, people, reviews and episodes (all fictional, marked `is_demo`). Regenerate it with `python3 supabase/make_seed.py`.
3. `supabase/clear_demo.sql` removes all demo data before launch.

Rules the database enforces:

- Only admins can change someone's role (member, critic, admin), award Guide plates or Taka Pick, or mark a visit as verified.
- People can only edit or delete their own reviews.
- Receipt photos are private: only the uploader and admins can see them.
- `numayrhabib@gmail.com` becomes an admin automatically on sign-up.

## Product rules

- **Critics are earned, never bought.** Apply after 15 reviews, 10 with photos, 3 verified visits and 25 helpful votes. An admin approves.
- **Critic reviews count 3×** in the Palate score.
- **Palate Club** is a subscription for perks only. It never changes how much a review counts. The app currently uses a free test button; connect Google Play billing before launch.
- **Taka Pick** is for great food under ৳1,000 per person.
- **Restaurants can never pay for a rating, plates or Taka Pick.**

## Working on the app

```
cd mobile
npm install --legacy-peer-deps
npx expo start
```
