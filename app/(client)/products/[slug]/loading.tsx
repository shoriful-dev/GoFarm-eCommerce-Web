import Container from "@/components/Container";

const ProductsVariantLoading = () => {
  return (
    <div className="bg-gofarm-light-gray min-h-screen">
      <Container className="py-6">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 h-4 w-64 bg-gray-200 rounded animate-pulse" />

        {/* Header Skeleton */}
        <div className="bg-linear-to-r from-gray-200 to-gray-300 rounded-2xl shadow-lg p-8 mb-8 animate-pulse">
          <div className="max-w-4xl space-y-4">
            <div className="h-10 w-3/4 bg-gray-300 rounded" />
            <div className="h-6 w-full bg-gray-300 rounded" />
            <div className="h-6 w-2/3 bg-gray-300 rounded" />
            <div className="h-5 w-48 bg-gray-300 rounded" />
          </div>
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-gofarm-white rounded-xl shadow-md border border-gofarm-light-gray/30 p-4 lg:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-gofarm-white rounded-xl shadow-md border border-gofarm-light-gray/30 overflow-hidden animate-pulse"
            >
              {/* Image Skeleton */}
              <div className="aspect-square bg-gray-200" />

              {/* Content Skeleton */}
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-gray-200 rounded-full" />
                  ))}
                </div>
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default ProductsVariantLoading;
