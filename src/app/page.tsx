import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">Welcome, {profile?.username}</h1>

        <p className="mt-3 text-2xl">Your Profile</p>

        <div className="mt-6 flex max-w-4xl flex-wrap items-center justify-around sm:w-full">
          <div className="mt-6 w-96 rounded-xl border p-6 text-left hover:text-blue-600 focus:text-blue-600">
            <h3 className="text-2xl font-bold">{profile?.full_name}</h3>
            <p className="mt-4 text-xl">
              Age: {profile?.age}
            </p>
            <p className="mt-4 text-xl">
              Height: {profile?.height}
            </p>
            <p className="mt-4 text-xl">
              Bio: {profile?.bio}
            </p>
            <p className="mt-4 text-xl">
              Location: {profile?.location}
            </p>
            <p className="mt-4 text-xl">
              Looking for: {profile?.looking_for}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
