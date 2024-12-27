
// Copyright 2024 The Manifold Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {cleanup, getManifoldRuningContext} from './worker';
import cv from "@techstark/opencv-js"
import type { Manifold } from '../public/manifold-encapsulated-types';

const GLOBAL_DEFAULTS = {
  roughness: 0.2,
  metallic: 1,
  baseColorFactor: [1, 1, 1] as [number, number, number],
  alpha: 1,
  unlit: false,
  animationLength: 1,
  animationMode: 'loop' as 'loop' | 'ping-pong'
};

// Setup complete
self.postMessage({
  type: 'ready',
  data: null
});

// if (self.console) {
//   const oldLog = self.console.log;
//   self.console.log = function(...args) {
//     let message = '';
//     for (const arg of args) {
//       if (arg == null) {
//         message += 'undefined';
//       } else if (typeof arg == 'object') {
//         message += JSON.stringify(arg, null, 4);
//       } else {
//         message += arg.toString();
//       }
//     }
//     self.postMessage({log: message});
//     oldLog(...args);
//   };
// }


const context = getManifoldRuningContext();

const viewer = {
  async render(d: Manifold | String | OffscreenCanvas, name = 'main', options: typeof GLOBAL_DEFAULTS = GLOBAL_DEFAULTS) {
    if(d instanceof (context.module.Manifold as any)){
      const output = await context.exportModels(options , d as Manifold);
      self.postMessage({
        type: 'render',
        data: {
          name,
          type:'3d',
          ...output,
        }
      });
    } else if(typeof d === 'string'){
      self.postMessage({
        type: 'render',
        data: {
          name,
          type:'2d',
          data: d,
        }
      });
    } else if(d instanceof OffscreenCanvas){
      const blob = await d.convertToBlob();
      const dataURL = URL.createObjectURL(blob);
      self.postMessage({
        type: 'render',
        data: {
          name,
          type:'2d',
          data: dataURL,
        }
      });
    }
  },
  async clear(){
    self.postMessage({
      type: 'clear'
    });
  },
  async notify(message: {
    [key: string]: any
  }){
    self.postMessage({
      type: 'notify',
      data: message
    });
  }
}


let formListener: (data: any) => void; 
let valueListener: (data: {
  name: string,
  value: any
} ) => void;

let getValueListener: (value) => any;

const form = {
  getValue: async () => {
    return new Promise((resolve) => {
      getValueListener = resolve;
      self.postMessage({type: 'get-form-value'});
    })
  },

  set : (formSettings: any[]) => {
    self.postMessage({type: 'set-form', data:formSettings});
  },
  on: (event: 'submit' | 'change', callback: (data: any) => void) => {
    // formListener = callback;
    if(event === 'submit'){
      formListener = callback;
    }
    if(event === 'change'){
      valueListener = callback;
    }
  }
}

self.onmessage = async (e) => {
  console.log('worker message', e);
  if(!e.data) return;


  if(e.data.type === 'form-submit'){
    
    formListener && formListener(e.data.data);
    return 
  }

  if(e.data.type === 'get-form-value'){
    getValueListener && getValueListener(e.data.data);
    return 
  }

  if(e.data.type === 'form-value-change'){
    valueListener && valueListener(e.data.data);
    return 
  }


  if(e.data.type === 'run'){
    cleanup();

    viewer.clear();

    const jsUrl = e.data.jsUrl;

    const fn = await import(jsUrl);

    jsUrl && URL.revokeObjectURL(jsUrl);

    await fn.default({
      ...context,
      cv,
      viewer,
      form
    });


    viewer.notify({
      kind: 'success',
      title: 'Success running script',
      subtitle: 'The script has been run successfully',
      timeout: 1000
    });

  }

};
