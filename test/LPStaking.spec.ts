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

describe("LPStaking", () => {
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
    let signers : any;
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

        const rebalancerFactory = await ethers.getContractFactory(
            "Rebalancer",
            owner
        );
        rebalancer = (await rebalancerFactory.deploy(rena.address)) as Rebalancer;
        await rebalancer.deployed();

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
        await LPStaking.setDevFee(0);
        await rena.setRebalancer(rebalancer.address);
        await rena.setlpStaking(LPStaking.address);
        await rena.setClaim(claim.address);
        const renaRouterAddress = await rena.renaRouter();
        const uniswapV2FactoryAddress = await rena.uniFactory();
        const uniswapV2RouterAddress = await rena.uniRouter();
        const treasuryAddress = await rena.treasury();
        const actualTreasuryAddress = await owner.getAddress();
        const minimumReblanceAmount_ = await rena.minimumRebalanceAmount();
        await rena.increaseAllowance(uniswapV2Router02.address, (200*1e18).toString());
        await uniswapV2Router02.addLiquidityETH(
            rena.address,
            (200*1e18).toString(),
            0,
            0,
            owner.address,
            99999999999999
        ,{
            value: (200*1e18).toString()
        });        
        renaPairAddress = await uniswapV2Factory.getPair(rena.address, wEth.address);
        uniPair = (await ethers.getContractAt("FakeERC20", renaPairAddress, signers[0])) as FakeERC20;


    });

    describe("Deploy LP Staking Instances", () => {
        it("Should Initalize", async () => {
            await LPStaking.initialize(rena.address);
            const renaAddress = await LPStaking.rena();
            expect(renaAddress).to.eq(rena.address);
        });

        it("Should add a pool", async() => { 
            await LPStaking.addPool(600, renaPairAddress, false, true);
            const poolLength = await LPStaking.poolLength();
            expect(poolLength).to.eq(1);
        });

        it("Should be able to Stake", async() => {
            await LPStaking.addPool(600, renaPairAddress, false, true);
            const origLPBalance = await uniPair.balanceOf(owner.address);
            await uniPair.approve(LPStaking.address, origLPBalance);
            await LPStaking.deposit(0, origLPBalance);
            const afterLPBalance = await uniPair.balanceOf(owner.address);
            expect(afterLPBalance).to.eq(0);
            const poolBalance = await LPStaking.poolAmount(0, owner.address);
            expect(poolBalance).to.eq(origLPBalance);
            expect(poolBalance).to.gt(0);
        });

    });
    describe("Setup Claiming and Fees", () => {
        let lpBalance : BigNumber;
        beforeEach(async () => {

            await LPStaking.initialize(rena.address);
            await LPStaking.addPool(600, renaPairAddress, false, true);

            lpBalance = await uniPair.balanceOf(owner.address);

        });

        it("Should accumulate RENA", async () => {
            await uniPair.approve(LPStaking.address, lpBalance);
            await LPStaking.deposit(0, lpBalance);

            const transferAmount = (100*1e18).toString()

            await rena.transfer(LPStaking.address, transferAmount)
            await LPStaking.addPendingRewards();
            const pendingRewards = await LPStaking.pendingRewards();
            expect(pendingRewards).to.eq(transferAmount);
        });
        it("Should allow for depositFor", async() => {
            await uniPair.approve(LPStaking.address, lpBalance);
            const target = signers[1].address;
            
            await uniPair.approve(LPStaking.address, lpBalance);
            await LPStaking.depositFor(target, 0, lpBalance);
            const poolBalance = await LPStaking.poolAmount(0, target);
            expect(poolBalance).to.eq(lpBalance);
            lpBalance = await uniPair.balanceOf(owner.address);
            expect(lpBalance).to.eq(0);
        });

        it("Should update Allowance Correctly", async() => {
            const target = signers[1];
            const allowanceAmount = (100*1e18).toString();
            const allowanceBefore = await LPStaking.hasAllowanceForPoolToken(target.address, 0, allowanceAmount, owner.address);
            await LPStaking.setAllowanceForPoolToken(target.address, 0, allowanceAmount)
            const allowanceAfter = await LPStaking.hasAllowanceForPoolToken(target.address, 0, allowanceAmount, owner.address);
            expect(allowanceBefore).to.eq(false);
            expect(allowanceAfter).to.eq(true);
        });

        it("Should allow for WithdrawFrom and updates Allowance", async() => {
            const target = signers[1].address;
            await uniPair.approve(LPStaking.address, lpBalance);
            await LPStaking.depositFor(target, 0, lpBalance);
            const afterLPBalance = await uniPair.balanceOf(owner.address);
            expect(afterLPBalance).to.eq(0);
            const poolBalance = await LPStaking.poolAmount(0, target);
            expect(poolBalance).to.eq(lpBalance);
            await expect(
                LPStaking.withdrawFrom(target, 0, lpBalance)
            ).to.be.reverted;
            await LPStaking.connect(signers[1]).setAllowanceForPoolToken(owner.address, 0, lpBalance);
            await LPStaking.withdrawFrom(target, 0, lpBalance);
            const allowanceAfter = await LPStaking.hasAllowanceForPoolToken(target, 0, 1, owner.address);
            const newBalance = await LPStaking.poolAmount(0, target);
            expect(newBalance).to.eq(0);
            expect(allowanceAfter).to.eq(false);
        });

        it("Should allow for WithdrawFromTo and updates Allowance", async() => {
            const target = signers[1].address;
            await uniPair.approve(LPStaking.address, lpBalance);
            await LPStaking.depositFor(target, 0, lpBalance);
            const afterLPBalance = await uniPair.balanceOf(owner.address);
            expect(afterLPBalance).to.eq(0);
            const poolBalance = await LPStaking.poolAmount(0, target);
            expect(poolBalance).to.eq(lpBalance);
            await expect(
                LPStaking.withdrawFromTo(target, 0, lpBalance, claim.address)
            ).to.be.reverted;
            await LPStaking.connect(signers[1]).setAllowanceForPoolToken(owner.address, 0, lpBalance);
            await LPStaking.withdrawFromTo(target, 0, lpBalance, claim.address);
            const allowanceAfter = await LPStaking.hasAllowanceForPoolToken(target, 0, 1, owner.address);
            const newBalance = await LPStaking.poolAmount(0, target);
            const toBalance = await uniPair.balanceOf(claim.address);
            expect(toBalance).to.eq(lpBalance);
            expect(newBalance).to.eq(0);
            expect(allowanceAfter).to.eq(false);
        });

        it("Should fail if user tries to claim", async() => {
            await uniPair.approve(LPStaking.address, lpBalance);
            await LPStaking.deposit(0, lpBalance);

            const transferAmount = (100*1e18).toString()

            await rena.transfer(LPStaking.address, transferAmount)
            await LPStaking.addPendingRewards();
            await LPStaking.massUpdatePools();
            const pendingBefore = await LPStaking.pendingrena(0, owner.address);
            const balanceBefore = await rena.balanceOf(owner.address);
            await expect( 
                LPStaking.claim(owner.address, 0) 
            ).to.be.reverted;

            const pendingAfter = await LPStaking.pendingrena(0, owner.address);
            const balanceAfter =  await rena.balanceOf(owner.address);

            expect(pendingBefore).to.eq(pendingAfter);
            expect(balanceAfter.sub(balanceBefore)).to.eq(0);
        });

    });

});