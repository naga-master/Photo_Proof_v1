
import React, { useState, useEffect } from 'react';
// Fix: Import Transition type from framer-motion.
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';

import type { Album, Client, Photo, UserRole, CartItem, Product, ProjectDetails, UploadFile, LayoutId, ServicePackage, Invoice, InvoiceTemplateId, CommunicationSettings } from './types';
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

const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
};

// Fix: Add explicit Transition type to prevent type inference issues.
const pageTransition: Transition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
};

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
    
    // Studio Branding State
    const [defaultLayoutId, setDefaultLayoutId] = useState<LayoutId>('layout1');
    const [logo, setLogo] = useState<string | null>('/logo-placeholder.svg');
    const [brandColor, setBrandColor] = useState('#1e293b'); // slate-800
    const [typography, setTypography] = useState('System Default (Inter & Cormorant)');
    const [defaultTemplateId, setDefaultTemplateId] = useState<InvoiceTemplateId>('modern');
    
    // Communication Settings
    const [communicationSettings, setCommunicationSettings] = useState<CommunicationSettings>({
      email: { fromAddress: '', fromName: '', apiKey: '' },
      whatsapp: { phoneNumberId: '', businessAccountId: '', accessToken: '' }
    });

    // Handlers
    const handleLogin = (role: UserRole) => {
        setUserRole(role);
        if (role === 'studio') {
            setPage('dashboard');
        } else {
            setPage('cover');
        }
        toast.success(`Welcome! You are now logged in.`);
    };

    const handleLogout = () => {
        setUserRole(null);
        setPage('login');
        toast.info("You have been successfully logged out.");
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
            toast.warn('This gallery is locked. Please contact the studio for access.');
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
                const newInvoices = [...prevInvoices];
                newInvoices[index] = invoice;
                return newInvoices;
            }
            return [...prevInvoices, invoice];
        });
        toast.success(`Invoice ${invoice.invoiceNumber} saved successfully!`);
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
        toast.success(`${items.length} item(s) added to your cart!`);
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
        const key = page + (currentAlbum?.id || '') + (currentProduct?.id || '');
        let component;
        switch (page) {
            case 'login':
                component = <LoginPage onLogin={handleLogin} clients={allClients} />;
                break;
            case 'cover':
                component = <CoverPage onOpenGallery={() => handleOpenGallery(allAlbums[0])} album={allAlbums[0]} />;
                break;
            case 'albums':
                component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                break;
            case 'gallery':
                if (!currentAlbum) {
                    component = <AlbumsPage albums={allAlbums} onSelectAlbum={handleSelectAlbum} />;
                } else {
                    component = <GalleryPage
                        album={currentAlbum}
                        onBack={handleBackToAlbums}
                        favorites={favorites}
                        selections={selections}
                        toggleFavorite={toggleFavorite}
                        toggleSelection={toggleSelection}
                        onAddComment={addComment}
                        onNavigateToStore={() => setPage('store')}
                    />;
                }
                break;
            case 'dashboard':
                 component = <DashboardPage
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
                    communicationSettings={communicationSettings}
                    onUpdateCommunicationSettings={setCommunicationSettings}
                 />;
                 break;
            case 'store':
                component = <StorePage onSelectProduct={handleSelectProduct} />;
                break;
            case 'about':
                component = <AboutPage />;
                break;
            case 'productDetail':
                 if (!currentProduct) {
                    component = <StorePage onSelectProduct={handleSelectProduct} />;
                 } else {
                    component = <ProductDetailPage
                        product={currentProduct}
                        selectedPhoto={photosForProduct.length > 0 ? photosForProduct[0] : null}
                        onBack={() => setPage('store')}
                        onSelectPhoto={handleSelectPhotoForProduct}
                        onConfigure={handleConfigureProduct}
                    />;
                 }
                break;
            case 'photoSelection':
                if (!currentProduct) {
                     component = <StorePage onSelectProduct={handleSelectProduct} />;
                } else {
                     component = <PhotoSelectionPage 
                        albums={allAlbums} 
                        onPhotosSelect={handlePhotosSelected}
                        onBack={() => setPage('productDetail')}
                        productName={currentProduct.name}
                    />;
                }
                break;
            case 'cartConfig':
                if (!currentProduct || photosForProduct.length === 0) {
                     component = <StorePage onSelectProduct={handleSelectProduct} />;
                } else {
                    component = <CartConfigPage 
                        product={currentProduct}
                        photos={photosForProduct}
                        onAddToCart={handleAddToCart}
                        onBack={() => setPage('productDetail')}
                    />;
                }
                break;
            case 'cart':
                component = <ShoppingCartPage 
                    cartItems={cart}
                    onUpdateItem={handleUpdateCartItem}
                    onRemoveItem={handleRemoveCartItem}
                    onCheckout={handleCheckout}
                />;
                break;
            case 'checkout':
                component = <CheckoutPage onConfirm={handleConfirmOrder} onBack={() => setPage('cart')} />;
                break;
            case 'orderConfirmation':
                component = <OrderConfirmationPage onContinue={() => setPage('store')} />;
                break;
            default:
                component = <LoginPage onLogin={handleLogin} clients={allClients} />;
        }
        return (
            <motion.div
                key={key}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                {component}
            </motion.div>
        )
    };

    return (
        <>
            {page !== 'login' && page !== 'cover' && page !== 'dashboard' && <TopNavBar onNavigate={handleNavigate} cartCount={cart.length} userRole={userRole} onLogout={handleLogout} />}
            <AnimatePresence mode="wait">
                {renderPage()}
            </AnimatePresence>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </>
    );
};

export default App;
