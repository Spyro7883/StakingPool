// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/** 
 * @title tokenB
 * @dev Generates tokens that will be later used for staking
 */

 contract tokenB is ERC20 {
    constructor() ERC20("tokenB", "TB"){
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }
 }
