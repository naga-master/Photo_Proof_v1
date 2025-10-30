import React, { useState, useEffect } from 'react';
import type { Album, Client, Photo, UserRole, CartItem, Product, ProjectDetails, UploadFile, LayoutId, ServicePackage, Invoice, InvoiceTemplateId } from './types';
import CoverPage from './components/CoverPage';
import GalleryPage from './components/GalleryPage';
import AlbumsPage from './components/AlbumsPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import TopNavBar from './components/TopNavBar';
import StorePage from './components/StorePage';
import AboutPage from './components/AboutPage';
import ProductDetailPage from './components/store/ProductDetailPage';
import PhotoSelectionPage from './components/store/PhotoSelectionPage';
import CartConfigPage from './components/store/CartConfigPage';
import ShoppingCartPage from './components/store/ShoppingCartPage';
import CheckoutPage from './components/store/CheckoutPage';
import OrderConfirmationPage from './components/store/OrderConfirmationPage';

import { albums as initialAlbums } from './data/albums';
import { clients as initialClients } from './data/clients';
import { initialPackages } from './data/services';

type Page = 'login' | 'cover' | 'albums' | 'gallery' | 'dashboard' | 'store' | 'about' | 'productDetail' | 'photoSelection' | 'cartConfig' | 'cart' | 'checkout' | 'orderConfirmation';

