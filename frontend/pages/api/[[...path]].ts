import type { NextApiRequest, NextApiResponse } from 'next';
import { createApp } from '../../../backend/src/app';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const app = createApp();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}
