#!/usr/bin/env python3
"""
Extract the W+arrow icon (first 2 paths) from the traced SVG,
compute its bounding box, and save a clean icon-only SVG.
"""

import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

INPUT_SVG  = r'C:\Users\Adam\Desktop\openclaw\frontend\public\brand-assets\WIN GAME Logo简洁版1.svg'
OUTPUT_SVG = r'C:\Users\Adam\Desktop\openclaw\frontend\public\brand-assets\wingame-icon.svg'

# ---- parse ----
ET.register_namespace('', 'http://www.w3.org/2000/svg')
tree = ET.parse(INPUT_SVG)
root = tree.getroot()
ns = {'svg': 'http://www.w3.org/2000/svg'}

paths = root.findall('.//svg:path', ns)
print(f'Total paths in SVG: {len(paths)}')

# The W+arrow icon is formed by the first 2 paths.
# All remaining paths (index 2+) are the text "WIN GAME AI SPORTS ANALYTICS".
icon_paths = paths[:2]

for i, p in enumerate(icon_paths):
    tx = p.get('transform', 'no transform')
    d_snippet = p.get('d', '')[:60]
    print(f'  Path {i+1}: transform={tx}  d={d_snippet}...')

# ---- compute approx bounding box from translate values ----
# Path 1: translate(577, 272)  — main W body
# Path 2: translate(606, 330)  — inner W element
# From visual inspection of the 1024x1024 source PNG:
# the icon occupies roughly x: 155-720, y: 230-580
# We'll use a viewBox with some padding.
ICON_VIEWBOX = "140 210 600 390"   # x y w h

# ---- build new SVG ----
new_svg = ET.Element('svg')
new_svg.set('xmlns', 'http://www.w3.org/2000/svg')
new_svg.set('viewBox', ICON_VIEWBOX)
new_svg.set('width',  '600')
new_svg.set('height', '390')
new_svg.set('fill', 'none')

for p in icon_paths:
    new_p = ET.SubElement(new_svg, 'path')
    new_p.set('d', p.get('d', ''))
    new_p.set('fill', '#000000')
    if p.get('transform'):
        new_p.set('transform', p.get('transform'))

ET.indent(new_svg)
output_path = Path(OUTPUT_SVG)
ET.ElementTree(new_svg).write(str(output_path), encoding='unicode', xml_declaration=False)
print(f'\nSaved icon SVG: {OUTPUT_SVG}')
print(f'viewBox: {ICON_VIEWBOX}')
print('Done — use wingame-icon.svg in the navbar with CSS filter: brightness(0) invert(1)')
