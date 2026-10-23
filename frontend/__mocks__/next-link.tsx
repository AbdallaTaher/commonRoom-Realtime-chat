import type { AnchorHTMLAttributes, ReactNode } from "react";

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export default function MockLink({ href, children, ...props }: MockLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
