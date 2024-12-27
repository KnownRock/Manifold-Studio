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
// const editor = url.searchParams.get('editor');
// const form = url.searchParams.get('form');
// const viewer = url.searchParams.get('viewer');
const { editor, form, viewer } = JSON.parse(localStorage.getItem('settings')) || {};

const currentFile = url.searchParams.get('currentFile');
const install = url.searchParams.get('install');

// if (editor) defaultSettings.editor = editor;
// if (form) defaultSettings.form = form;
// if (viewer) defaultSettings.viewer = viewer;
// if (currentFile) defaultSettings.currentFile = currentFile;

export const settings = writable({
  ...defaultSettings,
  editor: editor || defaultSettings.editor,
  form: form || defaultSettings.form,
  viewer: viewer || defaultSettings.viewer,
  currentFile: currentFile || defaultSettings.currentFile,
  install: install || null,
});

settings.subscribe(value => {
  // write to url
  const url = new URL(window.location.href);
  // url.searchParams.set('editor', value.editor);
  // url.searchParams.set('form', value.form);
  // url.searchParams.set('viewer', value.viewer);

  localStorage.setItem('settings', JSON.stringify({
    editor: value.editor,
    form: value.form,
    viewer: value.viewer,
  }));

  url.searchParams.set('currentFile', value.currentFile);
  url.searchParams.set('install', value.install);
  if(!value.install) url.searchParams.delete('install');
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


export const notifications = writable([])
let notificationId = 0;

export function addNotification(notification) {
  notifications.update(notifications => {
    notifications.push({
      lowContrast:true,
      caption:new Date().toLocaleString(),
      timeout: 5000,
      ...notification,
      id: notificationId++,
    });
    return notifications;
  })
}

export function removeNotification(id) {
  notifications.update(notifications => {
    return notifications.filter(n => n.id !== id);
  })
}

