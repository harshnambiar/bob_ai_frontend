import axios from "axios";
import detectEthereumProvider from "@metamask/detect-provider"
import Web3 from "web3";
import * as ethers from "ethers";
import * as queryMap from "./querymap.json";
import * as responseMap from "./responsemap.json";



const nft_map = [["bob nft", "0x5bb63DC8FBcb121B980532e845F3Bd1eb503B9aB"]];

async function connectOrDisconnect() {
    const acc_cur = localStorage.getItem("acc") || "";
    console.log(acc_cur);
    if (acc_cur != "" && acc_cur != null){
        localStorage.setItem("acc","");
        document.getElementById("log_status").textContent = "Login";
        return;
    }

    var chainId = 28882;
    var cid = '0x70d2';
    var chain = 'Boba Sepolia Testnet';
    var name = 'ETH';
    var symbol = 'ETH';
    var rpc = "https://sepoloa.boba.network";

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
  const timenow = Date.now();
  localStorage.setItem("last_login", timenow.toString());
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

async function disconnectIfNecessary(){
  const timenow = Date.now();
  const lastloginstr = localStorage.getItem("last_login") || "0";
  const lastlogin = Number(lastloginstr);
  if (timenow - lastlogin > (60 * 60 * 1000)){
    localStorage.setItem("acc", "");
    console.log('successfully disconnected account');
  }
  else {
    const account = localStorage.getItem("acc");
    document.getElementById("log_status").textContent = (account.toString().slice(0,8)).concat('..(Logout)');
  }
}
window.disconnectIfNecessary = disconnectIfNecessary



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
        const regex2 = /save\s+(.*)\s+as\s+(.*)$/;
        const regex3 = /fetch\s+(.*)$/;
        const regex4 = /update\s+(.*)\s+to\s+(.*)$/;
        const regex5 = /nfts\s+(.*)$/;
        const match = qry.match(regex);
        const match2 = qry.match(regex2);
        const match3 = qry.match(regex3);
        const match4 = qry.match(regex4);
        const match5 = qry.match(regex5);
        if (match){
            const amt = match[1];
            const recipient1 = match[2];

            var recipient = "";
            if (isWallet(recipient1)){
              recipient = recipient1;
              console.log("hi");
            }
            else {
              const res = await fetchContact(recipient1);
              if (res == "none"){
                return "The target is neither a valid EVM address nor a saved contact name.";
              }
              else if (res == "dberror"){
                return "Database Error Occured. Please try again later.";
              }
              else if (res == ""){
                return "Unexpected Error Occured. Please try again later or log a bug report.";
              }
              else {

                recipient = res;
              }
            }

            console.log(recipient);
            try {
                const res2 = await transferTokens(recipient, amt);
                return "sent ".concat(amt).concat(" to ").concat(recipient).concat(". Tx Hash: ").concat(res.hash);
            }
            catch(err){
                return "failed to send ".concat(amt).concat(" to ").concat(recipient).concat(". Error: ").concat(err);
            }

        }
        else if (qry == "balance"){
          try {
            const bal = await showBalance();
            return "Your Boba Sepolia ETH balance is: ".concat(bal);
          }
          catch (err){
            return "Failed to fetch balance: ".concat(err);
          }
        }
        else if (match2){
          console.log(match2[1]);
          console.log(match2[2]);
          const isValidWallet = isWallet(match2[1]);
          if (!isValidWallet){
            return "The address you are trying to save is not a valid EVM address.";
          }
          if (match2[2] == "" || match2[2] == "none" || match2[2] == "dberror"){
            return "The target name cannot have the value 'none', 'dberror' or ''";
          }
          var status = 2;
          const res = await saveContact(match2[1], match2[2]);
          if (res == 1){
            return "Saved ".concat(match2[1]).concat(" as ").concat(match2[2]).concat(" in your address book.");
          }
          else if (res == 0){
            return "Failed to save contact. This contact name is already in use.";
          }
          else if (res == 3){
            return "Failed to save contact. Database error. Please try again later.";
          }
          else {
            console.log(status);
            return "Failed to save contact. Unexpected Error. Please try again later.";
          }

        }
        else if (match3){
          console.log(match3[1]);
          const res = await fetchContact(match3[1]);
          if (res == "none"){
            return "No record under this name found.";
          }
          else if (res == "dberror"){
            return "Database Error Occured. Please try again later.";
          }
          else if (res == ""){
            return "Unexpected Error Occured. Please try again later or log a bug report.";
          }
          else {
            return "Address for contact ".concat(match3[1]).concat(": ").concat(res);
          }
        }
        else if (match4){
          console.log(match4[1]);
          console.log(match4[2]);
          const res = await updateContact(match4[1], match4[2]);
          if (res == 1){
            return "Update contact failed. Contact with this name does not exist.";
          }
          else if (res == 2){
            return "Updated contact ".concat(match4[1]).concat(" to: ").concat(match4[2]);
          }
          else if (res == 3){
            return "Update contact failed. The record could not be updated. Please log a bug or try again later.";
          }
          else if (res == 4){
            return "Update contact failed. Database needs to be updated."
          }
          else {
            return "Unexpected error occured. Please report the bug to Resurgence Labs.";
          }
        }
        else if (match5){
          console.log(match5[1]);
          const res = await getNFT(match5[1]);
          console.log(res);
          var j = 0;
          var rstring = "";
          while (j < res.length){
            rstring = rstring.concat((j+1).toString()).concat(" \n ").concat("Token Id: ").concat(res[j].tokenId).concat(" \n ").concat("Token URI: ").concat(res[j].tokenURI).concat(" \n ");
            j++;
          }
          if (rstring == ""){
            return "You don't own any NFT in this collection.";
          }
          else {
            return rstring;
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

function fetchContact(name){
  return new Promise((resolve, reject) => {
    let fetched = "";
    const request = indexedDB.open('ContactDB', 1);
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const getRequest = store.get(name);
      getRequest.onsuccess = function(event) {
        if (getRequest.result) {
          status = event.target.result.wallet;
          resolve(status); // Resolve with status 0
        }
        else {
          resolve("none");
        }
        db.close();

      }
      getRequest.onerror = function(){
        resolve("");
        db.close();
      }
    }
    request.onerror = function(event) {
      console.error('Database error:', event.target.errorCode);
      resolve("dberror");
    };

  })
}


function updateContact(name, wallet) {
    return new Promise((resolve, reject) => {
        // Open the database
        var status = 0;
        const request = indexedDB.open('ContactDB', 1);

        request.onerror = (event) => {
            resolve(status);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            // Start a readwrite transaction
            const transaction = db.transaction(['contacts'], 'readwrite');
            const objectStore = transaction.objectStore('contacts');

            // First, check if the record exists
            const getRequest = objectStore.get(name);

            getRequest.onsuccess = (event) => {
                if (!event.target.result) {
                    status = 1;
                    resolve(status);
                    return;
                }

                // Update the record with the new wallet data
                const updateRequest = objectStore.put({ name, wallet });

                updateRequest.onsuccess = () => {
                    status = 2;
                    resolve(status);
                };

                updateRequest.onerror = (event) => {
                    resolve(status);
                };
            };

            getRequest.onerror = (event) => {
                resolve(status);
            };

            // Close the database after the transaction completes
            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = (event) => {
                status = 3;
                resolve(status);
                db.close();
            };
        };

        request.onupgradeneeded = (event) => {
            status = 4;
            resolve(status);
            //reject('Database upgrade needed, please initialize the database first');
        };
    });
}


function saveContact(wallet, name) {
  return new Promise((resolve, reject) => {
    let status = 0;

    const request = indexedDB.open('ContactDB', 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'name' });
      }
    };

    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');
      const getRequest = store.get(name);

      getRequest.onsuccess = function() {
        if (getRequest.result) {
          console.log(`Contact with name ${name} already exists:`, getRequest.result);
          resolve(status); // Resolve with status 0
        } else {
          const contact = { name: name, wallet: wallet };
          const addRequest = store.add(contact);

          addRequest.onsuccess = function() {
            status = 1;
            console.log('Contact saved successfully:', wallet, name);
            resolve(status); // Resolve with status 1
          };

          addRequest.onerror = function() {
            status = 2;
            console.error('Error saving contact:', addRequest.error);
            resolve(status);
          };
        }
      };

      getRequest.onerror = function() {
        status = 2;
        console.error('Error checking name:', getRequest.error);
        resolve(status);
      };

      transaction.oncomplete = function() {
        db.close();
      };

      transaction.onerror = function() {
        status = 2;
        console.error('Transaction error:', transaction.error);
        resolve(status);
      };
    };

    request.onerror = function(event) {
      status = 3;
      console.error('Database error:', event.target.errorCode);
      resolve(status);
    };
  });
}

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

