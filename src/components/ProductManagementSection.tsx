'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Tag,
  Package,
  Trash2,
  Eye,
  Check,
  X,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  DollarSign,
  Boxes,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  Pencil,
  CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { BrandCollection } from '@/app/api/collections/route';
import { BadgeInput } from '@/components/BadgeInput';
import { VndInput } from '@/components/VndInput';
import { CustomSelect } from '@/components/CustomSelect';

interface VariantItem {
  id?: string;
  color: string;
  size: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  floor_price: number;
  physical_qty: number;
  safety_threshold: number;
  available_qty?: number;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  variants: VariantItem[];
}

interface ProductManagementSectionProps {
  onDataChanged?: () => void;
}

const COMMON_CATEGORIES = [
  'T-Shirt',
  'Shirt',
  'Pants',
  'Jeans',
  'Jacket',
  'Polo',
  'Hoodie & Sweater',
  'Shorts',
  'Blazer',
  'Phụ kiện'
];

const PRESET_COLORS = [
  { name: 'Đen', hex: '#18181b', border: false },
  { name: 'Trắng', hex: '#ffffff', border: true },
  { name: 'Xám tiêu', hex: '#64748b', border: false },
  { name: 'Be / Kem', hex: '#e2d4be', border: false },
  { name: 'Xanh Navy', hex: '#1e3a8a', border: false },
  { name: 'Xanh Rêu', hex: '#365314', border: false },
  { name: 'Nâu Tây', hex: '#78350f', border: false }
];

const PRESET_SAMPLE_IMAGES = [
  {
    label: 'Áo Thun Đen',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'
  },
  {
    label: 'Áo Sơ Mi Trắng',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop'
  },
  {
    label: 'Quần Denim',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop'
  },
  {
    label: 'Áo Khoác Bomber',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop'
  },
  {
    label: 'Áo Polo Thể Thao',
    url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop'
  }
];

export const getPrimaryImageUrl = (raw?: string | null): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const arr = JSON.parse(trimmed);
      return arr[0] || '';
    } catch {
      return trimmed;
    }
  }
  if (trimmed.includes(',')) {
    return trimmed.split(',')[0].trim();
  }
  return trimmed;
};

