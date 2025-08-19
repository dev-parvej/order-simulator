// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TradingSettlement {
    address public owner;
    address public backendAddress;
    
    // Sepolia USDT contract address (mock token for testing)
    address public constant USDT_TOKEN = 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06;
    
    mapping(address => uint256) public ethBalances;
    mapping(address => uint256) public usdtBalances;
    
    event Deposit(address indexed user, string tokenType, uint256 amount);
    event Withdrawal(address indexed user, string tokenType, uint256 amount);
    event TradeSettled(
        address indexed buyerA, 
        address indexed sellerB, 
        uint256 ethAmount, 
        uint256 usdtAmount,
        string orderId
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyBackend() {
        require(msg.sender == backendAddress, "Only backend can settle trades");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function setBackendAddress(address _backendAddress) external onlyOwner {
        backendAddress = _backendAddress;
    }
    
    function depositETH() public payable {
        require(msg.value > 0, "Must send ETH");
        ethBalances[msg.sender] += msg.value;
        emit Deposit(msg.sender, "ETH", msg.value);
    }
    
    function depositUSDT(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 usdt = IERC20(USDT_TOKEN);
        require(usdt.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");
        
        usdtBalances[msg.sender] += amount;
        emit Deposit(msg.sender, "USDT", amount);
    }
    
    function withdrawETH(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(ethBalances[msg.sender] >= amount, "Insufficient ETH balance");
        
        ethBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, "ETH", amount);
    }
    
    function withdrawUSDT(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdtBalances[msg.sender] >= amount, "Insufficient USDT balance");
        
        usdtBalances[msg.sender] -= amount;
        
        IERC20 usdt = IERC20(USDT_TOKEN);
        require(usdt.transfer(msg.sender, amount), "USDT transfer failed");
        
        emit Withdrawal(msg.sender, "USDT", amount);
    }
    
    function settleTrade(
        address buyerA,
        address sellerB,
        uint256 ethAmount,
        uint256 usdtAmount,
        string calldata orderId
    ) external onlyBackend {
        require(buyerA != address(0) && sellerB != address(0), "Invalid addresses");
        require(ethAmount > 0 && usdtAmount > 0, "Invalid amounts");
        
        require(usdtBalances[buyerA] >= usdtAmount, "Buyer insufficient USDT balance");
        require(ethBalances[sellerB] >= ethAmount, "Seller insufficient ETH balance");
        
        usdtBalances[buyerA] -= usdtAmount;
        ethBalances[sellerB] -= ethAmount;
        
        ethBalances[buyerA] += ethAmount;
        usdtBalances[sellerB] += usdtAmount;
        
        emit TradeSettled(buyerA, sellerB, ethAmount, usdtAmount, orderId);
    }
    
    function getBalance(address user) external view returns (uint256 ethBalance, uint256 usdtBalance) {
        return (ethBalances[user], usdtBalances[user]);
    }
    
    function getUserETHBalance(address user) external view returns (uint256) {
        return ethBalances[user];
    }
    
    function getUserUSDTBalance(address user) external view returns (uint256) {
        return usdtBalances[user];
    }
    
    receive() external payable {
        depositETH();
    }
}