
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY

const adminEmail = 'kalukaluokomba@gmail.com'

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase URL or server-side secret key.'
  )
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function assignSuperAdmin() {
  console.log('Searching for administrator account...')

  let targetUser = null
  let page = 1

  while (!targetUser) {
    const { data, error } =
      await supabase.auth.admin.listUsers({
        page,
        perPage: 1000
      })

    if (error) throw error

    targetUser = data.users.find(
      user => user.email?.toLowerCase() === adminEmail
    )

    if (targetUser || data.users.length < 1000) break

    page++
  }

  if (!targetUser) {
    throw new Error(
      `No Supabase Auth account found for ${adminEmail}.`
    )
  }

  console.log('Account found:', targetUser.email)

  const updatedMetadata = {
    ...targetUser.app_metadata,
    role: 'super_admin'
  }

  const { data, error } =
    await supabase.auth.admin.updateUserById(
      targetUser.id,
      { app_metadata: updatedMetadata }
    )

  if (error) throw error

  if (data.user.app_metadata?.role !== 'super_admin') {
    throw new Error('Super admin verification failed.')
  }

  console.log('-----------------------------')
  console.log('SUPER ADMIN SUCCESSFULLY ASSIGNED')
  console.log('Email:', data.user.email)
  console.log('Role:', data.user.app_metadata.role)
  console.log('User ID:', data.user.id)
  console.log('-----------------------------')
}

assignSuperAdmin().catch(error => {
  console.error('Setup failed:', error.message)
  process.exitCode = 1
})
