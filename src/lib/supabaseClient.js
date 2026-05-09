const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'catalogo-pamdacases';
const supabaseCatalogFolder =
  import.meta.env.VITE_SUPABASE_CATALOG_FOLDER || 'CATALOGO LOJAS';

export const supabaseConfigStatus = {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  hasBucket: Boolean(supabaseBucket),
  hasCatalogFolder: Boolean(supabaseCatalogFolder),
};

export const supabaseConfig = {
  url: supabaseUrl || '',
  anonKey: supabaseAnonKey || '',
  bucket: supabaseBucket,
  catalogFolder: supabaseCatalogFolder,
};
