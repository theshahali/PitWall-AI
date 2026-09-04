import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pitwall AI — Autonomous On-Chain F1 Telemetry Strategist & Polymarket Alpha Vault',
  description: 'Synthesizes deep Formula 1 sector telemetry, tyre degradation, and Polymarket crowd odds under GenLayer AI Consensus.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#080A10] text-slate-100 antialiased selection:bg-rose-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}