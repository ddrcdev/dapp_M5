import { useState} from 'react';
import { ethers } from 'ethers';
import './App.css';

import logo from './logo.svg';
import staticLogo from './logo-btt.png';

//Conexión red Ganache
const ganacheUrl = "http://localhost:8545";
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

//Instancia contrato Token.sol 
const tokenJson = require('./contracts/Token.json'); // si usas require()
const tokenContract = new ethers.Contract(tokenJson.networks[5777].address, tokenJson.abi, signer);

//Instancia contrato NFT.sol 
const NFTJson = require('./contracts/NFT.json'); // si usas require()
const NFTContract = new ethers.Contract(NFTJson.networks[5777].address, NFTJson.abi, signer);


//Instancia contrato Manager.sol 
const ManagerJson = require('./contracts/Manager.json');
const ManagerContract = new ethers.Contract(ManagerJson.networks[5777].address, ManagerJson.abi, signer);



function App() {

	//STATES
	const { ethereum } = window;
	const [haveMetamask, sethaveMetamask] = useState(true);
	const [isConnected, setIsConnected] = useState(false);

	const [accountAddress, setAccountAddress] = useState(''); //Cuenta conectada
	const [accountBalance, setAccountBalance] = useState(''); //Balance ether
	const [btt_balance, setBTTBalance] = useState(0); //Balance BTT
	
	const [tokenprice,setTokenPrice] = useState();

	async function getTokenPrice() {
		const _tokenprice = await ManagerContract.tokenPrice();
		const aux = ethers.utils.formatEther(_tokenprice);
		setTokenPrice(aux);
	}

	getTokenPrice();

	// TABLES
	const [tableMatches,setMatchesList] = useState([]);
	const [listMatches,setMatches] = useState([]);

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
	  
	getMatchesTable();
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
	  
	getNFTsTable();
	const NFTRows = () => {
		return catalog.map(item => (
		  <tr key={item.id}>
			<td>{item.id}</td>
			<td>{item.holder}</td>
			<td>{item.price}</td>
		  </tr>
		));
	}


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


	/////////////////
	//LÓGICA BOTONES//
	/////////////////

	//Conexión con MetaMask y extracción de balances
	const connectWallet = async () => {
		try {
			if (!ethereum) {
				sethaveMetamask(false);
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			let balance = await provider.getBalance(accounts[0]);
			let bal = ethers.utils.formatEther(balance);


			setAccountAddress(accounts[0]); //Ether balance
			setAccountBalance(bal); //balance de wei a ether
			setIsConnected(true); 

			
			const btt_balance = await tokenContract.balanceOf(accounts[0]);
			let btt_bal = ethers.utils.formatEther(btt_balance); 
			setBTTBalance(btt_bal); //balance token ERC-20 propio

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
				} catch (error) {
					alert("Error al comprar tokens: " + error.message);
				}
				
			}else {
				alert("Select parameters")
			}
		} else {
			alert("Conect your wallet")
		}
	};




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
									<h4>Wallet Address:</h4>
									<p>
										{accountAddress.slice(0, 4)}...
										{accountAddress.slice(38, 42)}
									</p>
								</div>
								<div className="card-row">
									<h4 >Network:</h4>
									<p>{ganacheUrl}</p>
								</div>
								<div className="card-row">
									<h4 >Wallet Ether Balance:</h4>
									<p>{accountBalance}</p>
								</div>
								<div className="card-row">
									<h4 >Wallet BTT Balance:</h4>
									<p>{btt_balance}</p>
								</div>
							</div>
						) : (
							<img src={logo} className="App-logo" alt="logo" />)}

						{isConnected ? (
							<p className="info" style={{position: 'fixed', bottom: '88.5%', left: '96%', transform: 'translate(-100%, 70%)'}}>🎉 Connected Successfully</p>
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
			<div className="table-container-matches">
				<table id="table-matches">
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
				<button className='btn' onClick={BuyBTTokens} style={{position: 'fixed', bottom: '67%', left: '75%', transform: 'translate(-50%, 50%)'}}>Buy BTT Tokens</button>
				<span style={{position: 'fixed', bottom: '68.3%', left: '91%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>1 BTT = {tokenprice} ether </span>	
				<input type="number" min="2" step="1" value={buy_btt_value} onChange={handleBuyBTT} style={{position: 'fixed', bottom: '65%', left: '93%', transform: 'translate(-50%, 50%)'}}/>				
				<span style={{position: 'fixed', bottom: '65.3%', left: '85%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>Cantidad BTT</span>	

				<button className='btn' onClick={StoreBet} style={{position: 'fixed', bottom: '57%', left: '75%', transform: 'translate(-50%, 50%)'}}>Store Bet</button>
				
				<select value={selectedMatch} onChange={handleMatchChange} style={{position: 'fixed', bottom: '58%', left: '93%', transform: 'translate(-50%, 50%)'}}>
					<option value="">Seleccione una evento</option>
					{listMatches.map((match, index) => (
					<option key={index} value={match}>
					{match}
					</option>
				))}
				</select>
				<span style={{position: 'fixed', bottom: '58.3%', left: '84.5%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>Evento</span>	

				<select value={selectedWinner} onChange={handleWinnerChange} style={{position: 'fixed', bottom: '55%', left: '93%', transform: 'translate(-50%, 50%)'}}>
					<option value="">Seleccione una ganador</option>
					<option value="1">Local</option>
					<option value="2">Visitante</option>
				</select>
				<span style={{position: 'fixed', bottom: '55.3%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>Ganador</span>	

			</div>
			<div className="table-container-nfts">
				<table className = "table" id = "table-nfts">
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
				<button className='btn' onClick={BuyNFT} style={{position: 'fixed', bottom: '45%', left: '75%', transform: 'translate(-50%, 50%)'}}>Buy NFTs</button>
				<select value={selectedNFTtoBuy} onChange={handleNFTtoBuyChange} style={{position: 'fixed', bottom: '45%', left: '93%', transform: 'translate(-60%, 50%)'}}>
					<option value="">Seleccione un NFT</option>
					{listNFTS.map((nft, index) => (
						<option key={index} value={nft}>
						{nft.toString()}
						</option>
					))}
				</select>
				<span style={{position: 'fixed', bottom: '45.3%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>NFT Id</span>	

				<button className='btn' onClick={ListNewNFT} style={{position: 'fixed', bottom: '35%', left: '75%', transform: 'translate(-50%, 50%)'}}>List new NFT</button>
				<input type="number" min="0" step="1" value={list_nft_id} onChange={handleNFTid} style={{position: 'fixed', bottom: '36.5%', left: '93%', transform: 'translate(-50%, 50%)'}}/>
				<span style={{position: 'fixed', bottom: '36.8%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>NFT Id</span>	
				<input type="number" min="10" step="10" value={list_nft_price} onChange={handleNFTprice} style={{position: 'fixed', bottom: '33%', left: '93%', transform: 'translate(-50%, 50%)'}}/>
				<span style={{position: 'fixed', bottom: '33.3%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>Price</span>	

				<button className='btn' onClick={changeNFTState} style={{position: 'fixed', bottom: '25%', left: '75%', transform: 'translate(-50%, 50%)'}}>Change NFT State</button>
				<select value={selectedNFTtoChange} onChange={handleNFTtoStateChange} style={{position: 'fixed', bottom: '25%', left: '93%', transform: 'translate(-60%, 50%)'}}>
					<option value="">Seleccione un NFT</option>
					{listNFTS.map((nft, index) => (
						<option key={index} value={nft}>
						{nft.toString()}
						</option>
					))}
				</select>
				<span style={{position: 'fixed', bottom: '25.3%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>NFT Id</span>	
				
				<button className='btn' onClick={changeNFTPrice} style={{position: 'fixed', bottom: '13%', left: '75%', transform: 'translate(-50%, 50%)'}}>Change Price</button>  
				<select value={selectedNFTtoChangePrice} onChange={handleNFTtoNewPriceChange} style={{position: 'fixed', bottom: '14%', left: '93%', transform: 'translate(-60%, 50%)'}}>
					<option value="">Seleccione un NFT</option>
					{listNFTS.map((nft, index) => (
						<option key={index} value={nft}>
						{nft.toString()}
						</option>
					))}
				</select>
				<span style={{position: 'fixed', bottom: '14.3%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>NFT Id</span>	
				<input type="number" min="10" step="10" value={selectedNFTNewPrice} onChange={handleNewPriceChange} style={{position: 'fixed', bottom: '11%', left: '93%', transform: 'translate(-50%, 50%)'}}/>
				<span style={{position: 'fixed', bottom: '11.3%', left: '86%', transform: 'translate(-50%, 50%)',fontSize: 20, color: 'white'}}>Price</span>	
				
			</div>			

		</div>
	);
}

export default App;