const App: React.FC = () => {
    // State
    const [page, setPage] = useState<Page>('login');
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [selections, setSelections] = useState<number[]>([]);
    const [allAlbums, setAllAlbums] = useState<Album[]>(initialAlbums);
    const [allClients, setAllClients] = useState<Client[]>(initialClients);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>(initialPackages);
    const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

    // Store state
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [photosForProduct, setPhotosForProduct] = useState<Photo[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Toast state
    const [toast, setToast] = useState<string | null>(null);
    
    // Studio Branding State
    const [defaultLayoutId, setDefaultLayoutId] = useState<LayoutId>('layout1');
    const [logo, setLogo] = useState<string | null>(null);
    const [brandColor, setBrandColor] = useState('#2D3748'); // A slightly softer dark gray
    const [typography, setTypography] = useState('System Default (Inter & Cormorant)');
    const [defaultTemplateId, setDefaultTemplateId] = useState<InvoiceTemplateId>('modern');

    // Effect for toast messages
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string) => {
        setToast(message);
    };

    // Handlers
    const handleLogin = (role: UserRole) => {
        setUserRole(role);
        if (role === 'studio') {
            setPage('dashboard');
        } else {
            setPage('cover');
        }
    };

    const handleLogout = () => {
        setUserRole(null);
        setPage('login');
    };

    const handleOpenGallery = (album?: Album) => {
        if (album) {
            setCurrentAlbum(album);
        } else {
            setCurrentAlbum(allAlbums[0]);
        }
        setPage('gallery');
    };

    const handleSelectAlbum = (album: Album) => {
        if (album.isLocked && userRole !== 'studio') {
            alert('This gallery is locked. Please contact the studio for access.');
            return;
        }
        setCurrentAlbum(album);
        setPage('gallery');
    };

    const handleBackToAlbums = () => setPage('albums');
    const handleNavigate = (targetPage: 'albums' | 'store' | 'about' | 'cart') => {
        setPage(targetPage);
    };
    
    const handleNavigateToGallery = (album: Album) => {
        setCurrentAlbum(album);
        setPage('gallery');
    };

    const toggleFavorite = (photoId: number) => {
        setFavorites(prev =>
            prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
        );
    };

    const toggleSelection = (photoId: number) => {
        setSelections(prev =>
            prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
        );
    };

    const addComment = (photoId: number, commentText: string, parentId?: number) => {
        if (!currentAlbum) return;
        
        const newAlbums = allAlbums.map(album => {
            if (album.id !== currentAlbum.id) return album;

            const newPhotos = album.photos.map(photo => {
                if (photo.id !== photoId) return photo;

                const newComment: {id: number, author: 'Client' | 'Studio', text: string, timestamp: string, replies?: any[]} = {
                    id: Date.now(),
                    author: userRole === 'studio' ? 'Studio' : 'Client',
                    text: commentText,
                    timestamp: 'Just now'
                };
                
                if (parentId) {
                    const addReply = (comments: any[]): any[] => {
                       return comments.map(c => {
                           if (c.id === parentId) {
                               return { ...c, replies: [...(c.replies || []), newComment] };
                           }
                           if(c.replies) {
                               return { ...c, replies: addReply(c.replies) };
                           }
                           return c;
                       });
                    }
                    return { ...photo, comments: addReply(photo.comments) };
                }

                return { ...photo, comments: [...photo.comments, newComment] };
            });

            return { ...album, photos: newPhotos };
        });
        
        setAllAlbums(newAlbums);
        const updatedAlbum = newAlbums.find(a => a.id === currentAlbum.id);
        if (updatedAlbum) {
            setCurrentAlbum(updatedAlbum);
        }
    };
    
    // Project Management
    const handleProjectCreated = (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]): Album => {
        const newAlbumId = Math.max(...allAlbums.map(a => a.id)) + 1;
        const newPhotos: Photo[] = queue
            .filter(f => f.status === 'success')
            .map((f, i) => ({
                id: Date.now() + i,
                src: URL.createObjectURL(f.file),
                alt: f.file.name,
                width: 800,
                height: 1200,
                comments: []
            }));
        
        const newAlbum: Album = {
            id: newAlbumId,
            title: projectDetails.title || "Untitled Project",
            clientId: parseInt(projectDetails.clientId || '1'),
            shootDate: projectDetails.shootDate,
            coverPhotoSrc: newPhotos[0]?.src || '',
            photoCount: newPhotos.length,
            isLocked: false,
            photos: newPhotos,
            layout: projectDetails.layout || defaultLayoutId,
        };

        setAllAlbums(prev => [...prev, newAlbum]);
        return newAlbum;
    };

    const handleSaveInvoice = (invoice: Invoice) => {
        setAllInvoices(prevInvoices => {
            const index = prevInvoices.findIndex(inv => inv.id === invoice.id);
            if (index > -1) {
                // Update existing invoice
                const newInvoices = [...prevInvoices];
                newInvoices[index] = invoice;
                return newInvoices;
            }
            // Add new invoice
            return [...prevInvoices, invoice];
        });
        showToast(`Invoice ${invoice.invoiceNumber} saved successfully!`);
    };

    // Store Handlers
    const handleSelectProduct = (product: Product) => {
        setCurrentProduct(product);
        setPhotosForProduct([]);
        setPage('productDetail');
    };

    const handleSelectPhotoForProduct = () => {
        setPage('photoSelection');
    };
    
    const handlePhotosSelected = (photos: Photo[]) => {
        setPhotosForProduct(photos);
        if (photos.length === 1 && currentProduct) {
             setPage('cartConfig');
        } else {
            setPage('cartConfig');
        }
    };

    const handleConfigureProduct = () => {
        setPage('cartConfig');
    };

    const handleAddToCart = (items: Omit<CartItem, 'id'>[]) => {
        const newItems: CartItem[] = items.map(item => ({...item, id: `cart_${Date.now()}_${Math.random()}`}));
        setCart(prev => [...prev, ...newItems]);
        setPage('cart');
    };
    
    const handleUpdateCartItem = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveCartItem(itemId);
            return;
        }
        setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveCartItem = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleCheckout = () => setPage('checkout');
    const handleConfirmOrder = () => {
        setCart([]);
        setPage('orderConfirmation');
    };

    const renderPage = () => {
        switch (page) {
            case 'login':
                return <LoginPage onLogin={handleLogin} clients={allClients} />;
            case 'cover':
                return <CoverPage onOpenGallery={() => handleOpenGallery(allAlbums[0])} album={allAlbums[0]} />;
            case 'albums':
                return <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
            case 'gallery':
                if (!currentAlbum) return <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                return <GalleryPage
                    album={currentAlbum}
                    onBack={handleBackToAlbums}
                    favorites={favorites}
                    selections={selections}
                    toggleFavorite={toggleFavorite}
                    toggleSelection={toggleSelection}
                    onAddComment={addComment}
                    onNavigateToStore={() => setPage('store')}
                />;
            case 'dashboard':
                 return <DashboardPage
                    albums={allAlbums}
                    clients={allClients}
                    packages={allPackages}
                    invoices={allInvoices}
                    onUpdateAlbums={setAllAlbums}
                    onUpdateClients={setAllClients}
                    onUpdatePackages={setAllPackages}
                    onSaveInvoice={handleSaveInvoice}
                    onLogout={handleLogout}
                    onNavigateToGallery={handleNavigateToGallery}
                    branding={{
                        logo,
                        brandColor,
                        typography,
                        defaultLayoutId,
                        defaultTemplateId,
                    }}
                    onUpdateBranding={{
                        setLogo,
                        setBrandColor,
                        setTypography,
                        setDefaultLayoutId,
                        setDefaultTemplateId,
                    }}
                 />;
            case 'store':
                return <StorePage onSelectProduct={handleSelectProduct} />;
            case 'about':
                return <AboutPage />;
            case 'productDetail':
                 if (!currentProduct) return <StorePage onSelectProduct={handleSelectProduct} />;
                return <ProductDetailPage
                    product={currentProduct}
                    selectedPhoto={photosForProduct.length > 0 ? photosForProduct[0] : null}
                    onBack={() => setPage('store')}
                    onSelectPhoto={handleSelectPhotoForProduct}
                    onConfigure={handleConfigureProduct}
                />;
            case 'photoSelection':
                if (!currentProduct) return <StorePage onSelectProduct={handleSelectProduct} />;
                return <PhotoSelectionPage 
                    albums={allAlbums} 
                    onPhotosSelect={handlePhotosSelected}
                    onBack={() => setPage('productDetail')}
                    productName={currentProduct.name}
                />;
            case 'cartConfig':
                if (!currentProduct || photosForProduct.length === 0) return <StorePage onSelectProduct={handleSelectProduct} />;
                return <CartConfigPage 
                    product={currentProduct}
                    photos={photosForProduct}
                    onAddToCart={handleAddToCart}
                    onBack={() => setPage('productDetail')}
                />;
            case 'cart':
                return <ShoppingCartPage 
                    cartItems={cart}
                    onUpdateItem={handleUpdateCartItem}
                    onRemoveItem={handleRemoveCartItem}
                    onCheckout={handleCheckout}
                />;
            case 'checkout':
                return <CheckoutPage onConfirm={handleConfirmOrder} onBack={() => setPage('cart')} />;
            case 'orderConfirmation':
                return <OrderConfirmationPage onContinue={() => setPage('store')} />;
            default:
                return <LoginPage onLogin={handleLogin} clients={allClients} />;
        }
    };

    return (
        <>
            {page !== 'login' && page !== 'cover' && page !== 'dashboard' && <TopNavBar onNavigate={handleNavigate} cartCount={cart.length} userRole={userRole} onLogout={handleLogout} />}
            {renderPage()}
            {toast && (
                <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50">
                    {toast}
                </div>
            )}
        </>
    );
};

export default App;