<script lang="ts">
  import { Checkbox, Modal } from "carbon-components-svelte";

  let open = false;

  import { addNotification, settings, writeSetting } from "./stores"
  import { ts2js, ts2Module } from "./lang";
  import { getItem, setItem, updateFs } from "./localFs";

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

    // install the app

    // clear the install setting
    writeSetting("install", "");

    const text = await fetch(installUrl).then((res) => res.text());

    const additonalExport = `
    meta.installUrl = meta.installUrl || "${installUrl}";
    `;

    const newCode = text + additonalExport;

    const module = await ts2Module(newCode);

    await setItem('App:' + module.meta.id, text);

    await setItem('App:__index__', JSON.stringify({
      ...JSON.parse((await getItem('App:__index__')) as string),
      [module.meta.id]: module.meta
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