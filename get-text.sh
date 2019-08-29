#!/bin/bash

raw_image='.img-0-raw.jpeg'
scaled_image='.img-1-scaled.jpeg'

# Take screenshot and crop to region (Assumes 2560x1440 screen)
xwd -silent -root -display :0 | convert xwd:- -crop 440x80+1060+655 $raw_image

# Optimize the image for the OCR process
convert -colorspace gray \
     -fill black -fuzz 30% +opaque "#FFFFFF" \
     -negate \
     -units pixelsperinch -density 300 \
     $raw_image $scaled_image

# Read the values in
tesseract $scaled_image stdout
