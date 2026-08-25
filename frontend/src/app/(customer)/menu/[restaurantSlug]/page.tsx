'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search, ShoppingCart, MapPin, Phone, Clock, Star,
  ChevronDown, Filter, Leaf, Flame, Bell, X, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useT } from '@/i18n/useTranslation';
import { FoodCard } from '@/components/menu/FoodCard';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { formatETB, isRestaurantOpen, cn } from '@/lib/utils';
import { menuApi, restaurantApi } from '@/lib/api';
import type { Restaurant, MenuCategory, MenuItem, Announcement } from '@/types';

const CATEGORY_ALL = '__all__';

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.restaurantSlug as string;
  const tableNumber = searchParams.get('table');
  const qrCode = searchParams.get('qr');

  const { t, lang, setLang } = useT();
  const setRestaurant = useCartStore((s) => s.setRestaurant);
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const cartCount = useCartStore((s) => s.getItemCount());

  const [restaurant, setRestaurant2] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ALL);
  const [search, setSearch] = useState('');
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterSpicy, setFilterSpicy] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tableNumber) setTableNumber(tableNumber);
  }, [tableNumber, setTableNumber]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [restRes, menuRes] = await Promise.all([
          restaurantApi.getPublic(slug),
          menuApi.getFullMenu(slug),  // uses slug as id fallback
        ]);
        const rest: Restaurant = restRes.data.data;
        setRestaurant2(rest);
        setRestaurant(rest.id, rest.slug, rest.name);
        const { categories: cats } = menuRes.data.data;
        setCategories(cats);
        const items = cats.flatMap((c: MenuCategory) => c.menuItems || []);
        setAllItems(items);
      } catch {
        // Try using slug as restaurantId fallback for demo
        try {
          const menuRes = await menuApi.getFullMenu(slug);
          const { categories: cats } = menuRes.data.data;
          setCategories(cats);
          setAllItems(cats.flatMap((c: MenuCategory) => c.menuItems || []));
        } catch {
          setError('Restaurant not found');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, setRestaurant]);

  // Rotate announcements
  useEffect(() => {
    if (!restaurant?.announcements?.length) return;
    const timer = setInterval(() => {
      setAnnouncementIndex((i) => (i + 1) % restaurant.announcements!.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [restaurant?.announcements]);

  const filteredItems = useCallback((): MenuItem[] => {
    let items = activeCategory === CATEGORY_ALL
      ? allItems
      : categories.find((c) => c.id === activeCategory)?.menuItems || [];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.nameAmharic?.includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }
    if (filterVeg) items = items.filter((i) => i.isVegetarian || i.isVegan);
    if (filterSpicy) items = items.filter((i) => i.isSpicy);
    return items;
  }, [allItems, categories, activeCategory, search, filterVeg, filterSpicy]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    if (catId !== CATEGORY_ALL && categoryRefs.current[catId]) {
      categoryRefs.current[catId]!.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const popularItems = allItems.filter((i) => i.isPopular && i.isAvailable).slice(0, 6);
  const isOpen = restaurant ? isRestaurantOpen(restaurant.openingHours || []) : true;
  const items = filteredItems();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <div>
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ---- HERO HEADER ---- */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-52 sm:h-64 relative overflow-hidden bg-gray-800">
          <Image
            src={restaurant?.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop'}
            alt={restaurant?.name || 'Restaurant'}
            fill className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
        </div>

        {/* Logo + info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex items-end gap-3">
            <div className="w-16 h-16 rounded-2xl border-3 border-white shadow-lg overflow-hidden bg-white shrink-0 relative">
              <Image
                src={restaurant?.logo || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100&h=100&fit=crop'}
                alt="Logo" fill className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-xl leading-tight drop-shadow-md">
                {loading ? '...' : restaurant?.name || slug}
              </h1>
              {restaurant?.nameAmharic && (
                <p className="text-white/80 text-sm font-amharic">{restaurant.nameAmharic}</p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
                  isOpen ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full bg-white', isOpen && 'animate-pulse')} />
                  {isOpen ? t('openNow') : t('closedNow')}
                </span>
                {restaurant?.address && (
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{restaurant.city}
                  </span>
                )}
              </div>
            </div>

            {/* Lang toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
              className="shrink-0 bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              {lang === 'en' ? 'አማ' : 'EN'}
            </button>
          </div>
        </div>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="absolute top-4 right-4 bg-white rounded-xl p-2.5 shadow-lg flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          {cartCount > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Table number banner */}
      {tableNumber && (
        <div className="bg-primary-500 text-white text-center py-2 text-sm font-semibold">
          🍽️ Table {tableNumber} — Dine-in Order
        </div>
      )}

      {/* Announcement banner */}
      {showAnnouncement && restaurant?.announcements && restaurant.announcements.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={announcementIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2"
          >
            <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">
                {lang === 'am' ? restaurant.announcements[announcementIndex].titleAmharic : restaurant.announcements[announcementIndex].title}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {lang === 'am' ? restaurant.announcements[announcementIndex].bodyAmharic : restaurant.announcements[announcementIndex].body}
              </p>
            </div>
            <button onClick={() => setShowAnnouncement(false)} className="p-0.5 text-amber-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ---- SEARCH + FILTERS ---- */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory(CATEGORY_ALL); }}
              placeholder={t('searchFood')}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setFilterVeg(!filterVeg)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                filterVeg ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200'
              )}
            >
              <Leaf className="w-3 h-3" /> Veg
            </button>
            <button
              onClick={() => setFilterSpicy(!filterSpicy)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                filterSpicy ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'
              )}
            >
              <Flame className="w-3 h-3" /> Spicy
            </button>
          </div>
        </div>

        {/* Category nav */}
        {!loading && (
          <div ref={navRef} className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => scrollToCategory(CATEGORY_ALL)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border',
                activeCategory === CATEGORY_ALL
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              )}
            >
              {t('allCategories')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap',
                  activeCategory === cat.id
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                )}
              >
                {lang === 'am' && cat.nameAmharic ? cat.nameAmharic : cat.name}
                <span className="ml-1 text-[10px] opacity-60">({cat.menuItems?.length || 0})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : search || filterVeg || filterSpicy ? (
          /* Search results */
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {items.length} result{items.length !== 1 ? 's' : ''} found
            </p>
            {items.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-gray-600">{t('noItems')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((item) => (
                  <FoodCard key={item.id} item={item} restaurantId={restaurant?.id || slug} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Full menu by category */
          <>
            {/* Popular section */}
            {popularItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⭐</span>
                  <h2 className="font-bold text-gray-900 text-base">{t('popular')}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {popularItems.map((item) => (
                    <FoodCard key={item.id} item={item} restaurantId={restaurant?.id || slug} />
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            {categories.map((category) => {
              const catItems = category.menuItems || [];
              if (catItems.length === 0) return null;
              return (
                <section
                  key={category.id}
                  ref={(el) => { categoryRefs.current[category.id] = el; }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="font-bold text-gray-900 text-base">
                        {lang === 'am' && category.nameAmharic ? category.nameAmharic : category.name}
                      </h2>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{catItems.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {catItems.map((item) => (
                      <FoodCard key={item.id} item={item} restaurantId={restaurant?.id || slug} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        {/* Restaurant info footer */}
        {restaurant && (
          <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
            <h3 className="font-bold text-gray-900">About {restaurant.name}</h3>
            {restaurant.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{restaurant.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 text-primary-600">
                  <Phone className="w-4 h-4" />{restaurant.phone}
                </a>
              )}
              {restaurant.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />{restaurant.address}
                </span>
              )}
            </div>
            {restaurant.openingHours && restaurant.openingHours.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {t('openingHours')}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {restaurant.openingHours.map((h) => (
                    <div key={h.day} className="flex justify-between text-xs text-gray-500">
                      <span className="capitalize">{h.day.slice(0, 3)}</span>
                      <span className="font-medium">{h.isClosed ? 'Closed' : `${h.openTime}–${h.closeTime}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom cart bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-5 pt-2 safe-bottom"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-food-card transition-all active:scale-98"
            >
              <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">{cartCount}</span>
              <span className="font-bold text-base">View Cart</span>
              <ShoppingCart className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
