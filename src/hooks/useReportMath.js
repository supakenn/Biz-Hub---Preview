import { useMemo } from 'react';

/**
 * useReportMath
 * Calculates the full spreadsheet report from orders, inventory, and storeConfig.
 * Returns: { rows, grandTotalSales, adjustmentOrder }
 */
export function useReportMath({ orders, inventory, storeConfig, getIngredientPrice, getRecipe }) {
  return useMemo(() => {
    if (!storeConfig) return { rows: [], grandTotalSales: 0, adjustmentOrder: null };

    // 1. Calculate total sold per raw ingredient across all orders
    const ingredientsSold = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const recipe = getRecipe(item.id);
        if (recipe) {
          Object.entries(recipe).forEach(([ingredient, qtyNeeded]) => {
            const totalUsed = qtyNeeded * item.qty;
            ingredientsSold[ingredient] = (ingredientsSold[ingredient] || 0) + totalUsed;
          });
        }
      });
    });

    // 2. Map to spreadsheet rows from storeConfig.inventoryDb
    let grandTotalSales = 0;
    const adjustmentItems = [];

    const rows = Object.entries(storeConfig.inventoryDb).map(([name, defaultP]) => {
      const price = getIngredientPrice(name, defaultP);
      const normalSold = ingredientsSold[name] || 0;
      const start = parseInt(inventory[name]?.starting) || 0;
      const deliver = parseInt(inventory[name]?.deliver) || 0;
      const waste = parseInt(inventory[name]?.waste) || 0;

      const theoreticalEnding = start + deliver - waste - normalSold;
      const rawOverride = inventory[name]?.endingOverride;
      const hasOverride = rawOverride !== undefined && rawOverride !== '';
      const finalEnding = hasOverride ? parseInt(rawOverride) : theoreticalEnding;

      const missingQty = theoreticalEnding - finalEnding;
      const finalSold = normalSold + missingQty;
      const sales = finalSold * price;

      if (missingQty !== 0) {
        adjustmentItems.push({
          id: `adj_${name}`,
          name: name,
          qty: Math.abs(missingQty),
          price: missingQty > 0 ? price : -price,
          isAdjustment: true,
          type: missingQty > 0 ? 'Shortage' : 'Excess'
        });
      }

      grandTotalSales += sales;

      return {
        name, start, deliver, waste,
        normalSold, theoreticalEnding,
        finalEnding, finalSold,
        price, sales, missingQty, hasOverride
      };
    });

    let adjustmentOrder = null;
    if (adjustmentItems.length > 0) {
      adjustmentOrder = {
        id: 'ADJ',
        items: adjustmentItems,
        total: adjustmentItems.reduce((sum, item) => sum + (item.price * item.qty), 0),
        timestamp: Date.now(),
        isReconciliation: true
      };
    }

    return { rows, grandTotalSales, adjustmentOrder };
  }, [orders, inventory, storeConfig]);
}
