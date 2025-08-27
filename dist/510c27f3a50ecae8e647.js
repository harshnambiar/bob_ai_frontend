import axios from "axios";
import detectEthereumProvider from "@metamask/detect-provider"
import Web3 from "web3";
import * as ethers from "ethers";
import * as queryMap from "./querymap.json";
import * as responseMap from "./responsemap.json";




async function connectOrDisconnect() {
    const acc_cur = localStorage.getItem("acc") || "";
    console.log(acc_cur);
    if (acc_cur != "" && acc_cur != null){
        localStorage.setItem("acc","");
        document.getElementById("log_status").textContent = "Login";
        return;
    }

    var chainId = 50312;
    var cid = '0xc488';
    var chain = 'Somnia Testnet';
    var name = 'SOMNIA';
    var symbol = 'STT';
    var rpc = "https://dream-rpc.somnia.network";

    const provider = await detectEthereumProvider()
    console.log(window.ethereum);
    if (provider && provider === window.ethereum) {
        console.log("MetaMask is available!");

        console.log(window.ethereum.networkVersion);
        if (window.ethereum.networkVersion !== chainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: cid }]
                });
                console.log("changed to ".concat(name).concat(" testnet successfully"));

            } catch (err) {
                console.log(err);
                // This error code indicates that the chain has not been added to MetaMask
                if (err.code === 4902) {
                    console.log("please add ".concat(name).concat(" Testnet as a network"));
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainName: chain,
                                    chainId: cid,
                                    nativeCurrency: { name: name, decimals: 18, symbol: symbol },
                                    rpcUrls: [rpc]
                                }
                            ]
                        });
                }
                else {
                    console.log(err);
                }
            }
        }
        await startApp(provider);
    } else {
        console.log("Please install MetaMask!")
    }



}
window.connectOrDisconnect = connectOrDisconnect;


async function startApp(provider) {
  if (provider !== window.ethereum) {
    console.error("Do you have multiple wallets installed?")
  }
  else {
    const accounts = await window.ethereum
    .request({ method: "eth_requestAccounts" })
    .catch((err) => {
      if (err.code === 4001) {
        console.log("Please connect to MetaMask.")
      } else {
        console.error(err)
      }
    })
    console.log("hi");
  const account = accounts[0];
  var web3 = new Web3(window.ethereum);
  const bal = await web3.eth.getBalance(account);
  //console.log("hi");
  console.log(bal);
  console.log(account);
  localStorage.setItem("acc",account.toString());
  document.getElementById("log_status").textContent = (account.toString().slice(0,8)).concat('..(Logout)');

  }
}



async function form1(){
    window.open("https://form.jotform.com/252172180330041", "_blank");
}
window.form1 = form1;

async function createHtmlResponse(text){
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const text1 = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    const lineRegex = /[\r\n]/g;
    return text1.replace(lineRegex, '<br/>');
}
window.createHtmlResponse = createHtmlResponse;


