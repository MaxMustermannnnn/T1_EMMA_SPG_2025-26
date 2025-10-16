const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwagrduwnzyiypewoocl.supabase.co'; // Supabase-URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YWdyZHV3bnp5aXlwZXdvb2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTczMzMsImV4cCI6MjA3NjEzMzMzM30.PaOSd6AxNecCJcfVLEKphCfk-WowX7lyhsaPbAMTIdU'; // Supabase Key (aus Dashboard)

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
