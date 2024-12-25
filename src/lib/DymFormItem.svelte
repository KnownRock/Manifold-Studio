
<script lang="ts">
  import componentDict from "./FormComponentDict";

  export let children = []

  // import { createEventDispatcher } from "svelte";

  export let handleValueChange = (e: {
    name: string;
    value: any;
  }) => {}

</script>

{#each children as item}
  {#if componentDict[item.cType]}
    <svelte:component this={componentDict[item.cType]} {...item}
      on:change={(e)=>{
        const value = e.detail
        handleValueChange({
          name: item.name,
          value
        })
          
      }}
    >
      {#if item.children}
        <svelte:self 
          children={item.children}
          handleValueChange={handleValueChange}
        ></svelte:self>
      {/if}

      {#if item.text}
        {item.text}
      {/if}
    </svelte:component>
  {/if}
{/each}
