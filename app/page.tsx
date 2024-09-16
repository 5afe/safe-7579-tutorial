'use client'

import { createSmartAccountClient } from 'permissionless'
import { sepolia } from 'viem/chains'
import { encodePacked, http, encodeFunctionData, parseAbi } from 'viem'
import { erc7579Actions } from 'permissionless/actions/erc7579'
import { createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { entryPoint07Address } from 'viem/account-abstraction'
import { toSafeSmartAccount } from 'permissionless/accounts'
import { useEffect, useState } from 'react'

export default function Home () {
  const [publicClient, setPublicClient] = useState(null)
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
  const owner = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  )

  const owner2 = privateKeyToAccount(
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  )

  // These functions will be filled with code in the following steps:

  useEffect(() => {
    const init = async () => {}
    init()
  }, [])

  const installModule = async () => {}

  const addOwner = async () => {}

  const executeOnOwnedAccount = async () => {}

  return (
    <div className='card'>
      <div className='title'>Safe 7579 Module</div>
      <button onClick={installModule}>Install Module</button>
      <button onClick={executeOnOwnedAccount}>Execute as Owner</button>
      <button onClick={addOwner}>Add Owner</button>
    </div>
  )
}
