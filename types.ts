import React from 'react';

export type UserRole = 'client' | 'studio' | null;

export interface Comment {
  id: number;
  author: 'Client' | 'Studio';
  text: string;
  timestamp: string;
  replies?: Comment[];
}

export interface Photo {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  comments: Comment[];
}

export type LayoutId = 'layout1' | 'layout2' | 'layout3' | 'layout4' | 'layout5' | 'layout6' | 'layout7' | 'layout8' | 'layout9';

export interface LayoutTemplate {
    id: LayoutId;
    name: string;
    description: string;
    header: 'Cover' | 'Title Only';
    grid: 'Masonry' | 'Grid' | 'Stacked';
    aspect: 'Portrait' | 'Landscape';
    theme: 'White' | 'Gray' | 'Black' | 'Cream';
}

export interface Album {
  id: number;
  title: string;
  clientId: number;
  shootDate?: string;
  coverPhotoSrc: string;
  photoCount: number;
  isLocked: boolean;
  photos: Photo[];
  layout: LayoutId;
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
    mockupImages: string[];
}

export interface CartItem {
    id: string;
    photo: Photo;
    product: Product;
    selectedOption: ProductSizeOption;
    selectedType?: ProductTypeOption;
    quantity: number;
}

// Studio Types
export type DashboardView = 'overview' | 'projects' | 'clients' | 'invoices' | 'analytics' | 'settings' | 'upload' | 'project-details' | 'client-details' | 'layouts' | 'tools' | 'notifications';

export interface NavItem {
    view: DashboardView;
    label: string;
    icon: React.ReactNode;
}

export interface Client {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
    whatsappOptIn?: boolean;
    emailOptIn?: boolean;
    projects: number[]; // array of album ids
    lastActivity: string;
}

export interface NewClientDetails {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}

// Upload Wizard Types
export type UploadMode = 'new' | 'existing' | null;
export type UploadStep = 0 | 1 | 2 | 3 | 4 | 5;
export type ImageSizeRule = 'full' | 'high' | 'web';

export interface ProjectDetails {
    title: string;
    clientId: string; // Can be a number string or 'new'
    newClientDetails?: NewClientDetails;
    shootDate: string;
    tags: string;
    layout: LayoutId;
    watermark: string;
}

export interface UploadFile {
    id: string;
    file: File;
    status: 'queued' | 'uploading' | 'success' | 'failed';
    progress: number;
    error?: string;
}

export interface DetectedFolder {
    path: string;
    files: File[];
}

export interface FolderMap {
    sourcePath: string;
    targetAlbumName: string;
}

export interface UploadRules {
    imageSize: ImageSizeRule;
    compression: number;
    aiTagging: boolean;
    aiCulling: boolean;
}

export interface UploadState {
    step: UploadStep;
    mode: UploadMode;
    projectDetails: Partial<ProjectDetails>;
    detectedFolders: DetectedFolder[];
    folderMap: FolderMap[];
    uploadRules: UploadRules;
    uploadQueue: UploadFile[];
    isUploading: boolean;
}