'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Layers,
  Shirt,
  Footprints,
  Watch,
  Scissors,
} from 'lucide-react';
import { BrandCollection, defaultCollections } from '@/app/api/collections/route';

// Quick categories definitions for top-level instantaneous access
export interface QuickCategoryItem {
  slug: string;
  label: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const QUICK_CATEGORIES: QuickCategoryItem[] = [
  {
    slug: 'ao',
    label: 'Áo',
    subtext: 'Thun • Sơ mi • Polo',
    icon: Shirt,
  },
  {
    slug: 'quan',
    label: 'Quần',
    subtext: 'Jean • Tây • Shorts',
    icon: Scissors,
  },
  {
    slug: 'ao-khoac',
    label: 'Áo khoác',
    subtext: 'Bomber • Blazer • Jacket',
    icon: Layers,
  },
  {
    slug: 'giay',
    label: 'Giày',
    subtext: 'Sneaker • Da • Loafer',
    icon: Footprints,
  },
  {
    slug: 'phu-kien',
    label: 'Phụ kiện',
    subtext: 'Nón • Ví • Thắt lưng',
    icon: Watch,
  },
];

// Helper to count distinct products in collections matching quick category
export function getCategoryProductCount(catSlug: string, collections: BrandCollection[]): number {
  const pids = new Set<string>();
  const cat = catSlug.toLowerCase();
  collections.forEach((col) => {
    col.groups.forEach((grp) => {
      const gSlug = grp.slug.toLowerCase();
      const gName = grp.name.toLowerCase();
      const isMatch =
        (cat === 'ao' && (gSlug === 'ao' || gName === 'áo')) ||
        (cat === 'quan' && (gSlug === 'quan' || gName === 'quần')) ||
        (cat === 'ao-khoac' && (gSlug.includes('khoac') || gName.includes('khoác'))) ||
        (cat === 'giay' && (gSlug.includes('giay') || gName.includes('giày'))) ||
        (cat === 'phu-kien' && (gSlug.includes('phu-kien') || gName.includes('phụ kiện')));

      if (isMatch) {
        grp.items.forEach((it) => {
          it.product_ids?.forEach((pid) => pids.add(pid));
        });
      }
    });
  });
  return pids.size;
}

// Module-level in-memory cache to guarantee zero-latency instantaneous display on hover
let memoryCachedCollections: BrandCollection[] | null = null;

interface ProductMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  initialCollections?: BrandCollection[];
}

