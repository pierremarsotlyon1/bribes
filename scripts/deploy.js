// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // First, we deploy splitFunds contract
    // Where team will receive token fees
    const SplitFundsContract = await ethers.getContractFactory("SplitFunds");
    const splitFunds = await SplitFundsContract.deploy();
    await splitFunds.deployed();
    
    const splitFundsAddress = splitFunds.address;

    // Then, we deploy the MultiMerkleStash contract which will be use to claim rewards and persist merkle
    const MultiMerkleStashContract = await ethers.getContractFactory("MultiMerkleStash");
    const multiMerkleStash = await MultiMerkleStashContract.deploy();
    await multiMerkleStash.deployed();

    const multiMerkleStashAddress = multiMerkleStash.address;

    // Now, we can deploy StashController which need MultiMerkleStash address to be deploy
    const StashControllerContract = await ethers.getContractFactory("StashController");
    const stashController = await StashControllerContract.deploy(multiMerkleStashAddress);
    await stashController.deployed();

    const stashControllerAddress = stashController.address;

    // Finally, we deploy the SdVeCRV contract which is here to list token and receive bribes
    const SdVeCRVContract = await ethers.getContractFactory("SdVeCRV");
    const sdVeCRV = await SdVeCRVContract.deploy(splitFundsAddress, multiMerkleStashAddress);
    await sdVeCRV.deployed();

    const sdVeCRVAddress = sdVeCRV.address;

  console.log("SplitFunds deployed to:", splitFundsAddress);
  console.log("MultiMerkleStash deployed to:", multiMerkleStashAddress);
  console.log("StashController deployed to:", stashControllerAddress);
  console.log("SdVeCRV deployed to:", sdVeCRVAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
