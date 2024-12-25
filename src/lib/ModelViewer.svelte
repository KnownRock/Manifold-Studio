<script lang="ts">
  import "@google/model-viewer";
  import { Button, ButtonSet } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import Rotate from "carbon-icons-svelte/lib/Rotate.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte";
  import DymForm from "./DymForm.svelte";


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
  }

  $: modelList = Object.keys(models).map((key) => models[key]);


  function download3mf() {
    const a = document.createElement("a");
    a.href = models[selected]?.threeMFURL;
    a.download = `${selected}.3mf`;
    a.click();
  }

  function downloadGlb() {
    const a = document.createElement("a");
    a.href = models[selected]?.glbURL;
    a.download = `${selected}.glb`;
    a.click();
  }

  function downloadImage() {
    const a = document.createElement("a");
    a.href = models[selected]?.data;
    a.download = `${selected}.png`;
    a.click();
  }

  let showLogs = false;
  function toggleShowLogs() {
    showLogs = !showLogs;
  }

  const query = new URLSearchParams(window.location.search);
  let isSideNavOpen = query.get("form") === "open";

  $: formStyle = `height: 100%;width: ${isSideNavOpen ? "30%" : "0%"}; overflow: hidden;`;

  $: {
    const url = new URL(window.location.href);
    url.searchParams.set("form", isSideNavOpen ? "open" : "closed");
    window.history.replaceState({}, "", url);
  }

</script>

<div {style}>
 

  <div style="height: 100%;width: 100%;display:flex;">
    <div style={formStyle} class="transition-all duration-300 ease-in-out">
      <DymForm></DymForm>
    </div>

    <Button style="height: 100%;width:2rem;"
      kind="ghost"
      size="small"
      tooltipPosition="right"
      iconDescription="Toggle Form"
      on:click={() => {
        isSideNavOpen = !isSideNavOpen;
      }}
      icon={!isSideNavOpen ? ChevronRight : ChevronLeft}
    />

    <div style="height: 100%;width: 100%;display:flex;flex-direction:column;">
      <ButtonSet>
        {#each modelList as model, key (model.name)}
          <Button style="pointer-events: auto;width: 100%;"
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
          src={models[selected]?.glbURL || ""}
          camera-controls
          bind:this={viewer}
        ></model-viewer>
      {:else if models[selected].type === '2d'}
        <div style="width: 100%;flex:1;background-image: url({models[selected]?.data || ""});background-size: contain;background-repeat: no-repeat;background-position: center;"></div>
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
          disabled={!models[selected]?.glbURL}
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
          disabled={!models[selected]?.threeMFURL}
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
          disabled={!models[selected]?.data}
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
