import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { contractService, Contract } from '../services/contractService';

interface ClientContractsPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function ClientContractsPage({ onNavigate }: ClientContractsPageProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, [filter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contractsData = await contractService.getContracts({
        status: filter,
        limit: 50,
      });
      setContracts(contractsData.contracts);
    } catch (err: any) {
      console.error('Failed to load contracts:', err);
      setError(err.response?.data?.detail || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { icon: '📝', label: 'Draft', color: 'text-gray-600 bg-gray-100' };
      case 'sent':
        return { icon: '📤', label: 'Sent to You', color: 'text-blue-600 bg-blue-100' };
      case 'viewed':
        return { icon: '👁️', label: 'Awaiting Your Signature', color: 'text-yellow-600 bg-yellow-100' };
      case 'signed':
        return { icon: '✅', label: 'Signed', color: 'text-green-600 bg-green-100' };
      case 'expired':
        return { icon: '⏰', label: 'Expired', color: 'text-red-600 bg-red-100' };
      case 'cancelled':
        return { icon: '❌', label: 'Cancelled', color: 'text-gray-600 bg-gray-100' };
      default:
        return { icon: '📄', label: status, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const isAwaitingSignature = (contract: Contract) => {
    return contract.status === 'sent' || contract.status === 'viewed';
  };

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const statusInfo = getStatusInfo(contract.status);
    const needsSignature = isAwaitingSignature(contract);
    
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => onNavigate('contractView', { contractId: contract.id })}
        className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{statusInfo.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-3">Contract # {contract.contract_number}</p>
            
            <div className="space-y-1">
              {contract.sent_at && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Sent:</span>{' '}
                  {new Date(contract.sent_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
              
              {contract.signed_at && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Signed:</span>{' '}
                  {new Date(contract.signed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
              
              {contract.expires_at && needsSignature && (
                <p className="text-sm text-orange-600">
                  <span className="font-medium">Expires:</span>{' '}
                  {new Date(contract.expires_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            
            {needsSignature && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('contractView', { contractId: contract.id });
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign Now →
              </button>
            )}
            
            {contract.status === 'signed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`${contract.signed_pdf_url || contract.pdf_url}`, '_blank');
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Download PDF
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="text-6xl mb-4">📄</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Contracts Yet</h3>
      <p className="text-gray-600 mb-6">
        {filter ? `No ${filter} contracts found` : 'You don\'t have any contracts yet. Your photographer will send contracts for you to review and sign.'}
      </p>
    </motion.div>
  );

  if (loading && contracts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your contracts...</p>
        </div>
      </div>
    );
  }

  const unsignedCount = contracts.filter(c => isAwaitingSignature(c)).length;
  const signedCount = contracts.filter(c => c.status === 'signed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Contracts</h1>
            <p className="text-gray-600 mt-1">
              {contracts.length === 0 
                ? 'No contracts yet'
                : `You have ${contracts.length} contract${contracts.length !== 1 ? 's' : ''}`
              }
              {unsignedCount > 0 && (
                <span className="text-orange-600 font-medium">
                  {' '}({unsignedCount} pending signature)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        {contracts.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setFilter(undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({contracts.length})
            </button>
            
            <button
              onClick={() => setFilter('sent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending Signature ({unsignedCount})
            </button>
            
            <button
              onClick={() => setFilter('signed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'signed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Signed ({signedCount})
            </button>
          </div>
        )}

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
