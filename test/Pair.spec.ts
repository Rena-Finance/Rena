import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { RenaswapV1Factory } from "../typechain/RenaswapV1Factory";
import { RenaswapV1Pair } from "../typechain/RenaswapV1Pair";
import { RenaswapV1Wrapper } from "../typechain/RenaswapV1Wrapper";
import { FakeERC20 } from "../typechain/FakeERC20";
import { BigNumber } from "ethers";

chai.use(solidity);

const { expect } = chai;

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Pair", () => {
  let factory : RenaswapV1Factory;
  let pair : RenaswapV1Pair;
  let owner : string;
  let its : FakeERC20;
  let rena : FakeERC20;
  let wrapper : RenaswapV1Wrapper;

  let initContracts = async function() {
    const signers = await ethers.getSigners();
    owner = await signers[0].getAddress();

    const erc20Factory = await ethers.getContractFactory("FakeERC20", signers[0]);
    its = (await erc20Factory.deploy()) as FakeERC20;
    await its.deployed();
    rena = (await erc20Factory.deploy()) as FakeERC20;
    await rena.deployed();

    const wrapperFactory = await ethers.getContractFactory(
      "RenaswapV1Wrapper",
      signers[0]
    );

    wrapper = (await wrapperFactory.deploy("")) as RenaswapV1Wrapper;

    const factoryFactory = await ethers.getContractFactory("RenaswapV1Factory", signers[0]);
    factory = (await factoryFactory.deploy(signers[0].address, wrapper.address)) as RenaswapV1Factory;
    await factory.deployed();
  }

  let initRenaItsPair = async function() {
    const signers = await ethers.getSigners();
    // create rRena/ITS pair
    await factory.createPair(its.address, rena.address);
    const pairAddress = await factory.getPair(its.address, rena.address);
    pair = await ethers.getContractAt("RenaswapV1Pair", pairAddress) as RenaswapV1Pair;
    //await wrapper.setDestination(pair.address, signers[0].address);
    // mint rRena
    await rena.increaseAllowance(wrapper.address, 10**6);
    await wrapper.transferFrom(owner, pair.address, 10**6); //send its to pair
    // generate liquidity
    await its.transfer(pair.address, 10**6); //send its to pair
    await expect(pair.mint(owner)).to.emit(pair, "Mint"); // mint liquidity
    expect(await pair.balanceOf(owner)).to.be.equal(BigNumber.from("999000"));
  }
  
  beforeEach(async () => {
    await initContracts();
  });

  describe("Renaswap pair creation", async() => {

    it("trying to call transferFrom on the wrapper with the sender being not self should fail", async () => {
      const signers = await ethers.getSigners();
      // create rRena/ITS pair
      await factory.createPair(its.address, rena.address);
      const pairAddress = await factory.getPair(its.address, rena.address);
      pair = await ethers.getContractAt("RenaswapV1Pair", pairAddress) as RenaswapV1Pair;
      //try and mint rena
      await expect(wrapper.transferFrom(signers[1].address, pair.address, 10**6)).to.be.revertedWith("RenaswapV1: caller is not owner nor approved");
    });

    it("create rena/its pair", async () => {
      await initRenaItsPair();
    });
  })

  describe("Renaswap trade", async() => {
    beforeEach(async () => {
      await initContracts();
      await initRenaItsPair();
    });

    it("buy ITS with RENA", async () => {
      // mint rRena
      await rena.increaseAllowance(wrapper.address, 5555); //send rena to wrapper
      await wrapper.transferFrom(owner, pair.address, 5555);
      await expect(pair.swap(BigNumber.from("1000"), BigNumber.from("0"), owner, "0x")).to.emit(pair, "Swap");
    });

    it("buy RENA with ITS should fail", async () => {
      await its.transfer(pair.address, 5555);
      await expect(pair.swap(BigNumber.from("0"), BigNumber.from("1000"), owner, "0x")).to.be.revertedWith("UniswapV2: TRANSFER_FAILED");
    });

    it("should burn some rRena", async () => {
      // mint rRena
      await rena.increaseAllowance(wrapper.address, 5555); //send rena to wrapper
      await wrapper.transferFrom(owner, pair.address, 5555);
      let preBalance = await wrapper.balanceFor(rena.address, pair.address);
      await wrapper.rBurn(pair.address, BigNumber.from("2"));
      let balance = await wrapper.balanceFor(rena.address, pair.address);
      await expect(balance).to.eq(preBalance.div(2));
    });
    it("should fail to burn rRena", async () => {
      // mint rRena
      await rena.increaseAllowance(wrapper.address, 5555); //send rena to wrapper
      await wrapper.transferFrom(owner, pair.address, 5555);
      let preBalance = await wrapper.balanceFor(rena.address, pair.address);
      await wrapper.rBurn(pair.address, BigNumber.from("2"));
      let balance = await wrapper.balanceFor(rena.address, pair.address);
      await expect(wrapper.rBurn(pair.address, BigNumber.from("2"))).to.be.reverted
    });

  });
});