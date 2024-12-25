<script lang="ts">
  import { Button, ButtonSet, TextInput, TreeView , toHierarchy } from "carbon-components-svelte";
  let activeId = 0;
  let selectedIds = [];
  let nodes = [];

  import VmdkDisk from "carbon-icons-svelte/lib/VmdkDisk.svelte";

  // add icon
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";

  import { onMount } from "svelte";

  import { createEventDispatcher } from "svelte";
  import { getSetting } from "./stores";
  import { getAll, hasItem, removeItem, setItem } from "./localFs";

  const dispatch = createEventDispatcher();

  let treeOffset = 0;

  async function freshenLocalFileDrivers() {
    const files = await getAll()

    nodes = files.map((file) => {
      return {
        id: file.name,
        text: file.type === 'driver' ? file.name : file.name.split(":")[1],
        type: file.type,
        icon: file.type === 'driver' ? VmdkDisk : null,
        pid: file.type === 'file' ? file.driver : null
      };
    });

  }

  onMount(() => {
    const tree = document.getElementById("file-tree");
    treeOffset = tree.offsetTop;

    window.addEventListener("resize", () => {
      treeOffset = tree.offsetTop;
    });

    freshenLocalFileDrivers();

    
    setTimeout(() => {
      treeview?.expandNodes((node) => node.id === "Local");
      const select = getSetting("currentFile");
      selectedIds = select ? [select] : [];
    }, 1000);

  });


  $: treeHeight = `calc(100vh - ${treeOffset}px)`;

  const isDeletingDict = {};
  const isNameEditingDict = {};
  
  $: nodeTypeDict = Object.fromEntries(nodes.map(driver => [driver.id, driver.type]))

  let treeview = null;

  function setNodeProps(node, props) {
    const index = nodes.findIndex((n) => n.id === node.id);
    nodes[index] = {
      ...nodes[index],
      ...props,
    };

    nodes = [...nodes];
  }

  let tempNodeName = "new";
  let tempNodeDriver = "Local";



  function handleNodeSelect(nodeId) {
    const selectedNode = nodes.find((node) => node.id === nodeId);
    dispatch("select", selectedNode);
  }


  $: selectedIds.length == 1 && handleNodeSelect(selectedIds[0]);


</script>


<TreeView
  bind:this={treeview}
  id="file-tree"
  size="compact"
  style="overflow: visible; max-height: {treeHeight}"
  labelText="File Tree"
  nodes={toHierarchy(nodes, node=>node.pid)}
  bind:activeId
  bind:selectedIds
  on:select={({ detail }) => console.log("select", detail)}
  on:toggle={({ detail }) => console.log("toggle", detail)}
  on:focus={({ detail }) => console.log("focus", detail)}
>
  <div slot="default"
 
  let:node 
  style="
    width: 100%; display: flex; align-items: center; overflow: visible;
    justify-content: space-between;  flex:1;
  ">
    {#if isNameEditingDict[node.id]}
      <TextInput
        size="sm"
        style="width: 100%;"

        value={node.text}
        on:input={(e) => {
          tempNodeName = e.detail;
        }}
        on:keydown={async (e) => {
          if (e.key === "Enter") {
            e.stopPropagation();

            // debugger
  
            
            if (nodes.find((n) => n.id === tempNodeName)) {
              return;
            }

            if(await hasItem(`${tempNodeDriver}:${tempNodeName}`)){
              console.log("File already exists");
              return;
            }

            isNameEditingDict[node.id] = false;
            await setItem(`${tempNodeDriver}:${tempNodeName}`, "");



            handleNodeSelect(tempNodeDriver + ':' + tempNodeName);

            freshenLocalFileDrivers();

            
          }
        }}
      />
    {/if}

    {#if !isNameEditingDict[node.id]}
      <div style="margin-left: 1rem; width:100%;">{node.text}</div>
    {/if}

    <ButtonSet style="position: relative; display: flex; flex-direction: row; "  on:click={(e)=>e.stopPropagation()}>

      {#if nodeTypeDict[node.id] === 'driver'}
        <Button
          size="small"
          kind="ghost"
          iconDescription="Add"
          on:click={() => {
            const newNode = {
              id: node.id + ":" + new Date().getTime() + "",
              text: "new",
              type: "file",
              pid: node.id,
            };

            tempNodeName = "new";
            tempNodeDriver = node.id;

            nodes = [...nodes, newNode];

            isNameEditingDict[newNode.id] = true;
            
            treeview?.expandNodes((node) => node.id === newNode.pid);

            // expand the parent node
            selectedIds = [...selectedIds, node.id];

          }}
          style="width: 2rem;"
          icon={Add}
        />
      {/if}



      {#if nodeTypeDict[node.id] === 'file'}

        {#if !isDeletingDict[node.id]}
          <Button
            size="small"
            kind="danger-tertiary"
            iconDescription="Delete"
            style="width: 2rem;"
            on:click={() => {
              isDeletingDict[node.id] = true;
            }}
            icon={TrashCan} 
          />
        {/if}

        {#if isDeletingDict[node.id]}
          <Button
            size="small"
            kind="danger-tertiary"
            iconDescription="Confirm Delete"
            style="width: 2rem;"
            on:click={() => {
              // console.log("Delete clicked");

              const driverName = (node.id).split(":")[0];

              removeItem(`${driverName}:${node.text}`);
              

              freshenLocalFileDrivers();

            }}
            icon={Checkmark}
          />

          <Button
            size="small"
            kind="tertiary"
            iconDescription="Cancel"
            style="width: 2rem;"
            on:click={() => {
              isDeletingDict[node.id] = false;
            }}
            icon={Close}
          />

        {/if}
        
      {/if}

      
    </ButtonSet>

  </div>
  
</TreeView>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }

  
</style>
