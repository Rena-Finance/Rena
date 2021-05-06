// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface IRenaswapV1Factory {
    event PairCreated(address indexed token0, address indexed token1, uint256 token1ID, address pair, uint);

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);

    function getPair( address queryToekn0_, address queryToken1_, uint256 queryToken1ID_ ) external returns (address pair_);
    function pairs(uint) external view returns (address pair);
    function getPairsCount() external view returns (uint length);

    function createPair(address tokenA, address tokenB, uint256 tokenBID_) external returns (address pair);

    function setFeeTo(address) external;
}