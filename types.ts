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
  id: string;
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
  id: string;
  title: string;
  clientId: string;
  shootDate?: string;
  coverPhotoSrc?: string;
  photoCount: number;
  isLocked: boolean;
  photos?: Photo[];
  folders?: Folder[];
  layout?: LayoutId;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Due';
  price?: number;
  packageId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string | null;
  profilePicture?: string | null;
  whatsappOptIn?: boolean;
  emailOptIn?: boolean;
  projects: string[];  // Array of project IDs for compatibility
  totalProjects?: number;  // Total count from API
  lastActivity?: string;
  status?: string;
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
  productType?: string;
  basePrice?: number;
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
    clientId?: string;
    projectId?: string;
    clientName: string;
    clientAddress: string;
    items: InvoiceItem[];
    notes?: string;
    subtotal: number;
    tax: number;
    total: number;
    status: InvoiceStatus;
    template: InvoiceTemplateId;
    createdAt?: string;
    updatedAt?: string;
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
    targetId?: string; // Backend folder ID after folder creation
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
    photoId?: string;  // Backend photo ID after successful upload
    folderPath?: string;
    error?: string;
}

export interface UploadState {
    step: 0 | 1 | 2 | 3 | 4 | 5;
    mode: UploadMode;
    projectDetails: ProjectDetails;
    backendProjectId?: string;  // Backend project ID created before uploads
    detectedFolders: DetectedFolder[];
    folderMap: FolderMap[];
    uploadRules: UploadRules;
    uploadQueue: UploadFile[];
    isUploading: boolean;
}

export interface ServicePackageFeatureItem {
    name: string;
    included: boolean;
    details?: string | null;
}

export interface ServicePackage {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    isPredefined?: boolean;
    features: ServicePackageFeatureItem[];
    deliverables?: string[];
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

// Analytics Types
export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number; // percentage
  projectedRevenue: number;
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  clientRetentionRate: number; // percentage
  averageClientValue: number;
}

export interface ProjectMetrics {
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  averageProjectValue: number;
  projectsThisMonth: number;
  completionRate: number; // percentage
}

export interface InvoiceMetrics {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number; // days
}

export interface PackagePerformance {
  packageId: string;
  packageName: string;
  bookings: number;
  revenue: number;
  popularity: number; // percentage
}

export interface MonthlyData {
  month: string;
  revenue: number;
  projects: number;
  clients: number;
}

export interface TopClient {
  id: number;
  name: string;
  email: string;
  totalSpent: number;
  projectCount: number;
  avatarUrl?: string;
}

export interface AnalyticsData {
  revenue: RevenueMetrics;
  clients: ClientMetrics;
  projects: ProjectMetrics;
  invoices: InvoiceMetrics;
  packagePerformance: PackagePerformance[];
  monthlyTrends: MonthlyData[];
  topClients: TopClient[];
}

// Billing & Payment Configuration Types
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'wallet';

export interface TaxConfiguration {
  enableGST: boolean;
  gstPercentage: number;
  gstNumber?: string;
  enableAdditionalTax: boolean;
  additionalTaxName?: string;
  additionalTaxPercentage?: number;
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  enabled: boolean;
  displayName: string;
  description: string;
  config?: {
    // For Bank Transfer
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    
    // For UPI
    upiId?: string;
    qrCodeUrl?: string;
    
    // For Card (Payment Gateway)
    merchantId?: string;
    apiKey?: string;
    gatewayName?: string;
    
    // For Wallet
    walletProvider?: string;
    walletNumber?: string;
  };
}

export interface BillingConfiguration {
  tax: TaxConfiguration;
  paymentMethods: PaymentMethodConfig[];
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  invoiceNumbering: 'auto' | 'manual';
  paymentTermsDays: number;
  latePaymentFeePercentage?: number;
  enablePartialPayments: boolean;
}