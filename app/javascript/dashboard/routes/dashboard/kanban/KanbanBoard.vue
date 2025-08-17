<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { API } from 'dashboard/services/apiClient'

const route = useRoute()
const accountId = route.params.accountId

const lists = ref({ pending: [], open: [], resolved: [] })
const loading = ref(false)
const errorMsg = ref('')

async function load(status) {
  try {
    const { data } = await API.get(
      `/api/v1/accounts/${accountId}/conversations`,
      { params: { status, page: 1 } }
    )
    return Array.isArray(data?.data?.payload) ? data.data.payload
         : Array.isArray(data?.payload)       ? data.payload
         : []
  } catch (e) {
    const code = e?.response?.status ?? ''
    console.error(`[KANBAN] load ${status} error`, code, e)
    errorMsg.value = `Erro ao carregar ${status}: ${code}`
    return []
  }
}

onMounted(async () => {
  console.log('[KANBAN] KanbanBoard MOUNTED', { accountId })
  loading.value = true
  lists.value.pending  = await load('pending')
  lists.value.open     = await load('open')
  lists.value.resolved = await load('resolved')
  loading.value = false
})
</script>

<template>
  <section class="p-6">
    <header class="flex items-center gap-3 mb-4">
      <span class="i-lucide-columns-3 size-5" />
      <h1 class="text-2xl font-semibold">Kanban</h1>
    </header>

    <p v-if="errorMsg" class="text-red-500">{{ errorMsg }}</p>
    <p v-else-if="loading" class="text-n-slate-11">Carregando…</p>

    <div v-else class="grid grid-cols-3 gap-4">
      <div>
        <h3 class="font-medium mb-2">Pendente ({{ lists.pending.length }})</h3>
        <ul><li v-for="c in lists.pending" :key="c.id">{{ c.meta?.sender?.name || c.id }}</li></ul>
      </div>
      <div>
        <h3 class="font-medium mb-2">Em aberto ({{ lists.open.length }})</h3>
        <ul><li v-for="c in lists.open" :key="c.id">{{ c.meta?.sender?.name || c.id }}</li></ul>
      </div>
      <div>
        <h3 class="font-medium mb-2">Resolvido ({{ lists.resolved.length }})</h3>
        <ul><li v-for="c in lists.resolved" :key="c.id">{{ c.meta?.sender?.name || c.id }}</li></ul>
      </div>
    </div>
  </section>
</template>
