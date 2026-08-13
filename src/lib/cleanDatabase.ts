export function cleanDatabaseSystem(): {
  deletedOrdersCount: number;
  deletedSellersCount: number;
  deletedSuppliersCount: number;
} {
  let deletedOrdersCount = 0;
  let deletedSellersCount = 0;
  let deletedSuppliersCount = 0;

  try {
    const rawOrders = localStorage.getItem('nouva_orders');
    if (rawOrders) {
      const parsed = JSON.parse(rawOrders);
      deletedOrdersCount = Array.isArray(parsed) ? parsed.length : 0;
    }
    localStorage.setItem('nouva_orders', JSON.stringify([]));

    const rawSellers = localStorage.getItem('nouva_sellers_v2');
    if (rawSellers) {
      const parsed = JSON.parse(rawSellers);
      deletedSellersCount = Array.isArray(parsed) ? parsed.length : 0;
    }
    localStorage.setItem('nouva_sellers_v2', JSON.stringify([]));

    const rawSuppliers = localStorage.getItem('nouva_suppliers_v2');
    if (rawSuppliers) {
      const parsed = JSON.parse(rawSuppliers);
      deletedSuppliersCount = Array.isArray(parsed) ? parsed.length : 0;
    }
    localStorage.setItem('nouva_suppliers_v2', JSON.stringify([]));

    localStorage.setItem('nouva_wallet_balance', '0');
    localStorage.setItem('nouva_wallet_txs', JSON.stringify([]));
    localStorage.setItem('reseller_wallet_balance_v1', '0');
    localStorage.setItem('reseller_wallet_transactions_v1', JSON.stringify([]));
    localStorage.setItem('nouva_offline_orders_queue', JSON.stringify([]));
  } catch (err) {
    console.error('Error executing database cleanup:', err);
  }

  return {
    deletedOrdersCount,
    deletedSellersCount,
    deletedSuppliersCount,
  };
}
