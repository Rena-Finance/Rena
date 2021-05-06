# Slither scanning results on Renascent-token repository contracts 

## Contracts: 
1.  [Claim.sol](#Claim.sol) 
2. [FeeDistributor.sol](#FeeDistributor.sol)
3. [LPstaking.sol](#LPstaking.sol)
4. [Rebalancer.sol](#Rebalancer.sol)
5. [Rena.sol](#Rena.sol)
6. [ReservationEvent.sol](#ReservationEvent.sol)

# Claim.sol
> (4 Medium issues, 17 Low issues)

## A. Medium Issues
### I. Unused-return
1. Claim.claim(uint256,uint256) (contracts/Claim.sol#39-56) ignores return value by rena.transfer(msg.sender,requested_) (contracts/Claim.sol#52)

2. Claim.sacrificeLP(uint256,uint256) (contracts/Claim.sol#59-70) ignores return value by rena.transfer(msg.sender,requested_) (contracts/Claim.sol#68)

3. Rena.constructor(address,address,uint256,uint256) (contracts/Rena.sol#61-89) ignores return value by IUniswapV2Factory(uniFactory).createPair(address(this),WETH) (contracts/Rena.sol#79)

4. Rena.setUniRouter(address) (contracts/Rena.sol#106-114) ignores return value by IUniswapV2Factory(uniFactory).createPair(address(this),WETH) (contracts/Rena.sol#111)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#unused-return

## B. Low Issues: 
### I. Missing-zero-address-validation
1. Rena.constructor(address,address,uint256,uint256).renaRouter_ (contracts/Rena.sol#62) lacks a zero-check on :
                - renaRouter = renaRouter_ (contracts/Rena.sol#75)

2. Rena.constructor(address,address,uint256,uint256).uniRouter_ (contracts/Rena.sol#63) lacks a zero-check on :
                - uniRouter = uniRouter_ (contracts/Rena.sol#76)

3. Rena.setUniRouter(address).uniRouter_ (contracts/Rena.sol#106) lacks a zero-check on :
                - uniRouter = uniRouter_ (contracts/Rena.sol#107)

4. Rena.setRenaRouter(address).renaRouter_ (contracts/Rena.sol#116) lacks a zero-check on :
                - renaRouter = renaRouter_ (contracts/Rena.sol#117)

5. Rena.changeFeeDistributor(address).feeDistributor_ (contracts/Rena.sol#125) lacks a zero-check on :
                - feeDistributor = feeDistributor_ (contracts/Rena.sol#126)

6. Rena.changeRebalancer(address).rebalancer_ (contracts/Rena.sol#130) lacks a zero-check on :
                - rebalancer = rebalancer_ (contracts/Rena.sol#131)

7. Rena.setClaim(address).claim_ (contracts/Rena.sol#149) lacks a zero-check on :
                - claim = claim_ (contracts/Rena.sol#150)

8. Rena.setlpStaking(address).lpStaking_ (contracts/Rena.sol#154) lacks a zero-check on :
                - lpStaking = lpStaking_ (contracts/Rena.sol#155)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-zero-address-validation

### II. Reentrancy-vulnerabilities-2
1. Reentrancy in Claim.claim(uint256,uint256) (contracts/Claim.sol#39-56):
        External calls:
        - ILPStaking(lpStaking).claim(msg.sender,pid_) (contracts/Claim.sol#42)
        State variables written after the call(s):
        - unclaimed[msg.sender] = unclaimed[msg.sender].sub(requested_) (contracts/Claim.sol#45)

2. Reentrancy in Rena.constructor(address,address,uint256,uint256) (contracts/Rena.sol#61-89):
        External calls:
        - IUniswapV2Factory(uniFactory).createPair(address(this),WETH) (contracts/Rena.sol#79)
        State variables written after the call(s):
        - _mint(msg.sender,110000 * 1e18) (contracts/Rena.sol#88)
                - _balances[account] = _balances[account].add(amount) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#234)
        - _mint(msg.sender,110000 * 1e18) (contracts/Rena.sol#88)
                - _totalSupply = _totalSupply.add(amount) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#233)
        - feeless[address(this)] = true (contracts/Rena.sol#82)
        - feeless[msg.sender] = true (contracts/Rena.sol#83)
        - lastRebalance = block.timestamp (contracts/Rena.sol#85)
        - rebalanceInterval = rebalanceInterval_ (contracts/Rena.sol#86)
        - uniPair = IUniswapV2Factory(uniFactory).getPair(address(this),WETH) (contracts/Rena.sol#80)

3. Reentrancy in Claim.sacrificeLP(uint256,uint256) (contracts/Claim.sol#59-70):
        External calls:
        - ILPStaking(lpStaking).claim(msg.sender,pid_) (contracts/Claim.sol#63)
        State variables written after the call(s):
        - unclaimed[msg.sender] = unclaimed[msg.sender].sub(requested_) (contracts/Claim.sol#66)

4. Reentrancy in Rena.setUniRouter(address) (contracts/Rena.sol#106-114):
        External calls:
        - IUniswapV2Factory(uniFactory).createPair(address(this),WETH) (contracts/Rena.sol#111)
        State variables written after the call(s):
        - uniPair = IUniswapV2Factory(uniFactory).getPair(WETH,address(this)) (contracts/Rena.sol#112)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-2

### III. Reentrancy-vulnerabilities-3
1. Reentrancy in Claim.claim(uint256,uint256) (contracts/Claim.sol#39-56):
        External calls:
        - ILPStaking(lpStaking).claim(msg.sender,pid_) (contracts/Claim.sol#42)
        - (sent) = rena.rebalancer().call{value: claimValue}() (contracts/Claim.sol#49)
        - rena.transfer(msg.sender,requested_) (contracts/Claim.sol#52)
        External calls sending eth:
        - (sent) = rena.rebalancer().call{value: claimValue}() (contracts/Claim.sol#49)
        - msg.sender.transfer(msg.value.sub(claimValue)) (contracts/Claim.sol#54)
        Event emitted after the call(s):
        - Claimed(msg.sender,requested_,msg.value) (contracts/Claim.sol#55)

2. Reentrancy in Rena.constructor(address,address,uint256,uint256) (contracts/Rena.sol#61-89):
        External calls:
        - IUniswapV2Factory(uniFactory).createPair(address(this),WETH) (contracts/Rena.sol#79)
        Event emitted after the call(s):
        - Transfer(address(0),account,amount) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#235)
                - _mint(msg.sender,110000 * 1e18) (contracts/Rena.sol#88)

3. Reentrancy in Rena.rebalance() (contracts/Rena.sol#159-166):
        External calls:
        - IRebalancer(rebalancer).rebalance(callerRewardDivisor,rebalancerDivisor) (contracts/Rena.sol#164)
        Event emitted after the call(s):
        - Rebalance(rebalancer) (contracts/Rena.sol#165)

4. Reentrancy in Claim.sacrificeLP(uint256,uint256) (contracts/Claim.sol#59-70):
        External calls:
        - ILPStaking(lpStaking).claim(msg.sender,pid_) (contracts/Claim.sol#63)
        - ILPStaking(lpStaking).withdrawFromTo(msg.sender,0,requiredLP,rena.rebalancer()) (contracts/Claim.sol#67)
        - rena.transfer(msg.sender,requested_) (contracts/Claim.sol#68)
        Event emitted after the call(s):
        - lpSacrificed(msg.sender,requiredLP,requested_) (contracts/Claim.sol#69)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-3

### IV. Block-timestamp
1. Rena.rebalance() (contracts/Rena.sol#159-166) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(block.timestamp > lastRebalance + rebalanceInterval,Too Soon) (contracts/Rena.sol#161)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#block-timestamp

### V. Different-pragma-directives-are-used
1. Different versions of Solidity is used in :
        - Version used: ['^0.7.5', '>=0.5.0', '>=0.6.0<0.8.0', '>=0.6.2']
        - >=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/access/Ownable.sol#3)
        - >=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/math/SafeMath.sol#3)
        - >=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#3)
        - >=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/token/ERC20/IERC20.sol#3)
        - >=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/utils/Context.sol#3)
        - >=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/utils/ReentrancyGuard.sol#3)
        - >=0.5.0 (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Factory.sol#1)
        - >=0.5.0 (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Pair.sol#1)
        - >=0.6.2 (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol#1)
        - >=0.6.2 (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol#1)
        - ^0.7.5 (contracts/Claim.sol#1)
        - ^0.7.5 (contracts/Rena.sol#1)
        - ^0.7.5 (contracts/interfaces/ILPStaking.sol#1)
        - ^0.7.5 (contracts/interfaces/IRebalancer.sol#1)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#different-pragma-directives-are-used

## VI. Incorrect-versions-of-solidity
Pragma version>=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/access/Ownable.sol#3) is too complex
Pragma version>=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/math/SafeMath.sol#3) is too complex
Pragma version>=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#3) is too complex
Pragma version>=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/token/ERC20/IERC20.sol#3) is too complex
Pragma version>=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/utils/Context.sol#3) is too complex
Pragma version>=0.6.0<0.8.0 (contracts/@openzeppelin/contracts/utils/ReentrancyGuard.sol#3) is too complex
Pragma version>=0.5.0 (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Factory.sol#1) allows old versions
Pragma version>=0.5.0 (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Pair.sol#1) allows old versions
Pragma version>=0.6.2 (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol#1) allows old versions
Pragma version>=0.6.2 (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol#1) allows old versions
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity

### VII. Low-level-calls
1. Low level call in Claim.claim(uint256,uint256) (contracts/Claim.sol#39-56):
        - (sent) = rena.rebalancer().call{value: claimValue}() (contracts/Claim.sol#49)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#low-level-calls

### VIII. Conformance-to-solidity-naming-conventions
Function IUniswapV2Pair.DOMAIN_SEPARATOR() (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Pair.sol#18) is not in mixedCase

Function IUniswapV2Pair.PERMIT_TYPEHASH() (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Pair.sol#19) is not in mixedCase

Function IUniswapV2Pair.MINIMUM_LIQUIDITY() (contracts/./dependencies/uniswap-v2-periphery/contracts/dependencies/uniswap-v2-core/contracts/interfaces/IUniswapV2Pair.sol#36) is not in mixedCase

Function IUniswapV2Router01.WETH() (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol#5) is not in mixedCase

Event ClaimlpSacrificed(address,uint256,uint256) (contracts/Claim.sol#20) is not in CapWords

Parameter Claim.getClaimPrice(uint256)._amount (contracts/Claim.sol#72) is not in mixedCase

Parameter Claim.getLPPrice(uint256)._amount (contracts/Claim.sol#82) is not in mixedCase

Parameter Claim.setClaim(address,uint256)._from (contracts/Claim.sol#89) is not in mixedCase

Parameter Claim.setClaim(address,uint256)._amount (contracts/Claim.sol#89) is not in mixedCase

Parameter Claim.setClaimDivisor(uint256)._amount (contracts/Claim.sol#95) is not in mixedCase

Variable Rena.WETH (contracts/Rena.sol#23) is not in mixedCase
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions

### IX. Redundant-statements
1. Redundant expression "this (contracts/@openzeppelin/contracts/utils/Context.sol#21)" inContext (contracts/@openzeppelin/contracts/utils/Context.sol#15-24)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#redundant-statements

### X. Reentrancy-vulnerabilities-4
1. Reentrancy in Claim.claim(uint256,uint256) (contracts/Claim.sol#39-56):
        External calls:
        - msg.sender.transfer(msg.value.sub(claimValue)) (contracts/Claim.sol#54)
        External calls sending eth:
        - (sent) = rena.rebalancer().call{value: claimValue}() (contracts/Claim.sol#49)
        - msg.sender.transfer(msg.value.sub(claimValue)) (contracts/Claim.sol#54)
        Event emitted after the call(s):
        - Claimed(msg.sender,requested_,msg.value) (contracts/Claim.sol#55)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-4

### XI. Variable-names-are-too-similar
1. Variable IUniswapV2Router01.addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256).amountADesired (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol#10) is too similar to IUniswapV2Router01.addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256).amountBDesired (contracts/@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol#11)
Variable Rena.minimumRebalanceAmount (contracts/Rena.sol#47) is too similar to Rena.constructor(address,address,uint256,uint256).minimumReblanceAmount_ (contracts/Rena.sol#64)

2. .Variable Rena.price0CumulativeLast (contracts/Rena.sol#58) is too similar to Rena.price1CumulativeLast (contracts/Rena.sol#59)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#variable-names-are-too-similar

### XII. State-variables-that-could-be-declared-constant
1. Rena.lpUnlocked (contracts/Rena.sol#50) should be constant
2. Rena.price0CumulativeLast (contracts/Rena.sol#58) should be constant
3. Rena.price1CumulativeLast (contracts/Rena.sol#59) should be constant
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#state-variables-that-could-be-declared-constant

### XIII. Public-function-that-could-be-declared-external
1. renounceOwnership() should be declared external:
        - Ownable.renounceOwnership() (contracts/@openzeppelin/contracts/access/Ownable.sol#54-57)

2. transferOwnership(address) should be declared external:
        - Ownable.transferOwnership(address) (contracts/@openzeppelin/contracts/access/Ownable.sol#63-67)

3. name() should be declared external:
        - ERC20.name() (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#64-66)

4. symbol() should be declared external:
        - ERC20.symbol() (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#72-74)

5. decimals() should be declared external:
        - ERC20.decimals() (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#89-91)

6. totalSupply() should be declared external:
        - ERC20.totalSupply() (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#96-98)

7. transfer(address,uint256) should be declared external:
        - ERC20.transfer(address,uint256) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#115-118)

8. allowance(address,address) should be declared external:
        - ERC20.allowance(address,address) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#123-125)

9. approve(address,uint256) should be declared external:
        - ERC20.approve(address,uint256) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#134-137)

10. transferFrom(address,address,uint256) should be declared external:
        - ERC20.transferFrom(address,address,uint256) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#152-156)

11. increaseAllowance(address,uint256) should be declared external:
        - ERC20.increaseAllowance(address,uint256) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#170-173)

12. decreaseAllowance(address,uint256) should be declared external:
        - ERC20.decreaseAllowance(address,uint256) (contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol#189-192)

13. setClaimDivisor(uint256) should be declared external:
        - Claim.setClaimDivisor(uint256) (contracts/Claim.sol#94-99)
> Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#public-function-that-could-be-declared-external