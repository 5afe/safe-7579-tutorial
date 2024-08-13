import {
  getSocialRecoveryValidator,
  getAddSocialRecoveryGuardianAction,
  getSocialRecoveryGuardians,
  getAccount,
  SOCIAL_RECOVERY_ADDRESS
} from '@rhinestone/module-sdk'
import { AbiCoder } from 'ethers'

import { PermissionlessClient, publicClient } from './permissionless'
export interface SocialRecoveryDataInput {
  guardians: `0x${string}`[]
  threshold: number
}

export const install7579Module = async (
  safe: PermissionlessClient,
  socialRecoveryInput: SocialRecoveryDataInput
) => {
  const socialRecoveryValidator =
    getSocialRecoveryValidator(socialRecoveryInput)

  const txHash = await safe.installModule({
    type: 'validator',
    address: SOCIAL_RECOVERY_ADDRESS,
    context: socialRecoveryValidator.initData as `0x${string}`
  })

  console.log(
    'Social Recovery module is being installed: https://sepolia.etherscan.io/tx/' +
      txHash
  )

  return txHash
}

export const getGuardians = async (safe: PermissionlessClient) => {
  const account = getAccount({ address: safe.account.address, type: 'safe' })
  const guardians = await getSocialRecoveryGuardians({
    account,
    client: publicClient
  }) as `0x${string}`[]
  return guardians
}

export const addGuardian = async (
  safe: PermissionlessClient,
  guardian: `0x${string}`
) => {
  const addGuardianData = getAddSocialRecoveryGuardianAction({ guardian })
  const txHash = await safe.sendTransaction({
    to: addGuardianData.target,
    value: addGuardianData.value as bigint,
    data: addGuardianData.callData
  })

  console.log(
    'Guardian is being added: https://sepolia.etherscan.io/tx/' + txHash
  )
  return txHash
}

export const getUserOpHash = async (safe: PermissionlessClient) => {
  // const abiCoder = new AbiCoder()
  // const packedData = abiCoder.encode(
  //   [
  //     'address',
  //     'uint256',
  //     'bytes32',
  //     'bytes32',
  //     'uint256',
  //     'uint256',
  //     'uint256',
  //     'uint256',
  //     'uint256',
  //     'bytes32'
  //   ],
  //   [
  //     safe.account.address,
  //     0,
  //     ethers.utils.keccak256(initCode),
  //     ethers.utils.keccak256(callData),
  //     callGasLimit,
  //     verificationGasLimit,
  //     preVerificationGas,
  //     maxFeePerGas,
  //     maxPriorityFeePerGas,
  //     ethers.utils.keccak256(paymasterAndData)
  //   ]
  // )

  // const enc = abiCoder.encode(
  //   ['bytes32', 'address', 'uint256'],
  //   [keccak256(packedData), entryPoint, chainId]
  // )

  // const userOpHash = keccak256(enc)
  // return userOpHash
}

// export const scheduleTransfer = async (
//   safe: SafeSmartAccountClient,
//   scheduledTransferInput: ScheduledTransferDataInput
// ) => {
//   const { startDate, repeatEvery, numberOfRepeats, amount, recipient } =
//     scheduledTransferInput
//   const scheduledTransfer = {
//     startDate,
//     repeatEvery,
//     numberOfRepeats,
//     token: {
//       token_address: sepoliaUSDCTokenAddress as `0x${string}`,
//       decimals: 6
//     },
//     amount,
//     recipient
//   }

//   const scheduledTransferData = getCreateScheduledTransferAction({
//     scheduledTransfer
//   })
//   const txHash = await safe.sendTransaction({
//     to: scheduledTransferData.target,
//     value: scheduledTransferData.value as bigint,
//     data: scheduledTransferData.callData
//   })

//   console.log(
//     'Transfer is being scheduled: https://sepolia.etherscan.io/tx/' + txHash
//   )
//   return txHash
// }

// export const executeOrder = async (jobId: number) => {
//   const executeTransfer = getExecuteScheduledTransferAction({ jobId })
//   console.log(executeTransfer)
//   return executeTransfer
// }
