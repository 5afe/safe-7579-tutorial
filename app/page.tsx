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
  parseAbiParameters,
  Transport,
  HttpTransport,
  Client
} from 'viem'
import { Erc7579Actions, erc7579Actions } from 'permissionless/actions/erc7579'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import {
  toSafeSmartAccount,
  ToSafeSmartAccountReturnType
} from 'permissionless/accounts'
import { useEffect, useState } from 'react'
import truncateEthAddress from 'truncate-eth-address'
import { SendUserOperationParameters } from 'viem/account-abstraction'

export default function Home () {
  const [safeAccount, setSafeAccount] =
    useState<ToSafeSmartAccountReturnType<'0.7'> | null>(null)
  const [smartAccountClient, setSmartAccountClient] = useState<
    | (Client<HttpTransport, typeof sepolia> &
        Erc7579Actions<ToSafeSmartAccountReturnType<'0.7'>> & {
          sendUserOperation: (
            params: SendUserOperationParameters
          ) => Promise<string>
        })
    | null
  >(null)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null)
  const [executorAddress, setExecutorAddress] = useState<string | null>(null)
  const [safeAddress, setSafeAddress] = useState<string | null>(null)
  const [safeIsDeployed, setSafeIsDeployed] = useState(false)
  const [moduleIsInstalled, setModuleIsInstalled] = useState(false)
  const [executorTransactionIsSent, setExecutorTransactionIsSent] =
    useState(false)
  const [ownerIsAdded, setOwnerIsAdded] = useState(false)
  const [moduleIsUninstalled, setModuleIsUninstalled] = useState(false)
  const [loading, setLoading] = useState(false)

  // The module we will use is deployed as a smart contract on Sepolia:
  const ownableExecutorModule = '0xc98B026383885F41d9a995f85FC480E9bb8bB891'

  // We create a wallet client to connect to MetaMask:
  const walletClient = createWalletClient<
    Transport,
    typeof sepolia,
    `0x${string}`
  >({
    chain: sepolia,
    transport: custom(window.ethereum!)
  })

  //  TODO: Make sure to add your own API key to the Pimlico URL:
  const pimlicoUrl =
    'https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY'

  // The Pimlico client is used as a paymaster:
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    chain: sepolia
  })

  // Check for connected accounts on page load:
  useEffect(() => {
    checkAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check whether the user has connected two accounts, without MetaMask popping up:
  const checkAddresses = async () => {
    const addresses = await walletClient.getAddresses()
    setOwnerAddress(addresses[0])
    setExecutorAddress(addresses[1])
    if (addresses.length >= 2) {
      init()
    }
  }

  const connectWallets = async () => {
    // Only at the request address call, MetaMask will pop up and ask the user to connect:
    await walletClient.requestAddresses()
    checkAddresses()
  }

  // The public client is required for the safe account creation:
  const publicClient = createPublicClient({
    transport: http('https://rpc.ankr.com/eth_sepolia'),
    chain: sepolia
  })

  // The following functions will be filled with code in the following steps:

  const init = async () => {
    // The safe account is created using the public client:
    const safeAccount = await toSafeSmartAccount<
      '0.7',
      '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE'
    >({
      client: publicClient,
      owners: [walletClient],
      version: '1.4.1',
      // These modules are required for the 7579 functionality:
      safe4337ModuleAddress: '0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2', // These are not meant to be used in production as of now.
      erc7579LaunchpadAddress: '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE' // These are not meant to be used in production as of now.
    })

    setSafeAddress(safeAccount.address)
    setSafeIsDeployed(await safeAccount.isDeployed())

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

    // Check whether the module has been installed already:
    const isModuleInstalled = await smartAccountClient.isModuleInstalled({
      address: ownableExecutorModule,
      type: 'executor',
      context: '0x'
    })

    setModuleIsInstalled(isModuleInstalled)

    // We store the clients in the state to use them in the following steps:
    setSafeAccount(safeAccount)
    setSmartAccountClient(smartAccountClient)

    console.log('setup done')
  }

  const installModule = async () => {
    setLoading(true)
    console.log('Installing module...')

    // The smart accounts client operates on 4337. It does not send transactions directly but instead creates user
    // operations. The Pimlico bundler takes those user operations and sends them to the blockchain as regular
    // transactions. We also use the Pimlico paymaster to sponsor the transaction. So, all interactions are free
    // on Sepolia.
    const userOpHash = await smartAccountClient?.installModule({
      type: 'executor',
      address: ownableExecutorModule,
      context: encodePacked(['address'], [executorAddress as `0x${string}`])
    })

    console.log('User operation hash:', userOpHash, '\nwaiting for receipt...')

    // After we sent the user operation, we wait for the transaction to be settled:
    const transactionReceipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOpHash as `0x${string}`
    })

    console.log('Module installed:', transactionReceipt)

    setModuleIsInstalled(true)
    setSafeIsDeployed((await safeAccount?.isDeployed()) ?? false)
    setLoading(false)
  }

  const executeOnOwnedAccount = async () => {
    setLoading(true)
    console.log('Executing on owned account...')

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
      account: executorAddress as `0x${string}`,
      abi: parseAbi(['function executeOnOwnedAccount(address, bytes)']),
      functionName: 'executeOnOwnedAccount',
      args: [safeAddress as `0x${string}`, executeOnOwnedAccountData],
      address: ownableExecutorModule
    })

    console.log('Executed on owned account, transaction hash:', hash)

    await publicClient?.waitForTransactionReceipt({ hash })

    setExecutorTransactionIsSent(true)
    setLoading(false)
  }

  const addOwner = async () => {
    setLoading(true)
    console.log('Adding owner...')

    // The addOwner function is part of the OwnableExecutorModule. We encode the function data using the viem library:
    const addOwnerData = encodeFunctionData({
      abi: parseAbi(['function addOwner(address)']),
      functionName: 'addOwner',
      args: ['0x0000000000000000000000000000000000000002'] // We add 0x2 as the new owner just as an example.
    })

    // We use the smart account client to send the user operation: In this call, our smart account calls the `addOwner`
    // function at the `ownableExecutorModule` with the new owner's address.
    const userOp = await smartAccountClient?.sendUserOperation({
      calls: [{ to: ownableExecutorModule, value: 0n, data: addOwnerData }]
    })

    console.log('User operation:', userOp, '\nwaiting for tx receipt...')

    // Again, we wait for the transaction to be settled:
    const receipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOp as `0x${string}`
    })

    console.log('Owner added, tx receipt:', receipt)
    setOwnerIsAdded(true)
    setLoading(false)
  }

  const uninstallModule = async () => {
    setLoading(true)
    console.log('Uninstalling module...')

    // To uninstall the module, use the `uninstallModule`.
    // You have to pack the abi parameter yourself:
    // - previousEntry (address): The address of the previous entry in the module sentinel list.
    // - deInitData (bytes): The data that is passed to the deInit function of the module.
    // As this is the only module, the previous entry is the sentinel address 0x1. The deInitData is empty for the
    // OwnableExecutor.
    const userOp = await smartAccountClient?.uninstallModule({
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
      hash: userOp as `0x${string}`
    })

    console.log('Module uninstalled, tx receipt:', receipt)
    setModuleIsUninstalled(true)
    setLoading(false)
  }

  // Depending on the state of the tutorial, different cards are displayed:
  // Step 1: Connect Wallets
  if (!ownerAddress || !executorAddress) {
    return (
      <div className='card'>
        <div className='title'>Connect two accounts</div>
        <div>
          Please ensure to connect with two accounts to this site. The second
          account needs to have some Sepolia Eth for gas.
        </div>
        <div className='actions'>
          <button onClick={connectWallets}>Connect Wallet</button>
        </div>
      </div>
    )
  }

  // Step 2: Install Module
  if (!moduleIsInstalled) {
    return (
      <div className='card'>
        <div className='title'>Install Module</div>
        <div>
          Your Safe has the address{' '}
          {safeAddress && truncateEthAddress(safeAddress)} and is{' '}
          {safeIsDeployed ? 'deployed' : 'not yet deployed'}.
          {!safeIsDeployed &&
            'It will be deployed with your first transaction, when you install the module.'}
        </div>
        <div>
          You can now install the module. MetaMask will ask you to sign a
          message with the first account after clicking the button.
        </div>
        <div className='actions'>
          <button
            onClick={installModule}
            className={loading ? 'button--loading' : ''}
          >
            Install Module
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Execute on Owned Account
  if (!executorTransactionIsSent) {
    return (
      <div className='card'>
        <div className='title'>Execute on owned account</div>
        <div>
          You can now execute a transaction on the owned account as the
          executor. In this case, you will send a dummy transaction. But you
          could also claim ownership of the account.
        </div>
        <div>
          When you click the button, Metamask will request a transaction from
          the second account.
        </div>
        <div className='actions'>
          <button
            className='skip'
            onClick={() => {
              setExecutorTransactionIsSent(true)
              setLoading(false)
            }}
          >
            Skip
          </button>
          <button
            onClick={executeOnOwnedAccount}
            className={loading ? 'button--loading' : ''}
          >
            Execute on owned account
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Add Owner
  if (!ownerIsAdded) {
    return (
      <div className='card'>
        <div className='title'>Add Owner</div>
        <div>
          Now, you will interact with the 7579 module directly. You can add an
          owner to the Safe. The new owner will be able to execute transactions
          on the Safe. Metamask will request a signature from the first owner.
        </div>
        <div>
          <div className='actions'>
            <button
              className='skip'
              onClick={() => {
                setOwnerIsAdded(true)
                setLoading(false)
              }}
            >
              Skip
            </button>
            <button
              onClick={addOwner}
              className={loading ? 'button--loading' : ''}
            >
              Add Owner
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 5: Uninstall Module
  if (!moduleIsUninstalled) {
    return (
      <div className='card'>
        <div className='title'>Uninstall Module</div>
        <div>
          To finish the module&apos;s lifecycle, you can now uninstall the
          module. MetaMask will ask you to sign a message after clicking the
          button.
        </div>
        <div className='actions'>
          <button
            onClick={uninstallModule}
            className={loading ? 'button--loading' : ''}
          >
            Uninstall Module
          </button>
        </div>
      </div>
    )
  }

  // Step 6: Finish
  return (
    <div className='card'>
      <div className='title'>Well done</div>
      <div>
        Congratulations! You&apos;ve successfully installed, executed,
        interacted with, and uninstalled the module. This tutorial is now
        complete. Great job! Keep exploring!
      </div>
    </div>
  )
}
