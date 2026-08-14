
import { createClient } from '@supabase/supabase-js'

const supabaseUrl ='https://vydguuxhbtaofsaubgqi.supabase.co'
const supabaseKey ='sb_publishable_OkneB-Xmpf-nnIUCSd8ekw_uQ9u8a0Y'

export const supabase = createClient(supabaseUrl, supabaseKey)