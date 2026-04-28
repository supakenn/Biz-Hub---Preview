import { useMemo } from 'react';

export const useReportMath = ({ orders, inventory, storeConfig, getIngredientPrice, getRecipe }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        });
      });
    });

    const rows = [];
    let grandTotalSales = 0;
    const adjustmentItems = [];
    let adjTotal = 0;

    // 2. Map through the inventory database to build the spreadsheet rows
    Object.keys(storeConfig.inventoryDb).forEach(name => {
      const defaultPrice = storeConfig.inventoryDb[name];
      const price = getIngredientPrice(name, defaultPrice);
      const normalSold = ingredientsSold[name] || 0; 
      const invItem = inventory[name] || {};

      const start = parseFloat(invItem.starting) || 0;
      const deliver = parseFloat(invItem.deliver) || 0;
      
      // PHASE 6.5: Force waste to 0 if the business doesn't track it
      const waste = hasWaste ? (parseFloat(invItem.waste) || 0) : 0;

      const theoreticalEnding = start + deliver - waste - normalSold;
      const hasOverride = invItem.endingOverride !== undefined && invItem.endingOverride !== '';
      
      // PHASE 6.5: If no reconciliation, Actual Ending always matches Theoretical Ending
      const finalEnding = (hasRecon && hasOverride) ? parseFloat(invItem.endingOverride) : theoreticalEnding;

      // PHASE 6.5: Only calculate missing quantities if reconciliation is enabled
      const missingQty = hasRecon ? Math.round((theoreticalEnding - finalEnding) * 1000) / 1000 : 0;
      
      const finalSold = Math.round((normalSold + missingQty) * 1000) / 1000;
      const sales = finalSold * price;

      grandTotalSales += sales;

      if (missingQty !== 0) {
        const type = missingQty > 0 ? "Shortage" : "Excess";
        const adjQty = Math.abs(missingQty);
        adjustmentItems.push({
          id: `adj_${name}`,
          name: `${type}: ${name}`,
          qty: adjQty,
          price: missingQty > 0 ? price : -price,
          isAdjustment: true,
          type: type
        });
        adjTotal += (missingQty > 0 ? price : -price) * adjQty;
      }

      rows.push({
        name, start, deliver, waste, theoreticalEnding, finalEnding, hasOverride, finalSold, price, sales, missingQty
      });
    });

    let adjustmentOrder = null;
    if (adjustmentItems.length > 0) {
      adjustmentOrder = {
        id: 'ADJ',
        items: adjustmentItems,
        total: adjTotal,
        isReconciliation: true
      };
    }

    return { rows, grandTotalSales, adjustmentOrder };
  }, [orders, inventory, storeConfig, getIngredientPrice, getRecipe]);
};
