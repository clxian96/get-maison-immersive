# GET Maison Éternelle — V4 Four Emotional Worlds

Real-time scroll-controlled 3D client-review prototype, based on the V3 Next.js source. **This is a procedural concept demonstration, not finished production-quality 3D art.**

## Local preview (Mac)
1. Extract ZIP into a **new folder**. Do not overwrite/delete a folder while Terminal is inside it.
2. Open Terminal and use `cd ` followed by dragging the extracted `get-maison-immersive` folder into Terminal, then Enter.
3. Run `npm install` and `npm run dev`.
4. Visit http://localhost:3000.
5. Stop the server using Control+C.

If Terminal reports `EPERM: process.cwd`, run `cd ~` and then enter the current extracted project directory again.

## Worlds
- Intro: scroll-opening oxblood velvet curtain (reversible).
- Privacy: deep underwater space, floating procedural fabric, downward/drifting camera.
- Access: carved stone passage with scroll-opening bronze doors, forward push and lateral camera movement.
- Confidence: stylised **placeholder** ballet sculpture with scroll-scrubbed turn and orbiting camera. **Replace with a licensed rigged ballet performer/motion-capture animation before client-facing production use.**
- Recognition: antique optical rings in deep emerald with macro push-through and reframing.
- Ending: text-only brand conclusion; no CTAs or enquiry buttons.

## Important limitations
- All art is procedural placeholder artwork, particularly the dancer. It is not photorealistic.
- This ZIP was packaged from source. Browser performance and production build have not been independently verified in this environment (dependency installation timed out). Test before publishing.
- Current text follows the previously established V2 content transcription. Verify final wording against your source site before presenting.
- No music and no sound controls (requested no buttons).
- All large motion is mapped to scroll progress and reversible; subtle fabric oscillation is ambient.

## Production
Run `npm run typecheck` and `npm run build` before deploying. Push the project to GitHub and import to Vercel (Next.js preset). There are no server secrets or environment variables.

## Editing
- `components/Experience.tsx`: global camera choreography, chapter copy, scroll boundaries.
- `components/Worlds.tsx`: 3D worlds, curtain deformation, materials and palette.
- `app/globals.css`: typography, overlays, mobile styles.

This version preserves the client's direction: content from GET Maison V2, visual principles from the June 2026 Brand Foundation, Cartier as an interaction benchmark rather than visual asset source.


## V4.1 Opening curtain polish
- Closed curtain panels now dynamically cover the full screen width and height across desktop, ultrawide, and mobile ratios.
- More dense fabric folds and shaded normals; no opening in the centre until scroll.
- Curtain opening remains fully scroll-controlled and reversible.
- Other four worlds and their copy remain unchanged.

## V4.2 curtain polish
- Curtain panels meet edge-to-edge at the center at progress zero, with pleats spread over their full width.
- As the scroll advances the fabric is drawn outwards and compressed at the two outer wings; scroll back to close.
- Intro hero headline progressively scales (up to 2.05x) while the secondary text fades before the hero text.
- All four original worlds and content remain otherwise unchanged.

### Local run
Run `npm install` and `npm run dev` inside the extracted `get-maison-immersive` folder. If Terminal shows EPERM after replacing a folder, run `cd ~` and then `cd` into the new extracted folder.

### Verification note
The source package was checked for structure but a build could not be run in the authoring environment due to npm registry DNS failure (EAI_AGAIN). Please verify with `npm run typecheck` and `npm run build` locally before Vercel deployment.


## V4.3 — Title font update
All large chapter headings and GET Maison title/branding now use **Cormorant Garamond**, matching the font family provided for reference. Font CSS loads from Google Fonts at runtime; no font binaries are included in this archive. If the preview device is offline, serif fallback fonts render instead. The small navigational labels remain unchanged.

## V4.4 typography update
- **Titles / brand:** Cormorant Garamond.
- **Body / support / interface:** DM Sans.
- Fonts are loaded from Google Fonts and require an internet connection on first load; local fallbacks are provided. Font files uploaded for reference are **not** included or redistributed.
- No changes to scenes, scroll choreography or copy.
