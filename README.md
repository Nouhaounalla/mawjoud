# Mawjoud

Find a medicine by typing its name or scanning its barcode (code à barres), then see the nearest pharmacies that have it in stock.

**Stack:** Next.js (App Router) + Tailwind CSS, Supabase (Postgres + Auth), html5-qrcode, Leaflet + react-leaflet (OpenStreetMap), browser geolocation and Haversine distance.

The interface is in French. All comments in the code are in English.

## 1. Install

You need Node.js 18.18 or newer.

```bash
npm install
```

These are the packages the project uses (already listed in `package.json`, so `npm install` is enough). To rebuild the project from an empty Next.js app, you would run:

```bash
npm install @supabase/supabase-js html5-qrcode leaflet react-leaflet
npm install -D tailwindcss @tailwindcss/postcss postcss
```

## 2. Create the Supabase project

1. Create a free project at https://supabase.com.
2. Open **SQL Editor**, paste the content of `supabase/schema.sql`, and run it (tables, security rules, automatic timestamp).
3. Paste the content of `supabase/seed.sql` and run it (sample medicines, barcodes, pharmacies and stock).
4. Open **Project Settings -> API** and copy the project URL and the `anon` (public) key.

## 3. Environment variables

Copy the example file and fill it in:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Never put the `service_role` key in this file.

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## 5. Try it

- **Name search:** type `Doli` and pick *Doliprane*.
- **Barcode:** click *Scanner*. The seed contains fake barcodes starting with `6191234` (for example `6191234000011` = Doliprane). To test with a real box, scan it once, then link its number to a medicine:
  ```sql
  insert into barcodes (barcode, medication_id) values ('YOUR_NUMBER', 1);
  ```
- **Distance:** allow the location pop-up in your browser. The seed has pharmacies in Tunis and in Sousse, so the order depends on where you are.
- **Pharmacy page** (`/pharmacy`): create a user in Supabase (**Authentication -> Users -> Add user**, tick *Auto Confirm User*), or sign up from the page (by default Supabase sends a confirmation e-mail first). Then log in, choose a pharmacy, search a medicine and click *En stock*, *Stock faible* or *Rupture*.

### Testing the camera on your phone

Browsers only allow the camera on HTTPS pages (or `localhost`). Two easy options:

- Deploy to Vercel (free), which gives you HTTPS automatically. Add the two environment variables in the Vercel project settings.
- Or run `npm run dev:https` and open the HTTPS address on your phone (same Wi-Fi), accepting the certificate warning.

## Project structure

```
supabase/
  schema.sql                 tables, RLS policies, updated_at trigger
  seed.sql                   sample data (development only)
src/
  app/
    layout.js                page frame, header, Supabase config banner
    page.js                  home: search, scanner, results, map
    pharmacy/page.js         pharmacy area: login + stock management
    globals.css              brand colors (from the logo) and map pin styles
  components/
    BarcodeScanner.js        camera + html5-qrcode
    PharmacyMap.js           Leaflet map with markers
    PharmacyList.js          sorted list, "updated X ago", directions button
    StockManager.js          pharmacist screen to update statuses
    AuthForm.js              login / sign up
    StatusBadge.js, StatusButtons.js, Header.js
  lib/
    supabase.js              Supabase client
    geo.js                   Haversine, geolocation, time ago, directions URL
    status.js                labels and colors of in_stock / low / out
    useMedicationSearch.js   debounced name search (shared hook)
```

## Brand colors

Defined once in `src/app/globals.css` (`@theme`), sampled from the logo:

| Name | Hex | Use |
|---|---|---|
| `brand-600` | `#0a8a5b` | buttons, markers |
| `brand-900` | `#004032` | text |
| `brand-400` | `#35ad76` | accents |
| `brand-50` | `#effaf4` | page background |

## Before real use

- **Security rule:** the MVP policy lets any logged-in user edit any pharmacy's stock. Section 4 of `schema.sql` contains a ready-to-uncomment `pharmacy_staff` upgrade so each user can only edit their own pharmacy. Add an admin approval step before giving accounts to real pharmacies.
- **Data:** the medicines, dosages, barcodes and pharmacies in `seed.sql` are illustrative. Replace them with official data.
- **Maps:** the public OpenStreetMap tile server is fine for development and small projects. For heavier traffic, use a tile provider such as MapTiler or Stadia and change the `url` in `PharmacyMap.js`.
- **Freshness:** results show "Mis à jour il y a ..." and flag information older than 24 hours, because stale stock data is the main risk of this kind of app.
