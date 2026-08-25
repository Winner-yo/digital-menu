import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

export const menuService = {
  // ---- Categories ----
  async getCategories(restaurantId: string, includeItems = false) {
    return prisma.menuCategory.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: includeItems
        ? {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { sortOrder: 'asc' },
              include: { variants: true, addOns: true },
            },
          }
        : undefined,
    });
  },

  async createCategory(restaurantId: string, data: {
    name: string; nameAmharic?: string; description?: string; image?: string; sortOrder?: number;
  }) {
    return prisma.menuCategory.create({ data: { restaurantId, ...data } });
  },

  async updateCategory(id: string, restaurantId: string, data: Partial<{
    name: string; nameAmharic: string; description: string; image: string; sortOrder: number; isActive: boolean;
  }>) {
    return prisma.menuCategory.update({
      where: { id },
      data,
    });
  },

  async deleteCategory(id: string, restaurantId: string) {
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id, restaurantId } });
    if (itemCount > 0) throw new AppError('Cannot delete category with menu items. Move items first.', 400);
    return prisma.menuCategory.delete({ where: { id } });
  },

  // ---- Menu Items ----
  async getMenuItems(restaurantId: string, query: {
    categoryId?: string; search?: string; isAvailable?: boolean;
    isVegetarian?: boolean; isSpicy?: boolean; page?: number; limit?: number;
  }) {
    const { page = 1, limit = 50, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.menuItem.findMany>[0]['where'] = {
      restaurantId,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
      ...(filters.isVegetarian && { isVegetarian: true }),
      ...(filters.isSpicy && { isSpicy: true }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { nameAmharic: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, nameAmharic: true } },
          variants: { where: { isAvailable: true } },
          addOns: { where: { isAvailable: true } },
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  async getMenuItem(id: string, restaurantId: string) {
    const item = await prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: {
        category: true,
        variants: true,
        addOns: true,
        reviews: { where: { isPublished: true }, take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!item) throw new AppError('Menu item not found', 404);
    return item;
  },

  async createMenuItem(restaurantId: string, data: {
    categoryId: string; name: string; nameAmharic?: string; description?: string;
    descriptionAmharic?: string; price: number; discountedPrice?: number;
    image?: string; isVegetarian?: boolean; isVegan?: boolean; isSpicy?: boolean;
    spicyLevel?: number; preparationTime?: number; calories?: number;
    allergens?: string[]; tags?: string[]; sortOrder?: number;
    variants?: Array<{ name: string; nameAmharic?: string; priceExtra: number; isDefault?: boolean }>;
    addOns?: Array<{ name: string; nameAmharic?: string; price: number; maxQuantity?: number }>;
  }) {
    const { variants, addOns, ...itemData } = data;
    return prisma.menuItem.create({
      data: {
        restaurantId,
        ...itemData,
        variants: variants ? { create: variants } : undefined,
        addOns: addOns ? { create: addOns } : undefined,
      },
      include: { variants: true, addOns: true },
    });
  },

  async updateMenuItem(id: string, restaurantId: string, data: Record<string, unknown>) {
    const { variants, addOns, ...itemData } = data as {
      variants?: Array<{ id?: string; name: string; priceExtra: number }>;
      addOns?: Array<{ id?: string; name: string; price: number }>;
      [key: string]: unknown;
    };
    return prisma.menuItem.update({
      where: { id },
      data: itemData as Parameters<typeof prisma.menuItem.update>[0]['data'],
      include: { variants: true, addOns: true },
    });
  },

  async deleteMenuItem(id: string, restaurantId: string) {
    return prisma.menuItem.delete({ where: { id } });
  },

  async toggleAvailability(id: string, restaurantId: string) {
    const item = await prisma.menuItem.findFirst({ where: { id, restaurantId } });
    if (!item) throw new AppError('Menu item not found', 404);
    return prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
  },

  async getFullMenu(restaurantIdOrSlug: string) {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        isActive: true,
        OR: [{ id: restaurantIdOrSlug }, { slug: restaurantIdOrSlug }],
      },
      select: { id: true },
    });
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    const restaurantId = restaurant.id;

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }],
          include: {
            variants: { where: { isAvailable: true } },
            addOns: { where: { isAvailable: true } },
          },
        },
      },
    });

    const popularItems = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true, isPopular: true },
      take: 8,
      orderBy: { sortOrder: 'asc' },
      include: { category: { select: { name: true } } },
    });

    return { categories, popularItems };
  },
};
