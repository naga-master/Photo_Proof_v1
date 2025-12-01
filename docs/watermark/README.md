# Photo Watermarking Feature

## Overview

The watermarking feature protects client preview images in the photo proofing workflow. Watermarks are applied server-side during image variant generation, ensuring clients see protected proofs while studios can deliver clean final images.

## Purpose

- **Protect intellectual property** - Prevent unauthorized use of preview images
- **Encourage purchases** - Clients must approve/purchase to get clean images
- **Brand visibility** - Studio logo visible on all shared previews
- **Deter screenshots** - Make low-quality captures unusable

## Quick Links

| Document | Description |
|----------|-------------|
| [Industry Analysis](./INDUSTRY_ANALYSIS.md) | Research on how competitors handle watermarking |
| [Architecture](./ARCHITECTURE.md) | Technical design and system architecture |
| [Implementation Plan](./IMPLEMENTATION_PLAN.md) | Step-by-step development guide |
| [API Specification](./API_SPECIFICATION.md) | Endpoint definitions and schemas |

## Feature Summary

### Watermark Types
- **Logo watermark** - Studio logo (PNG with transparency)
- **Text watermark** - Fallback text (e.g., "© Studio Name" or "PROOF")

### Position Options
- Tiled diagonal (recommended for maximum protection)
- Center
- Corner positions (top-left, top-right, bottom-left, bottom-right)

### Application Scope
| Variant | Watermarked | Reason |
|---------|-------------|--------|
| `thumbnail` | ✅ Yes | Gallery previews |
| `low` | ✅ Yes | Web viewing |
| `medium` | ✅ Yes | Detailed preview |
| `high` | ❌ No | Final delivery |
| `print` | ❌ No | Print orders |

## Default Settings

| Setting | Default Value |
|---------|---------------|
| Enabled | `true` |
| Type | `logo` (falls back to text if no logo) |
| Position | `tiled` |
| Opacity | `50%` |
| Text | Studio name |

## Status

**Current Status**: Planning / Documentation Phase

**Target Release**: TBD
