import { heroui } from "@heroui/react";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      layout: {
        radius: {
          small: "0.75rem",
          medium: "1rem",
          large: "1.25rem",
        },
      },
      themes: {
        light: {
          colors: {
            background: "#F8F7FF",
            foreground: "#11181C",
            primary: {
              50: "#F0F7FF",
              100: "#E0EFFF",
              200: "#B9DEFF",
              300: "#8CCCFF",
              400: "#53B1FD",
              500: "#2196F3",
              600: "#1773E2",
              700: "#0C59CF",
              800: "#0744B9",
              900: "#043595",
              DEFAULT: "#2196F3",
              foreground: "#FFFFFF"
            },
            secondary: {
              50: "#FFF7ED",
              100: "#FFEDD5",
              200: "#FED7AA",
              300: "#FDBA74",
              400: "#FB923C",
              500: "#F97316",
              600: "#EA580C",
              700: "#C2410C",
              800: "#9A3412",
              900: "#7C2D12",
              DEFAULT: "#F97316",
              foreground: "#FFFFFF"
            },
            success: {
              50: "#F0FDF4",
              100: "#DCFCE7",
              200: "#BBF7D0",
              300: "#86EFAC",
              400: "#4ADE80",
              500: "#22C55E",
              600: "#16A34A",
              700: "#15803D",
              800: "#166534",
              900: "#14532D",
              DEFAULT: "#22C55E",
              foreground: "#FFFFFF"
            },
            content1: {
              DEFAULT: "#FFFFFF",
              foreground: "#11181C"
            },
            content2: {
              DEFAULT: "#F8F9FA",
              foreground: "#11181C"
            }
          }
        }
      }
    })
  ]
};
