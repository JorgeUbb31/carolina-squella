import { useEffect, useState } from 'react'

export default function ProductImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div
        className={`${className || ''} product-image-fallback`.trim()}
        role="img"
        aria-label={alt || 'Imagen no disponible'}
      >
        {(alt || '?').trim().slice(0, 1).toUpperCase()}
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}
