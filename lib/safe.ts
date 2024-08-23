import Safe, {
  EthSafeSignature,
  EthSafeTransaction
} from '@safe-global/protocol-kit'

import { bundlerClient, PermissionlessClient } from './permissionless'

// Fetches onchain data about the safe (owners and whether it was deployed)
export const getSafeData = async (
  safeAddress: string
): Promise<{ isDeployed: boolean; owners: string[] }> => {
  const protocolKit = await Safe.init({
    // @ts-ignore
    provider: window.ethereum,
    safeAddress
  }).catch(err => {
    console.warn(err)
  })

  if (!protocolKit) return { isDeployed: false, owners: [] }
  const isDeployed = await protocolKit.isSafeDeployed()
  const owners = await protocolKit.getOwners()
  return { isDeployed, owners }
}

// Deploys a Safe by sending a dummy transaction
export const deploySafe = async (
  permissionlessClient: PermissionlessClient,
  accounts: string[]
) => {
  const dummyTransaction = {
    to: permissionlessClient.account.address,
    value: '0',
    data: '0x' as `0x${string}`
  }

  const { signature, safeTransaction } = await signTransactions(
    [dummyTransaction],
    accounts[0]
  )

  const txHash = await permissionlessClient.sendUserOperation({
    account: permissionlessClient.account,
    userOperation: {
      sender: permissionlessClient.account.address,
      callData: safeTransaction.data.data as `0x${string}`,
      signature: signature.data as `0x${string}`
    }
  })

  if (txHash == undefined) return
  console.info(
    'Safe is being deployed: https://jiffyscan.xyz/userOpHash/' + txHash
  )
  return await bundlerClient.waitForUserOperationReceipt({
    hash: txHash,
    timeout: 120000
  })
}

export const signTransactions = async (
  transactions: Array<{
    to: `0x${string}`
    value: string
    data: `0x${string}`
  }>,
  account: string
): Promise<{
  signature: EthSafeSignature
  safeTransaction: EthSafeTransaction
}> => {
  const protocolKit = await Safe.init({
    // @ts-ignore
    provider: window.ethereum,
    // @ts-ignore
    signer: account,
    predictedSafe: {
      safeAccountConfig: {
        // @ts-ignore
        owners: [account],
        threshold: 1
      }
    }
  })

  let safeTransaction = await protocolKit.createTransaction({
    transactions
  })
  safeTransaction = await protocolKit.signTransaction(safeTransaction)

  const signature = safeTransaction.getSignature(account) as EthSafeSignature
  return { safeTransaction, signature }
}
