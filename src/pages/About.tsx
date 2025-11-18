export default function About() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold text-foreground">Sobre RESERVEO</h1>
        <p className="text-lg text-muted-foreground">
          RESERVEO es un sistema inteligente de gestión de aparcamiento corporativo 
          diseñado para eliminar conflictos, automatizar procesos y proporcionar 
          trazabilidad completa.
        </p>
        <p className="text-muted-foreground">
          Desarrollado con tecnologías modernas y enfocado en la experiencia del usuario, 
          RESERVEO transforma la gestión de parking de tu empresa.
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
