"""
Generate docwise app icon in all required sizes for macOS .icns
Design: Dark rounded square (#1A202C) with emerald accent "d" letterform
"""
from PIL import Image, ImageDraw, ImageFont
import os
import subprocess

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
ICONSET_DIR = os.path.join(OUTPUT_DIR, 'docwise.iconset')
os.makedirs(ICONSET_DIR, exist_ok=True)

# Brand colors
BG_COLOR = (26, 32, 44)       # #1A202C
ACCENT = (16, 185, 129)       # #10B981
WHITE = (255, 255, 255)
SUBTLE = (45, 55, 72)         # #2D3748

def draw_icon(size: int) -> Image.Image:
    """Draw the docwise icon at a given pixel size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    margin = int(size * 0.08)
    radius = int(size * 0.22)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=BG_COLOR,
    )

    # Subtle inner glow / border
    inner_m = margin + max(1, int(size * 0.015))
    inner_r = radius - max(1, int(size * 0.015))
    draw.rounded_rectangle(
        [inner_m, inner_m, size - inner_m, size - inner_m],
        radius=inner_r,
        outline=SUBTLE,
        width=max(1, int(size * 0.008)),
    )

    # Accent bar at the bottom
    bar_h = int(size * 0.045)
    bar_m = int(size * 0.22)
    bar_y = int(size * 0.78)
    bar_r = int(bar_h * 0.5)
    draw.rounded_rectangle(
        [bar_m, bar_y, size - bar_m, bar_y + bar_h],
        radius=bar_r,
        fill=ACCENT,
    )

    # "d" letter
    font_size = int(size * 0.52)
    try:
        # Try system fonts in order of preference
        for font_name in [
            '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
            '/Library/Fonts/SF-Pro-Display-Black.otf',
            '/System/Library/Fonts/SFNS.ttf',
        ]:
            if os.path.exists(font_name):
                font = ImageFont.truetype(font_name, font_size)
                break
        else:
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # Measure text
    bbox = draw.textbbox((0, 0), 'd', font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # Center the letter (slightly above center to account for accent bar)
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1] - int(size * 0.04)

    draw.text((tx, ty), 'd', fill=WHITE, font=font)

    # Small emerald dot (like a wisdom eye / accent)
    dot_r = int(size * 0.04)
    dot_x = int(size * 0.62)
    dot_y = int(size * 0.28)
    draw.ellipse(
        [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
        fill=ACCENT,
    )

    return img


# macOS .iconset required sizes
SIZES = {
    'icon_16x16.png': 16,
    'icon_16x16@2x.png': 32,
    'icon_32x32.png': 32,
    'icon_32x32@2x.png': 64,
    'icon_128x128.png': 128,
    'icon_128x128@2x.png': 256,
    'icon_256x256.png': 256,
    'icon_256x256@2x.png': 512,
    'icon_512x512.png': 512,
    'icon_512x512@2x.png': 1024,
}

print("Generating icons...")
for filename, px in SIZES.items():
    icon = draw_icon(px)
    path = os.path.join(ICONSET_DIR, filename)
    icon.save(path, 'PNG')
    print(f"  {filename} ({px}x{px})")

# Also save a 1024px master PNG
master = draw_icon(1024)
master.save(os.path.join(OUTPUT_DIR, 'icon.png'), 'PNG')
print("  icon.png (1024x1024 master)")

# Convert .iconset to .icns using macOS iconutil
icns_path = os.path.join(OUTPUT_DIR, 'icon.icns')
result = subprocess.run(
    ['iconutil', '-c', 'icns', ICONSET_DIR, '-o', icns_path],
    capture_output=True, text=True
)
if result.returncode == 0:
    print(f"\nicon.icns created successfully at {icns_path}")
else:
    print(f"\niconutil failed: {result.stderr}")

# Also create favicon.ico for web (16, 32, 48, 64)
favicon_sizes = [16, 32, 48, 64]
favicon_images = [draw_icon(s) for s in favicon_sizes]
favicon_path = os.path.join(OUTPUT_DIR, '..', '..', 'app', 'public', 'favicon.ico')
favicon_images[0].save(favicon_path, format='ICO', sizes=[(s, s) for s in favicon_sizes], append_images=favicon_images[1:])
print(f"favicon.ico created at {favicon_path}")

print("\nDone!")
