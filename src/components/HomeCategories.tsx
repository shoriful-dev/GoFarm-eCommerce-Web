import { Category } from '@/sanity.types';
import Container from './Container';
import Title from './Title';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

interface Props {
  categories: Category[];
  totalProducts: number;
}

const HomeCategories = ({ categories, totalProducts }: Props) => {
  return (
    <Container className="mt-16 lg:mt-24">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="h-1 w-16 bg-linear-to-r from-transparent via-gofarm-light-green to-gofarm-green rounded-full animate-pulse"></div>
          <Title className="text-3xl lg:text-5xl font-extrabold bg-linear-to-r from-gofarm-green via-gofarm-light-green to-gofarm-green bg-clip-text text-transparent">
            Popular Categories
          </Title>
          <div className="h-1 w-16 bg-linear-to-l from-transparent via-gofarm-light-green to-gofarm-green rounded-full animate-pulse"></div>
        </div>
        <p className="text-gofarm-gray text-lg max-w-2xl mx-auto mb-2">
          Explore our most popular product categories and find what you need
        </p>
        <p className="text-sm text-gofarm-green/80 font-medium mb-6">
          ✨ Curated collections for your convenience
        </p>
        <Link
          href={'/category'}
          className="group inline-flex items-center gap-2 mt-2 px-8 py-3.5 bg-linear-to-r from-gofarm-green to-gofarm-light-green text-white font-bold rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Browse All Categories
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
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

      {/* Categories Grid */}
      <div className="relative bg-linear-to-br from-white via-gofarm-light-orange/20 to-gofarm-light-green/10 p-8 lg:p-12 rounded-3xl shadow-2xl border border-gofarm-light-green/30 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gofarm-light-green/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gofarm-orange/5 rounded-full blur-3xl"></div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories?.map((category, index) => (
            <Link
              key={category?._id}
              href={`/category/${category?.slug?.current}`}
              className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl border-2 border-gray-100/50 hover:border-gofarm-light-green transition-all duration-300 transform hover:-translate-y-3 cursor-pointer block overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* linear Background Overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-gofarm-light-green/0 to-gofarm-orange/0 group-hover:from-gofarm-light-green/5 group-hover:to-gofarm-orange/5 transition-all duration-300"></div>

              {/* Top Corner Badge */}
              <div className="absolute -top-1 -right-1 w-16 h-16 bg-linear-to-br from-gofarm-green to-gofarm-light-green opacity-0 group-hover:opacity-10 rounded-bl-3xl transition-opacity duration-300"></div>

              {/* Image Container */}
              <div className="relative flex justify-center mb-5">
                {category?.image && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-linear-to-br from-gofarm-light-orange/30 to-gofarm-light-green/10 p-4 group-hover:shadow-xl transition-all duration-300 border-2 border-transparent group-hover:border-gofarm-light-green/30">
                    <Image
                      src={urlFor(category?.image).url()}
                      alt={`${category?.title} category`}
                      width={96}
                      height={96}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-full"></div>
                  </div>
                )}

                {/* Floating Badge */}
                <div className="absolute -top-2 -right-2 bg-linear-to-r from-gofarm-orange to-gofarm-light-orange text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Hot
                </div>
              </div>

              {/* Content */}
              <div className="relative text-center space-y-3">
                <h3 className="text-lg font-bold text-gofarm-black group-hover:text-gofarm-green transition-colors duration-300 line-clamp-1 mb-2">
                  {category?.title}
                </h3>

                {/* Description Preview */}
                {category?.description && (
                  <p className="text-xs text-gofarm-gray line-clamp-2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {category.description}
                  </p>
                )}

                {/* Animated Progress Indicator */}
                <div className="relative w-full bg-linear-to-r from-gray-100 via-gray-200 to-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-r from-gofarm-light-green via-gofarm-green to-gofarm-light-green h-2 rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </div>

                {/* Shop Now Button */}
                <div className="relative inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-linear-to-r from-gofarm-light-orange/50 to-gray-50 text-gofarm-green font-semibold rounded-full group-hover:from-gofarm-green group-hover:to-gofarm-light-green group-hover:text-white text-sm transition-all duration-300 overflow-hidden border border-gofarm-light-green/20 group-hover:border-transparent shadow-sm group-hover:shadow-lg">
                  {/* Button Background Animation */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative z-10">Explore Now</span>
                  <svg
                    className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
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
                </div>
              </div>

              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-gofarm-light-green to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </Link>
          ))}
        </div>

        {/* Categories Stats */}
        <div className="relative flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-gofarm-light-green/30">
          <div className="group text-center px-6 py-3 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="text-3xl font-extrabold bg-linear-to-r from-gofarm-green to-gofarm-light-green bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">
              {categories?.length}+
            </div>
            <div className="text-sm text-gofarm-gray font-medium mt-1">Categories</div>
          </div>
          <div className="group text-center px-6 py-3 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="text-3xl font-extrabold bg-linear-to-r from-gofarm-orange to-gofarm-light-orange bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">
              {totalProducts}+
            </div>
            <div className="text-sm text-gofarm-gray font-medium mt-1">Products</div>
          </div>
          <div className="group text-center px-6 py-3 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg cursor-pointer">
            <div className="text-3xl font-extrabold bg-linear-to-r from-gofarm-green to-gofarm-light-green bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">
              24/7
            </div>
            <div className="text-sm text-gofarm-gray font-medium mt-1">Support</div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative text-center mt-8">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-linear-to-r from-white/70 via-gofarm-light-orange/20 to-white/70 backdrop-blur-sm rounded-2xl border-2 border-gofarm-light-green/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-2.5 h-2.5 bg-linear-to-r from-gofarm-light-green to-gofarm-green rounded-full animate-pulse shadow-lg shadow-gofarm-light-green/50"></div>
            <span className="text-gofarm-black font-semibold">
              Discover amazing products in every category
            </span>
            <div className="w-2.5 h-2.5 bg-linear-to-r from-gofarm-green to-gofarm-light-green rounded-full animate-pulse shadow-lg shadow-gofarm-green/50"></div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default HomeCategories;
