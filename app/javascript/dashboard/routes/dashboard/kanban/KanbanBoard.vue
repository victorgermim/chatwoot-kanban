<template>
  <section class="p-6">
    <header class="flex items-center gap-3 mb-5">
      <span class="i-lucide-columns-3 size-5" />
      <h1 class="text-2xl font-semibold">Kanban</h1>
    </header>

    <div v-if="error" class="text-red-600 text-sm mb-3">{{ error }}</div>
    <div v-else-if="loading" class="text-sm text-n-slate-11">Carregando conversas…</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KanbanColumn title="Abertas" :items="lists.open" />
      <KanbanColumn title="Em atendimento" :items="lists.pending" />
      <KanbanColumn title="Resolvidas" :items="lists.resolved" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import KanbanColumn from './KanbanColumn.vue';

type Card = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  status: string;
  lastMessage?: string;
};

const route = useRoute();
const loading = ref(false);
const error = ref<string | null>(null);
const lists = ref<{ open: Card[]; pending: Card[]; resolved: Card[] }>({
  open: [], pending: [], resolved: [],
});

function mapConversation(conv: any): Card {
  return {
    id: String(conv?.id),
    name: conv?.meta?.sender?.name ?? 'Sem nome',
    email: conv?.meta?.sender?.email ?? '',
    avatarUrl: conv?.meta?.sender?.thumbnail ?? '',
    status: conv?.status ?? 'open',
    lastMessage: conv?.last_non_activity_message?.content ?? '',
  };
}

async function fetchConversations(status: 'open' | 'pending' | 'resolved') {
  const accountId = route.params.accountId as string;
  const res = await fetch(
    `/api/v1/accounts/${accountId}/conversations?status=${status}&page=1`,
    { credentials: 'same-origin', headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Erro ao carregar ${status}: ${res.status}`);
  const json = await res.json();
  const arr = Array.isArray(json?.data?.payload) ? json.data.payload
           : Array.isArray(json?.data) ? json.data : [];
  return arr.map(mapConversation);
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [open, pending, resolved] = await Promise.all([
      fetchConversations('open'),
      fetchConversations('pending').catch(() => []),
      fetchConversations('resolved'),
    ]);
    lists.value = { open, pending, resolved };
  } catch (e: any) {
    error.value = e?.message ?? String(e);
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.accountId, () => load(), { immediate: true });
</script>
