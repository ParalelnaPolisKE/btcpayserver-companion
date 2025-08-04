'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getDB, ExpenseCategory, ExpenseItem } from '@/lib/indexeddb';

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
      const db = getDB();
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
      const db = getDB();
      await db.addExpenseCategory(category);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to add category:', err);
      throw err;
    }
  };

  const updateCategory = async (id: number, updates: Partial<ExpenseCategory>) => {
    try {
      const db = getDB();
      await db.updateExpenseCategory(id, updates);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to update category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const db = getDB();
      await db.deleteExpenseCategory(id);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to delete category:', err);
      throw err;
    }
  };

  const addItem = async (item: Omit<ExpenseItem, 'id'>) => {
    try {
      const db = getDB();
      await db.addExpenseItem(item);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to add expense item:', err);
      throw err;
    }
  };

  const updateItem = async (id: number, updates: Partial<ExpenseItem>) => {
    try {
      const db = getDB();
      await db.updateExpenseItem(id, updates);
      await loadExpenses();
    } catch (err) {
      console.error('Failed to update expense item:', err);
      throw err;
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const db = getDB();
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
        
        // Apply VAT if needed
        if (includeVat && item.applyVat !== false) {
          const vatRate = item.vatRate !== undefined ? item.vatRate : defaultVatRate;
          if (vatRate !== undefined && vatRate > 0) {
            itemAmount = itemAmount * (1 + vatRate);
          }
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
        
        // Apply VAT if needed
        if (includeVat && item.applyVat !== false) {
          const vatRate = item.vatRate !== undefined ? item.vatRate : defaultVatRate;
          if (vatRate !== undefined && vatRate > 0) {
            itemAmount = itemAmount * (1 + vatRate);
          }
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
      const db = getDB();
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