# PWA Icons

This directory contains icons for the Progressive Web App (PWA) functionality.

## Required Icons

The following icon sizes are needed for full PWA support:

- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Shortcuts Icons

- shortcut-attend.png (96x96)
- shortcut-admin.png (96x96)

## Badge Icons

- badge-72x72.png

## How to Generate Icons

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

Or use command line tools like ImageMagick:

```bash
# Generate all sizes from a source image
convert source.png -resize 16x16 icon-16x16.png
convert source.png -resize 32x32 icon-32x32.png
convert source.png -resize 72x72 icon-72x72.png
convert source.png -resize 96x96 icon-96x96.png
convert source.png -resize 128x128 icon-128x128.png
convert source.png -resize 144x144 icon-144x144.png
convert source.png -resize 152x152 icon-152x152.png
convert source.png -resize 192x192 icon-192x192.png
convert source.png -resize 384x384 icon-384x384.png
convert source.png -resize 512x512 icon-512x512.png
```

## Current Status

Currently using placeholder icons. Replace with actual app icons for production.
