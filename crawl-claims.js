"use strict";
/**
 * Crawl Claim events from contract
 * Contract: 0xd6b6a6701303B5Ea36fa0eDf7389b562d8F894DB
 * Event: Claim(address claimer, uint256 expectedAmount, uint256 actualAmount, address to)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const fs_1 = require("fs");
// Contract address
const CONTRACT_ADDRESS = '0xd6b6a6701303B5Ea36fa0eDf7389b562d8F894DB';
// Block range
const FROM_BLOCK = 223776722;
const TO_BLOCK = 263125325;
// Batch size (để tránh RPC limit - giảm xuống vì có nhiều events)
const BATCH_SIZE = 1000;
// Delay giữa các batch (milliseconds)
const DELAY_BETWEEN_BATCHES = 1000; // 1 giây
async function main() {
    // Lấy RPC URL từ environment - ARBITRUM
    const RPC_URL = process.env.RPC_URL || 'https://arb1.arbitrum.io/rpc';
    console.log('=== Crawling Claim Events on ARBITRUM ===\n');
    console.log(`Network: Arbitrum One`);
    console.log(`Contract: ${CONTRACT_ADDRESS}`);
    console.log(`RPC: ${RPC_URL}`);
    console.log(`From Block: ${FROM_BLOCK}`);
    console.log(`To Block: ${TO_BLOCK}`);
    console.log(`Total Blocks: ${TO_BLOCK - FROM_BLOCK}`);
    console.log(`Batch Size: ${BATCH_SIZE}\n`);
    // Connect to Ethereum
    const provider = new ethers_1.ethers.JsonRpcProvider(RPC_URL);
    // Load ABI
    const abi = JSON.parse((0, fs_1.readFileSync)('./ABI.json', 'utf-8'));
    // Create contract interface
    const contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    // Tổng số token đã claim
    let totalExpectedAmount = BigInt(0);
    let totalActualAmount = BigInt(0);
    let totalEvents = 0;
    // Map để track unique claimers
    const claimers = new Map();
    // Crawl theo batch
    const totalBatches = Math.ceil((TO_BLOCK - FROM_BLOCK) / BATCH_SIZE);
    for (let i = 0; i < totalBatches; i++) {
        const batchStart = FROM_BLOCK + (i * BATCH_SIZE);
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, TO_BLOCK);
        console.log(`\n[Batch ${i + 1}/${totalBatches}] Crawling blocks ${batchStart} to ${batchEnd}...`);
        try {
            // Query Claim events
            const filter = contract.filters['Claim']();
            const events = await contract.queryFilter(filter, batchStart, batchEnd);
            console.log(`  Found ${events.length} Claim events`);
            // Process events
            for (const event of events) {
                if ('args' in event) {
                    const claimer = event.args['claimer'];
                    const expectedAmount = event.args['expectedAmount'];
                    const actualAmount = event.args['actualAmount'];
                    const to = event.args['to'];
                    // Cộng vào tổng
                    totalExpectedAmount += expectedAmount;
                    totalActualAmount += actualAmount;
                    totalEvents++;
                    // Track claimer
                    if (claimers.has(claimer)) {
                        const existing = claimers.get(claimer);
                        existing.expectedAmount += expectedAmount;
                        existing.actualAmount += actualAmount;
                        existing.count++;
                    }
                    else {
                        claimers.set(claimer, {
                            expectedAmount,
                            actualAmount,
                            count: 1,
                        });
                    }
                    // Log chi tiết (optional - comment out nếu quá nhiều)
                    // console.log(`    Block ${event.blockNumber}: ${claimer} claimed ${ethers.formatEther(actualAmount)} ZRO`);
                }
            }
            // Delay để tránh rate limit
            console.log(`  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`  Error in batch ${i + 1}:`, errorMsg);
            if (errorMsg.includes('Too Many Requests')) {
                console.log(`  Rate limited! Waiting 10 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                i--;
                continue;
            }
            if (errorMsg.includes('more than 10000 results') || errorMsg.includes('query returned more than')) {
                console.log(`  Too many results in this batch! Splitting into smaller batches...`);
                const subBatchSize = Math.floor(BATCH_SIZE / 5);
                for (let j = 0; j < 5; j++) {
                    const subStart = batchStart + (j * subBatchSize);
                    const subEnd = Math.min(subStart + subBatchSize - 1, batchEnd);
                    try {
                        console.log(`    Sub-batch ${j + 1}/5: blocks ${subStart} to ${subEnd}...`);
                        const subFilter = contract.filters['Claim']();
                        const subEvents = await contract.queryFilter(subFilter, subStart, subEnd);
                        console.log(`    Found ${subEvents.length} events`);
                        for (const event of subEvents) {
                            if ('args' in event) {
                                const claimer = event.args['claimer'];
                                const expectedAmount = event.args['expectedAmount'];
                                const actualAmount = event.args['actualAmount'];
                                totalExpectedAmount += expectedAmount;
                                totalActualAmount += actualAmount;
                                totalEvents++;
                                if (claimers.has(claimer)) {
                                    const existing = claimers.get(claimer);
                                    existing.expectedAmount += expectedAmount;
                                    existing.actualAmount += actualAmount;
                                    existing.count++;
                                }
                                else {
                                    claimers.set(claimer, { expectedAmount, actualAmount, count: 1 });
                                }
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    catch (subError) {
                        console.error(`    Sub-batch ${j + 1} error:`, subError instanceof Error ? subError.message : subError);
                    }
                }
                continue;
            }
            // Lỗi khác thì skip
            continue;
        }
    }
    // In kết quả
    console.log('\n\n=== SUMMARY ===\n');
    console.log(`Total Claim Events: ${totalEvents}`);
    console.log(`Unique Claimers: ${claimers.size}`);
    console.log(`\nTotal Expected Amount: ${ethers_1.ethers.formatEther(totalExpectedAmount)} ZRO`);
    console.log(`Total Actual Amount: ${ethers_1.ethers.formatEther(totalActualAmount)} ZRO`);
    console.log(`\nTotal Expected Amount (wei): ${totalExpectedAmount.toString()}`);
    console.log(`Total Actual Amount (wei): ${totalActualAmount.toString()}`);
    // Top 10 claimers
    console.log('\n\n=== TOP 10 CLAIMERS ===\n');
    const sortedClaimers = Array.from(claimers.entries())
        .sort((a, b) => Number(b[1].actualAmount - a[1].actualAmount))
        .slice(0, 10);
    sortedClaimers.forEach(([address, data], index) => {
        console.log(`${index + 1}. ${address}`);
        console.log(`   Claimed: ${ethers_1.ethers.formatEther(data.actualAmount)} ZRO`);
        console.log(`   Times: ${data.count}`);
    });
    // Save to file
    const result = {
        summary: {
            totalEvents,
            uniqueClaimers: claimers.size,
            totalExpectedAmount: totalExpectedAmount.toString(),
            totalActualAmount: totalActualAmount.toString(),
            totalExpectedAmountEther: ethers_1.ethers.formatEther(totalExpectedAmount),
            totalActualAmountEther: ethers_1.ethers.formatEther(totalActualAmount),
        },
        claimers: Array.from(claimers.entries()).map(([address, data]) => ({
            address,
            expectedAmount: data.expectedAmount.toString(),
            actualAmount: data.actualAmount.toString(),
            expectedAmountEther: ethers_1.ethers.formatEther(data.expectedAmount),
            actualAmountEther: ethers_1.ethers.formatEther(data.actualAmount),
            claimCount: data.count,
        })),
    };
    const fs = require('fs');
    fs.writeFileSync('claim-results.json', JSON.stringify(result, null, 2));
    console.log('\n\nResults saved to claim-results.json');
}
main().catch(console.error);
