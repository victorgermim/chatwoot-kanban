<!-- app/javascript/dashboard/routes/dashboard/kanban/KanbanCardMini.vue -->
<template>
  <VPopover placement="auto" :distance="8" :triggers="['hover', 'click']">
    <div
      class="rounded-md border border-n-weak bg-n-solid-2 p-3 hover:bg-n-solid-3 transition cursor-grab"
    >
      <div class="flex items-center gap-3">
        <div class="relative">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="name"
            class="h-8 w-8 rounded-full object-cover"
          />
          <div
            v-else
            class="h-8 w-8 rounded-full grid place-content-center bg-n-solid-3 text-n-slate-11 text-xs"
          >
            {{ firstLetter(name) }}
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium truncate">{{ name }}</p>
            <span
              class="text-[10px] px-1.5 py-0.5 rounded capitalize"
              :class="badgeClass"
              >{{ statusLabel }}</span
            >
          </div>
          <p
            v-if="snippet"
            class="text-xs text-n-slate-11 line-clamp-2 mt-0.5"
            :title="snippet"
          >
            {{ snippet }}
          </p>
        </div>
      </div>

      <p v-if="tsText" class="text-[10px] text-right text-n-slate-10 mt-2">
        {{ tsText }}
      </p>
    </div>

    <template #popper>
      <div class="w-80 p-3 text-sm">
        <p class="font-semibold">{{ name }}</p>
        <p v-if="email" class="text-n-slate-11">{{ email }}</p>

        <div class="mt-2">
          <p class="text-xs font-medium mb-1">Resumo</p>
          <p class="text-xs text-n-slate-11">
            {{ snippet || 'Sem mensagens recentes.' }}
          </p>
        </div>
      </div>
    </template>
  </VPopover>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  conv: { type: Object, required: true },
});

const name = computed(
  () => props.conv?.meta?.sender?.name || props.conv?.meta?.sender?.identifier || '—'
);
const email = computed(() => props.conv?.meta?.sender?.email || '');
const avatarUrl = computed(() => props.conv?.meta?.sender?.thumbnail || '');
const status = computed(() => props.conv?.status || 'open');

/**
 * Algumas versões do Chatwoot trazem:
 *  - conv.last_non_activity_message?.content
 * Se não vier, ficamos só no nome.
 */
const snippet = computed(() => {
  return (
    props.conv?.last_non_activity_message?.content ||
    props.conv?.meta?.last_message_content ||
    ''
  );
});

const ts = computed(() => {
  return (
    props.conv?.last_non_activity_message?.created_at ||
    props.conv?.updated_at ||
    props.conv?.timestamp
  );
});
const tsText = computed(() =>
  ts.value ? new Date(ts.value).toLocaleString('pt-BR') : ''
);

const statusLabel = computed(() => {
  if (status.value === 'pending') return 'Pendente';
  if (status.value === 'resolved') return 'Resolvido';
  return 'Em aberto';
});

const badgeClass = computed(() => {
  switch (status.value) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20';
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20';
    default:
      return 'bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/20';
  }
});

function firstLetter(s) {
  return String(s || '?').trim().charAt(0).toUpperCase();
}
</script>
