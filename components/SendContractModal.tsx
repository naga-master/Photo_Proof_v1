import React, { useState } from 'react';

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<void>;
  contractTitle: string;
  defaultEmail?: string;
  clientName?: string;
}

export default function SendContractModal({
  isOpen,
  onClose,
  onSend,
  contractTitle,
  defaultEmail = '',
  clientName = ''
}: SendContractModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSending(true);
      await onSend(email);
      onClose();
      // Reset state
      setEmail(defaultEmail);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to send contract');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Send Contract</h2>
            <button
              onClick={onClose}
              disabled={sending}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Contract Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Contract:</span> {contractTitle}
            </p>
            {clientName && (
              <p className="text-sm text-blue-900 mt-1">
                <span className="font-semibold">Client:</span> {clientName}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={sending}
            />
            <p className="text-xs text-gray-500 mt-1">
              The contract will be sent to this email address with a secure link
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              ✉️ The client will receive an email with:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Link to view the contract</li>
              <li>• Digital signature option</li>
              <li>• PDF download after signing</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
