import { useState, useEffect } from 'react'
import { SOCIAL_RECOVERY_ADDRESS } from '@rhinestone/module-sdk'

import { PermissionlessClient } from '@/lib/permissionless'
import {
  install7579Module,
  addGuardian,
  getGuardians
} from '@/lib/socialRecovery'

const threshold = 2

const ScheduledTransferForm: React.FC<{ safe: PermissionlessClient }> = ({
  safe
}) => {
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [is7579Installed, setIs7579Installed] = useState(false)
  const [guardians, setGuardians] = useState<`0x${string}`[]>([])
  const [showRecoverSafe, setShowRecoverSafe] = useState(false)

  useEffect(() => {
    const initSocialRecovery = async () => {
      const isSocialRecoveryInstalled = await safe
        .isModuleInstalled({
          type: 'validator',
          address: SOCIAL_RECOVERY_ADDRESS,
          context: '0x'
        })
        .catch(() => false)
      if (isSocialRecoveryInstalled) {
        setIs7579Installed(true)
        const guardians = await getGuardians(safe)
        setGuardians(guardians)
      }
    }
    void initSocialRecovery()
  }, [safe])

  return (
    <>
      <div style={{ marginTop: '40px' }}>Your Safe: {safe.account.address}</div>{' '}
      <div style={{ marginTop: '10px' }}>
        Social Recovery module installed:{' '}
        {is7579Installed ? (
          'Yes ✅'
        ) : (
          <>
            No, add at least two guardians to install it!
            <button
              disabled={is7579Installed || guardians.length < threshold}
              onClick={async () => {
                setLoading(true)
                setError(false)
                const socialRecoveryDataInput = {
                  guardians,
                  threshold
                }
                await install7579Module(safe, socialRecoveryDataInput)
                  .then(txHash => {
                    setTxHash(txHash)
                    setLoading(false)
                    setIs7579Installed(true)
                  })
                  .catch(err => {
                    console.error(err)
                    setLoading(false)
                    setError(true)
                  })
              }}
            >
              Enable Social Recovery
            </button>
          </>
        )}
      </div>
      <div>
        {loading ? <p>Processing, please wait...</p> : null}
        {error ? (
          <p>
            There was an error processing the transaction. Please try again.
          </p>
        ) : null}
        {txHash ? (
          <>
            <p>
              Success!{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target='_blank'
                rel='noreferrer'
                style={{
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                View on Etherscan
              </a>
            </p>
          </>
        ) : null}
      </div>
      <div
        style={{
          width: '80%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginTop: '40px',
          marginBottom: '40px'
        }}
      >
        {Array.from({ length: threshold }).map((_, i) => (
          <Guardian key={i} index={i} {...{ safe, guardians, setGuardians }} />
        ))}
      </div>
      {is7579Installed && (
        <div>
          <button
            onClick={async () => {
              // const txHash = await safe.sendTransaction({
              //   to: SOCIAL_RECOVERY_ADDRESS,
              //   value: BigInt(0),
              //   data: '0x'
              // })
              // setTxHash(txHash)
              setShowRecoverSafe(true)
            }}
          >
            Recover Safe
          </button>
        </div>
      )}
      {showRecoverSafe && (
        <div>
          <p>Sign Message with Guardian #1:</p>
          <button
            onClick={async () => {
              // const txHash = await safe.sendTransaction({
              //   to: SOCIAL_RECOVERY_ADDRESS,
              //   value: BigInt(0),
              //   data: '0x'
              // })
              // setTxHash(txHash)
            }}
          >Sign Message</button>
        </div>
      )}
    </>
  )
}

export default ScheduledTransferForm

const Guardian: React.FC<{
  index: number
  guardians: `0x${string}`[] | null
  setGuardians: React.Dispatch<React.SetStateAction<`0x${string}`[]>>
  safe: PermissionlessClient
}> = ({ index, guardians, setGuardians, safe }) => {
  const [_guardian, setGuardian] = useState<`0x${string}` | null>(
    guardians?.[index] ?? null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [txHash, setTxHash] = useState('')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '20px'
      }}
    >
      <div style={{ marginBottom: '10px' }}>Guardian #{index + 1}</div>
      {guardians?.[index] ?? (
        <>
          <input
            type='text'
            value={_guardian ?? undefined}
            onChange={e => setGuardian(e.target.value as `0x${string}`)}
            placeholder='Guardian address'
          />
          <button
            disabled={!_guardian || loading}
            onClick={async () => {
              // setLoading(true)
              // setError(false)
              setGuardians(prevGuardians => {
                const _guardians = [...prevGuardians]
                _guardians[index] = _guardian as `0x${string}`
                return _guardians
              })
              // await addGuardian(safe, _guardian as `0x${string}`)
              //   .then(txHash => {
              //     setTxHash(txHash)
              //     setLoading(false)
              //     setGuardian(null)
              //   })
              //   .catch(err => {
              //     console.error(err)
              //     setLoading(false)
              //     setError(true)
              //   })
            }}
          >
            Add Guardian
          </button>
        </>
      )}
      {loading ? <p>Processing, please wait...</p> : null}
      {error ? (
        <p>There was an error processing the transaction. Please try again.</p>
      ) : null}
      {txHash ? (
        <>
          <p>
            Success!{' '}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target='_blank'
              rel='noreferrer'
              style={{
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              View on Etherscan
            </a>
          </p>
        </>
      ) : null}
    </div>
  )
}
