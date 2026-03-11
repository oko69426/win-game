#!/usr/bin/env python3
"""
WINGAME Brand Assets - PNG to SVG Converter
Uses vtracer for high-quality automatic vector tracing (no manual tracing)

Usage:
    python png_to_svg.py
    python png_to_svg.py --source <folder> --output <folder>
"""

import os
import sys
import argparse
from pathlib import Path

# Fix Windows console encoding for Chinese filenames
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    import vtracer
except ImportError:
    print("Installing vtracer...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'vtracer'])
    import vtracer


def convert_png_to_svg(input_path: str, output_path: str, mode: str = 'logo'):
    """
    Convert PNG to SVG using vtracer auto-tracing.
    mode='logo'   -> binary (black/white), spline curves, good for logos
    mode='color'  -> color, for full-color graphics
    """
    if mode == 'logo':
        vtracer.convert_image_to_svg_py(
            input_path,
            output_path,
            colormode='binary',       # Black/white for logos
            hierarchical='stacked',
            mode='spline',            # Smooth curves
            filter_speckle=4,         # Remove tiny noise
            color_precision=6,
            layer_difference=16,
            corner_threshold=60,
            length_threshold=4.0,
            max_iterations=10,
            splice_threshold=45,
            path_precision=3,
        )
    else:
        vtracer.convert_image_to_svg_py(
            input_path,
            output_path,
            colormode='color',
            hierarchical='stacked',
            mode='spline',
            filter_speckle=4,
            color_precision=8,
            layer_difference=16,
            corner_threshold=60,
            length_threshold=4.0,
            max_iterations=10,
            splice_threshold=45,
            path_precision=3,
        )


def convert_folder(source_dir: str, output_dir: str):
    source = Path(source_dir)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    png_files = sorted(list(source.glob('*.png')) + list(source.glob('*.PNG')))

    if not png_files:
        print(f"[!] No PNG files found in: {source_dir}")
        return

    print(f"Found {len(png_files)} PNG files in: {source_dir}")
    print(f"Output folder: {output_dir}\n")

    success = 0
    for png_file in png_files:
        svg_name = png_file.stem + '.svg'
        svg_path = output / svg_name

        # Use color mode for non-logo files (UI mockups, color previews)
        name_lower = png_file.name.lower()
        if 'logo' in name_lower or 'icon' in name_lower:
            mode = 'logo'
        else:
            mode = 'color'

        print(f"  [{mode}] {png_file.name}")
        print(f"       -> {svg_name}")
        try:
            convert_png_to_svg(str(png_file), str(svg_path), mode=mode)
            size_kb = svg_path.stat().st_size / 1024
            print(f"       OK ({size_kb:.0f} KB)\n")
            success += 1
        except Exception as e:
            print(f"       ERROR: {e}\n")

    print(f"Done: {success}/{len(png_files)} converted to {output_dir}")


def main():
    parser = argparse.ArgumentParser(description='WINGAME PNG -> SVG batch converter')
    parser.add_argument(
        '--source',
        default=r'C:\Users\Adam\Downloads\logo_assets',
        help='Source folder with PNG files',
    )
    parser.add_argument(
        '--output',
        default=r'C:\Users\Adam\Desktop\openclaw\frontend\public\brand-assets',
        help='Output folder for SVG files',
    )
    args = parser.parse_args()

    convert_folder(args.source, args.output)


if __name__ == '__main__':
    main()
