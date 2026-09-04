// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title PitwallVault
 * @notice On-Chain Formula 1 Quantitative Syndicate Vault & Gnosis Conditional Tokens Collateral Manager.
 * Executes AI-adjudicated sports predictions and settles verified race payouts.
 */
contract PitwallVault {
    IERC20 public immutable usdc;
    address public owner;
    address public relay;

    struct SyndicatePosition {
        bytes32 marketId;
        address user;
        uint8 outcomeSide; // 1 = YES, 2 = NO
        uint256 wagerAmount;
        uint256 outcomeTokensMinted;
        uint256 payoutAmount;
        bool isSettled;
        bool isWon;
    }

    // User collateral balances deposited in vault (in USDC 6 decimals)
    mapping(address => uint256) public userBalances;
    // Market resolutions: marketId => outcome (1 = YES, 2 = NO, 0 = UNRESOLVED)
    mapping(bytes32 => uint8) public marketResolutions;
    // Positions: positionId => SyndicatePosition
    mapping(bytes32 => SyndicatePosition) public positions;
    // User position history
    mapping(address => bytes32[]) public userPositions;

    uint256 public totalVaultCollateral;
    uint256 public totalWagersExecuted;
    uint256 public totalPayoutsDisbursed;

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event WagerPlaced(bytes32 indexed positionId, bytes32 indexed marketId, address indexed user, uint8 side, uint256 wager, uint256 tokensMinted);
    event MarketResolved(bytes32 indexed marketId, uint8 winningSide);
    event PayoutDisbursed(bytes32 indexed positionId, address indexed user, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "[ERR_AUTH] Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == relay, "[ERR_AUTH] Only authorized relay");
        _;
    }

    constructor(address _usdcAddress, address _relayAddress) {
        require(_usdcAddress != address(0), "[ERR_ZERO_ADDR]");
        usdc = IERC20(_usdcAddress);
        owner = msg.sender;
        relay = _relayAddress;
    }

    function setRelay(address _newRelay) external onlyOwner {
        relay = _newRelay;
    }

    /**
     * @notice Deposits USDC collateral into the user vault balance.
     */
    function depositCollateral(uint256 amount) external {
        require(amount > 0, "[ERR_AMOUNT_ZERO] Deposit must be > 0");
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "[ERR_TRANSFER_FAIL] USDC transfer failed");

        userBalances[msg.sender] += amount;
        totalVaultCollateral += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraws unencumbered USDC collateral back to the user's wallet.
     */
    function withdrawCollateral(uint256 amount) external {
        require(amount > 0, "[ERR_AMOUNT_ZERO]");
        require(userBalances[msg.sender] >= amount, "[ERR_INSUFFICIENT_FUNDS] Insufficient vault balance");

        userBalances[msg.sender] -= amount;
        totalVaultCollateral -= amount;

        // INVARIANT 6: Underfunded revert guard
        require(usdc.balanceOf(address(this)) >= amount, "[ERR_UNDERFUNDED] Vault reserves insufficient");
        bool success = usdc.transfer(msg.sender, amount);
        require(success, "[ERR_TRANSFER_FAIL] USDC withdrawal failed");

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Executes an on-chain syndicate wager backed by GenLayer AI consensus.
     * Mints ERC-1155 style conditional outcome shares.
     * @param positionId Unique bytes32 tracking ID.
     * @param marketId Standardized bytes32 race market ID.
     * @param outcomeSide 1 = YES, 2 = NO.
     * @param wagerAmount Amount of USDC to allocate.
     * @param priceCents Price per outcome token in cents (e.g. 38 = $0.38).
     */
    function executeSyndicateWager(
        bytes32 positionId,
        bytes32 marketId,
        uint8 outcomeSide,
        uint256 wagerAmount,
        uint256 priceCents
    ) external {
        require(positions[positionId].user == address(0), "[ERR_DUP_POS] Position ID already exists");
        require(outcomeSide == 1 || outcomeSide == 2, "[ERR_INVALID_SIDE] Side must be 1 (YES) or 2 (NO)");
        require(wagerAmount >= 1 * 10**6, "[ERR_MIN_WAGER] Minimum wager is 1 USDC");
        require(priceCents >= 1 && priceCents <= 99, "[ERR_INVALID_PRICE] Price must be between 1 and 99 cents");
        require(marketResolutions[marketId] == 0, "[ERR_MARKET_RESOLVED] Market already settled");

        // Debit collateral from user balance
        require(userBalances[msg.sender] >= wagerAmount, "[ERR_INSUFFICIENT_VAULT_COLLATERAL]");
        userBalances[msg.sender] -= wagerAmount;

        // Calculate conditional outcome tokens: wager / (priceCents / 100) = wager * 100 / priceCents
        uint256 tokensMinted = (wagerAmount * 100) / priceCents;

        SyndicatePosition memory pos = SyndicatePosition({
            marketId: marketId,
            user: msg.sender,
            outcomeSide: outcomeSide,
            wagerAmount: wagerAmount,
            outcomeTokensMinted: tokensMinted,
            payoutAmount: 0,
            isSettled: false,
            isWon: false
        });

        positions[positionId] = pos;
        userPositions[msg.sender].push(positionId);
        totalWagersExecuted += 1;

        emit WagerPlaced(positionId, marketId, msg.sender, outcomeSide, wagerAmount, tokensMinted);
    }

    /**
     * @notice Settles a race market upon confirmed FIA classification and GenLayer consensus.
     * @param marketId Standardized bytes32 market ID.
     * @param winningSide 1 = YES, 2 = NO.
     */
    function settleMarket(bytes32 marketId, uint8 winningSide) external onlyAuthorized {
        require(winningSide == 1 || winningSide == 2, "[ERR_INVALID_SIDE]");
        require(marketResolutions[marketId] == 0, "[ERR_ALREADY_SETTLED]");
        marketResolutions[marketId] = winningSide;
        emit MarketResolved(marketId, winningSide);
    }

    /**
     * @notice Claims winnings for a finalized position.
     * Full $1.00 payout per winning outcome share.
     */
    function claimWinnings(bytes32 positionId) external {
        SyndicatePosition storage pos = positions[positionId];
        require(pos.user != address(0), "[ERR_POS_NOT_FOUND]");
        require(!pos.isSettled, "[ERR_ALREADY_SETTLED]");
        
        bytes32 mId = pos.marketId;
        uint8 winSide = marketResolutions[mId];
        require(winSide != 0, "[ERR_MARKET_PENDING] Market has not been resolved yet");

        pos.isSettled = true;

        if (pos.outcomeSide == winSide) {
            pos.isWon = true;
            // 1 Token = $1.00 (10^6 USDC base unit)
            uint256 payout = pos.outcomeTokensMinted;
            pos.payoutAmount = payout;

            // INVARIANT 6: Strict underfunded settlement revert guard
            require(usdc.balanceOf(address(this)) >= payout, "[ERR_UNDERFUNDED] Vault balance insufficient for syndicate payout");

            totalPayoutsDisbursed += payout;
            bool success = usdc.transfer(pos.user, payout);
            require(success, "[ERR_TRANSFER_FAIL] Payout transfer failed");

            emit PayoutDisbursed(positionId, pos.user, payout);
        } else {
            pos.isWon = false;
            pos.payoutAmount = 0;
            // Outcome tokens expire worthless ($0 payout)
        }
    }

    function getUserPositions(address user) external view returns (bytes32[] memory) {
        return userPositions[user];
    }
}
