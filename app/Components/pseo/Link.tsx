import NextLink from 'next/link';
import type { ComponentProps } from 'react';

// Programmatic pages list dozens of related pages. Prefetching each link in view makes one request per link per visit
// (a server render for /data and /unicode pages), so these links load on click. Crawlers follow the href either way.
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
