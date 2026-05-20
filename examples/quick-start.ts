/**
 * Quick Start Example - Read LayerZero Logs
 * 
 * Usage:
 *   yarn build
 *   node dist/examples/quick-start.js
 */

import { readLayerZeroLogs } from '../src/simple-reader';

async function main() {
  // Your RPC endpoint (replace with your own)
  const RPC_URL = process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
  
  // Read logs from recent blocks (last 1000 blocks)
  const currentBlock = 19000000; // You can get current block dynamically
  const fromBlock = currentBlock - 1000;
  
  console.log('=== LayerZero Log Reader ===\n');
  console.log(`RPC: ${RPC_URL}`);
  console.log(`Reading from block ${fromBlock} to ${currentBlock}\n`);
  
  try {
    const logs = await readLayerZeroLogs(RPC_URL, fromBlock, currentBlock);
    
    console.log('\n=== Summary ===');
    console.log(`Total PacketSent: ${logs.sent.length}`);
    console.log(`Total PacketReceived: ${logs.received.length}`);
  } catch (error) {
    console.error('Error reading logs:', error);
  }
}

main();
