const { expect } = require("chai");
const { ethers } = require("hardhat");

const deploySplitFundsContract = async () => {
  const SplitFundsContract = await ethers.getContractFactory("SplitFunds");
  const splitFunds = await SplitFundsContract.deploy();
  await splitFunds.deployed();
  return splitFunds;
};

describe("SplitFunds", function () {
  it("SplitFunds add team function", async function () {
    // First, we deploy splitFunds contract
    // Where team will receive token fees
    const splitFunds = await deploySplitFundsContract();
    
    const addTeamTx = await splitFunds.addTeam("0xb7BFcDC3a2AA2aF3Fe653C9E8a19830977E1993C", 1000);
    expect(await addTeamTx.wait());
  });

  it("SplitFunds should claim", async function () {
    const splitFunds = await deploySplitFundsContract();

    // Claim
    const claimTeamTx = await splitFunds.claimTeam(["0xd533a949740bb3306d119cc777fa900ba034cd52"]);

    expect(await claimTeamTx.wait());
  });
});
