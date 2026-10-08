# GET Maison Éternelle — V4.6 Cinematic Passage Prototype

This prototype develops the existing V4.5 world scenes with three additional in-world spatial transition objects, more varied camera paths and a unified reversible scroll timeline. **The 3D objects and ballet figure are stylised placeholders, not photorealistic final assets.**

## Run locally

```bash
npm install
npm run dev
```

Open the Local URL displayed by Next.js, usually `http://localhost:3000`.

## Production build

```bash
npm run typecheck
npm run build
npm run start
```

## What changed in V4.6

- Scroll choreography has real dolly pushes, pull-backs, side tracking, camera orbits, and optical macro passages.
- Underwater silk aperture connects the ocean with the architectural space.
- Opening bronze leaves and an ornamental circular aperture frame the transition toward the ballet scene.
- An engraved ballet-to-optics ring carries the camera into Recognition.
- Text and font pairing are unchanged: Cormorant Garamond titles and DM Sans text, loaded from Google Fonts with system fallbacks.
- All 3D transition states respond to scroll position, allowing backward travel.
- No CTAs or enquiry elements are added.

## Notes

The stage dancer is a stylised procedural placeholder; premium human motion requires a properly licensed rigged character and animation. Prototype art colours are not final brand codes. The experience uses an external Google Fonts stylesheet; if offline, system fallbacks apply. This repository does not include font binaries.

## Deploy

Push project files (excluding `node_modules` and `.next`) to GitHub; import the repository into Vercel using Next.js framework preset. Deploy as a preview first to avoid changing the current client site until reviewed.
