import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const location = useLocation()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // Check if user is logged in and is an admin
            if (user && user.user_metadata?.role === 'admin') {
                setUser(user)
            } else {
                setUser(null)
            }
            setLoading(false)
        }

        checkUser()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        // Redirect to home if not admin or not logged in
        return <Navigate to="/" state={{ from: location }} replace />
    }

    return <>{children}</>
}
