// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/** 
 * @title tokenA
 * @dev Generates tokens that will be later used for staking
 */

 contract tokenA is ERC20 {
    constructor() ERC20("tokenA", "TA"){
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }
 }
