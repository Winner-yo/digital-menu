'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Phone, Mail, MapPin, UtensilsCrossed,
  ShoppingBag, Tag, ChevronRight, CreditCard, Wallet, Banknote,
  CheckCircle2, Loader2
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useT } from '@/i18n/useTranslation';
import { formatETB, cn } from '@/lib/utils';
import { orderApi, paymentApi, restaurantApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import type { OrderType, PaymentMethod, DeliveryZone, Table } from '@/types';

interface CheckoutForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  tableId: string;
  deliveryAddress: string;
  deliveryArea: string;
  notes: string;
  promoCode: string;
}

const PAYMENT_METHODS = [
  { id: 'TELEBIRR', label: 'Telebirr', icon: '📱', desc: 'Pay with Telebirr mobile wallet' },
  { id: 'CBE_BIRR', label: 'CBE Birr', icon: '🏦', desc: 'Pay with CBE Birr' },
  { id: 'CHAPA', label: 'Chapa', icon: '💳', desc: 'Card, bank transfer & more' },
  { id: 'CASH', label: 'Cash', icon: '💵', desc: 'Pay at restaurant' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useT();
  const { items, restaurantId, restaurantName, tableNumber: scannedTable, getSubtotal, clearCart } = useCartStore();

  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [orderData, setOrderData] = useState<{ orderNumber: string; orderId: string } | null>(null);
  const [paymentUrl, setPaymentUrl] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: { tableId: '' }
  });

  const watchedArea = watch('deliveryArea');
  const watchedPromo = watch('promoCode');

  const subtotal = getSubtotal();

  // Fetch restaurant details
  useEffect(() => {
    if (!restaurantId) return;
    restaurantApi.getPublic(restaurantId).then((res) => {
      const rest = res.data.data;
      setDeliveryZones(rest.deliveryZones || []);
    }).catch(() => {});
    restaurantApi.getPublicTables(restaurantId).then((res) => {
      setTables(res.data.data || []);
    }).catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    if (orderType !== 'DELIVERY' || !watchedArea) { setDeliveryFee(0); return; }
    const zone = deliveryZones.find((z) => z.areas.includes(watchedArea));
    setDeliveryFee(zone?.deliveryFee || 50);
  }, [orderType, watchedArea, deliveryZones]);

  const handleApplyPromo = async () => {
    if (!watchedPromo || !restaurantId) return;
    try {
      const res = await paymentApi.validatePromo({ restaurantId, code: watchedPromo, orderTotal: subtotal });
      const { discount } = res.data.data;
      setPromoDiscount(discount);
      setPromoApplied(true);
      toast.success(`Promo applied! You save ${formatETB(discount)}`);
    } catch {
      toast.error('Invalid or expired promo code');
      setPromoDiscount(0);
      setPromoApplied(false);
    }
  };

  const taxAmount = (subtotal - promoDiscount) * 0.15;
  const total = subtotal - promoDiscount + deliveryFee + taxAmount;

  const onSubmit = async (data: CheckoutForm) => {
    if (!restaurantId) { toast.error('Restaurant not found'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    setLoading(true);
    try {
      const orderPayload = {
        restaurantId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        orderType,
        tableId: orderType === 'DINE_IN' && data.tableId ? data.tableId : undefined,
        deliveryAddress: orderType === 'DELIVERY' ? data.deliveryAddress : undefined,
        deliveryArea: orderType === 'DELIVERY' ? data.deliveryArea : undefined,
        notes: data.notes || undefined,
        promoCode: promoApplied ? data.promoCode : undefined,
        paymentMethod,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          variantId: item.selectedVariant?.id,
          selectedAddOns: item.selectedAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
          specialInstructions: item.specialInstructions,
        })),
      };

      const orderRes = await orderApi.create(orderPayload);
      const order = orderRes.data.data;
      setOrderData({ orderNumber: order.orderNumber, orderId: order.id });

      if (paymentMethod !== 'CASH') {
        const returnUrl = `${window.location.origin}/payment/callback?orderNumber=${order.orderNumber}`;
        const payRes = await paymentApi.initiate({
          orderId: order.id,
          method: paymentMethod,
          returnUrl,
        });
        const { checkoutUrl, referenceId } = payRes.data.data;

        if (paymentMethod === 'MOCK') {
          // Auto-confirm mock payment
          await paymentApi.confirmMock(referenceId);
          setStep('success');
          clearCart();
        } else if (checkoutUrl) {
          setPaymentUrl(checkoutUrl);
          setStep('payment');
        }
      } else {
        setStep('success');
        clearCart();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div>
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="font-bold text-gray-700 text-lg mb-2">{t('emptyCart')}</h2>
          <Button onClick={() => router.back()} variant="outline" size="lg">
            {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success' && orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-card-hover p-8 max-w-sm w-full text-center">
          <motion_like_div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </motion_like_div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed! 🎉</h2>
          <p className="text-gray-500 mb-1">Your order has been received</p>
          <div className="bg-gray-50 rounded-xl py-3 px-5 my-5">
            <p className="text-xs text-gray-500">Order Number</p>
            <p className="text-2xl font-bold text-primary-600 tracking-wider">{orderData.orderNumber}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {paymentMethod === 'CASH'
              ? 'Please prepare exact cash when your order arrives.'
              : 'Payment confirmed! Your order is being prepared.'}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/order-tracking/${orderData.orderNumber}`)}
              fullWidth size="lg"
            >
              Track Order
            </Button>
            <Button
              onClick={() => router.back()} variant="outline" fullWidth
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' && paymentUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Redirecting to Payment</h2>
          <p className="text-gray-500 text-sm mb-5">You're being redirected to {paymentMethod.replace('_', ' ')}</p>
          <a href={paymentUrl} className="block w-full bg-primary-500 text-white py-3 rounded-xl font-bold">
            Continue to Payment →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="font-bold text-gray-900">Checkout</h1>
          <p className="text-xs text-gray-500">{restaurantName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 pt-4 space-y-4 max-w-lg mx-auto">

        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" /> Your Information
          </h2>
          <div className="space-y-3">
            <Input
              label="Full Name" placeholder="Abebe Kebede" required fullWidth
              leftIcon={<User className="w-4 h-4" />}
              error={errors.customerName?.message}
              {...register('customerName', { required: 'Name is required' })}
            />
            <Input
              label="Phone Number" placeholder="09XXXXXXXX" required fullWidth
              leftIcon={<Phone className="w-4 h-4" />}
              hint="Used for order updates"
              error={errors.customerPhone?.message}
              {...register('customerPhone', {
                required: 'Phone is required',
                pattern: { value: /^(\+251|0)(9|7)\d{8}$/, message: 'Enter valid Ethiopian phone number' },
              })}
            />
            <Input
              label="Email (optional)" placeholder="you@email.com" fullWidth
              leftIcon={<Mail className="w-4 h-4" />}
              {...register('customerEmail')}
            />
          </div>
        </div>

        {/* Order Type */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-primary-500" /> Order Type
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as OrderType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={cn(
                  'py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center',
                  orderType === type
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {type === 'DINE_IN' ? '🍽️ Dine In' : type === 'TAKEAWAY' ? '🥡 Takeaway' : '🚚 Delivery'}
              </button>
            ))}
          </div>

          {/* Dine-in: table selector */}
          {orderType === 'DINE_IN' && (
            <div className="mt-3">
              {scannedTable ? (
                <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5 text-sm text-primary-700 font-semibold">
                  📍 Table {scannedTable} (from QR scan)
                </div>
              ) : (
                <select
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  {...register('tableId')}
                >
                  <option value="">Select table (optional)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>Table {t.tableNumber} ({t.capacity} seats)</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Delivery: address */}
          {orderType === 'DELIVERY' && (
            <div className="mt-3 space-y-3">
              <Input
                label="Delivery Address" placeholder="Bole, near Edna Mall" fullWidth required
                leftIcon={<MapPin className="w-4 h-4" />}
                error={errors.deliveryAddress?.message}
                {...register('deliveryAddress', { required: orderType === 'DELIVERY' ? 'Address is required' : false })}
              />
              {deliveryZones.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Delivery Area</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    {...register('deliveryArea')}
                  >
                    <option value="">Select area</option>
                    {deliveryZones.map((zone) =>
                      zone.areas.map((area) => (
                        <option key={area} value={area}>{area} — {formatETB(zone.deliveryFee)}</option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Notes */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <TextArea
            label="Order Notes (optional)"
            placeholder="Any special requests for the kitchen..."
            fullWidth
            {...register('notes')}
          />
        </div>

        {/* Promo Code */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary-500" /> Promo Code
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              fullWidth
              {...register('promoCode')}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyPromo}
              disabled={!watchedPromo || promoApplied}
            >
              {promoApplied ? '✓' : 'Apply'}
            </Button>
          </div>
          {promoApplied && (
            <p className="text-xs text-green-600 mt-1.5 font-medium">✓ Promo applied — saving {formatETB(promoDiscount)}</p>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary-500" /> Payment Method
          </h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                  paymentMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.desc}</p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  paymentMethod === method.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                )}>
                  {paymentMethod === method.id && <span className="w-2 h-2 rounded-full bg-white block" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary-500" /> Order Summary
          </h2>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                  <Image
                    src={item.menuItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop'}
                    alt={item.menuItem.name} fill className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.menuItem.name}</p>
                  {item.selectedVariant && (
                    <p className="text-xs text-gray-500">{item.selectedVariant.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatETB(item.totalPrice)}</p>
                  <p className="text-xs text-gray-400">×{item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatETB(subtotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promo Discount</span><span>-{formatETB(promoDiscount)}</span>
              </div>
            )}
            {orderType === 'DELIVERY' && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span><span>{deliveryFee > 0 ? formatETB(deliveryFee) : 'Free'}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (15%)</span><span>{formatETB(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 text-base">
              <span>Total</span><span className="text-primary-600">{formatETB(total)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" fullWidth size="xl" loading={loading} className="sticky bottom-4 shadow-food-card">
          Place Order — {formatETB(total)}
        </Button>
      </form>
    </div>
  );
}

// Avoid framer-motion in this file's SSR — simple div wrapper
function motion_like_div({ children }: { children: React.ReactNode }) {
  return <div className="animate-bounce-soft">{children}</div>;
}
