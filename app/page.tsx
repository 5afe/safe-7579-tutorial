'use client'

import { useState } from 'react'

import { getSmartAccountClient } from '../lib/permissionless'
import ScheduledTransferForm from '../components/ScheduledTransferForm'
import { SafeSmartAccountClient } from '@/types'

export default function Home () {
  const [safe, setSafe] = useState<SafeSmartAccountClient | undefined>()

  const handleLoadSafe = async () => {
    const safe = await getSmartAccountClient()
    setSafe(safe)
  }

  return (
    <>
      {safe == null ? (
        <>
          <button onClick={handleLoadSafe} style={{ marginTop: '40px' }}>
            Load Smart Account Client
          </button>
        </>
      ) : (
        <ScheduledTransferForm safe={safe} />
      )}
    </>
  )
}
