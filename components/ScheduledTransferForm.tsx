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
      <label htmlFor='address'>Address to transfer to:</label>
      <input id='address' placeholder='0x...' />
      <label htmlFor='amount'>Amount to transfer:</label>
      <input id='amount' type='number' placeholder='1' />
      <label htmlFor='date'>Date/Time to transfer:</label>
      <input id='date' type='datetime-local' />
      <button>Schedule Transfer</button>
    </form>
  )
}
