'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Ruler, X, Check, Sparkles, ShoppingBag, ChevronRight, User } from 'lucide-react';
import { useHeaderNav, useSiteContent } from '@/lib/useSiteContent';
import { getProductGallery, getPrimaryImageUrl } from '@/lib/productImages';
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

export default function CustomerStorefront() {
  const { items: headerNavItems } = useHeaderNav();
  const { content: siteContent } = useSiteContent();
  const { user, isLoggedIn, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Quick View / Variant Selection
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Size Guide Modal State
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeSizeBrand, setActiveSizeBrand] = useState<'lacoste' | 'ck' | 'tommy' | 'levis'>('lacoste');

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

  // Scroll listener for sticky header hairline shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for .reveal elements on scroll
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            // Unobserve so it remains revealed
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.12,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    reveals.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [products]);

  // Fetch products from API
  useEffect(() => {
    fetch('/api/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Floating feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Open product drawer/modal
  const handleSelectProduct = (product: Product) => {
    setActiveProduct(product);
    setQuickViewImageIndex(0);
    if (product.variants.length > 0) {
      setSelectedColor(product.variants[0].color);
      setSelectedSize(product.variants[0].size);
    }
  };

  const activeVariant = activeProduct?.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const quickViewGallery = activeProduct ? getProductGallery(activeProduct) : [];
  const currentQuickViewImg = quickViewGallery[quickViewImageIndex] || quickViewGallery[0];

  // Add to Bag
  const handleAddToBag = () => {
    if (!activeProduct || !activeVariant) return;

    if (activeVariant.available_qty <= 0) {
      showToast('Sản phẩm này hiện đang tạm hết hàng.');
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

    setActiveProduct(null);
  };

  // Quick Add to Bag from product cards
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

    showToast(`Đã thêm "${product.name}" (Size ${variant.size}) vào giỏ hàng.`);
  };

  // Update Cart Quantity
  const updateCartQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id === variantId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.available_qty) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartShippingFee = cartSubtotal >= 500000 || cartSubtotal === 0 ? 0 : 30000;
  const cartTotal = cartSubtotal + cartShippingFee;

  // Place Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerName || !customerPhone || !shippingAddress) {
      setCheckoutError('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          items: cart.map((item) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckoutError(data.message || 'Không thể tạo đơn hàng.');
      } else {
        setOrderSuccess(data.order);
        setCart([]);
        setIsCheckingOut(false);
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Lỗi kết nối.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased selection:bg-[#0a0a0a] selection:text-white">
      
      {/* ================= 1. STICKY FROSTED HEADER ================= */}
      <header
        id="nav"
        className={`sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b hairline transition-all duration-500 ${
          scrolled ? 'shadow-[0_1px_0_rgba(10,10,10,0.06)]' : ''
        }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="relative flex items-center justify-between h-[68px] md:h-[88px]">
            
            {/* Zone 1: Left uppercase nav links + mobile hamburger */}
            <div className="flex items-center">
              <ul className="hidden lg:flex items-center gap-10 xl:gap-12 text-[11px] tracking-wide-2 font-medium uppercase">
                {headerNavItems.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="nav-link text-[#0a0a0a]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Hamburger Button (below lg) */}
              <button
                id="menuBtn"
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

            {/* Zone 2: Absolutely-Centered Archivo Expanded Wordmark */}
            <a
              href="#"
              className="wordmark absolute left-1/2 -translate-x-1/2 font-wide text-[19px] md:text-[24px] font-medium uppercase select-none whitespace-nowrap text-[#0a0a0a] tracking-mono"
            >
              ATELIER
            </a>

            {/* Zone 3: Right utility cluster */}
            <div className="flex items-center gap-5 lg:gap-7 text-[11px] tracking-wide-2 font-medium uppercase">
              <Link href="/products" className="nav-link hidden lg:inline text-[#0a0a0a]">Product / Search</Link>

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
                  aria-label="Account & Login"
                  title="Tài khoản / Đăng nhập"
                  className="relative flex items-center text-[#0a0a0a] hover:opacity-70 transition-opacity"
                >
                  <svg className="w-5 h-5 md:w-[21px] md:h-[21px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </Link>
              )}

              {/* Mobile Search Stand-in */}
              <Link href="/products" className="lg:hidden p-1 text-[#0a0a0a]" aria-label="Search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </Link>

              {/* Handbag Bag-Count Utility Icon */}
              <button
                onClick={() => setIsBagOpen(true)}
                aria-label="Giỏ hàng"
                className="relative flex items-center text-[#0a0a0a] hover:opacity-70 transition-opacity"
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
            id="drawer"
            className={`lg:hidden overflow-hidden transition-[max-height] duration-500 ease-out border-t hairline ${
              isMenuOpen ? 'max-h-64' : 'max-h-0'
            }`}
          >
            <ul className="py-5 space-y-4 text-[12px] tracking-wide-2 font-medium uppercase">
              {headerNavItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={() => setIsMenuOpen(false)} className="block text-[#0a0a0a]">
                    {item.label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && user ? (
                <li className="pt-3 border-t hairline space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#0a0a0a] truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0a0a0a]/70 shrink-0" />
                      {user.name}
                    </span>
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

      {/* ================= 2. EDITORIAL DISPLAY HERO (FULL VIEWPORT MINUS HEADER) ================= */}
      <section 
        id="hero" 
        className="relative w-full border-b hairline overflow-hidden bg-[#0a0a0a] text-white flex flex-col justify-between h-[calc(100dvh-68px)] md:h-[calc(100dvh-88px)] min-h-[560px]"
      >
        {/* Full-Bleed Background Image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src={siteContent?.home?.hero_image_url || '/images/hero-atelier-wide.jpg'}
            alt="Hero Background"
            className="w-full h-full object-cover object-center contrast-105 brightness-[0.75]"
          />
          {/* Multi-layered cinematic gradient overlays for pristine readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/60" />
        </div>

        {/* Content Container (Centered in available viewport space) */}
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-6 md:px-10 my-auto py-6 md:py-8">
          <div className="space-y-4 md:space-y-6 max-w-3xl">
            <div className="text-[10px] md:text-[11px] tracking-mono uppercase text-white/90 flex items-center gap-2.5 font-medium">
              <span>{siteContent?.home?.hero_badge || 'COLLECTION 01 / THE INTERFACE SERIES'}</span>
            </div>
            
            <h1 className="font-wide uppercase leading-[0.92] tracking-tight text-[10vw] md:text-[7vw] lg:text-[5.8vw] xl:text-[78px] text-white drop-shadow-md">
              {siteContent?.home?.hero_title || 'DESIGN, CUT TO MEASURE.'}
            </h1>

            <div className="max-w-xl space-y-5 pt-1">
              <p className="text-[14px] md:text-[16px] leading-relaxed text-white/90 font-light drop-shadow-sm">
                {siteContent?.home?.hero_description || 'An editorial retail experiment constructed for autonomous commerce. Pure monochrome plates, real-time inventory locking, and zero excess ornament.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] tracking-wide-2 uppercase font-medium pt-2">
                {/* Nút 1: Săn đồ hiệu ngay (Micro-interaction: Liquid Bottom Fill + Shimmer Sheen + Arrow Eject) */}
                <a 
                  href="#collection" 
                  className="group relative overflow-hidden inline-flex items-center gap-3 px-7 py-3.5 bg-white text-[#0a0a0a] font-bold tracking-wider rounded-xs shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
                >
                  {/* Background Liquid Fill (slides from bottom up) */}
                  <span className="absolute inset-0 bg-[#0a0a0a] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                  
                  {/* Sheen reflection sweep */}
                  <span className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 translate-x-[-120%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-10 pointer-events-none" />

                  {/* Button Content */}
                  <span className="relative z-20 flex items-center gap-2.5 transition-colors duration-300 group-hover:text-white">
                    <span>{siteContent?.home?.hero_cta_1 || 'Săn đồ hiệu ngay'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </span>
                </a>

                {/* Nút 2: Bảng chọn size chuẩn (Micro-interaction: Frosted Glass + Liquid Fill + Rotating Ruler + Modal Trigger) */}
                <button 
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="group relative overflow-hidden inline-flex items-center gap-2.5 px-6 py-3.5 border border-white/60 text-white backdrop-blur-md bg-white/5 rounded-xs transition-all duration-300 hover:border-white hover:bg-white shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer font-medium tracking-wider"
                >
                  {/* Background Liquid Fill (slides from bottom up) */}
                  <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                  
                  {/* Button Content */}
                  <span className="relative z-10 flex items-center gap-2.5 transition-colors duration-300 group-hover:text-[#0a0a0a]">
                    <Ruler className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45" />
                    <span>{siteContent?.home?.hero_cta_2 || 'Bảng chọn size chuẩn'}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Plate Process Strip (Docked perfectly along bottom of screen) */}
        <div className="relative z-10 border-t border-white/15 bg-black/85 backdrop-blur-md text-white shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4">
            
            {/* Plate 1 - Lacoste */}
            <div className="group relative overflow-hidden border-r border-white/15 px-6 py-3.5 md:py-4.5 flex items-center justify-between hover:bg-white transition-all duration-200 cursor-pointer">
              {/* Left: Brand Icon on hover */}
              <div className="flex items-center h-8 min-w-[40px] shrink-0">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none">
                  <img
                    src={siteContent?.home?.hero_plate1_logo || '/image/lacoste.png'}
                    alt="Lacoste Logo"
                    className="h-6 md:h-7 w-auto max-w-[50px] object-contain"
                    onError={(e: any) => { e.currentTarget.src = '/images/lacoste.png'; }}
                  />
                </div>
              </div>

              {/* Right: Text remains intact, switches to dark on hover */}
              <div className="text-right transition-colors duration-200">
                <span className="text-[9px] font-mono text-white/50 group-hover:text-black/60 uppercase block tracking-wider transition-colors">
                  {siteContent?.home?.hero_plate1_tag || 'Concept'}
                </span>
                <span className="font-wide uppercase text-sm md:text-base font-semibold text-white group-hover:text-black tracking-tight transition-colors">
                  {siteContent?.home?.hero_plate1_title || 'Canvas'}
                </span>
              </div>
            </div>

            {/* Plate 2 - Calvin Klein */}
            <div className="group relative overflow-hidden border-r md:border-r border-white/15 px-6 py-3.5 md:py-4.5 flex items-center justify-between hover:bg-white transition-all duration-200 cursor-pointer">
              {/* Left: Brand Icon on hover */}
              <div className="flex items-center h-8 min-w-[40px] shrink-0">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none">
                  <img
                    src={siteContent?.home?.hero_plate2_logo || '/image/CK.png'}
                    alt="Calvin Klein Logo"
                    className="h-6 md:h-7 w-auto max-w-[50px] object-contain"
                    onError={(e: any) => { e.currentTarget.src = '/images/CK.png'; }}
                  />
                </div>
              </div>

              {/* Right: Text remains intact, switches to dark on hover */}
              <div className="text-right transition-colors duration-200">
                <span className="text-[9px] font-mono text-white/50 group-hover:text-black/60 uppercase block tracking-wider transition-colors">
                  {siteContent?.home?.hero_plate2_tag || 'Drape'}
                </span>
                <span className="font-wide uppercase text-sm md:text-base font-semibold text-white group-hover:text-black tracking-tight transition-colors">
                  {siteContent?.home?.hero_plate2_title || 'Compose'}
                </span>
              </div>
            </div>

            {/* Plate 3 - Tommy Hilfiger */}
            <div className="group relative overflow-hidden border-r border-white/15 px-6 py-3.5 md:py-4.5 flex items-center justify-between border-t md:border-t-0 hover:bg-white transition-all duration-200 cursor-pointer">
              {/* Left: Brand Icon on hover */}
              <div className="flex items-center h-8 min-w-[40px] shrink-0">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none">
                  <img
                    src={siteContent?.home?.hero_plate3_logo || '/image/tommy.png'}
                    alt="Tommy Hilfiger Logo"
                    className="h-6 md:h-7 w-auto max-w-[50px] object-contain"
                    onError={(e: any) => { e.currentTarget.src = '/images/tommy.png'; }}
                  />
                </div>
              </div>

              {/* Right: Text remains intact, switches to dark on hover */}
              <div className="text-right transition-colors duration-200">
                <span className="text-[9px] font-mono text-white/50 group-hover:text-black/60 uppercase block tracking-wider transition-colors">
                  {siteContent?.home?.hero_plate3_tag || 'Craft'}
                </span>
                <span className="font-wide uppercase text-sm md:text-base font-semibold text-white group-hover:text-black tracking-tight transition-colors">
                  {siteContent?.home?.hero_plate3_title || 'Refine'}
                </span>
              </div>
            </div>

            {/* Plate 4 - Levi's */}
            <div className="group relative overflow-hidden px-6 py-3.5 md:py-4.5 flex items-center justify-between border-t md:border-t-0 hover:bg-white transition-all duration-200 cursor-pointer">
              {/* Left: Brand Icon on hover */}
              <div className="flex items-center h-8 min-w-[40px] shrink-0">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 pointer-events-none">
                  <img
                    src={siteContent?.home?.hero_plate4_logo || '/image/LEVIS.png'}
                    alt="Levi's Logo"
                    className="h-6 md:h-7 w-auto max-w-[50px] object-contain"
                    onError={(e: any) => { e.currentTarget.src = '/images/LEVIS.png'; }}
                  />
                </div>
              </div>

              {/* Right: Text remains intact, switches to dark on hover */}
              <div className="text-right transition-colors duration-200">
                <span className="text-[9px] font-mono text-white/50 group-hover:text-black/60 uppercase block tracking-wider transition-colors">
                  {siteContent?.home?.hero_plate4_tag || 'Dispatch'}
                </span>
                <span className="font-wide uppercase text-sm md:text-base font-semibold text-white group-hover:text-black tracking-tight transition-colors">
                  {siteContent?.home?.hero_plate4_title || 'Ship'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= 3. SLASH MARQUEE ================= */}
      <section className="reveal w-full border-b hairline overflow-hidden py-5 md:py-6 select-none bg-white">
        <div className="marquee-track">
          {/* Group 1 */}
          <div className="flex items-center text-[11px] md:text-[12px] tracking-mono uppercase text-[#0a0a0a]/70">
            <span className="px-8">{siteContent?.home?.marquee_text || 'ATELIER • AUTONOMOUS MONOCHROME COMMERCE • ARCHIVE EDITIONS • CUT TO MEASURE •'}</span>
          </div>
          {/* Group 2 (Duplicate for infinite seamless loop) */}
          <div aria-hidden="true" className="flex items-center text-[11px] md:text-[12px] tracking-mono uppercase text-[#0a0a0a]/70">
            <span className="px-8">{siteContent?.home?.marquee_text || 'ATELIER • AUTONOMOUS MONOCHROME COMMERCE • ARCHIVE EDITIONS • CUT TO MEASURE •'}</span>
          </div>
        </div>
      </section>

      {/* ================= 4. EDITORIAL PRODUCT GRID ================= */}
      <section id="product" className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 md:py-28">
        
        {/* Section Header */}
        <div className="reveal flex flex-col sm:flex-row sm:items-end justify-between border-b hairline pb-6 mb-12 gap-4">
          <div>
            <span className="text-[10px] md:text-[11px] tracking-mono uppercase text-[#0a0a0a]/60 block mb-2 font-mono">
              {siteContent?.home?.collection_badge || 'The Product Collection'}
            </span>
            <h2 className="font-wide uppercase text-[8vw] md:text-[44px] leading-tight">
              {siteContent?.home?.collection_title || 'Looks of the season'}
            </h2>
          </div>
        </div>

        {/* Grid of Product Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="aspect-[4/5] bg-[#0a0a0a]/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product, idx) => {
              const minPrice = Math.min(...product.variants.map((v) => v.selling_price));
              const totalStock = product.variants.reduce((sum, v) => sum + v.available_qty, 0);
              const plateNumber = String(idx + 1).padStart(2, '0');

              return (
                <article
                  key={product.id}
                  style={{ transitionDelay: `${(idx % 3) * 140}ms` }}
                  className="reveal group flex flex-col justify-between border-b hairline pb-8"
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
                        <span className="absolute top-4 left-4 text-[10px] font-mono tracking-widest bg-white/90 backdrop-blur-sm px-2 py-1 uppercase text-[#0a0a0a]">
                          No. {plateNumber}
                        </span>

                        {/* Stock badge if low */}
                        {totalStock <= 5 && totalStock > 0 && (
                          <span className="absolute top-4 right-4 text-[10px] tracking-wide-1 font-mono uppercase bg-[#0a0a0a] text-white px-2 py-1">
                            Low Stock: {totalStock}
                          </span>
                        )}
                        {totalStock === 0 && (
                          <span className="absolute top-4 right-4 text-[10px] tracking-wide-1 font-mono uppercase bg-[#0a0a0a] text-white px-2 py-1">
                            Sold Out
                          </span>
                        )}
                      </Link>
                    </div>

                    {/* Metadata & Title */}
                    <div className="pt-2 flex items-baseline justify-between gap-4">
                      <div>
                        <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block font-mono">
                          {product.category}
                        </span>
                        <Link 
                          href={`/products/${product.id}`}
                          className="font-wide uppercase text-base md:text-lg font-semibold cursor-pointer group-hover:opacity-70 transition-opacity block min-h-[3.25rem] line-clamp-2"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[14px] font-mono font-semibold">
                          {formatMoney(minPrice)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[13px] text-[#0a0a0a]/70 line-clamp-2 font-light leading-relaxed min-h-[2.5rem]">
                      {product.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddToCart(e, product)}
                      disabled={totalStock === 0}
                      className="w-full py-2.5 bg-[#0a0a0a] text-white text-[11px] font-mono uppercase tracking-wider hover:bg-black/85 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{totalStock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</span>
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/products/${product.id}`}
                        className="nav-link text-[11px] tracking-wide-2 uppercase font-medium text-[#0a0a0a]"
                      >
                        Xem chi tiết →
                      </Link>
                      <span className="text-[11px] font-mono text-[#0a0a0a]/50">
                        {product.variants.length} Sizes
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* View Full Product Archive CTA */}
            <div className="reveal col-span-full pt-10 text-center border-t hairline mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-3 px-8 py-3.5 border hairline uppercase text-[11px] tracking-wide-2 font-medium hover:bg-black hover:text-white transition-colors"
              >
                <span>Explore Full Product Archive ({products.length} Collections)</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ================= 5. DARK SPLIT STUDIO SECTION ================= */}
      <section id="studio" className="w-full bg-[#0a0a0a] text-white border-y hairline-dark">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-32">
          <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Big Headline */}
            <div className="reveal md:col-span-6 space-y-4">
              <span className="text-[10px] md:text-[11px] tracking-mono uppercase text-white/60 block">
                {siteContent?.home?.studio_badge || siteContent?.studio?.badge || 'The Fitting Room'}
              </span>
              <h2 className="font-wide uppercase text-[10vw] md:text-[52px] leading-[0.95] tracking-tight">
                {siteContent?.home?.studio_title || siteContent?.studio?.title || 'Crafted at the edge. Verified by code.'}
              </h2>
            </div>

            {/* Right Column: Narrative + DL Definition List */}
            <div className="reveal md:col-span-6 space-y-8" style={{ transitionDelay: '150ms' }}>
              <p className="text-[15px] md:text-[16px] leading-relaxed text-white/70 font-light">
                {siteContent?.home?.studio_narrative || siteContent?.studio?.narrative || 'Every garment is linked to Cloudflare D1 distributed edge storage. Zero speculative inventory, instant double-entry accounting records, and automated dispatch upon bank confirmation.'}
              </p>

              <dl className="border-b hairline-dark">
                <div className="flex justify-between py-5 border-t hairline-dark text-xs">
                  <dt className="text-white/60 uppercase tracking-wide-2">Web Canvas</dt>
                  <dd className="font-mono text-white">{siteContent?.home?.studio_canvas || siteContent?.studio?.spec_canvas || 'Full-bleed monochrome UI'}</dd>
                </div>
                <div className="flex justify-between py-5 border-t hairline-dark text-xs">
                  <dt className="text-white/60 uppercase tracking-wide-2">Inventory Engine</dt>
                  <dd className="font-mono text-white">{siteContent?.home?.studio_ledger || siteContent?.studio?.spec_ledger || 'Cloudflare D1 APAC (Singapore)'}</dd>
                </div>
                <div className="flex justify-between py-5 border-t hairline-dark text-xs">
                  <dt className="text-white/60 uppercase tracking-wide-2">Fulfillment Dispatch</dt>
                  <dd className="font-mono text-white">Zero-touch GHN / GHTK API</dd>
                </div>
              </dl>

              <div>
                <a href="#product" className="nav-link text-[11px] tracking-wide-2 uppercase font-medium text-white">
                  Order a garment now
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= 6. CENTERED MANIFESTO ================= */}
      <section id="manifesto" className="reveal max-w-[1100px] mx-auto text-center py-28 md:py-36 px-6 md:px-10">
        <span className="text-[10px] md:text-[11px] tracking-mono uppercase text-[#0a0a0a]/60 block mb-6">
          {siteContent?.home?.manifesto_badge || siteContent?.about?.badge || 'Manifesto'}
        </span>
        <blockquote className="font-wide uppercase text-[5.5vw] md:text-[34px] lg:text-[40px] leading-[1.2] tracking-tight">
          "{siteContent?.home?.manifesto_quote || siteContent?.about?.body_text || 'True luxury is not ornament. It is the absolute precision of cut, material integrity, and silent execution.'}"
        </blockquote>
        <div className="mt-8 text-[11px] tracking-mono uppercase text-[#0a0a0a]/50">
          {siteContent?.home?.manifesto_signature || siteContent?.about?.signature || 'Atelier / Caishop Architecture 2026'}
        </div>
      </section>

      {/* ================= 7. DARK FULL-BLEED CTA ================= */}
      <section className="reveal w-full bg-[#0a0a0a] text-white py-24 md:py-32 px-6 md:px-10 text-center border-t hairline-dark">
        <div className="max-w-[1000px] mx-auto space-y-8">
          <span className="text-[10px] md:text-[11px] tracking-mono uppercase text-white/50 block">
            {siteContent?.home?.cta_badge || 'Begin the sequence'}
          </span>
          <h2 className="font-wide uppercase text-[11vw] md:text-[7vw] leading-[0.9] tracking-tight">
            {siteContent?.home?.cta_title || 'Begin your first fitting.'}
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#product"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#0a0a0a] text-[11px] tracking-wide-2 uppercase font-medium hover:bg-white/90 transition-colors"
            >
              {siteContent?.home?.cta_button_text || 'Start shopping'}
            </a>
            <Link
              href="/admin"
              className="w-full sm:w-auto px-8 py-3.5 border hairline-dark text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-white/10 transition-colors"
            >
              Executive Dashboard
            </Link>
          </div>

          <p className="text-[11px] font-mono text-white/40 pt-4">
            {siteContent?.home?.cta_note || 'Direct VietQR dynamic settlement • Instant ledger confirmation'}
          </p>
        </div>
      </section>

      {/* ================= 8. DARK EDITORIAL FOOTER ================= */}
      <footer className="w-full bg-[#0a0a0a] text-white border-t hairline-dark px-6 md:px-10 py-16">
        <div className="max-w-[1400px] mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6 space-y-2">
              <div className="font-wide text-2xl uppercase tracking-mono">{siteContent?.home?.footer_brand || 'ATELIER'}</div>
              <p className="text-xs text-white/50 max-w-sm font-light">
                {siteContent?.home?.footer_address || 'High-fashion monochrome storefront powered by Next.js & Cloudflare D1.'}
              </p>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-[11px] tracking-wide-2 uppercase">
              <div className="space-y-3">
                <div className="text-white/40">Navigation</div>
                <ul className="space-y-2">
                  <li><a href="#hero" className="hover:text-white/70">New</a></li>
                  <li><a href="#product" className="hover:text-white/70">Products</a></li>
                  <li><a href="#studio" className="hover:text-white/70">Studio</a></li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="text-white/40">Control</div>
                <ul className="space-y-2">
                  <li><Link href="/admin" className="hover:text-white/70">Admin P&L</Link></li>
                  <li><Link href="/admin" className="hover:text-white/70">Inventory</Link></li>
                  <li><Link href="/admin" className="hover:text-white/70">Pricing</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="text-white/40">Colophon</div>
                <ul className="space-y-2 font-mono text-[10px] text-white/60">
                  <li>APAC SIN</li>
                  <li>D1 SQLite</li>
                  <li>Version 1.0</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t hairline-dark flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/40 gap-4">
            <div>{siteContent?.home?.footer_copyright || '© 2026 CAISHOP ATELIER. ALL RIGHTS RESERVED.'}</div>
            <div>MONOCHROME HIGH-FASHION EDITORIAL ENGINE</div>
          </div>

        </div>
      </footer>

      {/* ================= PRODUCT QUICK VIEW MODAL ================= */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border hairline max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b hairline pb-4">
              <div>
                <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block">
                  {activeProduct.category}
                </span>
                <h2 className="font-wide uppercase text-xl font-semibold">
                  {activeProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="p-1 hover:opacity-50 text-[#0a0a0a]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="aspect-[4/5] bg-[#0a0a0a]/5 border hairline overflow-hidden relative">
                  <img
                    src={currentQuickViewImg?.url || activeProduct.image_url}
                    alt={activeProduct.name}
                    key={currentQuickViewImg?.url || activeProduct.image_url}
                    className="w-full h-full object-cover contrast-105"
                  />
                  {currentQuickViewImg && (
                    <>
                      <span className="absolute top-2 left-2 text-[9px] font-mono px-2 py-0.5 bg-white/95 text-black border hairline uppercase font-medium">
                        {currentQuickViewImg.plate} • {currentQuickViewImg.tag}
                      </span>
                      <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.5 bg-black text-white font-bold">
                        0{quickViewImageIndex + 1}/04
                      </span>
                    </>
                  )}
                </div>

                {/* 4 thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {quickViewGallery.map((g, idx) => {
                    const isActive = quickViewImageIndex === idx;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setQuickViewImageIndex(idx)}
                        className={`aspect-[4/5] bg-black/5 border hairline overflow-hidden relative cursor-pointer transition-all ${
                          isActive ? 'ring-2 ring-black opacity-100' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={g.url} alt="" className="w-full h-full object-cover" />
                        <span className={`absolute bottom-0.5 left-0.5 text-[8px] font-mono px-1 ${
                          isActive ? 'bg-black text-white font-bold' : 'bg-white/95 text-black'
                        }`}>
                          0{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-2xl font-mono font-semibold">
                    {activeVariant ? formatMoney(activeVariant.selling_price) : '---'}
                  </div>

                  <p className="text-xs text-[#0a0a0a]/70 font-light leading-relaxed">
                    {activeProduct.description}
                  </p>

                  {/* Color Selector */}
                  <div className="space-y-2">
                    <span className="text-[11px] tracking-wide-2 uppercase text-[#0a0a0a]/60 block font-medium">
                      Color Palette
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(activeProduct.variants.map((v) => v.color))).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 text-xs font-mono border transition-all ${
                            selectedColor === color
                              ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                              : 'bg-white text-[#0a0a0a] border-black/20 hover:border-black'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-2">
                    <span className="text-[11px] tracking-wide-2 uppercase text-[#0a0a0a]/60 block font-medium">
                      Size Scale
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          activeProduct.variants
                            .filter((v) => v.color === selectedColor)
                            .map((v) => v.size)
                        )
                      ).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-10 h-9 text-xs font-mono border transition-all ${
                            selectedSize === size
                              ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                              : 'bg-white text-[#0a0a0a] border-black/20 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Availability */}
                  <div className="text-[11px] font-mono pt-1">
                    {activeVariant ? (
                      activeVariant.available_qty > 0 ? (
                        <span className="text-[#0a0a0a]">
                          ✓ {activeVariant.available_qty} units in stock ({activeVariant.sku})
                        </span>
                      ) : (
                        <span className="text-black/40">
                          ✕ Currently out of stock
                        </span>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Add to Bag Action */}
                <button
                  onClick={handleAddToBag}
                  disabled={!activeVariant || activeVariant.available_qty <= 0}
                  className="w-full py-3.5 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/80 disabled:bg-black/10 disabled:text-black/30 transition-colors"
                >
                  {activeVariant && activeVariant.available_qty > 0 ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= BAG DRAWER ================= */}
      {isBagOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l hairline">
            
            {/* Drawer Header */}
            <div className="p-6 border-b hairline flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block">Danh mục chọn</span>
                <h3 className="font-wide uppercase text-sm font-semibold">Giỏ hàng ({totalBagCount})</h3>
              </div>
              <button
                onClick={() => setIsBagOpen(false)}
                className="p-1 hover:opacity-50 text-[#0a0a0a]"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <p className="text-xs font-mono text-[#0a0a0a]/50">Giỏ hàng của bạn đang trống.</p>
                  <button
                    onClick={() => setIsBagOpen(false)}
                    className="nav-link text-[11px] tracking-wide-2 uppercase font-medium text-[#0a0a0a]"
                  >
                    Khám phá bộ sưu tập
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.variant_id} className="flex gap-4 pb-6 border-b hairline">
                    <img
                      src={getPrimaryImageUrl(item.product_image)}
                      alt={item.product_name}
                      className="w-20 h-24 object-cover contrast-105 border hairline shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs font-semibold uppercase font-wide truncate">{item.product_name}</div>
                      <div className="text-[11px] font-mono text-[#0a0a0a]/60">
                        {item.color} / Size {item.size}
                      </div>
                      <div className="text-xs font-mono font-medium pt-1">
                        {formatMoney(item.price)}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border hairline text-xs font-mono">
                          <button
                            onClick={() => updateCartQty(item.variant_id, -1)}
                            className="px-2 py-0.5 hover:bg-black/5"
                          >
                            -
                          </button>
                          <span className="px-2.5">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.variant_id, 1)}
                            className="px-2 py-0.5 hover:bg-black/5"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => updateCartQty(item.variant_id, -item.quantity)}
                          className="text-[11px] tracking-wide-1 uppercase text-[#0a0a0a]/50 hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Button */}
            {cart.length > 0 && (
              <div className="p-6 border-t hairline bg-[#0a0a0a]/[0.02] space-y-4">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[#0a0a0a]/60">
                    <span>Subtotal</span>
                    <span>{formatMoney(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#0a0a0a]/60">
                    <span>Dispatch (GHN/GHTK)</span>
                    <span>{cartShippingFee === 0 ? 'Complimentary' : formatMoney(cartShippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t hairline text-[#0a0a0a]">
                    <span>Total</span>
                    <span>{formatMoney(cartTotal)}</span>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 text-center font-mono">
                      Vui lòng đăng nhập tài khoản để tiếp tục thanh toán.
                    </p>
                    <button
                      onClick={() => {
                        const returnPath = typeof window !== 'undefined'
                          ? window.location.pathname + '?openCart=true'
                          : '/?openCart=true';
                        window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}&reason=checkout`;
                      }}
                      className="w-full py-3.5 bg-[#0f172a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-[#1e293b] transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full py-3.5 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90 transition-colors cursor-pointer"
                    >
                      Tiến hành thanh toán VietQR
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= CHECKOUT DIALOG ================= */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border hairline max-w-lg w-full p-6 md:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b hairline pb-4">
              <div>
                <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block">Settlement</span>
                <h3 className="font-wide uppercase text-base font-semibold">Recipient & Delivery</h3>
              </div>
              <button
                onClick={() => setIsCheckingOut(false)}
                className="p-1 hover:opacity-50 text-[#0a0a0a]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 bg-[#0a0a0a] text-white text-xs font-mono">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="uppercase text-[#0a0a0a]/70">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nguyen Van An"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 border hairline px-3 bg-white focus:outline-none focus:border-black font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase text-[#0a0a0a]/70">Telephone</label>
                <input
                  type="tel"
                  placeholder="e.g. 0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-10 border hairline px-3 bg-white focus:outline-none focus:border-black font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase text-[#0a0a0a]/70">Shipping Address</label>
                <textarea
                  placeholder="Street, ward, district, city..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={2}
                  className="w-full border hairline p-3 bg-white focus:outline-none focus:border-black font-sans"
                  required
                />
              </div>

              <div className="p-4 bg-[#0a0a0a]/[0.03] border hairline space-y-1.5">
                <div className="flex justify-between">
                  <span>Items Total ({totalBagCount}):</span>
                  <span>{formatMoney(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{cartShippingFee === 0 ? 'Complimentary' : formatMoney(cartShippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t hairline text-sm">
                  <span>Total Due:</span>
                  <span>{formatMoney(cartTotal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-4 py-2.5 border hairline uppercase text-[11px] tracking-wide-1 hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0a0a0a] text-white uppercase text-[11px] tracking-wide-2 font-medium hover:bg-black/90"
                >
                  Confirm & Generate VietQR
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= ORDER SUCCESS & VIETQR ================= */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border hairline max-w-md w-full p-8 text-center space-y-6">
            
            <div className="space-y-2">
              <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block">Receipt Verified</span>
              <h3 className="font-wide uppercase text-xl font-bold">Order Received</h3>
              <p className="text-xs font-mono text-[#0a0a0a]/70">
                Code: <strong className="text-[#0a0a0a]">{orderSuccess.order_code}</strong>
              </p>
            </div>

            {/* Dynamic VietQR Plate */}
            <div className="border hairline p-6 bg-[#0a0a0a]/[0.02] space-y-4">
              <span className="text-[10px] tracking-mono uppercase text-[#0a0a0a]/60 block">
                Instant Bank QR Settlement
              </span>

              <div className="bg-white p-3 border hairline inline-block mx-auto">
                <img
                  src={`https://img.vietqr.io/image/MB-0903112233-compact2.png?amount=${orderSuccess.total_amount}&addInfo=${orderSuccess.order_code}`}
                  alt="VietQR Code"
                  className="w-48 h-48 mx-auto object-contain contrast-105"
                />
              </div>

              <div className="text-xs font-mono space-y-1">
                <div>Amount: <strong>{formatMoney(orderSuccess.total_amount)}</strong></div>
                <div>Reference: <strong>{orderSuccess.order_code}</strong></div>
              </div>

              <p className="text-[10px] font-mono text-[#0a0a0a]/50">
                Auto-reconciled within 3 seconds. Cloudflare D1 inventory reserved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full py-3 bg-[#0a0a0a] text-white text-[11px] tracking-wide-2 uppercase font-medium hover:bg-black/90"
              >
                Close & Continue
              </button>
              <Link
                href="/admin"
                className="w-full py-3 border hairline text-[11px] tracking-wide-1 uppercase font-medium hover:bg-black/5"
              >
                View in Admin
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Size Guide Modal (Bảng Quy Đổi Size Chuẩn 4 Hãng Đồ Hiệu) */}
      {isSizeGuideOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div 
            className="bg-[#0f0f0f] border border-white/20 text-white max-w-2xl w-full my-auto shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-wide uppercase text-sm md:text-base tracking-wider font-semibold text-white">
                    BẢNG CHỌN SIZE CHUẨN ĐỒ HIỆU
                  </h3>
                  <p className="text-[11px] font-mono text-white/50 tracking-wider">
                    Áp dụng cho 4 dòng hàng tại Cái Shop: Cá Sấu, Xi-Kê, Tô-Mì, Lê-Vy
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Tab Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/10 bg-black/20 text-[11px] font-mono uppercase tracking-wider">
              {[
                { id: 'lacoste', label: 'Dòng Cá Sấu', desc: 'Polo Pháp' },
                { id: 'ck', label: 'Dòng Xi-Kê', desc: 'Tee / Denim' },
                { id: 'tommy', label: 'Dòng Tô-Mì', desc: 'Form US' },
                { id: 'levis', label: 'Dòng Lê-Vy', desc: 'Jeans Đinh Tán' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSizeBrand(tab.id as any)}
                  className={`py-3 px-3 text-center transition-all cursor-pointer border-b-2 flex flex-col items-center justify-center ${
                    activeSizeBrand === tab.id
                      ? 'border-white bg-white/10 text-white font-semibold'
                      : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className="font-wide">{tab.label}</span>
                  <span className="text-[9px] opacity-60 normal-case">{tab.desc}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-6 space-y-5">
              {activeSizeBrand === 'lacoste' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Quy chuẩn đo áo Polo & T-Shirt (Hệ số size 2 đến 7 Pháp):</span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-emerald-400">Classic / Slim Fit</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] font-mono text-left border border-white/10">
                      <thead className="bg-white/5 text-white/60 uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Size Pháp</th>
                          <th className="py-2.5 px-3">Tương đương</th>
                          <th className="py-2.5 px-3">Chiều cao</th>
                          <th className="py-2.5 px-3">Cân nặng</th>
                          <th className="py-2.5 px-3">Vòng ngực</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/90">
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Số 2</td>
                          <td className="py-2.5 px-3">XS</td>
                          <td className="py-2.5 px-3">1m60 - 1m67</td>
                          <td className="py-2.5 px-3">50 - 58 kg</td>
                          <td className="py-2.5 px-3">88 - 92 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Số 3</td>
                          <td className="py-2.5 px-3">S</td>
                          <td className="py-2.5 px-3">1m65 - 1m72</td>
                          <td className="py-2.5 px-3">58 - 66 kg</td>
                          <td className="py-2.5 px-3">92 - 96 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Số 4</td>
                          <td className="py-2.5 px-3">M</td>
                          <td className="py-2.5 px-3">1m70 - 1m77</td>
                          <td className="py-2.5 px-3">66 - 74 kg</td>
                          <td className="py-2.5 px-3">96 - 101 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Số 5</td>
                          <td className="py-2.5 px-3">L</td>
                          <td className="py-2.5 px-3">1m74 - 1m82</td>
                          <td className="py-2.5 px-3">74 - 82 kg</td>
                          <td className="py-2.5 px-3">101 - 106 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Số 6</td>
                          <td className="py-2.5 px-3">XL</td>
                          <td className="py-2.5 px-3">1m78 - 1m86</td>
                          <td className="py-2.5 px-3">82 - 90 kg</td>
                          <td className="py-2.5 px-3">106 - 112 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-emerald-400">Số 7</td>
                          <td className="py-2.5 px-3">XXL</td>
                          <td className="py-2.5 px-3">&gt; 1m80</td>
                          <td className="py-2.5 px-3">90 - 100 kg</td>
                          <td className="py-2.5 px-3">112 - 120 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSizeBrand === 'ck' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Quy chuẩn đo dòng Xi-Kê (Form Slim Fit & Tối Giản):</span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-sky-400">Modern Fit</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] font-mono text-left border border-white/10">
                      <thead className="bg-white/5 text-white/60 uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">Chiều cao</th>
                          <th className="py-2.5 px-3">Cân nặng</th>
                          <th className="py-2.5 px-3">Vòng ngực</th>
                          <th className="py-2.5 px-3">Độ dài áo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/90">
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-sky-400">S</td>
                          <td className="py-2.5 px-3">1m63 - 1m70</td>
                          <td className="py-2.5 px-3">55 - 63 kg</td>
                          <td className="py-2.5 px-3">90 - 95 cm</td>
                          <td className="py-2.5 px-3">68 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-sky-400">M</td>
                          <td className="py-2.5 px-3">1m68 - 1m75</td>
                          <td className="py-2.5 px-3">63 - 72 kg</td>
                          <td className="py-2.5 px-3">95 - 100 cm</td>
                          <td className="py-2.5 px-3">70 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-sky-400">L</td>
                          <td className="py-2.5 px-3">1m73 - 1m80</td>
                          <td className="py-2.5 px-3">72 - 80 kg</td>
                          <td className="py-2.5 px-3">101 - 106 cm</td>
                          <td className="py-2.5 px-3">72 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-sky-400">XL</td>
                          <td className="py-2.5 px-3">1m77 - 1m85</td>
                          <td className="py-2.5 px-3">80 - 90 kg</td>
                          <td className="py-2.5 px-3">107 - 114 cm</td>
                          <td className="py-2.5 px-3">74 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSizeBrand === 'tommy' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Quy chuẩn dòng Tô-Mì (Form Mỹ thường rộng hơn 1 cỡ so với form Á):</span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-amber-400">US Relaxed Fit</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] font-mono text-left border border-white/10">
                      <thead className="bg-white/5 text-white/60 uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Size US</th>
                          <th className="py-2.5 px-3">Chiều cao</th>
                          <th className="py-2.5 px-3">Cân nặng khuyên dùng</th>
                          <th className="py-2.5 px-3">Vòng ngực</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/90">
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-amber-400">S (US)</td>
                          <td className="py-2.5 px-3">1m65 - 1m74</td>
                          <td className="py-2.5 px-3">60 - 68 kg</td>
                          <td className="py-2.5 px-3">94 - 98 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-amber-400">M (US)</td>
                          <td className="py-2.5 px-3">1m70 - 1m78</td>
                          <td className="py-2.5 px-3">68 - 77 kg</td>
                          <td className="py-2.5 px-3">98 - 104 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-amber-400">L (US)</td>
                          <td className="py-2.5 px-3">1m75 - 1m84</td>
                          <td className="py-2.5 px-3">77 - 86 kg</td>
                          <td className="py-2.5 px-3">104 - 110 cm</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-amber-400">XL (US)</td>
                          <td className="py-2.5 px-3">1m80 - 1m90</td>
                          <td className="py-2.5 px-3">86 - 96 kg</td>
                          <td className="py-2.5 px-3">110 - 118 cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSizeBrand === 'levis' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Quy chuẩn quần Jeans Lê-Vy (Đo theo vòng bụng / eo tính bằng inch):</span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-rose-400">Original Straight/Slim</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] font-mono text-left border border-white/10">
                      <thead className="bg-white/5 text-white/60 uppercase text-[10px] border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Size Quần</th>
                          <th className="py-2.5 px-3">Vòng bụng (eo)</th>
                          <th className="py-2.5 px-3">Chiều cao gợi ý</th>
                          <th className="py-2.5 px-3">Cân nặng gợi ý</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/90">
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-rose-400">W29</td>
                          <td className="py-2.5 px-3">74 - 76 cm</td>
                          <td className="py-2.5 px-3">1m60 - 1m68</td>
                          <td className="py-2.5 px-3">50 - 57 kg</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-rose-400">W30</td>
                          <td className="py-2.5 px-3">76 - 79 cm</td>
                          <td className="py-2.5 px-3">1m65 - 1m72</td>
                          <td className="py-2.5 px-3">57 - 63 kg</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-rose-400">W31</td>
                          <td className="py-2.5 px-3">79 - 82 cm</td>
                          <td className="py-2.5 px-3">1m68 - 1m75</td>
                          <td className="py-2.5 px-3">63 - 68 kg</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-rose-400">W32</td>
                          <td className="py-2.5 px-3">82 - 85 cm</td>
                          <td className="py-2.5 px-3">1m70 - 1m78</td>
                          <td className="py-2.5 px-3">68 - 75 kg</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-rose-400">W34</td>
                          <td className="py-2.5 px-3">87 - 91 cm</td>
                          <td className="py-2.5 px-3">1m73 - 1m82</td>
                          <td className="py-2.5 px-3">75 - 83 kg</td>
                        </tr>
                        <tr className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-rose-400">W36</td>
                          <td className="py-2.5 px-3">92 - 96 cm</td>
                          <td className="py-2.5 px-3">&gt; 1m75</td>
                          <td className="py-2.5 px-3">83 - 92 kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pro Tip Box */}
              <div className="p-3.5 bg-white/5 border border-white/10 text-[11px] leading-relaxed text-white/70 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kinh nghiệm chọn size thực tế từ Cái Shop:</span>
                </div>
                <p>
                  Nếu số đo cân nặng hoặc chiều cao của bạn nằm ở ranh giới giữa 2 size: 
                  thích mặc ôm gọn người (fitted) hãy chọn <strong>size nhỏ hơn</strong>; 
                  thích thoải mái dễ cử động hãy chọn <strong>size lớn hơn</strong>. 
                  Cái Shop hỗ trợ đổi size miễn phí trong 48 giờ nếu chưa vừa vặn.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-white/40 uppercase">
                Hỗ trợ tư vấn 24/7 qua Zalo / Hotline
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="px-4 py-2 border border-white/20 text-white text-[11px] tracking-wide uppercase hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>
                <a
                  href="#collection"
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="px-5 py-2 bg-white text-[#0a0a0a] text-[11px] tracking-wide uppercase font-semibold hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Xem sản phẩm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-[#0a0a0a] text-white text-xs font-mono uppercase tracking-widest px-4 py-3 shadow-2xl border border-white/20 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono tracking-wide">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
