import { describe, it, expect } from 'vitest';
import {
  hexToHSL,
  hslToHex,
  adjustLightness,
  adjustSaturation,
  getComplementary,
  getAnalogous,
  getTriadic,
  generateColorPalette,
} from '../../utils/colorGenerator';

describe('colorGenerator', () => {
  describe('hexToHSL', () => {
    it('converts pure red correctly', () => {
      const hsl = hexToHSL('#FF0000');
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('converts pure green correctly', () => {
      const hsl = hexToHSL('#00FF00');
      expect(hsl.h).toBe(120);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('converts pure blue correctly', () => {
      const hsl = hexToHSL('#0000FF');
      expect(hsl.h).toBe(240);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('converts white correctly', () => {
      const hsl = hexToHSL('#FFFFFF');
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(100);
    });

    it('converts black correctly', () => {
      const hsl = hexToHSL('#000000');
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(0);
    });

    it('handles hex without # prefix', () => {
      const hsl = hexToHSL('FF0000');
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('converts gray correctly', () => {
      const hsl = hexToHSL('#808080');
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(50);
    });
  });

  describe('hslToHex', () => {
    it('converts pure red HSL to hex', () => {
      const hex = hslToHex(0, 100, 50);
      expect(hex.toLowerCase()).toBe('#ff0000');
    });

    it('converts pure green HSL to hex', () => {
      const hex = hslToHex(120, 100, 50);
      expect(hex.toLowerCase()).toBe('#00ff00');
    });

    it('converts pure blue HSL to hex', () => {
      const hex = hslToHex(240, 100, 50);
      expect(hex.toLowerCase()).toBe('#0000ff');
    });

    it('converts white HSL to hex', () => {
      const hex = hslToHex(0, 0, 100);
      expect(hex.toLowerCase()).toBe('#ffffff');
    });

    it('converts black HSL to hex', () => {
      const hex = hslToHex(0, 0, 0);
      expect(hex.toLowerCase()).toBe('#000000');
    });

    it('converts gray correctly', () => {
      const hex = hslToHex(0, 0, 50);
      expect(hex.toLowerCase()).toBe('#808080');
    });
  });

  describe('hexToHSL and hslToHex roundtrip', () => {
    // Note: Some colors may have small rounding differences due to HSL conversion
    const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#808080'];

    testColors.forEach((color) => {
      it(`roundtrips ${color} correctly`, () => {
        const hsl = hexToHSL(color);
        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        expect(hex.toLowerCase()).toBe(color.toLowerCase());
      });
    });

    it('roundtrips complex colors with acceptable precision', () => {
      // Complex colors may have small rounding differences due to integer HSL values
      const color = '#0A58D0';
      const hsl = hexToHSL(color);
      const hex = hslToHex(hsl.h, hsl.s, hsl.l);
      // Verify hue, saturation, and lightness are preserved
      const originalHSL = hexToHSL(color);
      const resultHSL = hexToHSL(hex);
      // HSL values should be very close (within 1 due to rounding)
      expect(Math.abs(originalHSL.h - resultHSL.h)).toBeLessThanOrEqual(1);
      expect(Math.abs(originalHSL.s - resultHSL.s)).toBeLessThanOrEqual(1);
      expect(Math.abs(originalHSL.l - resultHSL.l)).toBeLessThanOrEqual(1);
    });
  });

  describe('adjustLightness', () => {
    it('increases lightness', () => {
      const original = hexToHSL('#0A58D0');
      const adjusted = adjustLightness('#0A58D0', 20);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBeGreaterThan(original.l);
    });

    it('decreases lightness', () => {
      const original = hexToHSL('#0A58D0');
      const adjusted = adjustLightness('#0A58D0', -20);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBeLessThan(original.l);
    });

    it('clamps lightness at 100', () => {
      const adjusted = adjustLightness('#FFFFFF', 50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBe(100);
    });

    it('clamps lightness at 0', () => {
      const adjusted = adjustLightness('#000000', -50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBe(0);
    });
  });

  describe('adjustSaturation', () => {
    it('increases saturation', () => {
      const original = hexToHSL('#808080');
      const adjusted = adjustSaturation('#808080', 50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBeGreaterThanOrEqual(original.s);
    });

    it('decreases saturation', () => {
      const adjusted = adjustSaturation('#FF0000', -50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(50);
    });

    it('clamps saturation at 100', () => {
      const adjusted = adjustSaturation('#FF0000', 50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(100);
    });

    it('clamps saturation at 0', () => {
      const adjusted = adjustSaturation('#808080', -100);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(0);
    });
  });

  describe('getComplementary', () => {
    it('returns complementary color (180 degrees opposite)', () => {
      const complementary = getComplementary('#FF0000'); // Red
      const hsl = hexToHSL(complementary);
      expect(hsl.h).toBe(180); // Cyan
    });

    it('wraps around the color wheel correctly', () => {
      const complementary = getComplementary('#00FFFF'); // Cyan (180)
      const hsl = hexToHSL(complementary);
      expect(hsl.h).toBe(0); // Red
    });
  });

  describe('getAnalogous', () => {
    it('returns colors 30 degrees apart', () => {
      const { left, right } = getAnalogous('#FF0000'); // Red at 0
      const leftHSL = hexToHSL(left);
      const rightHSL = hexToHSL(right);
      expect(leftHSL.h).toBe(330); // -30 from 0
      expect(rightHSL.h).toBe(30); // +30 from 0
    });
  });

  describe('getTriadic', () => {
    it('returns colors 120 degrees apart', () => {
      const { secondary, tertiary } = getTriadic('#FF0000'); // Red at 0
      const secondaryHSL = hexToHSL(secondary);
      const tertiaryHSL = hexToHSL(tertiary);
      expect(secondaryHSL.h).toBe(120); // Green
      expect(tertiaryHSL.h).toBe(240); // Blue
    });
  });

  describe('generateColorPalette', () => {
    it('generates basic palette with light and dark variants', () => {
      const palette = generateColorPalette('#0A58D0');
      expect(palette.primary).toBe('#0A58D0');
      expect(palette.primaryLight).toBeDefined();
      expect(palette.primaryDark).toBeDefined();
      expect(palette.primaryLighter).toBeDefined();
      expect(palette.primaryDarker).toBeDefined();
    });

    it('includes complementary when requested', () => {
      const palette = generateColorPalette('#0A58D0', { includeComplementary: true });
      expect(palette.complementary).toBeDefined();
    });

    it('includes analogous when requested', () => {
      const palette = generateColorPalette('#0A58D0', { includeAnalogous: true });
      expect(palette.analogous).toBeDefined();
      expect(palette.analogous?.left).toBeDefined();
      expect(palette.analogous?.right).toBeDefined();
    });

    it('includes triadic when requested', () => {
      const palette = generateColorPalette('#0A58D0', { includeTriadic: true });
      expect(palette.triadic).toBeDefined();
      expect(palette.triadic?.secondary).toBeDefined();
      expect(palette.triadic?.tertiary).toBeDefined();
    });

    it('does not include optional colors when not requested', () => {
      const palette = generateColorPalette('#0A58D0');
      expect(palette.complementary).toBeUndefined();
      expect(palette.analogous).toBeUndefined();
      expect(palette.triadic).toBeUndefined();
    });

    it('generates lighter variants that are actually lighter', () => {
      const palette = generateColorPalette('#0A58D0');
      const primaryL = hexToHSL(palette.primary).l;
      const lightL = hexToHSL(palette.primaryLight).l;
      const lighterL = hexToHSL(palette.primaryLighter).l;
      expect(lightL).toBeGreaterThan(primaryL);
      expect(lighterL).toBeGreaterThan(lightL);
    });

    it('generates darker variants that are actually darker', () => {
      const palette = generateColorPalette('#0A58D0');
      const primaryL = hexToHSL(palette.primary).l;
      const darkL = hexToHSL(palette.primaryDark).l;
      const darkerL = hexToHSL(palette.primaryDarker).l;
      expect(darkL).toBeLessThan(primaryL);
      expect(darkerL).toBeLessThan(darkL);
    });
  });
});
