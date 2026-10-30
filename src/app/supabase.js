import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ddjmutaiajuoriotfwwr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkam11dGFpYWp1b3Jpb3Rmd3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMjA3MDUsImV4cCI6MjEwODg5NjcwNX0.XZ8ZNGrGlbnSismaobYBQNPP4wbEDqIvvFqS7-osi5E'

export const supabase = createClient(supabaseUrl, supabaseKey)

