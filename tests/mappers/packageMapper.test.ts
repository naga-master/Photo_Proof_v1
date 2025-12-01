import { describe, it, expect } from 'vitest';
import { mapServicePackageResponse } from '../../lib/mappers/packageMapper';

describe('packageMapper', () => {
  describe('mapServicePackageResponse', () => {
    it('maps a complete backend package to frontend ServicePackage type', () => {
      const backendPackage = {
        id: 'pkg-123',
        name: 'Wedding Premium',
        category: 'wedding',
        description: 'Full day wedding coverage',
        price: '2500.00',
        is_predefined: true,
        features: [
          { name: '8 Hours Coverage', included: true, details: 'Full day' },
          { name: 'Second Photographer', included: true, details: null },
          { name: 'Drone Shots', included: false, details: 'Available as add-on' },
        ],
        deliverables: ['500+ edited photos', 'Online gallery', 'USB drive'],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);

      expect(mapped.id).toBe('pkg-123');
      expect(mapped.name).toBe('Wedding Premium');
      expect(mapped.category).toBe('wedding');
      expect(mapped.description).toBe('Full day wedding coverage');
      expect(mapped.price).toBe(2500);
      expect(mapped.isPredefined).toBe(true);
      expect(mapped.features).toHaveLength(3);
      expect(mapped.deliverables).toEqual(['500+ edited photos', 'Online gallery', 'USB drive']);
    });

    it('converts price string to number', () => {
      const backendPackage = {
        id: '1',
        name: 'Basic',
        category: 'portrait',
        description: 'Basic package',
        price: '199.99',
        features: [],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.price).toBe(199.99);
      expect(typeof mapped.price).toBe('number');
    });

    it('handles numeric price value', () => {
      const backendPackage = {
        id: '1',
        name: 'Basic',
        category: 'portrait',
        description: 'Basic package',
        price: 299,
        features: [],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.price).toBe(299);
    });

    it('defaults isPredefined to false when not provided', () => {
      const backendPackage = {
        id: '1',
        name: 'Custom',
        category: 'event',
        description: 'Custom package',
        price: '500',
        features: [],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.isPredefined).toBe(false);
    });

    it('maps features correctly with all properties', () => {
      const backendPackage = {
        id: '1',
        name: 'Test',
        category: 'test',
        description: 'Test',
        price: '100',
        features: [
          { name: 'Feature 1', included: true, details: 'Some details' },
          { name: 'Feature 2', included: false, details: 'Other details' },
        ],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);

      expect(mapped.features).toHaveLength(2);
      expect(mapped.features[0]).toEqual({
        name: 'Feature 1',
        included: true,
        details: 'Some details',
      });
      expect(mapped.features[1]).toEqual({
        name: 'Feature 2',
        included: false,
        details: 'Other details',
      });
    });

    it('handles features with null details', () => {
      const backendPackage = {
        id: '1',
        name: 'Test',
        category: 'test',
        description: 'Test',
        price: '100',
        features: [{ name: 'Feature', included: true, details: null }],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.features[0].details).toBeNull();
    });

    it('handles features with undefined details', () => {
      const backendPackage = {
        id: '1',
        name: 'Test',
        category: 'test',
        description: 'Test',
        price: '100',
        features: [{ name: 'Feature', included: true }],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.features[0].details).toBeNull();
    });

    it('handles empty features array', () => {
      const backendPackage = {
        id: '1',
        name: 'Basic',
        category: 'portrait',
        description: 'No features',
        price: '50',
        features: [],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.features).toEqual([]);
    });

    it('handles null/undefined features gracefully', () => {
      const backendPackage = {
        id: '1',
        name: 'Basic',
        category: 'portrait',
        description: 'No features',
        price: '50',
        features: null,
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.features).toEqual([]);
    });

    it('handles empty deliverables', () => {
      const backendPackage = {
        id: '1',
        name: 'Basic',
        category: 'portrait',
        description: 'No deliverables',
        price: '50',
        features: [],
        deliverables: [],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.deliverables).toEqual([]);
    });

    it('handles null/undefined deliverables gracefully', () => {
      const backendPackage = {
        id: '1',
        name: 'Basic',
        category: 'portrait',
        description: 'No deliverables',
        price: '50',
        features: [],
        deliverables: null,
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.deliverables).toEqual([]);
    });

    it('preserves all deliverables', () => {
      const backendPackage = {
        id: '1',
        name: 'Complete',
        category: 'wedding',
        description: 'Full package',
        price: '3000',
        features: [],
        deliverables: [
          '1000+ photos',
          '4K video',
          'Printed album',
          'Online gallery for 1 year',
        ],
      };

      const mapped = mapServicePackageResponse(backendPackage as any);
      expect(mapped.deliverables).toHaveLength(4);
      expect(mapped.deliverables).toContain('1000+ photos');
      expect(mapped.deliverables).toContain('4K video');
    });
  });
});
