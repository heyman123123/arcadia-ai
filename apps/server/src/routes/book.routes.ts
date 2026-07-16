/**
 * /api/books/* 路由
 */

import { Router } from 'express';
import { validate } from '../middleware/validate';
import { bookController } from '../controllers/book.controller';
import {
  bookInitSchema,
  suggestKbEntrySchema,
  generateElementSchema,
} from '../schemas';

export const bookRouter = Router();

bookRouter.post('/generate-init', validate(bookInitSchema), bookController.generateInit);
bookRouter.post('/suggest-kb-entry', validate(suggestKbEntrySchema), bookController.suggestKbEntry);
bookRouter.post('/generate-element', validate(generateElementSchema), bookController.generateElement);
