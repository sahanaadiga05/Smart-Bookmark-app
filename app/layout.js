import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Bookmark App',
  description: 'Save and organize your bookmarks with real-time sync',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-gray-100`}>
        <div className="ambient-mesh"></div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}