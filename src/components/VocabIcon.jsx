import { withPrefix } from "gatsby"

const VOCAB_ICONS = {
  "afloramiento-caracter": "/img/vocab-afloramiento-caracter.png",
  "alteracion-grado": "/img/vocab-alteracion-grado.png",
  "alteracion-producto": "/img/vocab-alteracion-producto.png",
  "alteracion-tipo": "/img/vocab-alteracion-tipo.png",
  "coleccion-tipo": "/img/vocab-coleccion-tipo.png",
  "contacto-tipo": "/img/vocab-contacto-tipo.png",
  "edad-geologica": "/img/vocab-edad-geologica.png",
  "estratificacion-grosor": "/img/vocab-estratificacion-grosor.png",
  "estratificacion-patron": "/img/vocab-estratificacion-patron.png",
  "estratificacion-patron-estilo":
    "/img/vocab-estratificacion-patron-estilo.png",
  "evento-proceso": "/img/vocab-evento-proceso.png",
  "geomorfologia-actividad": "/img/vocab-geomorfologia-actividad.png",
  "geomorfologia-tipo-antropogenico":
    "/img/vocab-geomorfologia-tipo-antropogenico.png",
  "geomorfologia-tipo-natural": "/img/vocab-geomorfologia-tipo-natural.png",
  "geomorfologia-tipo-natural-amp":
    "/img/vocab-geomorfologia-tipo-natural-amp.png",
  "metodo-observacion-objeto-cartografiado":
    "/img/vocab-metodo-observacion-objeto-cartografiado.png",
  "marco-de-cartografiado": "/img/vocab-marco-de-cartografiado.png",
  "material-igme": "/img/vocab-material-igme.png",
  "medida-estructural": "/img/vocab-medida-estructural.png",
  "metamorfismo-facies": "/img/vocab-metamorfismo-facies.png",
  "metamorfismo-grado": "/img/vocab-metamorfismo-grado.png",
  "metodo-determinacion": "/img/vocab-metodo-determinacion.png",
  "pliegue-tipo": "/img/vocab-pliegue-tipo.png",
  "rango-estratigrafico": "/img/vocab-rango-estratigrafico.png",
  "falla-tipo": "/img/vocab-falla-tipo.png",
  "superficies-de-estratificacion":
    "/img/vocab-superficies-de-estratificacion.png",
  "evento-ambiente": "/img/vocab-evento-ambiente.png",
  "unidad-geologica-tipo": "/img/vocab-unidad-geologica-tipo.png",
  "unidad-geologica-composicion": "/img/vocab-unidad-geologica-composicion.png",
  "unidad-geologica-rol-parte": "/img/vocab-unidad-geologica-rol-parte.png",
  "unidad-geologica-morfologia": "/img/vocab-unidad-geologica-morfologia.png",
  "alteracion-distribucion": "/img/vocab-alteracion-distribucion.png",
  polaridad: "/img/vocab-polaridad.png",
  "contribucion-rol": "/img/vocab-contribucion-rol.png",
  "convencion-codigo": "/img/vocab-convencion-codigo.png",
  "archivo-tipo": "/img/vocab-archivo-tipo.png",
  "rol-parte-responsable": "/img/vocab-rol-parte-responsable.png",
  "motivo-vacio-valor": "/img/vocab-motivo-vacio-valor.png",
  estado: "/img/vocab-estado.png",
}

const DEFAULT_ICON = (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="6" y="6" width="28" height="28" rx="4" />
    <line x1="12" y1="14" x2="28" y2="14" />
    <line x1="12" y1="20" x2="28" y2="20" />
    <line x1="12" y1="26" x2="22" y2="26" />
  </svg>
)

export const RESOURCE_LOGOS = [
  {
    match: (item) => /skos|w3c/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-skos.png",
  },
  {
    match: (item) => /geosciml/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-geosciml.png",
  },
  {
    match: (item) => /inspire/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-inspire.png",
  },
  {
    match: (item) =>
      /egdi|europe-geology/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-egdi.png",
  },
]

export const getResourceLogo = (item) =>
  RESOURCE_LOGOS.find((logo) => logo.match(item))?.src || null

const VocabIcon = ({ vocabId, colors }) => {
  const slug = vocabId.split("/").pop()
  const icon = VOCAB_ICONS[slug]
  if (typeof icon === "string") {
    return (
      <img
        src={withPrefix(icon)}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    )
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.skoHubMiddleColor,
      }}
    >
      <div style={{ width: "50px", height: "50px" }}>
        {icon || DEFAULT_ICON}
      </div>
    </div>
  )
}

export default VocabIcon
