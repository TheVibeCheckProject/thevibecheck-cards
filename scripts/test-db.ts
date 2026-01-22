
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('Testing connection to Supabase...')

    // Try to fetch templates (public table)
    const { data, error } = await supabase.from('templates').select('*').limit(1)

    if (error) {
        console.error('Connection failed:', error.message)
        // Common error if table doesn't exist yet
        if (error.code === '42P01') {
            console.error('Table "templates" does not exist. Did you run the migrations?')
        }
    } else {
        console.log('Connection successful! Templates table is accessible.')
        console.log('Templates found:', data?.length)
    }
}

testConnection()
