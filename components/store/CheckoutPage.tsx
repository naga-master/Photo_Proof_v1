import React, { useState } from 'react';
import type { CartItem } from '../../types';
import { ArrowLeftIcon } from '../icons';
import { FormattedInput } from '../common/FormattedInput';

interface CheckoutPageProps {
  onConfirm: () => void;
  onBack: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onConfirm, onBack }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvc: '',
    });

    const inputClasses = "mt-1 block w-full text-gray-900 input-focus-filled py-2.5 px-3";

    const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleFormattedChange = (field: keyof typeof formData) => (formatted: string) => {
        setFormData(prev => ({ ...prev, [field]: formatted }));
    };
    
    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg mx-auto">
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
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input 
                                        type="text" 
                                        id="fullName" 
                                        value={formData.fullName}
                                        onChange={handleChange('fullName')}
                                        className={inputClasses} 
                                        placeholder="John Smith"
                                        autoComplete="name"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <input 
                                        type="text" 
                                        id="address" 
                                        value={formData.address}
                                        onChange={handleChange('address')}
                                        className={inputClasses} 
                                        placeholder="123 Main Street, Apt 4"
                                        autoComplete="street-address"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input 
                                        type="text" 
                                        id="city" 
                                        value={formData.city}
                                        onChange={handleChange('city')}
                                        className={inputClasses} 
                                        placeholder="New York"
                                        autoComplete="address-level2"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State / Province</label>
                                    <input 
                                        type="text" 
                                        id="state" 
                                        value={formData.state}
                                        onChange={handleChange('state')}
                                        className={inputClasses} 
                                        placeholder="NY"
                                        autoComplete="address-level1"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                                    <input 
                                        type="text" 
                                        id="zip" 
                                        value={formData.zip}
                                        onChange={handleChange('zip')}
                                        className={inputClasses} 
                                        placeholder="10001"
                                        autoComplete="postal-code"
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
                                    <FormattedInput
                                        id="card-number"
                                        type="card"
                                        value={formData.cardNumber}
                                        onChange={handleFormattedChange('cardNumber')}
                                        className={inputClasses}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">Name on Card</label>
                                    <input 
                                        type="text" 
                                        id="card-name" 
                                        value={formData.cardName}
                                        onChange={handleChange('cardName')}
                                        className={inputClasses} 
                                        placeholder="JOHN SMITH"
                                        autoComplete="cc-name"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700">Expiration Date</label>
                                    <FormattedInput
                                        id="card-expiry"
                                        type="expiry"
                                        value={formData.cardExpiry}
                                        onChange={handleFormattedChange('cardExpiry')}
                                        className={inputClasses}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                                    <FormattedInput
                                        id="card-cvc"
                                        type="cvc"
                                        value={formData.cardCvc}
                                        onChange={handleFormattedChange('cardCvc')}
                                        className={inputClasses}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t">
                            <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-md text-lg font-semibold hover:bg-gray-700 transition-colors">
                                Complete Purchase
                            </button>
                            <p className="mt-3 text-xs text-center text-gray-500">
                                Your payment info is secure and encrypted
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;