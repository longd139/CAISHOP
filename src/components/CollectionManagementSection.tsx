'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Save,
  ChevronRight,
  ChevronDown,
  Package,
  Layers,
  Tag,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BrandCollection, CategoryGroup, SubCategory } from '@/app/api/collections/route';
import { ConfirmModal } from '@/components/ConfirmModal';
import { getPrimaryImageUrl } from '@/lib/productImages';

interface ProductItem {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
}

export default function CollectionManagementSection() {
  const [collections, setCollections] = useState<BrandCollection[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected item in the hierarchy
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  // Expand/collapse states for tree
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Quick Add / Edit states
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroupForBrandId, setAddingGroupForBrandId] = useState<string | null>(null);

  const [newSubName, setNewSubName] = useState('');
  const [addingSubForGroupId, setAddingSubForGroupId] = useState<string | null>(null);

  // Search filter for product assignment
  const [productSearch, setProductSearch] = useState('');

  // Custom UI Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  // Fetch collections and products
  const fetchData = async () => {
    setLoading(true);
    try {
      const [colRes, prodRes] = await Promise.all([
        fetch('/api/collections'),
        fetch('/api/products')
      ]);

      const colData = await colRes.json();
      const prodData = await prodRes.json();

      if (colData.success && colData.data) {
        setCollections(colData.data);
        if (colData.data.length > 0) {
          const firstBrand = colData.data[0];
          setSelectedBrandId(firstBrand.id);
          setExpandedBrands({ [firstBrand.id]: true });

          if (firstBrand.groups && firstBrand.groups.length > 0) {
            const firstGroup = firstBrand.groups[0];
            setSelectedGroupId(firstGroup.id);
            setExpandedGroups({ [firstGroup.id]: true });

            if (firstGroup.items && firstGroup.items.length > 0) {
              setSelectedSubId(firstGroup.items[0].id);
            }
          }
        }
      }

      if (prodData.success && prodData.data) {
        setProducts(prodData.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu bộ sưu tập:', err);
      showToast('Lỗi tải dữ liệu bộ sưu tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save collections to server
  const handleSaveCollections = async (dataToSave = collections) => {
    setSaving(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      if (data.success) {
        setCollections(dataToSave);
        showToast('✓ Đã đồng bộ cấu trúc Bộ sưu tập lên hệ thống & trang sản phẩm.');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu bộ sưu tập.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle brand expansion
  const toggleBrand = (brandId: string) => {
    setExpandedBrands(prev => ({ ...prev, [brandId]: !prev[brandId] }));
    setSelectedBrandId(brandId);
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    setSelectedGroupId(groupId);
  };

  // 1. Add Brand
  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    const newBrand: BrandCollection = {
      id: `col-${Date.now()}`,
      brand: newBrandName.trim(),
      slug: toSlug(newBrandName.trim()),
      description: newBrandDesc.trim() || `Bộ sưu tập chính hãng ${newBrandName.trim()}`,
      groups: [
        {
          id: `grp-${Date.now()}-1`,
          name: 'Áo',
          slug: 'ao',
          items: [
            { id: `sub-${Date.now()}-1`, name: 'Áo sơ mi', slug: 'ao-so-mi', product_ids: [] },
            { id: `sub-${Date.now()}-2`, name: 'Áo thun', slug: 'ao-thun', product_ids: [] }
          ]
        }
      ]
    };
    const updated = [...collections, newBrand];
    setCollections(updated);
    setSelectedBrandId(newBrand.id);
    setSelectedGroupId(newBrand.groups[0].id);
    setSelectedSubId(newBrand.groups[0].items[0].id);
    setExpandedBrands(prev => ({ ...prev, [newBrand.id]: true }));
    setNewBrandName('');
    setNewBrandDesc('');
    setIsAddingBrand(false);
    handleSaveCollections(updated);
  };

  // Delete Brand
  const executeDeleteBrand = (brandId: string) => {
    const updated = collections.filter(c => c.id !== brandId);
    setCollections(updated);
    if (selectedBrandId === brandId && updated.length > 0) {
      setSelectedBrandId(updated[0].id);
    }
    handleSaveCollections(updated);
    showToast('✓ Đã xóa thương hiệu.');
  };

  const handleDeleteBrand = (brandId: string, brandName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA THƯƠNG HIỆU / BỘ SƯU TẬP',
      message: `Bạn có chắc chắn muốn xóa thương hiệu "${brandName}"? Toàn bộ các nhóm danh mục và liên kết sản phẩm bên trong sẽ bị gỡ bỏ.`,
      confirmText: 'Xóa thương hiệu',
      type: 'danger',
      onConfirm: () => {
        executeDeleteBrand(brandId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 2. Add Group (e.g. Áo, Quần)
  const handleAddGroup = (brandId: string) => {
    if (!newGroupName.trim()) return;
    const updated = collections.map(col => {
      if (col.id === brandId) {
        const newGroup: CategoryGroup = {
          id: `grp-${Date.now()}`,
          name: newGroupName.trim(),
          slug: toSlug(newGroupName.trim()),
          items: [
            { id: `sub-${Date.now()}`, name: `Mục con ${newGroupName.trim()}`, slug: toSlug(`muc-con-${newGroupName.trim()}`), product_ids: [] }
          ]
        };
        return {
          ...col,
          groups: [...col.groups, newGroup]
        };
      }
      return col;
    });
    setCollections(updated);
    setNewGroupName('');
    setAddingGroupForBrandId(null);
    handleSaveCollections(updated);
  };

  // Delete Group
  const executeDeleteGroup = (brandId: string, groupId: string) => {
    const updated = collections.map(col => {
      if (col.id === brandId) {
        return {
          ...col,
          groups: col.groups.filter(g => g.id !== groupId)
        };
      }
      return col;
    });
    setCollections(updated);
    handleSaveCollections(updated);
    showToast('✓ Đã xóa nhóm danh mục.');
  };

  const handleDeleteGroup = (brandId: string, groupId: string, groupName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA NHÓM DANH MỤC',
      message: `Bạn có chắc chắn muốn xóa nhóm danh mục "${groupName}"?`,
      confirmText: 'Xóa nhóm',
      type: 'danger',
      onConfirm: () => {
        executeDeleteGroup(brandId, groupId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 3. Add Subcategory (e.g. Áo sơ mi, Áo thun)
  const handleAddSubcategory = (brandId: string, groupId: string) => {
    if (!newSubName.trim()) return;
    const updated = collections.map(col => {
      if (col.id === brandId) {
        return {
          ...col,
          groups: col.groups.map(grp => {
            if (grp.id === groupId) {
              const newSub: SubCategory = {
                id: `sub-${Date.now()}`,
                name: newSubName.trim(),
                slug: toSlug(newSubName.trim()),
                product_ids: []
              };
              return {
                ...grp,
                items: [...grp.items, newSub]
              };
            }
            return grp;
          })
        };
      }
      return col;
    });
    setCollections(updated);
    setNewSubName('');
    setAddingSubForGroupId(null);
    handleSaveCollections(updated);
  };

  // Delete Subcategory
  const executeDeleteSubcategory = (brandId: string, groupId: string, subId: string) => {
    const updated = collections.map(col => {
      if (col.id === brandId) {
        return {
          ...col,
          groups: col.groups.map(grp => {
            if (grp.id === groupId) {
              return {
                ...grp,
                items: grp.items.filter(item => item.id !== subId)
              };
            }
            return grp;
          })
        };
      }
      return col;
    });
    setCollections(updated);
    if (selectedSubId === subId) {
      setSelectedSubId('');
    }
    handleSaveCollections(updated);
    showToast('✓ Đã xóa danh mục con.');
  };

  const handleDeleteSubcategory = (brandId: string, groupId: string, subId: string, subName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA MỤC CON',
      message: `Bạn có chắc chắn muốn xóa danh mục con "${subName}" khỏi nhóm?`,
      confirmText: 'Xóa mục con',
      type: 'danger',
      onConfirm: () => {
        executeDeleteSubcategory(brandId, groupId, subId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 4. Toggle Product in Subcategory
  const handleToggleProductInSub = (productId: string) => {
    if (!selectedBrandId || !selectedGroupId || !selectedSubId) return;

    const updated = collections.map(col => {
      if (col.id === selectedBrandId) {
        return {
          ...col,
          groups: col.groups.map(grp => {
            if (grp.id === selectedGroupId) {
              return {
                ...grp,
                items: grp.items.map(sub => {
                  if (sub.id === selectedSubId) {
                    const currentIds = sub.product_ids || [];
                    const exists = currentIds.includes(productId);
                    return {
                      ...sub,
                      product_ids: exists
                        ? currentIds.filter(id => id !== productId)
                        : [...currentIds, productId]
                    };
                  }
                  return sub;
                })
              };
            }
            return grp;
          })
        };
      }
      return col;
    });

    setCollections(updated);
  };

  // Find active items for detail panel
  const activeBrand = collections.find(c => c.id === selectedBrandId);
  const activeGroup = activeBrand?.groups.find(g => g.id === selectedGroupId);
  const activeSub = activeGroup?.items.find(s => s.id === selectedSubId);

  // Products assigned to activeSub
  const assignedProductIds = activeSub?.product_ids || [];

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl border border-slate-700 font-mono text-xs animate-in fade-in slide-in-from-top-3">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-800">
              <FolderTree className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 font-wide uppercase tracking-wide">
              Quản Lý Bộ Sưu Tập & Phân Cấp Sản Phẩm
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Cấu trúc cây: <strong className="text-slate-800">Brand / Thương hiệu</strong> → <strong className="text-slate-800">Nhóm chính (Áo, Quần...)</strong> → <strong className="text-slate-800">Danh mục con (Áo sơ mi, Áo thun...)</strong>. Đồng bộ trực tiếp sang Sidebar trang Sản phẩm.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          <button
            onClick={() => handleSaveCollections()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold uppercase text-white bg-slate-900 hover:bg-black rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tree & Right Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Interactive Tree View */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-mono font-semibold uppercase text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              Cấu trúc cây phân cấp ({collections.length} Thương hiệu)
            </span>
            <button
              onClick={() => setIsAddingBrand(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-white bg-slate-900 hover:bg-black rounded-md cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Brand</span>
            </button>
          </div>

          {/* Quick Add Brand Box */}
          {isAddingBrand && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 animate-in fade-in">
              <div className="text-xs font-mono font-bold text-slate-800">Thêm thương hiệu / bộ sưu tập mới:</div>
              <input
                type="text"
                placeholder="Tên thương hiệu (VD: Gucci, Zara, Uniqlo...)"
                value={newBrandName}
                onChange={e => setNewBrandName(e.target.value)}
                className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="Mô tả ngắn thương hiệu..."
                value={newBrandDesc}
                onChange={e => setNewBrandDesc(e.target.value)}
                className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-black"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsAddingBrand(false)}
                  className="px-2.5 py-1 text-xs font-mono text-slate-600 hover:text-slate-900"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddBrand}
                  className="px-3 py-1 text-xs font-mono font-semibold bg-slate-900 text-white rounded hover:bg-black"
                >
                  Xác nhận thêm
                </button>
              </div>
            </div>
          )}

          {/* Tree Structure */}
          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {collections.map(col => {
              const isExpanded = !!expandedBrands[col.id];
              const isBrandSelected = selectedBrandId === col.id;
              const totalBrandProducts = col.groups.reduce(
                (sum, g) => sum + g.items.reduce((s2, it) => s2 + (it.product_ids?.length || 0), 0),
                0
              );

              return (
                <div key={col.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">

                  {/* Brand Level 1 Header */}
                  <div
                    onClick={() => toggleBrand(col.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isBrandSelected ? 'bg-slate-100/80 font-bold' : 'hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-800" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                      <span className="text-xs uppercase font-wide tracking-wider text-slate-900 truncate">
                        {col.brand}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {totalBrandProducts} SP
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setAddingGroupForBrandId(col.id)}
                        title="Thêm nhóm (Áo, Quần...) vào thương hiệu này"
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(col.id, col.brand)}
                        title="Xóa thương hiệu này"
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add Group inline */}
                  {addingGroupForBrandId === col.id && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tên nhóm (VD: Áo, Quần, Giày...)"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="flex-1 text-xs font-mono px-2.5 py-1 bg-white border border-slate-300 rounded"
                      />
                      <button
                        onClick={() => handleAddGroup(col.id)}
                        className="px-2.5 py-1 text-xs font-mono bg-slate-900 text-white rounded hover:bg-black"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setAddingGroupForBrandId(null)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {/* Groups Level 2 & Subcategories Level 3 */}
                  {isExpanded && (
                    <div className="pl-6 pr-3 py-2 border-t border-slate-100 bg-slate-50/50 space-y-2">
                      {col.groups.map(grp => {
                        const isGrpExpanded = expandedGroups[grp.id] !== false;
                        const isGrpSelected = selectedGroupId === grp.id;
                        const grpProductCount = grp.items.reduce((sum, it) => sum + (it.product_ids?.length || 0), 0);

                        return (
                          <div key={grp.id} className="border border-slate-200/80 rounded bg-white">

                            {/* Group Level 2 Header (Áo, Quần) */}
                            <div
                              onClick={() => {
                                toggleGroup(grp.id);
                                setSelectedBrandId(col.id);
                              }}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${isGrpSelected ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">
                                  {isGrpExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-700" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </span>
                                <span className="text-xs font-mono font-medium text-slate-800">
                                  {grp.name}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  ({grpProductCount} SP)
                                </span>
                              </div>

                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setAddingSubForGroupId(grp.id)}
                                  title="Thêm mục con (Áo sơ mi, Áo thun...) vào nhóm này"
                                  className="p-1 text-slate-500 hover:text-slate-900 rounded"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(col.id, grp.id, grp.name)}
                                  title="Xóa nhóm này"
                                  className="p-1 text-red-400 hover:text-red-600 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Add Subcategory inline */}
                            {addingSubForGroupId === grp.id && (
                              <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Tên mục con (VD: Áo sơ mi, Áo thun...)"
                                  value={newSubName}
                                  onChange={e => setNewSubName(e.target.value)}
                                  className="flex-1 text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded"
                                />
                                <button
                                  onClick={() => handleAddSubcategory(col.id, grp.id)}
                                  className="px-2 py-1 text-xs font-mono bg-slate-900 text-white rounded hover:bg-black"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setAddingSubForGroupId(null)}
                                  className="text-xs text-slate-500 hover:text-slate-800"
                                >
                                  Hủy
                                </button>
                              </div>
                            )}

                            {/* Subcategories Level 3 */}
                            {isGrpExpanded && (
                              <div className="pl-6 pr-2 py-1.5 border-t border-slate-100 space-y-1">
                                {grp.items.map(sub => {
                                  const isSubSelected = selectedSubId === sub.id && selectedGroupId === grp.id && selectedBrandId === col.id;
                                  const count = sub.product_ids?.length || 0;

                                  return (
                                    <div
                                      key={sub.id}
                                      onClick={() => {
                                        setSelectedBrandId(col.id);
                                        setSelectedGroupId(grp.id);
                                        setSelectedSubId(sub.id);
                                      }}
                                      className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors text-xs font-mono ${isSubSelected
                                          ? 'bg-slate-900 text-white font-medium'
                                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <Tag className="w-3 h-3 opacity-60" />
                                        <span className="truncate">{sub.name}</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 rounded ${isSubSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                          {count} SP
                                        </span>
                                        <button
                                          onClick={() => handleDeleteSubcategory(col.id, grp.id, sub.id, sub.name)}
                                          title="Xóa danh mục con này"
                                          className={`p-0.5 rounded hover:text-red-500 ${isSubSelected ? 'text-slate-400 hover:text-red-300' : 'text-slate-400'
                                            }`}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
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

        {/* Right Column: Product Assignment & Preview */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">

          {/* Active Category Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                DANH MỤC ĐANG CHỌN PHÂN BỔ SẢN PHẨM:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold font-wide uppercase text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                  {activeBrand?.brand || 'Chưa chọn'}
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                  {activeGroup?.name || 'Nhóm'}
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-slate-900 underline underline-offset-4">
                  {activeSub?.name || 'Danh mục con'}
                </span>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Đã gán: <strong className="text-slate-900 font-bold">{assignedProductIds.length}</strong> sản phẩm
            </span>
          </div>

          {/* Search box for products */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm sản phẩm để gán vào mục này (tên hoặc danh mục gốc)..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Product Cards List for quick check/uncheck */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-slate-400">
                Không tìm thấy sản phẩm nào phù hợp.
              </div>
            ) : (
              filteredProducts.map(prod => {
                const isAssigned = assignedProductIds.includes(prod.id);

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleProductInSub(prod.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isAssigned
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 bg-slate-100 rounded overflow-hidden border border-slate-200 shrink-0">
                        {prod.image_url ? (
                          <img src={getPrimaryImageUrl(prod.image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {prod.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Mã ID: {prod.id} • Danh mục gốc: <span className="text-slate-700 font-medium">{prod.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAssigned ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 text-white text-[10px] font-mono font-bold uppercase">
                          <Check className="w-3.5 h-3.5" />
                          Đã thêm
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded border border-slate-300 text-slate-600 text-[10px] font-mono hover:border-slate-900 hover:text-slate-900">
                          + Thêm vào mục này
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Hướng dẫn đồng bộ:
            </div>
            <p>
              1. Bấm vào bất kỳ danh mục con nào ở cột bên trái (VD: <strong>Atelier → Áo → Áo sơ mi</strong>).
            </p>
            <p>
              2. Bấm chọn/bỏ chọn sản phẩm ở cột bên phải để gán vào danh mục tương ứng.
            </p>
            <p>
              3. Bấm <strong>Lưu Thay Đổi</strong> để cập nhật ngay lập tức sang thanh điều hướng bên trang sản phẩm.
            </p>
          </div>

        </div>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900 text-white text-xs font-mono px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
