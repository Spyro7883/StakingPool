// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stacking{
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewards;
    uint256 public totalStaked;
    uint256 public rewardRate;

    constructor(IERC20 _stakingToken) {
          stakingToken = _stakingToken;
      }

    function stake(uint256 amount) public{
        stakes[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(address indexed user, uint256 amount);
    }
    function unstake(uint256 amount) public{
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender]-=amount;
        totalStaked-=amount;
        emit Unstaked(address indexed user, uint256 amount);
    }
    function calculateRewards(uint256 rewards) public{
        
    }
}
