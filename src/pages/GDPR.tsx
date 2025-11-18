export default function GDPR() {
  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Cumplimiento GDPR</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Compromiso con GDPR</h2>
            <p className="text-muted-foreground">
              RESERVEO cumple con el Reglamento General de Protección de Datos (GDPR) 
              de la Unión Europea.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Tus Derechos bajo GDPR</h2>
            <p className="text-muted-foreground">
              Como usuario, tienes los siguientes derechos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Derecho de acceso a tus datos personales</li>
              <li>Derecho de rectificación de datos incorrectos</li>
              <li>Derecho de supresión ("derecho al olvido")</li>
              <li>Derecho a la portabilidad de datos</li>
              <li>Derecho a oponerte al procesamiento</li>
              <li>Derecho a retirar el consentimiento</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Base Legal del Procesamiento</h2>
            <p className="text-muted-foreground">
              Procesamos tus datos basándonos en:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Ejecución del contrato de servicio</li>
              <li>Cumplimiento de obligaciones legales</li>
              <li>Intereses legítimos de tu organización</li>
              <li>Tu consentimiento explícito cuando sea necesario</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Seguridad de Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas técnicas y organizativas apropiadas para proteger 
              tus datos personales contra acceso no autorizado, pérdida o destrucción.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Transferencias Internacionales</h2>
            <p className="text-muted-foreground">
              Tus datos se almacenan en servidores ubicados en la Unión Europea. 
              Cualquier transferencia internacional cumple con las salvaguardas apropiadas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Ejercer tus Derechos</h2>
            <p className="text-muted-foreground">
              Para ejercer cualquiera de tus derechos bajo GDPR, contacta con nuestro 
              Delegado de Protección de Datos en{' '}
              <a href="mailto:dpo@reserveo.app" className="text-primary hover:underline">
                dpo@reserveo.app
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Autoridad de Supervisión</h2>
            <p className="text-muted-foreground">
              Tienes derecho a presentar una reclamación ante la autoridad de protección 
              de datos de tu país si consideras que el procesamiento de tus datos 
              personales infringe el GDPR.
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
