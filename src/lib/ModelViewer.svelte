<script lang="ts">
  import "@google/model-viewer";
  import { Button, ButtonSet } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import Rotate from "carbon-icons-svelte/lib/Rotate.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte";
  import DymForm from "./DymForm.svelte";
  import { settings, writeSetting } from "./stores";


  let viewer: HTMLElement;
  export let style = "";



  let autoRotate = false;
  export let logs = [] as string[];

  let selected = 'main'
  export let models = {} as {
    [key: string]: {
      name: string;
      type: '3d'
      glbURL: string;
      threeMFURL: string;
    }
  } | {
    [key: string]: {
      name: string;
      type: '2d'
      data: string;
    }
  };

  $: modelList = Object.keys(models).map((key) => models[key]);


  function download3mf() {
    const model = models[selected];
    if (!model || model.type !== '3d') {
      return;
    }

    const a = document.createElement("a");
    a.href = model.threeMFURL;
    a.download = `${selected}.3mf`;
    a.click();
  }

  function downloadGlb() {
    const model = models[selected];
    if (!model || model.type !== '3d') {
      return;
    }

    const a = document.createElement("a");
    a.href = model.glbURL;
    a.download = `${selected}.glb`;
    a.click();
  }

  function downloadImage() {
    const model = models[selected];
    if (!model || model.type !== '2d') {
      return;
    }

    const a = document.createElement("a");
    a.href = model.data;
    a.download = `${selected}.png`;
    a.click();
  }

  let showLogs = false;
  function toggleShowLogs() {
    showLogs = !showLogs;
  }

  let isSideNavOpen = false;
  settings.subscribe((val) => {
    const { form } = val;
    if (form === 'open'){
      isSideNavOpen = true;
    }else{
      isSideNavOpen = false;
    }
  });

  function handleSideNavOpen(){
    isSideNavOpen = !isSideNavOpen;
    writeSetting("form", isSideNavOpen ? 'open' : 'closed');
  }

  function getGlbUrl(selected: string) {
    const model = models[selected];
    if (!model || model.type !== '3d') {
      return '';
    }

    return model.glbURL;
  }

  function getThreeMFUrl(selected: string) {
    const model = models[selected];
    if (!model || model.type !== '3d') {
      return '';
    }

    return model.threeMFURL;
  }

  function getImageViewerUrl(selected: string) {
    const model = models[selected];
    if (!model || model.type !== '2d') {
      return '';
    }

    return model.data;
  }

  

  $: formStyle = `height: 100%;width: ${isSideNavOpen ? "30%" : "0%"}; overflow: hidden;`;


</script>

<div {style}>
 

  <div style="height: 100%;width: 100%;display:flex;">
    <div style={formStyle} class="transition-all duration-300 ease-in-out">
      <DymForm></DymForm>
    </div>

    <Button style="height: 100%;width:2rem;"
      kind="tertiary"
      size="small"
      tooltipPosition="right"
      iconDescription="Toggle Form"
      on:click={handleSideNavOpen}
      icon={!isSideNavOpen ? ChevronRight : ChevronLeft}
    />

    <div style="height: 100%;width: 100%;display:flex;flex-direction:column;">
      <ButtonSet style="width: 100%; overflow: auto;">
        {#each modelList as model, key (model.name)}
          <Button style="pointer-events: auto;width: 100%;  width: 6rem;"
            size="small"
            kind={selected === model.name ? "primary" : "ghost"}
            on:click={() => {
              selected = model.name;
            }}
          >
            {model.name}
          </Button>
          
        {/each}
      </ButtonSet>

      {#if !models[selected]}
        No model selected
      {:else if models[selected].type === '3d'}
        <model-viewer
          style="width: 100%;flex:1;"
          {...{
            "auto-rotate": autoRotate ? true : undefined,
          }}
          auto-rotate-delay={1}
          interaction-prompt="none"
          src={getGlbUrl(selected)}
          camera-controls
          bind:this={viewer}
        ></model-viewer>
      {:else if models[selected].type === '2d'}
        <div style="width: 100%;flex:1;background-image: url({getImageViewerUrl(selected)});background-size: contain;background-repeat: no-repeat;background-position: center;"></div>
      {/if}

    </div>
  </div>



  <div
    style="position: relative; display:flex; 
    flex-direction: row-reverse;
    pointer-events: none;
    width: 100%; height:0rem; top: -3rem; left: 0rem; z-index: 1000; float: right;"
  >
    <ButtonSet style="height: 3rem">
      {#if models[selected]?.type === '3d'}
        <Button
          style="pointer-events: auto;width: 3rem; "
          kind={autoRotate ? "primary" : "ghost"}
          iconDescription="Auto Rotate"
          tooltipPosition="top"
          icon={Rotate}
          on:click={() => {
            autoRotate = !autoRotate;
          }}
        />
        <Button
          style="pointer-events: auto;width: 6rem;"
          kind="primary"
          iconDescription="Download glb"
          tooltipPosition="top"
          icon={Download}
          disabled={!getGlbUrl(selected)}
          on:click={downloadGlb}
        >
          glb
        </Button>


        <Button
          style="pointer-events: auto;width: 6rem;"
          kind="primary"
          iconDescription="Download 3MF"
          tooltipPosition="top"
          icon={Download}
          disabled={!getThreeMFUrl(selected)}
          on:click={download3mf}
        >
          3MF
        </Button>


      {:else if models[selected]?.type === '2d'}

        <Button
          style="pointer-events: auto;width: 6rem;"
          kind="primary"
          iconDescription="Download Image"
          tooltipPosition="top"
          icon={Download}
          disabled={!getImageViewerUrl(selected)}
          on:click={downloadImage}
        >
          Image
        </Button>
      {/if}
    </ButtonSet>

  </div>
</div>

<style>
  .transition-all {
    transition-property: all;
  }
  .duration-300 {
    transition-duration: 300ms;
  }
  .ease-in-out {
    transition-timing-function: ease-in-out;
  }
</style>
