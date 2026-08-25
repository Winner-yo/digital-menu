import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { generateOrderNumber } from '../../utils/helpers';
import { OrderStatus, OrderType, PaymentMethod } from '@prisma/client';

export interface CreateOrderDto {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  notes?: string;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  items: Array<{
    menuItemId: string;
    quantity: number;
    variantId?: string;
    selectedAddOns?: Array<{ id: string; name: string; price: number }>;
    specialInstructions?: string;
  }>;
}

export const orderService = {
  async createOrder(dto: CreateOrderDto) {
    // 1. Validate restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: dto.restaurantId, isActive: true },
    });
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    // 2. Validate and price items
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: dto.restaurantId, isAvailable: true },
      include: { variants: true, addOns: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new AppError('One or more items are unavailable', 400);
    }

    // 3. Calculate prices
    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
      let unitPrice = menuItem.discountedPrice || menuItem.price;

      if (item.variantId) {
        const variant = menuItem.variants.find((v) => v.id === item.variantId);
        if (variant) unitPrice += variant.priceExtra;
      }

      const addOnTotal = (item.selectedAddOns || []).reduce((sum, a) => sum + a.price, 0);
      unitPrice += addOnTotal;

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      return {
        menuItemId: item.menuItemId,
        menuItemName: menuItem.name,
        menuItemImage: menuItem.image,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        variantId: item.variantId,
        variantName: item.variantId
          ? menuItem.variants.find((v) => v.id === item.variantId)?.name
          : null,
        selectedAddOns: item.selectedAddOns || [],
        specialInstructions: item.specialInstructions,
      };
    });

    // 4. Apply promo code
    let discountAmount = 0;
    if (dto.promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          restaurantId: dto.restaurantId,
          code: dto.promoCode.toUpperCase(),
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          OR: [{ usageLimit: null }, { usageLimit: { gt: prisma.promoCode.fields.usageCount } }],
        } as Parameters<typeof prisma.promoCode.findFirst>[0]['where'],
      });

      if (promo) {
        if (subtotal >= promo.minimumOrder) {
          if (promo.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * promo.discountValue) / 100;
            if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
          } else {
            discountAmount = promo.discountValue;
          }
          await prisma.promoCode.update({
            where: { id: promo.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    // 5. Calculate delivery fee
    let deliveryFee = 0;
    if (dto.orderType === OrderType.DELIVERY && dto.deliveryArea) {
      const zone = await prisma.deliveryZone.findFirst({
        where: {
          restaurantId: dto.restaurantId,
          areas: { has: dto.deliveryArea },
          isActive: true,
        },
      });
      deliveryFee = zone?.deliveryFee || restaurant.minimumOrderAmount > 0 ? 0 : 50;
    }

    // 6. Tax and service charge
    const taxAmount = (subtotal - discountAmount) * (restaurant.taxRate / 100);
    const serviceChargeAmount = (subtotal - discountAmount) * (restaurant.serviceCharge / 100);
    const total = subtotal - discountAmount + deliveryFee + taxAmount + serviceChargeAmount;

    // 7. Create order
    const orderNumber = generateOrderNumber();

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: dto.customerPhone },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: dto.customerName,
          phone: dto.customerPhone,
          email: dto.customerEmail,
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId: dto.restaurantId,
        customerId: customer.id,
        tableId: dto.tableId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        orderType: dto.orderType,
        subtotal,
        discountAmount,
        deliveryFee,
        taxAmount,
        serviceCharge: serviceChargeAmount,
        total,
        notes: dto.notes,
        deliveryAddress: dto.deliveryAddress,
        deliveryArea: dto.deliveryArea,
        promoCode: dto.promoCode,
        items: { create: orderItems },
        statusHistory: {
          create: { status: OrderStatus.PENDING, note: 'Order placed' },
        },
      },
      include: {
        items: true,
        payment: true,
        table: { select: { tableNumber: true } },
      },
    });

    return order;
  },

  async getOrder(orderNumber: string, restaurantId?: string) {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        ...(restaurantId && { restaurantId }),
      },
      include: {
        items: true,
        payment: true,
        table: { select: { tableNumber: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        restaurant: { select: { name: true, logo: true, phone: true } },
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    return order;
  },

  async getRestaurantOrders(restaurantId: string, query: {
    status?: OrderStatus; orderType?: OrderType; page?: number; limit?: number;
    date?: string; search?: string;
  }) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const dateFilter = filters.date
      ? {
          gte: new Date(filters.date + 'T00:00:00'),
          lte: new Date(filters.date + 'T23:59:59'),
        }
      : undefined;

    const where: Parameters<typeof prisma.order.findMany>[0]['where'] = {
      restaurantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.orderType && { orderType: filters.orderType }),
      ...(dateFilter && { createdAt: dateFilter }),
      ...(filters.search && {
        OR: [
          { orderNumber: { contains: filters.search, mode: 'insensitive' } },
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { customerPhone: { contains: filters.search } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { menuItemName: true, quantity: true, totalPrice: true } },
          payment: { select: { status: true, method: true } },
          table: { select: { tableNumber: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  },

  async updateOrderStatus(orderId: string, restaurantId: string, status: OrderStatus, note?: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, restaurantId } });
    if (!order) throw new AppError('Order not found', 404);

    const timestampFields: Partial<Record<string, Date>> = {};
    if (status === OrderStatus.CONFIRMED) timestampFields.confirmedAt = new Date();
    if (status === OrderStatus.PREPARING) timestampFields.preparingAt = new Date();
    if (status === OrderStatus.READY) timestampFields.readyAt = new Date();
    if (status === OrderStatus.COMPLETED) timestampFields.completedAt = new Date();
    if (status === OrderStatus.CANCELLED) timestampFields.cancelledAt = new Date();
    if (status === OrderStatus.OUT_FOR_DELIVERY) timestampFields.deliveredAt = new Date();

    return prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status, ...timestampFields },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId, status, note },
      }),
    ]);
  },

  async getDashboardStats(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayOrders,
      pendingOrders,
      preparingOrders,
      recentOrders,
      todayRevenue,
    ] = await Promise.all([
      prisma.order.count({
        where: { restaurantId, createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.count({ where: { restaurantId, status: OrderStatus.PENDING } }),
      prisma.order.count({
        where: { restaurantId, status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] } },
      }),
      prisma.order.findMany({
        where: { restaurantId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { menuItemName: true, quantity: true } },
          payment: { select: { status: true, method: true } },
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId,
          status: OrderStatus.COMPLETED,
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      todayOrders,
      pendingOrders,
      preparingOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      recentOrders,
    };
  },
};
