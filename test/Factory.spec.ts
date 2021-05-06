import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { RenaswapV1Factory } from "../typechain/RenaswapV1Factory";
import { RenaswapV1Wrapper } from "../typechain/RenaswapV1Wrapper";
import { FakeERC20 } from "../typechain/FakeERC20";

chai.use(solidity);

const { expect } = chai;

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Factory", () => {
  let factory : RenaswapV1Factory;
  let factoryRO : RenaswapV1Factory;
  let owner : string;
  let token0 : FakeERC20;
  let token1 : FakeERC20;
  let wrapper : RenaswapV1Wrapper;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    owner = await signers[0].getAddress();
    const factoryFactory = await ethers.getContractFactory(
      "RenaswapV1Factory",
      signers[0]
    );

    const wrapperFactory = await ethers.getContractFactory(
      "RenaswapV1Wrapper",
      signers[0]
    );

    wrapper = (await wrapperFactory.deploy("")) as RenaswapV1Wrapper;
    factory = (await factoryFactory.deploy(signers[0].address, wrapper.address)) as RenaswapV1Factory;
    await factory.deployed();

    factoryRO = factory.connect(signers[1]);
    const erc20Factory = await ethers.getContractFactory("FakeERC20", signers[0]);
    token0 = (await erc20Factory.deploy()) as FakeERC20;
    await token0.deployed();

    token1 = (await erc20Factory.deploy()) as FakeERC20;
    await token1.deployed();
  });

  describe("Fee to setter", async() => {
    it("default fee to setter should be the owner", async () => {
      const setter = await factory.feeToSetter();
      expect(setter).to.eq(owner);
    });

    it("owner should be able to set feeToSetter", async () => {
      const setters = await ethers.getSigners();
      const newFeeTo = setters[1].address;
      await factory.setFeeToSetter(newFeeTo);
      const setter = await factory.feeToSetter();
      expect(setter).to.eq(newFeeTo);
    });

    it("should fail to set feeTo as non owner", async () => {
      await expect(factoryRO.setFeeTo(owner)).to.be.revertedWith("UniswapV2: FORBIDDEN");
    });
  })

  describe("Pairs", async() => {
    it("should succeed to add a pair as owner", async () => {
      await expect(factory.createPair(token0.address, token1.address)).to.emit(factory, "PairCreated");
      const pair = await factory.getPair(token0.address, token1.address);
      expect(pair).to.not.eq(0);
    });

    it("should fail to add a pair as non owner", async () => {
      await expect(factoryRO.createPair(token0.address, token1.address)).to.be.revertedWith("RenaswapV1: FORBIDDEN");
    });

    it("should fail on duplicate pair creation", async () => {
      await factory.createPair(token0.address, token1.address);
      await expect(factory.createPair(token0.address, token1.address)).to.be.revertedWith("RenaswapV1: PAIR_EXISTS");
    });

    it("should fail to add a pair if one of the tokens is the zero address", async () => {
      await expect(factory.createPair(zeroAddress, token1.address)).to.be.revertedWith("RenaswapV1: ZERO_ADDRESS");
      await expect(factory.createPair(token0.address, zeroAddress)).to.be.revertedWith("RenaswapV1: ZERO_ADDRESS");
    });
  })
});