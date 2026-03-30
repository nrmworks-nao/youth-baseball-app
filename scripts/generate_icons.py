#!/usr/bin/env python3
"""Generate baseball app icons with 3D gradient design."""

import cairosvg
from PIL import Image
import io
import os

BASEBALL_SVG = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <!-- Light green background gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#a8e6a0"/>
      <stop offset="100%" stop-color="#7bc47a"/>
    </radialGradient>

    <!-- Baseball ball gradient for 3D effect -->
    <radialGradient id="ballGrad" cx="40%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#f5f0ea"/>
      <stop offset="100%" stop-color="#e0d8cc"/>
    </radialGradient>

    <!-- Shadow below the ball -->
    <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>

    <!-- Highlight on the ball -->
    <radialGradient id="highlight" cx="35%" cy="30%" r="30%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.8)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>

    <!-- Rounded square clip -->
    <clipPath id="roundedSquare">
      <rect x="0" y="0" width="512" height="512" rx="80" ry="80"/>
    </clipPath>
  </defs>

  <!-- Background rounded square -->
  <rect x="0" y="0" width="512" height="512" rx="80" ry="80" fill="url(#bgGrad)"/>

  <!-- Drop shadow ellipse -->
  <ellipse cx="268" cy="340" rx="120" ry="24" fill="url(#shadowGrad)"/>

  <!-- Baseball ball with 3D gradient -->
  <circle cx="256" cy="256" r="140" fill="url(#ballGrad)" stroke="#d4cbb8" stroke-width="2"/>

  <!-- Stitching - left curve -->
  <path d="M 195 138
           C 170 180, 165 220, 172 256
           C 178 292, 190 332, 210 374"
        fill="none" stroke="#cc2222" stroke-width="5.5" stroke-linecap="round"/>

  <!-- Stitching - right curve -->
  <path d="M 317 138
           C 342 180, 347 220, 340 256
           C 334 292, 322 332, 302 374"
        fill="none" stroke="#cc2222" stroke-width="5.5" stroke-linecap="round"/>

  <!-- Left stitch marks -->
  <line x1="188" y1="158" x2="203" y2="152" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="177" y1="188" x2="192" y2="185" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="170" y1="220" x2="186" y2="219" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="172" y1="252" x2="188" y2="253" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="177" y1="284" x2="193" y2="287" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="186" y1="316" x2="200" y2="321" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="198" y1="346" x2="211" y2="354" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Right stitch marks -->
  <line x1="324" y1="158" x2="309" y2="152" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="335" y1="188" x2="320" y2="185" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="342" y1="220" x2="326" y2="219" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="340" y1="252" x2="324" y2="253" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="335" y1="284" x2="319" y2="287" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="326" y1="316" x2="312" y2="321" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="314" y1="346" x2="301" y2="354" stroke="#cc2222" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Specular highlight -->
  <circle cx="220" cy="210" r="55" fill="url(#highlight)"/>
</svg>
'''

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    icons_dir = os.path.join(project_root, "public", "icons")
    os.makedirs(icons_dir, exist_ok=True)

    # Generate 512x512 PNG
    png_512 = cairosvg.svg2png(bytestring=BASEBALL_SVG.encode(), output_width=512, output_height=512)
    path_512 = os.path.join(icons_dir, "icon-512x512.png")
    with open(path_512, "wb") as f:
        f.write(png_512)
    print(f"Created {path_512}")

    # Generate 192x192 PNG
    png_192 = cairosvg.svg2png(bytestring=BASEBALL_SVG.encode(), output_width=192, output_height=192)
    path_192 = os.path.join(icons_dir, "icon-192x192.png")
    with open(path_192, "wb") as f:
        f.write(png_192)
    print(f"Created {path_192}")

    # Generate favicon.ico (multi-size: 16, 32, 48)
    sizes = [16, 32, 48]
    images = []
    for size in sizes:
        png_data = cairosvg.svg2png(bytestring=BASEBALL_SVG.encode(), output_width=size, output_height=size)
        img = Image.open(io.BytesIO(png_data))
        images.append(img)

    favicon_path = os.path.join(project_root, "src", "app", "favicon.ico")
    images[0].save(favicon_path, format="ICO", sizes=[(s, s) for s in sizes], append_images=images[1:])
    print(f"Created {favicon_path}")

if __name__ == "__main__":
    main()
