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
      <div>
        <label htmlFor='address'>Address:</label>
        <input
          style={{ marginLeft: '20px' }}
          id='address'
          placeholder='0x...'
        />
      </div>
      <div>
        <label htmlFor='amount'>Amount:</label>
        <input
          style={{ marginLeft: '20px' }}
          id='amount'
          type='number'
          placeholder='1'
        />
      </div>
      <div>
        <label htmlFor='date'>Date/Time:</label>
        <input style={{ marginLeft: '20px' }} id='date' type='datetime-local' />
      </div>

      <button>Schedule Transfer</button>
    </form>
  )
}
