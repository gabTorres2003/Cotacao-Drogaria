import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jvihonrualrgenfahqcg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aWhvbnJ1YWxyZ2VuZmFocWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTAwMTMsImV4cCI6MjA4NDIyNjAxM30.0SwXIWODMp7RudFAv-N0dStlwlovz--JWtUHAmyla5o'

export const supabase = createClient(supabaseUrl, supabaseKey)