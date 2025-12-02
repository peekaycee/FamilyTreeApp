# familyTree-Website

## Family Tree - Signed Upload Example (Next.js + Supabase)

This starter demonstrates direct-to-Supabase signed uploads:

1. Client requests a short-lived signed upload token from a server route (uses service role).

2. Client calls `supabase.storage.from('avatars').uploadToSignedUrl(path, token, file)` to upload.

3. Server stores the file path in the `family_members` table when creating/updating records.

### Setup

1. Copy `.env.example` to `.env.local` and fill your Supabase keys.

2. Create a Supabase project, create a `avatars` bucket (private recommended).

3. Run SQL to create `family_members` table and enable RLS (see project notes).

4. `npm install`

5. `npm run dev`

6. Open `http://localhost:3000/family-builder`

See `app/` and `components/` for code.