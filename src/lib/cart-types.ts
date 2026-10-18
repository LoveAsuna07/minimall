export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  active: boolean;
};

export type CartItemView = {
  id: string;
  quantity: number;
  product: CartProduct;
  subtotal: number;
  available: boolean;
};

export type CartView = {
  items: CartItemView[];
  total: number;
  count: number;
};
