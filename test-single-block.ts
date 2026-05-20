/**
 * Test single block to verify contract and event
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const CONTRACT_ADDRESS = '0xd6b6a6701303B5Ea36fa0eDf7389b562d8F894DB';
const TEST_BLOCK = 263125325;
const RPC_URL = 'https://arbitrum-mainnet.infura.io/v3/c50a354bc7ba4a13a2426d32a918e9c1';

async function testBlock() {
  console.log('Testing single block...');
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Block: ${TEST_BLOCK}`);
  console.log(`RPC: ${RPC_URL}\n`);
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const abi = JSON.parse(readFileSync('./ABI.json', 'utf-8'));
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  // Test 1: Check if contract exists
  console.log('1. Checking if contract exists...');
  try {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ Contract does not exist at this address!');
      return;
    }
    console.log('✅ Contract exists\n');
  } catch (error) {
    console.log('❌ Error checking contract:', error);
    return;
  }
  
  // Test 2: Check block exists
  console.log('2. Checking if block exists...');
  try {
    const block = await provider.getBlock(TEST_BLOCK);
    if (!block) {
      console.log('❌ Block does not exist!');
      return;
    }
    console.log(`✅ Block exists: ${block.number} (${new Date(block.timestamp * 1000).toISOString()})\n`);
  } catch (error) {
    console.log('❌ Error checking block:', error);
    return;
  }
  
  // Test 3: Query Claim events around this block
  console.log('3. Querying Claim events...');
  const fromBlock = TEST_BLOCK - 100;
  const toBlock = TEST_BLOCK + 100;
  
  try {
    const filter = contract.filters['Claim']!();
    console.log(`   Querying blocks ${fromBlock} to ${toBlock}...`);
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    console.log(`   Found ${events.length} Claim events\n`);
    
    if (events.length > 0) {
      console.log('✅ Events found! Details:');
      events.forEach((event, i) => {
        console.log(`\n[Event ${i + 1}]`);
        console.log(`  Block: ${event.blockNumber}`);
        console.log(`  Tx: ${event.transactionHash}`);
        if ('args' in event) {
          console.log(`  Claimer: ${event.args['claimer']}`);
          console.log(`  Expected: ${ethers.formatEther(event.args['expectedAmount'])} ZRO`);
          console.log(`  Actual: ${ethers.formatEther(event.args['actualAmount'])} ZRO`);
          console.log(`  To: ${event.args['to']}`);
        }
      });
    } else {
      console.log('❌ No Claim events found in this range');
    }
  } catch (error) {
    console.log('❌ Error querying events:', error);
  }
  
  // Test 4: Try getting all logs with topic
  console.log('\n4. Trying raw eth_getLogs with topic...');
  try {
    const topic = '0xb6fe5ce185a3773d47e919f57c7edfd102c91cb7833b2be405c4de89d9980fd7';
    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: [topic],
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    
    console.log(`   Found ${logs.length} raw logs with Claim topic\n`);
    
    if (logs.length > 0) {
      console.log('✅ Raw logs found!');
      logs.forEach((log, i) => {
        console.log(`\n[Log ${i + 1}]`);
        console.log(`  Block: ${log.blockNumber}`);
        console.log(`  Tx: ${log.transactionHash}`);
        console.log(`  Topics: ${log.topics.length}`);
        console.log(`  Data: ${log.data.substring(0, 66)}...`);
      });
    }
  } catch (error) {
    console.log('❌ Error with raw logs:', error);
  }
}

testBlock().catch(console.error);
