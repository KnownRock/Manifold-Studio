<script lang="ts">
  import DymFormItem from "./DymFormItem.svelte";
  import { currentFile } from "./localFs";

  import { manifoldWorker } from "./stores";

  let form = null;

  let setting = [];

  $: console.log(form);

  currentFile.subscribe((val) => {
    setting = []
  });


  manifoldWorker.addEventListener("message", (e) => {
    if (!e || !e.data) {
      return;
    }

    const data = e.data;
    if (data.type === "set-form") {
      setting = data.data;
    }

    if (data.type === "get-form-value") {
      const formData = new FormData(form as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      manifoldWorker.postMessage({
        type: "get-form-value",
        data,
      });
    }
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    manifoldWorker.postMessage({
      type: "form-submit",
      data,
    });
  }

  function handleValueChange(e: { name: string; value: any }) {
    const { name, value } = e;

    console.log(name, value);

    const formData = new FormData(form as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    manifoldWorker.postMessage({
      type: "form-value-change",
      data: {
        name,
        value,

        formData: data,
      },
    });
  }
</script>

<form on:submit={handleSubmit} bind:this={form} style="height: 100%; ">
  {#if setting.length === 0}
    <div style="height: 100%; display: flex; justify-content: center; align-items: center;">
      <h3>
        No form setting provided
      </h3>
    </div>
  {:else}
    <DymFormItem children={setting} {handleValueChange}></DymFormItem>
  {/if}

</form>
