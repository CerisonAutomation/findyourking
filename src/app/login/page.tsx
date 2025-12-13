'use client'

import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await supabase.auth.signUp({
      email,
      password,
    })
    router.refresh()
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await supabase.auth.signInWithPassword({
      email,
      password,
    })
    router.push('/')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to the Ultimate Gay Dating & Booking Platform
        </h1>

        <p className="mt-3 text-2xl">
          Sign in to continue
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <form
            className="flex flex-col w-full max-w-sm p-8 mt-4 bg-white rounded-lg shadow-md"
            onSubmit={handleSignIn}
          >
            <label className="text-left" htmlFor="email">Email</label>
            <input
              className="p-2 mt-2 text-gray-700 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              name="email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <label className="mt-4 text-left" htmlFor="password">Password</label>
            <input
              className="p-2 mt-2 text-gray-700 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              name="password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <button
              className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700"
              type="submit"
            >
              Sign In
            </button>
          </form>

          <form
            className="flex flex-col w-full max-w-sm p-8 mt-4 bg-white rounded-lg shadow-md"
            onSubmit={handleSignUp}
          >
            <label className="text-left" htmlFor="email">Email</label>
            <input
              className="p-2 mt-2 text-gray-700 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              name="email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <label className="mt-4 text-left" htmlFor="password">Password</label>
            <input
              className="p-2 mt-2 text-gray-700 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent"
              name="password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            <button
              className="px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700"
              type="submit"
            >
              Sign Up
            </button>
          </form>
        </div>

        <button
          className="px-4 py-2 mt-4 font-bold text-white bg-red-500 rounded-md hover:bg-red-700"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </main>
    </div>
  )
}
