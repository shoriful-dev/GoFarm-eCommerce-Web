import { unstable_cache } from "next/cache";
import { defineQuery } from "next-sanity";
import { sanityFetch } from "../lib/live";
import {
  ADDRESS_QUERY,
  ALL_PRODUCTS_QUERY,
  ALLCATEGORIES_QUERY,
  ADMIN_CATEGORIES_QUERY,
  BANNER_QUERY,
  BLOG_CATEGORIES,
  BRAND_QUERY,
  BRANDS_QUERY,
  FEATURE_PRODUCTS,
  FEATURED_CATEGORY_QUERY,
  GET_ALL_BLOG,
  LATEST_BLOG_QUERY,
  OTHERS_BLOG_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  RELATED_PRODUCTS_QUERY,
  SINGLE_BLOG_QUERY,
  PRODUCTS_BY_VARIANT_QUERY,
  VARIANT_BY_SLUG_QUERY,
} from "./query";
import { getOrderById } from "./userQueries";

// ============================================================================
// CACHED DATA FETCHERS - Next.js 16 Caching Revolution
// ============================================================================

// ============================================================================
// CACHED DATA FETCHERS - Next.js 16 Caching Revolution
// ============================================================================

/**
 * Get banner data - cached for 5 minutes
 * Banners change infrequently, safe to cache
 */
const getBanner = unstable_cache(
  async () => {
    try {
      const { data } = await sanityFetch({ query: BANNER_QUERY });
      return (data ?? []) as any[];
    } catch (error) {
      console.error("Error fetching sale banner:", error);
      return [];
    }
  },
  ["banner"],
  { revalidate: 300, tags: ["homepage", "banners"] },
);

/**
 * Get featured categories - cached for 15 minutes
 * Featured categories are relatively static
 */
