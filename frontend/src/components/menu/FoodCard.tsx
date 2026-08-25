'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Plus, Clock, Flame, Leaf, Star, ShoppingCart, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { MenuItem, FoodVariant, FoodAddOn } from '@/types';
import { formatETB, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useT } from '@/i18n/useTranslation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface Props {
  item: MenuItem;
  restaurantId: string;
}

const FALLBACK_IMAGES: Record<string, string> = {
  'doro wot': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'tibs': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'kitfo': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop',
  'shiro': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
  'beyaynetu': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  'firfir': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
  'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
  'juice': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop',
  'default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
};

function getImageSrc(item: MenuItem): string {
  if (item.image) return item.image;
  const nameLower = item.name.toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
    if (nameLower.includes(key)) return url;
  }
  return FALLBACK_IMAGES.default;
}

export function FoodCard({ item, restaurantId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useT();
  const addItem = useCartStore((s) => s.addItem);

  const effectivePrice = item.discountedPrice || item.price;
  const hasDiscount = item.discountedPrice && item.discountedPrice < item.price;

  const handleQuickAdd = () => {
    if (!item.isAvailable) return;
    if ((item.variants?.length || 0) > 1 || (item.addOns?.length || 0) > 0) {
      setModalOpen(true);
    } else {
      addItem(item, 1, item.variants?.[0], []);
      toast.success(`${item.name} added to cart`, { icon: '🛒' });
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group',
          !item.isAvailable && 'opacity-60'
        )}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => item.isAvailable && setModalOpen(true)}>
          <Image
            src={getImageSrc(item)}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-hero" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {item.isBestseller && (
              <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" /> Bestseller
              </span>
            )}
            {item.isPopular && !item.isBestseller && (
              <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
          </div>

          {/* Top right badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {item.isVegetarian && (
              <span className="bg-green-500/90 text-white p-1 rounded-full" title="Vegetarian">
                <Leaf className="w-3 h-3" />
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-red-500/90 text-white p-1 rounded-full" title={`Spicy level ${item.spicyLevel}`}>
                <Flame className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Unavailable overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white/90 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                Not Available
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 flex-1">
              {item.name}
            </h3>
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          </div>

          {item.nameAmharic && (
            <p className="text-xs text-gray-400 font-amharic mb-1">{item.nameAmharic}</p>
          )}

          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-primary-600 text-base">{formatETB(effectivePrice)}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through ml-1">{formatETB(item.price)}</span>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {item.preparationTime} min
              </p>
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={!item.isAvailable}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                item.isAvailable
                  ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md active:scale-90'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      <FoodDetailModal
        item={item}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        restaurantId={restaurantId}
      />
    </>
  );
}

// ---- Food Detail Modal ----
function FoodDetailModal({ item, isOpen, onClose, restaurantId }: {
  item: MenuItem; isOpen: boolean; onClose: () => void; restaurantId: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<FoodVariant | undefined>(
    item.variants?.find((v) => v.isDefault) || item.variants?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<Array<FoodAddOn & { quantity: number }>>([]);
  const [instructions, setInstructions] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const effectivePrice = item.discountedPrice || item.price;
  const variantExtra = selectedVariant ? selectedVariant.priceExtra : 0;
  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price * a.quantity, 0);
  const unitPrice = effectivePrice + variantExtra + addOnTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddOn = (addOn: FoodAddOn) => {
    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => a.id === addOn.id);
      if (existing) return prev.filter((a) => a.id !== addOn.id);
      return [...prev, { ...addOn, quantity: 1 }];
    });
  };

  const handleAddToCart = () => {
    addItem(item, quantity, selectedVariant, selectedAddOns, instructions || undefined);
    toast.success(`${item.name} added to cart`, { icon: '🛒' });
    onClose();
    setQuantity(1);
    setInstructions('');
    setSelectedAddOns([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Image */}
      <div className="relative h-52 sm:h-64">
        <Image src={getImageSrc(item)} alt={item.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-1.5 flex-wrap">
            {item.isBestseller && (
              <Badge variant="warning" className="border-0 text-[10px]">⭐ Bestseller</Badge>
            )}
            {item.isVegetarian && <Badge variant="success" className="border-0 text-[10px]">🌿 Vegetarian</Badge>}
            {item.isVegan && <Badge variant="success" className="border-0 text-[10px]">🌱 Vegan</Badge>}
            {item.isSpicy && (
              <Badge variant="danger" className="border-0 text-[10px]">
                {'🌶️'.repeat(Math.min(item.spicyLevel, 3))} Spicy
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Title & price */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
          {item.nameAmharic && <p className="text-sm text-gray-400 font-amharic">{item.nameAmharic}</p>}
          {item.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-2xl font-bold text-primary-600">{formatETB(effectivePrice)}</span>
            {item.discountedPrice && item.discountedPrice < item.price && (
              <span className="text-base text-gray-400 line-through">{formatETB(item.price)}</span>
            )}
            <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {item.preparationTime} min
            </span>
          </div>
        </div>

        {/* Variants */}
        {item.variants && item.variants.filter((v) => v.isAvailable).length > 1 && (
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Size / Variant</p>
            <div className="grid grid-cols-2 gap-2">
              {item.variants.filter((v) => v.isAvailable).map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-sm text-left transition-all',
                    selectedVariant?.id === variant.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="font-medium">{variant.name}</span>
                  {variant.priceExtra > 0 && (
                    <span className="block text-xs text-gray-500">+{formatETB(variant.priceExtra)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {item.addOns && item.addOns.filter((a) => a.isAvailable).length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Add-ons (optional)</p>
            <div className="space-y-2">
              {item.addOns.filter((a) => a.isAvailable).map((addOn) => {
                const selected = selectedAddOns.some((a) => a.id === addOn.id);
                return (
                  <button
                    key={addOn.id}
                    onClick={() => toggleAddOn(addOn)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all',
                      selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="text-sm font-medium text-gray-700">{addOn.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary-600 font-semibold">+{formatETB(addOn.price)}</span>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        selected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                      )}>
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special instructions */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Special Instructions</p>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="E.g. less spicy, no onion..."
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 placeholder:text-gray-400"
            rows={2}
          />
        </div>

        {/* Quantity + Add to cart */}
        <div className="flex items-center gap-4 pt-2">
          {/* Qty picker */}
          <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-lg font-bold transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            fullWidth
            size="lg"
            leftIcon={<ShoppingCart className="w-5 h-5" />}
          >
            Add — {formatETB(totalPrice)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
