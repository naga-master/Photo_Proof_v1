import React, { useState } from 'react';
import type { Product, Photo, CartItem, ProductSizeOption, ProductTypeOption } from '../../types';
import { ArrowLeftIcon, PlusIcon, MinusIcon } from '../icons';

interface CartConfigPageProps {
  product: Product;
  photos: Photo[];
  onAddToCart: (items: Omit<CartItem, 'id'>[]) => void;
  onBack: () => void;
}

const CartConfigPage: React.FC<CartConfigPageProps> = ({ product, photos, onAddToCart, onBack }) => {
  const [selectedSize, setSelectedSize] = useState<ProductSizeOption>(product.sizes[0]);
  const [selectedType, setSelectedType] = useState<ProductTypeOption | undefined>(product.types?.[0]);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCartClick = () => {
    if (quantity > 0 && photos.length > 0) {
      const items: Omit<CartItem, 'id'>[] = photos.map(photo => ({
        photo,
        product,
        selectedOption: selectedSize,
        selectedType: selectedType,
        quantity,
      }));
      onAddToCart(items);
    }
  };

  const firstPhoto = photos[0];

  if (!firstPhoto) {
    // Handle case with no photos, maybe show an error or redirect
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center">
            <p className="text-gray-600">No photos selected.</p>
             <button onClick={onBack} className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                <ArrowLeftIcon className="w-4 h-4" />
                Go Back
            </button>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Product Details
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
             <div className="relative">
              <img src={firstPhoto.src} alt={firstPhoto.alt} className="w-full rounded-lg shadow-lg" />
              {photos.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 text-white text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  + {photos.length - 1} more
                </div>
              )}
            </div>
            <p className="text-center mt-2 text-sm text-gray-500">Configuring for {photos.length} photo{photos.length > 1 ? 's' : ''}</p>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-2 text-lg text-gray-500">{product.shortDescription}</p>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-900">Size</h3>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {product.sizes.map((sizeOption) => (
                  <button
                    key={sizeOption.size}
                    onClick={() => setSelectedSize(sizeOption)}
                    className={`p-4 border rounded-md text-sm text-center transition-colors ${selectedSize.size === sizeOption.size ? 'bg-gray-900 border-gray-900' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
                  >
                    <span className={`font-semibold block ${selectedSize.size === sizeOption.size ? 'text-white' : 'text-gray-800'}`}>{sizeOption.size}</span>
                    <span className={`text-xs ${selectedSize.size === sizeOption.size ? 'text-gray-300' : 'text-gray-500'}`}>${sizeOption.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {product.types && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900">Type</h3>
                <div className="mt-2 flex gap-3">
                  {product.types.map((typeOption) => (
                    <button
                      key={typeOption.name}
                      onClick={() => setSelectedType(typeOption)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${selectedType?.name === typeOption.name ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'}`}
                    >
                      <span className={selectedType?.name === typeOption.name ? 'text-white' : 'text-gray-800'}>{typeOption.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-8 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Quantity (per photo)</h3>
                <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors"><MinusIcon className="w-5 h-5"/></button>
                    <span className="px-4 text-lg font-semibold w-16 text-center text-gray-800">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="p-3 text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors"><PlusIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-600">Total Price</span>
                    <span className="text-3xl font-bold text-gray-900">${(selectedSize.price * quantity * photos.length).toFixed(2)}</span>
                 </div>
                <button onClick={handleAddToCartClick} className="w-full bg-gray-800 text-white py-3 rounded-md text-lg font-semibold hover:bg-gray-700 transition-colors">
                    Add {photos.length} Item{photos.length > 1 ? 's' : ''} to Cart
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartConfigPage;