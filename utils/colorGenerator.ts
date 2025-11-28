/**
 * Color Generator Utility
 * Generates color palettes from a single primary color
 */

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Convert HEX to HSL
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to HEX
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust lightness of a hex color
 */
export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  const newL = Math.max(0, Math.min(100, hsl.l + amount));
  return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * Adjust saturation of a hex color
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHSL(hex);
  const newS = Math.max(0, Math.min(100, hsl.s + amount));
  return hslToHex(hsl.h, newS, hsl.l);
}

/**
 * Get complementary color (180° opposite)
 */
export function getComplementary(hex: string): string {
  const hsl = hexToHSL(hex);
  const newH = (hsl.h + 180) % 360;
  return hslToHex(newH, hsl.s, hsl.l);
}

/**
 * Get analogous colors (±30° on color wheel)
 */
export function getAnalogous(hex: string): { left: string; right: string } {
  const hsl = hexToHSL(hex);
  return {
    left: hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
    right: hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
  };
}

/**
 * Get triadic colors (120° intervals)
 */
export function getTriadic(hex: string): { secondary: string; tertiary: string } {
  const hsl = hexToHSL(hex);
  return {
    secondary: hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
    tertiary: hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
  };
}

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryLighter: string;
  primaryDarker: string;
  complementary?: string;
  analogous?: { left: string; right: string };
  triadic?: { secondary: string; tertiary: string };
}

/**
 * Generate a complete color palette from a single primary color
 */
export function generateColorPalette(
  primaryHex: string,
  options?: {
    includeComplementary?: boolean;
    includeAnalogous?: boolean;
    includeTriadic?: boolean;
  }
): ColorPalette {
  const palette: ColorPalette = {
    primary: primaryHex,
    primaryLight: adjustLightness(primaryHex, 15),
    primaryDark: adjustLightness(primaryHex, -15),
    primaryLighter: adjustLightness(primaryHex, 30),
    primaryDarker: adjustLightness(primaryHex, -30),
  };
  
  if (options?.includeComplementary) {
    palette.complementary = getComplementary(primaryHex);
  }
  
  if (options?.includeAnalogous) {
    palette.analogous = getAnalogous(primaryHex);
  }
  
  if (options?.includeTriadic) {
    palette.triadic = getTriadic(primaryHex);
  }
  
  return palette;
}

/**
 * Example usage:
 * 
 * const palette = generateColorPalette('#0A58D0', {
 *   includeComplementary: true,
 *   includeAnalogous: true,
 *   includeTriadic: true
 * });
 * 
 * console.log('Primary:', palette.primary);
 * console.log('Light:', palette.primaryLight);
 * console.log('Dark:', palette.primaryDark);
 * console.log('Complementary:', palette.complementary);
 */
