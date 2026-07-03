# Paradise Valley Garden & Nursery

A modern, fully responsive website for Paradise Valley Garden & Nursery in Dominica — built with [Astro](https://astro.build).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) to preview locally.

## Build

```bash
npm run build
npm run preview
```

Production output goes to `dist/` and deploys automatically via Netlify.

## Project Structure

```
├── public/
│   ├── images/          # Static images (logo, photos)
│   └── scripts/         # Client-side JavaScript
├── src/
│   ├── components/      # Reusable UI sections
│   ├── data/
│   │   └── site.json    # All site content in one place
│   ├── layouts/
│   │   ├── BaseLayout.astro   # HTML shell, SEO, schema markup
│   │   └── PageLayout.astro   # Nav + main + Footer wrapper
│   ├── pages/
│   │   ├── index.astro        # Home
│   │   ├── about.astro        # About Us
│   │   ├── services.astro     # Services
│   │   ├── events.astro       # Events
│   │   ├── gallery.astro      # Photo gallery
│   │   └── visit.astro        # Plan your visit / contact
│   └── styles/
│       └── global.css
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, stats, previews |
| `/about` | Full story, values, heritage |
| `/services` | All 6 services with details |
| `/events` | Jazz & Arts and future events |
| `/gallery` | Filterable photo gallery |
| `/visit` | Hours, map, contact, directions |

## Updating Content

Edit `src/data/site.json` to update services, events, hours, contact info, and navigation — no HTML changes needed.

## Deployment

Configured for [Netlify](https://www.netlify.com). Push to your connected repo and Netlify runs `npm run build` automatically.
