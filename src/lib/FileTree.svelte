<script lang="ts">
  import { Button, ButtonSet, TextInput, TreeView , toHierarchy } from "carbon-components-svelte";
  let activeId = 0;
  let selectedIds = [];
  let nodes = [];

  import VmdkDisk from "carbon-icons-svelte/lib/VmdkDisk.svelte";
  import InformationSquareFilled from "carbon-icons-svelte/lib/InformationSquareFilled.svelte";
  // add icon
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";

  import { onMount } from "svelte";
  import UpdateNow from "carbon-icons-svelte/lib/UpdateNow.svelte";
  import { getAll, hasItem, removeItem, setItem , currentFile, fsChanged, getFileName, getItem } from "./localFs";
  import { addNotification, writeSetting } from "./stores";

  let treeOffset = 0;

  let fileIndex = {} as Record<string, any>;

  async function freshenLocalFileDrivers() {
    const files = await getAll()

    function getIcon(file){
      if(file.type === 'driver'){
        return VmdkDisk;
      }
      // if(getFileName(file.name) === '__index__'){
      //   return InformationSquareFilled
      // }

      return null;
    }


    
    const indexFiles = files.filter((file) => getFileName(file.name) === '__index__');
    const tempFileIndex = {}
    for(const indexFile of indexFiles){
      if(indexFile.type === 'driver'){
        continue;
      }

      const driverName = indexFile.driver;
      const indexFileContent = await getItem(indexFile.name);
      const driverIndex = JSON.parse(indexFileContent as string);

      for(const key in driverIndex){
        const fileName = driverIndex[key];
        tempFileIndex[`${driverName}:${key}`] = fileName;
      }
    }

    fileIndex = tempFileIndex;



    nodes = files.map((file) => {
      return {
        id: file.name,
        text: file.type === 'driver' ? file.name : file.name.split(":")[1],
        type: file.type,
        icon: getIcon(file),
        pid: file.type === 'file' ? (file.driver + ':__index__') : null
      };
    }).filter((node) => {
      return node.text !== '__index__';
    }).map((node) => {
      if(node.type === 'driver'){
        node.id = node.id + ':__index__';
        node.type = 'file';
        return node;
      }else{
        return node;
      }
    });



  }

  onMount(() => {
    const tree = document.getElementById("file-tree");
    treeOffset = tree.offsetTop;

    window.addEventListener("resize", () => {
      treeOffset = tree.offsetTop;
    });

    freshenLocalFileDrivers();


  });

  currentFile.subscribe((val) => {
    selectedIds = val ? [val] : [];
    activeId = val;
  });

  fsChanged.subscribe(() => {
    freshenLocalFileDrivers();
  });


  $: treeHeight = `calc(100vh - ${treeOffset}px)`;

  const isDeletingDict = {};
  const isNameEditingDict = {};
  
  $: nodeTypeDict = Object.fromEntries(nodes.map(driver => [driver.id, driver.type]))

  let treeview = null;

  // TODO: convert to real type
  let tempNodeName = "new" as string | number;
  let tempNodeDriver = "Local" as string | number;

  function handleNodeSelect(nodeId) {
    const selectedNode = nodes.find((node) => node.id === nodeId);
    currentFile.set(selectedNode.id);
  }

</script>

<TreeView
  bind:this={treeview}
  id="file-tree"
  style="overflow: visible; max-height: {treeHeight}"
  labelText="File Tree"
  nodes={toHierarchy(nodes, node=>node.pid)}
  expandedIds={nodes.map(node => node.id)}
  on:select={({ detail }) => {
    if(!detail){
      return
    }
    handleNodeSelect(detail.id);
  }}
  bind:activeId
  bind:selectedIds
  on:select={({ detail }) => console.log("select", detail)}
  on:toggle={({ detail }) => console.log("toggle", detail)}
  on:focus={({ detail }) => console.log("focus", detail)}
>
  <div slot="default"
    let:node 
    style="width: 100%; display: flex; align-items: center; overflow: visible;justify-content: space-between;  flex:1;"
  >
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


            if(await hasItem(`${tempNodeDriver}:${tempNodeName}`)){
              // console.log("File already exists");
              addNotification({
                title: "File Already Exists",
                subtitle: `${tempNodeName} already exists.`,
                kind: "error",
              });

              return;
            }

            isNameEditingDict[node.id] = false;
            await setItem(`${tempNodeDriver}:${tempNodeName}`, "");

            addNotification({
              title: "File Created",
              subtitle: `${tempNodeName} has been created.`,
              kind: "success",
            });

            

            await freshenLocalFileDrivers();

            handleNodeSelect(tempNodeDriver + ':' + tempNodeName);

            
          }
        }}
      />
    {/if}

    {#if !isNameEditingDict[node.id]}
      <div style="margin-left: 1rem; width:10rem;cursor:pointer;overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
         {fileIndex[node.id]?.name || node.text}
      </div>
    {/if}

    <ButtonSet style="position: relative; display: flex; flex-direction: row; "  
      on:click={(e)=>e.stopPropagation()}
      on:mouseover={(e)=>e.stopPropagation()}
    >
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

        {#if fileIndex[node.id]?.installUrl}
          <Button
            size="small"
            kind="tertiary"
            iconDescription="Update"
            style="width: 2rem;"
            on:click={() => {
              writeSetting("install", (fileIndex[node.id].installUrl));
            }}
            icon={UpdateNow} 
          />
        {/if}

        {#if !isDeletingDict[node.id] && node.text !== '__index__'}
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
              // FIXME: using uuid for new item
              const driverName = (node.id + '').split(":")[0];
              removeItem(`${driverName}:${node.text}`);
              freshenLocalFileDrivers();
              addNotification({
                title: "File Deleted",
                subtitle: `${node.text} has been deleted.`,
                kind: "error",
              });

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
