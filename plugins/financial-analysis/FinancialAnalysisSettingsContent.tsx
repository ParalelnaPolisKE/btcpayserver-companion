'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bps-companion/components/ui/card';
import { Label } from '@bps-companion/components/ui/label';
import { Input } from '@bps-companion/components/ui/input';
import { Button } from '@bps-companion/components/ui/button';
import { Alert, AlertDescription } from '@bps-companion/components/ui/alert';
import { InfoIcon, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useExpenses } from '@bps-companion/contexts/expenses-context';
import { usePlugins } from '@bps-companion/contexts/plugins-context';
import { PermissionsDisplay } from '@bps-companion/components/apps/permissions-display';
import { StoresManager } from './components/StoresManager';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bps-companion/components/ui/dialog";
import { Badge } from '@bps-companion/components/ui/badge';
import { Switch } from '@bps-companion/components/ui/switch';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bps-companion/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@bps-companion/components/ui/accordion";

export default function FinancialAnalysisSettingsContent() {
  const { isPluginEnabled } = usePlugins();
  
  // VAT input state and debouncing
  const [vatInputValue, setVatInputValue] = useState('');
  const vatDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{ itemId: number; sourceCategoryId: number } | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<number | null>(null);
  
  // Expense management state
  const { 
    categories, 
    items, 
    defaultVatRate,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    updateDefaultVatRate,
    getCategorizedExpenses 
  } = useExpenses();
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    amount: '',
    applyVat: false,
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    notes: '',
    categoryId: null as number | null
  });
  
  // Check if plugin is enabled
  if (!isPluginEnabled('financial-analysis')) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Financial Analysis Settings</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground mb-4">
              The Financial Analysis app is currently disabled.
            </p>
            <div className="text-center">
              <Link href="/apps">
                <Button>Go to Apps</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleAddCategory = async () => {
    try {
      await addCategory({
        name: categoryForm.name,
        description: categoryForm.description,
        order: categories.length
      });
      setIsAddCategoryOpen(false);
      setCategoryForm({ name: '', description: '' });
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };
  
  const handleAddExpense = async () => {
    if (!selectedCategoryId) return;
    
    try {
      await addItem({
        categoryId: selectedCategoryId,
        name: expenseForm.name,
        amount: parseFloat(expenseForm.amount),
        frequency: expenseForm.frequency,
        applyVat: expenseForm.applyVat,
        notes: expenseForm.notes
      });
      setIsAddExpenseOpen(false);
      setExpenseForm({
        name: '',
        amount: '',
        applyVat: false,
        frequency: 'monthly',
        notes: '',
        categoryId: null
      });
      toast.success('Expense added successfully');
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };
  
  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId);
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };
  
  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await deleteItem(expenseId);
      toast.success('Expense deleted successfully');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };
  
  const handleEditExpense = (item: any) => {
    setEditingExpenseId(item.id);
    setExpenseForm({
      name: item.name,
      amount: item.amount.toString(),
      applyVat: item.applyVat || false,
      frequency: item.frequency || 'monthly',
      notes: item.notes || '',
      categoryId: item.categoryId
    });
    setIsEditExpenseOpen(true);
  };
  
  const handleUpdateExpense = async () => {
    if (!editingExpenseId) return;
    
    try {
      await updateItem(editingExpenseId, {
        name: expenseForm.name,
        amount: parseFloat(expenseForm.amount),
        frequency: expenseForm.frequency,
        applyVat: expenseForm.applyVat,
        notes: expenseForm.notes,
        categoryId: expenseForm.categoryId || undefined
      });
      setIsEditExpenseOpen(false);
      setEditingExpenseId(null);
      setExpenseForm({
        name: '',
        amount: '',
        applyVat: false,
        frequency: 'monthly',
        notes: '',
        categoryId: null
      });
      toast.success('Expense updated successfully');
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };
  
  const handleDragStart = (e: React.DragEvent, itemId: number, categoryId: number) => {
    setDraggedItem({ itemId, sourceCategoryId: categoryId });
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(categoryId);
  };
  
  const handleDragLeave = () => {
    setDragOverCategory(null);
  };
  
  const handleDrop = async (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    setDragOverCategory(null);
    
    if (!draggedItem || draggedItem.sourceCategoryId === targetCategoryId) {
      setDraggedItem(null);
      return;
    }
    
    try {
      await updateItem(draggedItem.itemId, { categoryId: targetCategoryId });
      toast.success('Expense moved successfully');
    } catch (error) {
      toast.error('Failed to move expense');
    }
    
    setDraggedItem(null);
  };
  
  const handleVatRateChange = async (value: string, showToast = true) => {
    // Parse and round to 2 decimal places
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || value === '') {
      await updateDefaultVatRate(0);
    } else {
      // Round to 2 decimal places and convert to decimal (divide by 100)
      const roundedValue = Math.round(parsedValue * 100) / 100;
      const rate = roundedValue / 100;
      await updateDefaultVatRate(rate);
    }
    if (showToast) {
      toast.success('VAT rate updated successfully');
    }
  };
  
  const handleVatInputChange = (value: string) => {
    setVatInputValue(value);
    
    // Clear existing timer
    if (vatDebounceTimer.current) {
      clearTimeout(vatDebounceTimer.current);
    }
    
    // Set new timer for debounced update
    vatDebounceTimer.current = setTimeout(() => {
      handleVatRateChange(value, true);
    }, 1000);
  };
  
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };
  
  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'quarterly': return amount / 3;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };
  
  const categorizedExpensesMap = getCategorizedExpenses();
  const categorizedExpenses = categories.map(category => ({
    ...category,
    items: categorizedExpensesMap.get(category.id!) || []
  }));
  
  // Initialize VAT input value
  useEffect(() => {
    if (defaultVatRate !== undefined) {
      setVatInputValue((defaultVatRate * 100).toFixed(2).replace(/\.?0+$/, ''));
    }
  }, [defaultVatRate]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/apps/financial-analysis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Financial Analysis
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Financial Analysis Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your BTCPay stores and expense tracking</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* API Permissions Required */}
        <PermissionsDisplay 
          permissions={[
            {
              permission: 'btcpay.store.canviewinvoices',
              description: 'View invoices to analyze revenue and transactions',
              required: true
            },
            {
              permission: 'btcpay.store.canviewstoresettings',
              description: 'Access store information and settings',
              required: true
            },
            {
              permission: 'btcpay.store.canmodifyinvoices',
              description: 'Update invoice metadata for tracking',
              required: false
            }
          ]}
        />
        
        {/* Store Configuration - Using our new StoresManager component */}
        <StoresManager />

        {/* Expense Management */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Management</CardTitle>
            <CardDescription>
              Track your business expenses and calculate profit/loss
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* VAT Rate Setting */}
            <div className="space-y-2">
              <Label htmlFor="vat-rate">Default VAT Rate (%)</Label>
              <Input
                id="vat-rate"
                type="text"
                value={vatInputValue}
                onChange={(e) => {
                  // Allow only numbers and decimal point
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    // Only update if it's a valid number format
                    handleVatInputChange(value);
                  }
                }}
                onBlur={(e) => {
                  // Clear any pending timer and save immediately on blur
                  if (vatDebounceTimer.current) {
                    clearTimeout(vatDebounceTimer.current);
                  }
                  const value = e.target.value;
                  handleVatRateChange(value, false);
                }}
                placeholder="e.g., 23"
              />
              <p className="text-sm text-muted-foreground">
                Enter your local VAT rate (e.g., 23 for 23%). Values are automatically rounded to 2 decimal places.
              </p>
            </div>

            {/* Expense Categories */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Expense Categories</h3>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Expense Category</DialogTitle>
                      <DialogDescription>
                        Create a new category to organize your expenses
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="e.g., Office Supplies"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-description">Description (Optional)</Label>
                        <Input
                          id="category-description"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          placeholder="e.g., Monthly office supplies and materials"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddCategory}
                        disabled={!categoryForm.name}
                      >
                        Add Category
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {categories.length === 0 ? (
                <p className="text-muted-foreground">No expense categories yet. Add your first category above.</p>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {categorizedExpenses.map((category) => {
                    const categoryItems = category.items || [];
                    const monthlyTotal = categoryItems.reduce((sum, item) => 
                      sum + calculateMonthlyAmount(item.amount, item.frequency || 'monthly'), 0
                    );
                    
                    return (
                      <AccordionItem key={category.id} value={`category-${category.id}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{category.name}</span>
                              {category.description && (
                                <span className="text-sm text-muted-foreground">
                                  ({category.description})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                €{monthlyTotal.toFixed(2)}/month
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category.id!);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent
                          onDragOver={(e: React.DragEvent) => handleDragOver(e, category.id!)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e: React.DragEvent) => handleDrop(e, category.id!)}
                          className={dragOverCategory === category.id ? 'bg-muted/50' : ''}
                        >
                          <div className="space-y-4 pt-4">
                            <div className="flex justify-end">
                              <Dialog open={isAddExpenseOpen && selectedCategoryId === category.id} 
                                      onOpenChange={(open: boolean) => {
                                        setIsAddExpenseOpen(open);
                                        if (open) setSelectedCategoryId(category.id!);
                                      }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Expense
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Add Expense to {category.name}</DialogTitle>
                                    <DialogDescription>
                                      Add a new expense item to this category
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="expense-name">Expense Name</Label>
                                      <Input
                                        id="expense-name"
                                        value={expenseForm.name}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                                        placeholder="e.g., Internet Service"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="expense-amount">Amount (€)</Label>
                                      <Input
                                        id="expense-amount"
                                        type="number"
                                        step="0.01"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        placeholder="50.00"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="expense-frequency">Frequency</Label>
                                      <Select
                                        value={expenseForm.frequency}
                                        onValueChange={(value: string) => setExpenseForm({ 
                                          ...expenseForm, 
                                          frequency: value as 'monthly' | 'quarterly' | 'yearly' 
                                        })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="monthly">Monthly</SelectItem>
                                          <SelectItem value="quarterly">Quarterly</SelectItem>
                                          <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="expense-vat"
                                        checked={expenseForm.applyVat}
                                        onCheckedChange={(checked: boolean) => setExpenseForm({ ...expenseForm, applyVat: checked })}
                                      />
                                      <Label htmlFor="expense-vat">VAT included?</Label>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="expense-notes">Notes (Optional)</Label>
                                      <Input
                                        id="expense-notes"
                                        value={expenseForm.notes}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={handleAddExpense}
                                      disabled={!expenseForm.name || !expenseForm.amount}
                                    >
                                      Add Expense
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {categoryItems.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No expenses in this category yet
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {categoryItems.map((item) => (
                                  <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item.id!, category.id!)}
                                    className="flex items-center justify-between p-3 border rounded-lg cursor-move hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        <Badge variant="outline">
                                          €{item.amount.toFixed(2)} {getFrequencyLabel(item.frequency || 'monthly')}
                                        </Badge>
                                        {item.applyVat && (
                                          <Badge variant="secondary">VAT incl.</Badge>
                                        )}
                                      </div>
                                      {item.notes && (
                                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditExpense(item)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteExpense(item.id!)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Expense Dialog */}
        <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>
                Modify the expense details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expense-name">Expense Name</Label>
                <Input
                  id="edit-expense-name"
                  value={expenseForm.name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                  placeholder="e.g., Internet Service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expense-amount">Amount (€)</Label>
                <Input
                  id="edit-expense-amount"
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expense-frequency">Frequency</Label>
                <Select
                  value={expenseForm.frequency}
                  onValueChange={(value: string) => setExpenseForm({ 
                    ...expenseForm, 
                    frequency: value as 'monthly' | 'quarterly' | 'yearly' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-expense-vat"
                  checked={expenseForm.applyVat}
                  onCheckedChange={(checked: boolean) => setExpenseForm({ ...expenseForm, applyVat: checked })}
                />
                <Label htmlFor="edit-expense-vat">VAT included?</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expense-notes">Notes (Optional)</Label>
                <Input
                  id="edit-expense-notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expense-category">Move to Category</Label>
                <Select
                  value={expenseForm.categoryId?.toString() || ''}
                  onValueChange={(value: string) => setExpenseForm({ 
                    ...expenseForm, 
                    categoryId: parseInt(value) 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id!.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditExpenseOpen(false);
                  setEditingExpenseId(null);
                  setExpenseForm({
                    name: '',
                    amount: '',
                    applyVat: false,
                    frequency: 'monthly',
                    notes: '',
                    categoryId: null
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateExpense}
                disabled={!expenseForm.name || !expenseForm.amount}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}