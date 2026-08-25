import { prisma } from '../../prisma/client';
import { OrderStatus, OrderType } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format, startOfWeek, startOfMonth } from 'date-fns';

export const analyticsService = {
  async getDashboardOverview(restaurantId: string) {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const yesterdayEnd = endOfDay(subDays(new Date(), 1));

    const [
      todayStats,
      yesterdayStats,
      pendingOrders,
      preparingOrders,
      popularItems,
      unavailableItems,
      recentReviews,
    ] = await Promise.all([
      // Today
      prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: today, lte: todayEnd } },
        _count: { id: true },
        _sum: { total: true },
      }),
      // Yesterday
      prisma.order.aggregate({
        where: { restaurantId, createdAt: { gte: yesterday, lte: yesterdayEnd } },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { restaurantId, status: OrderStatus.PENDING } }),
      prisma.order.count({
        where: { restaurantId, status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] } },
      }),
      // Popular items (by order count last 30 days)
      prisma.orderItem.groupBy({
        by: ['menuItemId', 'menuItemName'],
        where: {
          order: {
            restaurantId,
            createdAt: { gte: subDays(new Date(), 30) },
            status: { not: OrderStatus.CANCELLED },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 8,
      }),
      // Unavailable items
      prisma.menuItem.count({ where: { restaurantId, isAvailable: false } }),
      prisma.review.findMany({
        where: { restaurantId, isPublished: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { rating: true, comment: true, createdAt: true, target: true },
      }),
    ]);

    const revenueChange =
      yesterdayStats._sum.total && yesterdayStats._sum.total > 0
        ? (((todayStats._sum.total || 0) - yesterdayStats._sum.total) / yesterdayStats._sum.total) * 100
        : 0;

    return {
      today: {
        orders: todayStats._count.id,
        revenue: todayStats._sum.total || 0,
      },
      yesterday: {
        orders: yesterdayStats._count.id,
        revenue: yesterdayStats._sum.total || 0,
      },
      revenueChange: Math.round(revenueChange * 10) / 10,
      pendingOrders,
      preparingOrders,
      popularItems: popularItems.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.menuItemName,
        orderCount: i._sum.quantity || 0,
      })),
      unavailableItems,
      recentReviews,
    };
  },

  async getSalesData(restaurantId: string, period: 'week' | 'month' | 'year' = 'week') {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;
    let days: number;

    switch (period) {
      case 'month':
        startDate = startOfMonth(now);
        groupFormat = 'yyyy-MM-dd';
        days = 30;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = 'yyyy-MM';
        days = 365;
        break;
      default: // week
        startDate = startOfWeek(now);
        groupFormat = 'yyyy-MM-dd';
        days = 7;
        break;
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate },
        status: { not: OrderStatus.CANCELLED },
      },
      select: { createdAt: true, total: true, orderType: true },
    });

    // Build daily/monthly data
    const dataMap = new Map<string, { revenue: number; orders: number; dineIn: number; takeaway: number; delivery: number }>();

    for (let i = 0; i < (period === 'year' ? 12 : days); i++) {
      const date = period === 'year'
        ? format(new Date(now.getFullYear(), i, 1), groupFormat)
        : format(subDays(now, (period === 'week' ? 6 : days - 1) - i), groupFormat);
      dataMap.set(date, { revenue: 0, orders: 0, dineIn: 0, takeaway: 0, delivery: 0 });
    }

    orders.forEach((order) => {
      const key = format(order.createdAt, groupFormat);
      const existing = dataMap.get(key);
      if (existing) {
        existing.revenue += order.total;
        existing.orders += 1;
        if (order.orderType === OrderType.DINE_IN) existing.dineIn += 1;
        if (order.orderType === OrderType.TAKEAWAY) existing.takeaway += 1;
        if (order.orderType === OrderType.DELIVERY) existing.delivery += 1;
      }
    });

    return Array.from(dataMap.entries()).map(([date, data]) => ({
      date,
      ...data,
      revenue: Math.round(data.revenue * 100) / 100,
    }));
  },

  async getPaymentBreakdown(restaurantId: string) {
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        restaurantId,
        status: 'PAID',
        paidAt: { gte: subDays(new Date(), 30) },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    return payments.map((p) => ({
      method: p.method,
      count: p._count.id,
      total: p._sum.amount || 0,
    }));
  },

  async getTopItems(restaurantId: string, limit = 10) {
    return prisma.orderItem.groupBy({
      by: ['menuItemId', 'menuItemName'],
      where: {
        order: {
          restaurantId,
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: subDays(new Date(), 30) },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
  },

  async getAverageRating(restaurantId: string) {
    const stats = await prisma.review.aggregate({
      where: { restaurantId, isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      average: Math.round((stats._avg.rating || 0) * 10) / 10,
      total: stats._count.id,
    };
  },
};
