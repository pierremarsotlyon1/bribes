const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const { utils } = require("ethers");
const keccak256 = require("keccak256");

const CRV = "0xd533a949740bb3306d119cc777fa900ba034cd52";
const USDT_GAUGE = "0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53";

const deployTestToken = async () => {
    const TestTokenContract = await ethers.getContractFactory("TestToken");
    const testToken = await TestTokenContract.deploy(10000);
    await testToken.deployed();
    return testToken;
};

const deploySplitFundsContract = async () => {
    const SplitFundsContract = await ethers.getContractFactory("SplitFunds");
    const splitFunds = await SplitFundsContract.deploy();
    await splitFunds.deployed();
    return splitFunds;
};

const deployMultiMerkleStashContract = async () => {
    // Then, we deploy the MultiMerkleStash contract which will be use to claim rewards and persist merkle
    const MultiMerkleStashContract = await ethers.getContractFactory("MultiMerkleStash");
    const multiMerkleStash = await MultiMerkleStashContract.deploy();
    await multiMerkleStash.deployed();

    return multiMerkleStash;
};

const deploySdVeCRVContract = async (splitFundsAddress, multiMerkleStashAddress) => {
    // Then, we deploy the MultiMerkleStash contract which will be use to claim rewards and persist merkle
    const sdVeCRVContract = await ethers.getContractFactory("SdVeCRV");
    const sdVeCRV = await sdVeCRVContract.deploy(splitFundsAddress, multiMerkleStashAddress);
    await sdVeCRV.deployed();

    return sdVeCRV;
};

describe("sdVeCRV", function () {

    it("Should mint test token", async function () {
        // Mint test token
        const testToken = await deployTestToken();
        await expect(testToken.address).is.not.null;

    });

    it("Should deploy contracts", async function () {
        // First, we deploy splitFunds contract
        // Where team will receive token fees
        const merkleStash = await deployMultiMerkleStashContract();
        const splitFunds = await deploySplitFundsContract();
        const sdVeCRV = await deploySdVeCRVContract(splitFunds.address, merkleStash.address);

        // Claim CRV without merkle tree
        expect(sdVeCRV.address).is.not.null;
    });

    it("Should replace distributor", async function () {
        // First, we deploy splitFunds contract
        // Where team will receive token fees
        const merkleStash = await deployMultiMerkleStashContract();
        const splitFunds = await deploySplitFundsContract();
        const sdVeCRV = await deploySdVeCRVContract(splitFunds.address, merkleStash.address);

        // Claim CRV without merkle tree
        expect(sdVeCRV.address).is.not.null;

        // replace distributor
        const newMerkleStash = await deployMultiMerkleStashContract();
        await expect(sdVeCRV.updateDistributor(newMerkleStash.address)).to.emit(sdVeCRV, "UpdatedDistributor").withArgs(newMerkleStash.address);

        // Check distributor
        expect(await sdVeCRV.distributor()).to.equals(newMerkleStash.address);
    });

    it("Should fail the depositReward because token not listed", async function () {
        // Mint test token
        const testToken = await deployTestToken();

        // First, we deploy splitFunds contract
        // Where team will receive token fees
        const merkleStash = await deployMultiMerkleStashContract();
        const splitFunds = await deploySplitFundsContract();
        const sdVeCRV = await deploySdVeCRVContract(splitFunds.address, merkleStash.address);

        // Get current week
        const currentWeek = await sdVeCRV.week();

        // Add bribe without list token, should not work
        await expect(sdVeCRV.depositReward(testToken.address, 100, currentWeek + 1, USDT_GAUGE)).to.be.revertedWith("token unlisted");
    });

    it("Should depositReward with listed token", async function () {
        // Mint test token
        const testToken = await deployTestToken();

        // First, we deploy splitFunds contract
        // Where team will receive token fees
        const merkleStash = await deployMultiMerkleStashContract();
        const splitFunds = await deploySplitFundsContract();
        const sdVeCRV = await deploySdVeCRVContract(splitFunds.address, merkleStash.address);

        // Get current week
        const currentWeek = await sdVeCRV.week();

        const listTokenTx = await sdVeCRV.listToken(testToken.address);
        expect(await listTokenTx.wait());

        // Add bribe without list token, should not work
        const depositTokenTx = await sdVeCRV.depositReward(testToken.address, 100, currentWeek + 1, USDT_GAUGE);
        expect(await depositTokenTx.wait());
    });
});
