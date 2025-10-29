import React from 'react';
import { storeCategories } from '../data/store';
import { products } from '../data/products';
import type { Product } from '../types';

interface StorePageProps {
  onSelectProduct: (product: Product) => void;
}

const StorePage: React.FC<StorePageProps> = ({ onSelectProduct }) => {
  const handleProductSelect = (categoryId: string) => {
    const product = products.find(p => p.id === categoryId);
    if (product) {
      onSelectProduct(product);
    } else {
      alert(`Product category "${categoryId}" not found.`);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-serif tracking-wider text-gray-800">The Print Shop</h1>
          <p className="mt-2 text-lg text-gray-500">Bring your favorite moments home.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {storeCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleProductSelect(category.id)}
              className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <h2 className="text-2xl font-semibold tracking-wide">{category.name}</h2>
                <p className="text-sm opacity-90 mt-1">Starting from ${category.priceFrom}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
