'use client'

import { useMemo } from 'react'

export default function StatsPanel({ bookmarks }) {
  const stats = useMemo(() => {
    if (!bookmarks.length) return null

    // Top domains
    const domainCount = {}
    bookmarks.forEach(b => {
      try {
        const domain = new URL(b.url).hostname.replace('www.', '')
        domainCount[domain] = (domainCount[domain] || 0) + 1
      } catch {}
    })
    const topDomains = Object.entries(domainCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Top tags
    const tagCount = {}
    bookmarks.forEach(b => {
      (b.tags || []).forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    // Bookmarks added this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeek = bookmarks.filter(b => new Date(b.created_at) > oneWeekAgo).length

    // Bookmarks added today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = bookmarks.filter(b => new Date(b.created_at) >= today).length

    return { topDomains, topTags, thisWeek, todayCount, total: bookmarks.length }
  }, [bookmarks])

  if (!stats) return null

  const maxDomainCount = stats.topDomains[0]?.[1] || 1

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 fade-in">

      {/* Total stats cards */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <div>
          <p className="text-indigo-400 text-xs font-medium mb-0.5">Total Saved</p>
          <p className="text-white text-3xl font-bold">{stats.total}</p>
          <p className="text-indigo-500 text-xs mt-0.5">{stats.todayCount} added today</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <p className="text-indigo-400 text-xs font-medium mb-0.5">This Week</p>
          <p className="text-white text-3xl font-bold">{stats.thisWeek}</p>
          <p className="text-indigo-500 text-xs mt-0.5">bookmarks added</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
          </svg>
        </div>
        <div>
          <p className="text-indigo-400 text-xs font-medium mb-0.5">Tags Used</p>
          <p className="text-white text-3xl font-bold">{Object.keys(
            bookmarks.reduce((acc, b) => { (b.tags||[]).forEach(t => acc[t]=1); return acc }, {})
          ).length}</p>
          <p className="text-indigo-500 text-xs mt-0.5">unique tags</p>
        </div>
      </div>

      {/* Top Domains */}
      {stats.topDomains.length > 0 && (
        <div className="glass rounded-2xl p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-sm">Top Domains</h3>
          </div>
          <div className="space-y-3">
            {stats.topDomains.map(([domain, count]) => (
              <div key={domain}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                      alt=""
                      className="w-4 h-4"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <span className="text-indigo-200 text-xs truncate max-w-[160px]">{domain}</span>
                  </div>
                  <span className="text-indigo-400 text-xs font-medium">{count}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{
                      width: `${(count / maxDomainCount) * 100}%`,
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-sm">Tags Breakdown</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(([tag, count]) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl"
              >
                <span className="text-indigo-300 text-xs font-medium">#{tag}</span>
                <span className="bg-indigo-500/30 text-indigo-300 text-xs px-1.5 py-0.5 rounded-md font-bold">
                  {count}
                </span>
              </div>
            ))}
          </div>
          {stats.topTags.length === 0 && (
            <p className="text-indigo-500 text-xs text-center py-4">No tags yet</p>
          )}
        </div>
      )}

    </div>
  )
}