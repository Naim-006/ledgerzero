"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  Printer,
  Package,
  Boxes,
  ArrowRight,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCcw,
  AlertCircle,
  Tag,
  Receipt,
  User,
  Phone,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { formatMinorUnits } from "@/lib/money";
import { Product, PosSaleItem, PosSaleResult } from "@/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface CartItem extends PosSaleItem {
  stockAvailable: number;
}

const SAMPLE_STARTER_PRODUCTS = [
  { name: "Artisan Coffee Beans (250g)", sku: "COF-001", category: "Beverages", unitPrice: 1450, costPrice: 800, stockQuantity: 45, unit: "bag" },
  { name: "Organic Green Tea (50 bags)", sku: "TEA-002", category: "Beverages", unitPrice: 950, costPrice: 500, stockQuantity: 60, unit: "box" },
  { name: "Wireless Bluetooth Mouse", sku: "TECH-101", category: "Electronics", unitPrice: 2800, costPrice: 1600, stockQuantity: 18, unit: "pcs" },
  { name: "Braided USB-C Cable (2m)", sku: "TECH-102", category: "Electronics", unitPrice: 1200, costPrice: 450, stockQuantity: 35, unit: "pcs" },
  { name: "Hardcover Executive Notebook", sku: "STAT-201", category: "Stationery", unitPrice: 1600, costPrice: 750, stockQuantity: 40, unit: "pcs" },
  { name: "Premium Ballpoint Pen Set", sku: "STAT-202", category: "Stationery", unitPrice: 850, costPrice: 320, stockQuantity: 50, unit: "set" },
  { name: "Organic Almond Snack Pack", sku: "SNK-301", category: "Grocery", unitPrice: 550, costPrice: 280, stockQuantity: 70, unit: "pack" },
  { name: "Canvas Reusable Shopping Tote", sku: "APP-401", category: "Apparel", unitPrice: 700, costPrice: 250, stockQuantity: 25, unit: "pcs" },
];

