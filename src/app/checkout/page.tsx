'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useCart, AVAILABLE_DEALS } from '@/lib/useCart';
import { calculateTier, getNextTierInfo } from '@/lib/membership';
import { getPrimaryImageUrl } from '@/lib/productImages';
import { PaymentSettings, defaultPaymentSettings, getVietQrUrl } from '@/lib/paymentSettings';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShoppingBag, 
  Award, 
  Tag, 
  X,
  ArrowRight,
  AlertCircle,
  Clock,
  Loader2,
  PackageCheck,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { VietnamAddressSelector, AddressMeta } from '@/components/VietnamAddressSelector';

interface DeliveryTimeSlot {
  id: string;
  label: string;
  endHour: number;
  endMinute: number;
  description: string;
}

const ALL_TIME_SLOTS: DeliveryTimeSlot[] = [
  { id: 'morning', label: '09:00 - 12:00', endHour: 12, endMinute: 0, description: 'Buổi sáng' },
  { id: 'afternoon', label: '13:30 - 16:30', endHour: 16, endMinute: 30, description: 'Buổi chiều' },
  { id: 'evening', label: '17:00 - 19:30', endHour: 19, endMinute: 30, description: 'Cuối ngày' },
  { id: 'night', label: '19:30 - 21:30', endHour: 21, endMinute: 30, description: 'Buổi tối' },
];

