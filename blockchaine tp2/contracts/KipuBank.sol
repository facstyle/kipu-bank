// SPDX-License-Identifier: MIT


pragma solidity >=0.8.0;
 

/// @title KipuBank
/// @author Felipe A. Cristaldo
/// @notice Vault-like contract where users can deposit native ETH into a personal vault and withdraw up to a per-transaction threshold.
/// @dev Uses custom errors, checks-effects-interactions, and a simple reentrancy guard. Bank cap is set at deployment. Withdrawal threshold is immutable.
contract KipuBank {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Reverted when deposit would exceed the global bank cap.
    /// @param attempted The attempted deposit amount.
    /// @param availableRemaining How much capacity remains in the bank.
    error Err_BankCapExceeded(uint256 attempted, uint256 availableRemaining);

    /// @notice Reverted when a zero value is sent where > 0 is required.
    error Err_ZeroAmount();

    /// @notice Reverted when a user tries to withdraw more than their vault balance.
    /// @param requested The requested amount.
    /// @param balance The user's vault balance.
    error Err_InsufficientBalance(uint256 requested, uint256 balance);

    /// @notice Reverted when withdraw request exceeds per-transaction threshold.
    /// @param requested The requested amount.
    /// @param threshold The immutable per-transaction threshold.
    error Err_WithdrawAboveThreshold(uint256 requested, uint256 threshold);

    /// @notice Reverted when a native transfer fails.
    /// @param to Recipient.
    /// @param amount Amount attempted.
    error Err_TransferFailed(address to, uint256 amount);

    /// @notice Reverted on reentrancy attempt.
    error Err_ReentrantCall();

    /// @notice Reverted when direct plain transfers to contract are not allowed.
    error Err_NoDirectTransfersAllowed();

    /*//////////////////////////////////////////////////////////////
                             STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Global cap for the entire bank (sum of all vault balances).
    uint256 public immutable bankCap;

    /// @notice Per-transaction withdrawal threshold (immutable).
    uint256 public immutable withdrawalThreshold;

    /// @notice Mapping of user => vault balance (in wei).
    mapping(address => uint256) private _vaults;

    /// @notice Global total of all deposited balance (sum of vaults) to track usage versus bankCap.
    uint256 private _totalVaultBalance;

    /// @notice Global counters for number of successful deposits and withdrawals.
    uint256 private _globalDepositCount;
    uint256 private _globalWithdrawalCount;

    /// @notice Per-user counters for number of deposits and withdrawals.
    mapping(address => uint256) private _userDepositCount;
    mapping(address => uint256) private _userWithdrawalCount;

    /// @notice Reentrancy guard flag (simple).
    bool private _locked;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a user deposits ETH into their vault.
    /// @param user The depositor's address.
    /// @param amount The deposited amount.
    /// @param newBalance The user's new vault balance after deposit.
    event DepositMade(address indexed user, uint256 amount, uint256 newBalance);

    /// @notice Emitted when a user withdraws ETH from their vault.
    /// @param user The withdrawer's address.
    /// @param amount The withdrawn amount.
    /// @param newBalance The user's new vault balance after withdrawal.
    event WithdrawalMade(address indexed user, uint256 amount, uint256 newBalance);

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Deploy the bank with a global cap and per-transaction withdrawal threshold.
    /// @param _bankCap Total cap (in wei) for sum of all vaults.
    /// @param _withdrawalThreshold Per-transaction max withdrawal (in wei).
    constructor(uint256 _bankCap, uint256 _withdrawalThreshold) {
        require(_bankCap > 0, "bankCap>0"); // small sanity check; not user-facing string heavy
        require(_withdrawalThreshold > 0, "threshold>0");
        bankCap = _bankCap;
        withdrawalThreshold = _withdrawalThreshold;
        _locked = false;
    }

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Simple non-reentrant modifier.
    modifier nonReentrant() {
        if (_locked) revert Err_ReentrantCall();
        _locked = true;
        _;
        _locked = false;
    }

    /// @notice Ensures amount is non-zero.
    /// @param amount Value to check.
    modifier positiveAmount(uint256 amount) {
        if (amount == 0) revert Err_ZeroAmount();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL / PUBLIC API
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposit native ETH into caller's personal vault.
    /// @dev Follows checks-effects-interactions: check bank cap, effects update state, then emit. No external calls here.
    /// @dev Emits `DepositMade`.
    function deposit() external payable positiveAmount(msg.value) {
        // Check: bank cap
        uint256 newTotal = _totalVaultBalance + msg.value;
        if (newTotal > bankCap) {
            uint256 remaining = bankCap - _totalVaultBalance;
            revert Err_BankCapExceeded(msg.value, remaining);
        }

        // Effects
        _vaults[msg.sender] += msg.value;
        _totalVaultBalance = newTotal;

        // Update counters (private helper)
        _incrementDepositCount(msg.sender);

        // Interactions: none external (we only emit event)
        emit DepositMade(msg.sender, msg.value, _vaults[msg.sender]);
    }

    /// @notice Withdraw up to the immutable per-transaction threshold from caller's vault.
    /// @param amount The requested withdrawal amount (wei).
    /// @dev Uses checks-effects-interactions and nonReentrant. Emits `WithdrawalMade`.
    function withdraw(uint256 amount) external nonReentrant positiveAmount(amount) {
        // Checks
        if (amount > withdrawalThreshold) {
            revert Err_WithdrawAboveThreshold(amount, withdrawalThreshold);
        }
        uint256 balance = _vaults[msg.sender];
        if (amount > balance) {
            revert Err_InsufficientBalance(amount, balance);
        }

        // Effects
        _vaults[msg.sender] = balance - amount;
        _totalVaultBalance -= amount;
        _incrementWithdrawalCount(msg.sender);

        // Interaction: safe native transfer using call pattern
        _safeSend(payable(msg.sender), amount);

        emit WithdrawalMade(msg.sender, amount, _vaults[msg.sender]);
    }

    /// @notice Returns the vault balance of an account.
    /// @param account Address to query.
    /// @return balance Wei balance of the vault.
    function vaultOf(address account) external view returns (uint256 balance) {
        return _vaults[account];
    }

    /// @notice Returns the total sum of all vault balances.
    /// @return totalVaultBalance The bank's used capacity in wei.
    function totalVaultBalance() external view returns (uint256) {
        return _totalVaultBalance;
    }

    /// @notice Returns the global number of deposits made.
    function globalDepositCount() external view returns (uint256) {
        return _globalDepositCount;
    }

    /// @notice Returns the global number of withdrawals made.
    function globalWithdrawalCount() external view returns (uint256) {
        return _globalWithdrawalCount;
    }

    /// @notice Returns how many deposits a specific user made.
    /// @param user The address to query.
    function userDepositCount(address user) external view returns (uint256) {
        return _userDepositCount[user];
    }

    /// @notice Returns how many withdrawals a specific user made.
    /// @param user The address to query.
    function userWithdrawalCount(address user) external view returns (uint256) {
        return _userWithdrawalCount[user];
    }

    /*//////////////////////////////////////////////////////////////
                         RECEIVE / FALLBACK HANDLING
    //////////////////////////////////////////////////////////////*/

    /// @notice Prevent plain transfers; force users to call deposit() so events and counters are updated.
    receive() external payable {
        revert Err_NoDirectTransfersAllowed();
    }

    fallback() external payable {
        revert Err_NoDirectTransfersAllowed();
    }

    /*//////////////////////////////////////////////////////////////
                             PRIVATE HELPERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Internal helper to safely send native ETH using call.
    /// @param to Recipient payable address.
    /// @param amount Wei amount to send.
    /// @dev Reverts with Err_TransferFailed if the call didn't succeed.
    function _safeSend(address payable to, uint256 amount) private {
        (bool success, ) = to.call{value: amount}("");
        if (!success) {
            revert Err_TransferFailed(to, amount);
        }
    }

    /// @notice Increment deposit counters (global + per user).
    /// @param user The depositor.
    function _incrementDepositCount(address user) private {
        _globalDepositCount += 1;
        _userDepositCount[user] += 1;
    }

    /// @notice Increment withdrawal counters (global + per user).
    /// @param user The withdrawer.
    function _incrementWithdrawalCount(address user) private {
        _globalWithdrawalCount += 1;
        _userWithdrawalCount[user] += 1;
    }
}

