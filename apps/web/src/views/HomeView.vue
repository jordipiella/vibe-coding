<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useHealthStore } from '../stores/health';

const healthStore = useHealthStore();
const { data, error, status } = storeToRefs(healthStore);
</script>

<template>
  <main class="panel-grid">
    <section class="panel">
      <p class="eyebrow">
        Scaffold
      </p>
      <h2>Vue + Fastify + Zod</h2>
      <p>
        Esta app ya está conectada a una API Fastify y a contratos compartidos en
        <code>packages/contracts</code>.
      </p>

      <ul class="stack-list">
        <li>Vue 3 con router y Pinia.</li>
        <li>API mínima con Fastify.</li>
        <li>Contratos validados con Zod.</li>
        <li>Vitest y Playwright listos para crecer.</li>
      </ul>
    </section>

    <section class="panel">
      <p class="eyebrow">
        Health Check
      </p>
      <h2>Contrato compartido</h2>
      <p>El botón consulta <code>GET /health</code> y valida la respuesta contra Zod.</p>

      <div class="actions">
        <button
          class="button"
          :disabled="status === 'loading'"
          @click="healthStore.load"
        >
          {{ status === 'loading' ? 'Checking API...' : 'Check API health' }}
        </button>
        <p class="status">
          Store state: {{ status }}
        </p>
      </div>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>

      <dl
        v-if="data"
        class="detail-list"
      >
        <dt>Status</dt>
        <dd>{{ data.status }}</dd>
        <dt>Service</dt>
        <dd>{{ data.service }}</dd>
        <dt>Timestamp</dt>
        <dd>{{ data.timestamp }}</dd>
      </dl>
    </section>
  </main>
</template>

