"use client";

import { useState, useEffect } from "react";
import { Brand, Product } from "@/sanity.types";
import { client } from "@/sanity/lib/client";
import { Button } from "../ui/button";
import ProductCard from "../ProductCard";
import NoProductAvailable from "./NoProductAvailable";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  brands: Brand[];
  slug: string;
  initialProducts: Product[];
}

const BrandProducts = ({ brands, slug, initialProducts }: Props) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(slug);
  const router = useRouter();

  useEffect(() => {
    const fetchBrandProducts = async () => {
      setLoading(true);
      try {
        const query = `
      *[_type == "product" && brand->slug.current == $slug] {
        ...,
        brand->{
          _id,
          title
        },
        categories[]->{
          _id,
          title,
          slug
        }
      }
    `;
        const products = await client.fetch(query, { slug: currentSlug });
        setProducts(products);
      } catch (error) {
        console.error("Error fetching brand products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentSlug) {
      fetchBrandProducts();
    }
  }, [currentSlug, slug, initialProducts]);

  const handleBrandChange = (newSlug: string) => {
    if (newSlug === currentSlug) return;
    setCurrentSlug(newSlug);
    router.push(`/brands/${newSlug}`);
  };

  return (
    <div className="py-5 flex flex-col md:flex-row items-start gap-5">
      <div className="flex flex-col md:min-w-40 border rounded-lg overflow-hidden bg-white shadow-sm">
        {brands?.map((item) => (
          <Button
            key={item?._id}
            onClick={() => handleBrandChange(item?.slug?.current!)}
            variant={currentSlug === item?.slug?.current ? "default" : "ghost"}
            className={`justify-start rounded-none font-medium text-sm ${
              currentSlug === item?.slug?.current
                ? "bg-gofarm-green text-white hover:bg-gofarm-light-green"
                : "text-dark-text hover:bg-gofarm-light-orange/30 hover:text-gofarm-green"
            }`}
          >
            {item?.title}
          </Button>
        ))}
      </div>

      <div className="flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gofarm-green" />
          </div>
        ) : products?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <NoProductAvailable />
        )}
      </div>
    </div>
  );
};

export default BrandProducts;
