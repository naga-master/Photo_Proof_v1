import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validateStep1,
  validateStep2,
  getValidationErrorMessage,
  canProceedFromStep1,
  canProceedFromStep2,
  type Step1ValidationData,
  type Step2ValidationData,
} from '../../lib/validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('returns true for email with subdomain', () => {
      expect(isValidEmail('test@mail.example.com')).toBe(true);
    });

    it('returns true for email with plus sign', () => {
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('returns true for email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
    });

    it('returns false for email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('returns false for email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('returns false for email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('returns false for email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('returns false for email without TLD', () => {
      expect(isValidEmail('test@example')).toBe(false);
    });
  });

  describe('validateStep1', () => {
    const validData: Step1ValidationData = {
      title: 'Wedding Photography',
      clientId: 'client-123',
      shootDate: '2024-06-15',
      packageId: 'pkg-1',
      layout: 'layout-1',
    };

    it('returns valid for complete data', () => {
      const result = validateStep1(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('returns error for missing title', () => {
      const result = validateStep1({ ...validData, title: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Project title is required');
    });

    it('returns error for whitespace-only title', () => {
      const result = validateStep1({ ...validData, title: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Project title is required');
    });

    it('returns error for missing clientId', () => {
      const result = validateStep1({ ...validData, clientId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.clientId).toBe('Please select a client or create a new one');
    });

    it('returns error for missing shootDate', () => {
      const result = validateStep1({ ...validData, shootDate: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.shootDate).toBe('Shoot date is required');
    });

    it('returns error for invalid date format', () => {
      const result = validateStep1({ ...validData, shootDate: 'not-a-date' });
      expect(result.isValid).toBe(false);
      expect(result.errors.shootDate).toBe('Please enter a valid date');
    });

    it('returns error for missing packageId', () => {
      const result = validateStep1({ ...validData, packageId: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.packageId).toBe('Please select a service package');
    });

    it('returns error for missing layout', () => {
      const result = validateStep1({ ...validData, layout: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.layout).toBe('Please select a layout preset');
    });

    describe('new client validation', () => {
      it('requires name when creating new client', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: { name: '', email: 'test@example.com' },
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Full name is required');
      });

      it('requires email when creating new client', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: { name: 'John Doe', email: '' },
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBe('Email is required');
      });

      it('validates email format for new client', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: { name: 'John Doe', email: 'invalid-email' },
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.email).toBe('Please enter a valid email address');
      });

      it('validates phone format when provided', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: 'invalid',
          },
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.phone).toBe('Please enter a valid phone number');
      });

      it('accepts valid phone number', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        });
        expect(result.isValid).toBe(true);
      });

      it('accepts phone with parentheses and dashes', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '(123) 456-7890',
          },
        });
        expect(result.isValid).toBe(true);
      });

      it('phone is optional for new client', () => {
        const result = validateStep1({
          ...validData,
          clientId: 'new',
          newClientDetails: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        });
        expect(result.isValid).toBe(true);
      });
    });

    it('returns multiple errors at once', () => {
      const result = validateStep1({});
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });

  describe('validateStep2', () => {
    it('returns valid for data with folders', () => {
      const data: Step2ValidationData = {
        detectedFolders: [{ path: '/photos' }],
        folderMap: [{ sourcePath: '/photos', targetAlbumName: 'Photos' }],
      };
      const result = validateStep2(data);
      expect(result.isValid).toBe(true);
    });

    it('returns error for empty folders', () => {
      const data: Step2ValidationData = {
        detectedFolders: [],
        folderMap: [],
      };
      const result = validateStep2(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.folders).toBe('Please select at least one folder to upload');
    });

    it('returns error for empty album name in folder map', () => {
      const data: Step2ValidationData = {
        detectedFolders: [{ path: '/photos' }],
        folderMap: [{ sourcePath: '/photos', targetAlbumName: '' }],
      };
      const result = validateStep2(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.folderMap_0).toContain('cannot be empty');
    });

    it('returns error for whitespace-only album name', () => {
      const data: Step2ValidationData = {
        detectedFolders: [{ path: '/photos' }],
        folderMap: [{ sourcePath: '/photos', targetAlbumName: '   ' }],
      };
      const result = validateStep2(data);
      expect(result.isValid).toBe(false);
    });

    it('validates multiple folder mappings', () => {
      const data: Step2ValidationData = {
        detectedFolders: [{ path: '/photos1' }, { path: '/photos2' }],
        folderMap: [
          { sourcePath: '/photos1', targetAlbumName: 'Album 1' },
          { sourcePath: '/photos2', targetAlbumName: '' },
        ],
      };
      const result = validateStep2(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.folderMap_1).toBeDefined();
    });
  });

  describe('getValidationErrorMessage', () => {
    it('returns empty string for no errors', () => {
      expect(getValidationErrorMessage({})).toBe('');
    });

    it('returns single error message directly', () => {
      const errors = { title: 'Project title is required' };
      expect(getValidationErrorMessage(errors)).toBe('Project title is required');
    });

    it('returns count message for multiple errors', () => {
      const errors = {
        title: 'Project title is required',
        clientId: 'Please select a client',
        date: 'Date is required',
      };
      expect(getValidationErrorMessage(errors)).toBe('Please fix 3 validation errors');
    });
  });

  describe('canProceedFromStep1', () => {
    it('returns true for valid data', () => {
      const data: Step1ValidationData = {
        title: 'Wedding',
        clientId: 'client-1',
        shootDate: '2024-06-15',
        packageId: 'pkg-1',
        layout: 'layout-1',
      };
      expect(canProceedFromStep1(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      const data: Step1ValidationData = {
        title: '',
        clientId: '',
        shootDate: '',
        packageId: '',
        layout: '',
      };
      expect(canProceedFromStep1(data)).toBe(false);
    });
  });

  describe('canProceedFromStep2', () => {
    it('returns true for valid data', () => {
      const data: Step2ValidationData = {
        detectedFolders: [{ path: '/photos' }],
        folderMap: [{ sourcePath: '/photos', targetAlbumName: 'Photos' }],
      };
      expect(canProceedFromStep2(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      const data: Step2ValidationData = {
        detectedFolders: [],
        folderMap: [],
      };
      expect(canProceedFromStep2(data)).toBe(false);
    });
  });
});
