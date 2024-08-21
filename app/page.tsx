'use client'

import { useState } from 'react'
import { createWalletClient, custom } from 'viem'
import { sepolia } from 'viem/chains'
import CircularProgress from '@mui/material/CircularProgress'

import {
  getPermissionlessClient,
  WalletClientWithTransport,
  type PermissionlessClient
} from '@/lib/permissionless'
import { deploySafe, getSafeData } from '@/lib/safe'
import SafeAccountDetails from '@/components/SafeAccountDetails'
import SocialRecovery from '@/components/SocialRecovery'

/**
 * This component is the main page of the app
 * @returns React component that allows the user to create a safe and set guardians
 */
export default function Home () {
  const [permissionlessClient, setPermissionlessClient] = useState<
    PermissionlessClient | undefined
  >()
  const [walletClient, setWalletClient] = useState<
    WalletClientWithTransport | undefined
  >()
  const [accounts, setAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [safeOwners, setSafeOwners] = useState<`0x${string}`[]>()

  const handleConnectWallet = async () => {
    setLoading(true)
    // @ts-ignore
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    const walletClient = createWalletClient({
      account: accounts[0],
      chain: sepolia,
      // @ts-ignore
      transport: custom(window.ethereum)
    }) as WalletClientWithTransport

    const permissionlessClient = await getPermissionlessClient(walletClient)

    const safeData = await getSafeData(
      permissionlessClient.account.address,
      walletClient
    )
    if (safeData.isDeployed === false) {
      const txHash = await deploySafe(permissionlessClient)
      console.log(
        'Safe is being deployed: https://sepolia.etherscan.io/tx/' + txHash
      )
    }
    setSafeOwners(safeData.owners as `0x${string}`[])
    setAccounts(accounts)
    setWalletClient(walletClient)
    setPermissionlessClient(permissionlessClient)
    setLoading(false)
  }

  return (
    <>
      {walletClient == null || permissionlessClient == null ? (
        <>
          <button
            disabled={loading}
            onClick={handleConnectWallet}
            style={{ marginTop: '40px' }}
          >
            {loading ? (
              <>
                Loading...{' '}
                <CircularProgress size='10px' sx={{ color: 'black' }} />
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </>
      ) : (
        <>
          <SafeAccountDetails {...{ permissionlessClient, safeOwners }} />
          <SocialRecovery
            {...{ permissionlessClient, walletClient, accounts, setSafeOwners }}
          />
        </>
      )}
    </>
  )
}
