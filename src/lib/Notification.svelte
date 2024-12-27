<script>
  import { ToastNotification } from "carbon-components-svelte";
  import { fade } from "svelte/transition";


  import { onMount } from "svelte";
  import { addNotification, notifications, removeNotification } from "./stores";

  let innerNotifications = [];
  notifications.subscribe((val) => {
    innerNotifications = val;
  });

  // onMount(() => {
  //   addNotification({
  //     title: "Welcome to the app!",
  //     subtitle: "This is a notification.",
  //     kind: "success",
  //   });

  //   addNotification({
  //     title: "Welcome to the app!",
  //     subtitle: "This is a notification.",
  //     kind: "info",
  //     timeout: 5000,
  //   });
  // });
</script>

<div class="notification">
  {#each innerNotifications as notification (notification.id)}
    {#if !notification.isClosing}
      <div transition:fade>
        <ToastNotification
          {...notification}
          on:close={(e) => {
            notification.isClosing = true;

            setTimeout(() => {
              removeNotification(notification.id);
            }, 400);
          }}
        />
      </div>
    {/if}
  {/each}
</div>

<style>
  .notification {
    position: fixed;
    bottom: 0;
    right: 0;
    margin: 1rem;
    z-index: 1000;
  }
</style>
