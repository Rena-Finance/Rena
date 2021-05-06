// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface IUniswapV1Factory {
    function getExchange(address) external view returns (address);
}
