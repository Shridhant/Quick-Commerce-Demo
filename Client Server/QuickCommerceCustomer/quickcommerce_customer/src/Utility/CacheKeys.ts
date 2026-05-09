export const productDetailKey = (productId: string) =>
  `product:detail:${productId}`;

export const productSuggestionKey = (keyword: string) =>
  `product:suggestion:${keyword.toLowerCase().trim()}`;

export const productSearchKey = (keyword: string, page: number, limit: number) =>
  `product:search:${keyword.toLowerCase().trim()}:${page}:${limit}`;
