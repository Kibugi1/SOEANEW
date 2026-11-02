"use client";

import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";

type LinkTextProps = Omit<BoxProps<"a">, "component"> & {
  href: string;
};

export default function LinkText({ href, ...props }: LinkTextProps) {
  return (
    <Box
      component="a"
      href={href}
      {...props}
    />
  );
}
