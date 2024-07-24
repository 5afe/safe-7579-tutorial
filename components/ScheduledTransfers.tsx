import { executeOrder } from '@/lib/scheduledTransfers'
import Image from 'next/image'

export default function ScheduledTransfers ({
  transfers
}: Readonly<{
  transfers: any[]
}>) {
  return (
    <div
      style={{
        width: 'calc(50% - 20px)',
        border: '1px solid white',
        borderRadius: '8px',
        marginRight: '20px',
        padding: '20px 20px 40px 20px'
      }}
    >
      <h2>Scheduled Transfers</h2>
      <div>
        {transfers.length == 0 ? (
          <div style={{ padding: '10px' }}>
            No scheduled transfers yet. Fill the form above and click{' '}
            <strong>Schedule Transfer</strong> to see it appear here!
          </div>
        ) : (
          transfers.map((transfer, i) => (
            <div
              key={i}
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex' }}>
                ⏱️
                <div key={i}>
                  Job Id: #{BigInt(transfer.args.jobId).toString()}
                  <div>
                    Transaction Hash:{' '}
                    <a
                      target='_blank'
                      rel='noreferrer'
                      href={`https://sepolia.etherscan.io/tx/${transfer.transactionHash}`}
                    >
                      {transfer.transactionHash.substring(0, 6)}...
                      <Image
                        width={16}
                        height={16}
                        alt='link-icon'
                        src='/external-link.svg'
                        style={{ marginLeft: '0.5rem' }}
                      />
                    </a>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  executeOrder(transfer.args.jobId)
                }}
              >
                Execute Order
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
