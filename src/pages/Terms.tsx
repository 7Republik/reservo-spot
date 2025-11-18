export default function Terms() {
  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Términos y Condiciones</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Aceptación de Términos</h2>
            <p className="text-muted-foreground">
              Al utilizar RESERVEO, aceptas estos términos y condiciones en su totalidad.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Uso del Servicio</h2>
            <p className="text-muted-foreground">
              RESERVEO es un sistema de gestión de aparcamiento corporativo. 
              Te comprometes a usar el servicio de manera responsable y conforme a las 
              políticas de tu organización.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Responsabilidades del Usuario</h2>
            <p className="text-muted-foreground">
              Los usuarios son responsables de mantener la confidencialidad de sus credenciales 
              y de todas las actividades realizadas bajo su cuenta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground">
              RESERVEO se proporciona "tal cual" sin garantías de ningún tipo. 
              No nos hacemos responsables de daños indirectos o consecuentes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Modificaciones</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Los cambios serán notificados a los usuarios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Contacto</h2>
            <p className="text-muted-foreground">
              Para consultas sobre estos términos, contacta con{' '}
              <a href="mailto:legal@reserveo.app" className="text-primary hover:underline">
                legal@reserveo.app
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
