import React from 'react';
import { CheckCircleIcon } from '../icons';

interface OrderConfirmationPageProps {
  onContinue: () => void;
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ onContinue }) => {
    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500"/>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Thank you for your order!
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Your order has been placed successfully. You will receive an email confirmation shortly.
                    </p>
                </div>
                <div>
                    <button
                        onClick={onContinue}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
