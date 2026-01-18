'use client';
import React from 'react';

type ViewMode = 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'list';
type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'newest';

interface ProductVariant {
  _id: string;
  title: string;
  slug: { current: string };
  isActive: boolean;
  weight: number;
}

const ProductGrid = () => {
  const [products, setProducts] = useState<ALL_PRODUCTS_QUERY_RESULT>([]);
  const [filteredProducts, setFilteredProducts] =
    useState<ALL_PRODUCTS_QUERY_RESULT>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [productsByVariant, setProductsByVariant] = useState<
    Record<string, ALL_PRODUCTS_QUERY_RESULT>
  >({});
  const [loading, setLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [carouselsLoading, setCarouselsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid-5');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [productsPerPage] = useState(20);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [stockStatus, setStockStatus] = useState<string>('all');
  const [rating, setRating] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  return <div>ProductGrid</div>;
};

export default ProductGrid;
