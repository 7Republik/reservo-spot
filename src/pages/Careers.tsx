export default function Careers() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold text-foreground">Carreras</h1>
        <p className="text-lg text-muted-foreground">
          ¿Te apasiona la tecnología y quieres formar parte de un equipo innovador?
        </p>
        <p className="text-muted-foreground">
          Actualmente no tenemos posiciones abiertas, pero siempre estamos 
          interesados en conocer talento excepcional.
        </p>
        <p className="text-muted-foreground">
          Envía tu CV a{' '}
          <a 
            href="mailto:careers@reserveo.app" 
            className="text-primary hover:underline"
          >
            careers@reserveo.app
          </a>
        </p>
        <a 
          href="/" 
          className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
