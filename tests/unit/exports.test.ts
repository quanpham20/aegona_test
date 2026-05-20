/**
 * Unit tests for public exports
 * 
 * These tests verify that all types are properly exported from the main index.
 */

import { describe, it, expect } from 'vitest';

describe('Public Exports', () => {
  it('should export configuration types and functions from main index', async () => {
    const exports = await import('../../src/index');
    
    // Verify that the module exports exist (TypeScript will catch type errors at compile time)
    expect(exports).toBeDefined();
    
    // Verify configuration loader functions are exported
    expect(exports.loadConfig).toBeDefined();
    expect(exports.loadConfigFromFile).toBeDefined();
    expect(exports.loadConfigFromEnv).toBeDefined();
    expect(exports.applyDefaults).toBeDefined();
  });

  it('should allow importing types from main index', () => {
    // This test verifies TypeScript compilation - if types aren't exported, this won't compile
    type NetworkConfig = import('../../src/index').NetworkConfig;
    type ContractConfig = import('../../src/index').ContractConfig;
    type QueryConfig = import('../../src/index').QueryConfig;
    type LogReaderConfig = import('../../src/index').LogReaderConfig;
    type ValidationResult = import('../../src/index').ValidationResult;

    // Create sample objects to verify types work
    const network: NetworkConfig = {
      rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      chainId: 1,
    };

    const contract: ContractConfig = {
      address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
      abiPath: './abis/LayerZeroEndpoint.json',
    };

    const query: QueryConfig = {
      defaultBlockRange: 1000,
      maxBlockRange: 10000,
      batchSize: 2000,
    };

    const config: LogReaderConfig = {
      network,
      contracts: { endpoint: contract },
      query,
    };

    const validation: ValidationResult = {
      valid: true,
      errors: [],
    };

    expect(network.chainId).toBe(1);
    expect(contract.address).toBe('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675');
    expect(query.defaultBlockRange).toBe(1000);
    expect(config.network.chainId).toBe(1);
    expect(validation.valid).toBe(true);
  });
});
