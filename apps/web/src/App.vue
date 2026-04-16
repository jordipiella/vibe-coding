<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">
          Vibe Coding
        </p>
        <h1 class="title">
          Vue + Fastify Monorepo
        </h1>
      </div>

      <nav class="nav">
        <RouterLink to="/">
          Home
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

