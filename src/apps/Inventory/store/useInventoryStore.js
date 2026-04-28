import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

const storage = {
  getItem: async (name) => {
    const value = await localforage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
};

export const useInventoryStore = create(
  persist(
    (set, get) => ({
      categories: [
        { id: 'cat_1', parentId: null, name: 'Main Store' }
      ],
      nodes: [
        {
          id: 'node_1',
          categoryId: 'cat_1',
          name: 'Stock_Room',
          schema: [
            { id: "col_1", key: "id", name: "ID", type: "id", permissions: { default: "read" } },
            { id: "col_2", key: "item", name: "Item Name", type: "text", permissions: { default: "read" } },
            { id: "col_3", key: "qty", name: "Stock", type: "number", permissions: { default: "edit" } }
          ],
          joinCode: "STOCK123"
        }
      ],
      activeCategory: null,
      activeNode: null,
      setActiveCategory: (category) => set({ activeCategory: category, activeNode: null }),
      setActiveNode: (node) => set({ activeNode: node }),
      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, category],
          syncQueue: [...state.syncQueue, { action: 'ADD_CATEGORY', payload: category, timestamp: Date.now() }],
        }));
      },
      addNode: (node) => {
        set((state) => ({
          nodes: [...state.nodes, node],
          syncQueue: [...state.syncQueue, { action: 'ADD_NODE', payload: node, timestamp: Date.now() }],
        }));
      },
      updateNode: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
          syncQueue: [...state.syncQueue, { action: 'UPDATE_NODE', payload: { nodeId, updates }, timestamp: Date.now() }],
        }));
      },
      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter(n => n.id !== nodeId),
          activeNode: state.activeNode?.id === nodeId ? null : state.activeNode,
          items: state.items.filter(i => i.nodeId !== nodeId),
          syncQueue: [...state.syncQueue, { action: 'DELETE_NODE', payload: nodeId, timestamp: Date.now() }],
        }));
      },
      moveNode: (nodeId, newCategoryId) => {
        set((state) => ({
          nodes: state.nodes.map(n => n.id === nodeId ? { ...n, categoryId: newCategoryId } : n),
          syncQueue: [...state.syncQueue, { action: 'MOVE_NODE', payload: { nodeId, newCategoryId }, timestamp: Date.now() }],
        }));
      },
      updateItemField: (itemId, fieldKey, value) => {
        set((state) => {
          const updatedItems = state.items.map(item => item.id === itemId ? { ...item, [fieldKey]: value } : item);
          return {
            items: updatedItems,
            syncQueue: [...state.syncQueue, { action: 'UPDATE_ITEM', payload: { itemId, fieldKey, value }, timestamp: Date.now() }],
          };
        });
      },
      items: [],
      syncQueue: [],
      lastSync: null,
      isSyncing: false,

      // Initialize / Pull data from Tier 2
      hydrateItems: (items) => set({ items, lastSync: new Date().toISOString() }),

      // Local Actions that also queue for sync
      addItem: (item) => {
        set((state) => ({
          items: [...state.items, item],
          syncQueue: [...state.syncQueue, { action: 'ADD', payload: item, timestamp: Date.now() }],
        }));
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
          syncQueue: [...state.syncQueue, { action: 'UPDATE', payload: { id, ...updates }, timestamp: Date.now() }],
        }));
      },
      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          syncQueue: [...state.syncQueue, { action: 'DELETE', payload: { id }, timestamp: Date.now() }],
        }));
      },

      // Batch Sync logic (called by a separate worker or button)
      setSyncing: (status) => set({ isSyncing: status }),
      clearSyncQueue: () => set({ syncQueue: [], lastSync: new Date().toISOString() }),
    }),
    {
      name: 'biz-ims-inventory-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
