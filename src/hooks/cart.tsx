import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketplace:products');

      if (response) {
        setProducts(JSON.parse(response));
      }
    }

    loadProducts();
  }, []);

  // increment item quantity
  const increment = useCallback(
    async id => {
      const productItem = products.find(item => item.id === id);
      const cartItens = products.filter(item => item.id !== id);

      if (productItem) {
        productItem.quantity += 1;
        setProducts([...cartItens, productItem]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  // decrement item quantity
  const decrement = useCallback(
    async id => {
      const productItem = products.find(item => item.id === id);
      const cartItens = products.filter(item => item.id !== id);

      if (productItem) {
        if (productItem.quantity <= 1) {
          setProducts(cartItens);
        } else {
          productItem.quantity -= 1;
          setProducts([...cartItens, productItem]);
        }
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const newProduct = products.findIndex(item => item.id === product.id);

      if (newProduct < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
