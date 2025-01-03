<script lang="ts">
  import Editor from "./lib/Editor.svelte";
  import ModelViewer from "./lib/ModelViewer.svelte";

  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";

  import { Button, Modal } from "carbon-components-svelte";
  import ts from "typescript";
  import { addNotification, getSetting, manifoldWorker, settings, writeSetting } from "./lib/stores";

  import { Header, SkipToContent, Content } from "carbon-components-svelte";
  import InstallConfirm from "./lib/Installer.svelte";
  import Installer from "./lib/Installer.svelte";
  import { ts2js } from "./lib/lang";
  import Notification from "./lib/Notification.svelte";
  import FileTree from "./lib/FileTree.svelte";

  let isSideNavOpen = getSetting("editor") === "open";

  let open = true;

  console.log(isSideNavOpen);

  let logs = [];
  let tempLogs = [];

  let manifoldInitialized = false;

  function finishRun() {
    logs = tempLogs;
    tempLogs = [];
  }

  let workerLoaded = null;
  let workerLoadedProms = new Promise((resolve, reject) => {
    workerLoaded = resolve;
  });

  let models = {};

  manifoldWorker.onerror = function (e) {
    console.error(e);
    finishRun();
  };

  manifoldWorker.onmessage = function (e) {
    if (e.data.type == "ready") {
      if (!manifoldInitialized) {
        workerLoaded();
      }
      manifoldInitialized = true;
      return;
    }

    if (e.data.log != null) {
      tempLogs.push(e.data.log);
      return;
    }

    if (e.data.type === "render") {
      const model = e.data.data;

      const oldModel = models[model.name];

      models[model.name] = model;

      if (oldModel && oldModel.type === "3d") {
        URL.revokeObjectURL(oldModel.glbURL);
        URL.revokeObjectURL(oldModel.threeMFURL);
      }
    }

    if (e.data.type === "clear") {
      models = {};
    }

    if (e.data.type === "notify") {
      addNotification(e.data.data);
    }

    finishRun();
  };



  async function runCode(event) {
    await workerLoadedProms;

    Object.keys(models).forEach((key) => {
      const model = models[key];
      if (model.type === "3d") {
        URL.revokeObjectURL(model.glbURL);
        URL.revokeObjectURL(model.threeMFURL);
      }
    });
    models = {};

    const code = await ts2js(event.detail.value);
    const blob = new Blob([code], { type: "application/javascript" });
    const jsUrl = URL.createObjectURL(blob);

    manifoldWorker.postMessage({
      type: "run",
      jsUrl,
    });
  }


  settings.subscribe((val) => {
    const { editor } = val;
    if (editor === "open") {
      isSideNavOpen = true;
    } else {
      isSideNavOpen = false;
    }
  });

  function handleSideNavOpen() {
    isSideNavOpen = !isSideNavOpen;
    writeSetting("editor", isSideNavOpen ? "open" : "closed");
  }


  $: editorStyle = `
    height: 100%;
    overflow: hidden;
    width: ${isSideNavOpen ? "30%" : "0%"};
  `;

</script>

<Installer />

<Header company="Manifold" platformName="Studio">
  <svelte:fragment slot="skip-to-content">
    <SkipToContent />
  </svelte:fragment>
</Header>

<Content style="flex:1; padding: 0;display:flex;flex-direction:row; width: 100vw;">

  <div style="height: 100%;width: 20rem; ">
    <FileTree></FileTree>
  </div>

  <Editor style={editorStyle} on:run={runCode} />

  <div style="width:2rem;overflow:visible;z-index:999">
    <Button
      style="height: 100%;width:100%;"
      kind="ghost"
      size="small"
      tooltipPosition="right"
      iconDescription="Toggle Editor"
      on:click={handleSideNavOpen}
      icon={!isSideNavOpen ? ChevronRight : ChevronLeft}
    />
  </div>

  <ModelViewer
    style="height: 100%;flex:1;display:flex;flex-direction:column;"
    {logs}
    {models}
  />
</Content>


<Notification/>

<style>
</style>
