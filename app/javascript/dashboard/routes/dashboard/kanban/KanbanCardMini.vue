<template>
  <div class="rounded-md border border-n-weak bg-n-solid-3 p-3">
    <div class="text-sm font-medium truncate">{{ card.name }}</div>
    <div v-if="card.lastMessage" class="text-xs text-n-slate-11 line-clamp-2">
      {{ card.lastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

type Card = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  status: string;
  lastMessage?: string;
};

defineProps({
  card: { type: Object as PropType<Card>, required: true },
});
</script>
