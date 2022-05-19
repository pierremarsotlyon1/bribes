const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const { utils } = require("ethers");
const keccak256 = require("keccak256");

const CRV = "0xd533a949740bb3306d119cc777fa900ba034cd52";

const deployMultiMerkleStashContract = async () => {
  // Then, we deploy the MultiMerkleStash contract which will be use to claim rewards and persist merkle
  const MultiMerkleStashContract = await ethers.getContractFactory("MultiMerkleStash");
  const multiMerkleStash = await MultiMerkleStashContract.deploy();
  await multiMerkleStash.deployed();

  return multiMerkleStash;
};

const getMerkleRoot = async (ownerAddress) => {
  // Generate Merkle for a specific token, here CRV
  const users = [
    { index: 0, address: "0xD08c8e6d78a1f64B1796d6DC3137B19665cb6F1F", amount: 10 },
    { index: 0, address: "0xb7D15753D3F76e7C892B63db6b4729f700C01298", amount: 15 },
    { index: 0, address: "0xf69Ca530Cd4849e3d1329FBEC06787a96a3f9A68", amount: 30 },
    { index: 0, address: ownerAddress, amount: 30 },
  ];

  // equal to MerkleDistributor.sol #keccak256(abi.encodePacked(account, amount));
  const elements = users.map((x) =>
    utils.solidityKeccak256(["uint256", "address", "uint256"], [x.index, x.address, x.amount])
  );

  const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

  return {
    root: merkleTree.getHexRoot(),
    elements,
    merkleTree,
    users
  };
};

describe("MultiMerkleStash", function () {

  it("isClaimed without merkle tree", async function () {
    // First, we deploy splitFunds contract
    // Where team will receive token fees
    const merkleStash = await deployMultiMerkleStashContract();

    // Claim CRV without merkle tree
    expect(await merkleStash.isClaimed(CRV, 0)).to.be.false;
  });

  it("Claim without merkle tree", async function () {
    const [owner] = await ethers.getSigners();
    const merkleStash = await deployMultiMerkleStashContract();

    // Frozen because merkle tree not set
    await expect(merkleStash.claim(CRV, 0, owner.address, 100, [])).to.be.revertedWith("frozen");
  });

  it("Claim without merkle tree", async function () {
    const [owner] = await ethers.getSigners();
    const merkleStash = await deployMultiMerkleStashContract();

    // Frozen because merkle tree not set
    await expect(merkleStash.claim(CRV, 0, owner.address, 100, [])).to.be.revertedWith("frozen");
  });

  it("Set merkle root", async function () {
    const [owner] = await ethers.getSigners();
    const merkleStash = await deployMultiMerkleStashContract();

    const merkle = await getMerkleRoot(owner.address);
    const updateMerkleTx = await merkleStash.updateMerkleRoot(CRV, merkle.root);
    expect(await updateMerkleTx.wait());
  });

  it("Set merkle root and claim but not work", async function () {
    const [owner] = await ethers.getSigners();
    const merkleStash = await deployMultiMerkleStashContract();

    const merkle = await getMerkleRoot(owner.address);
    const proof = merkle.merkleTree.getHexProof(merkle.elements[3]);
    const wrongProof = merkle.merkleTree.getHexProof(merkle.elements[2]);

    // Set the merkle root
    const updateMerkleTx = await merkleStash.updateMerkleRoot(CRV, merkle.root);
    expect(await updateMerkleTx.wait());

    // Should not work because the amount is to high
    await expect(merkleStash.claim(CRV, 0, owner.address, 100, proof)).to.be.revertedWith("Invalid proof.");

    // Correct amount but no token in the SC, should revert
    await expect(merkleStash.claim(CRV, 0, owner.address, 30, proof)).to.be.revertedWith("SafeERC20: low-level call failed");

    // Should not work because proof is wrong
    await expect(merkleStash.claim(CRV, 0, owner.address, 30, wrongProof)).to.be.revertedWith("Invalid proof.");
  });
});
