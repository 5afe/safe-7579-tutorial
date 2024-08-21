import { useEffect, useState } from 'react'
import { SOCIAL_RECOVERY_ADDRESS } from '@rhinestone/module-sdk'
import CircularProgress from '@mui/material/CircularProgress'

import Guardian from '@/components/Guardian'
import {
  WalletClientWithTransport,
  type PermissionlessClient
} from '@/lib/permissionless'
import {
  recoverSafe,
  UserOpRequest,
  install7579Module,
  getGuardians
} from '@/lib/socialRecovery'
import { getSafeData } from '@/lib/safe'
import { getUserOp, getUserOpHash } from '@/lib/userOp'

/**
 * Social Recovery component
 * This component allows the user to enable social recovery and recover their safe
 * @returns React component that allows the user to enable social recovery and recover their safe
 */
const SocialRecovery: React.FC<{
  permissionlessClient: PermissionlessClient
  walletClient: WalletClientWithTransport
  setSafeOwners: React.Dispatch<
    React.SetStateAction<`0x${string}`[] | undefined>
  >
  accounts: string[]
}> = ({ permissionlessClient, walletClient, setSafeOwners, accounts }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [guardians, setGuardians] = useState<`0x${string}`[]>(
    accounts as `0x${string}`[]
  )
  const [userOp, setUserOp] = useState<UserOpRequest | null>(null)
  const [userOpHash, setUserOpHash] = useState<`0x${string}` | null>(null)
  const [signatures, setSignatures] = useState<
    Record<`0x${string}`, `0x${string}`>
  >({})
  const [is7579Installed, setIs7579Installed] = useState(false)
  const [threshold, setThreshold] = useState(2)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const initSocialRecoveryModule = async () => {
      if (permissionlessClient == null) return
      const isSocialRecoveryInstalled = await permissionlessClient
        .isModuleInstalled({
          type: 'validator',
          address: SOCIAL_RECOVERY_ADDRESS,
          context: '0x'
        })
        .catch(err => {
          console.warn(err)
          return false
        })
      if (isSocialRecoveryInstalled) {
        setIs7579Installed(true)
        const _guardians = await getGuardians(permissionlessClient)
        setGuardians(_guardians)
      }
    }
    initSocialRecoveryModule()
  }, [permissionlessClient])

  useEffect(() => {
    const initRecovery = async () => {
      if (
        permissionlessClient != null &&
        walletClient != null &&
        guardians[0] != null
      ) {
        const userOp = await getUserOp(
          walletClient,
          permissionlessClient,
          guardians[0]
        )
        console.log('hey')
        setUserOp(userOp)
        setUserOpHash(getUserOpHash(userOp))
      }
    }
    initRecovery()
  }, [permissionlessClient, guardians])
  return (
    <>
      <div style={{ marginTop: '10px' }}>
        {is7579Installed ? (
          'Social Recovery module is installed ✅'
        ) : (
          <>
            Social Recovery module is not installed, add at least{' '}
            <button
              onClick={() => setThreshold(threshold - 1)}
              // sx={{ color: 'primary', minWidth: 0, mx: 0 }}
              style={{ padding: '0px 6px', margin: '0 4px 0 8px' }}
            >
              -
            </button>
            {threshold}
            <button
              onClick={() => setThreshold(threshold + 1)}
              style={{ padding: '0px 4px', margin: '0 8px 0 4px' }}
              // sx={{ color: 'primary', minWidth: 0, mx: 0 }}
            >
              +
            </button>{' '}
            guardians to install it!
          </>
        )}
      </div>
      <div>
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
          <Guardian
            key={i}
            index={i}
            {...{
              guardians,
              setGuardians,
              userOpHash,
              signatures,
              setSignatures,
              walletClient,
              is7579Installed
            }}
          />
        ))}
      </div>
      {!is7579Installed ? (
        <button
          disabled={guardians.length < threshold || loading}
          style={{ marginLeft: '10px' }}
          onClick={async () => {
            setLoading(true)
            setError(false)
            await install7579Module(permissionlessClient, {
              guardians,
              threshold
            })
              .then(receipt => {
                setTxHash(receipt.receipt.transactionHash)
                setIs7579Installed(true)
              })
              .catch(err => {
                console.error(err)
                setError(true)
              })
            setLoading(false)
          }}
        >
          Enable Social Recovery
          {loading ? (
            <CircularProgress
              size='8px'
              sx={{ marginLeft: '4px', color: 'black' }}
            />
          ) : null}
        </button>
      ) : (
        <div style={{ display: 'flex' }}>
          <button
            disabled={
              Object.keys(signatures).length < threshold || !userOp || loading
            }
            style={{ marginLeft: '10px' }}
            onClick={async () => {
              setLoading(true)
              setError(false)
              await recoverSafe(
                permissionlessClient,
                userOp as UserOpRequest,
                ...Object.values(signatures)
              )
                .then(async receipt => {
                  // refresh safe data
                  const safeData = await getSafeData(
                    permissionlessClient.account.address,
                    walletClient
                  )
                  setSafeOwners(safeData.owners as `0x${string}`[])

                  // reset state
                  setUserOp(null)
                  setUserOpHash(null)
                  setSignatures({})
                  setSuccess(true)
                })
                .catch(err => {
                  console.error(err)
                })

              setLoading(false)
            }}
          >
            Execute Recovery
            {loading ? (
              <CircularProgress
                size='8px'
                sx={{ marginLeft: '4px', color: 'black' }}
              />
            ) : null}
          </button>
        </div>
      )}
      {error ? (
        <p>
          There was an error processing the transaction. Please refresh the page
          or try again.
        </p>
      ) : null}
      {success ? <p>Recovery successful! 🎉</p> : null}
    </>
  )
}

export default SocialRecovery
