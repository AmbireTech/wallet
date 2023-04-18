import React from "react"

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'text' | 'primaryGradient' | 'secondaryGradient' | 'terniaryGradient';
  size?: 'xsm' | 'sm';
  loading?: boolean;
  startIcon?: React.ReactElement | React.ReactElement[];
  endIcon?: React.ReactElement | React.ReactElement[];
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactElement | React.ReactElement[] | string;
  title?: string;
  loadingText?: string;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}
