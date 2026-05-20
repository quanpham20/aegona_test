/**
 * Unit tests for configuration loader
 * 
 * Tests loading configuration from JSON files and environment variables,
 * and verifies default value handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  loadConfig,
  loadConfigFromFile,
  loadConfigFromEnv,
  applyDefaults,
} from '../../src/config/loader';
import type { LogReaderConfig } from '../../src/types/config';

describe('Configuration Loader', () => {
  const testConfigDir = join(__dirname, '../fixtures/configs');
  const testConfigPath = join(testConfigDir, 'test-config.json');
  
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
  
  describe('loadConfigFromFile', () => {
    it('should load valid configuration from JSON file', () => {
      const config: LogReaderConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.example.com',
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
      
      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));
      
      const loaded = loadConfigFromFile(testConfigPath);
      
      expect(loaded).toEqual(config);
    });
    
    it('should apply default values for missing optional fields', () => {
      const minimalConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.example.com',
          chainId: 1,
        },
        contracts: {},
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
      };
      
      writeFileSync(testConfigPath, JSON.stringify(minimalConfig, null, 2));
      
      const loaded = loadConfigFromFile(testConfigPath);
      
      expect(loaded.network.timeout).toBe(30000); // Default timeout
      expect(loaded.logLevel).toBe('info'); // Default log level
    });
    
    it('should throw error for non-existent file', () => {
      expect(() => {
        loadConfigFromFile('./non-existent-config.json');
      }).toThrow('Failed to load configuration from file');
    });
    
    it('should throw error for invalid JSON', () => {
      writeFileSync(testConfigPath, 'invalid json {');
      
      expect(() => {
        loadConfigFromFile(testConfigPath);
      }).toThrow('Failed to load configuration from file');
    });
  });
  
  describe('loadConfigFromEnv', () => {
    it('should load configuration from environment variables', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '1';
      process.env.LZ_NETWORK_TIMEOUT = '45000';
      process.env.LZ_LOG_LEVEL = 'debug';
      process.env.LZ_DEFAULT_BLOCK_RANGE = '500';
      process.env.LZ_MAX_BLOCK_RANGE = '5000';
      process.env.LZ_BATCH_SIZE = '1000';
      
      const loaded = loadConfigFromEnv();
      
      expect(loaded.network.rpcEndpoint).toBe('https://eth-mainnet.example.com');
      expect(loaded.network.chainId).toBe(1);
      expect(loaded.network.timeout).toBe(45000);
      expect(loaded.logLevel).toBe('debug');
      expect(loaded.query.defaultBlockRange).toBe(500);
      expect(loaded.query.maxBlockRange).toBe(5000);
      expect(loaded.query.batchSize).toBe(1000);
    });
    
    it('should apply default values for missing optional environment variables', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '1';
      
      const loaded = loadConfigFromEnv();
      
      expect(loaded.network.timeout).toBe(30000); // Default timeout
      expect(loaded.logLevel).toBe('info'); // Default log level
      expect(loaded.query.defaultBlockRange).toBe(1000); // Default
      expect(loaded.query.maxBlockRange).toBe(10000); // Default
      expect(loaded.query.batchSize).toBe(2000); // Default
    });
    
    it('should throw error when RPC endpoint is missing', () => {
      process.env.LZ_CHAIN_ID = '1';
      delete process.env.LZ_RPC_ENDPOINT;
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow('Missing required environment variable: LZ_RPC_ENDPOINT');
    });
    
    it('should throw error when chain ID is missing', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      delete process.env.LZ_CHAIN_ID;
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow('Missing required environment variable: LZ_CHAIN_ID');
    });
    
    it('should throw error for invalid chain ID', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = 'not-a-number';
      
      expect(() => {
        loadConfigFromEnv();
      }).toThrow('Invalid chain ID: not-a-number. Must be a number.');
    });
    
    it('should handle invalid numeric values gracefully', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '1';
      process.env.LZ_NETWORK_TIMEOUT = 'invalid';
      process.env.LZ_DEFAULT_BLOCK_RANGE = 'invalid';
      
      const loaded = loadConfigFromEnv();
      
      // Should fall back to defaults for invalid numeric values
      expect(loaded.network.timeout).toBe(30000);
      expect(loaded.query.defaultBlockRange).toBe(1000);
    });
  });
  
  describe('applyDefaults', () => {
    it('should apply all default values to empty config', () => {
      const config = applyDefaults({});
      
      expect(config.network.timeout).toBe(30000);
      expect(config.logLevel).toBe('info');
      expect(config.query.defaultBlockRange).toBe(1000);
      expect(config.query.maxBlockRange).toBe(10000);
      expect(config.query.batchSize).toBe(2000);
      expect(config.contracts).toEqual({});
    });
    
    it('should preserve provided values and only apply missing defaults', () => {
      const config = applyDefaults({
        network: {
          rpcEndpoint: 'https://custom.rpc',
          chainId: 5,
          timeout: 60000,
        },
        query: {
          defaultBlockRange: 500,
          maxBlockRange: 5000,
          batchSize: 1000,
        },
        logLevel: 'debug',
      });
      
      expect(config.network.rpcEndpoint).toBe('https://custom.rpc');
      expect(config.network.chainId).toBe(5);
      expect(config.network.timeout).toBe(60000);
      expect(config.query.defaultBlockRange).toBe(500);
      expect(config.query.maxBlockRange).toBe(5000);
      expect(config.query.batchSize).toBe(1000);
      expect(config.logLevel).toBe('debug');
    });
    
    it('should handle partial network config', () => {
      const config = applyDefaults({
        network: {
          rpcEndpoint: 'https://custom.rpc',
          chainId: 5,
        },
      });
      
      expect(config.network.timeout).toBe(30000); // Default applied
      expect(config.network.rpcEndpoint).toBe('https://custom.rpc');
      expect(config.network.chainId).toBe(5);
    });
    
    it('should handle partial query config', () => {
      const config = applyDefaults({
        query: {
          defaultBlockRange: 500,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
      });
      
      expect(config.query.defaultBlockRange).toBe(500);
      expect(config.query.maxBlockRange).toBe(10000);
      expect(config.query.batchSize).toBe(2000);
    });
  });
  
  describe('loadConfig', () => {
    it('should load from file when filePath is provided', () => {
      const config: LogReaderConfig = {
        network: {
          rpcEndpoint: 'https://eth-mainnet.example.com',
          chainId: 1,
          timeout: 30000,
        },
        contracts: {},
        query: {
          defaultBlockRange: 1000,
          maxBlockRange: 10000,
          batchSize: 2000,
        },
        logLevel: 'info',
      };
      
      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));
      
      const loaded = loadConfig(testConfigPath);
      
      expect(loaded).toEqual(config);
    });
    
    it('should load from environment when no filePath is provided', () => {
      process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.example.com';
      process.env.LZ_CHAIN_ID = '1';
      
      const loaded = loadConfig();
      
      expect(loaded.network.rpcEndpoint).toBe('https://eth-mainnet.example.com');
      expect(loaded.network.chainId).toBe(1);
    });
  });
});
