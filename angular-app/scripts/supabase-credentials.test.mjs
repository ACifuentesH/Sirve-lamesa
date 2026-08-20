import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPABASE_PROYECTO,
  esPlaceholderKey,
  esPlaceholderUrl,
  resolverCredencialesSupabase
} from './supabase-credentials.mjs';

describe('resolverCredencialesSupabase', () => {
  it('deja pasar URL y clave publicable reales', () => {
    const resuelto = resolverCredencialesSupabase({
      url: SUPABASE_PROYECTO.url,
      key: SUPABASE_PROYECTO.anonKey
    });
    assert.equal(resuelto.usoRespaldo, false);
    assert.equal(resuelto.url, SUPABASE_PROYECTO.url);
    assert.equal(resuelto.key, SUPABASE_PROYECTO.anonKey);
  });

  it('sustituye el .env.example copiado tal cual', () => {
    const resuelto = resolverCredencialesSupabase({
      url: 'https://TU-PROYECTO.supabase.co',
      key: 'sb_publishable_...'
    });
    assert.equal(resuelto.usoRespaldo, true);
    assert.equal(resuelto.url, SUPABASE_PROYECTO.url);
    assert.equal(resuelto.key, SUPABASE_PROYECTO.anonKey);
  });

  it('sustituye cadenas vacías', () => {
    const resuelto = resolverCredencialesSupabase({ url: '', key: '  ' });
    assert.equal(resuelto.usoRespaldo, true);
    assert.equal(resuelto.url, SUPABASE_PROYECTO.url);
  });
});

describe('placeholders', () => {
  it('reconoce la URL de plantilla', () => {
    assert.equal(esPlaceholderUrl('https://TU-PROYECTO.supabase.co'), true);
    assert.equal(esPlaceholderUrl(SUPABASE_PROYECTO.url), false);
  });

  it('reconoce la clave de plantilla y no la publicable real', () => {
    assert.equal(esPlaceholderKey('sb_publishable_...'), true);
    assert.equal(esPlaceholderKey(SUPABASE_PROYECTO.anonKey), false);
  });
});
