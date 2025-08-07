import React, { useState } from "react";
import Web3 from "web3";

function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Get user accounts
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts) => {
          setAccount(accounts[0]);
        });

        // Listen for network changes
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
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
          <p>Connected: {account}</p>
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
