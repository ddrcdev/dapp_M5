const Token = artifacts.require("Token");
const NFT = artifacts.require("NFT");
const Manager = artifacts.require("Manager");

//const Oracle = artifacts.require("Oracle")

const Web3 = require("web3");


module.exports = async (deployer) => {
  
  await deployer.deploy(Token);
  await deployer.deploy(NFT)
  .then(() => {
    return deployer.deploy(Manager, Token.address, NFT.address);
  }).catch((error) => {
    console.log(error);
  });
  tokenInstance = await Token.deployed();
  const amount = Web3.utils.toWei("1000", "ether");
  await tokenInstance.mint(Manager.address, amount);

  //await deployer.deploy(Oracle)

};