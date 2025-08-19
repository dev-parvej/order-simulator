import React, { useState } from 'react';
import Web3 from 'web3';

interface DepositWithdrawProps {
  walletAddress: string;
  customerType: 'A' | 'B';
}

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const USDT_TOKEN_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'; // Sepolia USDT

// Contract ABI for the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "depositETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "depositUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdrawETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdrawUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const USDT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const DepositWithdraw: React.FC<DepositWithdrawProps> = ({ walletAddress, customerType }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getWeb3 = () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }
    return new Web3(window.ethereum);
  };

  const getContract = (web3: Web3) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }
    return new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const web3 = getWeb3();
      const contract = getContract(web3);

      if (customerType === 'A') {
        // Customer A deposits USDT
        const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_TOKEN_ADDRESS);
        const amountWei = web3.utils.toWei(depositAmount, 'mwei'); // USDT has 6 decimals
        
        // First approve USDT spending
        await usdtContract.methods.approve(CONTRACT_ADDRESS, amountWei).send({ from: walletAddress });
        
        // Then deposit USDT
        await contract.methods.depositUSDT(amountWei).send({ from: walletAddress });
        
        setSuccess(`Successfully deposited ${depositAmount} USDT`);
      } else {
        // Customer B deposits ETH
        const amountWei = web3.utils.toWei(depositAmount, 'ether');
        
        await contract.methods.depositETH().send({ 
          from: walletAddress,
          value: amountWei
        });
        
        setSuccess(`Successfully deposited ${depositAmount} ETH`);
      }
      
      setDepositAmount('');
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const web3 = getWeb3();
      const contract = getContract(web3);

      if (customerType === 'A') {
        // Customer A withdraws USDT
        const amountWei = web3.utils.toWei(withdrawAmount, 'mwei'); // USDT has 6 decimals
        await contract.methods.withdrawUSDT(amountWei).send({ from: walletAddress });
        setSuccess(`Successfully withdrew ${withdrawAmount} USDT`);
      } else {
        // Customer B withdraws ETH
        const amountWei = web3.utils.toWei(withdrawAmount, 'ether');
        await contract.methods.withdrawETH(amountWei).send({ from: walletAddress });
        setSuccess(`Successfully withdrew ${withdrawAmount} ETH`);
      }
      
      setWithdrawAmount('');
    } catch (err: any) {
      console.error('Withdraw error:', err);
      setError(err.message || 'Withdraw failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenInfo = () => {
    if (customerType === 'A') {
      return {
        token: 'USDT',
        description: 'Deposit USDT to buy ETH',
        withdrawDescription: 'Withdraw your USDT balance'
      };
    } else {
      return {
        token: 'ETH',
        description: 'Deposit ETH to sell for USDT',
        withdrawDescription: 'Withdraw your ETH balance'
      };
    }
  };

  const tokenInfo = getTokenInfo();

  if (!walletAddress) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600 text-center">Connect wallet to deposit/withdraw</p>
      </div>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-yellow-800 text-center">Smart contract not deployed yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Deposit/Withdraw {tokenInfo.token}
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Deposit Section */}
        <div className="border border-gray-200 p-3 rounded">
          <h4 className="font-medium text-gray-700 mb-2">
            Deposit {tokenInfo.token}
          </h4>
          <p className="text-sm text-gray-600 mb-3">{tokenInfo.description}</p>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={`Amount in ${tokenInfo.token}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
              step="0.000001"
              min="0"
              disabled={isLoading}
            />
            <button
              onClick={handleDeposit}
              disabled={isLoading || !depositAmount}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Deposit'}
            </button>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="border border-gray-200 p-3 rounded">
          <h4 className="font-medium text-gray-700 mb-2">
            Withdraw {tokenInfo.token}
          </h4>
          <p className="text-sm text-gray-600 mb-3">{tokenInfo.withdrawDescription}</p>
          
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Amount in ${tokenInfo.token}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
              step="0.000001"
              min="0"
              disabled={isLoading}
            />
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 border-t pt-3">
        <p>• Make sure you're connected to Sepolia testnet</p>
        <p>• Customer A: Deposit USDT to buy ETH from Customer B</p>
        <p>• Customer B: Deposit ETH to sell for USDT to Customer A</p>
        <p>• Transactions will be confirmed on the blockchain</p>
      </div>
    </div>
  );
};

export default DepositWithdraw;