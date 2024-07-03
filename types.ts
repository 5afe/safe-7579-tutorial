import { Chain, Transport } from 'viem'
import { SmartAccountClient } from 'permissionless'
import { EntryPoint } from 'permissionless/types'
import { SafeSmartAccount } from 'permissionless/accounts'
import { Erc7579Actions } from 'permissionless/actions/erc7579'

export type SafeSmartAccountClient = SmartAccountClient<
  EntryPoint,
  Transport,
  Chain,
  SafeSmartAccount<EntryPoint>
> &
  Erc7579Actions<EntryPoint, SafeSmartAccount<EntryPoint>>

export interface ScheduledTransferDataInput {
  startDate: number
  repeatEvery: number
  numberOfRepeats: number
  amount: number
  recipient: `0x${string}`
}
