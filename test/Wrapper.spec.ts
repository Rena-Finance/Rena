import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { RenaswapV1Wrapper } from "../typechain/RenaswapV1Wrapper";
import { FakeERC20 } from "../typechain/FakeERC20";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);

const { expect } = chai;

const zeroAddress = "0x0000000000000000000000000000000000000000";

describe("Wrapper", () => {
  let wrapper : RenaswapV1Wrapper;
  let owner : string;
  let token0 : FakeERC20;
  let signers : SignerWithAddress[];
  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = await signers[0].getAddress();
    const wrapperFactory = await ethers.getContractFactory(
      "RenaswapV1Wrapper",
      signers[0]
    );
    wrapper = (await wrapperFactory.deploy("")) as RenaswapV1Wrapper;
    await wrapper.deployed();
    const erc20Factory = await ethers.getContractFactory("FakeERC20", signers[0]);
    token0 = (await erc20Factory.deploy()) as FakeERC20;
    await token0.deployed();
  });

  it("adding a wrapped token without being the owner should fail", async () => {
    await expect(wrapper.connect(signers[1]).addWrappedToken(token0.address, owner)).to.be.revertedWith("RenaswapV1: FORBIDDEN");
  });

  it("adding a wrapped token AS a wrapped token should fail", async () => {
    await expect(wrapper.addWrappedToken(wrapper.address, owner)).to.be.revertedWith("RenaswapV1: FORBIDDEN");
  });

  it("should be able to wrap a token to a caller", async () => {
    await expect(wrapper.addWrappedToken(token0.address, owner)).to.emit(wrapper, "TokenWrapped").withArgs(token0.address, owner, 1);
  });

  it("wrapping the same token twice should fail", async () => {
    await expect(wrapper.addWrappedToken(token0.address, owner)).to.emit(wrapper, "TokenWrapped").withArgs(token0.address, owner, 1);
    await expect(wrapper.addWrappedToken(token0.address, owner)).to.emit(wrapper, "TokenWrapped").withArgs(token0.address, owner, 1);
  });

  it("wapped token id is unique", async () => {
    await expect(wrapper.addWrappedToken(token0.address, owner)).to.emit(wrapper, "TokenWrapped").withArgs(token0.address, owner, 1);
    await expect(wrapper.addWrappedToken(token0.address, owner)).to.emit(wrapper, "TokenWrapped").withArgs(token0.address, owner, 1);
  });

  it("calling setDestination as a non wrapper owner should fail", async () => {
    await expect(wrapper.connect(signers[1]).setDestination(signers[0].address,signers[0].address)).to.be.revertedWith("RenaswapV1: FORBIDDEN");
    await wrapper.setDestination(signers[0].address,signers[0].address);
  });
});