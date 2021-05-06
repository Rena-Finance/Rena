import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { RenaswapV1Factory } from "../typechain/RenaswapV1Factory";
import { UniswapV2Pair } from "../typechain/UniswapV2Pair";
import { RenaswapV1Wrapper } from "../typechain/RenaswapV1Wrapper";
import { RenaswapV1Router } from "../typechain/RenaswapV1Router";
import { FakeERC20 } from "../typechain/FakeERC20";
import { Rena } from "../typechain/Rena";
import { BigNumber } from "ethers";

chai.use(solidity);

const { expect } = chai;

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Integration tests", () => {
  let factory : RenaswapV1Factory;
  let pair : UniswapV2Pair;
  let owner : string;
  let its : FakeERC20;
  let rena : Rena;
  let wrapper : RenaswapV1Wrapper;
  let router : RenaswapV1Router;

  let initContracts = async function() {
    const signers = await ethers.getSigners();
    owner = await signers[0].getAddress();

    const erc20Factory = await ethers.getContractFactory("FakeERC20", signers[0]);
    const renaFactory = await ethers.getContractFactory("Rena", signers[0]);
    its = (await erc20Factory.deploy()) as FakeERC20;
    await its.deployed();

    const wrapperFactory = await ethers.getContractFactory("RenaswapV1Wrapper", signers[0]);

    wrapper = (await wrapperFactory.deploy("")) as RenaswapV1Wrapper;

    const factoryFactory = await ethers.getContractFactory("RenaswapV1Factory", signers[0]);
    factory = (await factoryFactory.deploy(signers[0].address, wrapper.address)) as RenaswapV1Factory;
    await factory.deployed();

    let weth = (await erc20Factory.deploy()) as FakeERC20;
    await weth.deployed();

    const routerFactory = await ethers.getContractFactory("RenaswapV1Router", signers[0]);
    router = (await routerFactory.deploy(factory.address, weth.address)) as RenaswapV1Router;
    await factory.deployed();

    rena = (await renaFactory.deploy(router.address, router.address,0,50)) as Rena;
    await rena.deployed();
  }

  
  beforeEach(async () => {
    await initContracts();
    
  });

  describe("Renaswap router", async() => {
    it("add liquidity", async () => {
      await its.increaseAllowance(router.address, "1000000000000000");
      await rena.increaseAllowance(wrapper.address, "1000000000000000");
      await router.addLiquidity(its.address, rena.address, "1000000000000000", "1000000000000000", 0, 0, owner, 99999999999999);
    });
  })

});