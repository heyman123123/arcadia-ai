/**
 * /api/books/* API 客户端
 */

import { API_ROUTES } from '@arcadia/shared';
import type {
  BookInitRequest,
  BookInitResponse,
  GenerateElementRequest,
  GenerateElementResponse,
  SuggestKBEntryRequest,
  SuggestKBEntryResponse,
} from '@arcadia/shared';
import { request } from './client';

export const bookApi = {
  generateInit: (req: BookInitRequest) =>
    request<BookInitResponse>(API_ROUTES.book.generateInit, { body: req }),

  suggestKbEntry: (req: SuggestKBEntryRequest) =>
    request<SuggestKBEntryResponse>(API_ROUTES.book.suggestKbEntry, { body: req }),

  generateElement: (req: GenerateElementRequest) =>
    request<GenerateElementResponse>(API_ROUTES.book.generateElement, { body: req }),
};
