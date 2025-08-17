export default [
  {
    path: 'kanban',
    name: 'kanban_index',
    meta: { requiresAuth: true },
    component: () => import('dashboard/routes/dashboard/kanban/KanbanBoard.vue'),
  },
];
