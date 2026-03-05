# ROI v1 Design

## Overview
Region of Interest (ROI) extraction v1 aims to isolate the tongue area more precisely using contour detection combined with color thresholding.

## Methods
1. Multi-scale color filtering to mask out lips and skin.
2. Connected component analysis to find the largest blob.
3. Convex hull to smooth out the edges based on morphology.

## Fallback
If blob size < 5% of total image area, fallback to `HOLD_QUALITY`.

## Metrics
- coverage_ratio
- confidence_score
