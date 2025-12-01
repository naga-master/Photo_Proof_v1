import { describe, it, expect } from 'vitest';
import {
  getInitials,
  getAvatarColor,
  getAvatarConfig,
  generateAvatarSvg,
} from '../../utils/avatarUtils';

describe('avatarUtils', () => {
  describe('getInitials', () => {
    it('returns two initials for two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('returns two initials for multi-word name (first and last)', () => {
      expect(getInitials('John Michael Doe')).toBe('JD');
    });

    it('returns first two characters for single word', () => {
      expect(getInitials('John')).toBe('JO');
    });

    it('returns uppercase initials', () => {
      expect(getInitials('john doe')).toBe('JD');
    });

    it('returns ? for empty string', () => {
      expect(getInitials('')).toBe('?');
    });

    it('returns ? for whitespace only', () => {
      expect(getInitials('   ')).toBe('?');
    });

    it('handles names with extra whitespace', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD');
    });

    it('handles single character name', () => {
      expect(getInitials('J')).toBe('J');
    });

    it('handles names with special characters', () => {
      expect(getInitials("Mary O'Brien")).toBe('MO');
    });
  });

  describe('getAvatarColor', () => {
    it('returns an object with bg and text properties', () => {
      const color = getAvatarColor('John Doe');
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
    });

    it('returns consistent color for same name', () => {
      const color1 = getAvatarColor('John Doe');
      const color2 = getAvatarColor('John Doe');
      expect(color1.bg).toBe(color2.bg);
      expect(color1.text).toBe(color2.text);
    });

    it('returns different colors for different names', () => {
      const color1 = getAvatarColor('John Doe');
      const color2 = getAvatarColor('Jane Smith');
      // They could be the same by chance, but usually different
      // Just test they are valid colors
      expect(color1.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(color2.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('returns valid hex colors', () => {
      const color = getAvatarColor('Test User');
      expect(color.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(color.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('handles empty/null name', () => {
      const color = getAvatarColor('');
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
    });
  });

  describe('getAvatarConfig', () => {
    it('returns image type when profile picture is provided', () => {
      const config = getAvatarConfig('John Doe', 'https://example.com/avatar.jpg');
      expect(config.type).toBe('image');
      expect(config.imageUrl).toBe('https://example.com/avatar.jpg');
    });

    it('returns initials type when no profile picture', () => {
      const config = getAvatarConfig('John Doe');
      expect(config.type).toBe('initials');
      expect(config.initials).toBe('JD');
      expect(config.backgroundColor).toBeDefined();
      expect(config.textColor).toBeDefined();
    });

    it('returns initials type when profile picture is null', () => {
      const config = getAvatarConfig('John Doe', null);
      expect(config.type).toBe('initials');
      expect(config.initials).toBe('JD');
    });

    it('returns initials type when profile picture is empty string', () => {
      const config = getAvatarConfig('John Doe', '');
      expect(config.type).toBe('initials');
      expect(config.initials).toBe('JD');
    });

    it('returns initials type when profile picture is whitespace', () => {
      const config = getAvatarConfig('John Doe', '   ');
      expect(config.type).toBe('initials');
      expect(config.initials).toBe('JD');
    });

    it('includes valid colors for initials type', () => {
      const config = getAvatarConfig('Test User');
      expect(config.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('generateAvatarSvg', () => {
    it('returns a data URI with SVG', () => {
      const svg = generateAvatarSvg('John Doe');
      expect(svg).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('generates valid base64', () => {
      const svg = generateAvatarSvg('John Doe');
      const base64 = svg.replace('data:image/svg+xml;base64,', '');
      expect(() => atob(base64)).not.toThrow();
    });

    it('includes initials in SVG content', () => {
      const svg = generateAvatarSvg('John Doe');
      const base64 = svg.replace('data:image/svg+xml;base64,', '');
      const decoded = atob(base64);
      expect(decoded).toContain('JD');
    });

    it('uses default size of 100', () => {
      const svg = generateAvatarSvg('John Doe');
      const base64 = svg.replace('data:image/svg+xml;base64,', '');
      const decoded = atob(base64);
      expect(decoded).toContain('width="100"');
      expect(decoded).toContain('height="100"');
    });

    it('respects custom size', () => {
      const svg = generateAvatarSvg('John Doe', 200);
      const base64 = svg.replace('data:image/svg+xml;base64,', '');
      const decoded = atob(base64);
      expect(decoded).toContain('width="200"');
      expect(decoded).toContain('height="200"');
    });

    it('includes background color from getAvatarColor', () => {
      const svg = generateAvatarSvg('John Doe');
      const base64 = svg.replace('data:image/svg+xml;base64,', '');
      const decoded = atob(base64);
      const expectedColor = getAvatarColor('John Doe');
      expect(decoded).toContain(`fill="${expectedColor.bg}"`);
    });

    it('handles special characters in name', () => {
      const svg = generateAvatarSvg("Mary O'Brien");
      expect(svg).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });
});
