import { concat } from 'viem'
import { PrepareUserOperationRequestReturnType } from 'permissionless/actions/smartAccount'
import { ENTRYPOINT_ADDRESS_V07_TYPE } from 'permissionless/types'
import {
  getSocialRecoveryValidator,
  getSocialRecoveryGuardians,
  getAccount,
  installModule
} from '@rhinestone/module-sdk'

import {
  bundlerClient,
  PermissionlessClient,
  publicClient
} from './permissionless'
import { signTransactions } from './safe'
export interface SocialRecoveryDataInput {
  guardians: `0x${string}`[]
  threshold: number
}

export type UserOpRequest = Omit<
  PrepareUserOperationRequestReturnType<ENTRYPOINT_ADDRESS_V07_TYPE>,
  'initCode' | 'paymasterAndData'
>

// Installs the Social Recovery module on the safe
export const install7579Module = async (
  permissionlessClient: PermissionlessClient,
  socialRecoveryInput: SocialRecoveryDataInput,
  accounts: string[]
) => {
  const socialRecoveryValidator =
    getSocialRecoveryValidator(socialRecoveryInput)

  const moduleExecution = await installModule({
    client: publicClient,
    module: socialRecoveryValidator,
    account: getAccount({
      address: permissionlessClient.account.address,
      type: 'safe'
    })
  })
  const installModuleTransactions = moduleExecution.map(execution => ({
    to: execution.target,
    value: execution.value.toString(),
    data: execution.callData
  }))

  const { safeTransaction, signature } = await signTransactions(
    installModuleTransactions,
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

  console.log(
    'Social Recovery module is being installed: https://sepolia.etherscan.io/tx/' +
      txHash
  )

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: txHash,
    timeout: 120000
  })
  return receipt
}

// Gets the guardians of the safe
export const getGuardians = async (
  permissionlessClient: PermissionlessClient
) => {
  const account = getAccount({
    address: permissionlessClient.account.address,
    type: 'safe'
  })
  const guardians = (await getSocialRecoveryGuardians({
    account,
    client: publicClient
  })) as `0x${string}`[]
  return guardians
}

// Recovers the safe by adding the first guardian as a new owner of the safe
export const recoverSafe = async (
  permissionless: PermissionlessClient,
  userOp: UserOpRequest,
  ...signatures: `0x${string}`[]
) => {
  const txHash = await permissionless.sendUserOperation({
    userOperation: {
      ...userOp,
      signature: concat(signatures)
    }
  })
  console.info(
    'Safe is being recovered: https://jiffyscan.xyz/userOpHash/' + txHash
  )
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: txHash,
    timeout: 120000
  })
  return receipt
}
