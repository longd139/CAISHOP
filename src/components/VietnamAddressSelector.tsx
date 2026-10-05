'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Check, Loader2, X, ChevronDown, Info, Search, Truck, AlertCircle } from 'lucide-react';

export interface DivisionItem {
  code: number;
  name: string;
  division_type?: string;
}

export interface AddressMeta {
  isHcmInnerCity: boolean;
  mode: 'before' | 'after';
  province?: DivisionItem | null;
  provinceName?: string;
  district?: DivisionItem | null;
  districtName?: string;
  ward?: DivisionItem | null;
  wardName?: string;
  streetAddress?: string;
  isManualEdit?: boolean;
}

export interface VietnamAddressSelectorProps {
  value: string;
  onChange: (fullAddress: string) => void;
  onAddressMetaChange?: (meta: AddressMeta) => void;
  initialMeta?: AddressMeta | null;
  required?: boolean;
  showErrors?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

function matchesVietnamese(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  const nTarget = normalizeVietnamese(target);
  const nQuery = normalizeVietnamese(query);
  if (nTarget.includes(nQuery)) return true;
  if ((nQuery === 'hcm' || nQuery === 'tp hcm' || nQuery === 'tphcm') && nTarget.includes('ho chi minh')) return true;
  if ((nQuery === 'hn' || nQuery === 'tp hn' || nQuery === 'tphn') && nTarget.includes('ha noi')) return true;
  return false;
}

interface SearchableComboboxProps {
  label: string;
  placeholder: string;
  items: DivisionItem[];
  selectedItem: DivisionItem | null;
  onSelect: (item: DivisionItem | null) => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  loading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

function SearchableCombobox({
  label,
  placeholder,
  items,
  selectedItem,
  onSelect,
  disabled = false,
  disabledPlaceholder = '-- Vui lòng chọn trước --',
  loading = false,
  hasError = false,
  errorMessage,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedItem?.name || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display text when selectedItem changes from outside
  useEffect(() => {
    setQuery(selectedItem?.name || '');
  }, [selectedItem]);

  // Click outside to close and restore selection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(selectedItem?.name || '');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedItem]);

  const filteredItems = items.filter((item) => matchesVietnamese(item.name, query));

  const handleInputFocus = () => {
    if (disabled || loading) return;
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleSelectItem = (item: DivisionItem) => {
    onSelect(item);
    setQuery(item.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[11px] font-medium text-slate-600 block">{label}</label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled || loading}
          value={disabled ? disabledPlaceholder : query}
          placeholder={loading ? 'Đang tải...' : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleInputFocus}
          onClick={() => {
            if (!disabled && !loading && !isOpen) {
              setIsOpen(true);
            }
          }}
          className={`w-full h-10 px-3 pr-8 text-xs rounded-lg border focus:outline-none transition-all ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : hasError
              ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-slate-900'
              : isOpen
              ? 'border-slate-900 ring-1 ring-slate-900 bg-white text-slate-900 shadow-xs'
              : 'border-slate-200 hover:border-slate-400 bg-white text-slate-800 cursor-text'
          }`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : query && selectedItem && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-700 cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isOpen ? 'rotate-180 text-slate-700' : ''
              }`}
            />
          )}
        </div>
      </div>

      {hasError && errorMessage && (
        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isCurrent = selectedItem?.code === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span>{item.name}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-slate-400 text-center italic">
              Không tìm thấy &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VietnamAddressSelector({
  value,
  onChange,
  onAddressMetaChange,
  initialMeta,
  required = true,
  showErrors = false,
  onValidationChange,
}: VietnamAddressSelectorProps) {
  // Mode: 'before' (Trước sáp nhập - 63 tỉnh/thành, quận/huyện, phường/xã)
  //       'after' (Sau sáp nhập - 34 tỉnh/thành, phường/xã)
  const [mode, setMode] = useState<'before' | 'after'>('before');

  // Lists
  const [provinces, setProvinces] = useState<DivisionItem[]>([]);
  const [districts, setDistricts] = useState<DivisionItem[]>([]);
  const [wards, setWards] = useState<DivisionItem[]>([]);

  // Selected values
  const [selectedProvince, setSelectedProvince] = useState<DivisionItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DivisionItem | null>(null);
  const [selectedWard, setSelectedWard] = useState<DivisionItem | null>(null);
  const [streetAddress, setStreetAddress] = useState<string>('');

  // Mode manual edit toggle
  const [isManualEdit, setIsManualEdit] = useState<boolean>(false);

  // Check overall address validity
  const isAddressValid = useMemo(() => {
    if (isManualEdit) {
      return value.trim().length >= 5;
    }
    const hasProvince = Boolean(selectedProvince);
    const hasDistrict = mode === 'before' ? Boolean(selectedDistrict) : true;
    const hasWard = Boolean(selectedWard);
    const hasStreet = streetAddress.trim().length > 0;
    // If the address was pre-filled from saved order and has full content
    if (!hasProvince && value.trim().length >= 5) {
      return true;
    }
    return hasProvince && hasDistrict && hasWard && hasStreet;
  }, [isManualEdit, value, selectedProvince, mode, selectedDistrict, selectedWard, streetAddress]);

  // Notify parent of validity changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isAddressValid);
    }
  }, [isAddressValid, onValidationChange]);

  // Check if address is inner-city HCMC (Trước sáp nhập)
  // TP.HCM code: 79. Inner-city districts: division_type !== 'huyện'
  const isHcmInnerCity = useMemo(() => {
    if (isManualEdit) {
      const norm = normalizeVietnamese(value || streetAddress);
      const isHcm = norm.includes('ho chi minh') || norm.includes('hcm') || norm.includes('sai gon');
      if (!isHcm) return false;
      const suburban = ['cu chi', 'hoc mon', 'binh chanh', 'nha be', 'can gio'];
      return !suburban.some((s) => norm.includes(s));
    }

    return (
      mode === 'before' &&
      selectedProvince?.code === 79 &&
      Boolean(selectedDistrict && selectedDistrict.division_type !== 'huyện')
    );
  }, [mode, selectedProvince, selectedDistrict, isManualEdit, value, streetAddress]);

  // Notify parent of address metadata change
  useEffect(() => {
    if (onAddressMetaChange) {
      onAddressMetaChange({
        isHcmInnerCity,
        mode,
        province: selectedProvince,
        provinceName: selectedProvince?.name,
        district: selectedDistrict,
        districtName: selectedDistrict?.name,
        ward: selectedWard,
        wardName: selectedWard?.name,
        streetAddress,
        isManualEdit,
      });
    }
  }, [isHcmInnerCity, mode, selectedProvince, selectedDistrict, selectedWard, streetAddress, isManualEdit, onAddressMetaChange]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingWards, setLoadingWards] = useState<boolean>(false);

  // In-memory cache
  const cacheRef = useRef<{
    v1Provinces?: DivisionItem[];
    v2Provinces?: DivisionItem[];
    v1Districts: Record<number, DivisionItem[]>;
    v1Wards: Record<number, DivisionItem[]>;
    v2Wards: Record<number, DivisionItem[]>;
  }>({
    v1Districts: {},
    v1Wards: {},
    v2Wards: {},
  });

  // Fetch provinces when mode changes
  useEffect(() => {
    let cancelled = false;

    // Reset dependent selections when switching mode
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    const fetchProvinces = async () => {
      const isV1 = mode === 'before';
      const cached = isV1 ? cacheRef.current.v1Provinces : cacheRef.current.v2Provinces;
      if (cached && cached.length > 0) {
        setProvinces(cached);
        return;
      }

      setLoadingProvinces(true);
      try {
        const endpoint = isV1
          ? 'https://provinces.open-api.vn/api/v1/p/'
          : 'https://provinces.open-api.vn/api/v2/p/';
        const res = await fetch(endpoint);
        const data: any = await res.json();
        if (!cancelled && Array.isArray(data)) {
          const list = data.map((item: any) => ({
            code: item.code,
            name: item.name,
            division_type: item.division_type,
          }));
          if (isV1) {
            cacheRef.current.v1Provinces = list;
          } else {
            cacheRef.current.v2Provinces = list;
          }
          setProvinces(list);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách Tỉnh/Thành phố:', err);
      } finally {
        if (!cancelled) setLoadingProvinces(false);
      }
    };

    fetchProvinces();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Handle province change
  // Fetch districts (for v1) or wards (for v2) for a given province
  const fetchDistrictsForProvince = async (provinceCode: number, currentMode: 'before' | 'after') => {
    if (currentMode === 'before') {
      if (cacheRef.current.v1Districts[provinceCode]) {
        setDistricts(cacheRef.current.v1Districts[provinceCode]);
        return;
      }
      setLoadingDistricts(true);
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/v1/p/${provinceCode}?depth=2`);
        const data: any = await res.json();
        if (data && Array.isArray(data.districts)) {
          const list = data.districts.map((d: any) => ({
            code: d.code,
            name: d.name,
            division_type: d.division_type,
          }));
          cacheRef.current.v1Districts[provinceCode] = list;
          setDistricts(list);
        }
      } catch (err) {
        console.error('Lỗi khi tải Quận/Huyện:', err);
      } finally {
        setLoadingDistricts(false);
      }
    } else {
      if (cacheRef.current.v2Wards[provinceCode]) {
        setWards(cacheRef.current.v2Wards[provinceCode]);
        return;
      }
      setLoadingWards(true);
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`);
        const data: any = await res.json();
        if (data && Array.isArray(data.wards)) {
          const list = data.wards.map((w: any) => ({
            code: w.code,
            name: w.name,
            division_type: w.division_type,
          }));
          cacheRef.current.v2Wards[provinceCode] = list;
          setWards(list);
        }
      } catch (err) {
        console.error('Lỗi khi tải Phường/Xã (Sau sáp nhập):', err);
      } finally {
        setLoadingWards(false);
      }
    }
  };

  // Fetch wards for a given district in v1
  const fetchWardsForDistrict = async (districtCode: number) => {
    if (cacheRef.current.v1Wards[districtCode]) {
      setWards(cacheRef.current.v1Wards[districtCode]);
      return;
    }
    setLoadingWards(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/v1/d/${districtCode}?depth=2`);
      const data: any = await res.json();
      if (data && Array.isArray(data.wards)) {
        const list = data.wards.map((w: any) => ({
          code: w.code,
          name: w.name,
          division_type: w.division_type,
        }));
        cacheRef.current.v1Wards[districtCode] = list;
        setWards(list);
      }
    } catch (err) {
      console.error('Lỗi khi tải Phường/Xã:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Auto-restore initialMeta when provided from previous successful order
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (initialMeta && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      const targetMode = initialMeta.mode || 'before';
      setMode(targetMode);
      if (initialMeta.province) {
        setSelectedProvince(initialMeta.province);
        fetchDistrictsForProvince(initialMeta.province.code, targetMode);
      }
      if (initialMeta.district) {
        setSelectedDistrict(initialMeta.district);
        fetchWardsForDistrict(initialMeta.district.code);
      } else if (targetMode === 'after' && initialMeta.province) {
        fetchDistrictsForProvince(initialMeta.province.code, targetMode);
      }
      if (initialMeta.ward) {
        setSelectedWard(initialMeta.ward);
      }
      if (initialMeta.streetAddress) {
        setStreetAddress(initialMeta.streetAddress);
      }
      if (initialMeta.isManualEdit) {
        setIsManualEdit(true);
      }
    }
  }, [initialMeta]);

  // Handle province change
  const handleProvinceSelect = async (province: DivisionItem | null) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    if (!province) return;
    await fetchDistrictsForProvince(province.code, mode);
  };

