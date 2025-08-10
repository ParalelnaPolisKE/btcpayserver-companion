'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDatabaseInstance, ExpenseCategory, ExpenseItem } from '@/lib/indexeddb';

interface ExpensesContextType {
  categories: ExpenseCategory[];
  items: ExpenseItem[];
  isLoading: boolean;
  error: string | null;
  defaultVatRate: number | undefined;
  
  // Category operations
  addCategory: (category: Omit<ExpenseCategory, 'id'>) => Promise<void>;
  updateCategory: (id: number, updates: Partial<ExpenseCategory>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  
  // Item operations
  addItem: (item: Omit<ExpenseItem, 'id'>) => Promise<void>;
  updateItem: (id: number, updates: Partial<ExpenseItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  
  // Calculation helpers
  calculateTotalMonthlyExpenses: (includeVat?: boolean) => number;
  getExpenseBreakdown: (includeVat?: boolean) => Record<string, number>;
  getCategorizedExpenses: () => Map<number, ExpenseItem[]>;
  
  // Settings
  updateDefaultVatRate: (rate: number) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultVatRate, setDefaultVatRate] = useState<number | undefined>(undefined); // No default VAT - user must configure

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = getDatabaseInstance();
      await db.init();
      await db.initializeDefaultExpenses();
      
      const [loadedCategories, loadedItems, vatRate] = await Promise.all([
        db.getExpenseCategories(),
        db.getExpenseItems(),
        db.getSetting('defaultVatRate')
      ]);
      
      setCategories(loadedCategories.filter(c => c.isActive !== false));
      setItems(loadedItems.filter(i => i.isActive !== false));
      setDefaultVatRate(vatRate || undefined);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const addCategory = async (category: Omit<ExpenseCategory, 'id'>) => {
    try {
      const db = getDatabaseInstance();
      await db.addExpenseCategory(category);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to add category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: number, updates: Partial<ExpenseCategory>) => {
    try {
      const db = getDatabaseInstance();
      await db.updateExpenseCategory(id, updates);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to update category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const db = getDatabaseInstance();
      await db.deleteExpenseCategory(id);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to delete category:', err);
      throw err;
    }
  };

  const addItem = async (item: Omit<ExpenseItem, 'id'>) => {
    try {
      const db = getDatabaseInstance();
      await db.addExpenseItem(item);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to add expense item:', err);
      throw err;
    }
  };

  const updateItem = async (id: number, updates: Partial<ExpenseItem>) => {
    try {
      const db = getDatabaseInstance();
      await db.updateExpenseItem(id, updates);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to update expense item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const db = getDatabaseInstance();
      await db.deleteExpenseItem(id);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to delete expense item:', err);
      throw err;
    }
  };

  const calculateTotalMonthlyExpenses = useCallback((includeVat: boolean = false) => {
    let total = 0;
    
    items.forEach(item => {
      if (item.isActive !== false) {
        let itemAmount = item.amount;
        
        // Adjust for frequency
        if (item.frequency === 'yearly') {
          itemAmount = itemAmount / 12;
        } else if (item.frequency === 'quarterly') {
          itemAmount = itemAmount / 3;
        }
        
        // Handle VAT based on whether it's included in the price
        const vatRate = item.vatRate !== undefined ? item.vatRate : defaultVatRate;
        
        if (item.applyVat === true) {
          // applyVat=true means the price already includes VAT (gross price)
          if (!includeVat && vatRate !== undefined && vatRate > 0) {
            // Remove VAT from the price for "no VAT" view
            // Price / (1 + vatRate) = base price without VAT
            itemAmount = itemAmount / (1 + vatRate);
          }
          // If includeVat is true, keep the price as-is (VAT already included)
        } else {
          // applyVat=false means the price is without VAT (net price)
          if (includeVat && vatRate !== undefined && vatRate > 0) {
            // Add VAT to the price for "with VAT" view
            // Price * (1 + vatRate) = gross price with VAT
            itemAmount = itemAmount * (1 + vatRate);
          }
          // If includeVat is false, keep the price as-is (no VAT to add)
        }
        
        total += itemAmount;
      }
    });
    
    return total;
  }, [items, defaultVatRate]);

  const getExpenseBreakdown = useCallback((includeVat: boolean = false) => {
    const breakdown: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.isActive !== false) {
        let itemAmount = item.amount;
        
        // Adjust for frequency
        if (item.frequency === 'yearly') {
          itemAmount = itemAmount / 12;
        } else if (item.frequency === 'quarterly') {
          itemAmount = itemAmount / 3;
        }
        
        // Handle VAT based on whether it's included in the price
        const vatRate = item.vatRate !== undefined ? item.vatRate : defaultVatRate;
        
        if (item.applyVat === true) {
          // applyVat=true means the price already includes VAT (gross price)
          if (!includeVat && vatRate !== undefined && vatRate > 0) {
            // Remove VAT from the price for "no VAT" view
            // Price / (1 + vatRate) = base price without VAT
            itemAmount = itemAmount / (1 + vatRate);
          }
          // If includeVat is true, keep the price as-is (VAT already included)
        } else {
          // applyVat=false means the price is without VAT (net price)
          if (includeVat && vatRate !== undefined && vatRate > 0) {
            // Add VAT to the price for "with VAT" view
            // Price * (1 + vatRate) = gross price with VAT
            itemAmount = itemAmount * (1 + vatRate);
          }
          // If includeVat is false, keep the price as-is (no VAT to add)
        }
        
        breakdown[item.name] = itemAmount;
      }
    });
    
    return breakdown;
  }, [items, defaultVatRate]);

  const getCategorizedExpenses = useCallback(() => {
    const categorized = new Map<number, ExpenseItem[]>();
    
    categories.forEach(category => {
      if (category.id !== undefined) {
        categorized.set(category.id, []);
      }
    });
    
    items.forEach(item => {
      if (item.isActive !== false && categorized.has(item.categoryId)) {
        categorized.get(item.categoryId)!.push(item);
      }
    });
    
    return categorized;
  }, [categories, items]);

  const updateDefaultVatRate = async (rate: number) => {
    try {
      const db = getDatabaseInstance();
      await db.setSetting('defaultVatRate', rate);
      setDefaultVatRate(rate);
    } catch (err) {
      console.error('Failed to update VAT rate:', err);
      throw err;
    }
  };

  const value: ExpensesContextType = {
    categories,
    items,
    isLoading,
    error,
    defaultVatRate,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    calculateTotalMonthlyExpenses,
    getExpenseBreakdown,
    getCategorizedExpenses,
    updateDefaultVatRate,
    refreshExpenses: loadExpenses
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
}