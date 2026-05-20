/**
 * Example: Loading configuration for LayerZero Log Reader
 * 
 * This example demonstrates how to load configuration from JSON files
 * or environment variables.
 */

import { loadConfig, loadConfigFromFile, loadConfigFromEnv } from '../src/index';

// Example 1: Load from JSON file
console.log('Example 1: Loading from JSON file');
try {
  const config = loadConfigFromFile('./examples/sample-config.json');
  console.log('Configuration loaded successfully:');
  console.log(JSON.stringify(config, null, 2));
} catch (error) {
  console.error('Failed to load config from file:', error);
}

// Example 2: Load from environment variables
console.log('\nExample 2: Loading from environment variables');
try {
  // Set environment variables (in practice, these would be set in your shell or .env file)
  process.env.LZ_RPC_ENDPOINT = 'https://eth-mainnet.g.alchemy.com/v2/your-api-key';
  process.env.LZ_CHAIN_ID = '1';
  process.env.LZ_LOG_LEVEL = 'debug';
  
  const config = loadConfigFromEnv();
  console.log('Configuration loaded from environment:');
  console.log(JSON.stringify(config, null, 2));
} catch (error) {
  console.error('Failed to load config from environment:', error);
}

// Example 3: Using the unified loadConfig function
console.log('\nExample 3: Using loadConfig (auto-detects source)');
try {
  // If you provide a file path, it loads from file
  const fileConfig = loadConfig('./examples/sample-config.json');
  console.log('Loaded from file via loadConfig');
  
  // If you don't provide a path, it loads from environment
  const envConfig = loadConfig();
  console.log('Loaded from environment via loadConfig');
} catch (error) {
  console.error('Failed to load config:', error);
}
