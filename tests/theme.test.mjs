import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync(new URL('../dist/theme.js', import.meta.url), 'utf8');
function browser({stored, dark = false, blocked = false} = {}) {
  const listeners = {}, ready = {}, clicks = {}, attrs = {}, meta = {};
  const values = new Map(stored === undefined ? [] : [['mix-atlas-theme', stored]]);
  const root = {dataset: {}};
  const media = {matches: dark, addEventListener: (_, fn) => {listeners.system = fn;}};
  let mounted = false;
  runInNewContext(script, {
    document: {
      documentElement: root,
      querySelector: () => ({setAttribute: (key, value) => {meta[key] = value;}}),
      getElementById: () => mounted ? {
        setAttribute: (key, value) => {attrs[key] = value;},
        addEventListener: (event, fn) => {clicks[event] = fn;},
      } : null,
      addEventListener: (event, fn) => {ready[event] = fn;},
    },
    window: {
      matchMedia: () => media,
      addEventListener: (event, fn) => {listeners[event] = fn;},
    },
    localStorage: {
      getItem: key => {if (blocked) throw Error('Unavailable'); return values.get(key) ?? null;},
      setItem: (key, value) => {if (blocked) throw Error('Unavailable'); values.set(key, value);},
    },
  });
  return {
    root, attrs, meta, values,
    mount: () => {mounted = true; ready.DOMContentLoaded();},
    click: () => clicks.click(),
    system: dark => {media.matches = dark; listeners.system();},
    storage: key => listeners.storage({key}),
  };
}

test('first paint follows device appearance, including subsequent system changes', () => {
  const b = browser({dark: true});
  assert.equal(b.root.dataset.theme, 'dark');
  assert.equal(b.meta.content, '#171717');
  b.mount();
  assert.equal(b.attrs['aria-pressed'], 'true');
  b.system(false);
  assert.equal(b.root.dataset.theme, 'light');
  assert.equal(b.attrs['aria-pressed'], 'false');
  assert.equal(b.meta.content, '#ffffff');
  assert.equal(b.values.size, 0);
});

test('explicit choice survives reload and overrides device changes without altering music or language', () => {
  const b = browser({stored: 'light', dark: true});
  b.values.set('olander-atlas-language', 'ko');
  b.values.set('olander-atlas-v1', 'music');
  b.mount();
  assert.equal(b.root.dataset.theme, 'light');
  b.click();
  assert.equal(b.root.dataset.theme, 'dark');
  assert.equal(b.values.get('mix-atlas-theme'), 'dark');
  b.system(false);
  assert.equal(b.root.dataset.theme, 'dark');
  assert.equal(browser({stored: b.values.get('mix-atlas-theme')}).root.dataset.theme, 'dark');
  b.click();
  assert.equal(b.root.dataset.theme, 'light');
  assert.equal(b.values.get('olander-atlas-language'), 'ko');
  assert.equal(b.values.get('olander-atlas-v1'), 'music');
});

test('cross-tab preferences and removal return to the current device setting', () => {
  const b = browser({stored: 'invalid'});
  b.mount();
  assert.equal(b.root.dataset.theme, 'light');
  b.values.set('mix-atlas-theme', 'dark');
  b.storage('mix-atlas-theme');
  assert.equal(b.root.dataset.theme, 'dark');
  b.system(false);
  assert.equal(b.root.dataset.theme, 'dark');
  b.values.delete('mix-atlas-theme');
  b.storage(null);
  assert.equal(b.root.dataset.theme, 'light');
  b.system(true);
  assert.equal(b.root.dataset.theme, 'dark');
});

test('blocked storage keeps appearance usable for the current visit', () => {
  const b = browser({blocked: true, dark: true});
  b.mount();
  b.click();
  assert.equal(b.root.dataset.theme, 'light');
  assert.equal(b.attrs['aria-pressed'], 'false');
  b.system(true);
  assert.equal(b.root.dataset.theme, 'light');
});
