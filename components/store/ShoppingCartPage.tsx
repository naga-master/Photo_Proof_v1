import React from 'react';
import type { CartItem } from '../../types';
import { PlusIcon, MinusIcon, XCircleIcon } from '../icons';

interface ShoppingCartPageProps {
  cartItems: CartItem[];
  onUpdateItem: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

const ShoppingCartPage: React.FC<ShoppingCartPageProps> = ({ cartItems, onUpdateItem, onRemoveItem, onCheckout }) => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.selectedOption.price * item.quantity, 0);
    const taxes = subtotal * 0.08; // 8% tax
    const total = subtotal + taxes;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Shopping Cart</h1>
                
                {cartItems.length === 0 ? (
                    <div className="text-center bg-white p-12 rounded-lg shadow-sm">
                        <h2 className="text-xl font-medium text-gray-800">Your cart is empty</h2>
                        <p className="mt-2 text-gray-500">Looks like you haven't added anything to your cart yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm divide-y divide-gray-200">
                            {cartItems.map(item => (
                                <div key={item.id} className="p-6 flex gap-6">
                                    <img src={item.photo.src} alt={item.photo.alt} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{item.product.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                Size: {item.selectedOption.size}
                                                {item.selectedType && `, Type: ${item.selectedType.name}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center border border-gray-300 rounded-md w-fit mt-2 bg-white">
                                            <button onClick={() => onUpdateItem(item.id, item.quantity - 1)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-l-md"><MinusIcon className="w-4 h-4"/></button>
                                            <span className="px-3 text-sm font-semibold text-gray-800">{item.quantity}</span>
                                            <button onClick={() => onUpdateItem(item.id, item.quantity + 1)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-r-md"><PlusIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-800">${(item.selectedOption.price * item.quantity).toFixed(2)}</p>
                                        <button onClick={() => onRemoveItem(item.id)} className="mt-4 text-gray-400 hover:text-red-500">
                                            <XCircleIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 sticky top-24">
                            <h2 className="text-xl font-semibold border-b pb-4 mb-4 text-gray-900">Order Summary</h2>
                            <div className="space-y-2 text-gray-600">
                                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Taxes</span><span>${taxes.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-gray-800 pt-2 border-t mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                            </div>
                            <button onClick={onCheckout} className="mt-6 w-full bg-gray-800 text-white py-3 rounded-md text-lg font-semibold hover:bg-gray-700 transition-colors">
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShoppingCartPage;