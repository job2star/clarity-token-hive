# TokenHive
A token-based platform for incentivized reviews built on Stacks blockchain using Clarity.

## Features
- Review submission and token rewards
- Review verification and moderation 
- Token transfers and balance management
- Review rating and scoring system
- User reputation tracking

## Setup and Installation
1. Clone the repository
2. Install Clarinet (if not already installed)
3. Run `clarinet check` to verify contracts
4. Run `clarinet test` to run test suite

## Usage Examples
```clarity
;; Submit a review
(contract-call? .token-hive submit-review "Product ABC" "Great product!" u5)

;; Verify a review (moderator only)
(contract-call? .token-hive verify-review u1 true)

;; Get user reputation score
(contract-call? .token-hive get-reputation 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Transfer tokens
(contract-call? .token-hive transfer u100 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
```

## Dependencies
- Clarity language 
- Clarinet for testing and deployment
