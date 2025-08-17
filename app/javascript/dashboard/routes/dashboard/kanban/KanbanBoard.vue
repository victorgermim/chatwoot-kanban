<!-- app/javascript/dashboard/routes/dashboard/kanban/KanbanBoard.vue -->
<template>
  <section class="p-6">
    <header class="flex items-center gap-3 mb-4">
      <span class="i-lucide-columns-3 size-5" />
      <h1 class="text-2xl font-semibold">Kanban</h1>
    </header>

    <p v-if="errorMsg" class="text-red-500">{{ errorMsg }}</p>
    <p v-else-if="loading" class="text-n-slate-11">Carregando…</p>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KanbanColumn
        title="Pendente"
        status="pending"
        :items="columns.pending"
        @moved="onMoved"
      />
      <KanbanColumn
        title="Em aberto"
        status="open"
        :items="columns.open"
        @moved="onMoved"
      />
      <KanbanColumn
        title="Resolvido"
        status="resolved"
        :items="columns.resolved"
        @moved="onMoved"
      />
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ApiClient from 'dashboard/api/ApiClient';
import KanbanColumn from './KanbanColumn.vue';

// API account-scoped para conversas
const conversationsAPI = new ApiClient('conversations', { accountScoped: true });

const route = useRoute();
const accountId = route.params.accountId;

const columns = reactive({
  pending: [],
  open: [],
  resolved: [],
});

const loading = ref(false);
const errorMsg = ref('');

async function fetchList(status) {
  try {
    const { data } = await conversationsAPI.get({
      params: { status, page: 1 },
    });

    // Normaliza diferentes formatos do payload
    const list = Array.isArray(data?.data?.payload)
      ? data.data.payload
      : Array.isArray(data?.payload)
      ? data.payload
      : [];

    // Força status local para refletir a coluna (útil para re-render)
    return list.map(c => ({ ...c, status }));
  } catch (e) {
    const code = e?.response?.status ?? '';
    console.error(`[KANBAN] fetch ${status} error`, code, e);
    errorMsg.value = `Erro ao carregar ${status}: ${code}`;
    return [];
  }
}

onMounted(async () => {
  console.log('[KANBAN] KanbanBoard MOUNTED', { accountId });
  loading.value = true;
  columns.pending = await fetchList('pending');
  columns.open = await fetchList('open');
  columns.resolved = await fetchList('resolved');
  loading.value = false;
});

// Quando um cartão caiu em outra coluna
async function onMoved({ id, toStatus }) {
  try {
    // Atualiza no servidor
    await conversationsAPI.update(id, { status: toStatus });

    // Move no estado local (garante consistência visual rápida)
    // 1) remove de todas
    columns.pending = columns.pending.filter(i => i.id !== id);
    columns.open = columns.open.filter(i => i.id !== id);
    columns.resolved = columns.resolved.filter(i => i.id !== id);

    // 2) adiciona na coluna destino (mantendo objeto caso exista referência)
    const moved =
      columns.pending.find(i => i.id === id) ||
      columns.open.find(i => i.id === id) ||
      columns.resolved.find(i => i.id === id) || { id };

    const withStatus = { ...moved, status: toStatus };
    if (toStatus === 'pending') columns.pending = [withStatus, ...columns.pending];
    else if (toStatus === 'resolved') columns.resolved = [withStatus, ...columns.resolved];
    else columns.open = [withStatus, ...columns.open];

    console.log('[KANBAN] status atualizado', { id, toStatus });
  } catch (e) {
    const code = e?.response?.status ?? '';
    console.error('[KANBAN] erro ao atualizar status', code, e);
    errorMsg.value = `Erro ao mover cartão: ${code}`;
    // refresh simples da coluna destino para voltar ao estado válido
    if (toStatus === 'pending') columns.pending = await fetchList('pending');
    if (toStatus === 'open') columns.open = await fetchList('open');
    if (toStatus === 'resolved') columns.resolved = await fetchList('resolved');
  }
}
</script>
