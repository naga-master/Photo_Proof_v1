import React, { useState, useEffect } from 'react';
import type { Album, Photo, UserRole, Product, CartItem, Comment } from './types';

import { albums as initialAlbums } from './data/albums';
import { products } from './data/products';

import LoginPage from './components/LoginPage';
import StudioLayout from './components/studio/StudioLayout';
import TopNavBar from './components/TopNavBar';
import AlbumsPage from './components/AlbumsPage';
import GalleryPage from './components/GalleryPage';
import AboutPage from './components/AboutPage';
import StorePage from './components/StorePage';
import ProductDetailPage from './components/store/ProductDetailPage';
import PhotoSelectionPage from './components/store/PhotoSelectionPage';
import CartConfigPage from './components/store/CartConfigPage';
import ShoppingCartPage from './components/store/ShoppingCartPage';
import CheckoutPage from './components/store/CheckoutPage';
import OrderConfirmationPage from './components/store/OrderConfirmationPage';

type Page =
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'albums' }
  | { name: 'gallery'; album: Album }
  | { name: 'about' }
  | { name: 'store' }
  | { name: 'productDetail'; product: Product }
  | { name: 'photoSelection'; product: Product }
  | { name: 'cartConfig'; product: Product; photos: Photo[] }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'orderConfirmation' };

