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
            <div key={i}>
              <div>{transfer.amount}</div>
              <div>{transfer.to}</div>
              <div>{transfer.date}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
