import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const base =
  "rounded-lg px-6 py-2 font-semibold transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50",
  ghost: "bg-transparent text-indigo-600 hover:bg-indigo-100",
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => (
  <button className={`${base} ${variants[variant]} ${className}`} {...props}>
    {children}
  </button>
);

export default Button; 