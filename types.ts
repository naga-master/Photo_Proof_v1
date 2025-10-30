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
  clientName?: string; // Added for display
  shootDate?: string; // Added for display
}

export interface StoreCategory {
  id:string;
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

export type DashboardView = 'overview' | 'projects' | 'clients' | 'invoices' | 'analytics' | 'settings' | 'upload' | 'layouts' | 'notifications' | 'tools' | 'projectDetails';

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


// Uploader Flow Types
export type UploadFileStatus = 'queued' | 'uploading' | 'processing' | 'success' | 'failed';

export interface UploadFile {
  id: string;
  file: File;
  status: UploadFileStatus;
  progress: number; // 0-100
  error?: string;
  sourcePath: string; // original folder path
  mappedAlbumName?: string;
}

export interface ProjectDetails {
    title: string;
    client: string;
    shootDate: string;
    tags: string;
    layoutPreset: string;
    accessType: 'public' | 'private' | 'password';
    watermark: string;
    newClientDetails?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }
}

export interface UploadRules {
    imageSize: 'full' | 'high' | 'web';
    compression: number; // 0-100
    applyWatermark: boolean;
    aiTagging: boolean;
    aiCulling: boolean;
}

export interface FolderMap {
    sourcePath: string;
    targetAlbumName: string;
}

export type UploadMode = 'new' | 'existing' | null;

export interface UploadState {
    step: number;
    mode: UploadMode;
    projectDetails: Partial<ProjectDetails>;
    detectedFolders: { path: string; files: File[] }[];
    folderMap: FolderMap[];
    uploadRules: UploadRules;
    uploadQueue: UploadFile[];
    isUploading: boolean;
}

export interface UploadContextType {
    state: UploadState;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    setMode: (mode: UploadMode) => void;
    updateProjectDetails: (details: Partial<ProjectDetails>) => void;
    setFiles: (folders: { path: string, files: File[] }[]) => void;
    updateFolderMap: (map: FolderMap[]) => void;
    updateUploadRules: (rules: Partial<UploadRules>) => void;
    startUpload: () => void;
    pauseUpload: () => void;
    resumeUpload: () => void;
    retryFile: (fileId: string) => void;
    retryFailedUploads: () => void;
    cancelFile: (fileId: string) => void;
    resetUpload: () => void;
}