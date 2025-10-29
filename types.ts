import type { ReactNode } from 'react';

export interface Photo {
  id: number;
  src: string;
  width: number;
  height: number;
  alt: string;
  comments?: Comment[];
}

export interface Comment {
    id: number;
    author: 'Client' | 'Studio';
    text: string;
    timestamp: string;
    replies?: Comment[];
}

export interface Album {
  id: number;
  title: string;
  photoCount: number;
  coverPhotoSrc: string;
  isLocked?: boolean;
  photos: Photo[];
}

export interface StoreCategory {
  id: string;
  name: string;
  priceFrom: number;
  imageUrl: string;
}

export interface PricingItem {
  type: string;
  price: number;
}

export interface PricingSizeGroup {
  size: string;
  items: PricingItem[];
}

export interface PricingCategory {
  id: string;
  name: string;
  sizeGroups: PricingSizeGroup[];
}

export type UserRole = 'studio' | 'client' | null;

export type DashboardView = 'overview' | 'projects' | 'clients' | 'invoices' | 'analytics' | 'settings' | 'upload' | 'layouts' | 'notifications';

export interface NavItem {
  view: DashboardView;
  label: string;
  icon: ReactNode;
}

// E-commerce Types
export interface ProductSizeOption {
  size: string;
  price: number;
}

export interface ProductTypeOption {
  name: string;
}

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  specs: Record<string, string>;
  sizes: ProductSizeOption[];
  types?: ProductTypeOption[];
  mockupImages: string[]; // URLs for wall previews
}

export interface CartItem {
  id: string; // unique cart item id
  photo: Photo;
  product: Product;
  selectedOption: ProductSizeOption; // This is a size option
  selectedType?: ProductTypeOption;
  quantity: number;
}
