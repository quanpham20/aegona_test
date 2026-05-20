/**
 * LayerZero Log Reader
 * 
 * A TypeScript library for querying and parsing LayerZero event logs from Ethereum.
 * 
 * @packageDocumentation
 */

// Simple reader - main functionality
export { readLayerZeroLogs } from './simple-reader';

// Configuration types
export type {
  NetworkConfig,
  ContractConfig,
  QueryConfig,
  LogReaderConfig,
  ValidationResult,
} from './types/config';

// Configuration loader
export {
  loadConfig,
  loadConfigFromFile,
  loadConfigFromEnv,
  applyDefaults,
} from './config/loader';

// Configuration validator
export {
  validateConfig,
  validateMultipleConfigs,
  isValidAddress,
  isValidRpcEndpoint,
  validateBlockRanges,
  validateBatchSize,
  validateTimeout,
  validateChainId,
} from './config/validator';

// Error classes
export {
  LogReaderError,
  NetworkError,
  ContractError,
  ConfigurationError,
  ParsingError,
} from './types/errors';
