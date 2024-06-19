export default function ScheduledTransferForm () {
  return (
    <form
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '40px',
        marginBottom: '40px'
      }}
    >
      <input placeholder='Address to transfer to' />
      <input placeholder='Amount to transfer' />
      <input type='datetime-local' placeholder='Date/Time' />
      <button>Schedule Transfer</button>
    </form>
  )
}
