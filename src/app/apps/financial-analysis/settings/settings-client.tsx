'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useStores } from '@/contexts/stores-context';
import { useExpenses } from '@/contexts/expenses-context';
import { usePlugins } from '@/contexts/plugins-context';
import { PermissionsDisplay } from '@/components/apps/permissions-display';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StoreFormData {
  label: string;
  storeId: string;
  posFilter?: string;
}

export default function FinancialAnalysisSettings() {
  const { isPluginEnabled } = usePlugins();
  const { stores, isLoading, addStore, updateStore, deleteStore } = useStores();
  const [editingStore, setEditingStore] = useState<{ id: number; data: StoreFormData } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({
    label: '',
    storeId: '',
    posFilter: ''
  });
  
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    amount: '',
    applyVat: false,
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    notes: ''
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
  
  const handleAddStore = async () => {
    try {
      await addStore({
        label: formData.label,
        storeId: formData.storeId,
        posFilter: formData.posFilter,
        isActive: true,
        order: 0
      });
      setIsAddDialogOpen(false);
      setFormData({ label: '', storeId: '', posFilter: '' });
      toast.success('Store added successfully');
    } catch (error) {
      toast.error('Failed to add store');
    }
  };
  
  const handleUpdateStore = async () => {
    if (!editingStore) return;
    
    try {
      await updateStore(editingStore.id, editingStore.data);
      setEditingStore(null);
      toast.success('Store updated successfully');
    } catch (error) {
      toast.error('Failed to update store');
    }
  };
  
  const handleDeleteStore = async (id: number) => {
    try {
      await deleteStore(id);
      toast.success('Store deleted successfully');
    } catch (error) {
      toast.error('Failed to delete store');
    }
  };
  
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
        notes: ''
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
  
  const handleVatRateChange = async (value: string) => {
    const rate = value ? parseFloat(value) / 100 : 0;
    await updateDefaultVatRate(rate);
    toast.success('VAT rate updated successfully');
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
        
        {/* Store Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Store Configuration</CardTitle>
            <CardDescription>
              Manage your BTCPay stores for financial analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">BTCPay Stores</h3>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Store
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add BTCPay Store</DialogTitle>
                      <DialogDescription>
                        Add a new BTCPay store configuration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="store-label">Store Label</Label>
                        <Input
                          id="store-label"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          placeholder="e.g., Main Store"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-id">Store ID</Label>
                        <Input
                          id="store-id"
                          value={formData.storeId}
                          onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                          placeholder="e.g., store-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pos-filter">POS Filter (Optional)</Label>
                        <Input
                          id="pos-filter"
                          value={formData.posFilter}
                          onChange={(e) => setFormData({ ...formData, posFilter: e.target.value })}
                          placeholder="e.g., membership"
                        />
                        <p className="text-sm text-muted-foreground">
                          Filter invoices by POS data field
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddStore}
                        disabled={!formData.label || !formData.storeId}
                      >
                        Add Store
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <p className="text-muted-foreground">Loading stores...</p>
              ) : stores.length === 0 ? (
                <p className="text-muted-foreground">No stores configured. Add your first store above.</p>
              ) : (
                <div className="space-y-2">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Switch
                          checked={store.isActive}
                          onCheckedChange={async (checked) => {
                            await updateStore(store.id!, { ...store, isActive: checked });
                            toast.success(`Store ${checked ? 'activated' : 'deactivated'}`);
                          }}
                        />
                        {editingStore?.id === store.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingStore?.data.label || ''}
                              onChange={(e) => setEditingStore(editingStore ? {
                                ...editingStore,
                                data: { ...editingStore.data, label: e.target.value }
                              } : null)}
                              placeholder="Label"
                              className="h-8"
                            />
                            <Input
                              value={editingStore?.data.storeId || ''}
                              onChange={(e) => setEditingStore(editingStore ? {
                                ...editingStore,
                                data: { ...editingStore.data, storeId: e.target.value }
                              } : null)}
                              placeholder="Store ID"
                              className="h-8"
                            />
                            <Input
                              value={editingStore?.data.posFilter || ''}
                              onChange={(e) => setEditingStore(editingStore ? {
                                ...editingStore,
                                data: { ...editingStore.data, posFilter: e.target.value }
                              } : null)}
                              placeholder="POS Filter"
                              className="h-8"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-medium">{store.label}</span>
                            <Badge variant="outline">{store.storeId}</Badge>
                            {store.posFilter && (
                              <Badge variant="secondary">POS: {store.posFilter}</Badge>
                            )}
                            {!store.isActive && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingStore?.id === store.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleUpdateStore}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingStore(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingStore({
                                id: store.id!,
                                data: {
                                  label: store.label,
                                  storeId: store.storeId,
                                  posFilter: store.posFilter
                                }
                              })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => store.id && handleDeleteStore(store.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultVatRate !== undefined ? (defaultVatRate * 100).toFixed(1) : ''}
                onChange={(e) => handleVatRateChange(e.target.value)}
                placeholder="e.g., 20"
              />
              <p className="text-sm text-muted-foreground">
                Enter your local VAT rate for expense calculations
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category.id!);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <div className="flex justify-end">
                              <Dialog open={isAddExpenseOpen && selectedCategoryId === category.id} 
                                      onOpenChange={(open) => {
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
                                        onValueChange={(value) => setExpenseForm({ 
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
                                        onCheckedChange={(checked) => setExpenseForm({ ...expenseForm, applyVat: checked })}
                                      />
                                      <Label htmlFor="expense-vat">Apply VAT</Label>
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
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        <Badge variant="outline">
                                          €{item.amount.toFixed(2)} {getFrequencyLabel(item.frequency || 'monthly')}
                                        </Badge>
                                        {item.applyVat && (
                                          <Badge variant="secondary">+VAT</Badge>
                                        )}
                                      </div>
                                      {item.notes && (
                                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteExpense(item.id!)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
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
      </div>
    </div>
  );
}