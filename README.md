# VCR Recordings

Static VCR Recordings site — the upgraded Apple Store–style catalog **as of 2026-07-21**, immediately before the 360° store became the homepage (`534884b`).

Restored from commit `42941a1` (parent of “Make 360 store the homepage; keep existing site at /shop”).

## Develop

```bash
npx serve .
```

## Deploy

Vercel static hosting (`framework: null`, `outputDirectory: "."`). Root `index.html` is the homepage.
