import { FooterColumn } from '@/data/landingContent';
import { Linkedin, Twitter, Github } from 'lucide-react';

interface FooterProps {
  columns: FooterColumn[];
  socialLinks: { platform: string; url: string }[];
}

export const Footer = ({ columns, socialLinks }: FooterProps) => {
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'github':
        return <Github className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16 max-w-7xl">
        {/* Logo y descripción */}
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <img 
              src="/logo_reserveo.png" 
              alt="RESERVEO - Logo del sistema de gestión de aparcamiento corporativo" 
              className="h-8 sm:h-10 w-auto"
            />
            <span className="text-xl sm:text-2xl font-bold text-foreground">RESERVEO</span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            Sistema inteligente de gestión de aparcamiento corporativo. 
            Sin conflictos, 100% trazable, completamente automatizado.
          </p>
        </div>

        {/* Columnas de links */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {columns.map((column, index) => (
            <div key={index}>
              <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                {column.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Redes sociales y copyright */}
        <div className="pt-6 sm:pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
              <p>© {new Date().getFullYear()} RESERVEO. Todos los derechos reservados.</p>
              <p className="mt-1">
                Desarrollado con ❤️ por{' '}
                <a 
                  href="https://gustoso.studio" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gustoso Studio
                </a>
              </p>
            </div>

            {/* Redes sociales */}
            <div className="flex items-center gap-3 sm:gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.platform}
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
