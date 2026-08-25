import { Router, Request, Response, NextFunction } from 'express';
import { qrCodeService } from './qrcode.service';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendCreated } from '../../utils/response';

const router = Router();

router.post('/restaurant', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label } = req.body;
    const result = await qrCodeService.generateRestaurantQR(req.user!.restaurantId!, label);
    sendCreated(res, result, 'QR code generated');
  } catch (err) { next(err); }
});

router.post('/table/:tableId', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await qrCodeService.generateTableQR(req.user!.restaurantId!, req.params.tableId);
    sendCreated(res, result, 'Table QR code generated');
  } catch (err) { next(err); }
});

router.post('/tables/all', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await qrCodeService.generateAllTableQRs(req.user!.restaurantId!);
    sendSuccess(res, result, 'All table QR codes generated');
  } catch (err) { next(err); }
});

router.get('/', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const qrcodes = await qrCodeService.getQRCodes(req.user!.restaurantId!);
    sendSuccess(res, qrcodes);
  } catch (err) { next(err); }
});

router.get('/scan/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await qrCodeService.getQRCodeImage(req.params.code);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await qrCodeService.deactivateQR(req.params.id, req.user!.restaurantId!);
    sendSuccess(res, null, 'QR code deactivated');
  } catch (err) { next(err); }
});

export default router;
