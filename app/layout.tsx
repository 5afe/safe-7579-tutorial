import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Img from 'next/image'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Safe Tutorial: ERC-7579',
  description: 'Generated by create next app'
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem'
          }}
        >
          <a href='https://safe.global'>
            <Img width={95} height={36} alt='safe-logo' src='/safe.svg' />
          </a>
          <div style={{ display: 'flex' }}>
            <a
              href='https://docs.safe.global/advanced/erc-7579/tutorials/7579-tutorial'
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '1rem'
              }}
              target='_blank'
              rel='noopener noreferrer'
            >
              Read tutorial{' '}
              <Img
                width={20}
                height={20}
                alt='link-icon'
                src='/external-link.svg'
                style={{ marginLeft: '0.5rem' }}
              />
            </a>
            <a
              href='https://github.com/5afe/safe-7579-tutorial'
              style={{ display: 'flex', alignItems: 'center' }}
              target='_blank'
              rel='noopener noreferrer'
            >
              View on GitHub{' '}
              <Img
                width={24}
                height={24}
                alt='github-icon'
                src='/github.svg'
                style={{ marginLeft: '0.5rem' }}
              />
            </a>
          </div>
        </nav>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <h1>Social Recovery</h1>

          <div>
            Create an ERC-7579-compatible Safe Smart Account and use{' '}
            <a
              href='https://docs.rhinestone.wtf/module-sdk/modules/social-recovery'
              target='_blank'
              rel='noopener noreferrer'
            >
              Rhinestone&apos;s Social Recovery module{' '}
              <Img
                width={20}
                height={20}
                alt='link-icon'
                src='/external-link.svg'
                style={{ marginBottom: '-4px' }}
              />
            </a>{' '}
            to recover it.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginLeft: '40px',
            marginRight: '40px',
            flexDirection: 'column'
          }}
        >
          {children}
        </div>
      </body>
    </html>
  )
}
