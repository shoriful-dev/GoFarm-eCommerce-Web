import Container from "@/components/Container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SingleBlogLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Breadcrumb Skeleton */}
      <Container className="pt-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-12" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-16" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-32" />
        </div>
      </Container>

      <Container className="py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-3">
            <article className="space-y-8">
              {/* Article Header */}
              <div className="space-y-6">
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <Skeleton className="h-12 sm:h-14 md:h-16 w-full" />
                  <Skeleton className="h-12 sm:h-14 md:h-16 w-4/5" />
                </div>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>

                {/* Social Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>

              {/* Featured Image Skeleton */}
              <Skeleton className="w-full h-[400px] sm:h-[500px] rounded-xl" />

              {/* Article Content Skeleton */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-8 sm:p-12">
                  <div className="space-y-6">
                    {/* Paragraph blocks */}
                    {[1, 2, 3, 4, 5].map((block) => (
                      <div key={block} className="space-y-3">
                        {block % 2 === 1 && (
                          <Skeleton className="h-8 w-3/4 mb-4" />
                        )}
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Skeleton */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-gray-200">
                <Skeleton className="h-10 w-32" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Categories Card */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-2"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-8 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Latest Posts Card */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Newsletter Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 text-center space-y-4">
                <Skeleton className="w-12 h-12 mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
