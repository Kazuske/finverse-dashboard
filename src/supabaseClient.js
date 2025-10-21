import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://idmhvshzmlxqvwfrsozg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbWh2c2h6bWx4cXZ3ZnJzb3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDM5NDYsImV4cCI6MjA3NTkxOTk0Nn0.mpzMcxJ5QeTzTcvrZ9EaBoi2Gi06jk2SPq1IcNdRtgM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

