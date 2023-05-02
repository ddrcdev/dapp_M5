import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Modal from "react-modal";

import logo from './logo.svg';
import staticLogo from './logo-btt.png';



const nft_links = [
	"https://bafybeie2qulse2uduqt3lfank2lm6bixqrlhc7oh2khtcxrxegjeqwfoz4.ipfs.nftstorage.link/NFT_0.png",
	"https://bafybeie2qulse2uduqt3lfank2lm6bixqrlhc7oh2khtcxrxegjeqwfoz4.ipfs.nftstorage.link/NFT_1.png",
	"https://bafybeie2qulse2uduqt3lfank2lm6bixqrlhc7oh2khtcxrxegjeqwfoz4.ipfs.nftstorage.link/NFT_2.png"
];

//import { networks } from '../../truffle-config';

//Conexión red Ganache
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();


//Instancia contrato Token.sol 
const tokenJson = require('./contracts/Token.json'); // si usas require()
const tokenContract = new ethers.Contract(tokenJson.networks[80001].address, tokenJson.abi, signer);

//Instancia contrato NFT.sol 
const NFTJson = require('./contracts/NFT.json'); // si usas require()
const NFTContract = new ethers.Contract(NFTJson.networks[80001].address, NFTJson.abi, signer);


//Instancia contrato Manager.sol 
const ManagerJson = require('./contracts/Manager.json');
const ManagerContract = new ethers.Contract(ManagerJson.networks[80001].address, ManagerJson.abi, signer);

const modalStyles = {
	overlay: {
	  backgroundColor: "rgba(0, 0, 0, 0.5)"
	},
	content: {
	  margin: "auto",
	  top: "85%",
	  left: "50%",
	  transform: "translate(-50%, -50%)",
	  overflow: "hidden",
	  width: "50%",
	  height: "80%"
	},
  };



