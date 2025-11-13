/**
 * Componente de ejemplo para demostrar FlyonUI Community
 * 
 * Este componente muestra varios componentes de FlyonUI en acción.
 * Puedes usar este archivo como referencia para ver cómo usar FlyonUI.
 */

export const FlyonUIExample = () => {
  return (
    <div className="p-8 space-y-8 bg-base-100">
      <h1 className="text-3xl font-bold">FlyonUI Community - Ejemplos</h1>
      
      {/* Botones */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Botones</h2>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-success">Success</button>
          <button className="btn btn-error">Error</button>
          <button className="btn btn-warning">Warning</button>
          <button className="btn btn-ghost">Ghost</button>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Card 1</h3>
              <p>Contenido de la tarjeta con FlyonUI</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">Acción</button>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Card 2</h3>
              <p>Otra tarjeta de ejemplo</p>
              <div className="card-actions justify-end">
                <button className="btn btn-secondary btn-sm">Acción</button>
              </div>
            </div>
          </div>
          
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Card 3</h3>
              <p>Tercera tarjeta</p>
              <div className="card-actions justify-end">
                <button className="btn btn-success btn-sm">Acción</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Alerts</h2>
        <div className="space-y-2">
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Información importante</span>
          </div>
          
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Operación exitosa</span>
          </div>
          
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Advertencia</span>
          </div>
          
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error en la operación</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Stats (Estadísticas)</h2>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Plazas</div>
            <div className="stat-value text-primary">150</div>
            <div className="stat-desc">En 3 grupos</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Disponibles</div>
            <div className="stat-value text-success">45</div>
            <div className="stat-desc">30% disponibilidad</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Reservadas</div>
            <div className="stat-value text-warning">105</div>
            <div className="stat-desc">70% ocupación</div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-secondary">Secondary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-error">Error</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-info">Info</span>
        </div>
      </section>

      {/* Form Controls */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Controls</h2>
        <div className="space-y-4 max-w-md">
          <label className="form-control">
            <span className="label-text">Email</span>
            <input type="email" className="input input-bordered" placeholder="tu@email.com" />
          </label>
          
          <label className="form-control">
            <span className="label-text">Mensaje</span>
            <textarea className="textarea textarea-bordered" placeholder="Escribe tu mensaje"></textarea>
          </label>
          
          <label className="form-control">
            <span className="label-text">Selecciona una opción</span>
            <select className="select select-bordered">
              <option>Opción 1</option>
              <option>Opción 2</option>
              <option>Opción 3</option>
            </select>
          </label>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input type="checkbox" className="checkbox" />
              <span className="label-text">Acepto los términos</span>
            </label>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Progress</h2>
        <div className="space-y-2">
          <progress className="progress progress-primary" value="70" max="100"></progress>
          <progress className="progress progress-success" value="40" max="100"></progress>
          <progress className="progress progress-warning" value="90" max="100"></progress>
        </div>
      </section>

      {/* Loading */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading</h2>
        <div className="flex gap-4">
          <span className="loading loading-spinner loading-xs"></span>
          <span className="loading loading-spinner loading-sm"></span>
          <span className="loading loading-spinner loading-md"></span>
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </section>

      {/* Skeleton */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeleton (Loading State)</h2>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="skeleton h-4 w-28 mb-4"></div>
            <div className="skeleton h-32 w-full mb-4"></div>
            <div className="skeleton h-4 w-full mb-2"></div>
            <div className="skeleton h-4 w-3/4"></div>
          </div>
        </div>
      </section>
    </div>
  );
};
