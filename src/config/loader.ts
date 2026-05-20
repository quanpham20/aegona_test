/**
 * Configuration loader for the LayerZero Log Reader
 * 
 * This module handles loading configuration from JSON files or environment variables,
 * and provides default values for missing optional fields.
 * 
 * @module config/loader
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { LogReaderConfig, NetworkConfig, ContractConfig, QueryConfig } from '../types/config';
import { validateConfig } from './validator';

/**
 * Default configuration values
 */
const DEFAULT_NETWORK_TIMEOUT = 30000; // 30 seconds
const DEFAULT_LOG_LEVEL = 'info' as const;
const DEFAULT_BLOCK_RANGE = 1000;
const DEFAULT_MAX_BLOCK_RANGE = 10000;
const DEFAULT_BATCH_SIZE = 2000;

/**
 * Environment variable names for configuration
 */
const ENV_VARS = {
  RPC_ENDPOINT: 'LZ_RPC_ENDPOINT',
  CHAIN_ID: 'LZ_CHAIN_ID',
  NETWORK_TIMEOUT: 'LZ_NETWORK_TIMEOUT',
  LOG_LEVEL: 'LZ_LOG_LEVEL',
  DEFAULT_BLOCK_RANGE: 'LZ_DEFAULT_BLOCK_RANGE',
  MAX_BLOCK_RANGE: 'LZ_MAX_BLOCK_RANGE',
  BATCH_SIZE: 'LZ_BATCH_SIZE',
} as const;

/**
 * Load configuration from a JSON file
 * 
 * @param filePath - Path to the configuration JSON file
 * @returns Parsed configuration object with defaults applied
 * @throws Error if file cannot be read, parsed, or validation fails
 */