  // Handle district change (mode === 'before')
  const handleDistrictSelect = async (district: DivisionItem | null) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);

    if (!district) return;
    await fetchWardsForDistrict(district.code);
  };

  // Handle ward change
  const handleWardSelect = (ward: DivisionItem | null) => {
    setSelectedWard(ward);
  };

  // Automatically sync full address whenever parts change (unless user is in manual edit mode)
  useEffect(() => {
    if (isManualEdit) return;

    const parts: string[] = [];
    if (streetAddress.trim()) parts.push(streetAddress.trim());
    if (selectedWard) parts.push(selectedWard.name);
    if (mode === 'before' && selectedDistrict) parts.push(selectedDistrict.name);
    if (selectedProvince) parts.push(selectedProvince.name);

    if (parts.length > 0) {
      const compiled = parts.join(', ');
      onChange(compiled);
    }
  }, [mode, streetAddress, selectedWard, selectedDistrict, selectedProvince, isManualEdit]);

  return (
    <div className="space-y-3">
      {/* Header and Mode Selection */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span>Địa chỉ nhận hàng</span>
          {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Switch Mode: Trước sáp nhập / Sau sáp nhập */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('before')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'before'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trước sáp nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('after')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
              mode === 'after'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sau sáp nhập
          </button>
        </div>
      </div>

      {/* Manual Free-form Edit Mode */}
      {isManualEdit ? (
        <div className="space-y-1.5">
          <textarea
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={`w-full p-3.5 text-xs rounded-lg border focus:outline-none transition-all leading-relaxed ${
              showErrors && (!value.trim() || value.trim().length < 5)
                ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-slate-900'
                : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white'
            }`}
            required={required}
          />
          {showErrors && (!value.trim() || value.trim().length < 5) && (
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Vui lòng nhập địa chỉ nhận hàng chi tiết (tối thiểu 5 ký tự)</span>
            </p>
          )}
        </div>
      ) : (
        /* Structured Searchable Combobox Grid */
        <div className="space-y-2.5">
          <div
            className={`grid gap-2.5 ${
              mode === 'before'
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {/* 1. Tỉnh / Thành phố */}
            <SearchableCombobox
              label="Tỉnh / Thành phố"
              placeholder="Gõ để tìm Tỉnh/Thành..."
              items={provinces}
              selectedItem={selectedProvince}
              onSelect={handleProvinceSelect}
              loading={loadingProvinces}
              hasError={showErrors && !selectedProvince}
              errorMessage="Vui lòng chọn Tỉnh / Thành phố"
            />

            {/* 2. Quận / Huyện (Chỉ có trong Trước sáp nhập) */}
            {mode === 'before' && (
              <SearchableCombobox
                label="Quận / Huyện"
                placeholder="Gõ để tìm Quận/Huyện..."
                items={districts}
                selectedItem={selectedDistrict}
                onSelect={handleDistrictSelect}
                disabled={!selectedProvince}
                disabledPlaceholder="-- Chọn Tỉnh trước --"
                loading={loadingDistricts}
                hasError={showErrors && !selectedDistrict}
                errorMessage={!selectedProvince ? "Vui lòng chọn Tỉnh trước" : "Vui lòng chọn Quận / Huyện"}
              />
            )}

            {/* 3. Phường / Xã */}
            <SearchableCombobox
              label="Phường / Xã"
              placeholder="Gõ để tìm Phường/Xã..."
              items={wards}
              selectedItem={selectedWard}
              onSelect={handleWardSelect}
              disabled={mode === 'before' ? !selectedDistrict : !selectedProvince}
              disabledPlaceholder={
                mode === 'before' ? '-- Chọn Huyện trước --' : '-- Chọn Tỉnh trước --'
              }
              loading={loadingWards}
              hasError={showErrors && !selectedWard}
              errorMessage={
                mode === 'before' && !selectedDistrict
                  ? "Vui lòng chọn Quận / Huyện trước"
                  : !selectedProvince
                  ? "Vui lòng chọn Tỉnh trước"
                  : "Vui lòng chọn Phường / Xã"
              }
            />
          </div>

          {/* 4. Số nhà, tên đường cụ thể */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
              <span>Số nhà, tên đường, toà nhà / ngõ ngách</span>
              {required && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Số 24 ngõ 180 Đường Nguyễn Lương Bằng"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className={`w-full h-10 px-3 text-xs rounded-lg border focus:outline-none transition-all ${
                showErrors && !streetAddress.trim()
                  ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-slate-900'
                  : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white'
              }`}
            />
            {showErrors && !streetAddress.trim() && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Vui lòng nhập số nhà, tên đường cụ thể</span>
              </p>
            )}
          </div>

          {/* Formatted Address Preview Result */}
          {value ? (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-800 block text-[11px]">
                    Địa chỉ nhận hàng hoàn chỉnh:
                  </span>
                  <span className="text-slate-700 text-xs break-words font-medium mt-0.5 block leading-relaxed">
                    {value}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualEdit(true)}
                  className="text-slate-500 hover:text-slate-900 text-[10px] underline font-medium shrink-0 cursor-pointer"
                  title="Chỉnh sửa chi tiết"
                >
                  Chỉnh sửa
                </button>
              </div>

              {/* Shipping info banner */}
              {isHcmInnerCity ? (
                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2 text-[11px] text-slate-600">
                  <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Nội thành TP.HCM (Trước sáp nhập): Shipper riêng CAISHOP (Ship thường 40k • Ship nhanh mốc giờ 100k) • Hỗ trợ COD &amp; QR.
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2 text-[11px] text-slate-500">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Giao hàng liên tỉnh / Ngoại thành: Giao qua đối tác vận chuyển • Mặc định Chuyển khoản QR.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 text-xs italic flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Vui lòng chọn Tỉnh/Thành và nhập số nhà để hoàn thiện địa chỉ.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
