<script lang="ts">
  import { Checkbox, Modal } from "carbon-components-svelte";

  let open = false;

  import { addNotification, settings, writeSetting } from "./stores"
  import { ts2js, ts2Module } from "./lang";
  import { getItem, setItem, updateFs } from "./localFs";

  import {sha256} from "js-sha256";

  let installUrl = "";

  settings.subscribe((val) => {
    const { install } = val;

    if (install) {
      open = true;
      installUrl = install;
    }
  });


  let isAddingToWhitelist = false;

  async function handleInstall() {
    // open = false;
    console.log("installing", installUrl);

    const whitelist = localStorage.getItem("whitelist") || "{}";

    if (isAddingToWhitelist) {
      const whitelistObj = JSON.parse(whitelist);
      whitelistObj[installUrl] = true;
      localStorage.setItem("whitelist", JSON.stringify(whitelistObj));
    }

    // get installUrl hash
    const hashStr = sha256(installUrl);

    // clear the install setting
    writeSetting("install", "");

    const text = await fetch(installUrl).then((res) => res.text());

    const module = await ts2Module(text);

    let newCode = text
    if(!module.meta){
      newCode += ';\nexport const meta = {} as {[key: string]: any};\n';
    }
    if(!module?.meta?.installUrl){
      newCode += `;\nmeta.installUrl = "${installUrl}";\n`;
    }
    if(!module?.meta?.name){
      newCode += `;\nmeta.name = "${hashStr.slice(0, 8)}";\n`;
    }

    const newModule = await ts2Module(newCode);


    // TODO: refactor
    await setItem('App:' + hashStr, newCode);
    await setItem('App:__index__', JSON.stringify({
      ...JSON.parse((await getItem('App:__index__')) as string),
      [hashStr]: newModule.meta
    }, null, 2)); 


    updateFs();

    open = false;

    addNotification({
      title: "App Installed",
      subtitle: `The app ${module.meta.name} has been installed.`,
      kind: "success",
      timeout: 5000,
      caption:new Date().toLocaleString()
    });

  }


  function handleCancel() {
    open = false;

    writeSetting("install", "");
  }


</script>


<Modal
  bind:open
  modalHeading="Confirm Installation"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary={handleCancel}
  on:open
  on:close={handleCancel}
  on:submit={handleInstall}
>
  <p>
    Are you sure you want to install this app?
    <br />
    <a href={installUrl} target="_blank" rel="noopener noreferrer">
      {installUrl}
    </a>

    <!-- <Checkbox labelText="Add to whitelist" bind:checked={isAddingToWhitelist} /> -->
  </p>
</Modal>