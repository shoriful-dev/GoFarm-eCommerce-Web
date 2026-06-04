import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

// Read-only client for fetching data (uses CDN for better performance)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  stega: {
    studioUrl:
      process.env.NODE_ENV === "production"
        ? `https://${process.env.VERCEL_URL}/studio`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/studio`,
  },
});

// Write client for mutations (authenticated) - Use this for create, update, delete operations
// IMPORTANT: The SANITY_API_TOKEN must have "Editor" or "Administrator" permissions
// To create a token with proper permissions:
// 1. Go to https://www.sanity.io/manage
// 2. Select your project
// 3. Go to API → Tokens
// 4. Click "Add API token"
// 5. Give it a name (e.g., "Production Write Token")
// 6. Set permissions to "Editor" or "Administrator"
// 7. Copy the token and add it to your .env file as SANITY_API_TOKEN
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Don't use CDN for write operations
  token: process.env.SANITY_API_TOKEN, // Server-side token with write permissions
  ignoreBrowserTokenWarning: true, // Suppress warning when used in browser context
});
