import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { contractService, Contract } from '../services/contractService';

interface ContractViewerPageProps {
  contractId: string;
  onNavigate: (page: string) => void;
}

export default function ContractViewerPage({ contractId, onNavigate }: ContractViewerPageProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const signatureRef = useRef<any>(null);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await contractService.getContract(contractId);
      setContract(data);
    } catch (error) {
      console.error('Failed to load contract:', error);
      alert('Failed to load contract');
      onNavigate('contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || !agreedToTerms) return;

    try {
      setSigning(true);
      const signatureData = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
      
      await contractService.signContract(contractId, {
        signature: signatureData,
        timestamp: new Date().toISOString(),
        agreement: agreedToTerms,
      });

      alert('Contract signed successfully!');
      setShowSignature(false);
      loadContract(); // Reload to get updated contract
    } catch (error) {
      console.error('Failed to sign contract:', error);
      alert('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent':
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'signed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Contract not found</p>
          <button
            onClick={() => onNavigate('contracts')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  if (showSignature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <button
              onClick={() => setShowSignature(false)}
              className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
            >
              ← Back to Contract
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign Contract</h2>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Please sign below using your mouse or touchpad. Your signature will be legally binding.
              </p>
            </div>

            {/* Signature Canvas */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'signature-canvas w-full h-48',
                  style: { width: '100%', height: '200px' }
                }}
                penColor="black"
              />
            </div>

            {/* Agreement */}
            <label className="flex items-start mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 mr-3 w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                I agree to the terms and conditions outlined in this contract. I understand that this electronic signature is legally binding and has the same effect as a handwritten signature.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => signatureRef.current?.clear()}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={handleSign}
                disabled={!agreedToTerms || signing}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? 'Signing...' : 'Sign & Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => onNavigate('contracts')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Back to Contracts
            </button>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
              {contract.status.toUpperCase()}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{contract.title}</h1>
          <p className="text-gray-600">Contract # {contract.contract_number}</p>
          {contract.client_name && <p className="text-gray-600">Client: {contract.client_name}</p>}
          {contract.project_name && <p className="text-gray-600">Project: {contract.project_name}</p>}
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="prose max-w-none">
            {contract.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {(contract.status === 'sent' || contract.status === 'viewed') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <button
              onClick={() => setShowSignature(true)}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              ✍️ Sign Contract
            </button>
          </motion.div>
        )}

        {contract.status === 'signed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
          >
            <div className="text-5xl mb-2">✅</div>
            <h3 className="text-xl font-semibold text-green-900 mb-1">Contract Signed</h3>
            <p className="text-green-700">
              Signed on {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : 'N/A'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
