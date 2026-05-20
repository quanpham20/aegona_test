/**
 * Configuration types and interfaces for the LayerZero Log Reader
 * 
 * This module defines all configuration-related types used throughout the library.
 * 
 * @module types/config
 */

/**
 * Network configuration for connecting to an Ethereum network
 * 
 * @property rpcEndpoint - The RPC endpoint URL for the Ethereum network
 * @property chainId - The chain ID of the network (e.g., 1 for mainnet, 5 for Goerli)
 * @property timeout - Optional timeout in milliseconds for network operations (default: 30000)
 */
export interface NetworkConfig {
  rpcEndpoint: string;
  chainId: number;
  timeout?: number;
}

/**
 * Configuration for a smart contract
 * 
 * @property address - The contract address (0x-prefixed hex string)
 * @property abiPath - Path to the contract ABI JSON file
 */
export interface ContractConfig {
  address: string;
  abiPath: string;
}

/**
 * Configuration for log querying behavior
 * 
 * @property defaultBlockRange - Default number of blocks to query if not specified (default: 1000)
 * @property maxBlockRange - Maximum number of blocks per query before batching (default: 10000)
 * @property batchSize - Number of blocks per batch when splitting large queries (default: 2000)
 */
export interface QueryConfig {
  defaultBlockRange: number;
  maxBlockRange: number;
  batchSize: number;
}

/**
 * Complete configuration for the LogReader
 * 
 * @property network - Network connection configuration
 * @property contracts - Map of contract names to their configurations
 * @property query - Query behavior configuration
 * @property logLevel - Optional logging level (default: 'info')
 */
export interface LogReaderConfig {
  network: NetworkConfig;
  contracts: Record<string, ContractConfig>;
  query: QueryConfig;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Result of configuration validation
 * 
 * @property valid - Whether the configuration is valid
 * @property errors - Array of validation error messages (empty if valid)
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
