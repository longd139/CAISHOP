'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useHeaderNav } from '@/lib/useSiteContent';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, Eye, Sparkles, Award, Crown, TrendingUp, User, Tag } from 'lucide-react';
import { getProductGallery, getPrimaryImageUrl, ProductImagePlate } from '@/lib/productImages';
import { calculateTier, getNextTierInfo } from '@/lib/membership';
import { useAuth } from '@/lib/useAuth';
import { UserProfileModal } from '@/components/UserProfileModal';
import { useCart, CartItem, AVAILABLE_DEALS } from '@/lib/useCart';

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
  location_code?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  image_url: string | null;
  variants: ProductVariant[];
}

interface ProductDetailProps {
  initialProduct?: Product | null;
  productId: string;
}

export default function ProductDetail({ initialProduct, productId }: ProductDetailProps) {
  const { items: headerNavItems } = useHeaderNav();
  const { user, isLoggedIn, logout } = useAuth();
  const { cart, setCart, appliedDeal, appliedDealCode, setAppliedDealCode } = useCart();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'profile' | 'orders'>('profile');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);

  // Lock body scroll when bag drawer is open
  useEffect(() => {
    if (isBagOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isBagOpen]);

  // Selection states
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // 4 Gallery images states
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Danh sách 4 hình ảnh kèm chú thích chuyên sâu cho sản phẩm
  const galleryImages = useMemo(() => getProductGallery(product), [product]);
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  // Toast message
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

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch product if not provided or to ensure fresh inventory
  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data);
          if (data.data.variants.length > 0) {
            setSelectedColor(data.data.variants[0].color);
            setSelectedSize(data.data.variants[0].size);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Also fetch all products for related items
    fetch('/api/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAllProducts(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, [productId]);

  // Reset active image when product changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  // Lightbox keyboard navigation (Esc, Arrow keys)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
      if (e.key === 'ArrowRight') setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, galleryImages.length]);

  // Set initial color and size if product is provided
  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedColor) {
      setSelectedColor(product.variants[0].color);
      setSelectedSize(product.variants[0].size);
    }
  }, [product, selectedColor]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Active variant
  const activeVariant = product?.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const availableSizesForColor = product?.variants.filter((v) => v.color === selectedColor) || [];
  const uniqueColors = Array.from(new Set(product?.variants.map((v) => v.color) || []));

  // Add to Bag
  const handleAddToBag = () => {
    if (!product || !activeVariant) return;

    if (activeVariant.available_qty <= 0) {
      showToast('Sản phẩm đã hết hàng trong kho.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.variant_id === activeVariant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant_id === activeVariant.id
            ? { ...item, quantity: Math.min(item.available_qty, item.quantity + selectedQty) }
            : item
        );
      }
      return [
        ...prev,
        {
          variant_id: activeVariant.id,
          product_name: product.name,
          product_image: product.image_url || '',
          sku: activeVariant.sku,
          color: activeVariant.color,
          size: activeVariant.size,
          price: activeVariant.selling_price,
          quantity: selectedQty,
          available_qty: activeVariant.available_qty,
        },
      ];
    });

    showToast(`✓ Đã thêm vào giỏ hàng: ${product.name} (${activeVariant.color} / Size ${activeVariant.size})`);
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
  const [membershipData, setMembershipData] = useState<{ past_orders: number; tier_name: string } | null>(null);

  // Auto-check customer membership by phone
  useEffect(() => {
    if (!customerPhone || customerPhone.trim().length < 9) {
      setMembershipData(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/membership?phone=${encodeURIComponent(customerPhone.trim())}`);
        const data: any = await res.json();
        if (data.success && data.data) {
          setMembershipData({
            past_orders: data.data.order_count || 0,
            tier_name: data.data.tier?.name || 'Hội viên Đồng'
          });
        }
      } catch (e) { }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const effectiveOrders = membershipData?.past_orders || 0;
  const currentTier = calculateTier(effectiveOrders);
  const discountPercent = currentTier.discount_percent;
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountPercent > 0 ? Math.round((cartSubtotal * discountPercent) / 100) : 0;

  // Deal voucher calculations
  let dealDiscount = 0;
  if (appliedDeal?.discount_amount && cartSubtotal >= (appliedDeal.min_order || 0)) {
    dealDiscount = appliedDeal.discount_amount;
  }
  const isFreeshipDeal = appliedDeal?.is_freeship;

  const cartAfterDiscount = Math.max(0, cartSubtotal - discountAmount - dealDiscount);
  const cartShippingFee = (cartAfterDiscount >= 500000 || isFreeshipDeal || cartSubtotal === 0) ? 0 : 30000;
  const cartTotal = cartAfterDiscount + cartShippingFee;
  const nextTierInfo = getNextTierInfo(effectiveOrders);

  // Auto-clear deal if not eligible for cartSubtotal
  useEffect(() => {
    if (appliedDeal && appliedDeal.min_order && cartSubtotal < appliedDeal.min_order) {
      setAppliedDealCode(null);
    }
  }, [appliedDeal, cartSubtotal, setAppliedDealCode]);

  // Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerName || !customerPhone || !shippingAddress) {
      setCheckoutError('Vui lòng nhập đầy đủ thông tin giao hàng.');
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
      setCheckoutError(err.message || 'Lỗi kết nối.');
    }
  };

  // Related products
  const relatedProducts = allProducts.filter((p) => p.id !== product?.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased selection:bg-[#0a0a0a] selection:text-white">

      {/* ================= 1. STICKY HEADER ================= */}
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

            {/* Centered Wordmark */}
            <Link
              href="/"
              className="wordmark absolute left-1/2 -translate-x-1/2 font-wide text-[19px] md:text-[23px] font-medium uppercase select-none whitespace-nowrap text-[#0a0a0a] tracking-mono"
            >
              ATELIER
            </Link>

            {/* Right Cluster */}
            <div className="flex items-center gap-5 lg:gap-7 text-[11px] tracking-wide-2 font-medium uppercase">
              {/* User Dropdown Trigger */}
              {isLoggedIn && user ? (
                <div ref={userDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    aria-expanded={isUserDropdownOpen}
                    aria-haspopup="true"
                    aria-label={`Tài khoản: ${user.name}`}
                    title={`Tài khoản: ${user.name}`}
                    className="flex items-center gap-1.5 text-[#0a0a0a] hover:opacity-70 transition-opacity cursor-pointer py-1"
                  >
                    <svg className="w-5 h-5 md:w-[21px] md:h-[21px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-[11px] uppercase font-bold tracking-wider truncate max-w-[120px] md:max-w-[160px]">
                      {user.name}
                    </span>
                    <svg
                      className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 normal-case tracking-normal animate-in fade-in zoom-in-95 duration-100">
                      {/* User Info Header */}
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.email || user.phone || 'Thành viên'}
                        </div>
                      </div>

                      {/* Menu Actions */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setProfileActiveTab('profile');
                          setIsProfileOpen(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors cursor-pointer block"
                      >
                        Hồ sơ
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setProfileActiveTab('orders');
                          setIsProfileOpen(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors cursor-pointer block border-t border-slate-50"
                      >
                        Đơn hàng
                      </button>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="w-full px-3.5 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-50 text-left transition-colors block"
                        >
                          Quản trị
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer border-t border-slate-100 block"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  aria-label="Account & Login"
                  title="Tài khoản / Đăng nhập"
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
                      className={`block text-[#0a0a0a] ${isCurrent ? 'font-bold' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              {isLoggedIn && user ? (
                <li className="pt-3 border-t hairline space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0a0a0a] truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0a0a0a]/70 shrink-0" />
                      {user.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); setProfileActiveTab('profile'); setIsProfileOpen(true); }}
                      className="flex-1 py-1.5 text-center border hairline text-[11px] font-mono hover:bg-black hover:text-white transition-colors"
                    >
                      Hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsMenuOpen(false); setProfileActiveTab('orders'); setIsProfileOpen(true); }}
                      className="flex-1 py-1.5 text-center border hairline text-[11px] font-mono hover:bg-black hover:text-white transition-colors"
                    >
                      Đơn hàng
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

      {/* ================= 2. BREADCRUMB & METADATA BAR ================= */}
      <div className="border-b hairline bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4 text-[10px] md:text-[11px] font-mono uppercase text-[#0a0a0a]/50">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-black">Trang chủ</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-black">Sản phẩm</Link>
            <span>/</span>
            <span className="text-black font-semibold">{product?.name || 'Đang tải...'}</span>
          </div>
        </div>
      </div>

      {/* ================= 3. MAIN PRODUCT DETAIL VIEWPORT ================= */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-16">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
            <div className="lg:col-span-7 aspect-[4/5] bg-black/5" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-6 bg-black/5 w-1/3" />
              <div className="h-10 bg-black/5 w-3/4" />
              <div className="h-6 bg-black/5 w-1/4" />
              <div className="h-24 bg-black/5 w-full" />
            </div>
          </div>
        ) : !product ? (
          <div className="py-24 text-center border hairline p-8 space-y-4">
            <h2 className="font-wide text-2xl uppercase">Sản phẩm không tồn tại</h2>
            <p className="text-xs font-mono text-[#0a0a0a]/60">
              Không tìm thấy thông tin sản phẩm này trên hệ thống cơ sở dữ liệu.
            </p>
            <Link
              href="/products"
              className="inline-block mt-4 px-6 py-2.5 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase"
            >
              ← Quay lại danh mục sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Left: Editorial Image Gallery (4 Góc Ảnh Chi Tiết Atelier) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Main Viewport với ảnh đang chọn trong 4 ảnh */}
              <div className="aspect-[4/5] bg-[#0a0a0a]/5 border hairline relative overflow-hidden group select-none">
                <img
                  src={activeImage.url}
                  alt={`${product.name} - ${activeImage.title}`}
                  key={activeImage.url}
                  className="w-full h-full object-cover contrast-105 transition-all duration-500 group-hover:scale-[1.02]"
                />

                {/* Góc phải: Bộ đếm 4 ảnh & Nút phóng to Lightbox */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <span className="text-[10px] font-mono tracking-widest bg-white/95 text-[#0a0a0a] px-2.5 py-1 border hairline shadow-xs font-semibold">
                    {String(activeImageIndex + 1).padStart(2, '0')} / 04
                  </span>
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 bg-white/95 hover:bg-black hover:text-white text-[#0a0a0a] border hairline transition-colors cursor-pointer shadow-xs"
                    title="Phóng to toàn màn hình (Lightbox)"
                    aria-label="Phóng to hình ảnh"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cảnh báo tồn kho thời gian thực */}
                {activeVariant && activeVariant.available_qty <= 5 && activeVariant.available_qty > 0 && (
                  <span className="absolute bottom-4 left-4 text-[10px] font-mono tracking-wider uppercase bg-[#0a0a0a] text-white px-2.5 py-1 z-10 shadow-xs">
                    Cảnh báo sắp hết: Còn {activeVariant.available_qty} chiếc
                  </span>
                )}
                {activeVariant && activeVariant.available_qty <= 0 && (
                  <span className="absolute bottom-4 left-4 text-[10px] font-mono tracking-wider uppercase bg-black text-white px-2.5 py-1 z-10 shadow-xs">
                    Hết hàng
                  </span>
                )}

                {/* Nút lật ảnh Trước / Sau (Prev/Next) */}
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-black hover:text-white text-black border hairline transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-10 shadow-xs"
                  aria-label="Xem ảnh trước"
                  title="Xem ảnh trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-black hover:text-white text-black border hairline transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-10 shadow-xs"
                  aria-label="Xem ảnh kế tiếp"
                  title="Xem ảnh kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Thanh chọn 4 bức hình (4 Interactive Thumbnails) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#0a0a0a]/60">
                  <span className="font-semibold text-black/80">BỘ 5 GÓC CHỤP SẢN PHẨM</span>
                  <span>CHỌN ẢNH ĐỂ XEM CHI TIẾT (01 - 05)</span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {galleryImages.map((img, idx) => {
                    const isActive = activeImageIndex === idx;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`group relative text-left transition-all cursor-pointer ${isActive
                          ? 'ring-2 ring-black ring-offset-2'
                          : 'opacity-70 hover:opacity-100'
                          }`}
                      >
                        <div className="aspect-[4/5] bg-black/5 border hairline overflow-hidden relative">
                          <img
                            src={img.url}
                            alt={img.title}
                            className={`w-full h-full object-cover filter contrast-105 transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'
                              }`}
                          />
                        </div>
                        <div className="mt-1.5">
                          <div
                            className={`text-[9px] sm:text-[10px] font-mono uppercase truncate ${isActive ? 'text-black font-bold' : 'text-black/60 group-hover:text-black'
                              }`}
                          >
                            {img.tag}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right: Buy Box & Product Narrative */}
            <div className="lg:col-span-5 space-y-8">

              {/* Product Header */}
              <div className="space-y-3 border-b hairline pb-6">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#0a0a0a]/60">
                  <span>{product.category} / EDITION 01</span>
                  <span>SKU: {activeVariant?.sku || '—'}</span>
                </div>

                <h1 className="font-wide uppercase text-2xl md:text-3xl lg:text-4xl tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-4 pt-1">
                  <div className="text-2xl font-bold font-mono tracking-tight text-[#0a0a0a]">
                    {activeVariant ? formatMoney(activeVariant.selling_price) : '—'}
                  </div>
                  <div className="text-[11px] font-mono text-[#0a0a0a]/60">
                    Đã bao gồm thuế GTGT
                  </div>
                </div>
              </div>

              {/* Description Narrative */}
              <p className="text-sm leading-relaxed text-[#0a0a0a]/75 font-light">
                {product.description}
              </p>

              {/* Colorway Selection */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono uppercase">
                  <span className="text-[#0a0a0a]/60">Màu sắc lựa chọn:</span>
                  <strong className="text-black">{selectedColor}</strong>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          const matched = product.variants.find((v) => v.color === color);
                          if (matched) setSelectedSize(matched.size);
                        }}
                        className={`px-4 py-2 text-xs font-mono uppercase border transition-colors cursor-pointer ${isSelected
                          ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                          : 'bg-white text-black/70 border-black/15 hover:border-black'
                          }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono uppercase">
                  <span className="text-[#0a0a0a]/60">Kích cỡ (Size):</span>
                  <strong className="text-black">Size {selectedSize}</strong>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSizesForColor.map((v) => {
                    const isSelected = selectedSize === v.size;
                    const isOutOfStock = v.available_qty <= 0;

                    return (
                      <button
                        key={v.size}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(v.size)}
                        className={`p-2.5 text-center border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${isSelected
                          ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                          : 'bg-white text-black/80 border-black/15 hover:border-black'
                          }`}
                      >
                        <div className="text-xs font-bold font-mono uppercase">Size {v.size}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                          {isOutOfStock ? 'Hết hàng' : `Còn ${v.available_qty}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Stepper & Stock status */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase">
                  <span className="text-[#0a0a0a]/60">Số lượng đặt:</span>
                  <div className="flex items-center border hairline">
                    <button
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="px-3 py-1 text-sm hover:bg-black/5 font-mono cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-mono font-bold">{selectedQty}</span>
                    <button
                      onClick={() => {
                        if (activeVariant && selectedQty < activeVariant.available_qty) {
                          setSelectedQty(selectedQty + 1);
                        }
                      }}
                      disabled={!activeVariant || selectedQty >= activeVariant.available_qty}
                      className="px-3 py-1 text-sm hover:bg-black/5 font-mono cursor-pointer disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#0a0a0a]/60 pt-1">
                  <span>Vị trí kho xuất hàng:</span>
                  <span>{activeVariant?.location_code || 'WH-HN-01'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAddToBag}
                  disabled={!activeVariant || activeVariant.available_qty <= 0}
                  className="w-full py-4 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {!activeVariant
                    ? 'Chọn quy cách'
                    : activeVariant.available_qty <= 0
                      ? 'Tạm hết hàng'
                      : `Thêm vào giỏ hàng • ${formatMoney(activeVariant.selling_price * selectedQty)}`}
                </button>

                <button
                  onClick={() => {
                    handleAddToBag();
                    setIsCheckingOut(true);
                  }}
                  disabled={!activeVariant || activeVariant.available_qty <= 0}
                  className="w-full py-3.5 border hairline text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Mua ngay qua VietQR
                </button>
              </div>

              {/* Service Commitments */}
              <div className="border-t hairline pt-6 space-y-3 text-xs font-mono text-[#0a0a0a]/70">
                <div className="flex items-center gap-2.5">
                  <span>✓</span>
                  <span>Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000 ₫.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>✓</span>
                  <span>Đổi trả sản phẩm trong vòng 7 ngày nếu không vừa kích cỡ.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span>✓</span>
                  <span>Khóa tồn kho an toàn & xác thực thanh toán tức thì qua VietQR.</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= 3.5. CHI TIẾT CHẾ TÁC & BỘ ẢNH ARCHIVAL LOOKBOOK TOÀN PHẦN ================= */}
        {product && (
          <section className="mt-16 pt-12 border-t hairline space-y-10">
            {/* Material and Construction Notes */}
            <div className="border hairline p-6 md:p-8 bg-[#0a0a0a]/[0.015]">
              <div className="text-[10px] font-mono uppercase text-[#0a0a0a]/50 tracking-wider mb-3">
                CHI TIẾT CHẾ TÁC & TIÊU CHUẨN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono pt-1">
                <div>
                  <span className="text-[#0a0a0a]/40 block text-[10px] uppercase">CHẤT LIỆU</span>
                  <strong className="text-[#0a0a0a] text-sm">Natural Fibers (100% Cotton)</strong>
                </div>
                <div>
                  <span className="text-[#0a0a0a]/40 block text-[10px] uppercase">FORM DÁNG</span>
                  <strong className="text-[#0a0a0a] text-sm">Structured Cut / Oversize</strong>
                </div>
                <div>
                  <span className="text-[#0a0a0a]/40 block text-[10px] uppercase">XUẤT XỨ</span>
                  <strong className="text-[#0a0a0a] text-sm">Made in Vietnam</strong>
                </div>
              </div>
            </div>

            {/* Lookbook Archive: Hiển thị trọn vẹn cả 5 bức ảnh kèm chú thích chuyên sâu */}
            <div className="border hairline p-6 md:p-8 space-y-6 bg-white">
              <div className="flex items-center justify-between border-b hairline pb-4">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#0a0a0a]/50 block">
                    ARCHIVAL LOOKBOOK • BỘ 5 GÓC CHỤP ĐẶC TẢ
                  </span>
                  <h3 className="font-wide uppercase text-sm sm:text-base mt-0.5">
                    Chi Tiết Chế Tác & Góc Nhìn Thực Tế
                  </h3>
                </div>
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="text-[10px] font-mono uppercase underline underline-offset-4 text-black/70 hover:text-black flex items-center gap-1.5 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  Phóng to
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {galleryImages.map((plate, idx) => (
                  <div
                    key={plate.id}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setIsLightboxOpen(true);
                    }}
                    className="group border hairline p-3 bg-black/[0.01] hover:bg-black/[0.03] transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="aspect-[4/5] bg-black/5 overflow-hidden border hairline relative">
                      <img
                        src={plate.url}
                        alt={plate.title}
                        className="w-full h-full object-cover filter contrast-105 group-hover:scale-105 transition-all duration-500"
                      />
                      <span className="absolute bottom-2 right-2 text-[8px] font-mono uppercase bg-black text-white px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem chi tiết ↗
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase text-black/50 font-medium">{plate.tag}</span>
                        <span className="text-[9px] font-mono text-black/40">Góc 0{idx + 1}/05</span>
                      </div>
                      <h4 className="text-xs font-semibold uppercase mt-0.5 text-black line-clamp-1">
                        {plate.title}
                      </h4>
                      <p className="text-[10px] font-mono text-black/60 mt-1 leading-relaxed line-clamp-2">
                        {plate.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================= 4. RELATED EDITIONS ================= */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t hairline">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <span className="text-[10px] font-mono tracking-mono uppercase text-[#0a0a0a]/60 block mb-1">
                  ATELIER ARCHIVE
                </span>
                <h3 className="font-wide uppercase text-xl md:text-2xl">
                  Sản phẩm cùng bộ sưu tập
                </h3>
              </div>
              <Link
                href="/products"
                className="text-xs font-mono uppercase tracking-wide underline underline-offset-4 hover:opacity-60"
              >
                Xem tất cả ({allProducts.length}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((rel, idx) => {
                const minPrice = Math.min(...rel.variants.map((v) => v.selling_price));
                return (
                  <article key={rel.id} className="group border-b hairline pb-6 flex flex-col justify-between">
                    <Link href={`/products/${rel.id}`} className="space-y-4 block">
                      <div className="aspect-[4/5] bg-black/5 overflow-hidden border hairline relative">
                        <img
                          src={getPrimaryImageUrl(rel.image_url)}
                          alt={rel.name}
                          className="w-full h-full object-cover contrast-105 group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-[#0a0a0a]/50">
                          {rel.category}
                        </div>
                        <h4 className="font-wide uppercase text-sm group-hover:underline truncate mt-1">
                          {rel.name}
                        </h4>
                        <div className="text-xs font-semibold font-mono mt-1">
                          {formatMoney(minPrice)}
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ================= 5. SLIDE-OUT BAG DRAWER ================= */}
      {isBagOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setIsBagOpen(false)} />

          <div className="relative bg-white border-l hairline w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">

            {/* Header (Fixed shrink-0) */}
            <div className="flex items-center justify-between px-6 py-5 border-b hairline bg-white shrink-0">
              <div>
                <h3 className="font-wide uppercase text-lg">Giỏ hàng</h3>
                <span className="text-[10px] font-mono uppercase text-[#0a0a0a]/60">
                  {totalBagCount} Sản phẩm
                </span>
              </div>
              <button
                onClick={() => setIsBagOpen(false)}
                className="p-2 text-black/60 hover:text-black cursor-pointer transition-colors"
                aria-label="Đóng giỏ hàng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body: Items List + Deal selection (flex-1 overflow-y-auto min-h-0) */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
              {/* Items List */}
              <div className="space-y-4 divide-y divide-black/10">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-[#0a0a0a]/50 uppercase space-y-3">
                    <p>Giỏ hàng của bạn đang trống.</p>
                    <button
                      onClick={() => setIsBagOpen(false)}
                      className="inline-block py-2 px-4 border hairline text-[11px] uppercase font-medium hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      Tiếp tục mua sắm
                    </button>
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
                          <div className="flex items-center border hairline text-xs">
                            <button
                              onClick={() => handleUpdateQty(item.variant_id, -1)}
                              className="px-2 py-0.5 hover:bg-black/5 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 py-0.5 tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQty(item.variant_id, 1)}
                              disabled={item.quantity >= item.available_qty}
                              className="px-2 py-0.5 hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.variant_id)}
                            className="text-[10px] uppercase text-black/40 hover:text-black underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Deal Selection Area (inside scrollable body) */}
              {cart.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t hairline">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-black/70 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-black" />
                      <span>Chọn Deal / Khuyến mãi</span>
                    </span>
                    {appliedDealCode && (
                      <button
                        type="button"
                        onClick={() => setAppliedDealCode(null)}
                        className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {AVAILABLE_DEALS.map((deal) => {
                      const isSelected = appliedDealCode === deal.code;
                      const hasMinOrder = Boolean((deal.min_order ?? 0) > 0);
                      const isMinOrderReached = hasMinOrder ? cartSubtotal >= (deal.min_order ?? 0) : true;

                      if (isSelected) {
                        return (
                          <div
                            key={deal.code}
                            onClick={() => setAppliedDealCode(null)}
                            className="p-3 rounded-xl bg-black text-white border border-black shadow-xs flex items-start justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                            title="Bấm để bỏ chọn mã này"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold tracking-wide text-white">{deal.code}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/20 text-white">
                                    {deal.discount}
                                  </span>
                                </div>
                                <span className="text-[10px] text-white/80 font-mono">Đang chọn ✓</span>
                              </div>
                              <div className="text-[11px] text-white/70 mt-1 leading-snug">
                                {deal.title} • {deal.condition}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (isMinOrderReached) {
                        return (
                          <div
                            key={deal.code}
                            onClick={() => setAppliedDealCode(deal.code)}
                            className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 shadow-2xs flex items-start justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group"
                            title="Bấm để áp dụng mã"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-black">{deal.code}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                    {deal.discount}
                                  </span>
                                </div>
                                <span className="text-[11px] text-emerald-600 font-medium group-hover:underline">Áp dụng →</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                                {deal.title} • {deal.condition}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Ineligible deal (matches exact design in user screenshot)
                      return (
                        <div
                          key={deal.code}
                          className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 select-none cursor-not-allowed"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-400">{deal.code}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-200/70 text-slate-500">
                                {deal.discount}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 italic">Chưa đủ điều kiện</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {deal.title} • {deal.condition}
                          </div>
                          <p className="text-[10px] text-amber-700/80 font-medium mt-1">
                            Mua thêm {formatMoney((deal.min_order || 0) - cartSubtotal)} để áp dụng mã này
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer: Summary & Checkout Button (shrink-0 bg-white border-t hairline) */}
            {cart.length > 0 && (
              <div className="p-6 border-t hairline bg-white shrink-0 space-y-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-black/60">
                    <span>Tạm tính ({totalBagCount} món):</span>
                    <span className="tabular-nums">{formatMoney(cartSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Chiết khấu {currentTier.name} (-{discountPercent}%):</span>
                      <span className="tabular-nums">-{formatMoney(discountAmount)}</span>
                    </div>
                  )}
                  {Boolean(dealDiscount > 0 && appliedDeal) && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <span>{appliedDeal?.title}:</span>
                        <button
                          type="button"
                          onClick={() => setAppliedDealCode(null)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 underline ml-1 cursor-pointer font-normal"
                          title="Bỏ áp dụng deal"
                        >
                          (Bỏ chọn)
                        </button>
                      </span>
                      <span className="tabular-nums">-{formatMoney(dealDiscount)}</span>
                    </div>
                  )}
                  {Boolean(appliedDeal && (appliedDeal.min_order ?? 0) > 0 && cartSubtotal < (appliedDeal.min_order ?? 0)) && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 border border-amber-200 rounded">
                      Deal {appliedDeal?.code}: Mua thêm {formatMoney((appliedDeal?.min_order ?? 0) - cartSubtotal)} để được {appliedDeal?.discount}
                    </div>
                  )}
                  <div className="flex justify-between text-black/60">
                    <span>Phí giao hàng:</span>
                    <span className="tabular-nums">
                      {isFreeshipDeal
                        ? 'Miễn phí (Voucher Freeship)'
                        : cartShippingFee === 0
                          ? 'Miễn phí'
                          : formatMoney(cartShippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-black pt-2 border-t hairline">
                    <span>Tổng thanh toán:</span>
                    <span className="tabular-nums">{formatMoney(cartTotal)}</span>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-500 text-center">
                      Đăng nhập để nhận quyền lợi hội viên và tiếp tục thanh toán.
                    </p>
                    <button
                      onClick={() => {
                        if (cart.length === 0) return;
                        window.location.href = `/login?redirect=${encodeURIComponent('/checkout')}&reason=checkout`;
                      }}
                      disabled={cart.length === 0}
                      className="w-full py-3.5 bg-[#0f172a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Đăng nhập để tiếp tục</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/checkout"
                    onClick={() => {
                      if (appliedDeal && appliedDeal.min_order && cartSubtotal < appliedDeal.min_order) {
                        setAppliedDealCode(null);
                      }
                      setIsBagOpen(false);
                    }}
                    className="w-full py-3.5 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90 cursor-pointer transition-colors text-center block mt-1"
                  >
                    Tiến hành thanh toán
                  </Link>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= 6. CHECKOUT MODAL ================= */}
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

      {/* ================= 7. ORDER SUCCESS & VIETQR ================= */}
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

      {/* ================= 8. FLOATING TOAST ================= */}
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

      {/* ================= 9. FULLSCREEN LIGHTBOX MODAL (4 BỨC HÌNH CHI TIẾT) ================= */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-10 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[95vh] flex flex-col justify-between bg-white text-black p-4 sm:p-6 border hairline space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="w-full flex items-center justify-between border-b hairline pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0a0a0a]/50">
                  {product?.category} • {activeImage.plate} • {activeImage.tag}
                </span>
                <h3 className="font-wide uppercase text-sm sm:text-base font-semibold">
                  {activeImage.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono bg-black text-white px-2 py-0.5 font-bold">
                  {String(activeImageIndex + 1).padStart(2, '0')} / 04
                </span>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 hover:bg-black/10 text-black cursor-pointer transition-colors"
                  aria-label="Đóng phóng to (Esc)"
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Khung ảnh chính trong Lightbox */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[16/11] max-h-[58vh] bg-black/5 flex items-center justify-center overflow-hidden border hairline select-none">
              <img
                src={activeImage.url}
                alt={activeImage.title}
                key={`lb-${activeImage.url}`}
                className="w-full h-full object-contain filter contrast-105"
              />

              <button
                onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/95 hover:bg-black hover:text-white border hairline text-black cursor-pointer shadow-md transition-colors"
                aria-label="Ảnh trước (Mũi tên trái)"
                title="Ảnh trước (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/95 hover:bg-black hover:text-white border hairline text-black cursor-pointer shadow-md transition-colors"
                aria-label="Ảnh kế tiếp (Mũi tên phải)"
                title="Ảnh kế tiếp (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Chú thích & Thanh 4 thumbnails chân trang Modal */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t hairline">
              <p className="text-xs font-mono text-black/75 max-w-md text-left leading-relaxed">
                {activeImage.description}
              </p>

              <div className="flex gap-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-14 aspect-[4/5] border transition-all overflow-hidden cursor-pointer relative ${activeImageIndex === idx
                      ? 'ring-2 ring-black border-black'
                      : 'opacity-50 hover:opacity-100 border-black/20'
                      }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-black text-white px-1">
                      0{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= 10. FOOTER ================= */}
      <footer className="border-t hairline bg-white py-12 px-6 md:px-10 mt-20">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-mono tracking-wider uppercase text-[#0a0a0a]/60">
          <div>
            © 2026 CAISHOP ATELIER • AUTONOMOUS MONOCHROME COMMERCE
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-black">Storefront</Link>
            <Link href="/products" className="hover:text-black">Products</Link>
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
        initialTab={profileActiveTab}
      />

    </div>
  );
}