const App: React.FC = () => {
  const [page, setPage] = useState<Page>({ name: 'login' });
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [albumsData, setAlbumsData] = useState<Album[]>(initialAlbums);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selections, setSelections] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Track the item being configured for the store across pages
  const [storeFlowPhoto, setStoreFlowPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    // This effect handles routing redirects based on login status.
    // It should ONLY run when userRole changes.
    if (userRole === 'studio') {
      setPage({ name: 'dashboard' });
    } else if (userRole === 'client') {
      setPage({ name: 'albums' });
    } else { // userRole is null (logged out)
      const currentPageName = page.name;
      // If the user is on a protected page, redirect them to the login screen.
      const protectedPages: Page['name'][] = ['dashboard', 'albums', 'gallery', 'store', 'productDetail', 'photoSelection', 'cartConfig', 'cart', 'checkout'];
      if (protectedPages.includes(currentPageName)) {
        setPage({ name: 'login' });
      }
    }
  }, [userRole]);

  // Handlers
  const handleLogin = (role: UserRole) => setUserRole(role);
  const handleLogout = () => setUserRole(null);
  
  const handleNavigate = (pageName: 'albums' | 'store' | 'about' | 'cart') => {
    setPage({ name: pageName });
  };

  const handleSelectAlbum = (album: Album) => {
    if (!album.isLocked) {
      setPage({ name: 'gallery', album });
    } else {
      alert('This album is locked.');
    }
  };
  
  const toggleFavorite = (photoId: number) => {
    setFavorites(favs => favs.includes(photoId) ? favs.filter(id => id !== photoId) : [...favs, photoId]);
  };
  
  const toggleSelection = (photoId: number) => {
    setSelections(sels => sels.includes(photoId) ? sels.filter(id => id !== photoId) : [...sels, photoId]);
  };

  const handleAddComment = (photoId: number, commentText: string, parentId?: number) => {
    const newComment: Comment = {
      id: Date.now(),
      author: userRole === 'studio' ? 'Studio' : 'Client',
      text: commentText,
      timestamp: 'Just now',
      replies: []
    };
  
    const updatedAlbums = albumsData.map(album => ({
      ...album,
      photos: album.photos.map(photo => {
        if (photo.id === photoId) {
          const comments = photo.comments || [];
          if (parentId) {
            const findAndAddReply = (comments: Comment[]): Comment[] => {
                return comments.map(c => {
                    if (c.id === parentId) {
                        return { ...c, replies: [...(c.replies || []), newComment] };
                    }
                    if (c.replies) {
                        return { ...c, replies: findAndAddReply(c.replies) };
                    }
                    return c;
                });
            };
            return { ...photo, comments: findAndAddReply(comments) };
          } else {
            return { ...photo, comments: [...comments, newComment] };
          }
        }
        return photo;
      })
    }));
    setAlbumsData(updatedAlbums);
  };

  const handleSelectProduct = (product: Product) => {
    setPage({ name: 'productDetail', product });
  };
  
  const handleNavigateToStoreFromPhoto = (photo: Photo) => {
      setStoreFlowPhoto(photo);
      setPage({ name: 'store' });
  };
  
  const handleAddToCart = (items: Omit<CartItem, 'id'>[]) => {
    const newCartItems = [...cartItems];

    items.forEach(newItemToAdd => {
        const newItem: CartItem = { ...newItemToAdd, id: `${newItemToAdd.photo.id}-${newItemToAdd.product.id}-${newItemToAdd.selectedOption.size}-${newItemToAdd.selectedType?.name || ''}` };
        
        const existingItemIndex = newCartItems.findIndex(cartItem => cartItem.id === newItem.id);
        if (existingItemIndex > -1) {
            const existingItem = newCartItems[existingItemIndex];
            newCartItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + newItem.quantity };
        } else {
            newCartItems.push(newItem);
        }
    });

    setCartItems(newCartItems);
    setStoreFlowPhoto(null);
    setPage({ name: 'cart' });
  };


  const handleUpdateCartItem = (itemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
          handleRemoveCartItem(itemId);
      } else {
          setCartItems(cartItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
      }
  };

  const handleRemoveCartItem = (itemId: string) => {
      setCartItems(cartItems.filter(item => item.id !== itemId));
  };
  
  const handleConfirmOrder = () => {
      setCartItems([]);
      setPage({name: 'orderConfirmation'});
  };


  const renderPage = () => {
    const showNavBar = userRole === 'client' && page.name !== 'login' && page.name !== 'dashboard';
    
    const pageContent = () => {
        switch (page.name) {
          case 'login':
            return <LoginPage onLogin={handleLogin} />;
          case 'dashboard':
            return <StudioLayout albums={albumsData} onLogout={handleLogout} />;
          case 'albums':
            return <AlbumsPage albums={albumsData} onSelectAlbum={handleSelectAlbum} />;
          case 'gallery':
            return <GalleryPage 
              album={page.album} 
              onBack={() => setPage({ name: 'albums' })}
              favorites={favorites}
              selections={selections}
              toggleFavorite={toggleFavorite}
              toggleSelection={toggleSelection}
              onAddComment={handleAddComment}
              onNavigateToStore={() => setPage({name: 'store'})}
            />;
          case 'about':
            return <AboutPage />;
          case 'store':
            return <StorePage onSelectProduct={handleSelectProduct} />;
          case 'productDetail':
            return <ProductDetailPage
              product={page.product}
              selectedPhoto={storeFlowPhoto}
              onBack={() => { setStoreFlowPhoto(null); setPage({ name: 'store' }); }}
              onSelectPhoto={() => setPage({ name: 'photoSelection', product: page.product })}
              onConfigure={() => {
                if(storeFlowPhoto) {
                  setPage({ name: 'cartConfig', product: page.product, photos: [storeFlowPhoto] });
                }
              }}
            />;
          case 'photoSelection':
            return <PhotoSelectionPage
              albums={albumsData}
              productName={page.product.name}
              onBack={() => setPage({ name: 'productDetail', product: page.product })}
              onPhotosSelect={(photos) => {
                setStoreFlowPhoto(photos.length > 0 ? photos[0] : null);
                setPage({ name: 'cartConfig', product: page.product, photos });
              }}
            />;
          case 'cartConfig':
            return <CartConfigPage
                product={page.product}
                photos={page.photos}
                onBack={() => {
                    setStoreFlowPhoto(null); // Reset flow if they go back
                    setPage({ name: 'productDetail', product: page.product });
                }}
                onAddToCart={handleAddToCart}
            />
          case 'cart':
            return <ShoppingCartPage
                cartItems={cartItems}
                onUpdateItem={handleUpdateCartItem}
                onRemoveItem={handleRemoveCartItem}
                onCheckout={() => setPage({ name: 'checkout' })}
            />;
          case 'checkout':
            return <CheckoutPage onBack={() => setPage({ name: 'cart'})} onConfirm={handleConfirmOrder} />
          case 'orderConfirmation':
            return <OrderConfirmationPage onContinue={() => setPage({ name: 'store' })} />
          default:
            return <LoginPage onLogin={handleLogin} />;
        }
    };
    
    return (
        <>
            {showNavBar && <TopNavBar onNavigate={handleNavigate} cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} userRole={userRole} onLogout={handleLogout}/>}
            {pageContent()}
        </>
    );
  };
  
  return renderPage();
};

export default App;