import { createClient } from '@supabase/supabase-js'

// Doit être entouré de guillemets '' et correspondre à l'URL de l'API (pas l'URL du tableau de bord Supabase)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
