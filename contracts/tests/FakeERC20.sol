// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.7.6;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract FakeERC20 is ERC20 {
    constructor() public ERC20("fake", "fake") {
        _mint(msg.sender, 100000*1e18);
    }
}