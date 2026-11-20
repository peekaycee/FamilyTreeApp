
// import { NextResponse } from 'next/server';
// import { createSupabaseServerClient } from '@/lib/supabase/server'


// export async function POST(req: Request) {
//   const supabase = await createSupabaseServerClient()
  
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
//     }

//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });

//     if (error || !data.session) {
//       return NextResponse.json({ message: error?.message || 'Login failed' }, { status: 401 });
//     }

//     const response = NextResponse.json({
//       message: 'Logged in successfully',
//       user: data.user,
//       session: data.session,
//     });

   
// // =======================================================
// // PRELOAD ALL TENANT WEBSITE CONTENT AFTER LOGIN
// // =======================================================

// const userId = data.user?.id || data.session?.user?.id;

// if (userId) {

//   // Fetch CMS content and family stories concurrently.
//   const [contentResult, storiesResult, membersResult,
//   unionsResult] = await Promise.all([

//     // CMS CONTENT
//     (async () => {
//       try {

//         const response = await fetch('/api/family-site-content', {
//           method: 'GET',
//           cache: 'no-store',
//           credentials: 'include',
//         });

//         if (!response.ok) {
//           throw new Error('Unable to preload tenant CMS content.');
//         }

//         return await response.json();

//       } catch (error) {

//         console.error('CMS preloading failed:', error);

//         return null;
//       }
//     })(),

//     // FAMILY STORIES
//     (async () => {
//       try {

//         const { data: stories, error: storiesError } = await supabase
//           .from('family_stories')
//           .select('*')
//           .order('created_at', { ascending: false });

//         if (storiesError) {
//           throw storiesError;
//         }

//         return stories || [];

//       } catch (error) {

//         console.error('Family stories preloading failed:', error);

//         return null;
//       }
//     })(),

//   ]);

  

//   // SAVE CMS CONTENT FOR EACH PAGE.
//   if (contentResult?.content) {

//     const cacheKey = (page: string) =>
//       `ft_${page}_${userId}`;

//     try {

//       // HOMEPAGE
//       if (contentResult.content.homepage) {
//         localStorage.setItem(
//           cacheKey('homepage_content'),
//           JSON.stringify(contentResult)
//         );
//       }

//       // OUR STORY
//       if (contentResult.content.our_family) {
//         localStorage.setItem(
//           cacheKey('our_family_images'),
//           JSON.stringify(contentResult)
//         );
//       }

//       // LEGACY
//       if (contentResult.content.legacy) {
//         localStorage.setItem(
//           cacheKey('legacy_content'),
//           JSON.stringify(contentResult)
//         );
//       }

//     } catch (cacheError) {

//       console.error('CMS cache saving failed:', cacheError);

//     }

//   }


//   // SAVE FAMILY STORIES.
//   if (storiesResult !== null) {

//     try {

//       localStorage.setItem(
//         `ft_family_stories_${userId}`,
//         JSON.stringify(storiesResult)
//       );

//     } catch (cacheError) {

//       console.error('Family stories cache saving failed:', cacheError);

//     }

//   }

// }


//     // Set cookies for server-side auth
//     const expires = data.session.expires_at ? new Date(data.session.expires_at * 1000) : undefined;

//     response.cookies.set('sb-access-token', data.session.access_token, { path: '/', httpOnly: true, expires });
//     response.cookies.set('sb-refresh-token', data.session.refresh_token, { path: '/', httpOnly: true, expires });

//     return response;

//   } catch (err: any) {
//     return NextResponse.json({ message: err.message || 'Login failed' }, { status: 500 });
//   }
// }



import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';


export async function POST(req: Request) {

  const supabase = await createSupabaseServerClient();

  try {

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      return NextResponse.json(
        { message: error?.message || 'Login failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: data.user,
      session: data.session,
    });

    // ================================================
    // SET COOKIES FOR SERVER-SIDE AUTHENTICATION
    // ================================================

    const expires = data.session.expires_at
      ? new Date(data.session.expires_at * 1000)
      : undefined;

    response.cookies.set(
      'sb-access-token',
      data.session.access_token,
      {
        path: '/',
        httpOnly: true,
        expires,
      }
    );

    response.cookies.set(
      'sb-refresh-token',
      data.session.refresh_token,
      {
        path: '/',
        httpOnly: true,
        expires,
      }
    );

    return response;

  } catch (err: any) {

    return NextResponse.json(
      { message: err.message || 'Login failed' },
      { status: 500 }
    );

  }

}