function App() {

	//METAMASK STATES
	const { ethereum } = window;
	const [haveMetamask, sethaveMetamask] = useState(true);
	const [isConnected, setIsConnected] = useState(false);

	const [accountAddress, setAccountAddress] = useState(''); //Cuenta conectada
	const [accountBalance, setAccountBalance] = useState(''); //Balance ether
	const [btt_balance, setBTTBalance] = useState(0); //Balance BTT
	const [networkUrl,setNetwork] = useState('')
	
	// TOKEN PRICE
	const [tokenprice,setTokenPrice] = useState();

	// TABLES
	const [tableMatches,setMatchesList] = useState([]);
	const [listMatches,setMatches] = useState([]);

	async function getTokenPrice() {
		const _tokenprice = await ManagerContract.tokenPrice();
		const aux = ethers.utils.formatEther(_tokenprice);
		if (aux !== tokenprice) {
			setTokenPrice(aux);
		}
	}

	async function getMatchesTable() {

		// Llamamos a la función getMatches()
		const matches = await ManagerContract.getMatches();
		setMatches(matches)
		
		const updatedMatches = [];

		for (let i = 0; i < matches.length; i++) {
			const id = matches[i];
			const creator = await ManagerContract.MatchCreator(id);
			const bets = (await ManagerContract._bets(id)).toString();
				
			updatedMatches.push({ id, creator, bets });
		}
		setMatchesList(updatedMatches);
	}		

	const MatchesRows = () => {
		return tableMatches.map(item => (
		  <tr key={item.id}>
			<td>{item.id}</td>
			<td>{item.creator}</td>
			<td>{item.bets}</td>
		  </tr>
		));
	}

	const [catalog,setNFTList] = useState([]);
	const [listNFTS,setNFTS] = useState([]);

	async function getNFTsTable() {

		// Llamamos a la función getMatches()
		const nfts = await ManagerContract.getCatalog();
		setNFTS(nfts);

		const updatedNFTs = [];
		for (let i = 0; i < nfts.length; i++) {
			const id = nfts[i].toString();
			const holder = await NFTContract.ownerOf(nfts[i]);
			const price = (await ManagerContract.priceOfNFT(nfts[i])).toString();
					
			updatedNFTs.push({ id, holder, price });
		}
		setNFTList(updatedNFTs);
	}
	  
	
	const NFTRows = () => {
		return catalog.map(item => (
		  <tr key={item.id}>
			<td>{item.id}</td>
			<td>{item.holder}</td>
			<td>{item.price}</td>
		  </tr>
		));
	}


	//Renderizado de tablas al inicio	 
	useEffect(() => {
		  async function fetchData() {
			getTokenPrice();
			getMatchesTable();
			getNFTsTable();
		  }
		  fetchData();
	},);

	// --------- METAMASK EVENTS ---------
	async function handleMetamaskEvent() {
		window.ethereum.on('accountsChanged', function (accountAddress) {
		  // Time to reload your interface with accounts[0]!	  
		  connectWallet();		  
		})
	
		window.ethereum.on('networkChanged', function (networkUrl) {
		  // Time to reload your interface with the new networkId
		  const newNetwork = provider.getNetwork();
		  if (newNetwork.name !== "maticmum") {
			switchNetwork();
			connectWallet();
		  }		  
		})
	}
	
	handleMetamaskEvent();


	async function switchNetwork() {
		const id = 80001
		try {			
			await window.ethereum.request({
			  method: 'wallet_switchEthereumChain',
			  params: [
				{
				  chainId: "0x"+ id.toString(16)
				}
			  ]
			});
		  } catch (switchError) {
			if (switchError.code === 4902) {
			  try {
				await window.ethereum.request({
				  method: 'wallet_addEthereumChain',
				  params: [
					{
						chainId: "0x"+ id.toString(16),
						chainName: 'Mumbai Testnet',
						rpcUrls: ['https://endpoints.omniatech.io/v1/matic/mumbai/public'],
						nativeCurrency: {
						  name: 'MATIC',
						  symbol: 'MATIC',// 2-6 characters long
						  decimals: 18,
						},
					},
				  ],
				});
			  } catch (addError) {
				alert(addError);
			  }
			}
		  }
	};

	const [modalIsOpen, setModalIsOpen] = useState(false);

	function openModal() {
	  setModalIsOpen(true);
	}
  
	function closeModal() {
	  setModalIsOpen(false);
	}

	



	/////////////////
	//LÓGICA BOTONES//
	/////////////////

	//Conexión con MetaMask y extracción de balances
	const connectWallet = async () => {
		try {
			if (!ethereum) {
				sethaveMetamask(false);
			}
			const networkUrl = await provider.getNetwork();
			if (networkUrl.name !== "maticmum") {
				await switchNetwork();
			}	
			setNetwork("maticmum");

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});
			setAccountAddress(accounts[0]); //Ether balance

			let balance = await provider.getBalance(accounts[0]);
			let bal = ethers.utils.formatEther(balance);
			setAccountBalance(bal); //balance de wei a ether

			const btt_balance = await tokenContract.balanceOf(accounts[0]);
			let btt_bal = ethers.utils.formatEther(btt_balance); 
			setBTTBalance(btt_bal); //balance token ERC-20 propio

			setIsConnected(true); 

		} catch (error) {
			setIsConnected(false);
		}
	};

	//Buy BTT tokens
	const BuyBTTokens = async () => {
		if (isConnected === true){
			if (!isNaN(buy_btt_value)){
				try{
					const __tokenprice = await ManagerContract.tokenPrice();
					const ethAmount = (buy_btt_value*ethers.utils.formatEther(__tokenprice)).toString();
					const weiAmount = ethers.utils.parseEther(ethAmount);
					const tx = await ManagerContract.buyTokens(weiAmount);
					await tx.wait(); // Esperar a que la transacción se confirme
					const new_bal = await tokenContract.balanceOf(accountAddress);
					setBTTBalance(ethers.utils.formatEther(new_bal));
					alert("BTT Comprados")
				} catch (error) {
					alert("Error al comprar tokens: " + error.message);
				}
			} else {
				alert("Select parameters")
			}
		} else {
			alert("Conect your wallet")
		}

	};

	//Store bet
	const StoreBet = async () => {
		if (isConnected === true){
			if (!isNaN(selectedWinner) && isNaN(selectedMatch.toString())) {
				try{
					const bet_price = await ManagerContract.betPrice();
					const bet_price_wei = ethers.utils.parseEther(bet_price.toString());
					const address_manager = ManagerContract.address

					const approved = await tokenContract.allowance(accountAddress,address_manager)
					if (approved >= bet_price_wei) {
						const tx = await ManagerContract.storeBet(selectedMatch,selectedWinner);
						await tx.wait(); // Esperar a que la transacción se confirme
					}
					else {
						alert("Primero debe aprobar fondos BTT al contrato")
						
						const tx_appr = await tokenContract.approve(address_manager,bet_price_wei);
						await tx_appr.wait();
						const tx = await ManagerContract.storeBet(selectedMatch,selectedWinner);
						await tx.wait(); // Esperar a que la transacción se confirme
					}

					await getMatchesTable();
				} catch (error) {
					alert("Error al comprar tokens: " + error.message);
				}
			} else {
				alert("Select parameters")
			}

		} else {
			alert("Conect your wallet")
		}

	};

	//Buy NFTS
	const BuyNFT = async() => {
		if (isConnected === true){
			if (!isNaN(selectedNFTtoBuy)) {
				try{
					const approved = await tokenContract.allowance(accountAddress,ManagerContract.address)
					const price_ = await ManagerContract.priceOfNFT(selectedNFTtoBuy);
					if (approved >= price_) {
						const tx = await ManagerContract.buyNFT(selectedNFTtoBuy);
						await tx.wait(); // Esperar a que la transacción se confirme
						
					}else{
						alert("Debe aprobar fondos BTT al contrato")
						const tx_appr = await NFTContract.approve(ManagerContract.address,price_);
						await tx_appr.wait();
						const tx = await ManagerContract.storeBet(selectedMatch,selectedWinner);
						await tx.wait(); // Esperar a que la transacción se confirme
						

					}
					await getNFTsTable();
				} catch (error) {
					alert("Error al comprar tokens: " + error.message);
				}
			} else {
				alert("Select parameters")
			}

		} else {
			alert("Conect your wallet")
		}

	};
	//List New NFT
	const ListNewNFT = async() => {
		if (isConnected === true){
			if (!isNaN(list_nft_id+list_nft_price)) {
				try{
					const tx = await ManagerContract.ListNFT(list_nft_id,list_nft_price);
					await tx.wait(); // Esperar a que la transacción se confirme
					const tx_appr = await NFTContract.approve(ManagerContract.address,selectedNFTtoBuy);
					await tx_appr.wait();

					await getNFTsTable();

				} catch (error) {
					alert("Error al comprar tokens: " + error.message);
				}
				
			} else {
				alert("Select parameters")
			}
		} else {
			alert("Conect your wallet")
		}
	};

	//Change NFT State
	const changeNFTState = async() => {
		if (isConnected === true){
			if (!isNaN(selectedNFTtoChange)) {
				try{
					const tx = await ManagerContract.changeStateSale(selectedNFTtoChange,false);
					await tx.wait(); // Esperar a que la transacción se confirme
					await getNFTsTable();
				} catch (error) {
					alert("Error al comprar tokens: " + error.message);
				}
			} else {
				alert("Select parameters")
			}

		} else {
			alert("Conect your wallet")
		}
	};

	//Change Price
	const changeNFTPrice = async() => {
		if (isConnected === true ){
			if (!isNaN(selectedNFTtoChangePrice+selectedNFTNewPrice)){
				try{
					const tx = await ManagerContract.changePrice(selectedNFTtoChangePrice,selectedNFTNewPrice);
					await tx.wait(); // Esperar a que la transacción se confirme

					await getNFTsTable();
				} catch (error) {
					alert("Error al cambiar el precior del NFT: " + error.message);
				}
				
			}else {
				alert("Select parameters")
			}
		} else {
			alert("Conect your wallet")
		}
	};

		// INPUTS
	//buy BTT tokens inputs
	const [buy_btt_value, setBuyBTT] = useState(2);
	const handleBuyBTT = (event) => {
	  setBuyBTT(parseInt(event.target.value));
	}

	//Store Bet inputs
	const [selectedMatch, setSelectedMatch] = useState();
	const [selectedWinner, setSelectedWinner] = useState();
	
	const handleMatchChange = (event) => {
	  setSelectedMatch(event.target.value);
	}

	const handleWinnerChange = (event) => {
		setSelectedWinner(parseInt(event.target.value));
	}

	//Buy NFT inputs
	const [selectedNFTtoBuy, setSelectedtoBuy] = useState();
	const handleNFTtoBuyChange = (event) => {
		setSelectedtoBuy(parseInt(event.target.value));
	}

	// List new nfts inputs
	const [list_nft_id, setNFTid] = useState();
	const [list_nft_price, setNFTPrice] = useState();
	const handleNFTid = (event) => {
		setNFTid(parseInt(event.target.value));
	}
	const handleNFTprice = (event) => {
		setNFTPrice(parseInt(event.target.value));
	}


	//Change state inputs
	const [selectedNFTtoChange, setSelectedtoState] = useState();
	const handleNFTtoStateChange = (event) => {
		setSelectedtoState(parseInt(event.target.value));
	}

	//Change Price
	const [selectedNFTNewPrice, setSelectedPrice] = useState();
	const [selectedNFTtoChangePrice, setSelectedNFTnewprice] = useState();
	const handleNewPriceChange = (event) => {
		setSelectedPrice(parseInt(event.target.value));
	}
	
	const handleNFTtoNewPriceChange = (event) => {
		setSelectedNFTnewprice(parseInt(event.target.value));
	}

	const [currentImage, setCurrentImage] = useState(0);


	//Galería imágenes

	function handlePreviousImage() {
		setCurrentImage((currentImage - 1 + nft_links.length) % nft_links.length);
	}

	function handleNextImage() {
		setCurrentImage((currentImage + 1) % nft_links.length);
	}

	
	return (

		<div className="App">
			<header className="App-header">
			<img src={staticLogo} className="Static-logo" alt="static logo" />
			<img src={logo} className="App-logo" alt="logo" />
			<h1 style={{position: 'fixed', bottom: '88%', left: '55%', transform: 'translate(-50%, 50%)'}}>Bet4NFT </h1>	
				{haveMetamask ? (
					<div className="App-header">
						{isConnected ? (
							<div className="card" style={{position: 'fixed', bottom: '92%', left: '93%', transform: 'translate(-80%, 70%)'}}>
								<div className="card-row">
									<h4>Wallet Address: {accountAddress.slice(0, 4)}...{accountAddress.slice(38, 42)}</h4>
								</div>
								<div className="card-row">
									<h4 >Network: {networkUrl}</h4>
								</div>
								<div className="card-row">
									<h4 >Matic Balance: {accountBalance}</h4>
								</div>
								<div className="card-row">
									<h4 >BTT Balance: {btt_balance}</h4>
								</div>
							</div>

						) : (
							<img src={logo} className="App-logo" alt="logo" />)}

						{isConnected ? (
							<span className="span-txt" style={{position: 'fixed',bottom: '94%', left: '93%',transform: 'translate(-70%, 100%)',color: '#61dafb'}}>🎉 Connected Successfully</span>
						) : (
							<button className="btn" onClick={connectWallet} style={{position: 'fixed', bottom: '92%', left: '90%', transform: 'translate(-50%, 50%)'}}>
								Connect your wallet
							</button>
						)}
					</div>
				) : (
					<p>Please Install MataMask</p>
				)}
			</header>
			<div className="table-container">
				<div>
					<table>
						<thead>
							<tr>
							<th>Match ID</th>
							<th>Event Creator</th>
							<th>Bets number</th>
							</tr>
						</thead>
						<tbody>
							{MatchesRows()}
						</tbody>
					</table>
				</div>
				<div>				
					<table>
						<thead>
							<tr>
							<th>NFT ID</th>
							<th>Holder</th>
							<th>Price</th>
							</tr>
						</thead>
						<tbody>
							{NFTRows()}												
						</tbody>
					</table>
				<Modal
					isOpen={modalIsOpen}
					onRequestClose={closeModal}
					style={modalStyles}>
					<div className="gallery">
						<img
							src={nft_links[currentImage]}
							alt={currentImage}
							style={{
							width: "80%",
							height: "20%",
						}}/>
						<div style={{position: "absolute", bottom: 25, width: "76.8%", backgroundColor: "rgba(0, 0, 0, 0.7)", textAlign: "center"}}>
							<p style={{color: "white", margin: "10px auto"}}>NFT ID: {currentImage}</p>
						</div>
						<button className='btn' onClick={handlePreviousImage} style={{position: 'fixed', bottom: '20%', left: '88%', 
									transform: 'translate(-50%, 50%)'}}>Previous</button>
						<button className='btn' onClick={handleNextImage} style={{position: 'fixed', bottom: '10%', left: '88%', 
									transform: 'translate(-50%, 50%)'}}>Next</button>
					</div>
				</Modal>
				<button className='btn' onClick={openModal} style={{position: 'fixed', bottom: '40%', left: '7%', transform: 'translate(-50%, 50%)'}}>NFT Gallery</button>
				</div>

				<div className='inputs-container'>
					<button className='btn' onClick={BuyBTTokens} style={{position: 'fixed', bottom: '67%', left: '75%', transform: 'translate(-50%, 50%)'}}>Buy BTT Tokens</button>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '68.3%', left: '85%', transform: 'translate(-0%, 50%)'}}>1 BTT = {tokenprice} ether </span>	
						<span className = 'txt-span' style={{position: 'fixed', bottom: '65.3%', left: '82%', transform: 'translate(-0%, 50%)'}}>Cantidad BTT</span>	
						<input type="number" min="2" step="1" value={buy_btt_value} onChange={handleBuyBTT} style={{position: 'fixed', bottom: '65%', left: '89%', transform: 'translate(-0%, 50%)',maxWidth:'7%'}}/>				


					<button className='btn' onClick={StoreBet} style={{position: 'fixed', bottom: '57%', left: '75%', transform: 'translate(-50%, 50%)'}}>Store Bet</button>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '58.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>Evento</span>	
						<select className='select-choice' value={selectedMatch} onChange={handleMatchChange} style={{position: 'fixed', bottom: '58%', left: '87.5%', transform: 'translate(-0%, 50%)'}}>
							<option value="">Seleccione una evento</option>
							{listMatches.map((match, index) => (
							<option key={index} value={match}>
							{match}
							</option>
						))}
						</select>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '55.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>Ganador</span>
						<select className='select-choice' value={selectedWinner} onChange={handleWinnerChange} style={{position: 'fixed', bottom: '55%', left: '87.5%', transform: 'translate(-0%, 50%)'}}>
							<option value="">Seleccione una ganador</option>
							<option value="1">Local</option>
							<option value="2">Visitante</option>
						</select>
	

					<button className='btn' onClick={BuyNFT} style={{position: 'fixed', bottom: '45%', left: '75%', transform: 'translate(-50%, 50%)'}}>Buy NFTs</button>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '45.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>NFT Id</span>	
						<select className='select-choice' value={selectedNFTtoBuy} onChange={handleNFTtoBuyChange} style={{position: 'fixed', bottom: '45%', left: '87.5%', transform: 'translate(-0%, 50%)'}}>
							<option value="">Seleccione un NFT</option>
							{listNFTS.map((nft, index) => (
								<option key={index} value={nft}>
								{nft.toString()}
								</option>
							))}
						</select>
						
					<button className='btn' onClick={ListNewNFT} style={{position: 'fixed', bottom: '35%', left: '75%', transform: 'translate(-50%, 50%)'}}>List new NFT</button>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '36.8%', left: '82%', transform: 'translate(-0%, 50%)',}}>NFT Id</span>	
						<input className='select-input'type="number" min="0" step="1" value={list_nft_id} onChange={handleNFTid} style={{position: 'fixed', bottom: '36.5%', left: '87.5%', transform: 'translate(-0%, 50%)'}}/>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '33.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>Price</span>	
						<input className='select-input'type="number" min="10" step="10" value={list_nft_price} onChange={handleNFTprice} style={{position: 'fixed', bottom: '33%', left: '87.5%', transform: 'translate(-0%, 50%)'}}/>
						
				
					<button className='btn' onClick={changeNFTState} style={{position: 'fixed', bottom: '25%', left: '75%', transform: 'translate(-50%, 50%)'}}>Change NFT State</button>
						<span className = 'txt-span' style={{position: 'fixed', bottom: '25.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>NFT Id</span>	
						<select className='select-choice' value={selectedNFTtoChange} onChange={handleNFTtoStateChange} style={{position: 'fixed', bottom: '25%', left: '87.5%', transform: 'translate(-0%, 50%)'}}>
							<option value="">Seleccione un NFT</option>
							{listNFTS.map((nft, index) => (
								<option key={index} value={nft}>
								{nft.toString()}
								</option>
							))}
						</select>

					<button className='btn' onClick={changeNFTPrice} style={{position: 'fixed', bottom: '13%', left: '75%', transform: 'translate(-50%, 50%)'}}>Change Price</button>  
					<span className = 'txt-span' style={{position: 'fixed', bottom: '14.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>NFT Id</span>	
					<select className='select-choice' value={selectedNFTtoChangePrice} onChange={handleNFTtoNewPriceChange} style={{position: 'fixed', bottom: '14%', left: '87.5%', transform: 'translate(-0%, 50%)'}}>
						<option value="">Seleccione un NFT</option>
						{listNFTS.map((nft, index) => (
							<option key={index} value={nft}>
							{nft.toString()}
							</option>
						))}
					</select>
					<span className = 'txt-span' style={{position: 'fixed', bottom: '11.3%', left: '82%', transform: 'translate(-0%, 50%)',}}>Price</span>	
					<input className='select-input' type="number" min="10" step="10" value={selectedNFTNewPrice} onChange={handleNewPriceChange} style={{position: 'fixed', bottom: '11%', left: '87.5%', transform: 'translate(-0%, 50%)'}}/>
				</div>	
			</div>
		</div>
	);
}

export default App;