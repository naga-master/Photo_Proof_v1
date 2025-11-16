import React, { useEffect, useMemo, useState } from 'react';
import type { Product } from '../types';
import { productService } from '../services/productService';
import type { Product as BackendProduct } from '../services/productService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FALLBACK_IMAGE = '/placeholder-image.jpg';

const mapBackendProduct = (product: BackendProduct): Product => {
  const shortDescription = (product as any).short_description ?? product.description ?? '';
  const detailedDescription = (product as any).detailed_description ?? product.description ?? '';
  const specs = (product as any).specs ?? {};
  const mockupImages = (product as any).mockup_images ?? [];
  const basePriceValue = typeof product.base_price === 'number' ? product.base_price : Number(product.base_price ?? 0);
  const sizeOptions = (product.options || [])
    .filter(option => option.option_type === 'size')
    .map(option => ({
      size: option.name,
      price: basePriceValue + Number(option.price_modifier ?? 0),
    }));

  const typeOptions = (product.options || [])
    .filter(option => option.option_type === 'type')
    .map(option => ({ name: option.name }));

  const fallbackSizes = sizeOptions.length > 0 ? sizeOptions : [{ size: 'Standard', price: basePriceValue }];

  return {
    id: product.id,
    name: product.name,
    shortDescription,
    detailedDescription,
    specs,
    sizes: fallbackSizes,
    types: typeOptions.length > 0 ? typeOptions : undefined,
    mockupImages,
    productType: (product as any).product_type ?? product.product_type,
    basePrice: basePriceValue,
  };
};

interface StorePageProps {
  onSelectProduct: (product: Product) => void;
}

const StorePage: React.FC<StorePageProps> = ({ onSelectProduct }) => {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productService.getProducts();
        const mapped = response.products.map(mapBackendProduct);
        setCatalog(mapped);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Unable to load products. Please try again later.');
        setCatalog([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const displayProducts = useMemo(() => catalog.sort((a, b) => a.name.localeCompare(b.name)), [catalog]);
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-serif tracking-wider text-gray-800">The Print Shop</h1>
          <p className="mt-2 text-lg text-gray-500">Bring your favorite moments home.</p>
        </header>
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-500">Loading products...</div>
        )}

        {!isLoading && error && (
          <div className="max-w-3xl mx-auto mb-10 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
            {error}
          </div>
        )}

        {!isLoading && !error && displayProducts.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-500">No products available at the moment.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map((product) => {
            const priceFrom = product.sizes[0]?.price ?? product.basePrice ?? 0;
            const rawImage = product.mockupImages[0] ?? FALLBACK_IMAGE;
            // Add API URL prefix if it's a local image path
            const coverImage = rawImage.startsWith('data/') ? `${API_URL}/uploads/${rawImage}` : rawImage;
            const productType = product.productType ? product.productType.replace(/_/g, ' ') : 'Product';

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={coverImage}
                  alt={product.name}
                  className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                  <h2 className="text-2xl font-semibold tracking-wide">{product.name}</h2>
                  <p className="text-sm opacity-90 mt-1">{productType}</p>
                  <p className="text-sm opacity-90 mt-1">Starting from ₹{priceFrom.toLocaleString('en-IN')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
