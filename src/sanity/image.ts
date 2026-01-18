import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/asset-utils';
import { dataset, projectId } from './env';

const builder = imageUrlBuilder({
  projectId,
  dataset,
});

export function image(source: SanityImageSource) {
  return builder.image(source).auto('format');
}
