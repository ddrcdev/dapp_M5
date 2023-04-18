const Token = artifacts.require("Token");
const NFT = artifacts.require("NFT");
const Manager = artifacts.require("Manager");


module.exports = function (deployer) {
  
  deployer.deploy(Token);
  deployer.deploy(NFT)
  .then(() => {
    return deployer.deploy(Manager, Token.address, NFT.address);
  });

};