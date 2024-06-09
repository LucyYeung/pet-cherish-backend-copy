import express from 'express';

import { uploadImage } from '@controllers/upload';
import { imageUpload, uploadHandler } from '@middlewares/uploadHandler';
import { validateRequest } from '@middlewares/validateRequest';
import { uploadImageRequestSchema } from '@schema/upload';

const router = express.Router();

router.post(
  '/image',
  uploadHandler(imageUpload.single('file')),
  validateRequest(uploadImageRequestSchema),
  uploadImage
);

export default router;
