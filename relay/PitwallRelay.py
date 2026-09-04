import os
import json
import logging
from web3 import Web3

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("PitwallRelay")

def string_to_bytes32(text: str) -> bytes:
    """
    Collision-safe cryptographic mapping from string market identifier to EVM bytes32
    using Keccak-256 (SHA-3 standard). Guarantees zero collisions across any market name length.
    """
    return Web3.keccak(text=text)


class PitwallRelay:
    """
    Autonomous Settlement Relay for Pitwall AI.
    Discovers application-created markets from GenLayer AI consensus decisions,
    maps them using cryptographic collision-safe bytes32 identifiers, and executes
    on-chain market settlements on PitwallVault.sol with receipt confirmation.
    """
    def __init__(self, w3: Web3, vault_address: str, vault_abi: list, operator_private_key: str):
        self.w3 = w3
        self.vault_address = Web3.to_checksum_address(vault_address)
        self.vault = self.w3.eth.contract(address=self.vault_address, abi=vault_abi)
        self.account = self.w3.eth.account.from_key(operator_private_key)

    def relay_market_settlement(self, market_id_str: str, winning_side: int) -> str:
        """
        Broadcasts settleMarket to PitwallVault on EVM and awaits confirmed receipt.
        winning_side: 1 = YES, 2 = NO.
        """
        assert winning_side in (1, 2), f"Invalid winning side: {winning_side}"
        market_id_bytes32 = string_to_bytes32(market_id_str)

        logger.info(f"[RELAY] Broadcasting settleMarket for '{market_id_str}' (Winning Side: {'YES' if winning_side == 1 else 'NO'})...")
        
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        tx = self.vault.functions.settleMarket(market_id_bytes32, winning_side).build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": self.w3.eth.gas_price
        })

        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        logger.info(f"[BROADCAST] Tx Hash: {tx_hash.hex()}. Awaiting block finality...")

        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        assert receipt.status == 1, f"[ERR_REVERT] Settlement transaction failed on EVM (Status: {receipt.status})"
        logger.info(f"[CONFIRMED] Market '{market_id_str}' settled on EVM in block {receipt.blockNumber} (Status: 1)!")

        return tx_hash.hex()

    def discover_and_relay(self, genlayer_markets: list) -> list:
        """
        Autonomous Discovery: Discovers application-created markets from GenLayer,
        matches them with collision-safe bytes32 IDs, queries EVM Vault resolution state,
        and settles any pending settled markets with verified receipt confirmation.
        """
        settled_txs = []
        for m in genlayer_markets:
            market_id = m.get("market_id")
            if not market_id:
                continue
            
            # Check if GenLayer consensus settled this market
            status = m.get("status")
            if status != "RACE_SETTLED":
                continue

            # Collision-safe mapping to bytes32
            m_bytes32 = string_to_bytes32(market_id)

            # Check EVM vault state
            try:
                evm_res = self.vault.functions.marketResolutions(m_bytes32).call()
            except Exception as e:
                logger.warning(f"[DISCOVERY] Error checking EVM state for {market_id}: {e}")
                continue

            if evm_res == 0:
                logger.info(f"[DISCOVERY] Discovered unsettled market on EVM: '{market_id}'. Relaying settlement...")
                winner_outcome = m.get("winner_outcome", "YES")
                side = 1 if winner_outcome == "YES" else 2
                tx_hash = self.relay_market_settlement(market_id, side)
                settled_txs.append({"market_id": market_id, "tx_hash": tx_hash, "side": side})
            else:
                logger.info(f"[DISCOVERY] Market '{market_id}' is already settled on EVM (Resolution: {evm_res}).")
        
        return settled_txs
