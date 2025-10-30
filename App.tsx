import React, { useState, useEffect } from 'react';
import type { Album, Photo, Comment, UserRole, Product, CartItem, ProjectDetails, UploadFile, Client } from './types';
import { albums as initialAlbums } from './data/albums';
import { clients as initialClients } from './data/clients';
import { products } from './data/products';
import CoverPage from './components/CoverPage';
import AlbumsPage from './components/AlbumsPage';
import GalleryPage from './components/GalleryPage';
import TopNavBar from './components/TopNavBar';
import StorePage from './components/StorePage';
import AboutPage from './components/AboutPage';
import LoginPage from './components/LoginPage';
import StudioLayout from './components/studio/StudioLayout';
import ProductDetailPage from './components/store/ProductDetailPage';
import PhotoSelectionPage from './components/store/PhotoSelectionPage';
import CartConfigPage from './components/store/CartConfigPage';
import ShoppingCartPage from './components/store/ShoppingCartPage';
import CheckoutPage from './components/store/CheckoutPage';
import OrderConfirmationPage from './components/store/OrderConfirmationPage';

type Page = 'cover' | 'albums' | 'gallery' | 'store' | 'about' | 'cart' | 'login' | 'studio' | 'product-detail' | 'photo-selection' | 'cart-config' | 'checkout' | 'order-confirmation' | 'album-cover';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('cover');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selections, setSelections] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [photosForProduct, setPhotosForProduct] = useState<Photo[]>([]);
  const [returnTo, setReturnTo] = useState<{ page: 'studio', view: any } | null>(null);


  // Simple routing based on currentPage
  const navigate = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };
  
  useEffect(() => {
    if (userRole === 'studio') {
      navigate('studio');
    } else if (userRole === 'client') {
      navigate('albums');
    }
  }, [userRole]);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
    navigate('cover');
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    navigate('album-cover');
  };
  
  const handleOpenGalleryFromCover = () => {
      if (selectedAlbum) {
          navigate('gallery');
      }
  }

  const toggleFavorite = (photoId: number) => {
    setFavorites(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };

  const toggleSelection = (photoId: number) => {
    setSelections(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };
  
  const handleAddComment = (photoId: number, commentText: string, parentId?: number) => {
    setAlbums(prevAlbums => {
        return prevAlbums.map(album => ({
            ...album,
            photos: album.photos.map(photo => {
                if (photo.id === photoId) {
                    const newComment: Comment = {
                        id: Date.now(),
                        author: 'Client',
                        text: commentText,
                        timestamp: "Just now",
                    };
                    
                    const addReply = (comments: Comment[]): Comment[] => {
                        return comments.map(c => {
                            if (c.id === parentId) {
                                return { ...c, replies: [...(c.replies || []), newComment] };
                            }
                            if (c.replies) {
                                return { ...c, replies: addReply(c.replies) };
                            }
                            return c;
                        });
                    };

                    if (parentId) {
                        return { ...photo, comments: addReply(photo.comments) };
                    } else {
                        return { ...photo, comments: [...photo.comments, newComment] };
                    }
                }
                return photo;
            })
        }));
    });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setPhotosForProduct([]);
    navigate('product-detail');
  };

  const handlePhotosSelectForProduct = (photos: Photo[]) => {
    setPhotosForProduct(photos);
    navigate('cart-config');
  };

  const handleAddToCart = (items: Omit<CartItem, 'id'>[]) => {
      const newItems = items.map(item => ({ ...item, id: `${item.photo.id}-${item.product.id}-${item.selectedOption.size}-${Date.now()}` }));
      setCart(prev => [...prev, ...newItems]);
      navigate('cart');
  };
  
  const handleUpdateCartItem = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveCartItem(itemId);
    } else {
        setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    }
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };
  
  const handleCheckout = () => {
    navigate('checkout');
  };

  const handleOrderConfirmed = () => {
    setCart([]);
    navigate('order-confirmation');
  }

  const handleCreateClient = (clientDetails: Omit<Client, 'id' | 'projects' | 'lastActivity'>) => {
    const newClient: Client = {
      ...clientDetails,
      id: clients.length + 1,
      projects: [],
      lastActivity: 'Just added',
      avatarUrl: clientDetails.avatarUrl || `https://i.pravatar.cc/150?u=${clientDetails.email}`
    };
    setClients(prev => [...prev, newClient]);
  }

  const handleProjectCreated = (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]): Album => {
      let finalClientId: number;
      
      if (projectDetails.clientId === 'new' && projectDetails.newClientDetails) {
          const newClient: Client = {
              id: clients.length + 1,
              name: `${projectDetails.newClientDetails.firstName} ${projectDetails.newClientDetails.lastName}`,
              email: projectDetails.newClientDetails.email,
              phone: projectDetails.newClientDetails.phone,
              projects: [],
              lastActivity: 'Just added',
              avatarUrl: `https://i.pravatar.cc/150?u=${projectDetails.newClientDetails.email}`,
          };
          setClients(prev => [...prev, newClient]);
          finalClientId = newClient.id;
      } else {
          finalClientId = parseInt(projectDetails.clientId || '0', 10);
      }
      
      const newAlbum: Album = {
          id: albums.length + 1,
          title: projectDetails.title || 'New Project',
          clientId: finalClientId,
          shootDate: projectDetails.shootDate,
          isLocked: true,
          coverPhotoSrc: queue.length > 0 ? URL.createObjectURL(queue[0].file) : 'https://picsum.photos/800/600',
          photoCount: queue.length,
          photos: queue.map((f, i) => ({
              id: Date.now() + i,
              src: URL.createObjectURL(f.file),
              alt: f.file.name,
              width: 800,
              height: 600,
              comments: [],
          }))
      };
      setAlbums(prev => [...prev, newAlbum]);
      
      // Also update the client's project list
      setClients(prevClients => prevClients.map(c => c.id === finalClientId ? { ...c, projects: [...c.projects, newAlbum.id] } : c));
      
      return newAlbum;
  };

  const handleUpdateProject = (updatedAlbum: Album) => {
    setAlbums(albums.map(a => a.id === updatedAlbum.id ? updatedAlbum : a));
    // Handle client change
    const originalAlbum = albums.find(a => a.id === updatedAlbum.id);
    if (originalAlbum && originalAlbum.clientId !== updatedAlbum.clientId) {
        setClients(prevClients => prevClients.map(c => {
            if (c.id === originalAlbum.clientId) { // remove from old client
                return { ...c, projects: c.projects.filter(pId => pId !== updatedAlbum.id) };
            }
            if (c.id === updatedAlbum.clientId) { // add to new client
                return { ...c, projects: [...c.projects, updatedAlbum.id] };
            }
            return c;
        }));
    }
  };

  const handleDeleteProject = (albumId: number) => {
    const albumToDelete = albums.find(a => a.id === albumId);
    if (!albumToDelete) return;

    setAlbums(albums.filter(a => a.id !== albumId));
    setClients(prevClients => prevClients.map(c => {
        if (c.id === albumToDelete.clientId) {
            return { ...c, projects: c.projects.filter(pId => pId !== albumId) };
        }
        return c;
    }));
  };

  const handleViewGalleryFromStudio = (album: Album, returnToView: { page: 'studio', view: any }) => {
    setReturnTo(returnToView);
    handleSelectAlbum(album);
  }

  const handleBackToStudio = () => {
    if (returnTo) {
      setCurrentPage(returnTo.page);
    }
  }

  const renderPage = () => {
    if (!userRole) {
        // Public pages
        switch (currentPage) {
          case 'cover': return <CoverPage onOpenGallery={() => navigate('login')} />;
          case 'login': return <LoginPage onLogin={handleLogin} />;
          default: return <LoginPage onLogin={handleLogin} />;
        }
    }
    
    // Authenticated pages
    const mainContent = (() => {
      switch (currentPage) {
        case 'studio': return <StudioLayout
          initialState={returnTo?.view}
          albums={albums}
          clients={clients}
          onLogout={handleLogout}
          onCreateClient={handleCreateClient}
          onProjectCreated={handleProjectCreated}
          onViewGallery={(album, returnView) => handleViewGalleryFromStudio(album, { page: 'studio', view: returnView })}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />;
        case 'albums': return <AlbumsPage albums={albums} onSelectAlbum={handleSelectAlbum} />;
        case 'album-cover': return selectedAlbum && <CoverPage album={selectedAlbum} onOpenGallery={handleOpenGalleryFromCover} />;
        case 'gallery': 
          const onBackAction = returnTo ? handleBackToStudio : () => navigate('album-cover');
          return selectedAlbum && <GalleryPage album={selectedAlbum} onBack={onBackAction} favorites={favorites} selections={selections} toggleFavorite={toggleFavorite} toggleSelection={toggleSelection} onAddComment={handleAddComment} onNavigateToStore={() => navigate('store')} isStudioPreview={!!returnTo} />;
        case 'store': return <StorePage onSelectProduct={handleSelectProduct} />;
        case 'about': return <AboutPage />;
        case 'product-detail': return selectedProduct && <ProductDetailPage product={selectedProduct} selectedPhoto={photosForProduct[0]} onBack={() => navigate('store')} onSelectPhoto={() => navigate('photo-selection')} onConfigure={() => navigate('cart-config')} />;
        case 'photo-selection': return selectedProduct && <PhotoSelectionPage albums={albums} onPhotosSelect={handlePhotosSelectForProduct} onBack={() => navigate('product-detail')} productName={selectedProduct.name} />;
        case 'cart-config': return selectedProduct && photosForProduct.length > 0 && <CartConfigPage product={selectedProduct} photos={photosForProduct} onAddToCart={handleAddToCart} onBack={() => navigate('product-detail')} />;
        case 'cart': return <ShoppingCartPage cartItems={cart} onUpdateItem={handleUpdateCartItem} onRemoveItem={handleRemoveCartItem} onCheckout={handleCheckout} />;
        case 'checkout': return <CheckoutPage onConfirm={handleOrderConfirmed} onBack={() => navigate('cart')} />;
        case 'order-confirmation': return <OrderConfirmationPage onContinue={() => navigate('store')} />;
        default: return <AlbumsPage albums={albums} onSelectAlbum={handleSelectAlbum} />;
      }
    })();

    if (currentPage === 'studio' || currentPage === 'album-cover') {
        return mainContent;
    }

    return (
        <>
            <TopNavBar onNavigate={navigate} cartCount={cart.length} userRole={userRole} onLogout={handleLogout}/>
            {mainContent}
        </>
    );
  };

  return <div className="App">{renderPage()}</div>;
};

export default App;
