import React from 'react';
import type { Album, Client, Invoice, LayoutId, ServicePackage, InvoiceTemplateId, CommunicationSettings } from '../types';
import StudioLayout from './studio/StudioLayout';

interface DashboardPageProps {
  albums: Album[];
  clients: Client[];
  packages: ServicePackage[];
  invoices: Invoice[];
  onUpdateAlbums: (albums: Album[]) => void;
  onUpdateClients: (clients: Client[]) => void;
  onUpdatePackages: (packages: ServicePackage[]) => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => Promise<void>;
  onLogout: () => void;
  onNavigateToGallery: (album: Album) => void;
  branding: {
    logo: string | null;
    brandColor: string;
    typography: string;
    defaultLayoutId: LayoutId;
    defaultTemplateId: InvoiceTemplateId;
    studioPhoto: string | null;
    studioDescription: string;
    studioDisplayImage: string | null;
  };
  onUpdateBranding: {
    setLogo: (logo: string | null) => void;
    setBrandColor: (color: string) => void;
    setTypography: (font: string) => void;
    setDefaultLayoutId: (layoutId: LayoutId) => void;
    setDefaultTemplateId: (templateId: InvoiceTemplateId) => void;
    setStudioPhoto: (photo: string | null) => void;
    setStudioDescription: (description: string) => void;
    setStudioDisplayImage: (image: string | null) => void;
  };
  communicationSettings: CommunicationSettings;
  onUpdateCommunicationSettings: (settings: CommunicationSettings) => void;
  returnToProject?: Album | null;
  onReturnToDashboard: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  return (
    <StudioLayout {...props} />
  );
};

export default DashboardPage;