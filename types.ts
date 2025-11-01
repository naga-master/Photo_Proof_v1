import React from 'react';

export interface Reply {
  id: number;
  author: 'Client' | 'Studio';
  text: string;
  timestamp: string;
}

export interface Comment {
  id: number;
  author: 'Client' | 'Studio';
  text: string;
  timestamp: string;
  replies?: Reply[];
}

export interface Photo {
  id: number;
  src: string;
  alt: string;
  width: number;
  height: number;
  comments: Comment[];
}

export type LayoutId =
  | 'layout1'
  | 'layout2'
  | 'layout3'
  | 'layout4'
  | 'layout5'
  | 'layout6'
  | 'layout7'
  | 'layout8'
  | 'layout9';

export interface Folder {
  id: string;
  name: string;
  coverPhotoSrc: string;
  photoCount: number;
  photos: Photo[];
}

export interface Album {
  id: number;
  title: string;
  clientId: number;
  shootDate?: string;
  coverPhotoSrc: string;
  photoCount: number;
  isLocked: boolean;
  photos?: Photo[];
  folders?: Folder[];
  layout: LayoutId;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Due';
  price?: number;
  packageId?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  username: string;
  password?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  profilePicture?: string;
  whatsappOptIn?: boolean;
  emailOptIn?: boolean;
  projects: number[];
  lastActivity: string;
}

export type UserRole = 'client' | 'studio' | null;

export type DashboardView = 
  | 'overview'
  | 'projects'
  | 'clients'
  | 'invoices'
  | 'invoiceEditor'
  | 'analytics'
  | 'settings'
  | 'layouts'
  | 'services'
  | 'tools'
  | 'notifications'
  | 'upload'
  | 'projectDetails'
  | 'clientDetails';

export interface NavItem {
    view: DashboardView;
    label: string;
    icon: React.ReactNode;
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

export interface LayoutTemplate {
    id: LayoutId;
    name: string;
    description: string;
    header: 'Cover' | 'Title Only';
    grid: 'Masonry' | 'Grid' | 'Stacked';
    aspect: 'Portrait' | 'Landscape';
    theme: 'White' | 'Gray' | 'Cream' | 'Black';
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Draft' | 'Overdue';
export type InvoiceTemplateId = 'modern' | 'classic' | 'minimalist';

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    clientId?: number;
    projectId?: number;
    clientName: string;
    clientAddress: string;
    items: InvoiceItem[];
    notes?: string;
    subtotal: number;
    tax: number;
    total: number;
    status: InvoiceStatus;
    template: InvoiceTemplateId;
}

export interface InvoiceTemplate {
    id: InvoiceTemplateId;
    name: string;
    description: string;
    imageUrl: string;
}

export interface ProjectDetails {
    title?: string;
    clientId?: string;
    newClientDetails?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        profilePicture?: string;
    };
    shootDate?: string;
    tags?: string;
    layout?: LayoutId;
    packageId?: string;
    watermark?: string;
}
  
export type UploadMode = 'new' | 'existing' | null;

export interface DetectedFolder {
    path: string;
    files: File[];
}

export interface FolderMap {
    sourcePath: string;
    targetAlbumName: string;
}
  
export interface UploadRules {
    imageSize: 'full' | 'high' | 'web';
    compression: number;
    aiTagging: boolean;
    aiCulling: boolean;
}

export interface UploadFile {
    id: string;
    file: File;
    status: 'queued' | 'uploading' | 'success' | 'failed';
    progress: number;
    error?: string;
}

export interface UploadState {
    step: 0 | 1 | 2 | 3 | 4 | 5;
    mode: UploadMode;
    projectDetails: ProjectDetails;
    detectedFolders: DetectedFolder[];
    folderMap: FolderMap[];
    uploadRules: UploadRules;
    uploadQueue: UploadFile[];
    isUploading: boolean;
}

export interface ServicePackage {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    isPredefined: boolean;
    features: string[];
}

export interface EmailSettings {
  fromAddress: string;
  fromName: string;
  apiKey: string;
}

export interface WhatsAppSettings {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
}

export interface CommunicationSettings {
  email: EmailSettings;
  whatsapp: WhatsAppSettings;
}

export type NotificationType = 'comment' | 'favorite' | 'order' | 'payment' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  context: string;
  timestamp: string;
  isRead: boolean;
  avatarUrl?: string;
}

// Studio User Management Types
export type StudioUserRole = 'admin' | 'manager' | 'editor' | 'viewer';

export interface StudioUserPermissions {
  // Project Management
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canViewProjects: boolean;
  
  // Client Management
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canViewClients: boolean;
  
  // Financial
  canCreateInvoices: boolean;
  canEditInvoices: boolean;
  canDeleteInvoices: boolean;
  canViewInvoices: boolean;
  canViewAnalytics: boolean;
  
  // Content Management
  canUploadPhotos: boolean;
  canEditPhotos: boolean;
  canDeletePhotos: boolean;
  
  // Services & Packages
  canManageServices: boolean;
  canManagePackages: boolean;
  
  // Studio Settings
  canManageSettings: boolean;
  canManageUsers: boolean;
  canManageBranding: boolean;
  
  // Communication
  canSendNotifications: boolean;
  canManageCommunication: boolean;
}

export interface StudioUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: StudioUserRole;
  permissions: StudioUserPermissions;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}