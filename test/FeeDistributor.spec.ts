import { ethers, run } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, ContractInterface } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { Rena } from "../typechain/Rena";
import { FeeDistributor } from "../typechain/FeeDistributor";
import { LPStaking } from "../typechain/LPStaking";
import { Rebalancer } from "../typechain/Rebalancer";
import { ReservationEvent } from "../typechain/ReservationEvent";
import { UniswapV2Router02 } from "../typechain/UniswapV2Router02";
import { UniswapV2Factory } from "../typechain/UniswapV2Factory";
import { RenaswapV1Factory } from "../typechain/RenaswapV1Factory";
import { RenaswapV1Wrapper } from "../typechain/RenaswapV1Wrapper";
import { RenaswapV1Router } from "../typechain/RenaswapV1Router";
import { UniswapV2Pair } from "../typechain/UniswapV2Pair"
import { WETH9 } from "../typechain/WETH9";
import { Claim } from "../typechain/Claim";
import { FakeERC20 } from "../typechain/FakeERC20";

chai.use(solidity);

const { expect } = chai;

const zeroAddress = "0x0000000000000000000000000000000000000000";

// Just a dummy Address for RenaRouter
const renaRouterDummy = "0x0000000000000000000000000000000000000001";

describe("FeeDistributor", () => {
    let rena : Rena;
    let uniswapV2Factory : UniswapV2Factory;
    let uniswapV2Router02 : UniswapV2Router02;
    let renaswapV1Factory : RenaswapV1Factory;
    let renaswapV1Wrapper : RenaswapV1Wrapper;
    let renaswapV1Router : RenaswapV1Router;
    let wEth : WETH9;
    let feeDistributor : FeeDistributor;
    let LPStaking : LPStaking;
    let claim: Claim;
    let itsDummy: FakeERC20;
    let rebalancer : Rebalancer;
    let reservationEvent : ReservationEvent;
    let owner : SignerWithAddress;
    let minimumReblanceAmount : number;
    let rebalanceInterval : number;
    let uniPair : FakeERC20;
    let renaPairAddress : string;
    let itsPairAddress : string;
    let signers : any;
    let lpBalance : BigNumber;    
    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];

        minimumReblanceAmount = (100*1e18);
        rebalanceInterval = 60*60;

        const uniswapV2FactoryFactory = await ethers.getContractFactory(
            "UniswapV2Factory",
            owner
        );
        uniswapV2Factory = (await uniswapV2FactoryFactory.deploy(owner.getAddress())) as UniswapV2Factory;
        await uniswapV2Factory.deployed();

        const wETHFactory = await ethers.getContractFactory(
            "WETH9",
            owner
        );
        wEth = (await wETHFactory.deploy()) as WETH9;
        await wEth.deployed();

        const uniswapV2Router02Factory = await ethers.getContractFactory(
            "UniswapV2Router02",
            owner
        );
        uniswapV2Router02 = (await uniswapV2Router02Factory.deploy(uniswapV2Factory.address, wEth.address)) as UniswapV2Router02
        await uniswapV2Router02.deployed();

        const renaswapV1WrapperFactory = await ethers.getContractFactory(
            "RenaswapV1Wrapper",
            owner
        );
        renaswapV1Wrapper = (await renaswapV1WrapperFactory.deploy("")) as RenaswapV1Wrapper;
        renaswapV1Wrapper.deployed();

        const renaswapV1FactoryFactory = await ethers.getContractFactory(
            "RenaswapV1Factory",
            owner
        );
        renaswapV1Factory = (await renaswapV1FactoryFactory.deploy(owner.getAddress(), renaswapV1Wrapper.address)) as RenaswapV1Factory;
        renaswapV1Factory.deployed();

        const renaswapV1RouterFactory = await ethers.getContractFactory(
            "RenaswapV1Router",
            owner
        );
        renaswapV1Router = (await renaswapV1RouterFactory.deploy(renaswapV1Factory.address, wEth.address)) as RenaswapV1Router;
        renaswapV1Router.deployed();

        const renaFactory = await ethers.getContractFactory(
            "Rena",
            owner
        );
        rena = (await renaFactory.deploy(renaswapV1Router.address, uniswapV2Router02.address, minimumReblanceAmount.toString(), rebalanceInterval)) as Rena
        await rena.deployed();


        const erc20Factory = await ethers.getContractFactory(
            "FakeERC20", 
            owner
        );
        itsDummy = (await erc20Factory.deploy()) as FakeERC20;
        await itsDummy.deployed();

        const feeDistributorFactory = await ethers.getContractFactory(
            "FeeDistributor",
            owner  
        );
        feeDistributor = (await feeDistributorFactory.deploy(rena.address, itsDummy.address)) as FeeDistributor;
        await feeDistributor.deployed();

        const LPStakingFactory = await ethers.getContractFactory(
            "LPStaking",
            owner  
        );
        LPStaking = (await LPStakingFactory.deploy()) as LPStaking;
        await LPStaking.deployed();
        
        const claimFactory = await ethers.getContractFactory(
            "Claim",
            owner  
        );
        claim = (await claimFactory.deploy(rena.address)) as Claim;
        await claim.deployed();

        await rena.increaseAllowance(renaswapV1Router.address, (100*1e18).toString());
        await renaswapV1Router.addLiquidityETH(
            rena.address,
            (100*1e18).toString(),
            0,
            0,
            owner.address,
            99999999999999
        ,{
            value: (100*1e18).toString()
        });
        renaPairAddress = await renaswapV1Factory.getPair(rena.address, wEth.address);

        await itsDummy.increaseAllowance(renaswapV1Router.address, (100*1e18).toString());
        await renaswapV1Router.addLiquidityETH(
            itsDummy.address,
            (100*1e18).toString(),
            0,
            0,
            owner.address,
            99999999999999
        ,{
            value: (100*1e18).toString()
        });
        itsPairAddress = await renaswapV1Factory.getPair(itsDummy.address, wEth.address);
        
        await itsDummy.increaseAllowance(uniswapV2Router02.address, (100*1e18).toString());
        await uniswapV2Router02.addLiquidityETH(
            itsDummy.address,
            (100*1e18).toString(),
            0,
            0,
            owner.address,
            99999999999999
        ,{
            value: (100*1e18).toString()
        });        
        

        await LPStaking.initialize(rena.address);
        await LPStaking.addPool(600, renaPairAddress, false, true);
        await rena.setFeeDistributor(feeDistributor.address);
        await rena.setlpStaking(LPStaking.address);
        await rena.setClaim(claim.address);
    

    });
    describe("Setup Fee Distribution", () => {
        it("Should be able to Add a pair", async() => {
            await feeDistributor.addPair(renaPairAddress, 600);
            const maxPairs = await feeDistributor.maxPairs();
            expect(maxPairs).to.eq(1);
        });

        it("Should be able to remove a pair", async() => {
            await feeDistributor.addPair(renaPairAddress, 600);
            await feeDistributor.addPair(itsPairAddress, 400);
            let maxPairs = await feeDistributor.maxPairs();
            expect(maxPairs).to.eq(2);
            await feeDistributor.removePair(renaPairAddress);
            maxPairs = await feeDistributor.maxPairs();
            expect(maxPairs).to.eq(1);
        });        
    });
    describe("Fee Distribution", () => {
        it("Should be able to accumulate WETH & RENA & ETH", async() => {
            const ethAmount = ethers.utils.parseEther("1");

            await wEth.deposit({value:ethAmount})
            await wEth.transfer(feeDistributor.address, ethAmount);
            await owner.sendTransaction({to:feeDistributor.address, value:ethAmount});
            await rena.transfer(feeDistributor.address, ethAmount);

            const wethBalance = await wEth.balanceOf(feeDistributor.address);
            const renaBalance = await rena.balanceOf(feeDistributor.address);

            expect(wethBalance).to.eq(ethAmount);
            expect(renaBalance).to.eq(ethAmount);
        });
     
        
        it("Should distribute fees", async() => {
            const ethAmount = ethers.utils.parseEther("1");

            await wEth.deposit({value:ethAmount})
            await wEth.transfer(feeDistributor.address, ethAmount);
            await owner.sendTransaction({to:feeDistributor.address, value:ethAmount});
            await rena.transfer(feeDistributor.address, ethAmount);

            await feeDistributor.addPair(renaPairAddress, 600);
            await feeDistributor.addPair(itsPairAddress, 400);

            const itsRenaBalanceBefore = await rena.balanceOf(itsPairAddress);
            const renaRenaBalanceBefore = await rena.balanceOf(renaPairAddress);

            await feeDistributor.distributeFees();

            const wethBalance = await wEth.balanceOf(feeDistributor.address);
            const renaBalance = await rena.balanceOf(feeDistributor.address);
            const itsRenaBalance = await rena.balanceOf(itsPairAddress);
            const renaRenaBalance = await rena.balanceOf(renaPairAddress);

            expect(wethBalance).to.eq(0);
            expect(renaBalance).to.eq(0);
            expect(itsRenaBalance).to.gt(itsRenaBalanceBefore)
            expect(renaRenaBalance).to.gt(renaRenaBalanceBefore)        
        })
    });

});
