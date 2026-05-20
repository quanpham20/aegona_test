/**
 * Unit tests for configuration validator
 * 
 * Tests validation of RPC endpoints, contract addresses, block ranges,
 * and complete configuration objects.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidAddress,
  isValidRpcEndpoint,
  validateBlockRanges,
  validateBatchSize,
  validateTimeout,
  validateChainId,
  validateConfig,
  validateMultipleConfigs,
} from '../../src/config/validator';
import type { LogReaderConfig } from '../../src/types/config';

describe('Configuration Validator', () => {
  describe('isValidAddress', () => {
    it('should accept valid Ethereum addresses', () => {
      expect(isValidAddress('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675')).toBe(true);
      expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
      expect(isValidAddress('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF')).toBe(true);
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
    });
    
    it('should reject addresses without 0x prefix', () => {
      expect(isValidAddress('66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675')).toBe(false);
    });
    
    it('should reject addresses with incorrect length', () => {
      expect(isValidAddress('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd6')).toBe(false); // Too short
      expect(isValidAddress('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd67500')).toBe(false); // Too long
    });
    
    it('should reject addresses with invalid hex characters', () => {
      expect(isValidAddress('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd67G')).toBe(false); // G is not hex
      expect(isValidAddress('0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd67!')).toBe(false); // ! is not hex
    });
    
    it('should reject non-string values', () => {
      expect(isValidAddress(null as any)).toBe(false);
      expect(isValidAddress(undefined as any)).toBe(false);
      expect(isValidAddress(123 as any)).toBe(false);
      expect(isValidAddress({} as any)).toBe(false);
    });
    
    it('should reject empty string', () => {
      expect(isValidAddress('')).toBe(false);
    });
  });
  
  describe('isValidRpcEndpoint', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidRpcEndpoint('http://localhost:8545')).toBe(true);
      expect(isValidRpcEndpoint('http://127.0.0.1:8545')).toBe(true);
    });
    
    it('should accept valid HTTPS URLs', () => {
      expect(isValidRpcEndpoint('https://eth-mainnet.g.alchemy.com/v2/api-key')).toBe(true);
      expect(isValidRpcEndpoint('https://mainnet.infura.io/v3/api-key')).toBe(true);
    });
    
    it('should reject non-HTTP(S) protocols', () => {
      expect(isValidRpcEndpoint('ws://localhost:8545')).toBe(false);
      expect(isValidRpcEndpoint('wss://localhost:8545')).toBe(false);
      expect(isValidRpcEndpoint('ftp://localhost:8545')).toBe(false);
    });
    
    it('should reject invalid URLs', () => {
      expect(isValidRpcEndpoint('not-a-url')).toBe(false);
      expect(isValidRpcEndpoint('localhost:8545')).toBe(false);
      expect(isValidRpcEndpoint('//localhost:8545')).toBe(false);
    });
    
    it('should reject non-string values', () => {
      expect(isValidRpcEndpoint(null as any)).toBe(false);
      expect(isValidRpcEndpoint(undefined as any)).toBe(false);
      expect(isValidRpcEndpoint(123 as any)).toBe(false);
    });
    
    it('should reject empty string', () => {
      expect(isValidRpcEndpoint('')).toBe(false);
    });
  });
  
  describe('validateBlockRanges', () => {
    it('should accept valid block ranges', () => {
      const result = validateBlockRanges(1000, 10000);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should accept equal default and max ranges', () => {
      const result = validateBlockRanges(5000, 5000);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject negative default block range', () => {
      const result = validateBlockRanges(-1000, 10000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('defaultBlockRange must be a positive integer');
    });
    
    it('should reject zero default block range', () => {
      const result = validateBlockRanges(0, 10000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('defaultBlockRange must be a positive integer');
    });
    
    it('should reject negative max block range', () => {
      const result = validateBlockRanges(1000, -10000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxBlockRange must be a positive integer');
    });
    
    it('should reject zero max block range', () => {
      const result = validateBlockRanges(1000, 0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxBlockRange must be a positive integer');
    });
    
    it('should reject default range exceeding max range', () => {
      const result = validateBlockRanges(10000, 1000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('defaultBlockRange cannot exceed maxBlockRange');
    });
    
    it('should reject non-integer values', () => {
      const result = validateBlockRanges(1000.5, 10000.5);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should accumulate multiple errors', () => {
      const result = validateBlockRanges(-1000, -10000);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('validateBatchSize', () => {
    it('should accept valid batch size', () => {
      const result = validateBatchSize(2000);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject negative batch size', () => {
      const result = validateBatchSize(-2000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('batchSize must be a positive integer');
    });
    
    it('should reject zero batch size', () => {
      const result = validateBatchSize(0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('batchSize must be a positive integer');
    });
    
    it('should reject non-integer batch size', () => {
      const result = validateBatchSize(2000.5);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('batchSize must be a positive integer');
    });
  });
  
  describe('validateTimeout', () => {
    it('should accept valid timeout', () => {
      const result = validateTimeout(30000);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject negative timeout', () => {
      const result = validateTimeout(-30000);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be a positive integer (milliseconds)');
    });
    
    it('should reject zero timeout', () => {
      const result = validateTimeout(0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be a positive integer (milliseconds)');
    });
    
    it('should reject non-integer timeout', () => {
      const result = validateTimeout(30000.5);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be a positive integer (milliseconds)');
    });
  });
  
  describe('validateChainId', () => {
    it('should accept valid chain IDs', () => {
      expect(validateChainId(1).valid).toBe(true); // Mainnet
      expect(validateChainId(5).valid).toBe(true); // Goerli
      expect(validateChainId(137).valid).toBe(true); // Polygon
    });
    
    it('should reject negative chain ID', () => {
      const result = validateChainId(-1);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('chainId must be a positive integer');
    });
    
    it('should reject zero chain ID', () => {
      const result = validateChainId(0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('chainId must be a positive integer');
    });
    
    it('should reject non-integer chain ID', () => {
      const result = validateChainId(1.5);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('chainId must be a positive integer');
    });
  });
  
  describe('validateConfig', () => {
    const validConfig: LogReaderConfig = {
      network: {
        rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/api-key',
        chainId: 1,
        timeout: 30000,
      },
      contracts: {
        endpoint: {
          address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
          abiPath: './abis/endpoint.json',
        },
      },
      query: {
        defaultBlockRange: 1000,
        maxBlockRange: 10000,
        batchSize: 2000,
      },
      logLevel: 'info',
    };
    
    it('should accept valid configuration', () => {
      const result = validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should reject missing network configuration', () => {
      const config = { ...validConfig, network: undefined as any };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('network configuration is required');
    });
    
    it('should reject missing RPC endpoint', () => {
      const config = {
        ...validConfig,
        network: { ...validConfig.network, rpcEndpoint: '' },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('rpcEndpoint is required'))).toBe(true);
    });
    
    it('should reject invalid RPC endpoint', () => {
      const config = {
        ...validConfig,
        network: { ...validConfig.network, rpcEndpoint: 'not-a-url' },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('rpcEndpoint is invalid'))).toBe(true);
    });
    
    it('should reject missing chain ID', () => {
      const config = {
        ...validConfig,
        network: { ...validConfig.network, chainId: undefined as any },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('chainId is required'))).toBe(true);
    });
    
    it('should reject invalid chain ID', () => {
      const config = {
        ...validConfig,
        network: { ...validConfig.network, chainId: -1 },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('chainId'))).toBe(true);
    });
    
    it('should reject invalid timeout', () => {
      const config = {
        ...validConfig,
        network: { ...validConfig.network, timeout: -1000 },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('timeout'))).toBe(true);
    });
    
    it('should reject missing contracts configuration', () => {
      const config = { ...validConfig, contracts: undefined as any };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('contracts configuration is required');
    });
    
    it('should reject invalid contract address', () => {
      const config = {
        ...validConfig,
        contracts: {
          endpoint: {
            address: 'invalid-address',
            abiPath: './abis/endpoint.json',
          },
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('address is invalid'))).toBe(true);
    });
    
    it('should reject missing contract address', () => {
      const config = {
        ...validConfig,
        contracts: {
          endpoint: {
            address: '',
            abiPath: './abis/endpoint.json',
          },
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('address is required'))).toBe(true);
    });
    
    it('should reject missing contract ABI path', () => {
      const config = {
        ...validConfig,
        contracts: {
          endpoint: {
            address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
            abiPath: '',
          },
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('abiPath is required'))).toBe(true);
    });
    
    it('should validate multiple contracts', () => {
      const config = {
        ...validConfig,
        contracts: {
          endpoint: {
            address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
            abiPath: './abis/endpoint.json',
          },
          relayer: {
            address: 'invalid-address',
            abiPath: './abis/relayer.json',
          },
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('relayer.address is invalid'))).toBe(true);
    });
    
    it('should reject missing query configuration', () => {
      const config = { ...validConfig, query: undefined as any };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('query configuration is required');
    });
    
    it('should reject invalid block ranges', () => {
      const config = {
        ...validConfig,
        query: {
          defaultBlockRange: 10000,
          maxBlockRange: 1000,
          batchSize: 2000,
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('defaultBlockRange cannot exceed maxBlockRange'))).toBe(true);
    });
    
    it('should reject invalid batch size', () => {
      const config = {
        ...validConfig,
        query: {
          ...validConfig.query,
          batchSize: -2000,
        },
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('batchSize'))).toBe(true);
    });
    
    it('should reject invalid log level', () => {
      const config = {
        ...validConfig,
        logLevel: 'invalid' as any,
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('logLevel is invalid'))).toBe(true);
    });
    
    it('should accept valid log levels', () => {
      const logLevels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];
      
      for (const logLevel of logLevels) {
        const config = { ...validConfig, logLevel };
        const result = validateConfig(config);
        expect(result.valid).toBe(true);
      }
    });
    
    it('should accumulate multiple validation errors', () => {
      const config = {
        network: {
          rpcEndpoint: 'invalid-url',
          chainId: -1,
          timeout: -1000,
        },
        contracts: {
          endpoint: {
            address: 'invalid-address',
            abiPath: '',
          },
        },
        query: {
          defaultBlockRange: -1000,
          maxBlockRange: -10000,
          batchSize: -2000,
        },
        logLevel: 'invalid' as any,
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });
    
    it('should accept configuration with empty contracts object', () => {
      const config = {
        ...validConfig,
        contracts: {},
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('validateMultipleConfigs', () => {
    const mainnetConfig: LogReaderConfig = {
      network: {
        rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/api-key',
        chainId: 1,
        timeout: 30000,
      },
      contracts: {
        endpoint: {
          address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
          abiPath: './abis/endpoint.json',
        },
      },
      query: {
        defaultBlockRange: 1000,
        maxBlockRange: 10000,
        batchSize: 2000,
      },
      logLevel: 'info',
    };
    
    const goerliConfig: LogReaderConfig = {
      network: {
        rpcEndpoint: 'https://eth-goerli.g.alchemy.com/v2/api-key',
        chainId: 5,
        timeout: 30000,
      },
      contracts: {
        endpoint: {
          address: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
          abiPath: './abis/endpoint.json',
        },
      },
      query: {
        defaultBlockRange: 1000,
        maxBlockRange: 10000,
        batchSize: 2000,
      },
      logLevel: 'debug',
    };
    
    it('should validate multiple valid configurations', () => {
      const configs = {
        mainnet: mainnetConfig,
        goerli: goerliConfig,
      };
      
      const results = validateMultipleConfigs(configs);
      
      expect(results.mainnet.valid).toBe(true);
      expect(results.goerli.valid).toBe(true);
    });
    
    it('should identify invalid configurations in multi-network setup', () => {
      const invalidConfig = {
        ...mainnetConfig,
        network: {
          ...mainnetConfig.network,
          rpcEndpoint: 'invalid-url',
        },
      };
      
      const configs = {
        mainnet: mainnetConfig,
        invalid: invalidConfig,
      };
      
      const results = validateMultipleConfigs(configs);
      
      expect(results.mainnet.valid).toBe(true);
      expect(results.invalid.valid).toBe(false);
      expect(results.invalid.errors.length).toBeGreaterThan(0);
    });
    
    it('should validate each network independently', () => {
      const configs = {
        mainnet: mainnetConfig,
        goerli: goerliConfig,
        custom: {
          ...mainnetConfig,
          network: {
            rpcEndpoint: 'http://localhost:8545',
            chainId: 1337,
            timeout: 60000,
          },
        },
      };
      
      const results = validateMultipleConfigs(configs);
      
      expect(results.mainnet.valid).toBe(true);
      expect(results.goerli.valid).toBe(true);
      expect(results.custom.valid).toBe(true);
    });
    
    it('should handle empty configs object', () => {
      const results = validateMultipleConfigs({});
      expect(results).toEqual({});
    });
  });
});
