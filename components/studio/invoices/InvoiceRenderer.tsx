import React from 'react';
import type { Invoice } from '../../../types';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import MinimalistTemplate from './templates/MinimalistTemplate';

interface InvoiceRendererProps {
    invoice: Invoice;
    logo: string | null;
    brandColor: string;
}

const InvoiceRenderer: React.FC<InvoiceRendererProps> = (props) => {
    const { invoice } = props;

    switch (invoice.template) {
        case 'modern':
            return <ModernTemplate {...props} />;
        case 'classic':
            return <ClassicTemplate {...props} />;
        case 'minimalist':
            return <MinimalistTemplate {...props} />;
        default:
            return <ModernTemplate {...props} />;
    }
};

export default InvoiceRenderer;