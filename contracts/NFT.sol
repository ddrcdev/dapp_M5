// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    mapping(address => bool) public _admins;
    constructor() ERC721("BetNFT721", "BTT721") {
        _safeMint(msg.sender,0);
        _safeMint(msg.sender,1);
        _safeMint(msg.sender,2);
        _admins[msg.sender] = true;
    }

    function safeMint(address to, uint256 tokenId) public {
        require(_admins[msg.sender] == true, "Only admins can mint");
        _safeMint(to, tokenId);
    }

    function ChangeAdminRole(address user, bool AdminRol) public {

        require(_admins[msg.sender] == true, "Only admins can change admin rol");
        _admins[user] = AdminRol;
    }

    function isAdmin(address user) public view returns (bool){
        return (_admins[user]); 
    }
}




