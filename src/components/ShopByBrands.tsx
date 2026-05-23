import Container from './Container';
import { getAllBrands } from '@/sanity/queries';
import Title from './Title';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { GitCompareArrows, Headset, ShieldCheck, Truck } from 'lucide-react';

const extraData = [
  {
    title: 'Free Delivery',
    description: 'Free shipping over $100',
    icon: <Truck size={45} />,
  },
  {
    title: 'Free Return',
    description: 'Free shipping over $100',
    icon: <GitCompareArrows size={45} />,
  },
  {
    title: 'Customer Support',
    description: 'Friendly 27/7 customer support',
    icon: <Headset size={45} />,
  },
  {
    title: 'Money Back guarantee',
    description: 'Quality checked by our team',
    icon: <ShieldCheck size={45} />,
  },
];

const ShopByBrands = async () => {
  const brands = await getAllBrands();

  // No brands seeded yet → don't render an empty section.
  if (!brands || brands.length === 0) return null;

  return (
    <div className="w-full bg-gofarm-light-gray py-16">
      <Container>
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-1 w-12 bg-linear-to-r from-gofarm-orange to-gofarm-light-orange rounded-full"></div>
            <Title className="text-3xl lg:text-4xl font-bold text-gofarm-black">
              Shop By Brands
            </Title>
            <div className="h-1 w-12 bg-linear-to-l from-gofarm-orange to-gofarm-light-orange rounded-full"></div>
          </div>
          <p className="text-gofarm-gray text-lg max-w-2xl mx-auto">
            Discover products from your favorite trusted brands
          </p>
          <Link
            href={'/shop'}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gofarm-light-orange text-gofarm-green font-semibold rounded-full hover:bg-gofarm-orange hover:text-white border-2 border-gofarm-orange hoverEffect"
          >
            Explore All Brands
            <svg
              className="w-4 h-4 hoverEffect group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* Brands Grid */}
        <div className="bg-linear-to-br from-gray-50 via-white to-gofarm-light-orange p-8 lg:p-12 rounded-3xl shadow-xl border border-gofarm-light-green/20 mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-6">
            {brands?.map((brand, index) => (
              <Link
                key={brand?._id}
                href={{
                  pathname: '/shop',
                  query: { brand: brand?.slug?.current },
                }}
                className="group bg-white rounded-2xl p-6 flex items-center justify-center aspect-square hover:shadow-2xl shadow-lg border border-gray-100 hover:border-gofarm-orange hoverEffect transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {brand?.image && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={urlFor(brand?.image).url()}
                      alt={`${brand?.title || 'Brand'} logo`}
                      width={120}
                      height={80}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 hoverEffect filter group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gofarm-orange/5 to-transparent opacity-0 group-hover:opacity-100 hoverEffect rounded-xl"></div>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Brand Grid Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gofarm-light-green/20">
            <p className="text-dark-text text-sm">
              <span className="font-semibold text-gofarm-orange">{brands?.length}+</span> trusted
              brands and counting
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gofarm-light-green/10 p-8 lg:p-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl lg:text-3xl font-bold text-gofarm-black mb-3">
              Why Choose Us?
            </h3>
            <p className="text-gofarm-gray text-lg">
              We provide the best shopping experience with premium services
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {extraData?.map((item, index) => (
              <div
                key={index}
                className="group text-center p-6 rounded-2xl bg-linear-to-br from-gray-50 to-white border border-gofarm-light-green/10 hover:border-gofarm-orange/30 hover:shadow-lg hoverEffect"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon Container */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-gofarm-light-orange to-gofarm-light-orange/20 text-gofarm-orange group-hover:from-gofarm-orange group-hover:to-gofarm-light-orange group-hover:text-white group-hover:scale-110 hoverEffect mb-4">
                  <span className="transform group-hover:scale-110 hoverEffect">{item?.icon}</span>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-lg font-bold text-gofarm-black group-hover:text-gofarm-green hoverEffect mb-2">
                    {item?.title}
                  </h4>
                  <p className="text-gofarm-gray text-sm leading-relaxed">{item?.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features Footer */}
          <div className="text-center mt-10 pt-8 border-t border-gofarm-light-green/20">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-linear-to-r from-gofarm-light-orange to-gray-50 rounded-2xl border border-gofarm-orange/20">
              <div className="w-2 h-2 bg-gofarm-orange rounded-full animate-pulse"></div>
              <span className="text-dark-text font-medium">
                Trusted by thousands of customers worldwide
              </span>
              <div className="w-2 h-2 bg-gofarm-orange rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ShopByBrands;
