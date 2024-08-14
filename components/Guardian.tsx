import { useState, useEffect } from 'react'
import type { WalletClient } from 'viem'
import { CircularProgress } from '@mui/material'

import type { PermissionlessClient } from '@/lib/permissionless'

const Guardian: React.FC<{
  index: number
  guardians: `0x${string}`[] | null
  setGuardians: React.Dispatch<React.SetStateAction<`0x${string}`[]>>
  signatures: Record<`0x${string}`, `0x${string}`>
  setSignatures: React.Dispatch<
    React.SetStateAction<Record<`0x${string}`, `0x${string}`>>
  >
  userOpHash: `0x${string}` | null
  walletClient: WalletClient | null
  is7579Installed: boolean
}> = ({
  index,
  guardians,
  setGuardians,
  signatures,
  setSignatures,
  userOpHash,
  walletClient,
  is7579Installed
}) => {
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
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        Guardian #{index + 1}:
        {guardians?.[index] ? (
          <>
            {' '}
            {guardians[index]}
            {is7579Installed && (
              <div>
                {signatures[guardians?.[index]] ? (
                  <p>Signed ✅</p>
                ) : (
                  <button
                    disabled={!userOpHash || !walletClient || loading}
                    onClick={async () => {
                      setLoading(true)
                      const signature = await walletClient?.signMessage({
                        account: guardians?.[index],
                        message: userOpHash as `0x${string}`
                      })
                      setSignatures({
                        ...signatures,
                        [guardians?.[index]]: signature
                      })
                      setLoading(false)
                    }}
                  >
                    {loading ? (
                      <>
                        Waiting for signature...
                        <CircularProgress
                          size='10px'
                          sx={{ marginLeft: '4px', color: 'black' }}
                        />
                      </>
                    ) : userOpHash ? (
                      'Sign Message'
                    ) : (
                      'Recovery not ready'
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <input
              type='text'
              style={{ width: '50%' }}
              value={_guardian ?? undefined}
              onChange={e => setGuardian(e.target.value as `0x${string}`)}
              placeholder='Guardian address'
            />
            <button
              disabled={!_guardian || loading}
              onClick={async () => {
                setGuardians(prevGuardians => {
                  const _guardians = [...prevGuardians]
                  _guardians[index] = _guardian as `0x${string}`
                  return _guardians
                })
              }}
            >
              Add Guardian
            </button>
          </>
        )}{' '}
      </div>
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

export default Guardian
