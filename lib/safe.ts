import Safe from '@safe-global/protocol-kit'
import { parseEther, encodeFunctionData } from 'viem'
import { PermissionlessClient } from './permissionless'

export const rpcUrl = 'https://rpc.ankr.com/eth_sepolia'

export const isSafeDeployed = async (
  safeAddress: string
): Promise<boolean | null> => {
  const protocolKit = await Safe.init({
    // @ts-ignore
    provider: rpcUrl,
    signer: process.env.NEXT_PUBLIC_PRIVATE_KEY,
    safeAddress
  }).catch(err => {
    console.error(err)
  })
  return protocolKit ? await protocolKit.isSafeDeployed() : null
}

const NFT_ADDRESS = '0xBb9ebb7b8Ee75CDBf64e5cE124731A89c2BC4A07'

export const deploySafe = async (
  permissionlessClient: PermissionlessClient
) => {
  // To deploy the Safe we will simply send a dummy transaction.
  // Her we mint an NFT, but any transaction would work:
  const nftTransaction = {
    to: NFT_ADDRESS,
    value: parseEther('0'),
    data: encodeFunctionData({
      abi: [
        {
          constant: false,
          inputs: [
            {
              name: 'to',
              type: 'address'
            },
            {
              name: 'tokenId',
              type: 'uint256'
            }
          ],
          name: 'safeMint',
          payable: false,
          stateMutability: 'nonpayable',
          type: 'function'
        }
      ],
      functionName: 'safeMint',
      args: [permissionlessClient.account.address, getRandomUint256()]
    })
  }
  const txHash = await permissionlessClient.sendTransaction(nftTransaction)

  return txHash
}

function getRandomUint256 (): bigint {
  const dest = new Uint8Array(32) // Create a typed array capable of storing 32 bytes or 256 bits

  crypto.getRandomValues(dest) // Fill the typed array with cryptographically secure random values

  let result = 0n
  for (let i = 0; i < dest.length; i++) {
    result |= BigInt(dest[i]) << BigInt(8 * i) // Combine individual bytes into one bigint
  }

  return result
}
