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

// API account-scoped
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

    const list = Array.isArray(data?.data?.payload)
      ? data.data.payload
      : Array.isArray(data?.payload)
      ? data.payload
      : [];

    return list.map(c => ({ ...c, status }));
  } catch (e) {
    const code = e?.response?.status ?? '';
    console.error(`[KANBAN] fetch ${status} error`, code, e);
    errorMsg.value = `Erro ao carregar ${status}: ${code}`;
    return [];
  }
}

async function refreshAll() {
  const [p, o, r] = await Promise.all([
    fetchList('pending'),
    fetchList('open'),
    fetchList('resolved'),
  ]);
  columns.pending = p;
  columns.open = o;
  columns.resolved = r;
}

onMounted(async () => {
  console.log('[KANBAN] MOUNTED', { accountId });
  loading.value = true;
  await refreshAll();
  loading.value = false;
});

/**
 * Disparado pela coluna quando um item cai nela.
 * { id, toStatus }
 */
async function onMoved({ id, toStatus }) {
  // Otimista: move localmente
  const removeFromAll = () => {
    columns.pending = columns.pending.filter(i => i.id !== id);
    columns.open = columns.open.filter(i => i.id !== id);
    columns.resolved = columns.resolved.filter(i => i.id !== id);
  };
  const addTo = status => {
    const obj = { id, status };
    if (status === 'pending') columns.pending = [obj, ...columns.pending];
    else if (status === 'resolved') columns.resolved = [obj, ...columns.resolved];
    else columns.open = [obj, ...columns.open];
  };

  removeFromAll();
  addTo(toStatus);

  try {
    const { status: http } = await conversationsAPI.update(id, { status: toStatus });
    console.log('[KANBAN] update status', { id, toStatus, http });

    // Recarrega só a coluna de destino para alinhar com o servidor
    if (toStatus === 'pending') columns.pending = await fetchList('pending');
    if (toStatus === 'open') columns.open = await fetchList('open');
    if (toStatus === 'resolved') columns.resolved = await fetchList('resolved');
  } catch (e) {
    const code = e?.response?.status ?? '';
    console.error('[KANBAN] erro ao atualizar status', code, e);
    errorMsg.value = `Erro ao mover cartão: ${code}`;
    await refreshAll(); // volta ao estado consistente
  }
}
</script>
