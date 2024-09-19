'use client'

import { createSmartAccountClient } from 'permissionless'
import { sepolia } from 'viem/chains'
import {
  encodePacked,
  http,
  encodeFunctionData,
  parseAbi,
  createWalletClient,
  createPublicClient,
  custom,
  encodeAbiParameters,
  parseAbiParameters
} from 'viem'
import { erc7579Actions } from 'permissionless/actions/erc7579'
import { privateKeyToAccount } from 'viem/accounts'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { toSafeSmartAccount } from 'permissionless/accounts'
import { useEffect, useState } from 'react'

export default function Home () {
  const [safeAccount, setSafeAccount] = useState(null)
  const [smartAccountClient, setSmartAccountClient] = useState(null)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null)
  const [executorAddress, setExecutorAddress] = useState<string | null>(null)
  const [safeAddress, setSafeAddress] = useState<string | null>(null)
  const [isSafeDeployed, setIsSafeDeployed] = useState(false)
  const [isModuleInstalled, setIsModuleInstalled] = useState(false)

  // The module we will use is deployed as a smart contract on Sepolia:
  const ownableExecutorModule = '0xc98B026383885F41d9a995f85FC480E9bb8bB891'

  // We create a wallet client to connect to MetaMask:
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum!)
  })

  //  Make sure to add your own API key to the Pimlico URL:
  const pimlicoUrl =
    'https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_nP3hDrTjXZjYyK34ZgugCk'

  // The Pimlico client is used as a paymaster:
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    chain: sepolia
  })

  // We will use two accounts for this example:
  // owner2 is the account that will be added as an owner to the smart account via the module.
  // Both accounts are created from private keys. Make sure to replace them with your own private keys.
  // These are the private keys of anvil, don't use them in production, don't send any real funds to these accounts.

  const owner2 = privateKeyToAccount(
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  )

  // These functions will be filled with code in the following steps:

  const checkAddresses = async () => {
    const addresses = await walletClient.getAddresses()
    setOwnerAddress(addresses[0])
    setExecutorAddress(addresses[1])
    if (addresses.length >= 2) {
      init()
    }
  }

  useEffect(() => {
    checkAddresses()
  }, [])

  const init = async () => {
    // The public client is required for the safe account creation:
    const publicClient = createPublicClient({
      transport: http('https://rpc.ankr.com/eth_sepolia'),
      chain: sepolia
    })

    // The safe account is created using the public client:
    const safeAccount = await toSafeSmartAccount({
      client: publicClient,
      owners: [walletClient],
      version: '1.4.1',
      chain: sepolia,
      // These modules are required for the 7579 functionality:
      safe4337ModuleAddress: '0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2', // These are not meant to be used in production as of now.
      erc7579LaunchpadAddress: '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE' // These are not meant to be used in production as of now.
    })

    setSafeAddress(safeAccount.address)
    setIsSafeDeployed(await safeAccount.isDeployed())

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

    const isModuleInstalled = await smartAccountClient.isModuleInstalled({
      address: ownableExecutorModule,
      type: 'executor',
      context: '0x'
    })

    setIsModuleInstalled(isModuleInstalled)

    // We store the clients in the state to use them in the following steps:
    setSafeAccount(safeAccount)
    setSmartAccountClient(smartAccountClient)

    console.log('setup done')
  }

  const connectWallets = async () => {
    await walletClient.requestAddresses()
    checkAddresses()
  }

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

    setIsModuleInstalled(true)
    setIsSafeDeployed(await safeAccount?.isDeployed())
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

  const uninstallModule = async () => {
    console.log('Uninstalling module...')

    // To uninstall the module, use the `uninstallModule`.
    // You have to pack the abi parameter yourself:
    // - previousEntry (address): The address of the previous entry in the module sentinel list.
    // - deInitData (bytes): The data that is passed to the deInit function of the module.
    // As this is the only module, the previous entry is the sentinel address 0x1. The deInitData is empty for the
    // OwnableExecutor.
    const userOp = await smartAccountClient.uninstallModule({
      type: 'executor',
      address: ownableExecutorModule,
      context: encodeAbiParameters(
        parseAbiParameters('address prevEntry, bytes memory deInitData'),
        ['0x0000000000000000000000000000000000000001', '0x']
      )
    })

    console.log('User operation:', userOp, '\nwaiting for tx receipt...')

    // We wait for the transaction to be settled:
    const receipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOp
    })

    console.log('Module uninstalled, tx receipt:', receipt)
  }

  if (!ownerAddress || !executorAddress) {
    return (
      <div className='card'>
        <div className='title'>Connect Wallets</div>
        <div>
          Please ensure to connect with two accounts to this site. The second
          account needs to have some Sepolia Eth for gas. If you accidentally
          connected with only one account, please disconnect the account in
          MetaMask and reconnect both accounts.
        </div>
        <button onClick={connectWallets}>Connect Wallet</button>
      </div>
    )
  }

  if (!isModuleInstalled) {
    return (
      <div className='card'>
        <div className='title'>Install Module</div>
        <div>
          Your Safe has the address {safeAddress} and is{' '}
          {isSafeDeployed ? 'deployed' : 'not yet deployed'}.
          {!isSafeDeployed &&
            'It will be deployed with your first transaction, when you install the module.'}
        </div>
        <div>
          You can now install the module. MetaMask will ask you to sign a
          message after clicking the button.
        </div>
        <button onClick={installModule}>Install Module</button>
      </div>
    )
  }

  return (
    <div className='card'>
      <div className='title'>Safe 7579 Module</div>
      {safeAddress && <pre>Safe Address: {safeAddress}</pre>}
      {isSafeDeployed ? (
        <div>☑️ Safe is deployed</div>
      ) : (
        <div>🔘 Safe is not deployed</div>
      )}
      {isModuleInstalled ? (
        <div>☑️ Module is installed</div>
      ) : (
        <div>🔘 Module is not installed</div>
      )}
      <button onClick={installModule}>Install Module</button>
      <button onClick={executeOnOwnedAccount}>Execute on owned account</button>
      <button onClick={addOwner}>Add Owner</button>
      <button onClick={uninstallModule}>Uninstall Module</button>
    </div>
  )
}
