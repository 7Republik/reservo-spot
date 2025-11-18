export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-4xl font-bold text-foreground text-center">Contacto</h1>
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Email</h2>
            <a 
              href="mailto:info@reserveo.app" 
              className="text-primary hover:underline"
            >
              info@reserveo.app
            </a>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Teléfono</h2>
            <a 
              href="tel:+34XXXXXXXXX" 
              className="text-primary hover:underline"
            >
              +34 XXX XXX XXX
            </a>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Redes Sociales</h2>
            <div className="space-y-2">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-primary hover:underline"
              >
                LinkedIn
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-primary hover:underline"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
        <div className="text-center">
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
