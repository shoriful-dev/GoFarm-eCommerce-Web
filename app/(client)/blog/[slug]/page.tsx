import Container from "@/components/Container";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SINGLE_BLOG_QUERY_RESULT,
  OTHERS_BLOG_QUERY_RESULT,
} from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import {
  getBlogCategories,
  getOthersBlog,
  getSingleBlog,
} from "@/sanity/queries";
import dayjs from "dayjs";
import {
  Calendar,
  ChevronLeft,
  User,
  Clock,
  Eye,
  Share2,
  BookOpen,
  ArrowRight,
  Heart,
  MessageCircle,
} from "lucide-react";
import { PortableText } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleBlogPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const blog = (await getSingleBlog(
    slug,
  )) as unknown as SINGLE_BLOG_QUERY_RESULT | null;
  if (!blog) return notFound();

  // Calculate reading time based on content length
  const calculateReadingTime = (body: unknown[]) => {
    if (!body) return 5;
    let wordCount = 0;
    body.forEach((block: unknown) => {
      if (typeof block === "object" && block !== null && "children" in block) {
        const blockObj = block as { _type?: string; children?: unknown[] };
        if (blockObj._type === "block" && blockObj.children) {
          blockObj.children.forEach((child: unknown) => {
            if (
              typeof child === "object" &&
              child !== null &&
              "text" in child
            ) {
              const childObj = child as { text?: string };
              if (childObj.text) {
                wordCount += childObj.text.split(" ").length;
              }
            }
          });
        }
      }
    });
    return Math.ceil(wordCount / 200); // 200 words per minute
  };

  const readingTime = calculateReadingTime(blog?.body || []);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Breadcrumb */}
      <Container className="pt-6">
        <DynamicBreadcrumb
          customItems={[
            { label: "Blog", href: "/blog" },
            { label: blog?.title || "Article" },
          ]}
        />
      </Container>

      <Container className="py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="space-y-6 sm:space-y-8">
              {/* Article Header */}
              <div className="space-y-4 sm:space-y-6">
                {/* Categories */}
                {blog?.blogcategories && blog.blogcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {blog.blogcategories.map(
                      (
                        category: { title: string | null; slug: string | null },
                        index: number,
                      ) => (
                        <Badge
                          key={index}
                          className="bg-gofarm-green hover:bg-gofarm-light-green"
                        >
                          {category.title}
                        </Badge>
                      ),
                    )}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  {blog?.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                  {blog?.author?.name && (
                    <div className="flex items-center gap-2">
                      {blog?.author?.image && (
                        <Image
                          src={urlFor(blog.author.image)
                            .width(32)
                            .height(32)
                            .url()}
                          alt={blog.author.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        <span className="font-medium text-gofarm-green">
                          {blog.author.name}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <time>
                      {dayjs(blog.publishedAt).format("MMMM D, YYYY")}
                    </time>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{readingTime} min read</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>2.5K views</span>
                  </div>
                </div>

                {/* Social Actions */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gofarm-green text-gofarm-green hover:bg-gofarm-green hover:text-white"
                  >
                    <Heart size={16} className="mr-2" />
                    Like
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gofarm-green text-gofarm-green hover:bg-gofarm-green hover:text-white"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Comment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gofarm-green text-gofarm-green hover:bg-gofarm-green hover:text-white"
                  >
                    <Share2 size={16} className="mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Featured Image */}
              {blog?.mainImage && (
                <div className="relative overflow-hidden rounded-xl shadow-xl">
                  <Image
                    src={urlFor(blog.mainImage).width(1200).height(600).url()}
                    alt={blog.title || "Blog Image"}
                    width={1200}
                    height={600}
                    className="w-full h-75 sm:h-100 lg:h-125 object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                </div>
              )}

              {/* Article Content */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-6 sm:p-8 lg:p-12">
                  <div className="prose prose-lg max-w-none">
                    {blog.body && (
                      <PortableText
                        value={blog.body}
                        components={{
                          block: {
                            normal: ({ children }) => (
                              <p className="my-6 text-base sm:text-lg leading-relaxed text-gray-700 first:mt-0 last:mb-0">
                                {children}
                              </p>
                            ),
                            h2: ({ children }) => (
                              <h2 className="my-6 sm:my-8 text-2xl sm:text-3xl md:text-4xl font-bold text-gofarm-green first:mt-0 last:mb-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="my-4 sm:my-6 text-xl sm:text-2xl md:text-3xl font-semibold text-gofarm-green first:mt-0 last:mb-0">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="my-4 text-lg sm:text-xl font-semibold text-gofarm-green first:mt-0 last:mb-0">
                                {children}
                              </h4>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="my-6 sm:my-8 border-l-4 border-gofarm-light-green bg-gray-50 pl-4 sm:pl-6 py-3 sm:py-4 text-sm sm:text-base italic text-gray-700 rounded-r-lg first:mt-0 last:mb-0">
                                {children}
                              </blockquote>
                            ),
                          },
                          types: {
                            image: ({ value }) => (
                              <div className="my-6 sm:my-8 overflow-hidden rounded-lg shadow-md">
                                <Image
                                  alt={value.alt || ""}
                                  src={urlFor(value).width(800).url()}
                                  className="w-full h-auto"
                                  width={800}
                                  height={600}
                                />
                              </div>
                            ),
                            separator: ({ value }) => {
                              switch (value.style) {
                                case "line":
                                  return (
                                    <hr className="my-8 border-t-2 border-gofarm-light-green" />
                                  );
                                case "space":
                                  return <div className="my-8" />;
                                default:
                                  return null;
                              }
                            },
                          },
                          list: {
                            bullet: ({ children }) => (
                              <ul className="my-4 sm:my-6 list-disc pl-5 sm:pl-6 space-y-2 text-base sm:text-lg text-gray-700">
                                {children}
                              </ul>
                            ),
                            number: ({ children }) => (
                              <ol className="my-4 sm:my-6 list-decimal pl-5 sm:pl-6 space-y-2 text-base sm:text-lg text-gray-700">
                                {children}
                              </ol>
                            ),
                          },
                          listItem: {
                            bullet: ({ children }) => (
                              <li className="pl-2">{children}</li>
                            ),
                            number: ({ children }) => (
                              <li className="pl-2">{children}</li>
                            ),
                          },
                          marks: {
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gofarm-green">
                                {children}
                              </strong>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-50 px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm font-mono text-gofarm-green">
                                {children}
                              </code>
                            ),
                            link: ({ value, children }) => (
                              <Link
                                href={value?.href ?? "#"}
                                className="font-medium text-gofarm-light-green hover:text-gofarm-green underline decoration-gofarm-light-green underline-offset-4 hover:decoration-gofarm-green transition-colors"
                              >
                                {children}
                              </Link>
                            ),
                          },
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-200">
                <Button
                  asChild
                  variant="outline"
                  className="border-gofarm-green text-gofarm-green hover:bg-gofarm-green hover:text-white"
                >
                  <Link href="/blog" className="flex items-center gap-2">
                    <ChevronLeft size={16} />
                    Back to Blog
                  </Link>
                </Button>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <span className="hidden sm:inline">Share this article:</span>
                  <span className="sm:hidden">Share:</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Twitter
                    </Button>
                    <Button size="sm" variant="outline">
                      LinkedIn
                    </Button>
                    <Button size="sm" variant="outline">
                      Facebook
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BlogSidebar slug={slug} />
          </div>
        </div>
      </Container>
    </div>
  );
};

const BlogSidebar = async ({ slug }: { slug: string }) => {
  const categories = await getBlogCategories();
  const blogs = await getOthersBlog(slug, 5);

  // Extract and deduplicate categories
  const uniqueCategories =
    categories?.reduce(
      (
        acc: Array<{ _id: string; title: string | null; slug: string | null }>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blog: any,
      ) => {
        blog.blogcategories?.forEach(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (category: any) => {
            if (
              category &&
              category.title &&
              !acc.some((cat) => cat._id === category._id)
            ) {
              acc.push({
                _id: category._id,
                title: category.title,
                slug: category.slug?.current || null,
              });
            }
          },
        );
        return acc;
      },
      [],
    ) || [];

  return (
    <div className="space-y-4 sm:space-y-6 sticky top-6">
      {/* Categories Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-bold text-gofarm-green flex items-center gap-2">
            <BookOpen size={18} />
            Blog Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
          {uniqueCategories.map((category) => (
            <div
              key={category._id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <p className="text-sm sm:text-base text-gray-700 group-hover:text-gofarm-green transition-colors">
                {category.title}
              </p>
              <Badge variant="secondary" className="text-xs">
                {
                  categories.filter(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (blog: any) =>
                      blog.blogcategories?.some(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (cat: any) => cat?._id === category._id,
                      ),
                  ).length
                }
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Latest Posts Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-bold text-gofarm-green flex items-center gap-2">
            <BookOpen size={18} />
            Latest Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          {blogs?.map(
            (
              blogItem: OTHERS_BLOG_QUERY_RESULT[0] & { publishedAt?: string },
              index: number,
            ) => (
              <Link
                href={`/blog/${blogItem?.slug?.current}`}
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
              >
                {blogItem?.mainImage && (
                  <div className="shrink-0">
                    <Image
                      src={urlFor(blogItem.mainImage)
                        .width(80)
                        .height(80)
                        .url()}
                      alt="blog thumbnail"
                      width={80}
                      height={80}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 group-hover:border-gofarm-light-green transition-colors"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="line-clamp-2 text-xs sm:text-sm font-medium text-gray-800 group-hover:text-gofarm-green transition-colors">
                    {blogItem?.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {dayjs(blogItem?.publishedAt).format("MMM D, YYYY")}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-gray-400 group-hover:text-gofarm-light-green transition-colors"
                />
              </Link>
            ),
          )}
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card className="shadow-lg border-0 bg-linear-to-br from-gofarm-light-orange to-light-orange/20">
        <CardContent className="p-4 sm:p-6 text-center">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gofarm-green mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-bold text-gofarm-green mb-2">
            Stay Updated
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Get the latest articles delivered to your inbox.
          </p>
          <Button
            className="w-full bg-gofarm-green hover:bg-gofarm-light-green"
            size="sm"
          >
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SingleBlogPage;
