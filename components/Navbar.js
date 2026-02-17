'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar({ user }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10" style={{ background: 'rgba(15, 12, 41, 0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">Smart Bookmark</span>
          </div>

          {/* Realtime indicator */}
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 bg-green-400 rounded-full block"></span>
              <span className="absolute w-2 h-2 bg-green-400 rounded-full opacity-75 ping"></span>
            </div>
            <span className="hidden sm:block text-xs font-medium">Live sync</span>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 btn-press"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-9 h-9 rounded-full ring-2 ring-indigo-500"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 text-indigo-300 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                {/* Backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                <div
                  className="absolute right-0 mt-3 w-60 rounded-2xl shadow-2xl z-20 overflow-hidden"
                  style={{
                    background: 'rgba(20, 16, 60, 0.97)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    animation: 'modalIn 0.2s ease forwards'
                  }}
                >
                  {/* User info */}
                  <div className="px-4 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full ring-2 ring-indigo-500" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{name}</p>
                        <p className="text-indigo-400 text-xs truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sign out */}
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/15 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {loggingOut ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" style={{ animation: 'spin 1s linear infinite' }}></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                      {loggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}