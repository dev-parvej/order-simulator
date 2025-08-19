import React, { useState } from "react";
import Web3 from "web3";

function WalletConnect({ setWalletId }) {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);

  const SEPOLIA_CONFIG = {
    chainId: '0xAA36A7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CONFIG.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
      }
    }
  };

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId === SEPOLIA_CONFIG.chainId) {
        setNetworkStatus('sepolia');
      } else {
        setNetworkStatus('wrong');
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // Check and switch to Sepolia network
        await checkNetwork();
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== SEPOLIA_CONFIG.chainId) {
          await switchToSepolia();
        }
        
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Get user accounts
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        setWalletId(accounts[0]);

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts) => {
          setAccount(accounts[0]);
          setWalletId(accounts[0] || '');
        });

        // Listen for network changes
        window.ethereum.on("chainChanged", (chainId) => {
          if (chainId === SEPOLIA_CONFIG.chainId) {
            setNetworkStatus('sepolia');
          } else {
            setNetworkStatus('wrong');
          }
          // Don't reload automatically, just update network status
        });

        setNetworkStatus('sepolia');
      } catch (error) {
        console.error("User denied account access or error:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {account ? (
        <div>
          <div>
            <p style={{ color: "#fff", fontSize: "14px", margin: "0 0 4px 0" }}>
              Connected: {account.substring(0, 6)}...{account.substring(38)}
            </p>
            {networkStatus === 'sepolia' ? (
              <p style={{ color: "#22c55e", fontSize: "12px", margin: 0 }}>✓ Sepolia Testnet</p>
            ) : networkStatus === 'wrong' ? (
              <div>
                <p style={{ color: "#ef4444", fontSize: "12px", margin: "0 0 4px 0" }}>⚠ Wrong Network</p>
                <button
                  onClick={switchToSepolia}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#f59e0b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Switch to Sepolia
                </button>
              </div>
            ) : (
              <p style={{ color: "#fbbf24", fontSize: "12px", margin: 0 }}>Checking network...</p>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default WalletConnect;
