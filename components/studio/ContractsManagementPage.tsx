import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { contractService, Contract, ContractStats } from '../../services/contractService';
import CreateContractModal from '../CreateContractModal';
import SignatureCanvas from 'react-signature-canvas';

export default function ContractsManagementPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const signatureRef = React.useRef<any>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contractsData = await contractService.getContracts({
        status: filter,
        limit: 50,
      });
      setContracts(contractsData.contracts);
      
      const statsData = await contractService.getContractStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load contracts:', err);
      setError(err.response?.data?.detail || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || !agreedToTerms || !selectedContract) return;

    try {
      setSigning(true);
      const signatureData = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
      
      await contractService.signContract(selectedContract.id, {
        signature: signatureData,
        timestamp: new Date().toISOString(),
        agreement: agreedToTerms,
      });

      alert('Contract signed successfully!');
      setShowSignature(false);
      setSelectedContract(null);
      loadData();
    } catch (error) {
      console.error('Failed to sign contract:', error);
      alert('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
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

  const ContractCard = ({ contract }: { contract: Contract }) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => setSelectedContract(contract)}
      className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{contract.title}</h3>
          <p className="text-sm text-gray-500 mb-1">Contract # {contract.contract_number}</p>
          {contract.client_name && (
            <p className="text-sm text-gray-600">Client: {contract.client_name}</p>
          )}
          {contract.project_name && (
            <p className="text-sm text-gray-600">Project: {contract.project_name}</p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
            {getStatusIcon(contract.status)} {contract.status.toUpperCase()}
          </span>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(contract.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  );

  if (showSignature && selectedContract) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <button
              onClick={() => setShowSignature(false)}
              className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
            >
              ← Back to Contract
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign Contract</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Please sign below using your mouse or touchpad. Your signature will be legally binding.
              </p>
            </div>

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

  if (selectedContract) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <button
                onClick={() => setSelectedContract(null)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                ← Back to Contracts
              </button>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedContract.status)}`}>
                {selectedContract.status.toUpperCase()}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedContract.title}</h1>
            <p className="text-gray-600">Contract # {selectedContract.contract_number}</p>
            {selectedContract.client_name && <p className="text-gray-600">Client: {selectedContract.client_name}</p>}
            {selectedContract.project_name && <p className="text-gray-600">Project: {selectedContract.project_name}</p>}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <div className="prose max-w-none">
              {selectedContract.content.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {(selectedContract.status === 'sent' || selectedContract.status === 'viewed') && (
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

          {selectedContract.status === 'signed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
            >
              <div className="text-5xl mb-2">✅</div>
              <h3 className="text-xl font-semibold text-green-900 mb-1">Contract Signed</h3>
              <p className="text-green-700">
                Signed on {selectedContract.signed_at ? new Date(selectedContract.signed_at).toLocaleString() : 'N/A'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (loading && contracts.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatCard icon="📄" label="Total" value={stats.total} color="#3B82F6" />
            <StatCard icon="✏️" label="Draft" value={stats.draft} color="#6B7280" onClick={() => setFilter('draft')} />
            <StatCard icon="⏳" label="Pending" value={stats.pending} color="#F59E0B" onClick={() => setFilter('sent')} />
            <StatCard icon="✅" label="Signed" value={stats.signed} color="#10B981" onClick={() => setFilter('signed')} />
            <StatCard icon="⚠️" label="Expiring" value={stats.expiring} color="#EF4444" />
          </div>
        )}

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
    </div>
  );
}
