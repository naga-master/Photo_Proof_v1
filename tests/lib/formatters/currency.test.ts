import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyByCode,
  getCurrencyConfig,
  CURRENCIES,
  DEFAULT_CURRENCY,
} from '../../../lib/formatters/currency';

describe('currency formatters', () => {
  describe('CURRENCIES constant', () => {
    it('has INR configuration', () => {
      expect(CURRENCIES.INR).toEqual({
        code: 'INR',
        symbol: '₹',
        locale: 'en-IN',
      });
    });

    it('has USD configuration', () => {
      expect(CURRENCIES.USD).toEqual({
        code: 'USD',
        symbol: '$',
        locale: 'en-US',
      });
    });

    it('has common currencies defined', () => {
      expect(CURRENCIES).toHaveProperty('INR');
      expect(CURRENCIES).toHaveProperty('USD');
      expect(CURRENCIES).toHaveProperty('GBP');
      expect(CURRENCIES).toHaveProperty('EUR');
      expect(CURRENCIES).toHaveProperty('JPY');
      expect(CURRENCIES).toHaveProperty('AUD');
      expect(CURRENCIES).toHaveProperty('CAD');
    });
  });

  describe('DEFAULT_CURRENCY', () => {
    it('defaults to INR', () => {
      expect(DEFAULT_CURRENCY).toEqual(CURRENCIES.INR);
    });
  });

  describe('formatCurrency', () => {
    it('formats with default INR symbol', () => {
      const result = formatCurrency(1000);
      expect(result).toBe('₹1,000.00');
    });

    it('formats with custom symbol', () => {
      const result = formatCurrency(1000, '$');
      expect(result).toContain('$');
      expect(result).toContain('1,000.00');
    });

    it('formats large numbers with Indian grouping (en-IN)', () => {
      const result = formatCurrency(1234567.89);
      // Indian format: 12,34,567.89
      expect(result).toBe('₹12,34,567.89');
    });

    it('formats with US grouping when locale is en-US', () => {
      const result = formatCurrency(1234567.89, '$', 'en-US');
      // US format: 1,234,567.89
      expect(result).toBe('$1,234,567.89');
    });

    it('handles zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('₹0.00');
    });

    it('handles negative numbers', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('-');
      expect(result).toContain('1,000.00');
    });

    it('handles decimal precision', () => {
      const result = formatCurrency(99.9);
      expect(result).toBe('₹99.90');
    });

    it('rounds to 2 decimal places', () => {
      const result = formatCurrency(99.999);
      expect(result).toBe('₹100.00');
    });
  });

  describe('formatCurrencyByCode', () => {
    it('formats INR with correct symbol and locale', () => {
      const result = formatCurrencyByCode(1000, 'INR');
      expect(result).toContain('₹');
      expect(result).toContain('1,000');
    });

    it('formats USD with correct symbol', () => {
      const result = formatCurrencyByCode(1000, 'USD');
      expect(result).toContain('$');
    });

    it('formats GBP with correct symbol', () => {
      const result = formatCurrencyByCode(1000, 'GBP');
      expect(result).toContain('£');
    });

    it('formats EUR with correct symbol', () => {
      const result = formatCurrencyByCode(1000, 'EUR');
      expect(result).toContain('€');
    });

    it('defaults to INR for unknown currency code', () => {
      const result = formatCurrencyByCode(1000, 'UNKNOWN');
      expect(result).toContain('₹');
    });

    it('uses custom locale when provided', () => {
      const result = formatCurrencyByCode(1234567.89, 'USD', 'de-DE');
      // German locale uses different formatting
      expect(result).toBeDefined();
    });

    it('handles zero amount', () => {
      const result = formatCurrencyByCode(0, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('handles negative amount', () => {
      const result = formatCurrencyByCode(-500, 'USD');
      expect(result).toContain('-');
      expect(result).toContain('500');
    });
  });

  describe('getCurrencyConfig', () => {
    it('returns correct config for INR', () => {
      const config = getCurrencyConfig('INR');
      expect(config).toEqual({
        code: 'INR',
        symbol: '₹',
        locale: 'en-IN',
      });
    });

    it('returns correct config for USD', () => {
      const config = getCurrencyConfig('USD');
      expect(config).toEqual({
        code: 'USD',
        symbol: '$',
        locale: 'en-US',
      });
    });

    it('returns correct config for GBP', () => {
      const config = getCurrencyConfig('GBP');
      expect(config).toEqual({
        code: 'GBP',
        symbol: '£',
        locale: 'en-GB',
      });
    });

    it('returns default INR for unknown code', () => {
      const config = getCurrencyConfig('UNKNOWN');
      expect(config).toEqual(DEFAULT_CURRENCY);
    });

    it('returns default INR for empty string', () => {
      const config = getCurrencyConfig('');
      expect(config).toEqual(DEFAULT_CURRENCY);
    });
  });
});
