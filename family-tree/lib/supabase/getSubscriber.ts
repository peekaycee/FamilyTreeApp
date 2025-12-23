import { controlPlaneAdmin } from './controlPlaneAdmin';

export async function getSubscriber(slug: string) {
  const { data, error } = await controlPlaneAdmin
    .from('subscribers')
    .select('supabase_url, supabase_anon_key')
    .eq('slug', slug)
    .single();

  if (error) {
    throw new Error('Subscriber not found');
  }

  return data;
}

// Perekay_0077