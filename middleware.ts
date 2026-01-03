// @ts-nocheck
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * PRODUCTION-READY MIDDLEWARE FOR ISIAOM FARM TRACKING
 * Solves: 
 * 1. Admin path protection (/admin/*)
 * 2. Allowing public access to /gallery and /
 * 3. Automatic session refresh
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Initialize Supabase Client with SSR Cookie Handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 2. Refresh session and get user data
    // Using getUser() is recommended for secure role-based checks
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()

    // 3. SECURE ROUTING LOGIC
    // Logic: Matcher limits this to /admin/*, but we add a check here for safety.
    if (url.pathname.startsWith('/admin')) {

        // Check Case A: Not logged in
        if (!user) {
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Check Case B: Logged in but NOT an admin
        if (user.user_metadata?.role !== 'admin') {
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    // Allow access to all other pages (including /gallery which is NOT matched by config)
    return response
}

// 4. MATCHER CONFIGURATION
// Ensure this ONLY runs on admin paths to maximize performance for visitors.
export const config = {
    matcher: [
        /*
         * Only apply middleware to paths starting with /admin
         */
        '/admin/:path*',
    ],
}
