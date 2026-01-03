import { createClient } from '@supabase/supabase-js'

// يجب أن يوضع النص داخل علامات اقتباس ' ' وأن يكون رابط API وليس رابط Dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
