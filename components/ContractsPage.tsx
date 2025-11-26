import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { contractService, Contract, ContractStats } from '../services/contractService';
import CreateContractModal from './CreateContractModal';
import SendContractModal from './SendContractModal';
import StatusBadge from './StatusBadge';

interface ContractsPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function ContractsPage({ onNavigate }: ContractsPageProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load contracts
      const contractsData = await contractService.getContracts({
        status: filter,
        limit: 50,
      });
      setContracts(contractsData.contracts);
      
      // Load stats
      const statsData = await contractService.getContractStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load contracts:', err);
      setError(err.response?.data?.detail || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendContract = async (contract: Contract) => {
    // If we don't have client email, try to fetch it
    if (!contract.client_name) {
      toast.info('Loading client details...');
      // For now, just show modal - email will need to be entered manually
    }
    setSelectedContract(contract);
    setShowSendModal(true);
  };

  const handleSend = async (email: string) => {
    if (!selectedContract) return;
    
    try {
      await contractService.sendContract(selectedContract.id, email);
      toast.success(`Contract sent to ${email}!`);
      loadData(); // Refresh to show updated status
    } catch (error: any) {
      console.error('Failed to send contract:', error);
      throw error;
    }
  };

  const handleDeleteContract = async (contract: Contract, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Check if contract can be deleted
    const { canDelete, reason } = contractService.canDeleteContract(contract);
    
    if (!canDelete) {
      toast.error(reason);
      return;
    }

    // Show warning if contract was viewed
    if (reason) {
      const confirmed = window.confirm(`${reason}\n\nAre you sure you want to delete this contract?`);
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(`Delete contract "${contract.title}"?\n\nThis action cannot be undone.`);
      if (!confirmed) return;
    }

    try {
      await contractService.deleteContract(contract.id);
      toast.success('Contract deleted successfully');
      loadData(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete contract:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete contract');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'sent':
      case 'viewed': return 'text-yellow-600 bg-yellow-100';
      case 'signed': return 'text-green-600 bg-green-100';
      case 'expired':
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'sent': return '📤';
      case 'viewed': return '👁️';
      case 'signed': return '✅';
      case 'expired': return '⏰';
      case 'cancelled': return '❌';
      default: return '📄';
    }
  };

  const StatCard = ({ icon, label, value, color, onClick }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </motion.div>
  );

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const { canDelete } = contractService.canDeleteContract(contract);
    
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div 
            className="flex-1 cursor-pointer" 
            onClick={() => onNavigate('contractView', { contractId: contract.id })}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{contract.title}</h3>
            <p className="text-sm text-gray-500 mb-1">Contract # {contract.contract_number}</p>
            {contract.client_name && (
              <p className="text-sm text-gray-600">Client: {contract.client_name}</p>
            )}
            {contract.project_name && (
              <p className="text-sm text-gray-600">Project: {contract.project_name}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Created: {new Date(contract.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={contract.status as any} size="sm" />
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Send Button - for draft, sent, viewed */}
              {['draft', 'sent', 'viewed'].includes(contract.status) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendContract(contract);
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  title={contract.status === 'draft' ? 'Send to Client' : 'Resend Contract'}
                >
                  {contract.status === 'draft' ? '📤 Send' : '🔄 Resend'}
                </button>
              )}
              
              {/* Delete Button - only if allowed */}
              {canDelete && (
                <button
                  onClick={(e) => handleDeleteContract(contract, e)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Delete Contract"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
              <p className="text-gray-600 mt-1">Manage your photography contracts</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              <span>New Contract</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatCard icon="📄" label="Total" value={stats.total} color="#3B82F6" />
            <StatCard icon="✏️" label="Draft" value={stats.draft} color="#6B7280" onClick={() => setFilter('draft')} />
            <StatCard icon="⏳" label="Pending" value={stats.pending} color="#F59E0B" onClick={() => setFilter('sent')} />
            <StatCard icon="✅" label="Signed" value={stats.signed} color="#10B981" onClick={() => setFilter('signed')} />
            <StatCard icon="⚠️" label="Expiring" value={stats.expiring} color="#EF4444" />
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'draft', 'sent', 'viewed', 'signed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? undefined : status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                (!filter && status === 'all') || filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {contracts.length > 0 ? (
            contracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No contracts found</h3>
              <p className="text-gray-600 mb-6">
                {filter ? `No ${filter} contracts` : 'Create your first contract to get started'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Contract
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Contract Modal */}
      <CreateContractModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadData(); // Reload contracts after creation
        }}
      />

      {/* Send Contract Modal */}
      {selectedContract && (
        <SendContractModal
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setSelectedContract(null);
          }}
          onSend={handleSend}
          contractTitle={selectedContract.title}
          defaultEmail={selectedContract.client_name || ''}
          clientName={selectedContract.client_name}
        />
      )}
    </div>
  );
}
