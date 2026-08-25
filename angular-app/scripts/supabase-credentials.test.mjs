import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACEHOLDER_SUPABASE,
  esPlaceholderKey,
  esPlaceholderUrl,
  credencialesSupabaseValidas
} from './supabase-credentials.mjs';

describe('placeholders', () => {
  it('reconoce la URL de plantilla', () => {
    assert.equal(esPlaceholderUrl('https://TU-PROYECTO.supabase.co'), true);
    assert.equal(esPlaceholderUrl(PLACEHOLDER_SUPABASE.url), true);
  });

  it('reconoce otras variantes de URL de plantilla', () => {
    assert.equal(esPlaceholderUrl('https://your-project.supabase.co'), true);
    assert.equal(esPlaceholderUrl('https://xxxxx.supabase.co'), true);
    assert.equal(esPlaceholderUrl(''), true);
    assert.equal(esPlaceholderUrl('   '), true);
  });

  it('no confunde una URL real con la de plantilla', () => {
    assert.equal(esPlaceholderUrl('https://kpkrriyluwbcajqmlfiw.supabase.co'), false);
  });

  it('reconoce la clave de plantilla', () => {
    assert.equal(esPlaceholderKey('sb_publishable_...'), true);
    assert.equal(esPlaceholderKey(PLACEHOLDER_SUPABASE.key), true);
    assert.equal(esPlaceholderKey(''), true);
  });

  it('no confunde una clave publicable real con la de plantilla', () => {
    assert.equal(esPlaceholderKey('sb_publishable_2Dc2TkYvxowdkRAMEWb93g_i8Wiivbn'), false);
  });
});

describe('credencialesSupabaseValidas', () => {
  it('acepta URL y clave con forma real', () => {
    assert.equal(
      credencialesSupabaseValidas({
        url: 'https://kpkrriyluwbcajqmlfiw.supabase.co',
        key: 'sb_publishable_2Dc2TkYvxowdkRAMEWb93g_i8Wiivbn'
      }),
      true
    );
  });

  it('rechaza el placeholder de .env.example tal cual', () => {
    assert.equal(
      credencialesSupabaseValidas({ url: PLACEHOLDER_SUPABASE.url, key: PLACEHOLDER_SUPABASE.key }),
      false
    );
  });

  it('rechaza cuando faltan por completo', () => {
    assert.equal(credencialesSupabaseValidas({}), false);
    assert.equal(credencialesSupabaseValidas({ url: '', key: '' }), false);
  });

  it('rechaza si solo una de las dos es de plantilla', () => {
    assert.equal(
      credencialesSupabaseValidas({
        url: 'https://kpkrriyluwbcajqmlfiw.supabase.co',
        key: 'sb_publishable_...'
      }),
      false
    );
  });
});
