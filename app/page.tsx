'use client'

import { useState } from 'react'

import {
  getPermissionlessClient,
  type PermissionlessClient
} from '../lib/permissionless'
import { deploySafe } from '../lib/safe'

import SocialRecovery from '../components/SocialRecovery'
import { isSafeDeployed } from '@/lib/safe'

export default function Home () {
  const [safe, setSafe] = useState<PermissionlessClient | undefined>()

  const handleLoadSafe = async () => {
    const safe = await getPermissionlessClient()
    const isDeployed = await isSafeDeployed(safe.account.address)
    if (!isDeployed) {
      const txHash = await deploySafe(safe)
      console.log(
        'Safe is being deployed: https://sepolia.etherscan.io/tx/' + txHash
      )
    }
    setSafe(safe)
  }

  return (
    <>
      {safe == null ? (
        <>
          <button onClick={handleLoadSafe} style={{ marginTop: '40px' }}>
            Create Safe
          </button>
        </>
      ) : (
        <>
          <SocialRecovery safe={safe} />
        </>
      )}
    </>
  )
}
