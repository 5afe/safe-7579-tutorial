'use client'

import { createSmartAccountClient } from 'permissionless'
import { sepolia } from 'viem/chains'
import { encodePacked, http, encodeFunctionData, parseAbi } from 'viem'
import { erc7579Actions } from 'permissionless/actions/erc7579'
import { createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { toSafeSmartAccount } from 'permissionless/accounts'
import { useEffect, useState } from 'react'

export default function Home () {
  const [safeAccount, setSafeAccount] = useState(null)
  const [pimlicoClient, setPimlicoClient] = useState(null)
  const [smartAccountClient, setSmartAccountClient] = useState(null)

  // The module we will use is deployed as a smart contract on Sepolia:
  const ownableExecutorModule = '0xc98B026383885F41d9a995f85FC480E9bb8bB891'

  //  Make sure to add your own API key to the Pimlico URL:
  const pimlicoUrl =
    'https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY'

  // We will use two accounts for this example:
  // owner is the account that owns the smart account and will install the module.
  // owner2 is the account that will be added as an owner to the smart account via the module.
  // Both accounts are created from private keys. Make sure to replace them with your own private keys.
  // These are the private keys of anvil, don't use them in production, don't send any real funds to these accounts.
  const owner = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  )

  const owner2 = privateKeyToAccount(
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  )

  // These functions will be filled with code in the following steps:

  useEffect(() => {
    const init = async () => {
      // The public client by viem is used as a transport layer:
      const publicClient = createPublicClient({
        transport: http('https://rpc.ankr.com/eth_sepolia'),
        chain: sepolia
      })

      // The safe account is created using the public client:
      const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [owner],
        version: '1.4.1',
        chain: sepolia,
        // These modules are required for the 7579 functionality:
        safe4337ModuleAddress: '0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2', // These are not meant to be used in production as of now.
        erc7579LaunchpadAddress: '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE' // These are not meant to be used in production as of now.
      })

      // The Pimlico client is used as a paymaster:
      const pimlicoClient = createPimlicoClient({
        transport: http(pimlicoUrl),
        chain: sepolia
      })

      // Finally, we create the smart account client, which provides functionality to interact with the smart account:
      const smartAccountClient = createSmartAccountClient({
        account: safeAccount,
        chain: sepolia,
        bundlerTransport: http(pimlicoUrl),
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast
          }
        }
      }).extend(erc7579Actions())

      // We store the clients in the state to use them in the following steps:
      setSafeAccount(safeAccount)
      setPimlicoClient(pimlicoClient)
      setSmartAccountClient(smartAccountClient)

      console.log('setup done')
    }

    init()
  }, [])

  const installModule = async () => {
    console.log('Installing module...')

    // The smart accounts client operates on 4337. It does not send transactions directly but instead creates user
    // operations. The Pimlico bundler takes those user operations and sends them to the blockchain as regular
    // transactions. We also use the Pimlico paymaster to sponsor the transaction. So, all interactions are free
    // on Sepolia.
    const userOpHash = await smartAccountClient.installModule({
      type: 'executor',
      address: ownableExecutorModule,
      context: encodePacked(['address'], [owner2.address])
    })

    console.log('User operation hash:', userOpHash, '\nwaiting for receipt...')

    // After we sent the user operation, we wait for the transaction to be settled:
    const transactionReceipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOpHash
    })

    console.log('Module installed:', transactionReceipt)
  }

  const executeOnOwnedAccount = async () => {
    console.log('Executing on owned account...')

    // We create a wallet client for the owner2 account. This client is used to send transactions on behalf of the
    // owner2. This transaction is sent as a regular transaction, so it is not free. Make sure owner2 owns enough funds
    // to pay for gas.
    const walletClient = createWalletClient({
      account: owner2,
      transport: http('https://rpc.ankr.com/eth_sepolia'),
      chain: sepolia
    })

    console.log('wallet client', walletClient)

    // We encode the transaction we want the smart account to send. The fields are:
    // - to (address)
    // - value (uint256)
    // - data (bytes)
    // In this example case, it is a dummy transaction with zero data.
    const executeOnOwnedAccountData = encodePacked(
      ['address', 'uint256', 'bytes'],
      ['0xa6d3DEBAAB2B8093e69109f23A75501F864F74e2', 0n, '0x']
    )

    // Now, we call the `executeOnOwnedAccount` function of the `ownableExecutorModule` with the address of the safe
    // account and the data we want to execute. This will make our smart account send the transaction that is encoded above.
    const hash = await walletClient.writeContract({
      abi: parseAbi(['function executeOnOwnedAccount(address, bytes)']),
      functionName: 'executeOnOwnedAccount',
      args: [safeAccount?.address, executeOnOwnedAccountData],
      address: ownableExecutorModule
    })

    console.log('Executed on owned account, transaction hash:', hash)
  }

  const addOwner = async () => {
    console.log('Adding owner...')

    // The addOwner function is part of the OwnableExecutorModule. We encode the function data using the viem library:
    const addOwnerData = encodeFunctionData({
      abi: parseAbi(['function addOwner(address)']),
      functionName: 'addOwner',
      args: ['0x90F79bf6EB2c4f870365E785982E1f101E93b906']
    })

    // We use the smart account client to send the user operation: In this call, our smart account calls the `addOwner`
    // function at the `ownableExecutorModule` with the new owner's address.
    const userOp = await smartAccountClient.sendUserOperation({
      calls: [{ to: ownableExecutorModule, value: 0, data: addOwnerData }]
    })

    console.log('User operation:', userOp, '\nwaiting for tx receipt...')

    // Again, we wait for the transaction to be settled:
    const receipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOp
    })

    console.log('Owner added, tx receipt:', receipt)
  }

  return (
    <div className='card'>
      <div className='title'>Safe 7579 Module</div>
      <button onClick={installModule}>Install Module</button>
      <button onClick={executeOnOwnedAccount}>Execute on owned account</button>
      <button onClick={addOwner}>Add Owner</button>
    </div>
  )
}
