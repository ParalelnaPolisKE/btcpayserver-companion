"use client";

import {
  getAvailableStores,
  getStorePOSApps,
} from "@bps-companion/app/actions/btcpay-stores";
import { Alert, AlertDescription } from "@bps-companion/components/ui/alert";
import { Badge } from "@bps-companion/components/ui/badge";
import { Button } from "@bps-companion/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bps-companion/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@bps-companion/components/ui/dialog";
import { Input } from "@bps-companion/components/ui/input";
import { Label } from "@bps-companion/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bps-companion/components/ui/select";
import { Switch } from "@bps-companion/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bps-companion/components/ui/table";
import {
  Check,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Store as StoreIcon,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStores } from "../contexts/stores-context";

export function StoresManager() {
  const { stores, addStore, updateStore, removeStore } = useStores();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [availableStores, setAvailableStores] = useState<
    Array<{ id: string; name: string; website?: string }>
  >([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [posApps, setPosApps] = useState<
    Array<{ id: string; appName: string; title: string }>
  >([]);
  const [loadingPosApps, setLoadingPosApps] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [formData, setFormData] = useState({
    storeId: "",
    storeName: "",
    posFilters: [] as Array<{
      id: string;
      name: string;
      filter: string;
      description?: string;
    }>,
    isActive: true,
  });
  const [currentFilter, setCurrentFilter] = useState({
    name: "",
    filter: "",
    description: "",
  });
  const [editFormData, setEditFormData] = useState({
    storeName: "",
    posFilters: [] as Array<{
      id: string;
      name: string;
      filter: string;
      description?: string;
    }>,
    isActive: true,
  });

  // Fetch available stores from API
  const fetchAvailableStores = async () => {
    setLoadingStores(true);
    try {
      const result = await getAvailableStores();
      if (result.success) {
        setAvailableStores(result.stores);
        setIsUsingMockData(result.isUsingMockData);
      } else {
        toast.error("Failed to fetch available stores from BTCPayServer");
      }
    } catch (_error) {
      toast.error("Failed to connect to BTCPayServer");
    } finally {
      setLoadingStores(false);
    }
  };

  // Fetch stores when dialog opens
  useEffect(() => {
    if (isAddDialogOpen && availableStores.length === 0) {
      fetchAvailableStores();
    }
  }, [isAddDialogOpen, availableStores.length, fetchAvailableStores]);

  // Fetch POS apps for selected store
  const fetchPOSApps = async (storeId: string) => {
    console.log("Fetching POS apps for store:", storeId);
    setLoadingPosApps(true);
    setPosApps([]);
    try {
      const result = await getStorePOSApps(storeId);
      console.log("POS apps result:", result);
      if (result.success) {
        setPosApps(result.posApps);
        if (result.posApps.length > 0) {
          toast.success(
            `Found ${result.posApps.length} POS app${result.posApps.length !== 1 ? "s" : ""}`,
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch POS apps:", error);
      toast.error("Failed to load POS apps");
    } finally {
      setLoadingPosApps(false);
    }
  };

  // Handle store selection from dropdown
  const handleStoreSelect = async (storeId: string) => {
    const selectedStore = availableStores.find((s) => s.id === storeId);
    if (selectedStore) {
      setFormData({
        ...formData,
        storeId: selectedStore.id,
        storeName: selectedStore.name,
        posFilters: [], // Reset POS filters when selecting new store
      });
      // Fetch POS apps for this store
      await fetchPOSApps(storeId);
    }
  };

  // Add a POS filter to the list
  const addPosFilter = () => {
    if (!currentFilter.name || !currentFilter.filter) {
      toast.error("Filter name and value are required");
      return;
    }

    // Check for duplicates
    if (formData.posFilters.some((f) => f.filter === currentFilter.filter)) {
      toast.error("This filter already exists");
      return;
    }

    const newFilter = {
      id: crypto.randomUUID(),
      name: currentFilter.name,
      filter: currentFilter.filter,
      description: currentFilter.description || undefined,
    };

    setFormData({
      ...formData,
      posFilters: [...formData.posFilters, newFilter],
    });

    // Reset current filter
    setCurrentFilter({ name: "", filter: "", description: "" });
    toast.success("Filter added");
  };

  // Remove a POS filter from the list
  const removePosFilter = (filterId: string) => {
    setFormData({
      ...formData,
      posFilters: formData.posFilters.filter((f) => f.id !== filterId),
    });
  };

  const handleAdd = async () => {
    if (!formData.storeId || !formData.storeName) {
      toast.error("Store ID and Name are required");
      return;
    }

    // Check if store ID already exists
    if (stores.some((s) => s.storeId === formData.storeId)) {
      toast.error("Store with this ID already exists");
      return;
    }

    try {
      await addStore({
        storeId: formData.storeId,
        storeName: formData.storeName,
        posFilters: formData.posFilters,
        isActive: formData.isActive,
      });
      toast.success("Store added successfully");
      setIsAddDialogOpen(false);
      setFormData({
        storeId: "",
        storeName: "",
        posFilters: [],
        isActive: true,
      });
    } catch (_error) {
      toast.error("Failed to add store");
    }
  };

  const handleEdit = (storeId: string) => {
    const store = stores.find((s) => s.storeId === storeId);
    if (store) {
      setEditingStoreId(storeId);
      setEditFormData({
        storeName: store.storeName,
        posFilters: store.posFilters || [],
        isActive: store.isActive,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStoreId) return;

    try {
      await updateStore(editingStoreId, {
        storeName: editFormData.storeName,
        posFilters: editFormData.posFilters,
        isActive: editFormData.isActive,
      });
      toast.success("Store updated successfully");
      setEditingStoreId(null);
    } catch (_error) {
      toast.error("Failed to update store");
    }
  };

  const handleCancelEdit = () => {
    setEditingStoreId(null);
  };

  const handleDelete = async (storeId: string) => {
    if (confirm("Are you sure you want to remove this store?")) {
      try {
        await removeStore(storeId);
        toast.success("Store removed successfully");
      } catch (_error) {
        toast.error("Failed to remove store");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Store Management</CardTitle>
            <CardDescription>
              Configure stores for financial analysis with optional POS filters
            </CardDescription>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              // Reset form when closing
              if (!open) {
                setFormData({
                  storeId: "",
                  storeName: "",
                  posFilters: [],
                  isActive: true,
                });
                setCurrentFilter({ name: "", filter: "", description: "" });
                setPosApps([]);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Store</DialogTitle>
                <DialogDescription>
                  Select a store from your BTCPayServer or enter details
                  manually. The POS filter allows you to track specific item
                  types.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto px-1 flex-1">
                {/* Store Selector from API */}
                <div className="space-y-2">
                  <Label>Select Store from BTCPayServer</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={handleStoreSelect}
                      disabled={loadingStores}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue
                          placeholder={
                            loadingStores
                              ? "Loading stores..."
                              : "Select a store"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStores.map((store) => {
                          // Shorten store ID for display: first5...last5
                          const displayId =
                            store.id.length > 12
                              ? `${store.id.slice(0, 5)}...${store.id.slice(-5)}`
                              : store.id;

                          return (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name} ({displayId})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={fetchAvailableStores}
                      disabled={loadingStores}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loadingStores ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                  {isUsingMockData && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        Using sample data. Connect to BTCPayServer for real
                        stores.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or enter manually
                    </span>
                  </div>
                </div>

                {/* Manual Entry Fields */}
                <div className="space-y-2">
                  <Label htmlFor="storeId">Store ID</Label>
                  <Input
                    id="storeId"
                    placeholder="e.g., store-123"
                    value={formData.storeId}
                    onChange={(e) =>
                      setFormData({ ...formData, storeId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    placeholder="e.g., Main Store"
                    value={formData.storeName}
                    onChange={(e) =>
                      setFormData({ ...formData, storeName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>POS Filters (Optional)</Label>

                  {/* Show loading state */}
                  {loadingPosApps && (
                    <Alert>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Loading POS apps for selected store...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Display existing filters */}
                  {formData.posFilters.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Added Filters:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.posFilters.map((filter) => (
                          <Badge
                            key={filter.id}
                            variant="secondary"
                            className="gap-1"
                          >
                            <span>{filter.name}</span>
                            <span className="text-xs opacity-70">
                              ({filter.filter})
                            </span>
                            <button
                              type="button"
                              onClick={() => removePosFilter(filter.id)}
                              className="ml-1 hover:opacity-70"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new filter form */}
                  <div className="space-y-2 border rounded-lg p-3">
                    <p className="text-sm font-medium">Add New Filter:</p>

                    {/* POS App quick selector if available */}
                    {!loadingPosApps && posApps.length > 0 && (
                      <div className="space-y-2">
                        <Select
                          onValueChange={(value) => {
                            const app = posApps.find(
                              (a) => a.appName === value,
                            );
                            if (app) {
                              setCurrentFilter({
                                name: app.title,
                                filter: app.appName,
                                description: `POS App: ${app.title}`,
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Quick add from POS apps" />
                          </SelectTrigger>
                          <SelectContent>
                            {posApps.map((app) => (
                              <SelectItem key={app.id} value={app.appName}>
                                {app.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {posApps.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Found {posApps.length} POS app
                            {posApps.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="filterName" className="text-xs">
                          Filter Name
                        </Label>
                        <Input
                          id="filterName"
                          placeholder="e.g., Memberships"
                          value={currentFilter.name}
                          onChange={(e) =>
                            setCurrentFilter({
                              ...currentFilter,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="filterValue" className="text-xs">
                          Filter Value
                        </Label>
                        <Input
                          id="filterValue"
                          placeholder="e.g., membership"
                          value={currentFilter.filter}
                          onChange={(e) =>
                            setCurrentFilter({
                              ...currentFilter,
                              filter: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="filterDesc" className="text-xs">
                        Description (Optional)
                      </Label>
                      <Input
                        id="filterDesc"
                        placeholder="e.g., Track membership sales only"
                        value={currentFilter.description}
                        onChange={(e) =>
                          setCurrentFilter({
                            ...currentFilter,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPosFilter}
                      disabled={!currentFilter.name || !currentFilter.filter}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Add multiple filters to track different types of
                    transactions. You can switch between them in the dashboard.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({
                      storeId: "",
                      storeName: "",
                      posFilters: [],
                      isActive: true,
                    });
                    setCurrentFilter({ name: "", filter: "", description: "" });
                    setPosApps([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!formData.storeId || !formData.storeName}
                >
                  Add Store
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StoreIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="mb-2">No stores configured</p>
            <p className="text-sm">
              Add your first store to start tracking financial data
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>POS Filters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.storeId}>
                  {editingStoreId === store.storeId ? (
                    <>
                      <TableCell className="font-mono text-sm">
                        {store.storeId}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editFormData.storeName}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              storeName: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        {editFormData.posFilters &&
                        editFormData.posFilters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {editFormData.posFilters.map((filter) => (
                              <Badge
                                key={filter.id}
                                variant="secondary"
                                className="gap-1 text-xs"
                              >
                                <Filter className="h-3 w-3" />
                                {filter.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No filters
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={editFormData.isActive}
                          onCheckedChange={(checked) =>
                            setEditFormData({
                              ...editFormData,
                              isActive: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSaveEdit}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-mono text-sm">
                        {store.storeId}
                      </TableCell>
                      <TableCell>{store.storeName}</TableCell>
                      <TableCell>
                        {store.posFilters && store.posFilters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {store.posFilters.map((filter) => (
                              <Badge
                                key={filter.id}
                                variant="secondary"
                                className="gap-1 text-xs"
                              >
                                <Filter className="h-3 w-3" />
                                {filter.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No filters
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={store.isActive ? "default" : "secondary"}
                        >
                          {store.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(store.storeId)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(store.storeId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
