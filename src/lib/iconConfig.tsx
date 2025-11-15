/**
 * Sistema de iconografía consistente para RESERVEO
 * 
 * Configuración centralizada de iconos con:
 * - Stroke width estandarizado (2px)
 * - Colores semánticos
 * - Tamaños responsive
 * - Accesibilidad (aria-hidden)
 * 
 * Requirements: 7.1, 7.3, 7.4, 7.5
 */

// Tamaños responsive de iconos
export const ICON_SIZES = {
  sm: "w-4 h-4",           // 16px - Iconos pequeños
  md: "w-5 h-5",           // 20px - Móvil (default)
  lg: "w-6 h-6",           // 24px - Desktop
  xl: "w-8 h-8",           // 32px - Iconos grandes
  "2xl": "w-12 h-12",      // 48px - Iconos hero
} as const;

// Tamaños responsive (móvil 20px, desktop 24px)
export const ICON_SIZE_RESPONSIVE = "w-5 h-5 md:w-6 md:h-6";

// Colores semánticos
export const ICON_COLORS = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-orange-600 dark:text-orange-400",
  info: "text-blue-600 dark:text-blue-400",
  primary: "text-primary",
  muted: "text-muted-foreground",
  foreground: "text-foreground",
} as const;

// Props base para todos los iconos
export const BASE_ICON_PROPS = {
  strokeWidth: 2,
  "aria-hidden": "true" as const,
} as const;

/**
 * Obtiene las props completas para un icono
 * @param size - Tamaño del icono (sm, md, lg, xl, 2xl, responsive)
 * @param color - Color semántico del icono
 * @param className - Clases adicionales
 */
export function getIconProps(
  size: keyof typeof ICON_SIZES | "responsive" = "md",
  color?: keyof typeof ICON_COLORS,
  className?: string
) {
  const sizeClass = size === "responsive" ? ICON_SIZE_RESPONSIVE : ICON_SIZES[size];
  const colorClass = color ? ICON_COLORS[color] : "";
  
  return {
    ...BASE_ICON_PROPS,
    className: [sizeClass, colorClass, className].filter(Boolean).join(" "),
  };
}

/**
 * Wrapper para iconos decorativos
 * Añade automáticamente aria-hidden y stroke-width
 */
export function decorativeIcon(
  Icon: React.ComponentType<any>,
  props?: {
    size?: keyof typeof ICON_SIZES | "responsive";
    color?: keyof typeof ICON_COLORS;
    className?: string;
  }
) {
  const iconProps = getIconProps(props?.size, props?.color, props?.className);
  return <Icon {...iconProps} />;
}