async function getBotResponse(userInput){
    var typeOfInput = 0;
    if (userInput.slice(0,2) == 'i:'){
        typeOfInput = 1;
    }
    else if (userInput.slice(0,3) == 'tx:'){
        typeOfInput = 2;
    }
    else if (userInput.slice(0,13) == '123412341234:'){
        typeOfInput = 3;
    }
    else {
        typeOfInput = 4;
    }

    if (typeOfInput == 1){
        const qry1 = userInput.slice(2, userInput.length);
        const qry = qry1.trim();
        const normalizedQuery = queryMap[qry] || "faulty query";
        const normalizedResponse = responseMap[normalizedQuery] || "no response";
        console.log(normalizedQuery);
        if (normalizedResponse == 'no response'){
            return "Looks like this query doesn't match anything in our cached query list. Please go through our docs and use one of the supported queries, or use a custom query if you can't find a similar query.";
        }
        else {
            return normalizedResponse;
        }

    }
    else if (typeOfInput == 2){
        const qry1 = userInput.slice(3, userInput.length);
        const qry = qry1.trim();
        const regex = /send\s+(\d*\.?\d+)\s+token[s]?\s+to\s+(.*)$/ ///^send\s+(\d+)\s+tokens\s+to\s+(.*)$/;
        const match = qry.match(regex);
        if (match){
            const amt = match[1];
            const recipient = match[2];

            try {
                const res = await transferTokens(recipient, amt);
                return "sent ".concat(amt).concat(" to ").concat(recipient).concat(". Tx Hash: ").concat(res.hash);
            }
            catch(err){
                return "failed to send ".concat(amt).concat(" to ").concat(recipient).concat(". Error: ").concat(err);
            }

        }
        else {
            return "looks like this is transaction query isn't correctly formatted: ".concat(qry);
        }

    }
    else if (typeOfInput == 3){
        const qry = userInput.slice(13, userInput.length);
        return "looks like this is an AI request: ".concat(qry);
    }
    else if (typeOfInput == 4){
        return "Looks like your query isn't properly formatted. Please make sure it starts with either 'i:' for info queries, 'tx:' for transaction queries, and '<key>:' where key is your 12 digit Awesom AI secret key for custom queries.";
    }
    else {
        return "what the fuck is going on!?";
    }
    return "undefined error.";
}
window.getBotResponse = getBotResponse;

function shuffleArray(arr){
    for (let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function getQuerySuggestions(text){
    const matches = Object.keys(queryMap)
                                .filter(query => query.toLowerCase().includes(text) && (query[query.length - 1] == '.' || query[query.length - 1] == '?' || query[query.length - 1] == '!'));
    const shuffledMatches = shuffleArray(matches);

    return shuffledMatches;
}
window.getQuerySuggestions = getQuerySuggestions;


async function transferTokens(target, amount) {
  const rpcUrl = 'https://rpc.testnet.somnia.network';
  const chainId = '0xc488';

  try {
    // Check MetaMask availability
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Switch to Somnia Shannon Testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId,
            chainName: 'Somnia Testnet',
            rpcUrls: [rpcUrl],
            nativeCurrency: { name: 'SOMNIA', symbol: 'STT', decimals: 18 },
            blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
          }],
        });
      } else {
        throw switchError;
      }
    }

    // Initialize provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    if (!signerAddress) {
      throw new Error('No signer available. Please connect MetaMask.');
    }

    // Verify network
    const network = await provider.getNetwork();
    if (network.chainId !== 50312n) {
      throw new Error('Wrong network. Please connect to Somnia Shannon Testnet.');
    }

    // Validate recipient address
    if (!ethers.isAddress(target)) {
      throw new Error('Invalid recipient address');
    }

    // Check native STT balance
    const decimals = 18;
    const amt = ethers.parseUnits(amount.toString(), decimals);
    const balance = await provider.getBalance(signerAddress);
    console.log('Balance:', ethers.formatUnits(balance, decimals), 'STT');
    if (balance < amt) {
      throw new Error(`Insufficient STT balance: ${ethers.formatUnits(balance, decimals)} available`);
    }

    // Check SOM balance for gas
    const feeData = await provider.getFeeData();
    const gasLimit = 21000n; // Standard for native transfers
    const gasCost = feeData.maxFeePerGas * gasLimit;
    if (balance < gasCost) {
      throw new Error(`Insufficient STT for gas: ${ethers.formatUnits(gasCost, decimals)} needed`);
    }

    // Send native STT transaction
    const tx = await signer.sendTransaction({
      to: target,
      value: amt,
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    });
    console.log('Transaction sent! Hash:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    return { txHash: tx.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error('Error during transfer:', error);
    throw error;
  }
}
//0x7caF9c2f5074A58EBeC737dB6022b1B6D46b8B50 taai
//0x33E7fAB0a8a5da1A923180989bD617c9c2D1C493 ping
//0x9beaA0016c22B646Ac311Ab171270B0ECf23098F pong
