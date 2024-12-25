import { writable } from 'svelte/store';
import ManifoldWorker from "../worker-wrapper?worker";

export const manifoldWorker = new ManifoldWorker()

const defaultSettings = {
  editor: 'open',
  form: 'close',
  viewer: 'open',
  currentFile: null,
}

// load from url
const url = new URL(window.location.href);
const editor = url.searchParams.get('editor');
const form = url.searchParams.get('form');
const viewer = url.searchParams.get('viewer');
const currentFile = url.searchParams.get('currentFile');

if (editor) defaultSettings.editor = editor;
if (form) defaultSettings.form = form;
if (viewer) defaultSettings.viewer = viewer;
if (currentFile) defaultSettings.currentFile = currentFile;

export const settings = writable(defaultSettings);

settings.subscribe(value => {
  // write to url
  const url = new URL(window.location.href);
  url.searchParams.set('editor', value.editor);
  url.searchParams.set('form', value.form);
  url.searchParams.set('viewer', value.viewer);
  url.searchParams.set('currentFile', value.currentFile);
  window.history.pushState({}, '', url.toString());
})

export function writeSetting(key, value) {
  settings.update(settings => {
    settings[key] = value;
    return settings;
  })
}

export function getSetting(key) {
  let value;
  settings.subscribe(settings => {
    value = settings[key];
  })();
  return value;
}