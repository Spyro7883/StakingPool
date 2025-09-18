// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is ReentrancyGuard{
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    address private owner;

    IERC20 private rewardsToken;
    IERC20 private stakingToken;
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 10 seconds;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;    

    mapping(address => uint256) private _balances;

    uint256 private _totalSupply;

    constructor(address _stakingToken, address _rewardToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardToken);
    }

    /* ========== MODIFIERS ========== */
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");        
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner() {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete before changing the duration for the new period"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored+((lastTimeRewardApplicable()-lastUpdateTime)*rewardRate*1e18)/_totalSupply;
    }   

    function earned(address account) public view returns (uint256) {
        return ((_balances[account]*(rewardPerToken()-userRewardPerTokenPaid[account]))/1e18)+rewards[account];
    }

    function notifyRewardsBalanceOf() external onlyOwner() view returns (uint256){
        return rewardsToken.balanceOf(address(this));
    }

    function getRewardRate(uint256 reward) public view returns (uint256) {
        return reward/rewardsDuration;
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate*rewardsDuration;
    }
    
    /* ========== SPECIFIC FUNCTIONS ========== */
  
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than zero");        
        _totalSupply+=amount;
        _balances[msg.sender]+=amount;
        emit Staked(msg.sender, amount);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);        
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(_balances[msg.sender] >= amount, "Insufficient stake");
        _balances[msg.sender]-=amount;
        _totalSupply-=amount;
        emit Withdraw(msg.sender, amount);
        stakingToken.safeTransfer(msg.sender, amount);        
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function notifyRewardAmount(uint256 reward) external updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward/rewardsDuration;
        } else {
            uint256 remaining = periodFinish-block.timestamp;
            uint256 leftover = remaining*rewardRate;
            rewardRate = (reward+leftover)/rewardsDuration;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        
        uint balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= balance/rewardsDuration, "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp+rewardsDuration;
        emit RewardAdded(reward);
    }   

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
}