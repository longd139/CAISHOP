'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useHeaderNav } from '@/lib/useSiteContent';
import { FolderTree, ChevronDown, ChevronRight, Layers, Tag, Filter, X, Sparkles, Package, ShoppingBag, Award, Crown, TrendingUp, User } from 'lucide-react';
import { BrandCollection } from '@/app/api/collections/route';
import { calculateTier, getNextTierInfo } from '@/lib/membership';
import { getPrimaryImageUrl } from '@/lib/productImages';
import { CustomSelect } from '@/components/CustomSelect';
import { useAuth } from '@/lib/useAuth';
import { UserProfileModal } from '@/components/UserProfileModal';

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
  cost_price: number;
  selling_price: number;
  floor_price: number;
  physical_qty: number;
  reserved_qty: number;
  available_qty: number;
  safety_threshold: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  variants: ProductVariant[];
}

interface CartItem {
  variant_id: string;
  product_name: string;
  product_image: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  available_qty: number;
}

export default function ProductCatalog() {
  const { items: headerNavItems } = useHeaderNav();
  const { user, isLoggedIn, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Collection / Taxonomy states (Brand -> Nhóm -> Danh mục con)
  const [collections, setCollections] = useState<BrandCollection[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [selectedSubId, setSelectedSubId] = useState<string>('ALL');
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Quick View / Modal
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Checkout states
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Auto pre-fill customer name and phone if logged in
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user, customerName, customerPhone]);

  // Open cart drawer automatically if redirected with ?openCart=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openCart') === 'true') {
        setIsBagOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('openCart');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch products and collections
  useEffect(() => {
    fetch('/api/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
        }
      })
      .catch((err) => console.error('Error loading products:', err))
      .finally(() => setLoading(false));

    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCollections(data.data);
          // Mở rộng thương hiệu đầu tiên mặc định
          if (data.data.length > 0) {
            setExpandedBrands({ [data.data[0].id]: true });
          }
        }
      })
      .catch((err) => console.error('Error loading collections:', err));
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category tab filter
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
          return false;
        }

        // Collection / Taxonomy Tree Filter
        if (selectedSubId !== 'ALL') {
          const matchedSub = collections
            .flatMap((c) => c.groups)
            .flatMap((g) => g.items)
            .find((s) => s.id === selectedSubId);
          if (matchedSub) {
            const hasExplicit = matchedSub.product_ids && matchedSub.product_ids.length > 0;
            if (hasExplicit) {
              if (!matchedSub.product_ids.includes(p.id)) return false;
            } else {
              const subKeywords = matchedSub.name.toLowerCase().replace(/áo |quần |mục con /g, '').trim();
              const matchText = (p.name + ' ' + (p.category || '')).toLowerCase();
              if (subKeywords && !matchText.includes(subKeywords)) return false;
            }
          }
        } else if (selectedGroupId !== 'ALL') {
          const matchedGroup = collections
            .flatMap((c) => c.groups)
            .find((g) => g.id === selectedGroupId);
          if (matchedGroup) {
            const allSubIds = matchedGroup.items.flatMap((s) => s.product_ids || []);
            if (allSubIds.length > 0) {
              if (!allSubIds.includes(p.id)) return false;
            } else {
              const grpKey = matchedGroup.slug;
              const matchText = (p.name + ' ' + (p.category || '')).toLowerCase();
              if (grpKey === 'ao' && !['t-shirt', 'shirt', 'polo', 'jacket', 'ao'].some(k => matchText.includes(k))) return false;
              if (grpKey === 'quan' && !['pants', 'jeans', 'quan', 'shorts'].some(k => matchText.includes(k))) return false;
            }
          }
        } else if (selectedBrandId !== 'ALL') {
          const matchedBrand = collections.find((c) => c.id === selectedBrandId);
          if (matchedBrand) {
            const allBrandProductIds = matchedBrand.groups
              .flatMap((g) => g.items)
              .flatMap((s) => s.product_ids || []);
            if (allBrandProductIds.length > 0) {
              if (!allBrandProductIds.includes(p.id)) return false;
            } else {
              const bName = matchedBrand.brand.toLowerCase();
              const matchText = (p.name + ' ' + (p.description || '')).toLowerCase();
              if (!matchText.includes(bName)) return false;
            }
          }
        }

        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDesc = p.description?.toLowerCase().includes(q);
          const matchesSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
          if (!matchesName && !matchesDesc && !matchesSku) return false;
        }

        // In-stock only
        if (inStockOnly) {
          const totalAvail = p.variants.reduce((sum, v) => sum + v.available_qty, 0);
          if (totalAvail <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const minPriceA = Math.min(...a.variants.map((v) => v.selling_price));
        const minPriceB = Math.min(...b.variants.map((v) => v.selling_price));

        if (sortBy === 'price-asc') return minPriceA - minPriceB;
        if (sortBy === 'price-desc') return minPriceB - minPriceA;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, selectedCategory, selectedBrandId, selectedGroupId, selectedSubId, collections, searchQuery, sortBy, inStockOnly]);

  // Active collection label helpers
  const activeBrandObj = collections.find((c) => c.id === selectedBrandId);
  const activeGroupObj = activeBrandObj?.groups.find((g) => g.id === selectedGroupId);
  const activeSubObj = activeGroupObj?.items.find((s) => s.id === selectedSubId);
  const hasActiveCollectionFilter = selectedBrandId !== 'ALL' || selectedGroupId !== 'ALL' || selectedSubId !== 'ALL';

  // Quick view handler
  const handleOpenProduct = (product: Product) => {
    setActiveProduct(product);
    if (product.variants.length > 0) {
      setSelectedColor(product.variants[0].color);
      setSelectedSize(product.variants[0].size);
    }
  };

  const activeVariant = activeProduct?.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Add to Bag
  const handleAddToBag = () => {
    if (!activeProduct || !activeVariant) return;

    if (activeVariant.available_qty <= 0) {
      showToast('Sản phẩm đã hết hàng trong kho.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.variant_id === activeVariant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant_id === activeVariant.id
            ? { ...item, quantity: Math.min(item.available_qty, item.quantity + 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          variant_id: activeVariant.id,
          product_name: activeProduct.name,
          product_image: activeProduct.image_url,
          sku: activeVariant.sku,
          color: activeVariant.color,
          size: activeVariant.size,
          price: activeVariant.selling_price,
          quantity: 1,
          available_qty: activeVariant.available_qty,
        },
      ];
    });

    showToast(`✓ Đã thêm vào giỏ hàng: ${activeProduct.name} (${activeVariant.color} / Size ${activeVariant.size})`);
    setActiveProduct(null);
  };

  // Quick Add to Cart from product cards
  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    const variant = product.variants.find((v) => v.available_qty > 0);
    if (!variant) {
      showToast('Sản phẩm này hiện đang tạm hết hàng.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.variant_id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant_id === variant.id
            ? { ...item, quantity: Math.min(item.available_qty, item.quantity + 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          variant_id: variant.id,
          product_name: product.name,
          product_image: getPrimaryImageUrl(product.image_url),
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          price: variant.selling_price,
          quantity: 1,
          available_qty: variant.available_qty,
        },
      ];
    });

    showToast(`✓ Đã thêm vào giỏ hàng: ${product.name} (Size ${variant.size})`);
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(item.available_qty, newQty) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variantId));
  };

  // Membership rank state
  const [membershipData, setMembershipData] = useState<{ past_items: number; tier_name: string } | null>(null);

  // Auto-check customer membership by phone
  useEffect(() => {
    if (!customerPhone || customerPhone.trim().length < 9) {
      setMembershipData(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/membership?phone=${encodeURIComponent(customerPhone.trim())}`);
        const data = await res.json();
        if (data.success && data.data) {
          setMembershipData({
            past_items: data.data.past_items || 0,
            tier_name: data.data.tier?.name || 'Hội viên Đồng'
          });
        }
      } catch (e) { }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const effectiveTotalItems = totalBagCount + (membershipData?.past_items || 0);
  const currentTier = calculateTier(effectiveTotalItems);
  const discountPercent = currentTier.discount_percent;
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountPercent > 0 ? Math.round((cartSubtotal * discountPercent) / 100) : 0;
  const cartAfterDiscount = Math.max(0, cartSubtotal - discountAmount);
  const cartShippingFee = (cartAfterDiscount >= 500000 || cartSubtotal === 0) ? 0 : 30000;
  const cartTotal = cartAfterDiscount + cartShippingFee;
  const nextTierInfo = getNextTierInfo(effectiveTotalItems);

  // Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerName || !customerPhone || !shippingAddress) {
      setCheckoutError('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        items: cart.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đặt hàng thất bại.');
      }

      setOrderSuccess(data.order);
      setCart([]);
      setIsCheckingOut(false);
      setIsBagOpen(false);
    } catch (err: any) {
      setCheckoutError(err.message || 'Lỗi kết nối máy chủ.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased selection:bg-[#0a0a0a] selection:text-white">

      {/* ================= 1. FROSTED STICKY HEADER ================= */}
      <header
        id="nav"
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b hairline transition-all duration-300 ${scrolled ? 'shadow-[0_1px_0_rgba(10,10,10,0.06)]' : ''
          }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="relative flex items-center justify-between h-[68px] md:h-[84px]">

            {/* Left Nav */}
            <div className="flex items-center">
              <ul className="hidden lg:flex items-center gap-10 xl:gap-12 text-[11px] tracking-wide-2 font-medium uppercase">
                {headerNavItems.map((item) => {
                  const isCurrent = item.href === '/products' || item.href === '/product';
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`nav-link text-[#0a0a0a] ${isCurrent ? 'active' : ''}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Hamburger Button (Mobile) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Open menu"
                className="lg:hidden -ml-1 p-2 text-[#0a0a0a] focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="square" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="square" strokeWidth="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </div>

            {/* Wordmark Center */}
            <Link
              href="/"
              className="wordmark absolute left-1/2 -translate-x-1/2 font-wide text-[19px] md:text-[23px] font-medium uppercase select-none whitespace-nowrap text-[#0a0a0a] tracking-mono"
            >
              ATELIER
            </Link>

            {/* Right Utility Cluster */}
            <div className="flex items-center gap-5 lg:gap-7 text-[11px] tracking-wide-2 font-medium uppercase">
              {/* User / Login Icon / Profile Trigger */}
              {isLoggedIn && user ? (
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  aria-label={`Hồ sơ tài khoản: ${user.name}`}
                  title={`Hồ sơ: ${user.name}`}
                  className="flex items-center gap-2 px-2.5 py-1 border hairline text-[#0a0a0a] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="font-mono text-[10px] md:text-[11px] uppercase font-bold tracking-wider truncate max-w-[120px] md:max-w-[160px]">
                    {user.name}
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  aria-label="Tài khoản & Đăng nhập"
                  title="Tài khoản & Đăng nhập"
                  className="relative flex items-center text-[#0a0a0a] hover:opacity-70 transition-opacity"
                >
                  <svg className="w-5 h-5 md:w-[21px] md:h-[21px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </Link>
              )}

              {/* Handbag Drawer Trigger */}
              <button
                onClick={() => setIsBagOpen(true)}
                aria-label="Giỏ hàng"
                className="relative flex items-center text-[#0a0a0a] hover:opacity-70 transition-opacity cursor-pointer"
              >
                <svg className="w-5 h-5 md:w-[21px] md:h-[21px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth="1.5" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="ml-2 hidden lg:inline text-[11px] tracking-wide-1 tabular-nums">
                  ({totalBagCount})
                </span>
                {totalBagCount > 0 && (
                  <span className="lg:hidden ml-1 text-[11px] font-mono font-semibold">
                    {totalBagCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Mobile Drawer */}
          <div
            className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ease-out border-t hairline ${isMenuOpen ? 'max-h-64' : 'max-h-0'
              }`}
          >
            <ul className="py-5 space-y-4 text-[12px] tracking-wide-2 font-medium uppercase">
              {headerNavItems.map((item) => {
                const isCurrent = item.href === '/products' || item.href === '/product';
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-[#0a0a0a] ${isCurrent ? 'font-bold underline' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {isLoggedIn && user ? (
                <li className="pt-3 border-t hairline space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#0a0a0a] truncate">👤 {user.name}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 uppercase shrink-0">Đã đăng nhập</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); setIsProfileOpen(true); }}
                      className="flex-1 py-1.5 text-center border hairline text-[11px] font-mono hover:bg-black hover:text-white transition-colors"
                    >
                      Hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); setIsBagOpen(true); }}
                      className="flex-1 py-1.5 text-center border hairline text-[11px] font-mono hover:bg-black hover:text-white transition-colors"
                    >
                      Giỏ hàng ({totalBagCount})
                    </button>
                    <button
                      type="button"
                      onClick={async () => { await logout(); setIsMenuOpen(false); }}
                      className="py-1.5 px-3 border hairline text-[11px] font-mono text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Thoát
                    </button>
                  </div>
                </li>
              ) : (
                <li className="pt-3 border-t hairline">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-[#0a0a0a]/60">
                    Tài khoản / Đăng nhập
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </header>

      {/* ================= 2. PAGE HEADER & EDITORIAL HERO ================= */}
      <section className="border-b hairline bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 pb-8 md:pt-14 md:pb-10">


          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] md:text-[11px] tracking-mono uppercase text-[#0a0a0a]/60 block font-mono">
                COLLECTION 01 • EDITIONS CATALOGUE
              </span>
              <h1 className="font-wide uppercase text-3xl md:text-5xl lg:text-6xl tracking-tight text-[#0a0a0a]">
                THE PRODUCT ARCHIVE
              </h1>
            </div>
          </div>
        </div>


      </section>

      {/* ================= 3. FILTER & SEARCH CONTROL TOOLBAR ================= */}
      <section className="sticky top-[68px] md:top-[84px] z-40 bg-white/95 backdrop-blur-md border-b hairline">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-[11px] tracking-wide-2 uppercase font-medium border transition-colors shrink-0 ${isActive
                        ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                        : 'bg-white text-[#0a0a0a]/70 border-black/15 hover:border-black hover:text-black'
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Controls: Search + Sort + InStock */}
            <div className="flex flex-wrap items-center gap-3 text-xs">

              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-xs border hairline bg-white focus:outline-none focus:border-black font-mono placeholder:text-black/30"
                />
                <svg
                  className="w-3.5 h-3.5 text-[#0a0a0a]/40 absolute left-2.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="square" strokeWidth="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-black/40 hover:text-black text-xs font-mono"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <CustomSelect
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={[
                  { value: 'featured', label: 'Sắp xếp: Mặc định' },
                  { value: 'price-asc', label: 'Giá: Thấp đến Cao' },
                  { value: 'price-desc', label: 'Giá: Cao đến Thấp' },
                  { value: 'name-asc', label: 'Tên: A — Z' },
                ]}
                variant="atelier"
              />

              {/* In-Stock Toggle */}
              <label className="flex items-center gap-2 h-9 px-3 border hairline text-[11px] font-mono uppercase cursor-pointer select-none hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-black w-3.5 h-3.5 rounded-none"
                />
                <span>Còn hàng</span>
              </label>

            </div>

          </div>
        </div>
      </section>

      {/* ================= 4. PRODUCT VIEWPORT WITH COLLECTIONS SIDEBAR ================= */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">

        {/* Mobile Filter & Collection Drawer Trigger */}
        <div className="lg:hidden mb-6 flex items-center justify-between border hairline p-3 bg-[#0a0a0a]/[0.02]">
          <button
            onClick={() => setIsSidebarOpenMobile(true)}
            className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-black cursor-pointer"
          >
            <FolderTree className="w-4 h-4" />
            <span>Bộ sưu tập & Danh mục ({collections.length} Thương hiệu)</span>
          </button>
          {hasActiveCollectionFilter && (
            <button
              onClick={() => {
                setSelectedBrandId('ALL');
                setSelectedGroupId('ALL');
                setSelectedSubId('ALL');
              }}
              className="text-[10px] font-mono uppercase underline text-black/60 cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ================= LEFT SIDEBAR: BỘ SƯU TẬP (DESKTOP) ================= */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-36 space-y-6 select-none border-r hairline pr-6">


            {/* All Editions Button */}
            <button
              onClick={() => {
                setSelectedBrandId('ALL');
                setSelectedGroupId('ALL');
                setSelectedSubId('ALL');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono uppercase transition-colors cursor-pointer border hairline ${!hasActiveCollectionFilter
                  ? 'bg-black text-white border-black font-semibold'
                  : 'bg-white text-black/70 border-black/10 hover:border-black hover:text-black'
                }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Tất cả sản phẩm</span>
              </div>
              <span className={`text-[10px] ${!hasActiveCollectionFilter ? 'text-white/80' : 'text-black/50'}`}>
                ({products.length})
              </span>
            </button>

            {/* Brands Hierarchy Tree */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-black/40 block">
                THƯƠNG HIỆU & DÒNG SẢN PHẨM
              </span>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {collections.map((col) => {
                  const isExpanded = expandedBrands[col.id] !== false;
                  const isBrandActive = selectedBrandId === col.id && selectedGroupId === 'ALL' && selectedSubId === 'ALL';
                  const isBrandInPath = selectedBrandId === col.id;

                  const totalBrandProducts = col.groups.reduce(
                    (sum, g) => sum + g.items.reduce((s2, it) => s2 + (it.product_ids?.length || 0), 0),
                    0
                  );

                  return (
                    <div key={col.id} className="border hairline bg-white overflow-hidden">

                      {/* Level 1: Brand Item */}
                      <div
                        className={`flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer ${isBrandActive
                            ? 'bg-black text-white font-semibold'
                            : isBrandInPath
                              ? 'bg-black/5 font-semibold text-black'
                              : 'hover:bg-black/[0.02] text-black/80'
                          }`}
                      >
                        <div
                          className="flex-1 flex items-center gap-2 truncate"
                          onClick={() => {
                            setSelectedBrandId(col.id);
                            setSelectedGroupId('ALL');
                            setSelectedSubId('ALL');
                          }}
                        >
                          <span className="font-wide text-xs uppercase tracking-tight truncate">
                            {col.brand}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isBrandActive ? 'bg-white/20 text-white' : 'bg-black/5 text-black/60'
                            }`}>
                            {totalBrandProducts || ''}
                          </span>
                        </div>

                        {/* Chevron expand */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedBrands((prev) => ({ ...prev, [col.id]: !prev[col.id] }));
                          }}
                          className="p-1 text-black/50 hover:text-black cursor-pointer"
                          aria-label="Thu gọn / Mở rộng"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Level 2: Groups & Level 3: Subcategories */}
                      {isExpanded && col.groups && col.groups.length > 0 && (
                        <div className="pl-4 pr-2 py-1.5 border-t hairline bg-black/[0.015] space-y-1.5">
                          {col.groups.map((grp) => {
                            const isGrpExpanded = expandedGroups[grp.id] !== false;
                            const isGrpActive = selectedBrandId === col.id && selectedGroupId === grp.id && selectedSubId === 'ALL';
                            const isGrpInPath = selectedBrandId === col.id && selectedGroupId === grp.id;
                            const grpCount = grp.items.reduce((sum, it) => sum + (it.product_ids?.length || 0), 0);

                            return (
                              <div key={grp.id} className="space-y-1">

                                {/* Group Item */}
                                <div
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${isGrpActive
                                      ? 'bg-black text-white font-bold'
                                      : isGrpInPath
                                        ? 'bg-black/10 font-bold text-black'
                                        : 'text-black/70 hover:bg-black/5 hover:text-black'
                                    }`}
                                >
                                  <div
                                    className="flex-1 flex items-center gap-1.5 truncate"
                                    onClick={() => {
                                      setSelectedBrandId(col.id);
                                      setSelectedGroupId(grp.id);
                                      setSelectedSubId('ALL');
                                    }}
                                  >
                                    <span className="truncate">{grp.name}</span>
                                    {grpCount > 0 && (
                                      <span className="text-[9px] opacity-60">({grpCount})</span>
                                    )}
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedGroups((prev) => ({ ...prev, [grp.id]: !prev[grp.id] }));
                                    }}
                                    className="p-0.5 opacity-60 hover:opacity-100"
                                  >
                                    {isGrpExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>

                                {/* Level 3: Subcategories */}
                                {isGrpExpanded && grp.items && grp.items.length > 0 && (
                                  <div className="pl-4 pr-1 py-0.5 space-y-1 border-l hairline ml-2">
                                    {grp.items.map((sub) => {
                                      const isSubActive =
                                        selectedBrandId === col.id &&
                                        selectedGroupId === grp.id &&
                                        selectedSubId === sub.id;
                                      const subCount = sub.product_ids?.length || 0;

                                      return (
                                        <div
                                          key={sub.id}
                                          onClick={() => {
                                            setSelectedBrandId(col.id);
                                            setSelectedGroupId(grp.id);
                                            setSelectedSubId(sub.id);
                                          }}
                                          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${isSubActive
                                              ? 'bg-black text-white font-bold shadow-xs'
                                              : 'text-black/60 hover:bg-black/5 hover:text-black'
                                            }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                                            <span className="truncate">{sub.name}</span>
                                          </div>
                                          {subCount > 0 && (
                                            <span className={`text-[9px] ${isSubActive ? 'text-white/80' : 'text-black/40'}`}>
                                              {subCount}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>


          </aside>

          {/* ================= RIGHT COLUMN: PRODUCTS ARCHIVE ================= */}
          <section className="lg:col-span-9 space-y-6">

            {/* Active Collection Breadcrumb Badge Bar */}
            {hasActiveCollectionFilter && (
              <div className="p-3 border hairline bg-[#0a0a0a]/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase text-black/50">ĐANG LỌC BỘ SƯU TẬP:</span>
                  <div className="flex items-center gap-1.5 font-bold uppercase text-black">
                    <span className="bg-black text-white px-2 py-0.5 text-[11px]">
                      {activeBrandObj?.brand}
                    </span>
                    {activeGroupObj && (
                      <>
                        <span>/</span>
                        <span className="bg-black/10 px-2 py-0.5 text-[11px]">
                          {activeGroupObj.name}
                        </span>
                      </>
                    )}
                    {activeSubObj && (
                      <>
                        <span>/</span>
                        <span className="bg-black/10 px-2 py-0.5 text-[11px] underline">
                          {activeSubObj.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBrandId('ALL');
                    setSelectedGroupId('ALL');
                    setSelectedSubId('ALL');
                  }}
                  className="flex items-center gap-1 text-[11px] uppercase font-mono underline hover:text-black/60 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa lọc bộ sưu tập</span>
                </button>
              </div>
            )}

            {/* Results Bar */}
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#0a0a0a]/50 pb-4 border-b hairline">
              <div>
                Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
              </div>
              {(selectedCategory !== 'ALL' || searchQuery || inStockOnly || hasActiveCollectionFilter) && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedBrandId('ALL');
                    setSelectedGroupId('ALL');
                    setSelectedSubId('ALL');
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="text-black underline underline-offset-4 hover:opacity-60 cursor-pointer"
                >
                  Đặt lại toàn bộ lọc
                </button>
              )}
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="border hairline p-4 space-y-4">
                    <div className="aspect-[4/5] bg-black/5 animate-pulse" />
                    <div className="h-4 bg-black/5 w-2/3" />
                    <div className="h-4 bg-black/5 w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Empty State */
              <div className="py-24 text-center border hairline p-8 space-y-4">
                <span className="text-[11px] font-mono tracking-mono uppercase text-[#0a0a0a]/50 block">
                  NO RESULTS LOCATED
                </span>
                <h2 className="font-wide text-2xl uppercase">Không tìm thấy sản phẩm phù hợp</h2>
                <p className="text-sm text-[#0a0a0a]/60 max-w-md mx-auto">
                  Không có sản phẩm nào khớp với từ khóa hoặc tiêu chí bộ lọc đã chọn.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                    setInStockOnly(false);
                  }}
                  className="mt-4 px-6 py-2.5 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90"
                >
                  Xem toàn bộ danh mục
                </button>
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-14">
                {filteredProducts.map((product, idx) => {
                  const minPrice = Math.min(...product.variants.map((v) => v.selling_price));
                  const maxPrice = Math.max(...product.variants.map((v) => v.selling_price));
                  const totalStock = product.variants.reduce((sum, v) => sum + v.available_qty, 0);
                  const plateNumber = String(idx + 1).padStart(2, '0');
                  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
                  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size)));

                  return (
                    <article
                      key={product.id}
                      className="group flex flex-col justify-between border-b hairline pb-6"
                    >
                      <div className="space-y-4">
                        {/* Product Image Plate */}
                        <div className="relative group/plate">
                          <Link
                            href={`/products/${product.id}`}
                            className="aspect-[4/5] bg-[#0a0a0a]/5 overflow-hidden relative cursor-pointer border hairline block"
                          >
                            <img
                              src={getPrimaryImageUrl(product.image_url)}
                              alt={product.name}
                              className="w-full h-full object-cover contrast-105 group-hover:scale-105 transition-transform duration-700 ease-out"
                            />

                            {/* Corner Number */}
                            <span className="absolute top-3 left-3 text-[10px] font-mono tracking-widest bg-white/95 backdrop-blur-sm px-2 py-0.5 uppercase text-[#0a0a0a] border hairline">
                              PLATE {plateNumber}
                            </span>

                            {/* Stock Badge */}
                            {totalStock <= 5 && totalStock > 0 && (
                              <span className="absolute top-3 right-3 text-[10px] font-mono tracking-wider uppercase bg-[#0a0a0a] text-white px-2 py-0.5">
                                Low Stock: {totalStock}
                              </span>
                            )}
                            {totalStock === 0 && (
                              <span className="absolute top-3 right-3 text-[10px] font-mono tracking-wider uppercase bg-black text-white px-2 py-0.5">
                                Sold Out
                              </span>
                            )}
                          </Link>
                        </div>

                        {/* Metadata & Title */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#0a0a0a]/50">
                            <span>{product.category}</span>
                            <span>{uniqueColors.join(' / ')}</span>
                          </div>

                          <Link
                            href={`/products/${product.id}`}
                            className="font-wide text-sm uppercase tracking-tight hover:underline cursor-pointer leading-snug line-clamp-2 block min-h-[2.625rem]"
                          >
                            {product.name}
                          </Link>

                          {/* Price - perfectly aligned horizontally */}
                          <div className="text-sm font-semibold tracking-tight text-[#0a0a0a] pt-1">
                            {minPrice === maxPrice
                              ? formatMoney(minPrice)
                              : `${formatMoney(minPrice)} — ${formatMoney(maxPrice)}`}
                          </div>

                          {/* Sizes Preview */}
                          <div className="flex items-center gap-1 pt-1.5 min-h-[26px]">
                            {uniqueSizes.map((sz) => (
                              <span
                                key={sz}
                                className="text-[10px] font-mono uppercase border hairline px-1.5 py-0.5 text-[#0a0a0a]/70"
                              >
                                {sz}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-5 space-y-2">
                        <button
                          type="button"
                          onClick={(e) => handleQuickAddToCart(e, product)}
                          disabled={totalStock === 0}
                          className="w-full py-2.5 bg-[#0a0a0a] text-white text-[11px] font-mono uppercase tracking-wider hover:bg-black/85 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{totalStock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</span>
                        </button>

                        <Link
                          href={`/products/${product.id}`}
                          className="w-full block text-center py-2 border hairline uppercase text-[11px] tracking-wide-2 font-medium hover:bg-black hover:text-white transition-colors"
                        >
                          {totalStock === 0 ? 'Tạm hết hàng' : 'Xem chi tiết →'}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </section>
        </div>
      </main>

      {/* ================= MOBILE SIDEBAR DRAWER ================= */}
      {isSidebarOpenMobile && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="bg-white w-4/5 max-w-sm h-full flex flex-col justify-between p-6 animate-in slide-in-from-left duration-300">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b hairline">
                <span className="font-wide text-sm uppercase font-bold flex items-center gap-2">
                  <FolderTree className="w-4 h-4" />
                  Bộ sưu tập & Danh mục
                </span>
                <button
                  onClick={() => setIsSidebarOpenMobile(false)}
                  className="p-1 text-black/60 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* All Editions Button Mobile */}
              <button
                onClick={() => {
                  setSelectedBrandId('ALL');
                  setSelectedGroupId('ALL');
                  setSelectedSubId('ALL');
                  setIsSidebarOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono uppercase border hairline ${!hasActiveCollectionFilter ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
              >
                <span>Tất cả sản phẩm</span>
                <span>({products.length})</span>
              </button>

              {/* Brands List Mobile */}
              <div className="space-y-2">
                {collections.map((col) => (
                  <div key={col.id} className="border hairline p-2.5 space-y-1 bg-white">
                    <div
                      onClick={() => {
                        setSelectedBrandId(col.id);
                        setSelectedGroupId('ALL');
                        setSelectedSubId('ALL');
                        setIsSidebarOpenMobile(false);
                      }}
                      className="font-wide uppercase text-xs font-bold py-1 flex justify-between cursor-pointer"
                    >
                      <span>{col.brand}</span>
                    </div>

                    {col.groups && (
                      <div className="pl-3 space-y-1">
                        {col.groups.map((grp) => (
                          <div key={grp.id} className="space-y-0.5">
                            <div
                              onClick={() => {
                                setSelectedBrandId(col.id);
                                setSelectedGroupId(grp.id);
                                setSelectedSubId('ALL');
                                setIsSidebarOpenMobile(false);
                              }}
                              className="text-xs font-mono text-black/80 py-0.5 cursor-pointer font-semibold"
                            >
                              ▸ {grp.name}
                            </div>
                            <div className="pl-3 space-y-0.5">
                              {grp.items.map((sub) => (
                                <div
                                  key={sub.id}
                                  onClick={() => {
                                    setSelectedBrandId(col.id);
                                    setSelectedGroupId(grp.id);
                                    setSelectedSubId(sub.id);
                                    setIsSidebarOpenMobile(false);
                                  }}
                                  className="text-[11px] font-mono text-black/60 py-0.5 cursor-pointer hover:text-black"
                                >
                                  - {sub.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpenMobile(false)}
              className="w-full py-3 bg-black text-white text-xs font-mono uppercase mt-4 cursor-pointer"
            >
              Đóng bộ lọc
            </button>
          </div>
        </div>
      )}


      {/* ================= 6. SLIDE-OUT BAG DRAWER ================= */}
      {isBagOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="bg-white border-l hairline w-full max-w-md h-full flex flex-col justify-between p-6 md:p-8 animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b hairline">
                <div>
                  <h3 className="font-wide uppercase text-lg">Giỏ hàng</h3>
                  <span className="text-[10px] font-mono uppercase text-[#0a0a0a]/60">
                    {totalBagCount} Sản phẩm
                  </span>
                </div>
                <button
                  onClick={() => setIsBagOpen(false)}
                  className="p-2 text-black/60 hover:text-black cursor-pointer"
                  aria-label="Đóng giỏ hàng"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Items List */}
              <div className="py-6 overflow-y-auto max-h-[50vh] space-y-4 divide-y divide-black/10">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-[#0a0a0a]/50 uppercase">
                    Giỏ hàng của bạn đang trống.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.variant_id} className="pt-4 first:pt-0 flex gap-4 items-start">
                      <img
                        src={getPrimaryImageUrl(item.product_image)}
                        alt={item.product_name}
                        className="w-16 h-20 object-cover border hairline shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-bold uppercase truncate">{item.product_name}</h4>
                        <div className="text-[10px] font-mono text-black/60">
                          {item.color} / Size {item.size} • {item.sku}
                        </div>
                        <div className="text-xs font-semibold">{formatMoney(item.price)}</div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center border hairline text-xs font-mono">
                            <button
                              onClick={() => handleUpdateQty(item.variant_id, -1)}
                              className="px-2 py-0.5 hover:bg-black/5"
                            >
                              -
                            </button>
                            <span className="px-2 py-0.5">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQty(item.variant_id, 1)}
                              disabled={item.quantity >= item.available_qty}
                              className="px-2 py-0.5 hover:bg-black/5 disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.variant_id)}
                            className="text-[10px] font-mono uppercase text-black/40 hover:text-black underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer & Checkout */}
            <div className="border-t hairline pt-6 space-y-4">
              {/* Membership Rank Banner in Cart */}
              <div className={`p-3.5 border rounded-lg text-xs space-y-2 transition-all ${currentTier.badge_class}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 shrink-0 text-current opacity-85" />
                    <span className="tracking-wide font-medium">{currentTier.name}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 font-semibold uppercase tracking-wider">
                    {discountPercent > 0 ? `Ưu đãi -${discountPercent}%` : 'Giá chuẩn'}
                  </span>
                </div>
                {nextTierInfo ? (
                  <div className="flex items-start gap-2 pt-1.5 border-t border-black/10 text-[11px] opacity-90 leading-relaxed">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5 text-current opacity-85" />
                    <span>
                      Đơn hàng có {totalBagCount} sản phẩm. Mua thêm <strong>{nextTierInfo.items_needed} chiếc</strong> nữa để lên <strong>{nextTierInfo.next_tier.name}</strong> ({nextTierInfo.benefit})!
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 pt-1.5 border-t border-black/10 text-[11px] opacity-90 leading-relaxed">
                    <Crown className="w-3.5 h-3.5 shrink-0 mt-0.5 text-current opacity-85" />
                    <span>
                      Bạn đang hưởng mức chiết khấu sâu cao nhất dành cho <strong>{currentTier.name}</strong>!
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-black/60">
                  <span>Tạm tính ({totalBagCount} món):</span>
                  <span>{formatMoney(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Chiết khấu {currentTier.name} (-{discountPercent}%):</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-black/60">
                  <span>Phí giao hàng:</span>
                  <span>{cartShippingFee === 0 ? 'Miễn phí' : formatMoney(cartShippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-black pt-2 border-t hairline">
                  <span>Tổng thanh toán:</span>
                  <span>{formatMoney(cartTotal)}</span>
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 text-center font-mono">
                    Đăng nhập để nhận quyền lợi hội viên và tiếp tục thanh toán.
                  </p>
                  <button
                    onClick={() => {
                      if (cart.length === 0) return;
                      const returnPath = typeof window !== 'undefined'
                        ? window.location.pathname + '?openCart=true'
                        : '/products?openCart=true';
                      window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}&reason=checkout`;
                    }}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 bg-[#0f172a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Đăng nhập để tiếp tục</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-50 px-3 py-1.5 border hairline">
                    <span className="truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase">Đã xác thực</span>
                  </div>
                  <button
                    onClick={() => {
                      if (cart.length === 0) return;
                      setIsCheckingOut(true);
                    }}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Tiến hành thanh toán VietQR
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= 7. CHECKOUT MODAL ================= */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border hairline max-w-lg w-full p-6 md:p-8 space-y-6">

            <div className="flex items-center justify-between border-b hairline pb-4">
              <div>
                <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block font-mono">
                  THÔNG TIN GIAO HÀNG
                </span>
                <h3 className="font-wide uppercase text-lg">Đặt hàng & Tạo mã VietQR</h3>
              </div>
              <button
                onClick={() => setIsCheckingOut(false)}
                className="p-1 text-black/60 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 border border-rose-200 bg-rose-50 text-rose-800 text-xs font-mono">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono uppercase text-[11px] text-black/70">Họ và tên khách hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn An"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-9 px-3 border hairline bg-white focus:outline-none focus:border-black font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono uppercase text-[11px] text-black/70">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  placeholder="0912 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-9 px-3 border hairline bg-white focus:outline-none focus:border-black font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono uppercase text-[11px] text-black/70">Địa chỉ giao hàng chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-3 border hairline bg-white focus:outline-none focus:border-black font-sans resize-none"
                />
              </div>

              <div className="p-3 border hairline bg-[#0a0a0a]/[0.02] text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-black/70">
                  <span>Tạm tính ({totalBagCount} áo):</span>
                  <span>{formatMoney(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Ưu đãi {currentTier.name} (-{discountPercent}%):</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-black/70">
                  <span>Phí giao hàng:</span>
                  <span>{cartShippingFee === 0 ? 'Miễn phí' : formatMoney(cartShippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-black pt-1.5 border-t hairline">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-base">{formatMoney(cartTotal)}</span>
                </div>
                {nextTierInfo && (
                  <div className="text-[11px] text-amber-700 font-sans pt-1">
                    ⭐ Đơn có {totalBagCount} áo. Thêm {nextTierInfo.items_needed} áo để lên hạng <strong>{nextTierInfo.next_tier.name}</strong> ({nextTierInfo.benefit})!
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-4 py-2.5 border hairline uppercase text-[11px] tracking-wide-1 hover:bg-black/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0a0a0a] text-white uppercase text-[11px] tracking-wide-2 font-medium hover:bg-black/90 cursor-pointer"
                >
                  Xác nhận & Tạo mã VietQR
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= 8. ORDER SUCCESS & VIETQR ================= */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border hairline max-w-md w-full p-8 text-center space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block font-mono">
                GIAO DỊCH ĐÃ GHI NHẬN
              </span>
              <h3 className="font-wide uppercase text-xl font-bold">Đặt hàng thành công</h3>
              <p className="text-xs font-mono text-[#0a0a0a]/70">
                Mã đơn hàng: <strong className="text-[#0a0a0a]">{orderSuccess.order_code}</strong>
              </p>
            </div>

            {/* VietQR Plate */}
            <div className="border hairline p-6 bg-[#0a0a0a]/[0.02] space-y-4">
              <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block font-mono">
                Quét mã VietQR chuyển khoản
              </span>

              <div className="bg-white p-3 border hairline inline-block mx-auto">
                <img
                  src={`https://img.vietqr.io/image/MB-0903112233-compact2.png?amount=${orderSuccess.total_amount}&addInfo=${orderSuccess.order_code}`}
                  alt="VietQR Code"
                  className="w-48 h-48 mx-auto object-contain contrast-105"
                />
              </div>

              <div className="text-xs font-mono space-y-1">
                <div>Số tiền: <strong>{formatMoney(orderSuccess.total_amount)}</strong></div>
                <div>Nội dung CK: <strong>{orderSuccess.order_code}</strong></div>
              </div>

              <p className="text-[10px] font-mono text-[#0a0a0a]/50">
                Hệ thống tự động kích hoạt trạng thái đơn hàng khi tiền vào tài khoản.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full py-3 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90 cursor-pointer"
              >
                Tiếp tục mua sắm
              </button>
              <Link
                href="/admin"
                className="w-full py-3 border hairline text-[11px] tracking-wide-1 uppercase font-medium hover:bg-black/5 text-center"
              >
                Kiểm tra đơn (Admin)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ================= 9. FLOATING TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-[#0a0a0a] text-white border border-white/20 px-5 py-3 shadow-2xl transition-all animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <span className="text-xs font-mono tracking-wide">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white text-xs font-mono pl-2 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 10. EDITORIAL FOOTER ================= */}
      <footer className="border-t hairline bg-white py-12 px-6 md:px-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-mono tracking-wider uppercase text-[#0a0a0a]/60">
          <div>
            © 2026 CAISHOP ATELIER • AUTONOMOUS MONOCHROME COMMERCE
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-black">Storefront</Link>
            <Link href="/products" className="hover:text-black font-bold text-black">Products</Link>
            <Link href="/login" className="hover:text-black">Account</Link>
            <Link href="/admin" className="hover:text-black">Executive Admin</Link>
          </div>
        </div>
      </footer>

      {/* ================= USER PROFILE MODAL ================= */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        logout={logout}
        onOpenCart={() => setIsBagOpen(true)}
        cartCount={totalBagCount}
      />

    </div>
  );
}
