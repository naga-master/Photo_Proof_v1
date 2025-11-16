
import React, { useState } from 'react';
import type { Product, Photo } from '../../types';
import { ArrowLeftIcon } from '../icons';
import WallPreview from './WallPreview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ProductDetailPageProps {
  product: Product;
  selectedPhoto: Photo | null;
  onBack: () => void;
  onSelectPhoto: () => void;
  onConfigure: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, selectedPhoto, onBack, onSelectPhoto, onConfigure }) => {
  // Helper function to get full image URL
  const getImageUrl = (imagePath: string) => {
    return imagePath.startsWith('data/') ? `${API_URL}/uploads/${imagePath}` : imagePath;
  };
  
  const [activeMockup, setActiveMockup] = useState(getImageUrl(product.mockupImages[0]));
  
  const handleNextStep = () => {
      if (selectedPhoto) {
          onConfigure();
      } else {
          onSelectPhoto();
      }
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Store
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Preview Section */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {selectedPhoto ? (
                    <WallPreview photo={selectedPhoto} mockupSrc={activeMockup} />
                ) : (
                    <img src={activeMockup} alt="Product preview" className="w-full h-full object-contain" />
                )}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
                {product.mockupImages.map(src => {
                    const fullUrl = getImageUrl(src);
                    return (
                        <button key={src} onClick={() => setActiveMockup(fullUrl)} className={`aspect-square rounded-md overflow-hidden ring-2 transition-all ${activeMockup === fullUrl ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-200'}`}>
                            {selectedPhoto ? (
                                <WallPreview photo={selectedPhoto} mockupSrc={fullUrl} isThumbnail />
                            ) : (
                                <img src={fullUrl} alt="thumbnail" className="w-full h-full object-contain"/>
                            )}
                        </button>
                    );
                })}
            </div>
          </div>

          {/* Product Details Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-2 text-lg text-gray-500">{product.shortDescription}</p>
            <p className="mt-4 text-3xl font-semibold text-gray-900">${product.sizes[0].price.toFixed(2)}+</p>

            <div className="mt-8 prose text-gray-600">
                <p>{product.detailedDescription}</p>
            </div>
            
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800">Specifications</h3>
                <ul className="mt-2 space-y-2 text-gray-600 list-disc list-inside">
                    {Object.entries(product.specs).map(([key, value]) => (
                        <li key={key}><span className="font-medium text-gray-800">{key}:</span> {value}</li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-10">
                <button onClick={handleNextStep} className="w-full bg-gray-800 text-white py-3 rounded-md text-lg font-semibold hover:bg-gray-700 transition-colors">
                    {selectedPhoto ? 'Customize & Add to Cart' : 'Select a Photo to Continue'}
                </button>
                 {selectedPhoto && (
                    <button onClick={onSelectPhoto} className="w-full text-center mt-2 text-sm text-blue-600 hover:underline">
                        Change Photo
                    </button>
                 )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
