import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface BalanceInfo {
  walletAddress: string;
  ethBalance: string;
  usdtBalance: string;
  lastUpdated: Date;
  lastSyncWithContract?: Date;
}

interface BalanceDisplayProps {
  walletAddress: string | null;
  customerType: 'A' | 'B';
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ walletAddress, customerType }) => {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/balance/${walletAddress}`);
      setBalance(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch balance');
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/balance/refresh`, {
        walletAddress
      });
      setBalance(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh balance');
      console.error('Balance refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      
      // Auto-refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600 text-center">Connect wallet to view balance</p>
      </div>
    );
  }

  const getRelevantBalance = () => {
    if (!balance) return null;
    
    if (customerType === 'A') {
      return {
        token: 'USDT',
        amount: parseFloat(balance.usdtBalance).toFixed(2),
        description: 'Available to buy ETH'
      };
    } else {
      return {
        token: 'ETH',
        amount: parseFloat(balance.ethBalance).toFixed(6),
        description: 'Available to sell'
      };
    }
  };

  const relevantBalance = getRelevantBalance();

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Wallet Balance - Customer {customerType}
        </h3>
        <button
          onClick={refreshBalance}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
        >
          {loading ? '⟳' : '↻'} Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3">
          {error}
        </div>
      )}

      {loading && !balance && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading balance...</p>
        </div>
      )}

      {balance && (
        <div className="space-y-3">
          {/* Primary Balance for Customer Type */}
          {relevantBalance && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">{relevantBalance.token}</span>
                <span className="text-xl font-bold text-blue-900">
                  {relevantBalance.amount}
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">{relevantBalance.description}</p>
            </div>
          )}

          {/* Full Balance Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">ETH Balance</div>
              <div className="font-semibold text-gray-900">
                {parseFloat(balance.ethBalance).toFixed(6)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">USDT Balance</div>
              <div className="font-semibold text-gray-900">
                {parseFloat(balance.usdtBalance).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            Last updated: {new Date(balance.lastUpdated).toLocaleString()}
            {balance.lastSyncWithContract && (
              <div>Contract sync: {new Date(balance.lastSyncWithContract).toLocaleString()}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;