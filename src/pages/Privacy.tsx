export default function Privacy() {
  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Política de Privacidad</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground">
              En RESERVEO recopilamos únicamente la información necesaria para proporcionar 
              nuestro servicio de gestión de aparcamiento corporativo.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Uso de la Información</h2>
            <p className="text-muted-foreground">
              Utilizamos tu información para gestionar reservas de parking, enviar notificaciones 
              relevantes y mejorar nuestro servicio.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Protección de Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad robustas incluyendo encriptación, 
              Row Level Security y backups automáticos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Tus Derechos</h2>
            <p className="text-muted-foreground">
              Tienes derecho a acceder, rectificar y eliminar tus datos personales 
              en cualquier momento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier consulta sobre privacidad, contacta con{' '}
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
