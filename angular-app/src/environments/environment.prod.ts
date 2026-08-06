export const environment = {
  production: true,
  /** En Vercel usa build:vercel; en local rellena o exporta SUPABASE_URL y SUPABASE_ANON_KEY. */
  supabaseUrl: '',
  supabaseAnonKey: '',
  /** PENDIENTE (issue #1): URL definitiva de la web de la Fundación Ayúdate.
   * El documento la deja incompleta; mientras esté vacía, el botón de salida no navega. */
  urlFundacion: ''
};
