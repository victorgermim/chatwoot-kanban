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
 * Chamado pela coluna quando um item cai nela.
 * id: conversa movida
 * toStatus: 'pending' | 'open' | 'resolved'
 */
async function onMoved({ id, toStatus }) {
  // 1) Update otimista local
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
    // 2) Persistir no servidor (IMPORTANTE)
    const { status: http } = await conversationsAPI.update(id, { status: toStatus });
    console.log('[KANBAN] update status', { id, toStatus, http });

    // 3) Sincronizar com o que o servidor devolve
    //    (refetch só da coluna de destino para ficar rápido)
    if (toStatus === 'pending') columns.pending = await fetchList('pending');
    if (toStatus === 'open') columns.open = await fetchList('open');
    if (toStatus === 'resolved') columns.resolved = await fetchList('resolved');
  } catch (e) {
    const code = e?.response?.status ?? '';
    console.error('[KANBAN] erro ao atualizar status', code, e);
    errorMsg.value = `Erro ao mover cartão: ${code}`;
    // Recarrega tudo para reverter/alinhar
    await refreshAll();
  }
}
</script>
