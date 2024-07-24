export default function ProcessedTransfers ({
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
      {' '}
      <h2>Processed Transfers</h2>
      <div>
        {transfers.length == 0 ? (
          <div style={{ padding: '10px' }}>
            No processed transfers yet. Schedule a transfer and wait for the
            scheduled time to seet it appear here!
          </div>
        ) : (
          transfers.map((transfer, i) => (
            <div key={i}>
              <div>{transfer.args.jobId}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
