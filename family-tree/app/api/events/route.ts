import { NextRequest, NextResponse } from 'next/server'
import { getTenantClient } from '@/lib/supabase/getTenantClient'

// Helper to get logged-in user ID from Supabase session (via sb-access-token)
async function getUserId(supabase: ReturnType<typeof getTenantClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user.id
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getTenantClient(req)

    // Get logged-in user ID
    const user_id = await getUserId(supabase)

    // Parse event directly from body
    const event = await req.json()
    if (!event || !event.title || !event.date)
      throw new Error('Missing event data')

    event.user_id = user_id

    // Insert into Supabase
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save event' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getTenantClient(req)
    const user_id = await getUserId(supabase)

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user_id) // 🔐 tenant isolation
      .order('date', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch events' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}


// ================= PATCH (update) =================
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getTenantClient(req)
    const user_id = await getUserId(supabase)

    const event = await req.json()
    if (!event.id) throw new Error('Missing event ID')

    // Ensure only the owner can update
    const { data, error } = await supabase
      .from('events')
      .update({ ...event, user_id })
      .eq('id', event.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update event' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// ================= DELETE =================
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getTenantClient(req)
    const user_id = await getUserId(supabase)

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) throw new Error('Missing event ID')

    // 1. Fetch event (to get images)
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('images')
      .eq('id', id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !event) throw new Error('Event not found')

    // 2. Convert public URLs → storage paths
    const paths =
      event.images?.map((url: string) => {
        const marker = '/storage/v1/object/public/event-images/'
        return url.includes(marker) ? url.split(marker)[1] : null
      }).filter(Boolean) ?? []

    // 3. Delete images from storage
    if (paths.length) {
      const { error: storageError } = await supabase
        .storage
        .from('event-images')
        .remove(paths)

      if (storageError) throw storageError
    }

    // 4. Delete event row
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Event and images deleted' })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete event' },
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