export function loadConfigFromFile(filePath: string): LogReaderConfig {
  try {
    const absolutePath = resolve(filePath);
    const fileContent = readFileSync(absolutePath, 'utf-8');
    const config = JSON.parse(fileContent) as Partial<LogReaderConfig>;
    
    const configWithDefaults = applyDefaults(config);
    
    // Validate the configuration
    const validationResult = validateConfig(configWithDefaults);
    if (!validationResult.valid) {
      throw new Error(
        `Configuration validation failed:\n${validationResult.errors.map(e => `  - ${e}`).join('\n')}`
      );
    }
    
    return configWithDefaults;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load configuration from file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load configuration from environment variables
 * 
 * Environment variables:
 * - LZ_RPC_ENDPOINT: RPC endpoint URL (required)
 * - LZ_CHAIN_ID: Chain ID number (required)
 * - LZ_NETWORK_TIMEOUT: Network timeout in milliseconds (optional, default: 30000)
 * - LZ_LOG_LEVEL: Log level (optional, default: 'info')
 * - LZ_DEFAULT_BLOCK_RANGE: Default block range (optional, default: 1000)
 * - LZ_MAX_BLOCK_RANGE: Maximum block range (optional, default: 10000)
 * - LZ_BATCH_SIZE: Batch size for queries (optional, default: 2000)
 * 
 * @returns Configuration object with defaults applied
 * @throws Error if required environment variables are missing or validation fails
 */
export function loadConfigFromEnv(): LogReaderConfig {
  const rpcEndpoint = process.env[ENV_VARS.RPC_ENDPOINT];
  const chainIdStr = process.env[ENV_VARS.CHAIN_ID];
  
  if (!rpcEndpoint) {
    throw new Error(`Missing required environment variable: ${ENV_VARS.RPC_ENDPOINT}`);
  }
  
  if (!chainIdStr) {
    throw new Error(`Missing required environment variable: ${ENV_VARS.CHAIN_ID}`);
  }
  
  const chainId = parseInt(chainIdStr, 10);
  if (isNaN(chainId)) {
    throw new Error(`Invalid chain ID: ${chainIdStr}. Must be a number.`);
  }
  
  // Parse optional network timeout
  const timeoutStr = process.env[ENV_VARS.NETWORK_TIMEOUT];
  const timeout = timeoutStr ? parseInt(timeoutStr, 10) : DEFAULT_NETWORK_TIMEOUT;
  
  // Parse optional log level
  const logLevel = process.env[ENV_VARS.LOG_LEVEL] as LogReaderConfig['logLevel'] | undefined;
  
  // Parse optional query settings
  const defaultBlockRangeStr = process.env[ENV_VARS.DEFAULT_BLOCK_RANGE];
  const maxBlockRangeStr = process.env[ENV_VARS.MAX_BLOCK_RANGE];
  const batchSizeStr = process.env[ENV_VARS.BATCH_SIZE];
  
  const defaultBlockRange = defaultBlockRangeStr 
    ? parseInt(defaultBlockRangeStr, 10) 
    : DEFAULT_BLOCK_RANGE;
  const maxBlockRange = maxBlockRangeStr 
    ? parseInt(maxBlockRangeStr, 10) 
    : DEFAULT_MAX_BLOCK_RANGE;
  const batchSize = batchSizeStr 
    ? parseInt(batchSizeStr, 10) 
    : DEFAULT_BATCH_SIZE;
  
  const config: Partial<LogReaderConfig> = {
    network: {
      rpcEndpoint,
      chainId,
      timeout: isNaN(timeout) ? DEFAULT_NETWORK_TIMEOUT : timeout,
    },
    contracts: {}, // Contracts must be configured separately
    query: {
      defaultBlockRange: isNaN(defaultBlockRange) ? DEFAULT_BLOCK_RANGE : defaultBlockRange,
      maxBlockRange: isNaN(maxBlockRange) ? DEFAULT_MAX_BLOCK_RANGE : maxBlockRange,
      batchSize: isNaN(batchSize) ? DEFAULT_BATCH_SIZE : batchSize,
    },
    logLevel: logLevel || DEFAULT_LOG_LEVEL,
  };
  
  const configWithDefaults = applyDefaults(config);
  
  // Validate the configuration
  const validationResult = validateConfig(configWithDefaults);
  if (!validationResult.valid) {
    throw new Error(
      `Configuration validation failed:\n${validationResult.errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
  
  return configWithDefaults;
}

/**
 * Apply default values to a partial configuration
 * 
 * @param config - Partial configuration object
 * @returns Complete configuration with defaults applied
 */
export function applyDefaults(config: Partial<LogReaderConfig>): LogReaderConfig {
  // Apply network defaults
  const network: NetworkConfig = {
    rpcEndpoint: config.network?.rpcEndpoint || '',
    chainId: config.network?.chainId || 0,
    timeout: config.network?.timeout ?? DEFAULT_NETWORK_TIMEOUT,
  };
  
  // Apply query defaults
  const query: QueryConfig = {
    defaultBlockRange: config.query?.defaultBlockRange ?? DEFAULT_BLOCK_RANGE,
    maxBlockRange: config.query?.maxBlockRange ?? DEFAULT_MAX_BLOCK_RANGE,
    batchSize: config.query?.batchSize ?? DEFAULT_BATCH_SIZE,
  };
  
  // Contracts are required but may be empty
  const contracts: Record<string, ContractConfig> = config.contracts || {};
  
  // Apply log level default
  const logLevel = config.logLevel || DEFAULT_LOG_LEVEL;
  
  return {
    network,
    contracts,
    query,
    logLevel,
  };
}

/**
 * Load configuration from file or environment variables
 * 
 * If filePath is provided, loads from file. Otherwise, loads from environment variables.
 * 
 * @param filePath - Optional path to configuration JSON file
 * @returns Configuration object with defaults applied
 */
export function loadConfig(filePath?: string): LogReaderConfig {
  if (filePath) {
    return loadConfigFromFile(filePath);
  }
  return loadConfigFromEnv();
}
