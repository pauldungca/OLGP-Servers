import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yuqbklbxykwtgnsxzzfp.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cWJrbGJ4eWt3dGduc3h6emZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjkzNzYsImV4cCI6MjA2MzQwNTM3Nn0.y_F175mL4AEXjFd_6nIL3NexmwWvNpW7aErTuWDR7Sg";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
