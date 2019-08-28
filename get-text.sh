#!/bin/bash

raw_image='.img-0-raw.jpeg'
scaled_image='.img-1-scaled.jpeg'

xwd -root -display :0 | convert xwd:- -crop 440x80+1060+655 $raw_image

convert -colorspace gray \
     -fill black -fuzz 30% +opaque "#FFFFFF" \
     -negate \
     -units pixelsperinch -density 300 \
     $raw_image $scaled_image

tesseract $scaled_image stdout
