"""
Blockchain module for Ethereum smart contract integration.

This module contains:
- blockchain_service.py: Main blockchain service for smart contract interactions
- generate_test_account.py: Script to generate Ethereum test accounts
- setup_blockchain_dev.py: Script to setup blockchain development environment
- test_blockchain_setup.py: Script to test blockchain configuration
"""

from .blockchain_service import BlockchainService

__all__ = ['BlockchainService']
