// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Manager {

    //Admins
    mapping(address => bool) public _admins;
    // Dirección para recibir forndos 
    address payable public  owner;

    //Mapping de direcciones y apuestas
    mapping(string => mapping(address => uint256)) public _matches; 
    mapping(string => address) public _matchCreators;
    string[] public matches_ids;
    mapping(string => uint256) public _bets;

    //Precio de apuesta (n tokensERC20)
    uint256 public betPrice;

    // Variables token - ERC20
    IERC20 public token;
    uint256 public tokenPrice;

    //Variables NFT - ERC721
    IERC721 public nft;
    mapping(uint256 => mapping(address => uint256)) public _catalog;    
    mapping(uint256 => bool) public _purchasable;
    uint256[] public _catalog_ids;


    //Eventos 
    event TokenSold(address user,uint256 amount);
    event NFTsold(uint256 _tokenId, address from, address to);
    event BetSaved(string id_match,address user, uint256 bet);

    modifier onlyAdmins {
            require(_admins[msg.sender] == true, "Only the admins can do this."); //Only the owner can register evidences.
            _;
    }

    constructor(address _tokenAddress, address _nftAddress) {
        //General
        _admins[msg.sender] = true;
        owner = payable(address(this));
        //Manager
        _matches["Q1a: Real Madrid - Chelsea"][msg.sender] = 0;
        _matches["Q1b: FC Bayern - Manchester City"][msg.sender] = 0;
        _matches["Q2a: Benfica - Inter Milan"][msg.sender] = 0;
        _matches["Q2b: AC Milan - Napoli"][msg.sender] = 0;
        _matchCreators["Q1a: Real Madrid - Chelsea"] = msg.sender;
        _matchCreators["Q1b: FC Bayern - Manchester City"] = msg.sender;
        _matchCreators["Q2a: Benfica - Inter Milan"] = msg.sender;
        _matchCreators["Q2b: AC Milan - Napoli"] = msg.sender;
        matches_ids.push("Q1a: Real Madrid - Chelsea");
        matches_ids.push("Q1b: FC Bayern - Manchester City");
        matches_ids.push("Q2a: Benfica - Inter Milan");
        matches_ids.push("Q2b: AC Milan - Napoli");
        _bets["Q1a: Real Madrid - Chelsea"] = 0;
        _bets["Q1b: FC Bayern - Manchester City"] = 0;
        _bets["Q2a: Benfica - Inter Milan"] = 0;
        _bets["Q2b: AC Milan - Napoli"] = 0;
        betPrice = 2;
        //Token
        token = IERC20(_tokenAddress);
        tokenPrice = 10**15; // 1000 token ERC20 vale 1 token nativos - 
    
        //NFT
        nft = IERC721(_nftAddress);
        _catalog[0][msg.sender] = 10;
        _catalog[1][msg.sender] = 20;
        _catalog[2][msg.sender] = 30;
        _purchasable[0] = true;
        _purchasable[1] = true;
        _purchasable[2] = true; 
        _catalog_ids.push(0);
        _catalog_ids.push(1);
        _catalog_ids.push(2);   

    }

    //Funciones write para usuarios

    function storeBet (string memory id_match, uint256 winner) public {
        require(_matchCreators[id_match] != msg.sender ,"Match creator can not bet");
        require(winner == 1 || winner == 2 ,"Choose a valid bet (1,2)");
        require(_matches[id_match][_matchCreators[id_match]] == 0 ,"Match is over");
        require(checkUserbet(id_match,msg.sender) != winner,"Your bet is already saved or the id-match is invalid");
        require(token.balanceOf(msg.sender) >= betPrice,"You need 2 tokens at least");
        require(token.transferFrom(msg.sender,owner,betPrice*10**18),"You need to approve token balance");

        if (_matches[id_match][msg.sender] != 0) {
            _bets[id_match] += 1; 
        }
        _matches[id_match][msg.sender] = winner;
        
        emit BetSaved(id_match,msg.sender, winner);
               
    }

    function buyTokens(uint256 ethAmount) public payable {
        require(ethAmount >= tokenPrice,"Not enough eth provided");
        uint256 _tokenAmount = ethAmount/tokenPrice;
        address payable sender = payable(msg.sender);
        require(sender.balance >= ethAmount, "Not enough eth available");
        require(token.balanceOf(owner) >= _tokenAmount*10**18, "Not enough tokens available");
            
        transferTokens(sender, _tokenAmount*10**18); // llama a la función separada para transferir tokens
        //transferEth(owner, ethAmount); // llama a la función separada para transferir ETH

        emit TokenSold(sender, _tokenAmount);
    }

    function transferTokens(address recipient, uint256 tokenAmount) private {
        require(token.transfer(recipient, tokenAmount), "Token transfer failed");
    }

    function transferEth(address payable recipient, uint256 amount) private {
        recipient.transfer(amount);
    }

    function buyNFT(uint256 _tokenId) public {
        address holder = payable(nft.ownerOf(_tokenId));
        require(nft.ownerOf(_tokenId) != msg.sender,"You are the owner");
        require(nft.getApproved(_tokenId) == owner,"Get approval of the NFT first");
        require(_purchasable[_tokenId] == true, "NFT is not for sale"); 
        require(token.transferFrom(msg.sender, holder, _catalog[_tokenId][holder]), "Token transfer failed");


        nft.transferFrom(holder, msg.sender, _tokenId);
        
        _catalog[_tokenId][msg.sender] = _catalog[_tokenId][holder];

        delete _catalog[_tokenId][holder];
        delete _catalog_ids[_tokenId];

        _purchasable[_tokenId] = false;

        emit NFTsold(_tokenId,holder,msg.sender);
    }

    function ListNFT(uint256 _tokenId, uint256 price) public {
        require(nft.ownerOf(_tokenId) == msg.sender, "Only owner can do this.");

        _catalog[_tokenId][msg.sender] = price;
        _catalog_ids.push(_tokenId);
        _purchasable[_tokenId] = true;

    }

    function changeStateSale (uint256 _tokenId, bool state) public {
        require(nft.ownerOf(_tokenId) == msg.sender, "Only owner can do this.");
        require(_purchasable[_tokenId] != state, "Your state is already saved");
        _purchasable[_tokenId] = state;
        delete _catalog_ids[_tokenId];

    }

    function changePrice (uint256 _tokenId, uint256 price) public {
        require(nft.ownerOf(_tokenId) == msg.sender, "Only owner can do this.");
        _catalog[_tokenId][msg.sender] = price;

    }

    // Funciones para administrados

    function createMatch(string memory id_match) public onlyAdmins {
            require (_matchCreators[id_match] == 0x0000000000000000000000000000000000000000,"Match is already created");
            _matches[id_match][msg.sender] = 0;
            _matchCreators[id_match] = msg.sender;
            matches_ids.push(id_match); 
    }

    function closeMatch(string memory id_match, uint256 winner) public onlyAdmins {
        require(_matchCreators[id_match] == msg.sender, "Only match creator can close it.");
        require(winner == 1 || winner == 2 ,"Choose a valid bet (1,2)");
        require(_matches[id_match][_matchCreators[id_match]] == 0 ,"Match is over");
        
        _matches[id_match][msg.sender] = winner;
        for (uint256 i = 0; i < matches_ids.length; i++) {
            if (keccak256(bytes(matches_ids[i])) == keccak256(bytes(id_match))) {
                delete matches_ids[i];
            }
        }

    }


    //Funciones de gestión del contrato

    function ChangeAdminRole(address user, bool AdminRol) public onlyAdmins {

        _admins[user] = AdminRol;
    }

    function setTokenPrice(uint256 _tokenPrice) public onlyAdmins{
        tokenPrice = _tokenPrice;
    }

    function withdrawTokens() public onlyAdmins {
        require(token.transfer(msg.sender, token.balanceOf(owner)), "Token transfer failed");
    }

    function withdrawEther() public onlyAdmins {
        require(owner.balance != 0, "Not eth funds");
        payable(msg.sender).transfer(owner.balance);
    }

    // Funciones view

    function isAdmin(address user) public view returns (bool) {
        return _admins[user];
    }

    function MatchCreator(string memory id_match) public view returns (address){
        return (_matchCreators[id_match]); 
    }

    function checkUserbet(string memory id_match, address user) public view returns (uint256){
        return (_matches[id_match][user]); 
    }


    function checkMatchResult(string memory id_match) public view returns (uint256){
        require(_matches[id_match][_matchCreators[id_match]] != 0,"Match is not over");
        return (_matches[id_match][_matchCreators[id_match]]); 
    } 

    function isNFTpurchasable(uint256 _tokenId) public view returns (bool) {
        bool state = _purchasable[_tokenId];
        return(state);
    }

    function priceOfNFT(uint256 _tokenId)public view returns (uint256) {
        address holder = nft.ownerOf(_tokenId);
        uint256 price = _catalog[_tokenId][holder];
        return (price);
    }

    function getMatches() public view returns (string[] memory) {
        return(matches_ids);        
    }
    function getCatalog() public view returns (uint256[] memory) {
        return(_catalog_ids);        
    }

    // Funciones external payable    

    receive() external payable {
        //emit Received (msg.value);
    }

    fallback() external payable {
        
    }
}
