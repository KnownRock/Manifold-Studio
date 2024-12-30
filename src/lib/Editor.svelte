<script lang="ts">
  import { Button, ButtonSet } from "carbon-components-svelte";
  import Play from "carbon-icons-svelte/lib/Play.svelte";
  import Automatic from "carbon-icons-svelte/lib/Automatic.svelte";
  import * as monaco from "monaco-editor";
  import localforage from "localforage";
  // emit event to parent component
  import { createEventDispatcher } from "svelte";

  import {addNotification, getSetting, writeSetting} from "./stores";

  const dispatch = createEventDispatcher();

  // https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md
  // https://github.com/vitejs/vite/discussions/1791
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";


  // import test from "../../public/test.ts?raw";
  // /editor.d.ts import it as text

  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === "typescript" || label === "javascript") {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };

  import { onMount } from "svelte";
  import FileTree from "./FileTree.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import { currentFile, fsChanged, getFileName, getItem, getPathType, hasItem, setItem, updateIndex } from "./localFs";

  let editor: monaco.editor.IStandaloneCodeEditor;
  let container: HTMLDivElement;

  export let style = "";

  async function getEditorDTS() {
    const global = await fetch("/editor.d.ts").then((response) =>
      response.text(),
    );
    return `${global.replace(/^import.*$/gm, "")}`;
  }



  async function getCvDTS() {
    const global = await fetch("/cv.d.ts").then((response) =>
      response.text(),
    );

    const d = `${
    global.replace(/^import.*$/gm, "")
      .replaceAll("export", "")
      .replaceAll("declare", "")
      .replaceAll("namespace _cv {", "declare namespace cv { export")
    }
    
    `

    return d;
  }

  async function getManifoldDTS() {
    // const global = await fetch("/manifold-global-types.d.ts").then((response) =>
    //   response.text(),
    // );
    const global = await import("../../public/manifold-global-types.d.ts?raw");

    // const encapsulated = await fetch("/manifold-encapsulated-types.d.ts").then(
    //   (response) => response.text(),
    // );
    const encapsulated = await import("../../public/manifold-encapsulated-types.d.ts?raw");

    return `
      declare namespace ManifoldNamespace {
        ${global.default.replaceAll("export", "")}
        ${encapsulated.default.replace(/^import.*$/gm, "").replaceAll("export", "").replaceAll("declare", "")}
      }
      `;
  }

  let editorInitedSolver = null
  const editorInited = new Promise((resolve, reject) => {
    editorInitedSolver = resolve;
  });


  onMount(async () => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      await getEditorDTS(),
    );

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      await getManifoldDTS(),
    );

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      await getCvDTS(),
    );

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `

      type FormSettings = {
          [key: string]: any;
          cType: "Form" | "FormGroup" | "Checkbox" | "RadioButtonGroup" | "RadioButton" | "Select" | "SelectItem" | "Button" | "FileUploader";
          children?: FormSettings[];
      }


      declare type FunctionParsType = typeof ManifoldNamespace & {
        cv: typeof cv;
      } & {
        viewer: {
          render: (manifold: ManifoldNamespace.Manifold | String | OffscreenCanvas, name = 'main') => Promise<void>;
          clear: () => void;
          notify: (data: { 
            title?: string; 
            subtitle?: string; 
            kind?: 'success' | 'error' | 'info' | 'warning'; 
            timeout?: number;
            [key: string]: any;
          }) => void;
        }
      } & {
       form : {
        set : (formSettings: FormSettings[]) => void;
        on: (event: 'submit' | 'change', callback: (data: any) => void) => void;
        getValue : () => {
          [key: string]: any;
        }
      }
    }

        
      `,
    );

    // monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    //   target: monaco.languages.typescript.ScriptTarget.ESNext,
    //   allowNonTsExtensions: true,
    //   moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    //   module: monaco.languages.typescript.ModuleKind.CommonJS,
    //   typeRoots: ["node_modules/@types"],
    //   allowJs: true,
    //   checkJs: true,
    //   noEmit: true,
    //   esModuleInterop: true
    // });

    editor = monaco.editor.create(
      container,
      {
        // value: [
        //   "const {cube,sphere} = Manifold;",
        //   "export default async function() {",
        //   "  const box = cube([100, 100, 100], true)",
        //   "  const ball = sphere(60, 100)",
        //   "  return box.subtract(ball)",
        //   "}",
        // ].join("\n"),
        value: '',

        language: "typescript",
        theme: "vs-dark",
        fontSize: 16,
        automaticLayout: true,
        
      }
    );

    

    editor.onDidChangeModelContent(() => {
      if (autoRun) {
        checkCodeRun();
      }
    });



    checkCodeRun();

    editorInitedSolver(editor);

    // const fileNameRaw = await getSetting("currentFile");
    // if(fileNameRaw){
    //   loadFile(fileNameRaw);
    // }
 
  });

  // let currentFile = "";

  let autoRun = true;

  function toggleAutoRun() {
    autoRun = !autoRun;
  }

  // let nowMarkers = [];

  // https://stackoverflow.com/questions/43463344/getting-errors-from-monaco-editor
  // monaco.editor.onDidChangeMarkers(([uri]) => {
  //   const model = monaco.editor.getModel(uri);
  //   if (model) {
  //     const markers = monaco.editor.getModelMarkers({ resource: uri });
  //     // console.log(markers);

  //     // nowMarkers = markers;
  //     if(markers.filter((marker) => marker.severity === 8).length === 0) {
  //       checkCodeRun();
  //     }
  //   }
  // });



  monaco.languages.typescript.typescriptDefaults.onDidChange(() => {
    console.log("onDidChangeDiagnostics");
    // checkCodeRun();
  });

  function checkCodeRun() {
    const value = editor.getValue();
    dispatch("run", { value });
  }

  let innerCurrentFile = null;
  currentFile.subscribe(async (val) => {
    console.log(val);

    if(val === innerCurrentFile){
      return;
    }

    innerCurrentFile = val;

    if(hasItem(val) && getPathType(val) === "file"){
      const fileName = getFileName(val);

      if(fileName === '__index__'){
        // change mode to json
        await editorInited;
        monaco.editor.setModelLanguage(editor.getModel(), "json");

      }else{
        // change mode to typescript
        await editorInited;
        monaco.editor.setModelLanguage(editor.getModel(), "typescript");
      }

      enableEditor();
      loadFile(val);
    }else{
      disableEditor();
      clearEditor();
    }
  });


  fsChanged.subscribe(async () => {
    loadFile(innerCurrentFile);
  });


  async function loadFile(fileNameRaw) {
    const value = await getItem(fileNameRaw)
    await editorInited;
    editor.setValue(value as string || "");
  }

  async function saveFile(fileNameRaw) {

    await setItem(fileNameRaw, editor.getValue());
    await updateIndex(fileNameRaw);

    addNotification({
      title: "File Saved",
      kind: "success",
    });
  }

  async function clearEditor() {
    await editorInited;
    editor.setValue("");
  }

  async function disableEditor() {
    await editorInited;
    editor.updateOptions({ readOnly: true });
  }

  async function enableEditor() {
    await editorInited;
    editor.updateOptions({ readOnly: false });
  }