export default function PosPage() {
  const { business, refreshData } = useApp();
  const formatMoney = (cents: number) => formatMinorUnits(cents, business?.currency || "USD");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_mfs" | "bank_transfer">("cash");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<PosSaleResult | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // New product form state
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("General");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCost, setNewProdCost] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newProdUnit, setNewProdUnit] = useState("pcs");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const list = await dataService.getProducts();
      setProducts(list);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const initializeStarterInventory = async () => {
    try {
      setLoading(true);
      for (const item of SAMPLE_STARTER_PRODUCTS) {
        await dataService.createProduct({
          businessId: business?.id || "biz_default",
          name: item.name,
          sku: item.sku,
          category: item.category,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          stockQuantity: item.stockQuantity,
          minStockAlert: 10,
          unit: item.unit,
        });
      }
      await loadProducts();
    } catch (e) {
      console.error("Failed to seed starter products:", e);
    } finally {
      setLoading(false);
    }
  };

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
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev; // Cannot exceed stock
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.unitPrice,
          subtotal: product.unitPrice,
          stockAvailable: product.stockQuantity,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stockAvailable) return item;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountPercent(0);
    setSaleNotes("");
  };

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountPercent <= 0) return 0;
    return Math.round(cartSubtotal * (Math.min(100, discountPercent) / 100));
  }, [cartSubtotal, discountPercent]);

  const taxRate = business?.taxRatePercent || 0;
  const taxAmount = useMemo(() => {
    return Math.round((cartSubtotal - discountAmount) * (taxRate / 100));
  }, [cartSubtotal, discountAmount, taxRate]);

  const grandTotal = Math.max(0, cartSubtotal - discountAmount + taxAmount);

  const handleCompleteSale = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const result = await dataService.recordPosSale({
        items: cart.map((c) => ({
          productId: c.productId,
          name: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          subtotal: c.subtotal,
        })),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        discountAmount,
        taxRatePercent: taxRate,
        notes: saleNotes.trim() || undefined,
      });

      setCompletedSale(result);
      setIsReceiptModalOpen(true);
      clearCart();
      await loadProducts();
      await refreshData();
    } catch (err: any) {
      alert(`Sale failed to process: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    try {
      const priceCents = Math.round(parseFloat(newProdPrice) * 100);
      const costCents = newProdCost ? Math.round(parseFloat(newProdCost) * 100) : 0;
      const stock = parseInt(newProdStock, 10) || 0;

      await dataService.createProduct({
        businessId: business?.id || "biz_default",
        name: newProdName.trim(),
        sku: newProdSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        category: newProdCategory.trim() || "General",
        unitPrice: priceCents,
        costPrice: costCents,
        stockQuantity: stock,
        minStockAlert: 5,
        unit: newProdUnit.trim() || "pcs",
      });

      setIsNewProductModalOpen(false);
      setNewProdName("");
      setNewProdSku("");
      setNewProdPrice("");
      setNewProdCost("");
      setNewProdStock("");
      await loadProducts();
    } catch (err: any) {
      alert(`Failed to add product: ${err.message}`);
    }
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Point of Sale (POS) Cashier Register</h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
              Live Sync
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Fast counter selling with instant stock deduction, customer invoice creation, and automatic revenue settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Boxes className="w-4 h-4" />
              Manage Inventory
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setIsNewProductModalOpen(true)}
            className="gap-2 bg-forest-action hover:bg-forest-actionHover text-white text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Main POS Layout: 2 Columns (Catalog on Left, Cart on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Catalog (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-surface text-sm h-10"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-forest-action text-white"
                    : "bg-surface hover:bg-surface-subtle text-foreground/80 border border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-surface rounded-xl border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-8 text-center space-y-4 bg-surface border-dashed">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground">No Products Found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No product matches "${searchQuery}". Try a different keyword.`
                    : "Your inventory catalog is currently empty. Add your first item or load standard starter inventory."}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  onClick={initializeStarterInventory}
                  className="bg-forest-action hover:bg-forest-actionHover text-white text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-lime-accent" />
                  Load Starter Inventory (8 Items)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Custom Product
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && p.stockQuantity <= p.minStockAlert;
                const inCart = cart.find((i) => i.productId === p.id);
                const currentCartQty = inCart ? inCart.quantity : 0;
                const isMaxInCart = currentCartQty >= p.stockQuantity;

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock || isMaxInCart}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between h-36 relative group select-none ${
                      isOutOfStock
                        ? "bg-muted/40 border-border opacity-60 cursor-not-allowed"
                        : isMaxInCart
                        ? "bg-surface border-amber-500/40 cursor-default"
                        : "bg-surface hover:border-forest/50 hover:shadow-xs active:scale-[0.98] border-border"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase truncate">
                          {p.sku}
                        </span>
                        {isOutOfStock ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                            Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {p.stockQuantity} left
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {p.stockQuantity} {p.unit}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex items-end justify-between mt-2 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-sm font-bold text-foreground">
                          {formatMoney(p.unitPrice)}
                        </span>
                        {p.category && (
                          <span className="block text-[10px] text-muted-foreground truncate max-w-[80px]">
                            {p.category}
                          </span>
                        )}
                      </div>

                      {currentCartQty > 0 ? (
                        <div className="w-6 h-6 rounded-full bg-forest-action text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {currentCartQty}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-surface-subtle text-text-dim group-hover:bg-forest-action group-hover:text-white transition-colors flex items-center justify-center shrink-0 border border-border">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Sale Cart (5 or 4 cols) */}
        <div id="pos-cart-panel" className="lg:col-span-5 xl:col-span-4 scroll-mt-20">
          <Card className="p-4 bg-surface border-border sticky top-4 shadow-sm flex flex-col space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-forest-action" />
                <h3 className="font-bold text-sm text-foreground">Active Sale Register</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-forest-action/10 text-forest-action font-semibold">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Customer Details (Optional) */}
            <div className="space-y-2 bg-surface-elevated/60 p-2.5 rounded-lg border border-border/60">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="w-3 h-3" /> Customer (Optional)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs bg-surface"
                />
                <Input
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-8 text-xs bg-surface"
                />
              </div>
            </div>

            {/* Cart Line Items List */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">Cart is currently empty</p>
                  <p className="text-[11px] text-muted-foreground/80 max-w-[200px] mx-auto">
                    Click any product on the left catalog to add it to this sale.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 rounded-lg bg-surface border border-border/70 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatMoney(item.unitPrice)} each
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded bg-surface-elevated border border-border hover:bg-muted flex items-center justify-center text-muted-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        disabled={item.quantity >= item.stockAvailable}
                        className="w-6 h-6 rounded bg-surface-elevated border border-border hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0 w-16">
                      <div className="font-bold text-foreground">{formatMoney(item.subtotal)}</div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3 h-3 ml-auto" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <span className="text-[11px] font-semibold text-muted-foreground">Payment Method</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "mobile_mfs", label: "MFS / Wallet", icon: Smartphone },
                  { id: "bank_transfer", label: "Bank", icon: Building },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? "bg-forest/10 border-forest text-forest font-semibold"
                          : "bg-surface hover:bg-surface-elevated border-border text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] leading-tight truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary & Breakdown */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(cartSubtotal)}</span>
              </div>

              {taxRate > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{business?.taxLabel || "Tax"} ({taxRate}%)</span>
                  <span>+{formatMoney(taxAmount)}</span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Discount (%)</span>
                <div className="w-20">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    placeholder="0%"
                    className="h-7 text-xs text-right pr-2"
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Savings</span>
                  <span>-{formatMoney(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-2 border-t border-border">
                <span className="text-sm font-bold text-foreground">Grand Total Due</span>
                <span className="text-xl font-extrabold text-foreground tracking-tight">
                  {formatMoney(grandTotal)}
                </span>
              </div>
            </div>

            {/* 1-Click Complete Sale Button */}
            <Button
              size="lg"
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitting}
              className="w-full bg-forest-action hover:bg-forest-actionHover text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] gap-2"
            >
              {submitting ? (
                <>Processing Sale & Deducting Stock...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  Complete Sale & Print Receipt ({formatMoney(grandTotal)})
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>

      {/* Official Receipt & Tax Invoice Modal */}
      {completedSale && (
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Official Sales Receipt & Tax Invoice"
        >
          <div className="space-y-6">
            {/* Printable Thermal Receipt Card */}
            <div
              id="printable-pos-receipt"
              className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 font-mono text-xs shadow-inner space-y-4"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                <div className="text-base font-black tracking-wider uppercase">
                  {business?.legalName || business?.name || "LEDGER ZERO ENTERPRISE"}
                </div>
                <div className="text-[11px] text-slate-600">
                  {business?.taxIdentifier ? `VAT / Tax ID: ${business.taxIdentifier}` : "Official Commercial Receipt"}
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(completedSale.receiptDate).toLocaleString()}
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="flex justify-between text-[11px] text-slate-700 pb-2 border-b border-slate-200">
                <div>
                  <span className="font-bold">Receipt #: </span>
                  {completedSale.receiptNumber}
                </div>
                <div>
                  <span className="font-bold">Method: </span>
                  {completedSale.paymentMethod.toUpperCase()}
                </div>
              </div>

              {completedSale.customerName && (
                <div className="text-[11px] text-slate-700">
                  <span className="font-bold">Customer: </span>
                  {completedSale.customerName}{" "}
                  {completedSale.customerPhone ? `(${completedSale.customerPhone})` : ""}
                </div>
              )}

              {/* Itemized Table */}
              <div className="space-y-2 py-2 border-b border-dashed border-slate-300">
                <div className="grid grid-cols-12 font-bold text-slate-800 pb-1 border-b border-slate-200">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Total</div>
                </div>
                {completedSale.items.map((i, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-slate-700">
                    <div className="col-span-6 truncate">{i.name}</div>
                    <div className="col-span-2 text-center">{i.quantity}</div>
                    <div className="col-span-4 text-right font-medium">{formatMoney(i.subtotal)}</div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-right pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{formatMoney(completedSale.subtotal)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatMoney(completedSale.discountAmount)}</span>
                  </div>
                )}
                {completedSale.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax:</span>
                    <span>+{formatMoney(completedSale.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-900 text-slate-950">
                  <span>TOTAL PAID:</span>
                  <span>{formatMoney(completedSale.totalPaid)}</span>
                </div>
              </div>

              {/* Simulated Barcode */}
              <div className="pt-4 text-center space-y-1">
                <div className="h-8 bg-slate-900 w-48 mx-auto flex items-center justify-around px-2 rounded-xs">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-white ${i % 3 === 0 ? "w-1" : i % 2 === 0 ? "w-0.5" : "w-1.5"}`}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest">
                  *{completedSale.receiptNumber}*
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
                Settled instantly to financial ledger. Thank you!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={triggerPrintReceipt}
                  className="gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </Button>
                <Link href="/invoices">
                  <Button variant="outline" className="gap-2 text-xs">
                    View in Invoices
                  </Button>
                </Link>
              </div>

              <Button
                onClick={() => setIsReceiptModalOpen(false)}
                className="bg-forest-action hover:bg-forest-actionHover text-white text-xs w-full sm:w-auto"
              >
                Start Next Sale
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Product Modal */}
      <Modal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        title="Add New Product to Inventory"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">Product Name *</label>
            <Input
              required
              placeholder="e.g. Wireless Barcode Scanner"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">SKU / Code</label>
              <Input
                placeholder="e.g. ELEC-042"
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Category</label>
              <Input
                placeholder="e.g. Electronics, Grocery"
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
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
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
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
                value={newProdCost}
                onChange={(e) => setNewProdCost(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Initial Stock Quantity</label>
              <Input
                type="number"
                min="0"
                placeholder="100"
                value={newProdStock}
                onChange={(e) => setNewProdStock(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Unit</label>
              <Input
                placeholder="pcs, box, kg"
                value={newProdUnit}
                onChange={(e) => setNewProdUnit(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-forest-action hover:bg-forest-actionHover text-white">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mobile Sticky Cart & Quick Checkout Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 inset-x-4 z-30 bg-surface/95 border border-forest-action/40 p-3 rounded-2xl shadow-2xl flex items-center justify-between backdrop-blur-md">
          <div className="min-w-0">
            <div className="text-[11px] text-text-dim">
              {cart.reduce((s, i) => s + i.quantity, 0)} items in sale
            </div>
            <div className="text-base font-extrabold text-foreground tabular-nums">
              {formatMoney(grandTotal)}
            </div>
          </div>
          <button
            onClick={() => {
              const cartElem = document.getElementById("pos-cart-panel");
              cartElem?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 bg-forest-action hover:bg-forest-actionHover text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Go to Checkout</span>
          </button>
        </div>
      )}
    </div>
  );
}
