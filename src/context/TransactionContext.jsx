import React, { createContext, useEffect, useState } from "react";
import { contractABI, contractAddress } from "../utils/constants";
const ethers = require("ethers");
export const TransactionContext = createContext();
const { ethereum } = window;




const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );
  return transactionContract;
};


export const TransactionProvider = ({ children }) => {
  const [currentAccount, setcurrentAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false)
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))


  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const transactionContract = getEthereumContract();
  
      // console.log("Transaction Contract:", transactionContract);
      // console.log("ABI Methods:", transactionContract.functions);
  
      const availableTransactions = await transactionContract.getAllTransactions();
      console.log("Available Transactions:", availableTransactions);
    } catch (error) {
      console.log("Error:", error);
    }
  };
  

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        alert("Please install MetaMask!");
        return; // Handle no MetaMask scenario
      }
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setcurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found.");
      }
    } catch (error) {
      console.log(error);
    }
  };


  
  // console.log(currentAccount);

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask!");
      const accounts = await ethereum.request({   
   method: "eth_requestAccounts" });
      setcurrentAccount(accounts[0]); 
  
      getEthereumContract();
    } catch (error) {
      console.log(error);
    }
  };


  const checkIfTransactionExist = async () => {
    try {
      if (!ethereum) throw new Error("No ethereum object.");

      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();
      console.log(transactionCount)
      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
    }
  };


  const sendTransaction = async () => {
    try {
      if (typeof ethereum !== 'undefined') {
        const { addressTo, amount, keyword, message } = formData;
  
        // Check if the address is valid
        if (!ethers.utils.isAddress(addressTo)) {
          console.log("Invalid Ethereum address");
          return alert("Invalid Ethereum address");
        }
  
        const transactionsContract = getEthereumContract();
        const parsedAmount = ethers.utils.parseEther(amount);
  
        console.log("Address to:", addressTo);
        console.log("Parsed amount:", parsedAmount.toString());
  
        // Initiate the transaction
        await ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: currentAccount,
            to: addressTo,
            gas: "0x5208", // 21000 Gwei (standard gas limit for ETH transfer)
            value: parsedAmount._hex, // Converting to hex format for the transaction
          }],
        });
  
        // Call the smart contract's addToBlockchain function
        const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);
        const transactionsCount = await transactionsContract.getTransactionCount();
        setTransactionCount(transactionsCount.toNumber());
  
        window.location.reload();
      } else {
        console.error("Ethereum object not found");
      }
    } catch (error) {
      console.error("Transaction error:", error);
    }
  };
  
 


  useEffect(() => {
    const init = async () => {
      await checkIfWalletIsConnected();
      if (currentAccount) {
        await checkIfTransactionExist(); // Only call this after the wallet is connected
      }
    };
    init();
  }, [currentAccount]);




  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        handleChange,
        sendTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
