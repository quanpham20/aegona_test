/**
 * Simple LayerZero Log Reader
 * A minimal script to read logs from LayerZero contracts on Ethereum
 */

import { ethers } from 'ethers';

// LayerZero Endpoint on Ethereum Mainnet
const LAYERZERO_ENDPOINT = '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675';

// Minimal ABI for reading events
const ENDPOINT_ABI = [
  'event PacketSent(bytes encodedPayload, bytes options, address sendLibrary)',
  'event PacketReceived(uint16 srcChainId, bytes srcAddress, address dstAddress, uint64 nonce, bytes32 payloadHash)',
];

/**
 * Read LayerZero logs from Ethereum
 */
export async function readLayerZeroLogs(
  rpcUrl: string,
  fromBlock: number,
  toBlock: number | 'latest' = 'latest'
) {
  // Connect to Ethereum
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create contract interface
  const contract = new ethers.Contract(LAYERZERO_ENDPOINT, ENDPOINT_ABI, provider);
  
  console.log(`Reading logs from block ${fromBlock} to ${toBlock}...`);
  
  // Query PacketSent events
  const sentFilter = contract.filters['PacketSent']!();
  const sentEvents = await contract.queryFilter(sentFilter, fromBlock, toBlock);
  
  console.log(`\nFound ${sentEvents.length} PacketSent events:`);
  sentEvents.forEach((event, i) => {
    console.log(`\n[${i + 1}] Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
    if ('args' in event) {
      console.log(`    Send Library: ${event.args['sendLibrary']}`);
    }
  });
  
  // Query PacketReceived events
  const receivedFilter = contract.filters['PacketReceived']!();
  const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock, toBlock);
  
  console.log(`\n\nFound ${receivedEvents.length} PacketReceived events:`);
  receivedEvents.forEach((event, i) => {
    console.log(`\n[${i + 1}] Block: ${event.blockNumber}, Tx: ${event.transactionHash}`);
    if ('args' in event) {
      console.log(`    Source Chain: ${event.args['srcChainId']}`);
      console.log(`    Destination: ${event.args['dstAddress']}`);
      console.log(`    Nonce: ${event.args['nonce']?.toString()}`);
    }
  });
  
  return {
    sent: sentEvents,
    received: receivedEvents,
  };
}