async function showBalance(){
    const rpcUrl = 'https://sepolia.boba.network';
    const chainId = '0x70d2';
    var bal = 0;
    try {
      // Check MetaMask availability
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Switch to Boba Sepolia Testnet
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
              chainName: 'Boba Sepolia Testnet',
              rpcUrls: [rpcUrl],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://testnet.bobascan.com'],
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
      if (network.chainId !== 28882n) {
        throw new Error('Wrong network. Please connect to Boba Sepolia Testnet.');
      }


      // Check native boba ETH balance
      const decimals = 18;
      bal = await provider.getBalance(signerAddress);
      console.log('Balance:', ethers.formatUnits(bal, decimals), 'nanoETH');

  }
  catch (err){
    console.log(err);
  }
  return bal;

}


async function transferTokens(target, amount) {
  const rpcUrl = 'https://sepolia.boba.network';
  const chainId = '0x70d2';

  try {
    // Check MetaMask availability
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Switch to Boba Sepolia Testnet
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
            chainName: 'Boba Sepolia Testnet',
            rpcUrls: [rpcUrl],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://testnet.bobascan.com'],
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
    if (network.chainId !== 28882n) {
      throw new Error('Wrong network. Please connect to Boba Sepolia Testnet.');
    }

    // Validate recipient address
    if (!ethers.isAddress(target)) {
      throw new Error('Invalid recipient address');
    }

    // Check native STT balance
    const decimals = 18;
    const amt = ethers.parseUnits(amount.toString(), decimals);
    const balance = await provider.getBalance(signerAddress);
    console.log('Balance:', ethers.formatUnits(balance, decimals), 'ETH');
    if (balance < amt) {
      throw new Error(`Insufficient ETH balance: ${ethers.formatUnits(balance, decimals)} available`);
    }

    // Check SOM balance for gas
    const feeData = await provider.getFeeData();
    const gasLimit = 21000n; // Standard for native transfers
    const gasCost = feeData.maxFeePerGas * gasLimit;
    if (balance < gasCost) {
      throw new Error(`Insufficient ETH for gas: ${ethers.formatUnits(gasCost, decimals)} needed`);
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


async function getNFT(str){
  var i = 0;
  var nft_contract_address = "";
  while (i < nft_map.length){
    if (nft_map[i][0] == str){
      nft_contract_address = nft_map[i][1];
      break;
    }
    i++;
  }
  if (nft_contract_address == ""){
    return [];
  }
  console.log(nft_contract_address);
  const BOBA_TESTNET_RPC = "https://sepolia.boba.network";
  const wallet_address = localStorage.getItem("acc"); // Replace with your MetaMask wallet address

  // ERC-721 ABI
  const ERC721_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)"
  ];
  try {
    const provider = new ethers.JsonRpcProvider(BOBA_TESTNET_RPC);
    const contract = new ethers.Contract(nft_contract_address, ERC721_ABI, provider);
    const nfts = [];

    // Get balance of NFTs
    const balance = await contract.balanceOf(wallet_address);
    console.log(`Found ${balance} NFTs for wallet ${wallet_address} in contract ${nft_contract_address}`);


    for (let i = 0; i < balance; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(wallet_address, i);
        const tokenURI = await contract.tokenURI(tokenId);
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI,
          nft_contract_address
        });
      } catch (err) {
        console.error(`Error fetching token at index ${i}:`, err.message);
      }
    }



    return nfts;
  } catch (error) {
    console.error("Error fetching NFTs:", error.message);
    return [];
  }
}

function isWallet(str){
  const regex = /^0x[a-fA-F0-9]{40}$/;
  const match = str.match(regex);
  if (match){
    return true;
  }
  else {
    return false;
  }
}
//0x7caF9c2f5074A58EBeC737dB6022b1B6D46b8B50 taai
//0x33E7fAB0a8a5da1A923180989bD617c9c2D1C493 ping
//0x9beaA0016c22B646Ac311Ab171270B0ECf23098F pong
