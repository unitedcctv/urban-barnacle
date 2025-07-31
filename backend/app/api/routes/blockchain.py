"""
Blockchain API routes for balance checking and funding operations.
"""
import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.blockchain.blockchain_service import blockchain_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class BalanceResponse(BaseModel):
    """Response model for balance check"""
    balance_eth: str
    balance_wei: str
    has_enough_funds: bool
    required_eth: str
    account_address: str


class FundAccountResponse(BaseModel):
    """Response model for account funding"""
    success: bool
    transaction_hash: str
    funded_amount_eth: str
    new_balance_eth: str
    message: str


@router.get("/balance", response_model=BalanceResponse)
def check_eth_balance(current_user: CurrentUser) -> Any:
    """
    Check ETH balance and determine if sufficient funds are available for NFT minting.
    """
    try:
        if not blockchain_service.is_available():
            raise HTTPException(
                status_code=503, 
                detail="Blockchain service is not available"
            )

        # Get current balance
        balance_wei = blockchain_service.web3.eth.get_balance(blockchain_service.account.address)
        balance_eth = blockchain_service.web3.from_wei(balance_wei, 'ether')
        
        # Estimate gas cost for NFT minting (conservative estimate)
        # Gas limit: 500,000, Gas price: 20 gwei
        estimated_gas_cost_wei = 500000 * blockchain_service.web3.to_wei('20', 'gwei')
        estimated_gas_cost_eth = blockchain_service.web3.from_wei(estimated_gas_cost_wei, 'ether')
        
        # Check if balance is sufficient (with some buffer)
        required_balance_wei = estimated_gas_cost_wei * 2  # 2x buffer for safety
        has_enough_funds = balance_wei >= required_balance_wei
        
        logger.info(f"Balance check for {blockchain_service.account.address}: {balance_eth} ETH, sufficient: {has_enough_funds}")
        
        return BalanceResponse(
            balance_eth=str(balance_eth),
            balance_wei=str(balance_wei),
            has_enough_funds=has_enough_funds,
            required_eth=str(estimated_gas_cost_eth),
            account_address=blockchain_service.account.address
        )
        
    except Exception as e:
        logger.error(f"Error checking balance: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check balance: {str(e)}"
        )


@router.post("/fund-account", response_model=FundAccountResponse)
def fund_account(current_user: CurrentUser) -> Any:
    """
    Fund the blockchain account with ETH from Hardhat's default accounts.
    Only works in development/staging environments.
    """
    try:
        # Security check: Only allow funding in non-production environments
        if settings.ENVIRONMENT == "production":
            raise HTTPException(
                status_code=403,
                detail="Account funding is not allowed in production environment"
            )
        
        if not blockchain_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Blockchain service is not available"
            )

        # Get current balance before funding
        target_address = blockchain_service.account.address
        balance_before_wei = blockchain_service.web3.eth.get_balance(target_address)
        balance_before_eth = blockchain_service.web3.from_wei(balance_before_wei, 'ether')
        
        # Use the first default Hardhat account as funder (should have plenty of ETH)
        # In Hardhat, the first account is typically loaded with 10,000 ETH
        funder_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # Hardhat account #0
        funder_account = blockchain_service.web3.eth.account.from_key(funder_private_key)
        
        # Amount to fund (10 ETH should be plenty for testing)
        fund_amount_eth = 10
        fund_amount_wei = blockchain_service.web3.to_wei(fund_amount_eth, 'ether')
        
        # Create and send funding transaction
        transaction = {
            'to': target_address,
            'value': fund_amount_wei,
            'gas': 21000,  # Standard ETH transfer gas limit
            'gasPrice': blockchain_service.web3.to_wei('20', 'gwei'),
            'nonce': blockchain_service.web3.eth.get_transaction_count(funder_account.address)
        }
        
        # Sign and send transaction
        signed_txn = blockchain_service.web3.eth.account.sign_transaction(transaction, funder_private_key)
        # Handle different Web3.py versions (rawTransaction vs raw_transaction)
        raw_tx = getattr(signed_txn, 'raw_transaction', getattr(signed_txn, 'rawTransaction', None))
        if raw_tx is None:
            raise AttributeError("Could not find raw transaction data in signed transaction")
        
        tx_hash = blockchain_service.web3.eth.send_raw_transaction(raw_tx)
        
        # Wait for transaction receipt
        receipt = blockchain_service.web3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt.status != 1:
            raise Exception(f"Funding transaction failed: {tx_hash.hex()}")
        
        # Get new balance after funding
        balance_after_wei = blockchain_service.web3.eth.get_balance(target_address)
        balance_after_eth = blockchain_service.web3.from_wei(balance_after_wei, 'ether')
        
        logger.info(f"Successfully funded account {target_address} with {fund_amount_eth} ETH. New balance: {balance_after_eth} ETH")
        
        return FundAccountResponse(
            success=True,
            transaction_hash=tx_hash.hex(),
            funded_amount_eth=str(fund_amount_eth),
            new_balance_eth=str(balance_after_eth),
            message=f"Account funded successfully with {fund_amount_eth} ETH"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error funding account: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fund account: {str(e)}"
        )


@router.get("/status")
def get_blockchain_status(current_user: CurrentUser) -> Any:
    """
    Get blockchain service status and configuration.
    """
    try:
        is_available = blockchain_service.is_available()
        
        status_info = {
            "available": is_available,
            "environment": settings.ENVIRONMENT,
            "funding_enabled": settings.ENVIRONMENT != "production"
        }
        
        if is_available:
            status_info.update({
                "web3_connected": blockchain_service.web3.is_connected(),
                "account_address": blockchain_service.account.address,
                "contract_address": blockchain_service.contract_address,
                "latest_block": blockchain_service.web3.eth.block_number
            })
        
        return status_info
        
    except Exception as e:
        logger.error(f"Error getting blockchain status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get blockchain status: {str(e)}"
        )
