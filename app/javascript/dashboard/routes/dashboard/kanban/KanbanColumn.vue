<!-- app/javascript/dashboard/routes/dashboard/kanban/KanbanColumn.vue -->
<template>
  <section class="flex flex-col h-full">
    <header class="px-3 py-2 border-b border-n-weak bg-n-solid-2 rounded-t-md">
      <div class="flex items-center justify-between">
        <h3 class="font-medium">{{ title }}</h3>
        <span class="text-xs text-n-slate-11">{{ localItems.length }}</span>
      </div>
    </header>

    <div class="p-3 space-y-2 min-h-[200px] bg-n-solid-1 rounded-b-md">
      <draggable
        v-model="localItems"
        item-key="id"
        group="conversations"
        :animation="150"
        @change="onChange"
      >
        <template #item="{ element }">
          <KanbanCardMini :conv="element" />
        </template>
        <template #footer>
          <div v-if="!localItems.length" class="text-xs text-n-slate-11 py-2">
            Sem itens
          </div>
        </template>
      </draggable>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import KanbanCardMini from './KanbanCardMini.vue';

const props = defineProps({
  title: { type: String, required: true },
  status: { type: String, required: true }, // 'pending' | 'open' | 'resolved'
  items: { type: Array, required: true },
});

const emit = defineEmits(['moved']);

const localItems = ref([...props.items]);

watch(
  () => props.items,
  v => {
    localItems.value = [...v];
  }
);

function onChange(evt) {
  // Quando um item foi ADICIONADO nesta coluna
  if (evt?.added?.element) {
    const el = evt.added.element;
    emit('moved', { id: el.id, toStatus: props.status });
  }
}
</script>
