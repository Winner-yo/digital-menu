import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { slugify } from '../../utils/helpers';

export const restaurantService = {
  async getPublicProfile(slug: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, isActive: true },
      include: {
        openingHours: { orderBy: { day: 'asc' } },
        announcements: {
          where: {
            isActive: true,
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        deliveryZones: { where: { isActive: true } },
      },
    });
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    const reviewStats = await prisma.review.aggregate({
      where: { restaurantId: restaurant.id, isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      ...restaurant,
      rating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
      reviewCount: reviewStats._count.id,
    };
  },

  async getDashboardProfile(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        openingHours: { orderBy: { day: 'asc' } },
        deliveryZones: true,
        branches: true,
        _count: { select: { menuItems: true, orders: true } },
      },
    });
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    return restaurant;
  },

  async updateProfile(restaurantId: string, data: Record<string, unknown>) {
    const { openingHours, deliveryZones, ...restaurantData } = data as {
      openingHours?: Array<{ day: string; openTime: string; closeTime: string; isClosed: boolean }>;
      deliveryZones?: Array<{ id?: string; name: string; areas: string[]; deliveryFee: number; minimumOrder: number; estimatedTime: number }>;
      [key: string]: unknown;
    };

    return prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.update({
        where: { id: restaurantId },
        data: restaurantData as Parameters<typeof tx.restaurant.update>[0]['data'],
      });

      if (openingHours) {
        for (const hour of openingHours) {
          await tx.openingHour.upsert({
            where: { restaurantId_day: { restaurantId, day: hour.day as never } },
            create: { restaurantId, ...hour, day: hour.day as never },
            update: { openTime: hour.openTime, closeTime: hour.closeTime, isClosed: hour.isClosed },
          });
        }
      }

      if (deliveryZones) {
        // Upsert delivery zones
        for (const zone of deliveryZones) {
          if (zone.id) {
            await tx.deliveryZone.update({ where: { id: zone.id }, data: zone });
          } else {
            await tx.deliveryZone.create({ data: { restaurantId, ...zone } });
          }
        }
      }

      return restaurant;
    });
  },

  async getRestaurantsByOwner(userId: string) {
    return prisma.restaurantUser.findMany({
      where: { userId, isActive: true },
      include: {
        restaurant: {
          include: { _count: { select: { menuItems: true, orders: true } } },
        },
      },
    });
  },

  async getTables(restaurantId: string) {
    return prisma.table.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { tableNumber: 'asc' },
    });
  },

  async createTable(restaurantId: string, tableNumber: string, capacity: number) {
    return prisma.table.create({
      data: { restaurantId, tableNumber, capacity },
    });
  },
};
