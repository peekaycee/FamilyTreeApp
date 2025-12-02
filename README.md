# familyTree-Website

## Family Tree - Signed Upload (Next.js + Supabase)

This website demonstrates direct-to-Supabase signed uploads.

1. Client requests a short-lived signed upload token from a server route (uses service role).

2. Client calls `supabase.storage.from('avatars').uploadToSignedUrl(path, token, file)` to upload.

3. Server stores the file path in the `family_members` table when creating/updating records.
