# Product Variant Pages Feature

This feature creates beautiful, fully-functional product variant pages that display products grouped by their variant types (e.g., Vegetables, Fruits, Dairy, etc.).

## 🎯 Features

### ✨ Beautiful UI Components

- **Hero Section**: Eye-catching gradient header with variant information
- **Product Grid/List Toggle**: Switch between grid and list view modes
- **Advanced Filtering**: Filter products by price range
- **Smart Sorting**: Multiple sort options (name, price, rating)
- **Responsive Design**: Perfect display on all screen sizes
- **Skeleton Loading**: Smooth loading states with animated skeletons
- **404 Handling**: Custom not-found page for invalid variant slugs

### 🚀 Performance Optimized

- **Data Caching**: Variant and product data cached with `unstable_cache`
- **Lazy Loading**: Images and components load on demand
- **Optimistic UI**: Smooth animations with Framer Motion
- **SEO Optimized**: Custom metadata for each variant page

## 📁 File Structure

```
app/(client)/products/[slug]/
├── page.tsx              # Main variant page component
├── loading.tsx           # Loading skeleton
└── not-found.tsx         # 404 page

components/productsVariant/
├── ProductVariantClient.tsx   # Client-side product display
└── index.ts                   # Export file

sanity/queries/
├── query.ts              # GROQ queries for variants
└── index.ts              # Cached query functions
```

## 🔧 Usage

### Accessing Variant Pages

Visit any variant page using the URL pattern:

```
/products/[variant-slug]
```

Example:

```
/products/vegetables
/products/fruits
/products/dairy-products
```

### Component Usage

The `ProductTypeCarousel` component automatically links to variant pages:

```tsx
<ProductTypeCarousel
  variantId={variant._id}
  variantTitle={variant.title}
  variantSlug={variant.slug.current}
  products={variantProducts}
/>
```

The "View More" button navigates to `/products/${variantSlug}`.

## 🎨 Design Features

### Color Scheme

- **Primary Green**: `#3B9C3C` (gofarm-green)
- **Light Green**: `#00A844` (gofarm-light-green)
- **Orange**: `#FE8F18` (gofarm-orange)
- **Light Orange**: Accent backgrounds

### Key UI Elements

1. **Gradient Header**

   - Linear gradient from green to light-green
   - Displays variant title, description, and product count
   - Fully responsive typography

2. **Filter Bar**

   - View mode toggle (Grid/List)
   - Sort dropdown (Name, Price, Rating)
   - Price range filter
   - Mobile-responsive with collapsible filters

3. **Product Display**
   - Grid view: 1-4 columns based on screen size
   - List view: Horizontal cards with full details
   - Smooth animations on filter/sort changes
   - Empty state with helpful messaging

## 📊 Data Flow

### 1. Sanity CMS Queries

**PRODUCTS_BY_VARIANT_QUERY**

```groq
*[_type == "product" && variant->slug.current == $variantSlug] | order(name asc) {
  ...,
  variant->{...},
  brand->{...},
  categories[]->{...},
  "averageRating": math::avg(...),
  "totalReviews": count(...)
}
```

**VARIANT_BY_SLUG_QUERY**

```groq
*[_type == "productVariant" && slug.current == $slug][0]{
  ...,
  "productCount": count(...)
}
```

### 2. Caching Strategy

- **Variants**: 30-minute cache (1800s)
- **Products**: 10-minute cache (600s)
- **Cache Tags**: `['products', 'variants']`

### 3. Server Components

The main page (`page.tsx`) is a React Server Component that:

1. Fetches variant metadata
2. Fetches all products for that variant
3. Generates dynamic metadata for SEO
4. Passes data to client component

### 4. Client Components

`ProductVariantClient` handles:

- View mode switching
- Sorting logic
- Price filtering
- UI interactions
- Animations

## 🔍 SEO Optimization

Each variant page includes:

- Custom page title
- Meta description
- Open Graph tags
- Structured breadcrumbs
- Semantic HTML

Example metadata:

```tsx
{
  title: "Organic Vegetables - GoFarm",
  description: "Browse our fresh organic vegetables collection",
  openGraph: {
    title: "Organic Vegetables - GoFarm",
    description: "Browse our fresh organic vegetables collection",
    images: [...]
  }
}
```

## 🎯 Filtering & Sorting

### Price Ranges

- All Prices
- Under $10
- $10 - $50
- $50 - $100
- $100 - $500
- Over $500

### Sort Options

- Name: A to Z
- Name: Z to A
- Price: Low to High
- Price: High to Low
- Highest Rated

### View Modes

- **Grid**: 1-4 columns (responsive)
- **List**: Horizontal product cards

## 📱 Responsive Breakpoints

```css
xs: < 640px   - 1 column grid
sm: 640px+    - 2 columns grid
md: 768px+    - 2 columns grid
lg: 1024px+   - 3 columns grid
xl: 1280px+   - 4 columns grid
```

## 🚀 Performance Tips

1. **Images**: Use Sanity's image CDN with `.size(400, 400)`
2. **Animations**: Stagger delays with `delay: index * 0.02`
3. **Filtering**: Use `useMemo` to prevent unnecessary recalculations
4. **Caching**: Leverage Next.js cache tags for smart invalidation

## 🔄 Future Enhancements

Potential improvements:

- [ ] Add category filtering within variant
- [ ] Implement stock availability filter
- [ ] Add discount/sale filter
- [ ] Include brand filtering
- [ ] Add "Compare Products" feature
- [ ] Implement infinite scroll
- [ ] Add URL parameter support for filters
- [ ] Create variant comparison view

## 🐛 Troubleshooting

### Products not showing

1. Check if variant slug is correct
2. Verify products are assigned to the variant in Sanity
3. Check cache tags and revalidation times

### Images not loading

1. Verify image URLs in Sanity
2. Check Sanity CDN configuration
3. Ensure proper image permissions

### Filters not working

1. Check price values in products
2. Verify filter logic in `useMemo`
3. Check state updates in client component

## 📚 Related Documentation

- [Product Schema](../../sanity/schemaTypes/productType.ts)
- [Variant Schema](../../sanity/schemaTypes/productVariantType.ts)
- [Product Card Component](../ProductCard.tsx)
- [Product List Card Component](../ProductListCard.tsx)

---

**Created**: December 2024  
**Last Updated**: December 2024  
**Version**: 1.0.0
