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

describe("Rena", () => {
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
    let name : string; 
    let symbol : string;
    let totalSupply : string;
    let uniPair : string;
    let contractInterface : ContractInterface
    let signers: any;
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
    });

    describe("Deploy Rena instance", () => {
        it("Default RenaRouter should be the RenaRouterDummy", async () => {
            const renaRouterAddress = await rena.renaRouter();
            expect(renaRouterAddress).to.eq(renaswapV1Router.address);
        });

        it("Default UniswapFactory should be the uniswapV2Factory", async () => {
            const uniswapV2FactoryAddress = await rena.uniFactory();
            expect(uniswapV2FactoryAddress).to.eq(uniswapV2Factory.address);
        });

        it("Default UniswapRouter should be the uniswapV2Router", async () => {
            const uniswapV2RouterAddress = await rena.uniRouter();
            expect(uniswapV2RouterAddress).to.eq(uniswapV2Router02.address);
        });

        it("Default treasury should be the owner", async () => {
            const treasuryAddress = await rena.treasury();
            const actualTreasuryAddress = await owner.getAddress();
            expect(treasuryAddress).to.eq(actualTreasuryAddress);
        });

        it("Default minimumReblanceAmount_ shoudl be equal minimumReblanceAmount", async () => {
            const minimumReblanceAmount_ = await rena.minimumRebalanceAmount();
            expect(minimumReblanceAmount_).to.eq(minimumReblanceAmount.toString());
        });

        it("Default rebalanceInterval_ should be equal rebalanceInterval", async () => {
            const rebalanceInterval_ = await rena.rebalanceInterval();
            expect(rebalanceInterval_).to.eq(rebalanceInterval);
        });
    });

    describe("Rena checkings and requires", () => {
        it("Should have WETH address", async () => {
            const WETH_ = await rena.WETH();
            expect(WETH_).to.not.eq(zeroAddress);
            expect(WETH_).to.eq(wEth.address);
        });

        it("Should have Renaswap Router address", async () => {
            const renaRouter_ = await rena.renaRouter();
            expect(renaRouter_).to.not.eq(zeroAddress);
            expect(renaRouter_).to.eq(renaswapV1Router.address);
        });

        it("Should have Uniswap Router address", async () => {
            const uniRouter_ = await rena.uniRouter();
            expect(uniRouter_).to.not.eq(zeroAddress);
            expect(uniRouter_).to.eq(uniswapV2Router02.address);
        });

        it("Should have Uniswap Factory address", async () => {
            const uniFactory_ = await rena.uniFactory();
            expect(uniFactory_).to.not.eq(zeroAddress);
            expect(uniFactory_).to.eq(uniswapV2Factory.address);
        });
        
        it("Should have treasury address", async () =>{
            const treasury_ = await rena.treasury();
            expect(treasury_).to.not.eq(zeroAddress);
            expect(treasury_).to.eq(owner.address);
        });
        
        it("Should have some required addresses with zero address after constructor fucntion", async () =>{
            const renaFactory_ = await rena.renaFactory();            
            expect(renaFactory_).to.eq(zeroAddress);
        });
    });

    describe("Rena is an ERC20 token", () => {
        name = "Rena";
        symbol = "RENA"; 
        totalSupply = "11000000000000000000000000";

        it("Should has a name", async () => {
            const tokenName : string = await rena.name();
            expect(tokenName).to.eq(name);
        });

        it("Should has a symbol", async () => {
            const tokenSymbol : string = await rena.symbol();
            expect(tokenSymbol).to.eq(symbol);
        });

        it("Should has a totalSupply", async () => {
            const tokenTotalSupply : BigNumber = await rena.totalSupply();
            expect(tokenTotalSupply).to.eq(BigNumber.from(totalSupply));
        });

        it("Should contract owner holding the total supply", async () => {
            const ownerAmountBalance : BigNumber = await rena.balanceOf((await owner.getAddress()).toString());
            expect(ownerAmountBalance).to.eq(BigNumber.from(totalSupply));
        });
    });

    describe("Rena setters", () => {
        
        it("Should set Uniswap Router", async () => {
            const signers : SignerWithAddress[] = await ethers.getSigners();
    
            const uniswapV2Router01Factory = await ethers.getContractFactory(
                "UniswapV2Router01",
                signers[0]
            );
            let uniswapRouterNewAddress : UniswapV2Router02;
            uniswapRouterNewAddress = (await uniswapV2Router01Factory.deploy(uniswapV2Factory.address, wEth.address)) as UniswapV2Router02
            await uniswapRouterNewAddress.deployed();
            await rena.setUniRouter(uniswapRouterNewAddress.address);
            const currentUniswapRouterAddress : string = await rena.uniRouter();
            expect(uniswapRouterNewAddress.address).to.eq(currentUniswapRouterAddress);
        });
    });

    describe("Rena fee distrobutor and rebalancer", () => {
        it("Should be able to change Rebalance Intervals", async () => {
            let newRebalancerIntervals : number = 30*30;
            await rena.changeRebalanceInterval(newRebalancerIntervals);
            let currentRebalanceIntervals : BigNumber = await rena.rebalanceInterval();
            expect(newRebalancerIntervals).to.eq(currentRebalanceIntervals);
        });

        it("Should be able to set / change Rebalancer Address", async () => {
            await rena.setRebalancer(rebalancer.address);
            const rebalancerAddressInRena = await rena.rebalancer();
            expect(rebalancerAddressInRena).to.eq(rebalancer.address);
        });

        it("Should be able to set / change the FeeDistributor Address", async () => {
            await rena.setFeeDistributor(feeDistributor.address);
            const feeDistributorAddressInRena = await rena.feeDistributor();
            expect(feeDistributorAddressInRena).to.eq(feeDistributor.address);
        });

        it("Should be able to set fee divisor", async () => {
            const feeDivisor_ : number = 10;
            await rena.changeFeeDivisor(feeDivisor_);
            const feeDivisorInRena = await rena.feeDivisor();
            expect(feeDivisorInRena).to.eq(feeDivisor_);
        });

        it("Should be able to set caller reward divisor", async () => {
            const callerRewardDivisor_ = 10;
            await rena.changeCallerRewardDivisor(callerRewardDivisor_);
            const callerRewardDivisorInRena = await rena.callerRewardDivisor();
            expect(callerRewardDivisorInRena).to.eq(callerRewardDivisor_);
        });

        it("Should be able to set rebalancer divisor", async () => {
            const rebalancerDivisor_ = 10;
            await rena.changeRebalalncerDivisor(rebalancerDivisor_);
            const rebalancerDivisorInRena = await rena.rebalancerDivisor();
            expect(rebalancerDivisorInRena).to.eq(rebalancerDivisorInRena);
        });

        it("Should be able to set Claim contract address", async () => {
            await rena.setClaim(claim.address);
            const claimAddressInRena = await rena.claim();
            expect(claimAddressInRena).to.eq(claim.address);
        });

        it("Should be able to set LPStaking contract address", async () => {
            await rena.setlpStaking(LPStaking.address);
            const LPStakingAddressInRena = await rena.lpStaking();
            expect(LPStakingAddressInRena).to.eq(LPStaking.address);
        });
    });

    describe("Rena rebalance", () => {
        it("Should be able to add liquidity to RENA/wETH uniPair", async () => { 
            // 1. Configuring the amount of rEth to be minted, as well as the amount of Rena to be added in the pair contract. 
            const wEthAmountForRena = ethers.utils.parseEther("200");          
            const wEthAmountForIts = "200000000000000000000";          

            const renaTotalSupply : BigNumber = await rena.totalSupply();
            const itsTotalSupply : BigNumber = await itsDummy.totalSupply();
            
            const renaLiquidityAmount : BigNumber = renaTotalSupply.div(BigNumber.from("5"));
            const itsLiquidityAmount : BigNumber = itsTotalSupply.div(BigNumber.from("2"));

            // 2. Give Uniswapv2Router02 allowance on renaLiquidityAmount. 
            await rena.increaseAllowance(uniswapV2Router02.address, renaLiquidityAmount);
            expect(await rena.allowance(owner.address, uniswapV2Router02.address)).to.eq(renaLiquidityAmount);

            await itsDummy.increaseAllowance(uniswapV2Router02.address, itsLiquidityAmount);
            expect(await itsDummy.allowance(owner.address, uniswapV2Router02.address)).to.eq(itsLiquidityAmount);

            const ownerBalanceOfRenaBefore = await rena.balanceOf(owner.address);
            // 3. Add Liqudity ETH to (RENA/rETH) pair
            await uniswapV2Router02.addLiquidityETH(
                rena.address,
                renaLiquidityAmount,
                0,
                0,
                owner.address,
                99999999999999
            ,{
                value: wEthAmountForRena
            });

            await rena.increaseAllowance(renaswapV1Router.address, renaLiquidityAmount);
            await renaswapV1Router.addLiquidityETH(
                rena.address,
                renaLiquidityAmount,
                0,
                0,
                owner.address,
                99999999999999
            ,{
                value: wEthAmountForRena
            });
            await rena.transfer(signers[1].address, renaLiquidityAmount)
            await rena.increaseAllowance(renaswapV1Router.address, renaLiquidityAmount);
            await renaswapV1Router.addLiquidityETH(
                rena.address,
                renaLiquidityAmount,
                0,
                0,
                owner.address,
                99999999999999
            ,{
                value: wEthAmountForRena
            });                
   
            await uniswapV2Router02.addLiquidityETH(
                itsDummy.address,
                itsLiquidityAmount,
                0,
                0,
                owner.address,
                99999999999999
            ,{
                value: wEthAmountForIts
            });

            // 4. Add minimumRebalanceAmount_ in Rena contract. 
            const minimumRebalanceAmount_ = await rena.minimumRebalanceAmount();

            const ownerBalanceOfRenaAfter = await rena.balanceOf(owner.address);

            // 5. Get the (Rena/rETH) pair contract address.
            const renaPairAddress = await uniswapV2Factory.getPair(rena.address, wEth.address);
            const itsPairAddress = await uniswapV2Factory.getPair(itsDummy.address, wEth.address);

            const renaPair = await ethers.getContractAt("UniswapV2Pair", renaPairAddress) as UniswapV2Pair;
            const itsPair = await ethers.getContractAt("UniswapV2Pair", itsPairAddress) as UniswapV2Pair;

            const renaPairReservesBeforeRebalance = await renaPair.getReserves();
            const itsPairReservesBeforeRebalance = await itsPair.getReserves();

            // // 6. Check the (Rena/rETH) pair reserves to be as expected.
            // expect(reservesBeforeRebalance._reserve0).to.eq(renaLiquidityAmount);
            // expect(reservesBeforeRebalance._reserve1).to.eq(wEthAmount);

            // await wEth.deposit({
            //     value: "200000000000000000000"
            // });

            // const additionalWEthAmount = await wEth.totalSupply();

            // wEth.transfer(itsPair.address, additionalWEthAmount);

            // 7. Update Rena contract with (Rena/rETH) pair contract address by calling setUniRouter()
            await rena.setUniRouter(uniswapV2Router02.address);

            const pairLiquidityBefore = await renaPair.balanceOf(renaPair.address);
            
            // 9. Transfering some amount Of UNI-V2 tokens to the pair contract which is required to perform the burn for removing liquidity. 
            //    otherwise, will get this error from UniswapV2Pair contract => require(amount0 > 0 && amount1 > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED');            
            const uniAmountForLiquidity = BigNumber.from("1000");
            await renaPair.transfer(renaPair.address, uniAmountForLiquidity);
            await itsPair.transfer(itsPair.address, uniAmountForLiquidity);

            const pairLiquidityAfter = await renaPair.balanceOf(renaPair.address);
            
            await renaPair.transfer(rena.address, pairLiquidityAfter);
            await itsPair.transfer(itsDummy.address, pairLiquidityAfter);

            await rena.setRebalancer(rebalancer.address);
            await rena.setFeeDistributor(feeDistributor.address);

            const pairWeight = await BigNumber.from("200");
            await feeDistributor.addPair(renaPair.address, pairWeight);

            await rena.setClaim(claim.address);
            await rena.setlpStaking(LPStaking.address);
            
            await LPStaking.initialize(rena.address);

            // Trying to calculate the expected output of the rebalance() function
            const totalSupply_ = await renaPair.totalSupply();
            const uniLiquidity = await renaPair.balanceOf(renaPair.address);
            const burnedAmountFromReserve0 = uniLiquidity.mul(renaPairReservesBeforeRebalance._reserve0).div(totalSupply_);
            const burnedAmountFromReserve1 = uniLiquidity.mul(renaPairReservesBeforeRebalance._reserve1).div(totalSupply_);
            const expectedReserve0BeforeSwap = renaPairReservesBeforeRebalance._reserve0.sub(burnedAmountFromReserve0);
            const expectedReserve1BeforeSwap = renaPairReservesBeforeRebalance._reserve1.sub(burnedAmountFromReserve1);
            const amountInputInSwap = await (await wEth.balanceOf(renaPair.address)).sub(renaPairReservesBeforeRebalance._reserve1);
            //Avoid too Soon Error
            await rena.changeRebalanceInterval(0);

            // 10. Calling Rena rebalance() function. 
            await rena.rebalance();

            // 11. Check that the rebalance func worked successfully, and the amount of the Rena reserve in the (RENA/rETH) pair has been decreased. 
            const reservesAfterRebalance = await renaPair.getReserves();
            expect(reservesAfterRebalance._reserve0).to.be.above(expectedReserve0BeforeSwap);
            expect(reservesAfterRebalance._reserve1).to.be.above(expectedReserve1BeforeSwap);
        });

        it("Should work if the msg.sender has the minimumRebalanceAmount", async () => {
            // Check => require(balanceOf(msg.sender) > minimumRebalanceAmount, "You aren't part of the syndicate");
            // const minimumRebalanceAmount_ = await rena.minimumRebalanceAmount();
            // const msgSenderBalance = await rena.balanceOf(owner.address);
            // console.log(minimumRebalanceAmount_.toNumber())
            // console.log(msgSenderBalance.toNumber())
            // expect(msgSenderBalance).to.be.above(minimumRebalanceAmount_);
            
            // Check => require(block.timestamp > lastRebalance + rebalanceInterval, "Too Soon");
            // const blockTimestamp_ = (await ethers.provider.getBlock('latest')).timestamp;
            // const lastRebalance_ = Number(await rena.lastRebalance()); 
            // const rebalanceInterval_ = Number(await rena.rebalanceInterval());
            // expect(blockTimestamp_).to.be.above(lastRebalance_ + rebalanceInterval_);

            // uniPair = await rena.uniPair();
            // const IUniPair = new ethers.Contract(uniPair, IUniswapV2PairAbiFile);
            // const totalSupplyBeforeRebalance = new Ierc20(uniPair, IUniPair.interface).balanceOf(rena.address);
            //await rena.rebalance();
        });
    });
});