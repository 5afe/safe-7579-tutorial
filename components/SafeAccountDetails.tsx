import { useState } from 'react'

import { splitAddress } from '@/lib/utils'
import { PermissionlessClient } from '@/lib/permissionless'
import { deploySafe, getSafeData } from '@/lib/safe'
import ExternalLink from '../public/external-link.svg'

/**
 * This component displays information about the user's safe address and its current owners. It also allows the user to deploy a safe if they don't have one yet.
 * @returns React Functional Component
 * @param permissionlessClient - The permissionless client
 * @param safeOwners - The current owners of the safe
 */
const SafeAccountDetails: React.FC<{
  permissionlessClient: PermissionlessClient
  safeOwners: `0x${string}`[] | undefined
  setSafeOwners: React.Dispatch<
    React.SetStateAction<`0x${string}`[] | undefined>
  >
  setIsDeployed: React.Dispatch<React.SetStateAction<boolean>>
  accounts: string[]
}> = ({
  permissionlessClient,
  safeOwners,
  setSafeOwners,
  setIsDeployed,
  accounts
}) => {
  const [loading, setLoading] = useState(false)

  const handleDeploySafe = async () => {
    setLoading(true)
    const receipt = await deploySafe(permissionlessClient, accounts)
    console.log(
      'Deployment transaction: https://sepolia.etherscan.io/tx/' + receipt?.receipt?.transactionHash
    )
    const safeData = await getSafeData(permissionlessClient.account.address) // Fetch again onchain data about the safe
    setSafeOwners(safeData.owners as `0x${string}`[])
    setIsDeployed(safeData.isDeployed)
    setLoading(false)
  }

  return (
    <>
      <div style={{ marginTop: '40px', display: 'flex' }}>
        Your Safe:{' '}
        <a
          href={`https://app.safe.global/home?safe=sep:${permissionlessClient.account.address}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '1rem',
            marginLeft: '1rem'
          }}
          target='_blank'
          rel='noopener noreferrer'
        >
          {splitAddress(permissionlessClient.account.address)}{' '}
          <ExternalLink
            width={20}
            height={20}
            style={{ marginLeft: '0.5rem' }}
          />
        </a>
      </div>
      <div style={{ marginTop: '20px', display: 'flex' }}>
        {safeOwners?.length === 0 ? (
          <button disabled={loading} onClick={handleDeploySafe}>
            {loading ? 'Deploying...' : 'Deploy Safe'}
          </button>
        ) : (
          <>
            Current owners:{' '}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {safeOwners?.map((ownerAddress, i) => (
                <a
                  key={i}
                  href={`https://sepolia.etherscan.io/address/${ownerAddress}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: '1rem',
                    marginLeft: '1rem'
                  }}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {splitAddress(ownerAddress)}{' '}
                  <ExternalLink
                    width={20}
                    height={20}
                    style={{ marginLeft: '0.5rem' }}
                  />
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default SafeAccountDetails
