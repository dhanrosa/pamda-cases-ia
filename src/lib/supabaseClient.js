const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'catalogo-pamdacases';

export const supabaseConfigStatus = {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
};

export const supabaseConfig = {
  url: supabaseUrl || '',
  anonKey: supabaseAnonKey || '',
  bucket: supabaseBucket,
};
