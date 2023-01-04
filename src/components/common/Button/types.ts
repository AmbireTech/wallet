import React from "react"

export type ButtonProps = {
  variant: 'primary' | 'secondary' | 'text' | 'primaryGradient' | 'secondaryGradient' | 'terniaryGradient';
  size?: 'small' | 'normal' | 'mini';
  loading?: boolean;
  startIcon?: React.ReactElement | React.ReactElement[];
  endIcon?: React.ReactElement | React.ReactElement[];
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactElement | React.ReactElement[] | string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}