export default function ProductManagementSection({ onDataChanged }: ProductManagementSectionProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom UI Dialog & Confirm state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    isAlertOnly?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { },
  });

  const showAlert = (message: string | React.ReactNode, title = 'THÔNG BÁO HỆ THỐNG', type: 'warning' | 'info' = 'warning') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      isAlertOnly: true,
      confirmText: 'Đã hiểu',
      type,
      onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Áo thun');
  const [customCategory, setCustomCategory] = useState('');
  const [collections, setCollections] = useState<BrandCollection[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('sub-tsh');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '', '', '']);
  const [isActive, setIsActive] = useState(1);

  // Quick Matrix Generator States
  const [selectedColors, setSelectedColors] = useState<string[]>(['Đen', 'Trắng']);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL']);

  // Batch pricing & availability
  const [batchCost, setBatchCost] = useState(120000);
  const [batchPrice, setBatchPrice] = useState(299000);
  const [batchFloor, setBatchFloor] = useState(180000);
  const [batchInStock, setBatchInStock] = useState(true);

  // Generated Variants List
  const [variants, setVariants] = useState<VariantItem[]>([
    {
      color: 'Đen',
      size: 'M',
      sku: 'TSH-DEN-M-01',
      cost_price: 120000,
      selling_price: 299000,
      floor_price: 180000,
      physical_qty: 20,
      safety_threshold: 5
    },
    {
      color: 'Đen',
      size: 'L',
      sku: 'TSH-DEN-L-01',
      cost_price: 120000,
      selling_price: 299000,
      floor_price: 180000,
      physical_qty: 20,
      safety_threshold: 5
    },
    {
      color: 'Trắng',
      size: 'M',
      sku: 'TSH-TRG-M-01',
      cost_price: 120000,
      selling_price: 299000,
      floor_price: 180000,
      physical_qty: 20,
      safety_threshold: 5
    },
    {
      color: 'Trắng',
      size: 'L',
      sku: 'TSH-TRG-L-01',
      cost_price: 120000,
      selling_price: 299000,
      floor_price: 180000,
      physical_qty: 20,
      safety_threshold: 5
    }
  ]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?all=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCollections(data.data);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCollections();
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleImageChange = (index: number, val: string) => {
    setImageUrls(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Auto slug generation from name
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSlug(generatedSlug);
  };

  // Tra cứu mã màu của các màu có sẵn để hiển thị chấm màu trong badge
  const getColorDot = (colorName: string) => {
    const preset = PRESET_COLORS.find(c => c.name.toLowerCase() === colorName.trim().toLowerCase());
    return preset?.hex;
  };

  const handleSubCategorySelect = (subId: string) => {
    setSelectedSubId(subId);
    if (subId === 'CUSTOM') {
      setCategory('CUSTOM');
      return;
    }
    for (const col of collections) {
      for (const grp of col.groups) {
        for (const item of grp.items) {
          if (item.id === subId) {
            setCategory(item.name);
            return;
          }
        }
      }
    }
  };

  // Build / sync variant rows automatically when colors or sizes change
  const buildVariantRows = (
    colors: string[],
    sizes: string[],
    existing: VariantItem[]
  ): VariantItem[] => {
    if (colors.length === 0 || sizes.length === 0) return [];

    const currentCat = category === 'CUSTOM' ? (customCategory || 'PRD') : category;
    const catCode = currentCat.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';
    const cost = Number(batchCost) || 0;
    const price = Number(batchPrice) || 0;
    const floor = Number(batchFloor) || Math.max(cost, Math.round(price * 0.7));
    const stock = batchInStock ? 20 : 0;

    const validColors = new Set(colors.map(c => c.trim().toLowerCase()));
    const validSizes = new Set(sizes.map(s => s.trim().toLowerCase()));

    const kept = existing.filter(v => 
      validColors.has(v.color.trim().toLowerCase()) && 
      validSizes.has(v.size.trim().toLowerCase())
    );

    const result: VariantItem[] = [...kept];

    colors.forEach(col => {
      sizes.forEach(sz => {
        const trimmedCol = col.trim();
        const trimmedSz = sz.trim();
        if (!trimmedCol || !trimmedSz) return;

        const exists = result.some(
          v => v.color.trim().toLowerCase() === trimmedCol.toLowerCase() &&
               v.size.trim().toLowerCase() === trimmedSz.toLowerCase()
        );

        if (!exists) {
          const colCode = trimmedCol
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 3)
            .toUpperCase() || 'COL';
          const szCode = trimmedSz.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'M';
          const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
          const sku = `${catCode}-${colCode}-${szCode}-${rand}`;

          result.push({
            color: trimmedCol,
            size: trimmedSz,
            sku,
            cost_price: cost,
            selling_price: price,
            floor_price: floor,
            physical_qty: stock,
            safety_threshold: 5
          });
        }
      });
    });

    return result;
  };

  const handleColorsChange = (newColors: string[]) => {
    setSelectedColors(newColors);
    const updated = buildVariantRows(newColors, selectedSizes, variants);
    setVariants(updated);
  };

  const handleSizesChange = (newSizes: string[]) => {
    setSelectedSizes(newSizes);
    const updated = buildVariantRows(selectedColors, newSizes, variants);
    setVariants(updated);
  };

  // Generate Matrix
  const handleGenerateMatrix = () => {
    if (selectedColors.length === 0 || selectedSizes.length === 0) {
      showAlert('Vui lòng chọn ít nhất 1 màu sắc và 1 kích cỡ để hệ thống tạo danh sách biến thể tự động.', 'CHƯA CHỌN MÀU & SIZE', 'warning');
      return;
    }

    const currentCat = category === 'CUSTOM' ? (customCategory || 'PRD') : category;
    const catCode = currentCat.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';

    const newVariants: VariantItem[] = [];
    const cost = Number(batchCost) || 0;
    const price = Number(batchPrice) || 0;
    const floor = Number(batchFloor) || Math.max(cost, Math.round(price * 0.7));
    const stock = batchInStock ? 20 : 0;

    selectedColors.forEach(col => {
      selectedSizes.forEach(sz => {
        const colCode = col
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 3)
          .toUpperCase() || 'COL';
        const szCode = sz.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'M';
        const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
        const sku = `${catCode}-${colCode}-${szCode}-${rand}`;

        newVariants.push({
          color: col,
          size: sz,
          sku,
          cost_price: cost,
          selling_price: price,
          floor_price: floor,
          physical_qty: stock,
          safety_threshold: 5
        });
      });
    });

    setVariants(newVariants);
    showToast(`Đã tạo thành công ${newVariants.length} biến thể (${selectedColors.length} màu x ${selectedSizes.length} size)!`);
  };

  // Apply batch price & availability to existing variants
  const handleApplyBatchToExisting = () => {
    const cost = Number(batchCost) || 0;
    const price = Number(batchPrice) || 0;
    const floor = Number(batchFloor) || Math.max(cost, Math.round(price * 0.7));
    const stock = batchInStock ? 20 : 0;

    const updated = variants.map(v => ({
      ...v,
      cost_price: cost,
      selling_price: price,
      floor_price: floor,
      physical_qty: stock
    }));

    setVariants(updated);
    showToast('Đã áp dụng giá và trạng thái còn/hết đồng loạt cho tất cả các biến thể!');
  };

  // Add individual variant row
  const handleAddSingleVariant = () => {
    const catCode = (category === 'CUSTOM' ? customCategory : category).substring(0, 3).toUpperCase() || 'PRD';
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    setVariants([
      ...variants,
      {
        color: 'Màu mới',
        size: 'L',
        sku: `${catCode}-NEW-L-${rand}`,
        cost_price: Number(batchCost) || 100000,
        selling_price: Number(batchPrice) || 250000,
        floor_price: Number(batchFloor) || 150000,
        physical_qty: batchInStock ? 20 : 0,
        safety_threshold: 5
      }
    ]);
  };

  // Quick toggle variant in-stock status right from table
  const handleQuickToggleVariantStock = async (productId: string, variantId: string, currentQty: number) => {
    const newQty = currentQty > 0 ? 0 : 20;
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, physical_qty: newQty })
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p;
          return {
            ...p,
            variants: p.variants.map(v => v.id === variantId ? { ...v, physical_qty: newQty } : v)
          };
        }));
        showToast(newQty > 0 ? 'Đã chuyển trạng thái: CÒN HÀNG' : 'Đã chuyển trạng thái: TẠM HẾT HÀNG');
        if (onDataChanged) onDataChanged();
      } else {
        showAlert(data.message || 'Lỗi cập nhật trạng thái', 'LỖI', 'warning');
      }
    } catch (err: any) {
      showAlert(err.message || 'Lỗi mạng khi cập nhật', 'LỖI', 'warning');
    }
  };

  // Remove variant row
  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      showAlert('Sản phẩm bắt buộc phải có tối thiểu 1 biến thể SKU để quản lý giá bán và tồn kho.', 'KHÔNG THỂ XÓA BIẾN THỂ', 'warning');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Update specific variant field
  const handleVariantChange = (index: number, field: keyof VariantItem, value: any) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setVariants(updated);
  };

  // Reset form
  const handleResetForm = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSelectedSubId('sub-tsh');
    setCategory('Áo thun');
    setCustomCategory('');
    setDescription('');
    setImageUrls(['', '', '', '', '']);
    setIsActive(1);
    setSelectedColors(['Đen']);
    setSelectedSizes(['M', 'L']);
    setVariants([
      {
        color: 'Đen',
        size: 'M',
        sku: 'TSH-DEN-M-01',
        cost_price: 120000,
        selling_price: 299000,
        floor_price: 180000,
        physical_qty: 20,
        safety_threshold: 5
      },
      {
        color: 'Đen',
        size: 'L',
        sku: 'TSH-DEN-L-01',
        cost_price: 120000,
        selling_price: 299000,
        floor_price: 180000,
        physical_qty: 20,
        safety_threshold: 5
      }
    ]);
    setFormError(null);
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    handleResetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    // Auto-detect which subcategory product belongs to
    let foundSubId = '';
    for (const col of collections) {
      for (const grp of col.groups) {
        for (const item of grp.items) {
          if (item.product_ids && item.product_ids.includes(p.id)) {
            foundSubId = item.id;
            break;
          }
        }
        if (foundSubId) break;
      }
      if (foundSubId) break;
    }

    if (foundSubId) {
      setSelectedSubId(foundSubId);
      setCategory(p.category);
      setCustomCategory('');
    } else {
      // Try to find matching subcategory by name
      let matchByName = '';
      for (const col of collections) {
        for (const grp of col.groups) {
          for (const item of grp.items) {
            if (item.name.toLowerCase() === p.category.toLowerCase() ||
                p.category.toLowerCase().includes(item.name.toLowerCase())) {
              matchByName = item.id;
              break;
            }
          }
          if (matchByName) break;
        }
        if (matchByName) break;
      }
      if (matchByName) {
        setSelectedSubId(matchByName);
        setCategory(p.category);
        setCustomCategory('');
      } else {
        setSelectedSubId('CUSTOM');
        setCategory('CUSTOM');
        setCustomCategory(p.category);
      }
    }
    setDescription(p.description || '');
    let loadedImgs: string[] = ['', '', '', '', ''];
    if (p.image_url) {
      const raw = p.image_url.trim();
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            loadedImgs = [parsed[0] || '', parsed[1] || '', parsed[2] || '', parsed[3] || '', parsed[4] || ''];
          }
        } catch {
          loadedImgs[0] = raw;
        }
      } else if (raw.includes(',')) {
        const parts = raw.split(',').map(s => s.trim());
        loadedImgs = [parts[0] || '', parts[1] || '', parts[2] || '', parts[3] || '', parts[4] || ''];
      } else {
        loadedImgs[0] = raw;
      }
    }
    setImageUrls(loadedImgs);
    setIsActive(p.is_active);
    setVariants((p.variants || []).map(v => ({ ...v })));
    setSelectedColors(Array.from(new Set(p.variants?.map(v => v.color) || [])));
    setSelectedSizes(Array.from(new Set(p.variants?.map(v => v.size) || [])));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit product creation or update
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vui lòng nhập tên sản phẩm.');
      return;
    }

    if (variants.length === 0) {
      setFormError('Sản phẩm phải có ít nhất 1 biến thể.');
      return;
    }

    // Validate prices
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.color.trim() || !v.size.trim()) {
        setFormError(`Biến thể dòng ${i + 1} chưa có màu hoặc size.`);
        return;
      }
      if (v.selling_price < v.floor_price) {
        setFormError(`Cảnh báo: Dòng ${i + 1} (${v.color} - Size ${v.size}) có giá bán (${formatMoney(v.selling_price)}) thấp hơn giá sàn an toàn (${formatMoney(v.floor_price)}). Vui lòng điều chỉnh.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        category: category === 'CUSTOM' ? (customCategory.trim() || 'Khác') : category,
        description: description.trim(),
        image_url: (() => {
          const valid = imageUrls.map(u => u.trim()).filter(Boolean);
          if (valid.length === 0) return '';
          if (valid.length === 1) return valid[0];
          return JSON.stringify(valid);
        })(),
        is_active: isActive,
        variants: variants.map(v => ({
          ...(v.id ? { id: v.id } : {}),
          color: v.color.trim(),
          size: v.size.trim(),
          sku: v.sku.trim(),
          cost_price: Number(v.cost_price) || 0,
          selling_price: Number(v.selling_price) || 0,
          floor_price: Number(v.floor_price) || 0,
          physical_qty: Number(v.physical_qty) || 0,
          safety_threshold: Number(v.safety_threshold) || 5
        }))
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || (editingProduct ? 'Lỗi khi cập nhật sản phẩm' : 'Lỗi khi thêm sản phẩm'));
        return;
      }

      // Automatically sync product into chosen collection & subcategory
      const targetProductId = (data.product && data.product.id) || (editingProduct && editingProduct.id);
      if (targetProductId && selectedSubId && selectedSubId !== 'CUSTOM') {
        try {
          const updatedCollections = collections.map(col => ({
            ...col,
            groups: col.groups.map(grp => ({
              ...grp,
              items: grp.items.map(sub => {
                const currentIds = sub.product_ids || [];
                if (sub.id === selectedSubId) {
                  return {
                    ...sub,
                    product_ids: currentIds.includes(targetProductId)
                      ? currentIds
                      : [...currentIds, targetProductId]
                  };
                } else {
                  return {
                    ...sub,
                    product_ids: currentIds.filter(id => id !== targetProductId)
                  };
                }
              })
            }))
          }));

          await fetch('/api/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCollections)
          });
          setCollections(updatedCollections);
        } catch (colErr) {
          console.error('Lỗi tự động đồng bộ vào bộ sưu tập:', colErr);
        }
      }

      showToast(
        editingProduct
          ? `Đã cập nhật sản phẩm "${name}" và tự động đồng bộ vào Bộ sưu tập!`
          : `Đã thêm sản phẩm "${name}" và tự động đưa vào Bộ sưu tập thành công!`
      );
      setIsModalOpen(false);
      setEditingProduct(null);
      handleResetForm();
      fetchProducts();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err: any) {
      setFormError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleProductStatus = async (productId: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchProducts();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Delete product
  const handleDeleteProduct = (product: ProductItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA SẢN PHẨM & TỒN KHO',
      message: (
        <div className="space-y-2">
          <p>
            Bạn có chắc muốn xóa hoàn toàn sản phẩm <strong className="text-slate-900 font-semibold">&ldquo;{product.name}&rdquo;</strong> cùng tất cả <strong className="text-slate-900 font-semibold">{product.variants.length} biến thể SKU</strong>?
          </p>
          <p className="text-xs text-red-600 font-mono">
            Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi cơ sở dữ liệu và không thể hoàn tác.
          </p>
        </div>
      ),
      confirmText: 'Xác nhận xóa',
      cancelText: 'Hủy bỏ',
      type: 'danger',
      isAlertOnly: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/products/${product.id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            // Also remove product from collections
            const updatedCollections = collections.map(col => ({
              ...col,
              groups: col.groups.map(grp => ({
                ...grp,
                items: grp.items.map(sub => ({
                  ...sub,
                  product_ids: (sub.product_ids || []).filter(id => id !== product.id)
                }))
              }))
            }));
            fetch('/api/collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedCollections)
            }).catch(console.error);
            setCollections(updatedCollections);

            showToast(data.message);
            fetchProducts();
            if (onDataChanged) onDataChanged();
          } else {
            showAlert(data.message || 'Không thể xóa sản phẩm này', 'LỖI XÓA SẢN PHẨM', 'warning');
          }
        } catch (err) {
          console.error('Error deleting product:', err);
          showAlert('Lỗi kết nối khi xóa sản phẩm', 'LỖI HỆ THỐNG', 'warning');
        }
      }
    });
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some(v => v.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Calculate summary stats
  const totalVariantsCount = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
  const inStockVariantsCount = products.reduce((acc, p) => {
    return acc + (p.variants?.filter(v => (v.physical_qty || 0) > 0).length || 0);
  }, 0);
  const categoriesList = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.replace(/^[✓✔]\s*/, '')}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Tổng sản phẩm</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{products.length}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Biến thể (SKU)</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalVariantsCount}</div>
          </div>
          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Kho CTV sẵn hàng</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {inStockVariantsCount} / {totalVariantsCount} <span className="text-xs font-normal text-slate-500">SKU</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Đang hiển thị bán</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {products.filter(p => p.is_active === 1).length} / {products.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
            <Tag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Category Filter + Add Product Button */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU, danh mục..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <CustomSelect
            value={selectedCategory}
            onChange={val => setSelectedCategory(val)}
            options={[
              { value: 'all', label: `Tất cả danh mục (${products.length})` },
              ...categoriesList.map(cat => ({
                value: cat,
                label: cat,
                count: products.filter(p => p.category === cat).length
              }))
            ]}
            variant="admin"
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold tracking-tight shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm mới</span>
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Ảnh</th>
                <th className="py-3 px-4">Sản phẩm & Danh mục</th>
                <th className="py-3 px-4">Màu sắc có sẵn</th>
                <th className="py-3 px-4">Size có sẵn</th>
                <th className="py-3 px-4">Khoảng giá bán</th>
                <th className="py-3 px-4">Tình trạng kho CTV</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const uniqueColors = Array.from(new Set(p.variants?.map(v => v.color) || []));
                  const uniqueSizes = Array.from(new Set(p.variants?.map(v => v.size) || []));
                  const prices = p.variants?.map(v => v.selling_price) || [];
                  const minPrice = prices.length ? Math.min(...prices) : 0;
                  const maxPrice = prices.length ? Math.max(...prices) : 0;
                  const totalStock = p.variants?.reduce((sum, v) => sum + (v.physical_qty || 0), 0) || 0;
                  const isExpanded = expandedProductId === p.id;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                        {/* Thumbnail */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                            {p.image_url ? (
                              <img
                                src={getPrimaryImageUrl(p.image_url)}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e: any) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </td>

                        {/* Name & Category */}
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                              {p.category}
                            </span>
                            <span className="font-mono text-slate-400">/{p.slug}</span>
                          </div>
                        </td>

                        {/* Colors */}
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {uniqueColors.map(c => (
                              <span
                                key={c}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Sizes */}
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {uniqueSizes.map(s => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Price Range */}
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                          {minPrice === maxPrice ? (
                            <span>{formatMoney(minPrice)}</span>
                          ) : (
                            <span>
                              {formatMoney(minPrice)} ~ {formatMoney(maxPrice)}
                            </span>
                          )}
                        </td>

                        {/* CTV Stock Status */}
                        <td className="py-2.5 px-4">
                          {(() => {
                            const totalVar = p.variants?.length || 0;
                            const inStockVar = p.variants?.filter(v => (v.physical_qty || 0) > 0).length || 0;
                            if (totalVar === 0 || inStockVar === 0) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Tạm hết hàng
                                </span>
                              );
                            }
                            if (inStockVar === totalVar) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Còn hàng
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Còn {inStockVar}/{totalVar} size
                              </span>
                            );
                          })()}
                        </td>

                        {/* Active toggle */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleProductStatus(p.id, p.is_active)}
                            className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${p.is_active === 1
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                          >
                            {p.is_active === 1 ? 'Đang bán' : 'Tạm ẩn'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${isExpanded ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              title={isExpanded ? 'Ẩn chi tiết biến thể' : 'Xem biến thể SKU'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Chỉnh sửa sản phẩm & biến thể"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                              title="Xem trên cửa hàng"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Variants Drawer / Sub-Table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="py-3 px-6">
                            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Danh sách {p.variants.length} biến thể (Màu x Size x Giá x Kho)</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">ID: {p.id}</div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px]">
                                    <tr>
                                      <th className="py-1.5 px-3">Mã SKU</th>
                                      <th className="py-1.5 px-3">Màu sắc</th>
                                      <th className="py-1.5 px-3">Kích cỡ</th>
                                      <th className="py-1.5 px-3">Giá vốn (COGS)</th>
                                      <th className="py-1.5 px-3">Giá sàn an toàn</th>
                                      <th className="py-1.5 px-3 font-semibold text-slate-700">Giá bán niêm yết</th>
                                      <th className="py-1.5 px-3">Tình trạng hàng</th>
                                      <th className="py-1.5 px-3 text-right">Lợi nhuận gộp/chiếc</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                                    {p.variants.map(v => {
                                      const profit = v.selling_price - v.cost_price;
                                      const margin = v.selling_price > 0 ? Math.round((profit / v.selling_price) * 100) : 0;
                                      return (
                                        <tr key={v.id || v.sku} className="hover:bg-slate-50/50">
                                          <td className="py-1.5 px-3 font-medium text-slate-900">{v.sku}</td>
                                          <td className="py-1.5 px-3 font-sans text-slate-700">{v.color}</td>
                                          <td className="py-1.5 px-3">
                                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-900 font-bold">
                                              {v.size}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-3 text-slate-500">{formatMoney(v.cost_price)}</td>
                                          <td className="py-1.5 px-3 text-slate-400">{formatMoney(v.floor_price)}</td>
                                          <td className="py-1.5 px-3 font-semibold text-slate-900">{formatMoney(v.selling_price)}</td>
                                          <td className="py-1.5 px-3">
                                            <button
                                              type="button"
                                              onClick={() => v.id && handleQuickToggleVariantStock(p.id, v.id, v.physical_qty)}
                                              title="Bấm để chuyển nhanh Còn hàng / Tạm hết"
                                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all inline-flex items-center gap-1 cursor-pointer ${v.physical_qty > 0
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                }`}
                                            >
                                              <span className={`w-1.5 h-1.5 rounded-full ${v.physical_qty > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                              <span className="whitespace-nowrap">{v.physical_qty > 0 ? 'Còn hàng' : 'Tạm hết'}</span>
                                            </button>
                                          </td>
                                          <td className="py-1.5 px-3 text-right text-emerald-600 font-medium">
                                            +{formatMoney(profit)} ({margin}%)
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD PRODUCT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl lg:max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg 'bg-slate-900' text-white flex items-center justify-center`}>
                  {editingProduct ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingProduct ? `Chỉnh sửa: ${editingProduct.name}` : 'Thêm sản phẩm thời trang mới'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingProduct ? `Mã sản phẩm: ${editingProduct.id} • ${variants.length} biến thể SKU` : 'Thiết lập chi tiết áo/quần, kích cỡ, màu sắc, giá và tồn kho'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. THÔNG TIN CƠ BẢN */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Thông tin cơ bản
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-slate-600 font-medium cursor-pointer">Trạng thái bán:</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(isActive === 1 ? 0 : 1)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${isActive === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {isActive === 1 ? '✓ Đang bán' : 'Tạm ẩn'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tên sản phẩm */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên sản phẩm thời trang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Áo Sơ Mi Lụa Dài Tay Form Rộng"
                      value={name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      required
                    />
                  </div>

                  {/* Bộ sưu tập & Danh mục */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Bộ sưu tập & Danh mục <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Tự động vào Bộ sưu tập
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <CustomSelect
                        value={selectedSubId}
                        onChange={val => handleSubCategorySelect(val)}
                        placeholder="-- Chọn Bộ sưu tập & Phân loại --"
                        options={[
                          { value: '', label: '-- Chọn Bộ sưu tập & Phân loại --' },
                          ...collections.flatMap(brand =>
                            brand.groups.flatMap(group =>
                              group.items.map(sub => ({
                                value: sub.id,
                                label: `${group.name} › ${sub.name}`,
                                group: brand.brand
                              }))
                            )
                          ),
                          { value: 'CUSTOM', label: '+ Tùy chỉnh danh mục khác (ngoài bộ sưu tập)', group: 'Khác' }
                        ]}
                        className="flex-1"
                        variant="admin"
                        size="md"
                      />
                      {selectedSubId === 'CUSTOM' && (
                        <input
                          type="text"
                          placeholder="Nhập danh mục..."
                          value={customCategory}
                          onChange={e => {
                            setCustomCategory(e.target.value);
                            setCategory(e.target.value);
                          }}
                          className="w-40 px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                          required
                        />
                      )}
                    </div>
                    {/* Breadcrumb hiển thị phân tầng đã chọn */}
                    {selectedSubId && selectedSubId !== 'CUSTOM' && (() => {
                      for (const b of collections) {
                        for (const g of b.groups) {
                          for (const it of g.items) {
                            if (it.id === selectedSubId) {
                              return (
                                <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5 font-sans bg-slate-50 border border-slate-100 rounded px-2 py-1">
                                  <span className="text-slate-400 font-medium">Phân tầng:</span>
                                  <span className="font-bold text-slate-900">{b.brand}</span>
                                  <span className="text-slate-400">›</span>
                                  <span className="text-slate-600">{g.name}</span>
                                  <span className="text-slate-400">›</span>
                                  <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                                    {it.name}
                                  </span>
                                </div>
                              );
                            }
                          }
                        }
                      }
                      return null;
                    })()}
                  </div>

                  {/* Slug đường dẫn */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Đường dẫn URL (Slug) <span className="text-slate-400 font-normal">(tự sinh)</span>
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 text-slate-400 text-xs rounded-l-md font-mono">
                        /products/
                      </span>
                      <input
                        type="text"
                        placeholder="ao-so-mi-lua-dai-tay"
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-r-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Bộ 5 hình ảnh sản phẩm */}
                  <div className="md:col-span-2 space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                        <span>Bộ 5 hình ảnh chi tiết sản phẩm (Góc chụp lookbook)</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {imageUrls.filter(Boolean).length} / 5 ảnh đã nhập
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      {[
                        { tag: 'Ảnh 01', label: 'Toàn cảnh (Bìa)' },
                        { tag: 'Ảnh 02', label: 'Cận chất liệu' },
                        { tag: 'Ảnh 03', label: 'Góc nghiêng / Form' },
                        { tag: 'Ảnh 04', label: 'Chi tiết đường may' },
                        { tag: 'Ảnh 05', label: 'Mặt sau / Phối đồ' }
                      ].map((slot, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-2 bg-slate-50/70 space-y-1.5 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono text-slate-700 uppercase">
                              {slot.tag}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.2 bg-slate-900 text-white rounded text-[8px] font-bold uppercase tracking-wider">
                                Ảnh bìa
                              </span>
                            )}
                          </div>

                          {/* Preview container */}
                          <div className="aspect-[4/5] bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center relative group">
                            {imageUrls[idx] ? (
                              <>
                                <img
                                  src={imageUrls[idx]}
                                  alt={slot.label}
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => { e.target.style.display = 'none'; }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleImageChange(idx, '')}
                                  className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                  title="Xóa link ảnh này"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-2 text-slate-300 flex flex-col items-center">
                                <ImageIcon className="w-6 h-6 stroke-1 mb-1 text-slate-300" />
                                <span className="text-[9px] font-mono text-slate-400 leading-tight">
                                  {slot.label}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* URL input */}
                          <input
                            type="url"
                            placeholder="Dán link ảnh..."
                            value={imageUrls[idx]}
                            onChange={e => handleImageChange(idx, e.target.value)}
                            className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                {/* Mô tả sản phẩm */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả sản phẩm</label>
                  <textarea
                    rows={2}
                    placeholder="Chất liệu vải cao cấp, đứng form, thoáng mát, thích hợp mặc hàng ngày..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  />
                </div>
              </section>

              {/* 2. CẤU HÌNH BIẾN THỂ (SIZE, MÀU, GIÁ) */}
              <section className="space-y-4 pt-2">
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Cấu hình Kích cỡ (Size), Màu sắc & Giá bán
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Hiện có: <strong className="text-slate-900">{variants.length}</strong> biến thể
                  </span>
                </div>

                {/* SMART MATRIX GENERATOR TOOLBOX */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-slate-700" />
                    <span>Bộ tạo ma trận biến thể tự động (Màu sắc x Kích cỡ)</span>
                  </div>

                  {/* Colors Badge Input */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                      1. Nhập các màu sắc áp dụng:
                    </div>
                    <BadgeInput
                      value={selectedColors}
                      onChange={handleColorsChange}
                      placeholder="Gõ tên màu rồi nhấn Enter (VD: Đen)..."
                      getDotColor={getColorDot}
                      chipClassName="bg-slate-900 text-white shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Nhấn Enter (hoặc dấu phẩy) để tạo badge màu, nhấn Backspace khi ô trống để xóa badge cuối cùng.
                    </p>
                  </div>

                  {/* Sizes Badge Input */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                      2. Nhập các kích cỡ (Size):
                    </div>
                    <BadgeInput
                      value={selectedSizes}
                      onChange={handleSizesChange}
                      placeholder="Gõ size rồi nhấn Enter (VD: M, XL, 30)..."
                      chipRounded="md"
                      chipClassName="bg-slate-900 text-white font-mono font-bold"
                      inputClassName="font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mỗi lần nhấn Enter sẽ tạo 1 badge size. Có thể nhập size chữ (S, M, L, XL) hoặc size số (29, 30...).
                    </p>
                  </div>

                  {/* Batch Defaults (Price & Stock) */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <div className="text-[11px] font-semibold text-slate-600 mb-2">
                      3. Mức giá & Tồn kho áp dụng đồng loạt:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Giá vốn (COGS)</span>
                        <VndInput
                          value={batchCost}
                          onChange={setBatchCost}
                          className="w-full px-2.5 py-1.5"
                          inputClassName="font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Giá bán niêm yết</span>
                        <VndInput
                          value={batchPrice}
                          onChange={setBatchPrice}
                          className="w-full px-2.5 py-1.5"
                          inputClassName="font-mono font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Giá sàn an toàn</span>
                        <VndInput
                          value={batchFloor}
                          onChange={setBatchFloor}
                          className="w-full px-2.5 py-1.5"
                          inputClassName="font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Trạng thái kho ban đầu</span>
                        <button
                          type="button"
                          onClick={() => setBatchInStock(!batchInStock)}
                          className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${batchInStock
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                            }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${batchInStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{batchInStock ? 'Còn hàng' : 'Tạm hết'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Generator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Tự động tạo dòng: <strong>{variants.length} biến thể</strong> ({selectedColors.length} màu x {selectedSizes.length} size)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyBatchToExisting}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Áp dụng mức giá vốn/giá bán ở trên cho toàn bộ danh sách biến thể"
                      >
                        Áp dụng giá trên cho tất cả dòng
                      </button>
                    </div>
                  </div>
                </div>

                {/* TABLE OF VARIANTS */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800">
                      Bảng chi tiết từng biến thể ({variants.length} SKU)
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSingleVariant}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm dòng biến thể lẻ</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Màu sắc</th>
                          <th className="py-2 px-3 w-16">Size</th>
                          <th className="py-2 px-3">Mã SKU</th>
                          <th className="py-2 px-3">Giá vốn (đ)</th>
                          <th className="py-2 px-3">Giá sàn (đ)</th>
                          <th className="py-2 px-3">Giá niêm yết (đ)</th>
                          <th className="py-2 px-3 w-36 text-center">Tình trạng</th>
                          <th className="py-2 px-3 w-10 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {variants.map((v, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            {/* Color */}
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={v.color}
                                onChange={e => handleVariantChange(idx, 'color', e.target.value)}
                                className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-medium"
                              />
                            </td>

                            {/* Size */}
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={v.size}
                                onChange={e => handleVariantChange(idx, 'size', e.target.value)}
                                className="w-14 px-2 py-1 text-xs border border-slate-200 rounded font-mono font-bold text-center"
                              />
                            </td>

                            {/* SKU */}
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={e => handleVariantChange(idx, 'sku', e.target.value)}
                                className="w-32 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700"
                              />
                            </td>

                            {/* Cost Price */}
                            <td className="py-1.5 px-3">
                              <VndInput
                                value={v.cost_price}
                                onChange={val => handleVariantChange(idx, 'cost_price', val)}
                                className="w-28 px-2 py-1"
                                inputClassName="font-mono"
                              />
                            </td>

                            {/* Floor Price */}
                            <td className="py-1.5 px-3">
                              <VndInput
                                value={v.floor_price}
                                onChange={val => handleVariantChange(idx, 'floor_price', val)}
                                className="w-28 px-2 py-1"
                                inputClassName="font-mono text-slate-600"
                              />
                            </td>

                            {/* Selling Price */}
                            <td className="py-1.5 px-3">
                              <VndInput
                                value={v.selling_price}
                                onChange={val => handleVariantChange(idx, 'selling_price', val)}
                                className="w-28 px-2 py-1"
                                inputClassName="font-mono font-bold text-slate-900"
                              />
                            </td>

                            {/* In Stock / Out of Stock Toggle */}
                            <td className="py-1.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleVariantChange(idx, 'physical_qty', v.physical_qty > 0 ? 0 : 20)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${v.physical_qty > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                  }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${v.physical_qty > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{v.physical_qty > 0 ? 'Còn hàng' : 'Tạm hết'}</span>
                              </button>
                            </td>

                            {/* Remove button */}
                            <td className="py-1.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {editingProduct
                  ? 'Các thay đổi sẽ được cập nhật đồng bộ ngay lập tức vào cơ sở dữ liệu và hiển thị trên cửa hàng.'
                  : 'Sản phẩm sẽ tự động xuất hiện trên danh mục và trang chủ ngay sau khi tạo.'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={handleSubmitProduct}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0a0a0a] hover:bg-black disabled:opacity-60 rounded-md transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{editingProduct ? 'Đang lưu thay đổi...' : 'Đang lưu vào D1...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{editingProduct ? 'Lưu thay đổi sản phẩm' : 'Hoàn tất & Thêm sản phẩm'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation / Alert Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        isAlertOnly={confirmModal.isAlertOnly}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal(prev => ({ ...prev, isOpen: false })))}
      />
    </div>
  );
}
