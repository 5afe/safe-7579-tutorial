'use client'

import { useState } from 'react'

import {
  getPermissionlessClient,
  type PermissionlessClient
} from '../lib/permissionless'

import SocialRecovery from '../components/SocialRecovery'

export default function Home () {
  const [safe, setSafe] = useState<PermissionlessClient | undefined>()

  const handleLoadSafe = async () => {
    const safe = await getPermissionlessClient()
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
