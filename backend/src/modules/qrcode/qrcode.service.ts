import QRCode from 'qrcode';
import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { generateQRCode } from '../../utils/helpers';
import { env } from '../../config/env';

export const qrCodeService = {
  async generateRestaurantQR(restaurantId: string, label?: string) {
    const code = generateQRCode();
    const url = `${env.FRONTEND_URL}/menu/${restaurantId}?qr=${code}`;

    const qr = await prisma.qRCode.create({
      data: { restaurantId, code, url, label: label || 'Restaurant QR' },
    });

    const qrImage = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    return { ...qr, qrImage };
  },

  async generateTableQR(restaurantId: string, tableId: string) {
    const table = await prisma.table.findFirst({ where: { id: tableId, restaurantId } });
    if (!table) throw new AppError('Table not found', 404);

    const code = generateQRCode();
    const url = `${env.FRONTEND_URL}/menu/${restaurantId}?table=${table.tableNumber}&qr=${code}`;

    const qr = await prisma.qRCode.create({
      data: {
        restaurantId,
        tableId,
        code,
        url,
        label: `Table ${table.tableNumber}`,
      },
    });

    const qrImage = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#ef7010', light: '#ffffff' },
    });

    return { ...qr, qrImage };
  },

  async getQRCodes(restaurantId: string) {
    return prisma.qRCode.findMany({
      where: { restaurantId, isActive: true },
      include: { table: { select: { tableNumber: true, capacity: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getQRCodeImage(code: string) {
    const qr = await prisma.qRCode.findUnique({ where: { code } });
    if (!qr || !qr.isActive) throw new AppError('QR code not found', 404);

    // Increment scan count
    await prisma.qRCode.update({ where: { id: qr.id }, data: { scanCount: { increment: 1 } } });

    const qrImage = await QRCode.toDataURL(qr.url, { width: 400, margin: 2 });
    return { ...qr, qrImage };
  },

  async deactivateQR(id: string, restaurantId: string) {
    return prisma.qRCode.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async generateAllTableQRs(restaurantId: string) {
    const tables = await prisma.table.findMany({
      where: { restaurantId, isActive: true },
    });

    const results = [];
    for (const table of tables) {
      const result = await this.generateTableQR(restaurantId, table.id);
      results.push(result);
    }
    return results;
  },
};
