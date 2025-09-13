// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stacking{
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewards;
    uint256 public totalStaked;
    uint256 public rewardRate;
  
    function stake(uint256 amount) public{
        require(_amount > 0, "Amount must be greater than zero");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }
    function unstake(uint256 amount) public{
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender]-=amount;
        totalStaked-=amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }
    function calculateRewards(uint256 rewards) public{
        
    }
}
