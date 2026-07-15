# Smart Bookmark App 🔖

A full-stack bookmark manager built with Next.js, Supabase, and Tailwind CSS. Save, organize, and sync your bookmarks in real-time across all your tabs and devices.

## 🔗 Live Demo
[smart-bookmark-app.vercel.app](https://smart-bookmark-app.vercel.app)

## 📁 GitHub Repository
[github.com/YOUR_USERNAME/smart-bookmark-app](https://github.com/YOUR_USERNAME/smart-bookmark-app)

---

## ✨ Features

- **Google OAuth** — Sign in with Google, no email/password needed
- **Private Bookmarks** — Each user can only see their own bookmarks
- **Add Bookmarks** — Save any URL with a title and optional tags
- **Delete Bookmarks** — Instantly remove bookmarks with confirmation
- **Real-time Sync** — Bookmarks update live across multiple tabs without page refresh
- **Tags / Categories** — Organize bookmarks with preset or custom tags, filter by tag
- **Stats Dashboard** — View total bookmarks, this week's count, top domains, and tag breakdown
- **Search** — Filter bookmarks by title or URL instantly
- **Responsive UI** — Works on mobile, tablet, and desktop
- **Animations** — Smooth transitions, hover effects, and loading states

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | Frontend framework |
| Supabase | Auth, Database, Realtime |
| Tailwind CSS | Styling |
| Vercel | Deployment |

---

## 📂 Project Structure

```
smart-bookmark-app/
├── app/
│   ├── globals.css         # Global styles and animations
│   ├── layout.js           # Root layout
│   ├── page.js             # Login page
│   ├── dashboard/
│   │   └── page.js         # Main dashboard
│   └── auth/
│       └── callback/
│           └── route.js    # Google OAuth callback handler
├── components/
│   ├── Navbar.js           # Top navigation with user menu
│   ├── BookmarkCard.js     # Individual bookmark card
│   ├── AddBookmarkModal.js # Modal to add new bookmarks
│   ├── StatsPanel.js       # Stats dashboard component
│   └── LoadingSpinner.js   # Loading state
├── lib/
│   └── supabase.js         # Supabase client
├── .env.local              # Environment variables
└── README.md
```

---

## 🗄 Database Schema

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Row Level Security** is enabled — users can only read, insert, and delete their own bookmarks.

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app.git
cd smart-bookmark-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase
- Create a project at [supabase.com](https://supabase.com)
- Run the SQL schema above in the SQL Editor
- Enable Google OAuth in Authentication → Providers
- Add `http://localhost:3000/auth/callback` to Redirect URLs

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Problems I Ran Into & How I Solved Them

### 1. `cookies()` must be awaited in Next.js 15
**Problem:** The auth callback route was throwing an error — `cookies()` returns a Promise in Next.js 15 but the code was using it synchronously.

**Fix:** Added `await` before `cookies()` in `app/auth/callback/route.js`:
```js
const cookieStore = await cookies()
```

### 2. Bookmark delete not instant
**Problem:** Clicking "Yes, Delete" showed "Deleting..." but the card stayed on screen until page refresh. The realtime DELETE event was not firing fast enough.

**Fix:** Used **optimistic update** — removed the bookmark from the UI state immediately, then deleted from the database in the background. If the DB delete failed, the bookmark was restored by re-fetching.

### 3. Bookmark add not instant
**Problem:** After saving a bookmark, it only appeared after a page refresh. The realtime INSERT subscription wasn't triggering consistently on the same client that made the insert.

**Fix:** Updated the modal to return the newly inserted bookmark (`select().single()`) and passed it back to the dashboard via `onAdded(data)`, which immediately prepended it to the bookmarks list.

### 4. Tailwind v4 breaking changes
**Problem:** The project was created with Tailwind CSS v4 which removed `@tailwind base`, `@tailwind components`, `@tailwind utilities` directives.

**Fix:** Downgraded to Tailwind CSS v3 which is stable and widely supported:
```bash
npm uninstall tailwindcss
npm install tailwindcss@3 postcss autoprefixer
```

### 5. Google OAuth redirect mismatch
**Problem:** After selecting a Google account, the page redirected back to the login screen instead of the dashboard.

**Fix:** The Supabase project URL in `.env.local` didn't match the project where Google OAuth was configured. Ensured all three — `.env.local`, Supabase Google provider, and Google Cloud Console redirect URIs — pointed to the same Supabase project URL.

---

## 🌐 Deployment

Deployed on **Vercel** with the following environment variables set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📝 Notes

- Google OAuth is configured for **External** user type — any Google account can sign in
- All bookmark data is protected by **Row Level Security (RLS)** in Supabase — users cannot access each other's data
- Real-time updates use **Supabase Realtime** with Postgres changes subscription