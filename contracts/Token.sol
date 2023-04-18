// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public _admins;


    modifier onlyAdmins {
        require(_admins[msg.sender] == true, "Only the admins can do this."); //Only the owner can register evidences.
        _;
    }

    constructor() ERC20("Bet4NFT", "BTT") {
        _mint(msg.sender,1000000000000000000000);
        _admins[msg.sender] = true;}


    // Add or remove admin rol 
    function changeRolAdmin(address user, bool rol) public {
        require(_admins[msg.sender] == true, "Only an admin can add a new admin");
        _admins[user] = rol;

    }


    // Mint <amount> tokens on address <to>
    function mint(address to, uint256 amount) public onlyAdmins{
        _mint(to, amount);
    }
    
}


