import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test review submission and verification flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const moderator = accounts.get('wallet_2')!;
    
    // Add moderator
    let block = chain.mineBlock([
      Tx.contractCall('token-hive', 'add-moderator', 
        [types.principal(moderator.address)], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Submit review
    block = chain.mineBlock([
      Tx.contractCall('token-hive', 'submit-review',
        [
          types.ascii("Test Product"),
          types.utf8("Great review content"),
          types.uint(5)
        ],
        user1.address
      )
    ]);
    const reviewId = block.receipts[0].result.expectOk().expectUint(1);
    
    // Verify review
    block = chain.mineBlock([
      Tx.contractCall('token-hive', 'verify-review',
        [types.uint(reviewId), types.bool(true)],
        moderator.address
      )
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Check user balance and reputation
    let response = chain.callReadOnlyFn(
      'token-hive',
      'get-balance',
      [types.principal(user1.address)],
      user1.address
    );
    response.result.expectOk().expectUint(10);
    
    response = chain.callReadOnlyFn(
      'token-hive',
      'get-reputation',
      [types.principal(user1.address)],
      user1.address
    );
    response.result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Test unauthorized moderator actions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user1 = accounts.get('wallet_1')!;
    
    // Try to verify review as non-moderator
    let block = chain.mineBlock([
      Tx.contractCall('token-hive', 'verify-review',
        [types.uint(1), types.bool(true)],
        user1.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(101);
  }
});

Clarinet.test({
  name: "Test token transfers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    const moderator = accounts.get('wallet_2')!;
    
    // Setup: Add moderator and submit+verify review to get tokens
    let block = chain.mineBlock([
      Tx.contractCall('token-hive', 'add-moderator',
        [types.principal(moderator.address)],
        deployer.address
      ),
      Tx.contractCall('token-hive', 'submit-review',
        [
          types.ascii("Test Product"),
          types.utf8("Review content"),
          types.uint(5)
        ],
        user1.address
      )
    ]);
    
    const reviewId = block.receipts[1].result.expectOk().expectUint(1);
    
    block = chain.mineBlock([
      Tx.contractCall('token-hive', 'verify-review',
        [types.uint(reviewId), types.bool(true)],
        moderator.address
      )
    ]);
    
    // Test transfer
    block = chain.mineBlock([
      Tx.contractCall('token-hive', 'transfer',
        [types.uint(5), types.principal(deployer.address)],
        user1.address
      )
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Verify balances
    let response = chain.callReadOnlyFn(
      'token-hive',
      'get-balance',
      [types.principal(user1.address)],
      user1.address
    );
    response.result.expectOk().expectUint(5);
    
    response = chain.callReadOnlyFn(
      'token-hive',
      'get-balance',
      [types.principal(deployer.address)],
      deployer.address
    );
    response.result.expectOk().expectUint(5);
  }
});
