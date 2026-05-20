/**
 * Unit tests for configuration types
 * 
 * These tests verify that the configuration types are correctly defined
 * and can be used to create valid configuration objects.
 */

import { describe, it, expect } from 'vitest';
import type {
  NetworkConfig,
  ContractConfig,
  QueryConfig,
  LogReaderConfig,
  ValidationResult,
} from '../../src/types/config';

describe('Configuration Types', () => {
  describe('NetworkConfig', () => {
    it('should accept valid network configuration', () => {
      const config: NetworkConfig = {
        rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        chainId: 1,
        timeout: 30000,
      };

      expect(config.rpcEndpoint).toBe('https://eth-mainnet.g.alchemy.com/v2/demo');
      expect(config.chainId).toBe(1);
      expect(config.timeout).toBe(30000);
    });

    it('should accept network configuration without optional timeout', () => {
      const config: NetworkConfig = {
        rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        chainId: 1,
      };

      expect(config.rpcEndpoint).toBe('https://eth-mainnet.g.alchemy.com/v2/demo');
      expect(config.chainId).toBe(1);
      expect(config.timeout).toBeUndefined();
    });
  });

  describe('ContractConfig', () => {
    it('should accept valid contract configuration', () => {
      const config: ContractConfig = {
        address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
        abiPath: './abis/LayerZeroEndpoint.json',
      };

      expect(config.address).toBe('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675');
      expect(config.abiPath).toBe('./abis/LayerZeroEndpoint.json');
    });
  });

  describe('QueryConfig', () => {
    it('should accept valid query configuration', () => {
      const config: QueryConfig = {
        defaultBlockRange: 1000,
        maxBlockRange: 10000,
        batchSize: 2000,
      };

      expect(config.defaultBlockRange).toBe(1000);
      expect(config.maxBlockRange).toBe(10000);
      expect(config.batchSize).toBe(2000);
    });
  });

  describe('LogReaderConfig', () => {
    it('should accept valid complete configuration', () => {
      const config: LogReaderConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
          chainId: 1,
          timeout: 30000,
        },
        contracts: {
          endpoint: {
            address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
            abiPath: './abis/LayerZeroEndpoint.json',
          },
        },
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
        logLevel: 'info',
      };

      expect(config.network.chainId).toBe(1);
      expect(config.contracts.endpoint.address).toBe('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675');
      expect(config.query.defaultBlockRange).toBe(1000);
      expect(config.logLevel).toBe('info');
    });

    it('should accept configuration without optional logLevel', () => {
      const config: LogReaderConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
          chainId: 1,
        },
        contracts: {
          endpoint: {
            address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
            abiPath: './abis/LayerZeroEndpoint.json',
          },
        },
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
      };

      expect(config.logLevel).toBeUndefined();
    });

    it('should accept multiple contracts', () => {
      const config: LogReaderConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/demo',
          chainId: 1,
        },
        contracts: {
          endpoint: {
            address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
            abiPath: './abis/LayerZeroEndpoint.json',
          },
          ultraLightNode: {
            address: '0x4D73AdB72bC3DD368966edD0f0b2148401A178E2',
            abiPath: './abis/UltraLightNode.json',
          },
        },
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
      };

      expect(Object.keys(config.contracts)).toHaveLength(2);
      expect(config.contracts.endpoint).toBeDefined();
      expect(config.contracts.ultraLightNode).toBeDefined();
    });
  });

  describe('ValidationResult', () => {
    it('should accept valid validation result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
      };

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept invalid validation result with errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          'Invalid RPC endpoint',
          'Contract address must be 42 characters',
        ],
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe('Invalid RPC endpoint');
      expect(result.errors[1]).toBe('Contract address must be 42 characters');
    });
  });
});
