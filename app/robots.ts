import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/employee/",
          "/user/",
          "/dashboard/",
          "/studio/",
          "/_next/",
          "/checkout/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/employee/",
          "/user/",
          "/dashboard/",
          "/studio/",
          "/checkout/",
        ],
      },
    ],
    sitemap: "https://gofarm.reactbd.com/sitemap.xml",
  };
}
