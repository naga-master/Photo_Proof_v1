import React from 'react';
import type { CartItem } from '../../types';
import { ArrowLeftIcon } from '../icons';

interface CheckoutPageProps {
  onConfirm: () => void;
  onBack: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onConfirm, onBack }) => {
    const inputClasses = "mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <ArrowLeftIcon className="w-4 h-4"/>
                    Back to Cart
                </button>
                <div className="bg-white rounded-lg shadow-lg">
                    <div className="p-8 border-b">
                        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
                    </div>
                    <form className="p-8 space-y-8" onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipping Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input type="text" id="firstName" className={inputClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input type="text" id="lastName" className={inputClasses} required />
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <input type="text" id="address" className={inputClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input type="text" id="city" className={inputClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State / Province</label>
                                    <input type="text" id="state" className={inputClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                                    <input type="text" id="zip" className={inputClasses} required />
                                </div>
                            </div>
                        </div>

                         <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
                             <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
                                    <input type="text" id="card-number" placeholder="•••• •••• •••• ••••" className={inputClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">Name on Card</label>
                                    <input type="text" id="card-name" className={inputClasses} required />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700">Expiration Date</label>
                                        <input type="text" id="card-expiry" placeholder="MM / YY" className={inputClasses} required />
                                    </div>
                                    <div>
                                        <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                                        <input type="text" id="card-cvc" placeholder="•••" className={inputClasses} required />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t">
                             <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-md text-lg font-semibold hover:bg-gray-700 transition-colors">
                                Place Order
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;