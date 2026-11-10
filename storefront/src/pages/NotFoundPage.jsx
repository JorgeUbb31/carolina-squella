import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="container page-state">
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe.</p>
      <Link className="primary-btn" to="/">Volver a la tienda</Link>
    </main>
  )
}
