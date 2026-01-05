import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase' // تغيير من @ إلى مسار نسبي لضمان التوافق

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading')

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession()

                // Double check user metadata for admin role
                if (session?.user?.user_metadata?.role === 'admin') {
                    console.log("Auth: Access Granted");
                    setStatus('authorized')
                } else {
                    console.warn("Auth: Access Denied. Role:", session?.user?.user_metadata?.role);
                    setStatus('unauthorized')
                }
            } catch (err) {
                console.error("Auth Exception:", err);
                setStatus('unauthorized')
            }
        }

        checkAuth()
    }, [])

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-400 font-black text-xs uppercase tracking-widest">Verifying Admin Access...</p>
            </div>
        )
    }

    if (status === 'unauthorized') {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
