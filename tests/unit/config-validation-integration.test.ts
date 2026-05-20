/**
 * Integration tests for configuration validation
 * 
 * Tests the integration of validation with configuration loading,
 * ensuring that invalid configurations are rejected with specific error messages.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfigFromFile, loadConfigFromEnv } from '../../src/config/loader';

describe('Configuration Validation Integration', () => {
  const testConfigDir = join(__dirname, '../fixtures/configs');
  const testConfigPath = join(testConfigDir, 'validation-test-config.json');
  
  // Store original environment variables
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Create test config directory
    mkdirSync(testConfigDir, { recursive: true });
  });
  
  afterEach(() => {
    // Clean up test files
    try {
      unlinkSync(testConfigPath);
    } catch {
      // Ignore if file doesn't exist
    }
    
    // Restore original environment
    process.env = { ...originalEnv };
  });
  
  describe('loadConfigFromFile with validation', () => {
    it('should reject configuration with invalid RPC endpoint', () => {
      const invalidConfig = {
        network: {
          rpcEndpoint: 'not-a-valid-url',
          chainId: 1,
        },
        contracts: {},
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
      };
      
      writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        loadConfigFromFile(testConfigPath);
      }).toThrow(/rpcEndpoint is invalid/);
    });
    
    it('should reject configuration with invalid contract address', () => {
      const invalidConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.example.com',
          chainId: 1,
        },
        contracts: {
          endpoint: {
            address: 'invalid-address',
            abiPath: './abis/endpoint.json',
          },
        },
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
      };
      
      writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        loadConfigFromFile(testConfigPath);
      }).toThrow(/address is invalid/);
    });
    
    it('should reject configuration with invalid block ranges', () => {
      const invalidConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.example.com',
          chainId: 1,
        },
        contracts: {},
        query: {
          defaultBlockRange: 10000,
          maxBlockRange: 1000,
          batchSize: 2000,
        },
      };
      
      writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      expect(() => {
        loadConfigFromFile(testConfigPath);
      }).toThrow(/defaultBlockRange cannot exceed maxBlockRange/);
    });
    
    it('should provide multiple validation errors', () => {
      const invalidConfig = {
        network: {
          rpcEndpoint: 'invalid-url',
          chainId: -1,
        },
        contracts: {
          endpoint: {
            address: 'bad-address',
            abiPath: '',
          },
        },
        query: {
          defaultBlockRange: -1000,
          maxBlockRange: -10000,
          batchSize: -2000,
        },
      };
      
      writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      try {
        loadConfigFromFile(testConfigPath);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toContain('rpcEndpoint is invalid');
        expect(message).toContain('chainId');
        expect(message).toContain('address is invalid');
      }
    });
  });
  
  describe('loadConfigFromEnv with validation', () => {
    it('should reject invalid RPC endpoint from environment', () => {
      process.env.LZ_RPC_ENDPOINT = 'not-a-valid-url';
      process.env.LZ_CHAIN_ID = '1';
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow(/rpcEndpoint is invalid/);
    });
    
    it('should reject negative chain ID from environment', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '-1';
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow(/chainId/);
    });
    
    it('should reject invalid timeout from environment', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '1';
      process.env.LZ_NETWORK_TIMEOUT = '-5000';
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow(/timeout/);
    });
    
    it('should reject invalid block ranges from environment', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '1';
      process.env.LZ_DEFAULT_BLOCK_RANGE = '10000';
      process.env.LZ_MAX_BLOCK_RANGE = '1000';
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow(/defaultBlockRange cannot exceed maxBlockRange/);
    });
  });
  
  describe('Multi-network configuration validation', () => {
    it('should validate each network configuration independently', () => {
      const mainnetConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.example.com',
          chainId: 1,
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
      };
      
      writeFileSync(testConfigPath, JSON.stringify(mainnetConfig, null, 2));
      
      // Should load successfully
      const loaded = loadConfigFromFile(testConfigPath);
      expect(loaded.network.chainId).toBe(1);
      
      // Now test with Goerli config
      const goerliConfig = {
        ...mainnetConfig,
        network: {
          rpcEndpoint: 'https://eth-goerli.example.com',
          chainId: 5,
        },
      };
      
      writeFileSync(testConfigPath, JSON.stringify(goerliConfig, null, 2));
      
      const loadedGoerli = loadConfigFromFile(testConfigPath);
      expect(loadedGoerli.network.chainId).toBe(5);
    });
  });
});
