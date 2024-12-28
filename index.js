import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import cron from 'node-cron';

const network = 'devnet';
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
const keypair = Ed25519Keypair.fromSecretKey('');

async function mintGGCoin() {
  const tx = new Transaction();
  tx.setGasBudget(10000000);

  tx.moveCall({
    package: '0x44a9044b081c1fbf3328dccbb450bbfcad14d81151de7639d5e52fc8e77988fb', // Replace with your deployed package ID
    module: 'ggcoin',
    function: 'mint',
    arguments: [
      tx.pure.address('0x401e6dec97fbf1da70a274b6b23f60fe2e263bfa80734ed3e936b06b9a9142bc'), // Replace with your TreasuryCap object ID
      tx.pure.u64(1000000000), // Amount to mint
      tx.pure.address(keypair.getPublicKey().toSuiAddress()), // Recipient
    ],
  });

  tx.setSender(keypair.getPublicKey().toSuiAddress());

  try {
    const result = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
    });

    return await suiClient.waitForTransaction({
      digest: result.digest,
      options: {
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
    });
  } catch (error) {
    console.error('Minting error:', error);
    return null;
  }
}

async function monitorGGCoinTransactions() {
  const address = keypair.getPublicKey().toSuiAddress();
  try {
    const transactions = await suiClient.queryTransactionBlocks({
      filter: {
        FromAddress: address
      },
      options: {
        showEffects: true,
        showInput: true
      }
    });
    console.log('GGCoin transactions:', transactions);
  } catch (error) {
    console.error('Monitoring error:', error);
  }
}

cron.schedule('* * * * *', async () => {
  console.log('Monitoring GGCoin transactions...');
  await monitorGGCoinTransactions();
});

(async () => {
  await mintGGCoin();
  await monitorGGCoinTransactions();
})();