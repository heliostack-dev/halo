import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { InlineScript } from '#/ui/inline-script.tsx'
import { themeBootScript, DEFAULT_THEME } from '#/ui/theme.ts'
import { ToastProvider } from '#/ui/toast.tsx'
import '#/ui/base.css'
import '#/ui/tokens.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-sans-loaded', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono-loaded', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Halo', template: '%s · Halo' },
  description: 'Halo is a realtime social network built with the Heliostack skills.',
  applicationName: 'Halo',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <InlineScript html={themeBootScript} />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