export default function CheckoutPage() {
  const { user, isLoggedIn } = useAuth();
  const { cart, clearCart, appliedDeal, setAppliedDealCode, isHydrated } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cod'>('vietqr');
  const [isHcmInnerCity, setIsHcmInnerCity] = useState(false);

  // Load payment settings configured by Admin
  useEffect(() => {
    fetch('/api/payment-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPaymentSettings(data.data);
          if (!data.data.is_cod_enabled) {
            setPaymentMethod('vietqr');
          }
        }
      })
      .catch((err) => console.error('Failed to load payment settings:', err));
  }, []);

  // Saved delivery information states (Auto-fill from previous successful orders)
  const [savedAddressMeta, setSavedAddressMeta] = useState<AddressMeta | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState<boolean>(false);
  const currentAddressMetaRef = useRef<AddressMeta | null>(null);

  // Validation states & field element refs
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isAddressValid, setIsAddressValid] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  
  // Inner-city HCMC shipping options: Ship thường 40k, Ship nhanh (mốc giờ cố định) 100k
  const [hcmShippingType, setHcmShippingType] = useState<'standard' | 'express'>('standard');
  const [deliveryDay, setDeliveryDay] = useState<'today' | 'tomorrow'>('today');
  const [expressTimeSlot, setExpressTimeSlot] = useState<string>('09:00 - 12:00');
  const [customTimeSlot, setCustomTimeSlot] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Sync client time on mount
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto load saved delivery information from previous successful orders
  useEffect(() => {
    try {
      const SAVED_SHIPPING_INFO_KEY = 'caishop_saved_shipping_info';
      const raw = localStorage.getItem(SAVED_SHIPPING_INFO_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        let filled = false;
        if (saved.customerName) {
          setCustomerName(saved.customerName);
          filled = true;
        }
        if (saved.customerPhone) {
          setCustomerPhone(saved.customerPhone);
          filled = true;
        }
        if (saved.customerEmail) {
          setCustomerEmail(saved.customerEmail);
        }
        if (saved.shippingAddress) {
          setShippingAddress(saved.shippingAddress);
          filled = true;
        }
        if (saved.addressMeta) {
          setSavedAddressMeta(saved.addressMeta);
          currentAddressMetaRef.current = saved.addressMeta;
          if (saved.addressMeta.isHcmInnerCity !== undefined) {
            setIsHcmInnerCity(saved.addressMeta.isHcmInnerCity);
          }
        }
        if (filled) {
          setIsAutoFilled(true);
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc thông tin nhận hàng đã lưu:', e);
    }
  }, []);

  // Sync logged in user profile into form if fields are empty
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Filter out time slots that have already passed based on current time
  const availableTodaySlots = React.useMemo(() => {
    if (!currentTime) return ALL_TIME_SLOTS;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return ALL_TIME_SLOTS.filter((slot) => {
      const slotEndMinutes = slot.endHour * 60 + slot.endMinute;
      return currentMinutes < slotEndMinutes;
    });
  }, [currentTime]);

  const displayedTimeSlots = deliveryDay === 'today' ? availableTodaySlots : ALL_TIME_SLOTS;

  // Auto switch to tomorrow if all slots for today have passed
  useEffect(() => {
    if (currentTime && availableTodaySlots.length === 0 && deliveryDay === 'today') {
      setDeliveryDay('tomorrow');
    }
  }, [availableTodaySlots, deliveryDay, currentTime]);

  // Ensure expressTimeSlot points to an available slot
  useEffect(() => {
    if (displayedTimeSlots.length > 0) {
      if (!displayedTimeSlots.some((s) => s.label === expressTimeSlot)) {
        setExpressTimeSlot(displayedTimeSlots[0].label);
      }
    }
  }, [displayedTimeSlots, expressTimeSlot]);

  // If address is not inner-city HCMC (or changed), ensure payment method falls back to VietQR
  useEffect(() => {
    if (!isHcmInnerCity && paymentMethod === 'cod') {
      setPaymentMethod('vietqr');
    }
  }, [isHcmInnerCity, paymentMethod]);

  // Checkout process states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToPayOS, setIsRedirectingToPayOS] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [searchPaid, setSearchPaid] = useState(false);
  const [searchCancelled, setSearchCancelled] = useState(false);
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isOrderExpired, setIsOrderExpired] = useState(false);

  // Check URL params if returning from PayOS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('order_id');
    const isPaidParam = params.get('paid') === 'true' || params.get('status') === 'PAID' || params.get('code') === '00';
    const isCancelledParam = params.get('cancelled') === 'true' || params.get('cancel') === 'true';

    if (isCancelledParam) setSearchCancelled(true);

    if (orderIdParam) {
      fetch(`/api/orders?id=${encodeURIComponent(orderIdParam)}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success && data.data) {
            const order = data.data;

            // Nếu đơn đã PAID trong cơ sở dữ liệu
            if (order.payment_status === 'PAID') {
              setSearchPaid(true);
              setOrderSuccess(order);
              clearCart();
              return;
            }

            // Nếu URL có tham số thanh toán thành công từ PayOS, gọi server đối soát với PayOS API
            if (isPaidParam) {
              try {
                const vRes = await fetch('/api/payos/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ order_id: order.id }),
                });
                const vData = await vRes.json();
                if (vData.success && vData.payment_status === 'PAID') {
                  order.payment_status = 'PAID';
                  order.fulfillment_status = 'PACKING';
                  setSearchPaid(true);
                  setSearchCancelled(false);
                } else {
                  setSearchPaid(false);
                  setSearchCancelled(true);
                }
              } catch (vErr) {
                console.error('Lỗi khi đối soát PayOS:', vErr);
              }
            }

            setOrderSuccess(order);
            clearCart();
          } else {
            // Đơn hàng không tìm thấy hoặc đã quá 1 tiếng nên bị tự động xóa
            setOrderNotFound(true);
          }
        })
        .catch((err) => {
          console.error('Lỗi tải thông tin đơn hàng từ PayOS return:', err);
          setOrderNotFound(true);
        });
    }
  }, [clearCart]);

  // 1-hour Live countdown timer for unpaid pending orders
  useEffect(() => {
    if (!orderSuccess || orderSuccess.payment_status === 'PAID') {
      setSecondsRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      if (!orderSuccess.created_at) return 3600;
      const createdAtStr = String(orderSuccess.created_at);
      const createdAtMs = new Date(
        createdAtStr.endsWith('Z') ? createdAtStr : createdAtStr.replace(' ', 'T') + 'Z'
      ).getTime();
      const expiresAtMs = createdAtMs + 60 * 60 * 1000;
      const diff = Math.floor((expiresAtMs - Date.now()) / 1000);
      return diff;
    };

    const initialDiff = calculateRemaining();
    if (initialDiff <= 0) {
      setSecondsRemaining(0);
      setIsOrderExpired(true);
      fetch(`/api/orders?id=${encodeURIComponent(orderSuccess.id)}`, { method: 'DELETE' }).catch(console.error);
      return;
    }

    setSecondsRemaining(initialDiff);
    setIsOrderExpired(false);

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0) {
        setSecondsRemaining(0);
        setIsOrderExpired(true);
        clearInterval(timer);
        fetch(`/api/orders?id=${encodeURIComponent(orderSuccess.id)}`, { method: 'DELETE' }).catch(console.error);
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [orderSuccess]);

  // Handler: Tiếp tục thanh toán qua PayOS
  const handleContinuePayment = async () => {
    if (!orderSuccess || isOrderExpired) return;
    setIsRedirectingToPayOS(true);
    try {
      const pRes = await fetch('/api/payos/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderSuccess.id,
          order_code: orderSuccess.order_code,
          total_amount: orderSuccess.total_amount,
          customer_name: orderSuccess.customer_name,
          customer_phone: orderSuccess.customer_phone,
        }),
      });
      const pData = await pRes.json();
      if (pData.success && pData.data?.checkoutUrl) {
        window.history.replaceState(
          null,
          '',
          `/checkout?cancelled=true&order_id=${encodeURIComponent(orderSuccess.id)}&order_code=${encodeURIComponent(orderSuccess.order_code)}`
        );
        window.location.href = pData.data.checkoutUrl;
      } else {
        alert(pData.error || 'Không thể mở cổng PayOS. Vui lòng thử lại sau.');
      }
    } catch (e) {
      console.error('Lỗi khi tiếp tục thanh toán PayOS:', e);
      alert('Lỗi kết nối tới cổng thanh toán PayOS.');
    } finally {
      setIsRedirectingToPayOS(false);
    }
  };

  // Handle browser back button from PayOS (pageshow event / bfcache recovery)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      setIsRedirectingToPayOS(false);
      setIsSubmitting(false);

      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get('order_id');
      if (orderIdParam) {
        fetch(`/api/orders?id=${encodeURIComponent(orderIdParam)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setOrderSuccess(data.data);
            }
          })
          .catch(console.error);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Copy feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Membership data
  const [membershipData, setMembershipData] = useState<{ past_orders: number; tier_name: string } | null>(null);

  // Auto pre-fill customer details from auth
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user, customerName, customerPhone, customerEmail]);

  // Fetch membership stats by phone
  useEffect(() => {
    const phoneToQuery = customerPhone.trim() || user?.phone || '';
    if (!phoneToQuery || phoneToQuery.length < 9) {
      setMembershipData(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/membership?phone=${encodeURIComponent(phoneToQuery)}`);
        const json: any = await res.json();
        if (json.success && json.data) {
          setMembershipData({
            past_orders: json.data.order_count || 0,
            tier_name: json.data.tier?.name || 'Hội viên Đồng',
          });
        }
      } catch (e) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [customerPhone, user?.phone]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Calculations
  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tier discount
  const effectiveOrders = membershipData?.past_orders || 0;
  const currentTier = calculateTier(effectiveOrders);
  const tierDiscountPercent = currentTier.discount_percent;
  const tierDiscountAmount = tierDiscountPercent > 0 
    ? Math.round((cartSubtotal * tierDiscountPercent) / 100) 
    : 0;

  // Voucher Deal discount & eligibility check
  const isDealEligible = Boolean(
    appliedDeal && (!appliedDeal.min_order || cartSubtotal >= appliedDeal.min_order)
  );

  // Auto-clear deal if not eligible for this cart total
  useEffect(() => {
    if (appliedDeal && appliedDeal.min_order && cartSubtotal < appliedDeal.min_order) {
      setAppliedDealCode(null);
    }
  }, [appliedDeal, cartSubtotal, setAppliedDealCode]);

  let voucherDiscountAmount = 0;
  if (isDealEligible && appliedDeal?.discount_amount) {
    voucherDiscountAmount = appliedDeal.discount_amount;
  }
  const isFreeshipDeal = isDealEligible && appliedDeal?.is_freeship;

  const totalDiscount = tierDiscountAmount + voucherDiscountAmount;
  const cartAfterDiscount = Math.max(0, cartSubtotal - totalDiscount);
  
  // Phí vận chuyển:
  // - Nội thành TP.HCM: Ship thường 40.000 ₫ | Ship nhanh mốc giờ cố định 100.000 ₫
  // - Khu vực khác: Miễn phí nếu >= 500k, ngược lại 30.000 ₫
  let shippingFee = 0;
  if (cartSubtotal > 0) {
    if (isHcmInnerCity) {
      if (hcmShippingType === 'express') {
        shippingFee = isFreeshipDeal ? 60000 : 100000;
      } else {
        shippingFee = isFreeshipDeal ? 0 : 40000;
      }
    } else {
      shippingFee = (cartAfterDiscount >= 500000 || isFreeshipDeal) ? 0 : 30000;
    }
  }
  const finalTotal = cartAfterDiscount + shippingFee;

  // Handle Order Submit
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setErrorMessage('');

    const errors: { name?: string; phone?: string; address?: string } = {};

    // 1. Validate customer name
    if (!customerName.trim()) {
      errors.name = 'Vui lòng nhập họ và tên người nhận';
    } else if (customerName.trim().length < 2) {
      errors.name = 'Họ và tên tối thiểu 2 ký tự';
    }

    // 2. Validate customer phone
    const phoneClean = customerPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!customerPhone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại người nhận';
    } else if (!phoneRegex.test(phoneClean)) {
      errors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, ví dụ 0912345678)';
    }

    // 3. Validate shipping address
    if (!shippingAddress.trim() || !isAddressValid) {
      errors.address = 'Vui lòng hoàn tất đầy đủ thông tin địa chỉ nhận hàng';
    }

    setFormErrors(errors);

    // If any required field is invalid, scroll/focus to first error and BLOCK the API call!
    if (Object.keys(errors).length > 0) {
      if (errors.name && nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current.focus();
      } else if (errors.phone && phoneInputRef.current) {
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInputRef.current.focus();
      } else if (errors.address && addressContainerRef.current) {
        addressContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTime = customTimeSlot.trim() || expressTimeSlot;
      const dayLabel = deliveryDay === 'today' ? 'Hôm nay' : 'Ngày mai';
      const carrierTag = isHcmInnerCity 
        ? hcmShippingType === 'express'
          ? `[VẬN CHUYỂN: Shipper riêng CAISHOP - Ship nhanh (${dayLabel} lúc ${selectedTime}) - Phí: 100k]`
          : `[VẬN CHUYỂN: Shipper riêng CAISHOP - Ship thường trong ngày (40k)]`
        : '[VẬN CHUYỂN: Giao hàng tiêu chuẩn]';

      const fullAddress = [
        shippingAddress.trim(),
        orderNote.trim() ? `(Ghi chú: ${orderNote.trim()})` : '',
        carrierTag,
      ].filter(Boolean).join(' - ');

      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || user?.email || undefined,
        shipping_address: fullAddress,
        payment_method: paymentMethod,
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

      const data: any = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Đặt hàng thất bại. Vui lòng thử lại.');
      }

      // Lưu lại thông tin nhận hàng thành công vào localStorage để tự động fill cho các lần sau
      try {
        const SAVED_SHIPPING_INFO_KEY = 'caishop_saved_shipping_info';
        const infoToSave = {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          shippingAddress: shippingAddress.trim(),
          addressMeta: currentAddressMetaRef.current,
        };
        localStorage.setItem(SAVED_SHIPPING_INFO_KEY, JSON.stringify(infoToSave));
      } catch (saveErr) {
        console.error('Không thể lưu thông tin nhận hàng vào localStorage:', saveErr);
      }

      // If VietQR with PayOS enabled, generate link and REDIRECT DIRECTLY to pay.payos.vn
      if (paymentMethod === 'vietqr' && paymentSettings.is_payos_enabled) {
        setIsRedirectingToPayOS(true);
        try {
          const pRes = await fetch('/api/payos/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: data.order.id,
              order_code: data.order.order_code,
              total_amount: data.order.total_amount,
              customer_name: customerName.trim(),
              customer_phone: customerPhone.trim(),
            }),
          });
          const pData = await pRes.json();
          if (pData.success && pData.data?.checkoutUrl) {
            clearCart();
            window.history.replaceState(
              null,
              '',
              `/checkout?cancelled=true&order_id=${encodeURIComponent(data.order.id)}&order_code=${encodeURIComponent(data.order.order_code)}`
            );
            // Direct redirect to PayOS checkout page (https://pay.payos.vn/web/...)
            window.location.href = pData.data.checkoutUrl;
            return;
          } else {
            console.warn('PayOS payment link creation failed, falling back to local view:', pData.error);
            setPayosData(pData.data);
            setIsRedirectingToPayOS(false);
          }
        } catch (pErr) {
          console.error('PayOS connection error:', pErr);
          setIsRedirectingToPayOS(false);
        }
      }

      setOrderSuccess(data.order);
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // State & Handler: Confirm VietQR Payment & Transition to 'Chờ vận chuyển'
  const [payosData, setPayosData] = useState<any>(null);
  const [showManualQr, setShowManualQr] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Polling to auto-detect payment completion (Webhook from PayOS)
  useEffect(() => {
    if (!orderSuccess?.id) return;
    const isVietQr = (orderSuccess.payment_method || paymentMethod) === 'vietqr';
    if (!isVietQr || orderSuccess.payment_status === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders?id=${orderSuccess.id}`);
        const data = await res.json();
        if (data.success && data.data && data.data.payment_status === 'PAID') {
          setOrderSuccess((prev: any) => ({
            ...prev,
            payment_status: 'PAID',
            fulfillment_status: data.data.fulfillment_status || 'PACKING'
          }));
        }
      } catch (err) {
        // silent polling error
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [orderSuccess?.id, orderSuccess?.payment_status, paymentMethod]);

  const handleConfirmPayment = async () => {
    if (!orderSuccess?.id) return;
    setIsConfirmingPayment(true);
    setConfirmError('');
    try {
      const res = await fetch('/api/payos/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderSuccess.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.payment_status === 'PAID') {
        setOrderSuccess((prev: any) => ({
          ...prev,
          payment_status: 'PAID',
          fulfillment_status: 'PACKING',
        }));
        setSearchPaid(true);
        setSearchCancelled(false);
      } else {
        setConfirmError(
          data.message ||
            'Hệ thống chưa nhận được tiền về từ ngân hàng. Nếu bạn vừa chuyển khoản, vui lòng đợi 15-30 giây để hệ thống đối soát hoặc nhấn mở lại cổng PayOS.'
        );
      }
    } catch (err: any) {
      setConfirmError(err.message || 'Lỗi khi kiểm tra đối soát giao dịch. Vui lòng thử lại.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-sm text-slate-500">
        Đang tải thông tin thanh toán...
      </div>
    );
  }

  // View: Redirecting to PayOS Fullscreen Loading
  if (isRedirectingToPayOS) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <CreditCard className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Đang kết nối cổng thanh toán PayOS
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Hệ thống đang khởi tạo giao dịch bảo mật. Bạn sẽ được chuyển hướng sang trang thanh toán <strong className="text-slate-800">pay.payos.vn</strong> trong giây lát...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // View: Order Not Found or Expired Screen
  if (orderNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">Đơn hàng không tồn tại hoặc đã hết hạn</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Các đơn hàng chưa thanh toán chỉ được lưu giữ trong vòng 1 tiếng. Nếu quá thời gian này, hệ thống sẽ tự động hủy đơn và hoàn trả lại số lượng sản phẩm vào kho hàng.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors"
            >
              <span>Quay lại cửa hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // View: Order Success Screen
  if (orderSuccess) {
    const isVietQr = (orderSuccess.payment_method || paymentMethod) === 'vietqr';
    const isPaid = orderSuccess.payment_status === 'PAID';
    const isPacking = orderSuccess.fulfillment_status === 'PACKING' || isPaid;

    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-7">
          {/* Header & Status Indicator */}
          <div className="text-center space-y-3">
            {isPaid ? (
              <div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : isOrderExpired ? (
              <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-7 h-7" />
              </div>
            ) : isVietQr ? (
              <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Truck className="w-7 h-7" />
              </div>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isPaid
                  ? 'Thanh Toán Thành Công!'
                  : isOrderExpired
                  ? 'Đơn Hàng Đã Hết Hạn'
                  : isVietQr
                  ? 'Đơn Hàng Chờ Chuyển Khoản'
                  : 'Đặt Hàng Thành Công!'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Mã đơn hàng: <strong className="text-slate-900 font-bold tracking-wider">#{orderSuccess.order_code}</strong>
              </p>
            </div>

            {/* Current State Badges */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              {isPaid ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã thanh toán</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Trạng thái: Chờ vận chuyển</span>
                  </span>
                </>
              ) : isOrderExpired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                  <span>Trạng thái: Đã hết hạn & Đã tự hủy</span>
                </span>
              ) : isVietQr ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Trạng thái: Chờ chuyển khoản</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                    <span>Lưu giữ 1 giờ</span>
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Trạng thái: Chờ vận chuyển (COD)</span>
                </span>
              )}
            </div>
          </div>

          {/* PayOS Return Banners */}
          {searchPaid && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thanh toán thành công qua cổng PayOS (pay.payos.vn)!</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Hệ thống đã nhận diện giao dịch chuyển khoản tự động. Đơn hàng #{orderSuccess.order_code} đã được chuyển sang trạng thái <strong>Đang chuẩn bị đóng gói & vận chuyển</strong>.
              </p>
            </div>
          )}

          {searchCancelled && !isPaid && !isOrderExpired && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bạn vừa tạm dừng hoặc hủy thao tác trên PayOS</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Đơn hàng #{orderSuccess.order_code} của bạn vẫn đang được hệ thống lưu giữ trong <strong>1 tiếng</strong> (kèm đồng hồ đếm ngược phía dưới). Bạn có thể bấm <strong>"Tiếp tục thanh toán qua PayOS"</strong> bất cứ lúc nào trước khi hết giờ.
              </p>
            </div>
          )}

          {/* Expired Notice Banner */}
          {isOrderExpired && !isPaid && (
            <div className="p-5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl space-y-3 text-center">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-900">Đơn hàng đã hết hạn thanh toán (quá 1 tiếng)</h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Đơn hàng #{orderSuccess.order_code} đã tự động bị xóa khỏi hệ thống. Toàn bộ số lượng sản phẩm đã được hoàn trả lại kho hàng. Quý khách vui lòng chọn mua lại nếu có nhu cầu.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <span>Khám phá sản phẩm & Đặt lại</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Stepper Progress */}
          {!isOrderExpired && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-2 text-center relative">
                {/* Step 1 */}
                <div className="space-y-1">
                  <div className="w-6 h-6 mx-auto rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div className="text-[11px] font-bold text-slate-900">1. Đặt hàng</div>
                  <div className="text-[10px] text-slate-500">Đã tiếp nhận</div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1">
                  <div
                    className={`w-6 h-6 mx-auto rounded-full text-[11px] flex items-center justify-center font-bold transition-all ${
                      isPaid
                        ? 'bg-slate-900 text-white'
                        : isVietQr
                        ? 'bg-slate-900 text-white ring-2 ring-slate-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isPaid ? '✓' : isVietQr ? '2' : 'COD'}
                  </div>
                  <div className="text-[11px] font-bold text-slate-900">
                    {isVietQr ? (isPaid ? '2. Đã thanh toán' : '2. Chờ chuyển khoản') : '2. Thu tiền mặt'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isVietQr ? (isPaid ? 'Giao dịch thành công' : 'Quét mã PayOS') : 'Khi nhận hàng'}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-1">
                  <div
                    className={`w-6 h-6 mx-auto rounded-full text-[11px] flex items-center justify-center font-bold transition-all ${
                      isPacking
                        ? 'bg-slate-900 text-white ring-2 ring-slate-300'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPacking ? '3' : '○'}
                  </div>
                  <div className={`text-[11px] font-bold ${isPacking ? 'text-slate-900' : 'text-slate-400'}`}>
                    3. Chờ vận chuyển
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isPacking ? 'Chuẩn bị đóng gói' : 'Chờ hoàn tất thanh toán'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditional View: VietQR Pending Transfer */}
          {isVietQr && !isPaid && !isOrderExpired && (
            <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-slate-50/70 text-center space-y-4">
              {/* 1-Hour Expiration Live Countdown Box */}
              {secondsRemaining !== null && (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 border border-amber-300 rounded-2xl space-y-3 text-amber-950 shadow-xs text-left">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
                        <Clock className="w-4 h-4 animate-spin text-amber-700 [animation-duration:10s]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Thời gian lưu giữ đơn & giữ hàng trong kho
                        </div>
                        <div className="text-[11px] text-amber-700">
                          Tự động xóa đơn & hoàn kho nếu không thanh toán sau 1 giờ
                        </div>
                      </div>
                    </div>

                    {/* Big Countdown Digits */}
                    <div className="flex items-center gap-1 bg-amber-950 text-amber-100 px-3 py-1.5 rounded-xl font-mono font-bold text-base sm:text-lg tracking-widest shadow-inner shrink-0">
                      <span>{String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}</span>
                      <span className="animate-pulse">:</span>
                      <span>{String(secondsRemaining % 60).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-amber-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        secondsRemaining < 600 ? 'bg-rose-500' : secondsRemaining < 1800 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (secondsRemaining / 3600) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {paymentSettings.is_payos_enabled ? (
                <>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Thanh toán trực tuyến bảo mật qua PayOS</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Đơn hàng #{orderSuccess.order_code} đã sẵn sàng. Vui lòng bấm nút bên dưới để chuyển tiếp sang cổng thanh toán bảo mật PayOS (pay.payos.vn).
                    </p>
                  </div>

                  {/* PayOS Continue Payment Button */}
                  <button
                    type="button"
                    disabled={isRedirectingToPayOS}
                    onClick={handleContinuePayment}
                    className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
                  >
                    {isRedirectingToPayOS ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kết nối cổng PayOS...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Tiếp tục thanh toán qua PayOS (pay.payos.vn) →</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Hệ thống tự động đồng bộ kết quả thanh toán ngay khi hoàn tất giao dịch</span>
                  </div>

                  {/* Optional Fallback QR Accordion */}
                  <div className="pt-2 border-t border-slate-200 text-left">
                    <button
                      type="button"
                      onClick={() => setShowManualQr(!showManualQr)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer mx-auto py-1"
                    >
                      <span>{showManualQr ? 'Ẩn thông tin chuyển khoản thủ công' : 'Hoặc xem mã VietQR & STK chuyển khoản thủ công'}</span>
                      <span className="text-[10px]">{showManualQr ? '▲' : '▼'}</span>
                    </button>

                    {showManualQr && (
                      <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center space-y-4">
                        <div className="bg-white p-3.5 border border-slate-200 rounded-xl inline-block mx-auto shadow-2xs">
                          <img
                            src={
                              payosData?.bin && payosData?.accountNumber
                                ? `https://img.vietqr.io/image/${payosData.bin}-${payosData.accountNumber}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName || '')}`
                                : getVietQrUrl(paymentSettings, orderSuccess.total_amount, orderSuccess.order_code)
                            }
                            alt="VietQR Code"
                            className="w-56 h-56 mx-auto object-contain"
                          />
                        </div>

                        {/* Transfer Details with One-click Copy */}
                        <div className="space-y-2 text-left bg-white p-4 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Ngân hàng:</span>
                            <span className="font-semibold text-slate-900">
                              {payosData?.bin || paymentSettings.bank_name || paymentSettings.bank_id}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Chủ tài khoản:</span>
                            <span className="font-semibold text-slate-900">
                              {payosData?.accountName || paymentSettings.account_holder}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Số tài khoản:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(payosData?.accountNumber || paymentSettings.account_number, 'account')}
                              className="font-bold text-slate-900 flex items-center gap-1.5 hover:text-slate-600 cursor-pointer"
                            >
                              <span>{payosData?.accountNumber || paymentSettings.account_number}</span>
                              {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Số tiền:</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(String(payosData?.amount || orderSuccess.total_amount), 'amount')}
                              className="font-bold text-slate-900 flex items-center gap-1.5 tabular-nums cursor-pointer"
                            >
                              <span>{formatMoney(payosData?.amount || orderSuccess.total_amount)}</span>
                              {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-500">Nội dung chuyển khoản:</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  payosData?.description ||
                                    (paymentSettings.transfer_syntax || '{ORDER_CODE}').replace('{ORDER_CODE}', orderSuccess.order_code),
                                  'code'
                                )
                              }
                              className="font-bold text-slate-900 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
                            >
                              <span>
                                {payosData?.description ||
                                  (paymentSettings.transfer_syntax || '{ORDER_CODE}').replace('{ORDER_CODE}', orderSuccess.order_code)}
                              </span>
                              {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                          </div>
                        </div>

                        {/* Step 2: Confirm Transfer Action Button */}
                        <div className="pt-2 space-y-2.5">
                          <button
                            type="button"
                            onClick={handleConfirmPayment}
                            disabled={isConfirmingPayment}
                            className="w-full py-3.5 px-5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer flex items-center justify-center gap-2"
                          >
                            {isConfirmingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang đối soát với ngân hàng...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Tôi đã chuyển khoản - Kiểm tra trạng thái</span>
                              </>
                            )}
                          </button>

                          {confirmError && (
                            <p className="text-[11px] text-rose-600 text-center font-medium">
                              {confirmError}
                            </p>
                          )}

                          <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                            Hệ thống sẽ đối soát tự động với ngân hàng qua PayOS. Đơn hàng chỉ chuyển sang <strong>Chờ vận chuyển</strong> khi tiền đã được xác nhận thực tế.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Manual VietQR Mode (PayOS Disabled) */
                <>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <QrCode className="w-4 h-4 text-slate-700" />
                      <span>Bước 1: Quét mã QR để chuyển khoản</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {paymentSettings.payment_instructions || 'Mở ứng dụng ngân hàng bất kỳ để quét mã QR bên dưới, hệ thống đã điền sẵn số tiền và mã đơn hàng của bạn.'}
                    </p>
                  </div>

                  {/* VietQR Code Frame */}
                  <div className="bg-white p-3.5 border border-slate-200 rounded-xl inline-block mx-auto shadow-2xs">
                    <img
                      src={getVietQrUrl(paymentSettings, orderSuccess.total_amount, orderSuccess.order_code)}
                      alt="VietQR Code"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  </div>

                  {/* Transfer Details with One-click Copy */}
                  <div className="space-y-2 text-left bg-white p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Ngân hàng:</span>
                      <span className="font-semibold text-slate-900">
                        {paymentSettings.bank_name || paymentSettings.bank_id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Chủ tài khoản:</span>
                      <span className="font-semibold text-slate-900">
                        {paymentSettings.account_holder}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(paymentSettings.account_number, 'account')}
                        className="font-bold text-slate-900 flex items-center gap-1.5 hover:text-slate-600 cursor-pointer"
                      >
                        <span>{paymentSettings.account_number}</span>
                        {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Số tiền:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(orderSuccess.total_amount), 'amount')}
                        className="font-bold text-slate-900 flex items-center gap-1.5 tabular-nums cursor-pointer"
                      >
                        <span>{formatMoney(orderSuccess.total_amount)}</span>
                        {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Nội dung chuyển khoản:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            (paymentSettings.transfer_syntax || '{ORDER_CODE}').replace('{ORDER_CODE}', orderSuccess.order_code),
                            'code'
                          )
                        }
                        className="font-bold text-slate-900 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
                      >
                        <span>
                          {(paymentSettings.transfer_syntax || '{ORDER_CODE}').replace('{ORDER_CODE}', orderSuccess.order_code)}
                        </span>
                        {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Confirm Transfer Action Button */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isConfirmingPayment}
                      className="w-full py-3.5 px-5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isConfirmingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang đối soát với ngân hàng...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Tôi đã chuyển khoản - Kiểm tra trạng thái</span>
                        </>
                      )}
                    </button>

                    {confirmError && (
                      <p className="text-[11px] text-rose-600 text-center font-medium">
                        {confirmError}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                      Hệ thống đối soát tự động thông qua ngân hàng / PayOS. Đơn hàng chỉ chuyển sang <strong>Chờ vận chuyển</strong> khi tiền đã được xác nhận thực tế.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Conditional View: Paid Successfully (VietQR) */}
          {isVietQr && isPaid && (
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 text-left space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã thanh toán thành công {formatMoney(orderSuccess.total_amount)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đơn hàng <strong>#{orderSuccess.order_code}</strong> đã được chuyển sang trạng thái <strong>Chờ vận chuyển</strong>. Đội ngũ kho CAISHOP đang tiến hành đóng gói và xuất kho.
                </p>
              </div>

              {/* Delivery info summary */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs space-y-2 text-slate-600">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Người nhận:</span>
                  <span className="font-semibold text-slate-900">{orderSuccess.customer_name} ({orderSuccess.customer_phone})</span>
                </div>
                <div className="flex justify-between items-start pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500 shrink-0 mr-3">Địa chỉ nhận hàng:</span>
                  <span className="font-medium text-slate-900 text-right leading-relaxed">{orderSuccess.shipping_address}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hình thức thanh toán:</span>
                  <span className="font-semibold text-slate-900">VietQR (Đã hoàn tất)</span>
                </div>
              </div>

              {isHcmInnerCity && (
                <div className="text-[11px] text-slate-700 bg-white border border-slate-200 p-3 rounded-lg flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Đơn nội thành TP.HCM: <strong>Shipper riêng của CAISHOP</strong> sẽ liên hệ và giao hàng tận nơi.</span>
                </div>
              )}
            </div>
          )}

          {/* Conditional View: COD */}
          {!isVietQr && (
            <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-slate-50/70 text-left space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Truck className="w-4 h-4 text-slate-800" />
                  <span>Giao hàng nội thành TP.HCM (Thu tiền mặt COD)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đơn hàng <strong>#{orderSuccess.order_code}</strong> đã được tiếp nhận và chuyển sang trạng thái <strong>Chờ vận chuyển</strong>. Shipper riêng của CAISHOP sẽ liên hệ trước khi giao.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs space-y-2 text-slate-600">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tổng tiền cần thanh toán cho Shipper:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatMoney(orderSuccess.total_amount)}</span>
                </div>
                <div className="flex justify-between items-start pb-1.5 border-b border-slate-100">
                  <span className="text-slate-500 shrink-0 mr-3">Địa chỉ nhận hàng:</span>
                  <span className="font-medium text-slate-900 text-right leading-relaxed">{orderSuccess.shipping_address}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Người nhận:</span>
                  <span className="font-semibold text-slate-900">{orderSuccess.customer_name} ({orderSuccess.customer_phone})</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-lg bg-slate-900 text-white text-xs font-medium text-center hover:bg-black transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              href="/products"
              className="py-3 px-4 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium text-center hover:bg-slate-50 transition-colors"
            >
              Xem bộ sưu tập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // View: Empty Cart
  if (cart.length === 0 && !isRedirectingToPayOS && !isSubmitting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
            <p className="text-xs text-slate-500">
              Hãy chọn cho mình những sản phẩm thời trang cao cấp từ Atelier.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors"
          >
            <span>Khám phá sản phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại cửa hàng</span>
          </Link>

          <Link
            href="/"
            className="font-wide text-lg sm:text-xl font-medium uppercase tracking-mono text-[#0a0a0a]"
          >
            ATELIER
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Thanh toán bảo mật</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Not Logged In Notice */}
        {!isLoggedIn && (
          <div className="mb-8 p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
              <span className="text-blue-900">
                Bạn đã có tài khoản tại ATELIER? Đăng nhập ngay để nhận ưu đãi cấp bậc và tích điểm đơn hàng.
              </span>
            </div>
            <Link
              href="/login?redirect=/checkout"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shrink-0"
            >
              Đăng nhập
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Form Details (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" noValidate onSubmit={handleCheckoutSubmit} className="space-y-8">
              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Step 1: Delivery Information */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">1</span>
                    <span>Thông tin nhận hàng</span>
                  </h2>
                  {isAutoFilled && (
                    <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tự động điền từ đơn trước</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Họ và tên người nhận <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`w-full h-11 px-3.5 text-xs rounded-lg border focus:outline-none transition-all ${
                        formErrors.name
                          ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-slate-900'
                          : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Số điện thoại <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      placeholder="0912 345 678"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      className={`w-full h-11 px-3.5 text-xs rounded-lg border focus:outline-none transition-all ${
                        formErrors.phone
                          ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 text-slate-900'
                          : 'border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Email (nhận biên lai điện tử)
                    </label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-11 px-3.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2" ref={addressContainerRef}>
                    <VietnamAddressSelector
                      value={shippingAddress}
                      onChange={(val) => {
                        setShippingAddress(val);
                        if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: undefined }));
                      }}
                      initialMeta={savedAddressMeta}
                      onAddressMetaChange={(meta) => {
                        currentAddressMetaRef.current = meta;
                        setIsHcmInnerCity(meta.isHcmInnerCity);
                      }}
                      showErrors={hasSubmitted && Boolean(formErrors.address || !isAddressValid)}
                      onValidationChange={(valid) => {
                        setIsAddressValid(valid);
                        if (valid && formErrors.address) {
                          setFormErrors((prev) => ({ ...prev, address: undefined }));
                        }
                      }}
                      required
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-500">
                      Ghi chú đơn hàng (tuỳ chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="w-full h-11 px-3.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Carrier Card / Inner-city Shipping Options */}
              {isHcmInnerCity ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Hình thức giao hàng (Nội thành TP.HCM)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Option 1: Ship thường 40k */}
                    <label
                      onClick={() => setHcmShippingType('standard')}
                      className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        hcmShippingType === 'standard'
                          ? 'border-slate-900 bg-slate-50/70 ring-1 ring-slate-900'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="hcm_shipping_type"
                          checked={hcmShippingType === 'standard'}
                          onChange={() => setHcmShippingType('standard')}
                          className="mt-0.5 accent-slate-900 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Ship thường
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Giao linh hoạt trong ngày theo tuyến đường của shipper riêng CAISHOP.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 whitespace-nowrap pt-0.5 tabular-nums">
                        {isFreeshipDeal ? (
                          <span className="flex items-center gap-1.5">
                            <span className="line-through text-slate-400 font-normal">40.000 ₫</span>
                            <span className="text-emerald-600">0 ₫</span>
                          </span>
                        ) : (
                          '40.000 ₫'
                        )}
                      </span>
                    </label>

                    {/* Option 2: Ship nhanh (mốc giờ cố định) 100k */}
                    <div
                      className={`rounded-xl border transition-all ${
                        hcmShippingType === 'express'
                          ? 'border-slate-900 bg-slate-50/70 ring-1 ring-slate-900'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <label
                        onClick={() => setHcmShippingType('express')}
                        className="flex items-start justify-between gap-3 p-3.5 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="hcm_shipping_type"
                            checked={hcmShippingType === 'express'}
                            onChange={() => setHcmShippingType('express')}
                            className="mt-0.5 accent-slate-900 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              Ship nhanh (mốc giờ cố định)
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              Shipper ưu tiên giao hỏa tốc đến đúng mốc giờ hẹn trước theo yêu cầu của bạn.
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-900 whitespace-nowrap pt-0.5 tabular-nums">
                          {isFreeshipDeal ? (
                            <span className="flex items-center gap-1.5">
                              <span className="line-through text-slate-400 font-normal">100.000 ₫</span>
                              <span className="text-emerald-600">60.000 ₫</span>
                            </span>
                          ) : (
                            '100.000 ₫'
                          )}
                        </span>
                      </label>

                      {/* Time slot picker for Ship nhanh */}
                      {hcmShippingType === 'express' && (
                        <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/60 mt-1 space-y-2.5">
                          {/* Day Selector */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-[11px] font-semibold text-slate-700 block">
                              Chọn mốc giờ cố định mong muốn giao:
                            </label>
                            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg text-[10px] border border-slate-200/80">
                              <button
                                type="button"
                                onClick={() => setDeliveryDay('today')}
                                disabled={availableTodaySlots.length === 0}
                                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                  deliveryDay === 'today'
                                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                    : availableTodaySlots.length === 0
                                    ? 'text-slate-400 cursor-not-allowed line-through'
                                    : 'text-slate-600 hover:text-slate-900 cursor-pointer'
                                }`}
                              >
                                Hôm nay {availableTodaySlots.length === 0 ? '(Đã hết giờ)' : ''}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeliveryDay('tomorrow')}
                                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                  deliveryDay === 'tomorrow'
                                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Ngày mai
                              </button>
                            </div>
                          </div>

                          {/* Time Slots Grid: Cards that have already passed are hidden completely! */}
                          {displayedTimeSlots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {displayedTimeSlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => {
                                    setExpressTimeSlot(slot.label);
                                    setCustomTimeSlot('');
                                  }}
                                  className={`py-2 px-2 text-[11px] font-medium rounded-lg border text-center transition-all cursor-pointer ${
                                    expressTimeSlot === slot.label && !customTimeSlot
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="block font-bold">{slot.label}</span>
                                  <span className="text-[10px] opacity-75 block">{slot.description}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px]">
                              Tất cả các mốc giờ hẹn giao trong ngày hôm nay đã qua. Vui lòng chọn mốc giờ giao vào <strong>Ngày mai</strong> hoặc nhập thời gian hẹn cụ thể bên dưới.
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="Hoặc nhập mốc giờ cụ thể khác (Ví dụ: Đúng 15h30 chiều...)"
                            value={customTimeSlot}
                            onChange={(e) => setCustomTimeSlot(e.target.value)}
                            className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Shipping Partner for outer regions */
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-700">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Đơn vị vận chuyển tiêu chuẩn
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Giao hàng tiêu chuẩn toàn quốc. Mặc định thanh toán Chuyển khoản QR.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 shrink-0 tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600">Miễn phí</span>
                    ) : (
                      formatMoney(shippingFee)
                    )}
                  </span>
                </div>
              )}

              {/* Step 2: Payment Method */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">2</span>
                    <span>Phương thức thanh toán</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* VietQR Option - Always Available & Default */}
                  <label
                    onClick={() => setPaymentMethod('vietqr')}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'vietqr'
                        ? 'border-slate-900 bg-slate-50/70 ring-1 ring-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'vietqr'}
                      onChange={() => setPaymentMethod('vietqr')}
                      className="mt-1 accent-slate-900 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 block">
                          {paymentSettings.is_payos_enabled
                            ? 'Thanh toán trực tuyến VietQR qua PayOS'
                            : 'Chuyển khoản VietQR tức thì'}
                        </span>
                        {paymentSettings.is_payos_enabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Cổng pay.payos.vn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {paymentSettings.is_payos_enabled
                          ? 'Tự động chuyển đến cổng thanh toán bảo mật PayOS (pay.payos.vn) để quét mã VietQR hoặc mở app ngân hàng thanh toán tự động.'
                          : 'Quét mã QR tự động điền đúng số tiền và mã đơn. Hệ thống tự động kích hoạt xử lý đơn hàng trong 3 giây.'}
                      </p>
                    </div>
                  </label>

                  {/* COD Option - Check admin toggle, order amount limit, and inner-city HCMC */}
                  {paymentSettings.is_cod_enabled && (
                    <label
                      onClick={() => {
                        const isUnderMax = !paymentSettings.cod_max_amount || finalTotal <= paymentSettings.cod_max_amount;
                        if (isHcmInnerCity && isUnderMax) {
                          setPaymentMethod('cod');
                        }
                      }}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                        isHcmInnerCity && (!paymentSettings.cod_max_amount || finalTotal <= paymentSettings.cod_max_amount)
                          ? paymentMethod === 'cod'
                            ? 'border-slate-900 bg-slate-50/70 ring-1 ring-slate-900 cursor-pointer'
                            : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                          : 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed select-none'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'cod'}
                        disabled={!isHcmInnerCity || Boolean(paymentSettings.cod_max_amount && finalTotal > paymentSettings.cod_max_amount)}
                        onChange={() => {
                          const isUnderMax = !paymentSettings.cod_max_amount || finalTotal <= paymentSettings.cod_max_amount;
                          if (isHcmInnerCity && isUnderMax) setPaymentMethod('cod');
                        }}
                        className="mt-1 accent-slate-900 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${isHcmInnerCity ? 'text-slate-900' : 'text-slate-500'}`}>
                            Thanh toán khi nhận hàng (COD)
                          </span>
                          {!isHcmInnerCity ? (
                            <span className="text-[11px] text-slate-400 font-normal">
                              (Chỉ áp dụng nội thành TP.HCM)
                            </span>
                          ) : paymentSettings.cod_max_amount && finalTotal > paymentSettings.cod_max_amount ? (
                            <span className="text-[11px] text-amber-600 font-medium">
                              (Hạn mức COD tối đa {formatMoney(paymentSettings.cod_max_amount)})
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {isHcmInnerCity
                            ? (paymentSettings.cod_note || 'Đơn hàng được giao bởi shipper riêng của CAISHOP. Quý khách thanh toán tiền mặt trực tiếp cho shipper khi nhận hàng.')
                            : 'Chỉ hỗ trợ COD cho đơn nội thành TP.HCM (Trước sáp nhập) do có shipper riêng của shop đi giao. Các khu vực khác mặc định thanh toán Chuyển khoản QR.'}
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isRedirectingToPayOS}
                className="w-full py-4 px-6 bg-[#0a0a0a] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting || isRedirectingToPayOS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {paymentMethod === 'vietqr' && paymentSettings.is_payos_enabled
                        ? 'Đang kết nối cổng thanh toán PayOS...'
                        : 'Đang xử lý đơn hàng...'}
                    </span>
                  </>
                ) : paymentMethod === 'vietqr' && paymentSettings.is_payos_enabled ? (
                  <>
                    <span>Chuyển sang thanh toán PayOS ({formatMoney(finalTotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <span>Xác nhận đặt hàng ({formatMoney(finalTotal)})</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 space-y-6 shadow-xs sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Tóm tắt đơn hàng
                </h3>
                <span className="text-xs text-slate-500">
                  {totalBagCount} sản phẩm
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 space-y-3">
                {cart.map((item) => (
                  <div key={item.variant_id} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <img
                      src={getPrimaryImageUrl(item.product_image)}
                      alt={item.product_name}
                      className="w-14 h-16 object-cover rounded border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {item.product_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.color} / Size {item.size} × {item.quantity}
                      </div>
                      <div className="text-xs font-medium text-slate-800 tabular-nums mt-0.5">
                        {formatMoney(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher Deal Box */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>Deal giảm giá</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({AVAILABLE_DEALS.length} mã khả dụng)
                    </span>
                  </span>
                  {appliedDeal && (
                    <button
                      type="button"
                      onClick={() => setAppliedDealCode(null)}
                      className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>

                {/* List of Available Deals for Selection */}
                <div className="space-y-2">
                  {AVAILABLE_DEALS.map((deal) => {
                    const isSelected = appliedDeal?.code === deal.code;
                    const isEligible = !deal.min_order || cartSubtotal >= deal.min_order;

                    if (isSelected) {
                      return (
                        <div
                          key={deal.code}
                          onClick={() => setAppliedDealCode(null)}
                          className="p-3 rounded-xl bg-black text-white border border-black shadow-xs flex items-start justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                          title="Bấm để bỏ chọn mã này"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold tracking-wide text-white">{deal.code}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white/20 text-white">
                                {deal.discount}
                              </span>
                            </div>
                            <div className="text-[11px] text-white/70 mt-1 leading-snug">
                              {deal.title} • {deal.condition}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (isEligible) {
                      return (
                        <div
                          key={deal.code}
                          onClick={() => setAppliedDealCode(deal.code)}
                          className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 shadow-2xs flex items-start justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group"
                          title="Bấm để áp dụng mã"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-black">{deal.code}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {deal.discount}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                              {deal.title} • {deal.condition}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Not eligible for current order amount
                    return (
                      <div
                        key={deal.code}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 opacity-60 select-none cursor-not-allowed"
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

              {/* Price Calculation Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span className="tabular-nums font-medium text-slate-800">{formatMoney(cartSubtotal)}</span>
                </div>

                {tierDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Chiết khấu hội viên (-{tierDiscountPercent}%):</span>
                    <span className="tabular-nums">-{formatMoney(tierDiscountAmount)}</span>
                  </div>
                )}

                {voucherDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Voucher ({appliedDeal?.code}):</span>
                    <span className="tabular-nums">-{formatMoney(voucherDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 gap-2">
                  <span className="shrink-0">Hình thức giao:</span>
                  <span className="tabular-nums font-medium text-slate-800 text-right">
                    {isHcmInnerCity
                      ? hcmShippingType === 'express'
                        ? `Ship nhanh (${deliveryDay === 'today' ? 'Hôm nay' : 'Ngày mai'} ${customTimeSlot.trim() || expressTimeSlot})`
                        : 'Ship thường trong ngày'
                      : 'Giao hàng tiêu chuẩn'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {isFreeshipDeal && shippingFee === 0
                      ? 'Miễn phí (Voucher Freeship)'
                      : shippingFee === 0
                      ? 'Miễn phí'
                      : formatMoney(shippingFee)}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Tổng thanh toán:</span>
                  <span className="text-base text-slate-900 tabular-nums">
                    {formatMoney(finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PayOS Redirecting Fullscreen Backdrop */}
      {isRedirectingToPayOS && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Đang chuyển đến PayOS
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đang kết nối cổng thanh toán bảo mật <strong>pay.payos.vn</strong>. Vui lòng chờ trong giây lát...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
