/**
 * Configuration validation for the LayerZero Log Reader
 * 
 * This module provides validation functions for configuration values including
 * RPC endpoints, contract addresses, and block ranges.
 * 
 * @module config/validator
 */

import type { LogReaderConfig, ValidationResult } from '../types/config';

/**
 * Validate an Ethereum address format
 * 
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  // Must be 0x-prefixed, 42 characters total (0x + 40 hex chars)
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  if (address.length !== 42) {
    return false;
  }
  
  if (!address.startsWith('0x')) {
    return false;
  }
  
  // Check if remaining characters are valid hex
  const hexPart = address.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hexPart);
}

/**
 * Validate an RPC endpoint URL
 * 
 * @param endpoint - The RPC endpoint URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidRpcEndpoint(endpoint: string): boolean {
  if (!endpoint || typeof endpoint !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(endpoint);
    // Must be http or https protocol
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate block range values
 * 
 * @param defaultBlockRange - Default block range value
 * @param maxBlockRange - Maximum block range value
 * @returns Validation result with any errors
 */
export function validateBlockRanges(
  defaultBlockRange: number,
  maxBlockRange: number
): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(defaultBlockRange) || defaultBlockRange <= 0) {
    errors.push('defaultBlockRange must be a positive integer');
  }
  
  if (!Number.isInteger(maxBlockRange) || maxBlockRange <= 0) {
    errors.push('maxBlockRange must be a positive integer');
  }
  
  if (defaultBlockRange > maxBlockRange) {
    errors.push('defaultBlockRange cannot exceed maxBlockRange');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch size value
 * 
 * @param batchSize - Batch size value
 * @returns Validation result with any errors
 */
export function validateBatchSize(batchSize: number): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    errors.push('batchSize must be a positive integer');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate network timeout value
 * 
 * @param timeout - Timeout value in milliseconds
 * @returns Validation result with any errors
 */
export function validateTimeout(timeout: number): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(timeout) || timeout <= 0) {
    errors.push('timeout must be a positive integer (milliseconds)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate chain ID value
 * 
 * @param chainId - Chain ID value
 * @returns Validation result with any errors
 */
export function validateChainId(chainId: number): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(chainId) || chainId <= 0) {
    errors.push('chainId must be a positive integer');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a complete LogReaderConfig
 * 
 * Validates:
 * - RPC endpoint URL format
 * - Chain ID is a positive integer
 * - Network timeout is a positive integer
 * - All contract addresses are valid Ethereum addresses
 * - Block ranges are positive integers with defaultBlockRange <= maxBlockRange
 * - Batch size is a positive integer
 * 
 * @param config - The configuration to validate
 * @returns Validation result with specific errors for each invalid field
 */
export function validateConfig(config: LogReaderConfig): ValidationResult {
  const errors: string[] = [];
  
  // Validate network configuration
  if (!config.network) {
    errors.push('network configuration is required');
    return { valid: false, errors };
  }
  
  // Validate RPC endpoint
  if (!config.network.rpcEndpoint) {
    errors.push('network.rpcEndpoint is required');
  } else if (!isValidRpcEndpoint(config.network.rpcEndpoint)) {
    errors.push(
      `network.rpcEndpoint is invalid: "${config.network.rpcEndpoint}". Must be a valid HTTP or HTTPS URL`
    );
  }
  
  // Validate chain ID
  if (config.network.chainId === undefined || config.network.chainId === null) {
    errors.push('network.chainId is required');
  } else {
    const chainIdResult = validateChainId(config.network.chainId);
    if (!chainIdResult.valid) {
      errors.push(...chainIdResult.errors.map(e => `network.chainId: ${e}`));
    }
  }
  
  // Validate timeout if provided
  if (config.network.timeout !== undefined) {
    const timeoutResult = validateTimeout(config.network.timeout);
    if (!timeoutResult.valid) {
      errors.push(...timeoutResult.errors.map(e => `network.timeout: ${e}`));
    }
  }
  
  // Validate contracts
  if (!config.contracts) {
    errors.push('contracts configuration is required');
  } else {
    for (const [contractName, contractConfig] of Object.entries(config.contracts)) {
      if (!contractConfig.address) {
        errors.push(`contracts.${contractName}.address is required`);
      } else if (!isValidAddress(contractConfig.address)) {
        errors.push(
          `contracts.${contractName}.address is invalid: "${contractConfig.address}". Must be a 0x-prefixed 42-character hex string`
        );
      }
      
      if (!contractConfig.abiPath) {
        errors.push(`contracts.${contractName}.abiPath is required`);
      }
    }
  }
  
  // Validate query configuration
  if (!config.query) {
    errors.push('query configuration is required');
  } else {
    // Validate block ranges
    const blockRangeResult = validateBlockRanges(
      config.query.defaultBlockRange,
      config.query.maxBlockRange
    );
    if (!blockRangeResult.valid) {
      errors.push(...blockRangeResult.errors.map(e => `query: ${e}`));
    }
    
    // Validate batch size
    const batchSizeResult = validateBatchSize(config.query.batchSize);
    if (!batchSizeResult.valid) {
      errors.push(...batchSizeResult.errors.map(e => `query: ${e}`));
    }
  }
  
  // Validate log level if provided
  if (config.logLevel !== undefined) {
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(config.logLevel)) {
      errors.push(
        `logLevel is invalid: "${config.logLevel}". Must be one of: ${validLogLevels.join(', ')}`
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple network configurations
 * 
 * Supports validating configurations for different networks (mainnet, testnet, custom).
 * Each network configuration is validated independently.
 * 
 * @param configs - Map of network names to configurations
 * @returns Map of network names to validation results
 */
export function validateMultipleConfigs(
  configs: Record<string, LogReaderConfig>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  
  for (const [networkName, config] of Object.entries(configs)) {
    results[networkName] = validateConfig(config);
  }
  
  return results;
}
