"use client";

import { ComponentProps } from "react";
import Link from "next/link";
import { usePageTransition } from "./PageTransition";

export default function TransitionLink({
  href,
  children,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const { navigateTo } = usePageTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const strHref = typeof href === "string" ? href : href.pathname || "";

    // Intercept internal local routes
    if (
      strHref.startsWith("/") &&
      !strHref.startsWith("/#") &&
      !strHref.startsWith("//") &&
      !strHref.startsWith("/api") &&
      !strHref.startsWith("/uploads")
    ) {
      const pathOnly = strHref.split("#")[0];
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";

      if (pathOnly && pathOnly !== currentPath) {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
        navigateTo(strHref);
        return;
      }
    }

    onClick?.(e);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
