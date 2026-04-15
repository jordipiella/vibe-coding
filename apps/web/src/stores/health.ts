import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { HealthResponse } from '@vibe/contracts';

import { fetchHealth } from '../lib/api';

export const useHealthStore = defineStore('health', () => {
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const data = ref<HealthResponse | null>(null);
  const error = ref<string | null>(null);

  async function load() {
    status.value = 'loading';
    error.value = null;

    try {
      data.value = await fetchHealth();
      status.value = 'ready';
    } catch (caughtError) {
      data.value = null;
      status.value = 'error';
      error.value = caughtError instanceof Error ? caughtError.message : 'Unknown error';
    }
  }

  return {
    status,
    data,
    error,
    load,
  };
});

