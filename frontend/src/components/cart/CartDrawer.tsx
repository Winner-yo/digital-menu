'use client';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { formatETB, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getSubtotal, getItemCount, restaurantSlug } = useCartStore();
  const subtotal = getSubtotal();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full sm:max-w-sm bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-500" />
                <h2 className="font-bold text-gray-900 text-lg">Your Cart</h2>
                {getItemCount() > 0 && (
                  <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-9 h-9 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-600">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-200 relative">
                        <Image
                          src={item.menuItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'}
                          alt={item.menuItem.name}
                          fill className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{item.menuItem.name}</p>
                        {item.selectedVariant && (
                          <p className="text-xs text-gray-500">{item.selectedVariant.name}</p>
                        )}
                        {item.selectedAddOns.length > 0 && (
                          <p className="text-xs text-gray-400 line-clamp-1">
                            +{item.selectedAddOns.map((a) => a.name).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-gray-400 italic line-clamp-1">"{item.specialInstructions}"</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {/* Qty */}
                          <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary-600 text-sm">{formatETB(item.totalPrice)}</span>
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-5 pt-4 pb-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span className="font-semibold text-gray-900">{formatETB(subtotal)}</span>
                </div>
                <p className="text-xs text-gray-400 text-center">Delivery fee & taxes calculated at checkout</p>
                <Button onClick={handleCheckout} fullWidth size="lg">
                  Proceed to Checkout — {formatETB(subtotal)}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
