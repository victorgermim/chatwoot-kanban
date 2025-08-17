export default [
  {
    path: 'kanban',
    name: 'kanban_index',
    meta: {
      requiresAuth: true,
      permissions: ['administrator', 'agent', 'custom_role'],
    },
    beforeEnter: (to, from, next) => {
      console.log('[KANBAN] beforeEnter →', to.fullPath);
      next();
    },
    component: () => import('dashboard/routes/dashboard/kanban/KanbanBoard.vue'),
  },
];
console.log('[KANBAN] index.js carregado (dashboard/routes/dashboard/kanban/index.js)');
