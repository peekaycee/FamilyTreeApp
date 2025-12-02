import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!serviceRole) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');

export const supabaseAdmin = createClient(url, serviceRole);