export function ProductMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
  initialCollections,
}: ProductMegaMenuProps) {
  const [collections, setCollections] = useState<BrandCollection[]>(
    initialCollections && initialCollections.length > 0
      ? initialCollections
      : memoryCachedCollections || defaultCollections
  );

  useEffect(() => {
    if (initialCollections && initialCollections.length > 0) {
      setCollections(initialCollections);
      memoryCachedCollections = initialCollections;
      return;
    }

    if (memoryCachedCollections) {
      setCollections(memoryCachedCollections);
      return;
    }

    let isMounted = true;
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCollections(data.data);
          memoryCachedCollections = data.data;
        }
      })
      .catch((err) => {
        console.error('Failed to load collections for mega-menu:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [initialCollections]);

  if (!isOpen) return null;

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    onClose();
    if (typeof window !== 'undefined' && window.location.pathname === '/products') {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new CustomEvent('catalog-navigate', { detail: href }));
    }
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-full left-0 pt-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 normal-case tracking-normal"
      style={{ minWidth: '880px', width: 'max-content', maxWidth: 'min(1120px, calc(100vw - 32px))' }}
    >
      <div className="bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] p-5 text-[#0a0a0a] ring-1 ring-black/5">
        
        {/* ================= 1. CHỌN NHANH THEO DANH MỤC (ÁO, QUẦN, ÁO KHOÁC, GIÀY, PHỤ KIỆN) ================= */}
        <div className="pb-4 border-b border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const count = getCategoryProductCount(cat.slug, collections);
              const href = `/products?category=${cat.slug}`;

              return (
                <Link
                  key={cat.slug}
                  href={href}
                  onClick={(e) => handleNavigate(e, href)}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-900 border border-slate-200/70 hover:border-slate-900 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
                  title={`Xem tất cả sản phẩm ${cat.label}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-white group-hover:bg-white/10 flex items-center justify-center text-slate-700 group-hover:text-white border border-slate-200/60 group-hover:border-white/20 transition-colors shrink-0">
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[13px] font-bold text-slate-900 group-hover:text-white transition-colors truncate">
                        {cat.label}
                      </span>
                      {count > 0 && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 group-hover:bg-white/20 text-slate-700 group-hover:text-white transition-colors shrink-0">
                          {count} SP
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 group-hover:text-white/70 transition-colors truncate mt-0.5">
                      {cat.subtext}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ================= 2. KHÁM PHÁ THEO TỪNG THƯƠNG HIỆU CỤ THỂ ================= */}
        <div className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {collections.map((col) => {
              const totalBrandProducts = col.groups.reduce(
                (sum, g) => sum + g.items.reduce((s2, it) => s2 + (it.product_ids?.length || 0), 0),
                0
              );

              return (
                <div
                  key={col.id}
                  className="flex flex-col bg-slate-50/50 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-100/90 transition-colors"
                >
                {/* Brand Header */}
                <Link
                  href={`/products?brand=${encodeURIComponent(col.id)}`}
                  onClick={(e) => handleNavigate(e, `/products?brand=${encodeURIComponent(col.id)}`)}
                  className="group/b flex items-start justify-between gap-1 pb-2 border-b border-slate-200/70 hover:opacity-85 transition-opacity"
                  title={`Xem toàn bộ sản phẩm ${col.brand}`}
                >
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-slate-900 group-hover/b:text-black block truncate">
                      {col.brand}
                    </span>
                    {col.description && (
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {col.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 shrink-0 font-medium mt-0.5">
                    {totalBrandProducts} SP
                  </span>
                </Link>

                {/* Groups & Items Hierarchy */}
                <div className="flex-1 space-y-3.5 mt-3">
                  {col.groups.map((grp) => {
                    const grpProductCount = grp.items.reduce(
                      (sum, it) => sum + (it.product_ids?.length || 0),
                      0
                    );

                    return (
                      <div key={grp.id} className="space-y-1.5">
                        {/* Group Header (e.g. Áo, Quần, Áo khoác) */}
                        <Link
                          href={`/products?brand=${encodeURIComponent(col.id)}&group=${encodeURIComponent(grp.id)}`}
                          onClick={(e) =>
                            handleNavigate(
                              e,
                              `/products?brand=${encodeURIComponent(col.id)}&group=${encodeURIComponent(grp.id)}`
                            )
                          }
                          className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors py-0.5"
                          title={`Xem nhóm ${grp.name} (${col.brand})`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{grp.name}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            ({grpProductCount})
                          </span>
                        </Link>

                        {/* Subcategories (e.g. Áo thun, Áo sơ mi, Áo Polo...) */}
                        <ul className="pl-3.5 space-y-1 border-l-2 border-slate-200/80">
                          {grp.items.map((it) => {
                            const count = it.product_ids?.length || 0;
                            const itemHref = `/products?brand=${encodeURIComponent(
                              col.id
                            )}&group=${encodeURIComponent(grp.id)}&sub=${encodeURIComponent(it.id)}`;

                            return (
                              <li key={it.id}>
                                <Link
                                  href={itemHref}
                                  onClick={(e) => handleNavigate(e, itemHref)}
                                  className="group/it flex items-center justify-between text-[11px] text-slate-600 hover:text-black hover:font-medium transition-colors py-0.5"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="w-1 h-1 rounded-full bg-slate-300 group-hover/it:bg-black transition-colors shrink-0" />
                                    <span className="truncate">{it.name}</span>
                                  </span>
                                  {count > 0 && (
                                    <span className="text-[10px] font-mono text-slate-400 group-hover/it:text-slate-700 ml-1">
                                      {count}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Brand Direct Link Footer */}
                <div className="pt-2 mt-3 border-t border-slate-200/60">
                  <Link
                    href={`/products?brand=${encodeURIComponent(col.id)}`}
                    onClick={(e) => handleNavigate(e, `/products?brand=${encodeURIComponent(col.id)}`)}
                    className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-600 hover:text-black font-semibold transition-colors"
                  >
                    <span>Khám phá {col.brand}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
          </div>
        </div>


      </div>
    </div>
  );
}

// Mobile Accordion Tree for Hamburger Drawer
interface MobileCollectionsAccordionProps {
  collections?: BrandCollection[];
  onNavigate: () => void;
}

export function MobileCollectionsAccordion({
  collections: initialColls,
  onNavigate,
}: MobileCollectionsAccordionProps) {
  const [collections, setCollections] = useState<BrandCollection[]>(
    initialColls && initialColls.length > 0
      ? initialColls
      : memoryCachedCollections || defaultCollections
  );
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialColls && initialColls.length > 0) {
      setCollections(initialColls);
      memoryCachedCollections = initialColls;
      return;
    }
    if (memoryCachedCollections) {
      setCollections(memoryCachedCollections);
      return;
    }
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCollections(data.data);
          memoryCachedCollections = data.data;
        }
      })
      .catch(() => {});
  }, [initialColls]);

  const toggleBrand = (id: string) => {
    setExpandedBrands((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    onNavigate();
    if (typeof window !== 'undefined' && window.location.pathname === '/products') {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new CustomEvent('catalog-navigate', { detail: href }));
    }
  };

  return (
    <div className="mt-2 pl-3 space-y-2 border-l border-slate-200">
      <Link
        href="/products"
        onClick={(e) => handleLinkClick(e, '/products')}
        className="flex items-center justify-between text-xs font-mono font-semibold text-slate-800 py-1"
      >
        <span>⚡ Xem tất cả sản phẩm</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      {/* Quick Category Grid for Mobile */}
      <div className="pt-1 pb-2 border-b border-slate-100">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
          Chọn nhanh danh mục:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const href = `/products?category=${cat.slug}`;
            return (
              <Link
                key={cat.slug}
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200/70 text-xs font-medium text-slate-800 transition-colors"
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block pt-1">
        Theo từng thương hiệu:
      </span>

      {collections.map((col) => {
        const isBrandOpen = !!expandedBrands[col.id];
        return (
          <div key={col.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-slate-900 py-1">
              <Link
                href={`/products?brand=${encodeURIComponent(col.id)}`}
                onClick={(e) => handleLinkClick(e, `/products?brand=${encodeURIComponent(col.id)}`)}
                className="hover:underline flex-1 truncate"
              >
                {col.brand}
              </Link>
              <button
                type="button"
                onClick={() => toggleBrand(col.id)}
                className="p-1 text-slate-500 hover:text-black cursor-pointer"
                aria-label={`Mở rộng ${col.brand}`}
              >
                {isBrandOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {isBrandOpen && (
              <div className="pl-3 space-y-1.5 border-l border-slate-200/80">
                {col.groups.map((grp) => {
                  const isGrpOpen = expandedGroups[grp.id] !== false;
                  return (
                    <div key={grp.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600 py-0.5">
                        <Link
                          href={`/products?brand=${encodeURIComponent(col.id)}&group=${encodeURIComponent(grp.id)}`}
                          onClick={(e) =>
                            handleLinkClick(
                              e,
                              `/products?brand=${encodeURIComponent(col.id)}&group=${encodeURIComponent(grp.id)}`
                            )
                          }
                          className="hover:underline"
                        >
                          {grp.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleGroup(grp.id)}
                          className="p-0.5 text-slate-400 hover:text-black cursor-pointer"
                        >
                          {isGrpOpen ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {isGrpOpen && (
                        <div className="pl-2.5 space-y-1 border-l border-slate-100">
                          {grp.items.map((it) => (
                            <Link
                              key={it.id}
                              href={`/products?brand=${encodeURIComponent(col.id)}&group=${encodeURIComponent(
                                grp.id
                              )}&sub=${encodeURIComponent(it.id)}`}
                              onClick={(e) =>
                                handleLinkClick(
                                  e,
                                  `/products?brand=${encodeURIComponent(col.id)}&group=${encodeURIComponent(
                                    grp.id
                                  )}&sub=${encodeURIComponent(it.id)}`
                                )
                              }
                              className="block text-[11px] text-slate-500 hover:text-black py-0.5 truncate"
                            >
                              • {it.name}
                            </Link>
                          ))}
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
  );
}
