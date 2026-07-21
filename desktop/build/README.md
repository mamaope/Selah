# App icon

`icon.png` here is a **placeholder** (a generated emerald "S"). Replace it with your
real logo and every build picks it up automatically — no other change needed.

Requirements electron-builder is happy with:
- **PNG, at least 512×512** (1024×1024 is ideal). Square. Transparent background is fine.
- Just overwrite `build/icon.png`. electron-builder converts it to the Windows `.ico`,
  the macOS `.icns` and the Linux png sizes for you.

Drop your file in, then `npm run dist` (or push a tag to build all three OSes via CI).