const getFeaturedCategory = unstable_cache(
  async (quantity: number) => {
    try {
      const { data } = await sanityFetch({
        query: FEATURED_CATEGORY_QUERY,
        params: { quantity },
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.error("Error fetching featured category:", error);
      return [];
    }
  },
  ["featured-categories"],
  { revalidate: 900, tags: ["categories", "featured", "homepage"] },
);

/**
 * Get all products - cached for 10 minutes
 * Product list updates moderately often
 */
const getAllProducts = unstable_cache(
  async () => {
    try {
      const { data } = await sanityFetch({ query: ALL_PRODUCTS_QUERY });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching all products:", error);
      return [];
    }
  },
  ["all-products"],
  { revalidate: 600, tags: ["products"] },
);

/**
 * Get featured products - cached for 10 minutes
 * Featured products are manually curated
 */
const getFeaturedProducts = unstable_cache(
  async () => {
    try {
      const { data } = await sanityFetch({ query: FEATURE_PRODUCTS });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching featured products:", error);
      return [];
    }
  },
  ["featured-products"],
  { revalidate: 600, tags: ["products", "featured", "homepage"] },
);

/**
 * Get all brands - cached for 1 hour
 * Brand list rarely changes
 */
const getAllBrands = unstable_cache(
  async () => {
    try {
      const { data } = await sanityFetch({ query: BRANDS_QUERY });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching all brands:", error);
      return [];
    }
  },
  ["all-brands"],
  { revalidate: 3600, tags: ["brands"] },
);

/**
 * Get latest blogs - cached for 5 minutes
 * Blog content updates regularly
 */
const getLatestBlogs = unstable_cache(
  async () => {
    try {
      const { data } = await sanityFetch({ query: LATEST_BLOG_QUERY });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching latest blogs:", error);
      return [];
    }
  },
  ["latest-blogs"],
  { revalidate: 300, tags: ["blogs", "homepage"] },
);

/**
 * Get all blogs with limit - cached for 10 minutes
 */
const getAllBlogs = unstable_cache(
  async (quantity: number) => {
    try {
      const { data } = await sanityFetch({
        query: GET_ALL_BLOG,
        params: { quantity },
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching all blogs:", error);
      return [];
    }
  },
  ["all-blogs"],
  { revalidate: 600, tags: ["blogs"] },
);

/**
 * Get single blog by slug - cached for 30 minutes
 * Individual blog posts don't change often
 */
const getSingleBlog = unstable_cache(
  async (slug: string) => {
    try {
      const { data } = await sanityFetch({
        query: SINGLE_BLOG_QUERY,
        params: { slug },
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching blog:", error);
      return [];
    }
  },
  ["single-blog"],
  { revalidate: 1800, tags: ["blogs"] },
);

/**
 * Get blog categories - cached for 1 hour
 * Blog categories rarely change
 */
const getBlogCategories = unstable_cache(
  async () => {
    try {
      const { data } = await sanityFetch({
        query: BLOG_CATEGORIES,
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching blog categories:", error);
      return [];
    }
  },
  ["blog-categories"],
  { revalidate: 3600, tags: ["blogs"] },
);

/**
 * Get other blogs (excluding current) - cached for 10 minutes
 */
const getOthersBlog = unstable_cache(
  async (slug: string, quantity: number) => {
    try {
      const { data } = await sanityFetch({
        query: OTHERS_BLOG_QUERY,
        params: { slug, quantity },
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching other blogs:", error);
      return [];
    }
  },
  ["others-blog"],
  { revalidate: 600, tags: ["blogs"] },
);

/**
 * Get addresses - not cached (user-specific data)
 */
const getAddresses = async () => {
  try {
    const { data } = await sanityFetch({
      query: ADDRESS_QUERY,
    });
    return (data ?? []) as any[];
  } catch (error) {
    console.log("Error fetching address:", error);
    return [];
  }
};

/**
 * Get categories - cached for 15 minutes
 * Category structure is relatively static
 */
const getCategories = unstable_cache(
  async (quantity?: number) => {
    try {
      const query = quantity
        ? `*[_type == 'category'] | order(name asc) [0...$quantity] {
            ...,
            "productCount": count(*[_type == "product" && references(^._id)])
          }`
        : `*[_type == 'category'] | order(name asc) {
            ...,
            "productCount": count(*[_type == "product" && references(^._id)])
          }`;

      const { data } = await sanityFetch({
        query,
        params: quantity ? { quantity } : {},
      });

      return (data ?? []) as any[];
    } catch (error) {
      console.log("Error fetching categories with product count:", error);
      return [];
    }
  },
  ["categories-list"],
  { revalidate: 900, tags: ["categories", "navigation"] },
);

/**
 * Get admin categories - not cached (admin data needs to be fresh)
 */
const getAdminCategories = async () => {
  try {
    const { data } = await sanityFetch({ query: ADMIN_CATEGORIES_QUERY });
    return (data ?? []) as any[];
  } catch (error) {
    console.error("Error fetching admin categories:", error);
    return [];
  }
};

/**
 * Get product by slug - cached for 30 minutes
 * Product details don't change frequently
 */
const getProductBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const product = await sanityFetch({
        query: PRODUCT_BY_SLUG_QUERY,
        params: {
          slug,
        },
      });
      return product?.data || null;
    } catch (error) {
      console.error("Error fetching product by slug:", error);
      return null;
    }
  },
  ["product-by-slug"],
  { revalidate: 1800, tags: ["products", "reviews"] },
);

/**
 * Get brand by slug - cached for 30 minutes
 * Brand info rarely changes
 */
const getBrand = unstable_cache(
  async (slug: string) => {
    try {
      const product = await sanityFetch({
        query: BRAND_QUERY,
        params: {
          slug,
        },
      });
      return product?.data || null;
    } catch (error) {
      console.error("Error fetching brand by slug:", error);
      return null;
    }
  },
  ["brand-by-slug"],
  { revalidate: 1800, tags: ["brands"] },
);

/**
 * Get related products - cached for 15 minutes
 * Related products are dynamic but can be cached briefly
 */
const getRelatedProducts = unstable_cache(
  async (categoryIds: string[], currentSlug: string, limit: number = 4) => {
    try {
      const { data } = await sanityFetch({
        query: RELATED_PRODUCTS_QUERY,
        params: {
          categoryIds,
          currentSlug,
          limit,
        },
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.error("Error fetching related products:", error);
      return [];
    }
  },
  ["related-products"],
  { revalidate: 900, tags: ["products"] },
);

/**
 * Get products by variant slug - cached for 10 minutes
 */
const getProductsByVariant = unstable_cache(
  async (variantSlug: string) => {
    try {
      const { data } = await sanityFetch({
        query: PRODUCTS_BY_VARIANT_QUERY,
        params: { variantSlug },
      });
      return (data ?? []) as any[];
    } catch (error) {
      console.error("Error fetching products by variant:", error);
      return [];
    }
  },
  ["products-by-variant"],
  { revalidate: 600, tags: ["products", "variants"] },
);

/**
 * Get variant by slug - cached for 30 minutes
 */
const getVariantBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const { data } = await sanityFetch({
        query: VARIANT_BY_SLUG_QUERY,
        params: { slug },
      });
      return data ?? null;
    } catch (error) {
      console.error("Error fetching variant by slug:", error);
      return null;
    }
  },
  ["variant-by-slug"],
  { revalidate: 1800, tags: ["variants"] },
);

export {
  getBanner,
  getFeaturedCategory,
  getAllProducts,
  getFeaturedProducts,
  getAllBrands,
  getLatestBlogs,
  getSingleBlog,
  getAllBlogs,
  getBlogCategories,
  getOthersBlog,
  getAddresses,
  getCategories,
  getAdminCategories,
  getProductBySlug,
  getBrand,
  getRelatedProducts,
  getOrderById,
  getProductsByVariant,
  getVariantBySlug,
};
