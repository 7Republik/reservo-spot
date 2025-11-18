export default function Cookies() {
  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Política de Cookies</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. ¿Qué son las Cookies?</h2>
            <p className="text-muted-foreground">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
              cuando visitas un sitio web.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Cookies que Utilizamos</h2>
            <p className="text-muted-foreground">
              RESERVEO utiliza cookies esenciales para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Mantener tu sesión activa</li>
              <li>Recordar tus preferencias</li>
              <li>Mejorar la seguridad</li>
              <li>Analizar el uso del servicio</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Cookies de Terceros</h2>
            <p className="text-muted-foreground">
              Utilizamos servicios de terceros (Supabase, Vercel) que pueden establecer 
              sus propias cookies para proporcionar sus servicios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Control de Cookies</h2>
            <p className="text-muted-foreground">
              Puedes controlar y eliminar cookies a través de la configuración de tu navegador. 
              Ten en cuenta que deshabilitar cookies puede afectar la funcionalidad del servicio.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Más Información</h2>
            <p className="text-muted-foreground">
              Para más información sobre cookies, contacta con{' '}
              <a href="mailto:privacy@reserveo.app" className="text-primary hover:underline">
                privacy@reserveo.app
              </a>
            </p>
          </section>
        </div>

        <div className="text-center pt-8">
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
