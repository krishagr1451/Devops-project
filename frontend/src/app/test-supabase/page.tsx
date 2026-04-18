import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TestSupabasePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Tries to select from USERS table (already created in Step 2 of plan)
  const { data: users, error } = await supabase.from('USERS').select('*')

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Supabase Connection Error</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Supabase Connection OK</h1>
      <p>Successfully fetched {users?.length || 0} users.</p>
      <ul>
        {users?.map((user: any) => (
          <li key={user.user_id}>{user.name} ({user.role})</li>
        ))}
      </ul>
    </div>
  )
}