</script>

<div {style} class="transition-all duration-500 ease-in-out">
  

  <div style="height: 100%;display:flex; overflow: hidden;">

    
    <div bind:this={container} style="height: 100%;width: 100%;"></div>
  </div>


  <div style="position: relative; display:flex; 
    flex-direction: row-reverse;
    pointer-events: none;
    width: 100%; height:3rem; top: -3rem; left: -1rem; z-index: 1000; float: right;">


      

    <Button 
      style="pointer-events: auto;"
      disabled={autoRun} 
      on:click={checkCodeRun}
      kind="primary" iconDescription="Run" tooltipPosition="top" icon={Play} />
    <Button 
      style="pointer-events: auto;"
      isSelected={autoRun} on:click={toggleAutoRun}
      kind={autoRun ? "primary" : "ghost"}
      iconDescription="Auto Run" tooltipPosition="top" icon={Automatic} />

      
    <!-- save -->
    <Button 
      style="pointer-events: auto;"
      disabled={!hasItem(innerCurrentFile) || getPathType(innerCurrentFile) !== "file"}
      on:click={() => saveFile(innerCurrentFile)}
      kind="primary" iconDescription="Save" tooltipPosition="top" icon={Save} />
  </div>




</div>

<style>
  .transition-all {
    transition-property: all;
  }

  .duration-500 {
    transition-duration: 500ms;
  }

  .ease-in-out {
    transition-timing-function: ease-in-out;
  }
</style>
