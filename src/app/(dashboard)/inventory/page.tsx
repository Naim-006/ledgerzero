"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  DollarSign,
  Edit2,
  Trash2,
  RefreshCw,
  ArrowUpDown,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { formatMinorUnits } from "@/lib/money";
import { Product } from "@/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export default function InventoryPage() {
  const { business } = useApp();
  const formatMoney = (cents: number) => formatMinorUnits(cents, business?.currency || "USD");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantityDelta, setAdjustQuantityDelta] = useState<string>("");

  // Add/Edit Form State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formPrice, setFormPrice] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formMinAlert, setFormMinAlert] = useState("5");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formBarcode, setFormBarcode] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const list = await dataService.getProducts();
      setProducts(list);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesLowStock = onlyLowStock ? p.stockQuantity <= p.minStockAlert : true;
      return matchesSearch && matchesCat && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, onlyLowStock]);

  // Aggregate Metrics
  const totalRetailValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + p.unitPrice * p.stockQuantity, 0);
  }, [products]);

  const totalCostInvestment = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.costPrice || 0) * p.stockQuantity, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= 0).length;
  }, [products]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku(`SKU-${Date.now().toString().slice(-4)}`);
    setFormCategory("General");
    setFormPrice("");
    setFormCost("");
    setFormStock("0");
    setFormMinAlert("5");
    setFormUnit("pcs");
    setFormBarcode("");
    setFormNotes("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category || "General");
    setFormPrice((p.unitPrice / 100).toFixed(2));
    setFormCost(p.costPrice ? (p.costPrice / 100).toFixed(2) : "");
    setFormStock(p.stockQuantity.toString());
    setFormMinAlert(p.minStockAlert.toString());
    setFormUnit(p.unit || "pcs");
    setFormBarcode(p.barcode || "");
    setFormNotes(p.notes || "");
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;

    const unitPriceCents = Math.round(parseFloat(formPrice) * 100);
    const costPriceCents = formCost ? Math.round(parseFloat(formCost) * 100) : 0;
    const stockQty = parseInt(formStock, 10) || 0;
    const minAlert = parseInt(formMinAlert, 10) || 5;

    try {
      if (editingProduct) {
        await dataService.updateProduct(editingProduct.id, {
          name: formName.trim(),
          sku: formSku.trim(),
          category: formCategory.trim() || "General",
          unitPrice: unitPriceCents,
          costPrice: costPriceCents,
          stockQuantity: stockQty,
          minStockAlert: minAlert,
          unit: formUnit.trim() || "pcs",
          barcode: formBarcode.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await dataService.createProduct({
          businessId: business?.id || "biz_default",
          name: formName.trim(),
          sku: formSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
          category: formCategory.trim() || "General",
          unitPrice: unitPriceCents,
          costPrice: costPriceCents,
          stockQuantity: stockQty,
          minStockAlert: minAlert,
          unit: formUnit.trim() || "pcs",
          barcode: formBarcode.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
      }
      setIsAddModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      alert(`Failed to save product: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from inventory?`)) return;
    try {
      await dataService.deleteProduct(id);
      await loadProducts();
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const delta = parseInt(adjustQuantityDelta, 10);
    if (isNaN(delta) || delta === 0) return;

    try {
      const newStock = Math.max(0, adjustingProduct.stockQuantity + delta);
      await dataService.updateProduct(adjustingProduct.id, { stockQuantity: newStock });
      setAdjustingProduct(null);
      setAdjustQuantityDelta("");
      await loadProducts();
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-forest-action/10 text-forest-action rounded-lg">
            <Boxes className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="gap-2 bg-forest-action hover:bg-forest-actionHover text-white text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* 4 Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Retail Valuation</span>
            <DollarSign className="w-4 h-4 text-forest" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1 tracking-tight">
            {formatMoney(totalRetailValuation)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Potential gross sales value
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Cost Capital Invested</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1 tracking-tight">
            {formatMoney(totalCostInvestment)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Estimated profit: {formatMoney(Math.max(0, totalRetailValuation - totalCostInvestment))}
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1 tracking-tight">
            {lowStockCount} Products
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Below safety reorder threshold
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Out of Stock</span>
            <PackageCheck className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-600 mt-1 tracking-tight">
            {outOfStockCount} Products
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Immediate replenishment required
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search product name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-surface"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-surface text-xs text-foreground focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <Button
            variant={onlyLowStock ? "primary" : "outline"}
            size="sm"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`h-9 text-xs gap-1.5 shrink-0 ${
              onlyLowStock ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock ({lowStockCount + outOfStockCount})
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadProducts}
          className="h-9 text-xs gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Product Inventory Table (Desktop) & Card List (Mobile) */}
      <Card className="bg-surface border-border overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/50 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-center">Gross Margin</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLowStock = !isOutOfStock && p.stockQuantity <= p.minStockAlert;
                  const marginPercent =
                    p.unitPrice > 0
                      ? Math.round(((p.unitPrice - (p.costPrice || 0)) / p.unitPrice) * 100)
                      : 0;

                  return (
                    <tr key={p.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>SKU: {p.sku}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated border border-border text-muted-foreground">
                          {p.category || "General"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {formatMoney(p.unitPrice)}
                      </td>

                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {p.costPrice ? formatMoney(p.costPrice) : "—"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold ${
                            marginPercent >= 40
                              ? "text-emerald-600"
                              : marginPercent >= 20
                              ? "text-blue-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {marginPercent}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">
                            0 {p.unit} (Out of Stock)
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                            {p.stockQuantity} {p.unit} (Low Stock)
                          </Badge>
                        ) : (
                          <span className="font-medium text-foreground">
                            {p.stockQuantity} {p.unit}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {formatMoney(p.unitPrice * p.stockQuantity)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustQuantityDelta("");
                            }}
                            className="h-7 px-2 text-[11px] gap-1"
                          >
                            <ArrowUpDown className="w-3 h-3 text-forest" />
                            Adjust
                          </Button>

                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 hover:bg-surface-elevated rounded-md text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 hover:bg-surface-elevated rounded-md text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Card View */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest" />
              Loading inventory records...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No products found matching the criteria.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isOutOfStock = p.stockQuantity <= 0;
              const isLowStock = !isOutOfStock && p.stockQuantity <= p.minStockAlert;
              const marginPercent =
                p.unitPrice > 0
                  ? Math.round(((p.unitPrice - (p.costPrice || 0)) / p.unitPrice) * 100)
                  : 0;

              return (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{p.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        SKU: {p.sku}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle border border-border text-muted-foreground shrink-0">
                      {p.category || "General"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-surface-subtle rounded-xl border border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Selling Price</span>
                      <span className="font-bold text-foreground">{formatMoney(p.unitPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Stock Level</span>
                      {isOutOfStock ? (
                        <span className="text-red-500 font-semibold text-[11px]">0 {p.unit} (Out of Stock)</span>
                      ) : isLowStock ? (
                        <span className="text-amber-500 font-semibold text-[11px]">{p.stockQuantity} {p.unit} (Low)</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">{p.stockQuantity} {p.unit}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Cost / Margin</span>
                      <span className="text-foreground">{p.costPrice ? formatMoney(p.costPrice) : "—"} ({marginPercent}%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Value</span>
                      <span className="font-semibold text-foreground">{formatMoney(p.unitPrice * p.stockQuantity)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdjustingProduct(p);
                        setAdjustQuantityDelta("");
                      }}
                      className="h-8 px-2.5 text-xs gap-1"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-forest" />
                      Adjust
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(p)}
                      className="h-8 px-2.5 text-xs gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-surface-subtle transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? "Edit Product Details" : "Add New Product to Inventory"}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">Product Name *</label>
            <Input
              required
              placeholder="e.g. Arabica Roast Beans"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">SKU / Code *</label>
              <Input
                required
                placeholder="SKU-100"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                className="mt-1 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Category</label>
              <Input
                placeholder="e.g. Beverages, Grocery"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Selling Price ($) *</label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Cost Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Stock Quantity</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Min Alert Threshold</label>
              <Input
                type="number"
                min="0"
                placeholder="5"
                value={formMinAlert}
                onChange={(e) => setFormMinAlert(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Unit</label>
              <Input
                placeholder="pcs, box, kg"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Barcode (Optional)</label>
              <Input
                placeholder="880123456789"
                value={formBarcode}
                onChange={(e) => setFormBarcode(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Notes / Supplier</label>
              <Input
                placeholder="Supplier batch notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-forest-action hover:bg-forest-actionHover text-white">
              {editingProduct ? "Update Product" : "Save to Inventory"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Modal */}
      {adjustingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setAdjustingProduct(null)}
          title={`Adjust Stock: ${adjustingProduct.name}`}
        >
          <form onSubmit={handleStockAdjustment} className="space-y-4">
            <div className="p-3 bg-surface-elevated rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Available Stock:</span>
                <span className="font-bold text-foreground">
                  {adjustingProduct.stockQuantity} {adjustingProduct.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retail Unit Price:</span>
                <span>{formatMoney(adjustingProduct.unitPrice)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Stock Quantity Change (+ to add shipment, - to remove damaged/lost)
              </label>
              <Input
                required
                type="number"
                placeholder="+25 or -5"
                value={adjustQuantityDelta}
                onChange={(e) => setAdjustQuantityDelta(e.target.value)}
                className="mt-1 text-base font-bold"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                New stock level will be:{" "}
                <span className="font-bold text-foreground">
                  {Math.max(
                    0,
                    adjustingProduct.stockQuantity + (parseInt(adjustQuantityDelta, 10) || 0)
                  )}{" "}
                  {adjustingProduct.unit}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustingProduct(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-forest-action hover:bg-forest-actionHover text-white">
                Confirm Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
