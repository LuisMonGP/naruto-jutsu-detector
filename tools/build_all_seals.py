import os
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

img_path = 'C:/Users/MonG/.gemini/antigravity/brain/29564ffe-b7d9-4fde-aa28-581abe1f363c/.user_uploaded/media_1793673570529_b21f17a3.png'
img = Image.open(img_path).convert('L')
w, h = img.size
cell_w = w / 4.0
cell_h = h / 3.0

# 12 seals in order: (col, row, seal_id, seal_name_es)
SEALS = [
    # Row 0
    (0, 0, 'tori', 'Pájaro'),
    (1, 0, 'i', 'Jabalí'),
    (2, 0, 'inu', 'Perro'),
    (3, 0, 'tatsu', 'Dragón'),
    # Row 1
    (0, 1, 'u', 'Liebre'),
    (1, 1, 'uma', 'Caballo'),
    (2, 1, 'saru', 'Mono'),
    (3, 1, 'ushi', 'Buey'),
    # Row 2
    (0, 2, 'hitsuji', 'Carnero'),
    (1, 2, 'ne', 'Rata'),
    (2, 2, 'mi', 'Serpiente'),
    (3, 2, 'tora', 'Tigre'),
]

os.makedirs('tools/all_seals', exist_ok=True)
os.makedirs('docs/assets', exist_ok=True)

symbols = []

for col, row, sid, name in SEALS:
    x0 = int(col * cell_w + 14)
    y0 = int(row * cell_h + 14)
    x1 = int((col + 1) * cell_w - 14)
    y1 = int((row + 1) * cell_h - 44)
    
    crop = img.crop((x0, y0, x1, y1))
    
    # Wipe borders clean
    draw = ImageDraw.Draw(crop)
    cw, ch = crop.size
    draw.rectangle([0, 0, cw, 4], fill=255)
    draw.rectangle([0, ch-5, cw, ch], fill=255)
    draw.rectangle([0, 0, 4, ch], fill=255)
    draw.rectangle([cw-5, 0, cw, ch], fill=255)
    
    clean = crop.point(lambda p: 255 if p > 195 else p)
    
    png_path = f'tools/all_seals/{sid}.png'
    clean.save(png_path)
    
    svg_path = f'tools/all_seals/{sid}.svg'
    cmd = ['./tools/vtracer.exe', '-i', png_path, '-o', svg_path, '--preset', 'bw', '-m', 'spline', '-f', '6']
    subprocess.run(cmd, check=True)
    
    with open(svg_path, 'r', encoding='utf-8') as f:
        svg_content = f.read()
    
    # Parse SVG to extract paths and viewBox
    root = ET.fromstring(svg_content)
    svg_w = root.get('width', '128')
    svg_h = root.get('height', '174')
    
    # Filter paths: replace fill="#000000" with fill="currentColor"
    # and skip any 1px edge border lines if any
    paths_str = ''
    for elem in root.iter():
        if elem.tag.endswith('path'):
            d = elem.get('d', '')
            fill = elem.get('fill', '#000000')
            if fill.lower() in ['#ffffff', 'white', '#fff']:
                continue # transparent background
            paths_str += f'    <path d="{d}" fill="currentColor" />\n'
    
    symbol_str = f'  <symbol id="seal-{sid}" viewBox="0 0 {svg_w} {svg_h}">\n{paths_str}  </symbol>'
    symbols.append(symbol_str)
    print(f'Done {sid} ({name}): viewBox 0 0 {svg_w} {svg_h}')

# Combine into master SVG sprite
sprite_content = '<svg xmlns="http://www.w3.org/2000/svg" style="display: none;" aria-hidden="true">\n' + '\n\n'.join(symbols) + '\n</svg>\n'

with open('docs/assets/seals.svg', 'w', encoding='utf-8') as f:
    f.write(sprite_content)

print('\nMaster sprite written to docs/assets/seals.svg successfully!')
