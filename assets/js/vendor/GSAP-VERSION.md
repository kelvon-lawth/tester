# Vendored GSAP

- Package: `gsap@3.15.0` from the npm registry
- Tarball shasum (sha1): `7851baaffc77642f2db3b1749d3634f9b5a19d14` (equals `npm view gsap@3.15.0 dist.shasum`)
- Source path inside the tarball: `package/dist/`
- Files copied byte for byte: `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`
- Vendored on: 2026-10-13 (quick task 261013-ffc)

Loaded as classic `<script defer>` tags in `index.html` (order: gsap, ScrollTrigger, SplitText, then `js/main.js`). They work over `file://`. `contact.html` does not load them.

## Licence

Each file carries the header `/*! ... @license Copyright 2026, GreenSock. All rights reserved. Subject to the terms at https://gsap.com/standard-license */`.

The package.json licence string is: `Standard 'no charge' license: https://gsap.com/standard-license.`

The package README ("GSAP is FREE!") says: "the entire GSAP toolset is FREE, even for commercial use!" and names SplitText among the plugins that are included.

Re-check https://gsap.com/standard-license before launch.
