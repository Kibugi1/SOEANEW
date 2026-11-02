"use client";

import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

type LinkButtonProps = Omit<ButtonProps, "component"> & {
  href: string;
};

export default function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button href={href} {...props} />;
}
