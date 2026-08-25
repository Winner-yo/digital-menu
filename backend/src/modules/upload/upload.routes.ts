import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { sendSuccess, sendError } from '../../utils/response';
import path from 'path';
import { env } from '../../config/env';

const router = Router();

router.post('/:type', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { sendError(res, 'No file uploaded', 400); return; }

    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.params.type}/${req.file.filename}`;

    sendSuccess(res, {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'File uploaded');
  } catch (err) { next(err); }
});

export default router;
