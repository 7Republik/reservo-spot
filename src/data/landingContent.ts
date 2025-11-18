import { LucideIcon, AlertTriangle, FileSpreadsheet, EyeOff, AlertCircle, UserX, FileText, ShieldCheck, FileCheck, Zap, Bell, Building2, Hospital, GraduationCap, ShoppingBag, Shield, Lock, Database, Cloud, RefreshCw } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

export interface Problem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  imageUrl: string;
  imagePosition: 'left' | 'right';
}

export interface Feature {
  name: string;
  badge?: 'new' | 'popular';
}

export interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  features: Feature[];
}

export interface RoleBenefit {
  role: string;
  icon: LucideIcon;
  color: string;
  benefits: string[];
  quote?: string;
}

export interface KeyBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface UseCase {
  industry: string;
  icon: LucideIcon;
  description: string;
  benefits: string[];
}

export interface ComparisonRow {
  aspect: string;
  manual: string;
  withReserveo: string;
}

export interface Technology {
  name: string;
  logo: string;
  description: string;
}

export interface SecurityFeature {
  icon: LucideIcon;
  name: string;
  description: string;
}

export interface PricingTier {
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
  price?: string;
  priceUnit?: string;
  priceNote?: string;
  ctaText?: string;
  valueProps?: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface FooterLink {
  text: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface LandingPageContent {
  hero: {
    headline: string;
    subheadline: string;
    microclaim: string;
    imageUrl?: string;
  };
  problems: Problem[];
  solutions: Solution[];
  modules: Module[];
  roleBenefits: RoleBenefit[];
  keyBenefits: KeyBenefit[];
  useCases: UseCase[];
  comparisons: ComparisonRow[];
  technologies: Technology[];
  securityFeatures: SecurityFeature[];
  pricingTiers: PricingTier[];
  faqs: FAQ[];
  finalCTA: {
    headline: string;
    subheadline?: string;
  };
  footer: {
    columns: FooterColumn[];
    socialLinks: { platform: string; url: string }[];
  };
}

// ============================================
// CONTENIDO DE LA LANDING PAGE
// ============================================

export const landingContent: LandingPageContent = {
  // HERO SECTION
  hero: {
    headline: "¿Cansado de gestionar el aparcamiento con Excel?",
    subheadline: "RESERVEO automatiza la gestión de plazas de parking corporativo con un sistema inteligente, sin conflictos y 100% trazable.",
    microclaim: "Gestión de aparcamiento sin complicaciones",
    imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/hero.png"
  },

  // PROBLEMAS
  problems: [
    {
      icon: AlertTriangle,
      title: "Dobles reservas y conflictos constantes",
      description: "Empleados que llegan y encuentran su plaza ocupada. Conflictos diarios que generan frustración y pérdida de tiempo."
    },
    {
      icon: FileSpreadsheet,
      title: "Gestión manual con Excel y emails",
      description: "Hojas de cálculo desactualizadas, emails perdidos y un proceso manual que consume horas cada semana."
    },
    {
      icon: EyeOff,
      title: "Sin visibilidad de ocupación real",
      description: "No sabes qué plazas están realmente ocupadas, cuáles están libres o quién no se presentó."
    },
    {
      icon: AlertCircle,
      title: "Incidentes sin resolver",
      description: "Plazas ocupadas indebidamente sin forma de identificar al infractor ni gestionar el problema."
    },
    {
      icon: UserX,
      title: "Falta de control de presencia",
      description: "Empleados que reservan pero no se presentan, desperdiciando plazas que otros podrían usar."
    },
    {
      icon: FileText,
      title: "Reportes manuales y tediosos",
      description: "Generar estadísticas de uso requiere horas de trabajo manual y los datos nunca están actualizados."
    }
  ],

  // SOLUCIONES
  solutions: [
    {
      id: "reservations",
      title: "Sistema de Reservas Inteligente",
      description: "Calendario mensual intuitivo y mapa interactivo con inteligencia para restricciones especiales. El sistema valida automáticamente plazas PMR, cargadores eléctricos, motos y vehículos compactos según las necesidades de cada usuario.",
      benefits: [
        "Validación inteligente de plazas PMR (movilidad reducida)",
        "Control automático de plazas con cargador eléctrico",
        "Gestión de plazas para motos y vehículos compactos",
        "Mapa interactivo con código de colores por tipo de plaza",
        "Calendario mensual con disponibilidad en tiempo real",
        "Imposible crear dobles reservas o asignar plazas incompatibles"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/calendar.png",
      imagePosition: "right"
    },
    {
      id: "checkin",
      title: "Check-in/Check-out Automático",
      description: "Validación de presencia física con detección automática de infracciones. Libera plazas temprano cuando alguien se va antes.",
      benefits: [
        "Check-in obligatorio al llegar",
        "Detección automática de no-shows",
        "Liberación temprana de plazas",
        "Reportes de cumplimiento en tiempo real"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/checkin.png",
      imagePosition: "left"
    },
    {
      id: "waitlist",
      title: "Lista de Espera Dinámica",
      description: "Cuando no hay plazas disponibles, los usuarios se registran automáticamente en lista de espera con sistema de prioridades y ofertas con tiempo límite.",
      benefits: [
        "Registro automático cuando no hay plazas",
        "Sistema de prioridades por rol",
        "Ofertas con tiempo límite",
        "Penalizaciones por rechazos"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/waitlist.png",
      imagePosition: "right"
    },
    {
      id: "incidents",
      title: "Gestión de Incidentes con Foto",
      description: "Reporta plazas ocupadas indebidamente desde el móvil con foto. El sistema identifica al infractor y reasigna automáticamente una plaza alternativa.",
      benefits: [
        "Reporte con foto desde móvil",
        "Identificación automática de infractores",
        "Reasignación automática de plaza",
        "Advertencias automáticas"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/incidents.png",
      imagePosition: "left"
    },
    {
      id: "notifications",
      title: "Sistema de Notificaciones Inteligente",
      description: "Notificaciones in-app en tiempo real y emails automáticos. Los usuarios configuran sus preferencias y reciben recordatorios de check-in.",
      benefits: [
        "Notificaciones in-app en tiempo real",
        "Emails automáticos personalizables",
        "Preferencias por tipo de notificación",
        "Recordatorios de check-in"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/notifications.png",
      imagePosition: "right"
    },
    {
      id: "warnings",
      title: "Gestión de Advertencias",
      description: "Tracking completo de infracciones con bloqueos temporales automáticos. Historial permanente e indicadores visuales para transparencia total.",
      benefits: [
        "Tracking completo de infracciones",
        "Bloqueos temporales automáticos",
        "Historial permanente",
        "Indicadores visuales en perfil"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/warnings.png",
      imagePosition: "left"
    },
    {
      id: "offline",
      title: "Modo Offline",
      description: "Funciona sin conexión a internet. Cache local de datos con sincronización automática cuando se recupera la conexión.",
      benefits: [
        "Funciona sin conexión",
        "Cache local de 7 días",
        "Sincronización automática",
        "Indicadores de estado claros"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/offline.png",
      imagePosition: "right"
    },
    {
      id: "admin",
      title: "Panel de Administración Completo",
      description: "Gestión total de usuarios, plazas, grupos y configuración. Editor visual de plazas, estadísticas en tiempo real y reportes automáticos.",
      benefits: [
        "Gestión completa de usuarios y plazas",
        "Editor visual drag & drop",
        "Estadísticas y reportes automáticos",
        "Configuración centralizada"
      ],
      imageUrl: "https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/landing-screenshots/admin.png",
      imagePosition: "left"
    }
  ],

  // MÓDULOS DETALLADOS
  modules: [
    {
      id: "reservations",
      name: "Reservas",
      icon: AlertTriangle,
      features: [
        { name: "Validación inteligente de plazas PMR", badge: "new" },
        { name: "Control de plazas con cargador eléctrico", badge: "new" },
        { name: "Gestión de motos y vehículos compactos", badge: "new" },
        { name: "Calendario mensual intuitivo", badge: "popular" },
        { name: "Mapa interactivo con código de colores" },
        { name: "Grupos y roles con prioridades" },
        { name: "Gestión de matrículas" },
        { name: "Validación automática de permisos" },
        { name: "Bloqueo de fechas por admin" }
      ]
    },
    {
      id: "checkin",
      name: "Check-in",
      icon: AlertTriangle,
      features: [
        { name: "Check-in obligatorio", badge: "new" },
        { name: "Detección de infracciones" },
        { name: "Bloqueos temporales automáticos" },
        { name: "Reportes de cumplimiento" },
        { name: "Configuración por grupo" },
        { name: "Liberación temprana de plazas" }
      ]
    },
    {
      id: "waitlist",
      name: "Lista de Espera",
      icon: AlertTriangle,
      features: [
        { name: "Registro automático", badge: "new" },
        { name: "Sistema de prioridades" },
        { name: "Ofertas con tiempo límite" },
        { name: "Penalizaciones por rechazos" },
        { name: "Posición en cola visible" },
        { name: "Procesamiento automático" }
      ]
    },
    {
      id: "incidents",
      name: "Incidentes",
      icon: AlertTriangle,
      features: [
        { name: "Reporte con foto", badge: "popular" },
        { name: "Reasignación automática" },
        { name: "Identificación de infractores" },
        { name: "Advertencias automáticas" },
        { name: "Tracking completo" },
        { name: "Grupos de reserva para incidentes" }
      ]
    },
    {
      id: "notifications",
      name: "Notificaciones",
      icon: Bell,
      features: [
        { name: "Notificaciones in-app en tiempo real", badge: "new" },
        { name: "Emails automáticos" },
        { name: "Preferencias personalizables" },
        { name: "Recordatorios de check-in" },
        { name: "Alertas de ofertas de waitlist" },
        { name: "Notificaciones de advertencias" }
      ]
    },
    {
      id: "admin",
      name: "Administración",
      icon: AlertTriangle,
      features: [
        { name: "Gestión de usuarios y roles" },
        { name: "Editor visual de plazas", badge: "popular" },
        { name: "Aprobación de matrículas" },
        { name: "Gestión de incidentes" },
        { name: "Estadísticas en tiempo real" },
        { name: "Configuración global del sistema" }
      ]
    }
  ],

  // BENEFICIOS POR ROL
  roleBenefits: [
    {
      role: "Empleados",
      icon: AlertTriangle,
      color: "blue",
      benefits: [
        "Reserva fácil y rápida desde móvil",
        "Visibilidad de disponibilidad en tiempo real",
        "Notificaciones automáticas",
        "Gestión de matrículas sin papeleos",
        "Check-in desde el móvil"
      ],
      quote: "Ya no pierdo tiempo buscando plaza. Reservo en 30 segundos desde mi móvil."
    },
    {
      role: "Administradores",
      icon: AlertTriangle,
      color: "purple",
      benefits: [
        "Control total de usuarios y permisos",
        "Aprobación de matrículas centralizada",
        "Gestión de incidentes con evidencia",
        "Reportes automáticos sin trabajo manual",
        "Configuración flexible por grupo"
      ],
      quote: "Antes dedicaba 5 horas semanales a gestionar el parking. Ahora son 30 minutos."
    },
    {
      role: "Directores",
      icon: AlertTriangle,
      color: "green",
      benefits: [
        "Visibilidad completa de ocupación",
        "Estadísticas en tiempo real",
        "Optimización de recursos",
        "Reducción de conflictos a cero",
        "Trazabilidad total de operaciones"
      ],
      quote: "Tenemos datos precisos para tomar decisiones sobre ampliación de plazas."
    }
  ],

  // BENEFICIOS CLAVE
  keyBenefits: [
    {
      icon: ShieldCheck,
      title: "Cero conflictos de doble reserva",
      description: "El sistema garantiza por diseño que cada plaza solo puede reservarse una vez por fecha. Imposible crear conflictos."
    },
    {
      icon: FileCheck,
      title: "Trazabilidad completa de ocupación",
      description: "Logs automáticos de todas las operaciones. Sabes quién reservó qué, cuándo y por qué en todo momento."
    },
    {
      icon: Zap,
      title: "Gestión automatizada de incidentes",
      description: "Desde el reporte con foto hasta la reasignación y advertencia al infractor. Todo automático."
    },
    {
      icon: Bell,
      title: "Notificaciones en tiempo real",
      description: "In-app y email. Los usuarios siempre están informados de ofertas, recordatorios y advertencias."
    }
  ],

  // CASOS DE USO
  useCases: [
    {
      industry: "Oficinas Corporativas",
      icon: Building2,
      description: "Gestión de múltiples plantas con roles por departamento y acceso para visitantes externos.",
      benefits: [
        "Gestión de múltiples plantas/edificios",
        "Roles por departamento",
        "Acceso para visitantes"
      ]
    },
    {
      industry: "Hospitales y Centros Médicos",
      icon: Hospital,
      description: "Personal médico con prioridad, turnos rotativos y gestión de emergencias.",
      benefits: [
        "Personal médico prioritario",
        "Turnos rotativos 24/7",
        "Gestión de emergencias"
      ]
    },
    {
      industry: "Universidades",
      icon: GraduationCap,
      description: "Profesores y estudiantes con horarios académicos y eventos especiales.",
      benefits: [
        "Profesores y estudiantes",
        "Horarios académicos",
        "Eventos especiales"
      ]
    },
    {
      industry: "Centros Comerciales",
      icon: ShoppingBag,
      description: "Empleados de tiendas con gestión de turnos y alta rotación.",
      benefits: [
        "Empleados de múltiples tiendas",
        "Gestión de turnos",
        "Alta rotación"
      ]
    }
  ],

  // COMPARACIÓN
  comparisons: [
    {
      aspect: "Reservas",
      manual: "Excel/Email desactualizados",
      withReserveo: "Sistema centralizado en tiempo real"
    },
    {
      aspect: "Conflictos",
      manual: "Posibles y frecuentes",
      withReserveo: "Imposibles por diseño"
    },
    {
      aspect: "Visibilidad",
      manual: "Limitada y desactualizada",
      withReserveo: "Tiempo real con estadísticas"
    },
    {
      aspect: "Control de presencia",
      manual: "Manual o inexistente",
      withReserveo: "Check-in automático con infracciones"
    },
    {
      aspect: "Gestión de incidentes",
      manual: "Llamadas y emails",
      withReserveo: "Sistema con fotos y reasignación"
    },
    {
      aspect: "Reportes",
      manual: "Manuales y tediosos",
      withReserveo: "Automáticos y en tiempo real"
    }
  ],

  // TECNOLOGÍAS
  technologies: [
    { 
      name: "React + TypeScript", 
      logo: "react",
      description: "Framework moderno para interfaces de usuario"
    },
    { 
      name: "Supabase", 
      logo: "supabase",
      description: "Base de datos PostgreSQL con seguridad RLS"
    },
    { 
      name: "Vercel", 
      logo: "vercel",
      description: "Infraestructura de hosting escalable"
    },
    { 
      name: "Tailwind CSS", 
      logo: "tailwind",
      description: "Framework CSS para diseño responsive"
    }
  ],

  // SEGURIDAD - Orientado al cliente
  securityFeatures: [
    {
      icon: Shield,
      name: "Protección Total de Datos",
      description: "Tus datos están protegidos con los más altos estándares de seguridad. Cumplimos con GDPR y todas las normativas europeas de protección de datos."
    },
    {
      icon: Lock,
      name: "Acceso Seguro Garantizado",
      description: "Sistema de autenticación de nivel bancario. Solo las personas autorizadas pueden acceder a la información de tu empresa."
    },
    {
      icon: Database,
      name: "Cifrado de Información",
      description: "Toda tu información viaja y se almacena cifrada. Nadie puede interceptar ni acceder a tus datos sin autorización."
    },
    {
      icon: RefreshCw,
      name: "Copias de Seguridad Automáticas",
      description: "Realizamos copias de seguridad diarias de forma automática. Nunca perderás información, incluso ante cualquier imprevisto."
    },
    {
      icon: Cloud,
      name: "Disponible 24/7 desde Cualquier Lugar",
      description: "Accede de forma segura desde cualquier dispositivo, en cualquier momento. Conexión cifrada garantizada."
    },
    {
      icon: Zap,
      name: "Funciona Incluso Sin Internet",
      description: "Modo offline seguro que te permite consultar información incluso sin conexión. Tus datos se sincronizan automáticamente cuando vuelves a conectarte."
    }
  ],

  // PRICING
  pricingTiers: [
    {
      name: "Starter",
      description: "Para pequeñas empresas",
      price: "Desde €299",
      priceUnit: "/mes",
      priceNote: "Facturación anual",
      ctaText: "Solicitar Demo Gratuita",
      features: [
        "Hasta 50 plazas",
        "Funcionalidades básicas",
        "Soporte por email",
        "1 grupo de parking",
        "Usuarios ilimitados"
      ],
      valueProps: [
        "✓ Sin compromiso de permanencia",
        "✓ Setup incluido"
      ]
    },
    {
      name: "Professional",
      description: "Para empresas medianas",
      recommended: true,
      price: "Desde €599",
      priceUnit: "/mes",
      priceNote: "Facturación anual",
      ctaText: "Hablar con Ventas",
      features: [
        "Hasta 200 plazas",
        "Todas las funcionalidades",
        "Soporte prioritario",
        "Grupos ilimitados",
        "Usuarios ilimitados",
        "Estadísticas avanzadas"
      ],
      valueProps: [
        "✓ Prueba gratuita de 14 días",
        "✓ Onboarding personalizado"
      ]
    },
    {
      name: "Enterprise",
      description: "Para grandes corporaciones",
      ctaText: "Obtener Presupuesto",
      features: [
        "Plazas ilimitadas",
        "Personalización completa",
        "Soporte dedicado 24/7",
        "Grupos ilimitados",
        "Usuarios ilimitados",
        "Integración con sistemas existentes"
      ],
      valueProps: [
        "✓ SLA garantizado",
        "✓ Account manager dedicado"
      ]
    }
  ],

  // FAQs
  faqs: [
    {
      question: "¿Cuánto tiempo toma implementar RESERVEO?",
      answer: "La implementación básica toma entre 1-2 días. Incluye configuración inicial, carga de usuarios y plazas, y capacitación del equipo. Puedes estar operativo en menos de una semana."
    },
    {
      question: "¿Necesitamos hardware especial?",
      answer: "No. RESERVEO es 100% web y funciona desde cualquier navegador moderno (Chrome, Firefox, Safari). Los empleados solo necesitan su móvil o computadora."
    },
    {
      question: "¿Funciona en dispositivos móviles?",
      answer: "Sí, completamente. RESERVEO está optimizado para móviles con diseño responsive. Los empleados pueden reservar, hacer check-in y reportar incidentes desde sus smartphones."
    },
    {
      question: "¿Qué pasa si no hay conexión a internet?",
      answer: "RESERVEO incluye modo offline. Los usuarios pueden ver sus reservas y datos en caché local. Las operaciones de escritura se sincronizan automáticamente cuando se recupera la conexión."
    },
    {
      question: "¿Cómo se gestionan y protegen los datos?",
      answer: "Usamos Supabase (PostgreSQL) con Row Level Security, encriptación en tránsito y reposo, backups automáticos diarios, y cumplimos con GDPR. Tus datos están seguros."
    },
    {
      question: "¿Hay límite de usuarios o plazas?",
      answer: "Depende del plan. Starter hasta 50 plazas, Professional hasta 200, y Enterprise sin límites. Los usuarios son siempre ilimitados en todos los planes."
    },
    {
      question: "¿Incluye soporte técnico?",
      answer: "Sí. Todos los planes incluyen soporte. Starter por email, Professional prioritario, y Enterprise con soporte dedicado 24/7."
    },
    {
      question: "¿Se puede personalizar según nuestras necesidades?",
      answer: "Sí. El plan Enterprise incluye personalización completa: branding, integraciones con sistemas existentes, y desarrollo de funcionalidades específicas."
    }
  ],

  // CTA FINAL
  finalCTA: {
    headline: "Transforma la Gestión de tu Aparcamiento Hoy",
    subheadline: "Únete a las empresas que ya optimizaron su parking con RESERVEO"
  },

  // FOOTER
  footer: {
    columns: [
      {
        title: "Producto",
        links: [
          { text: "Características", href: "#features" },
          { text: "Casos de uso", href: "#use-cases" },
          { text: "Pricing", href: "#pricing" },
          { text: "Demo", href: "/auth" }
        ]
      },
      {
        title: "Empresa",
        links: [
          { text: "Sobre nosotros", href: "/about" },
          { text: "Contacto", href: "/contact" },
          { text: "Blog", href: "/blog" },
          { text: "Carreras", href: "/careers" }
        ]
      },
      {
        title: "Legal",
        links: [
          { text: "Privacidad", href: "/privacy" },
          { text: "Términos", href: "/terms" },
          { text: "Cookies", href: "/cookies" },
          { text: "GDPR", href: "/gdpr" }
        ]
      },
      {
        title: "Contacto",
        links: [
          { text: "info@reserveo.app", href: "mailto:info@reserveo.app" },
          { text: "+34 XXX XXX XXX", href: "tel:+34XXXXXXXXX" },
          { text: "LinkedIn", href: "https://linkedin.com" },
          { text: "Twitter", href: "https://twitter.com" }
        ]
      }
    ],
    socialLinks: [
      { platform: "LinkedIn", url: "https://linkedin.com" },
      { platform: "Twitter", url: "https://twitter.com" },
      { platform: "GitHub", url: "https://github.com" }
    ]
  }
};
