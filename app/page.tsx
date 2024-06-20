'use client'

import { useState } from 'react'

import ScheduledTransferForm from '../components/ScheduledTransferForm'
import ScheduledTransfers from '../components/ScheduledTransfers'
import ProcessedTransfers from '../components/ProcessedTransfers'

export default function Home () {
  const [safe, setSafe] = useState()
  const [scheduledTransfers, setScheduledTransfers] = useState([])
  const [processedTransfers, setProcessedTransfers] = useState([])
  return (
    <>
      {safe == null ? (
        <>
          <button style={{ marginTop: '40px' }}>Deploy Safe</button>
        </>
      ) : (
        <>
          <ScheduledTransferForm />
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <ScheduledTransfers transfers={scheduledTransfers} />
            <ProcessedTransfers transfers={processedTransfers} />
          </div>
        </>
      )}
    </>
  )
}
