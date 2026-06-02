import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mtpboiuvqfunbdcdsaug.supabase.co' // CAMBIAR
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cGJvaXV2cWZ1bmJkY2RzYXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MzU2NDEsImV4cCI6MjA5NjAxMTY0MX0.4FP6ZQpiZSBx1XtXpl1D40TSkWujsbjDvEeBQj3hROE' // CAMBIAR

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
