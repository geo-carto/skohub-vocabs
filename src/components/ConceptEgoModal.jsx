import { useRef, useState, useEffect } from "react"
import { withPrefix } from "gatsby"
import { getFilePath } from "../common"

const SEMANTIC_PROPS = ["related", "exactMatch", "closeMatch", "relatedMatch", "broadMatch", "narrowMatch"]

const PRED_COLORS = {
  broader:      "rgb(165,85,55)",
  narrower:     "rgb(165,55,55)",
  related:      "rgb(65,115,185)",
  exactMatch:   "rgb(50,145,90)",
  closeMatch:   "rgb(85,160,110)",
  relatedMatch: "rgb(135,65,175)",
  broadMatch:   "rgb(25,155,155)",
  narrowMatch:  "rgb(50,120,120)",
}

function getNodeFill(direction, ringDepth) {
  const f = (ringDepth - 1) * 20
  switch (direction) {
    case "center":         return "rgb(210,90,75)"
    case "broader":        return `rgb(${Math.min(240,215+f)},${Math.min(220,138+f)},${Math.min(210,90+f)})`
    case "narrower":       return `rgb(${Math.min(240,200+f)},${Math.min(190,90+f)},${Math.min(185,85+f)})`
    case "related":        return `rgb(${Math.min(200,88+f)},${Math.min(210,138+f)},${Math.min(235,205+f)})`
    case "external-match": return `rgb(${Math.min(210,118+f)},${Math.min(215,160+f)},${Math.min(235,212+f)})`
    default:               return `rgb(${Math.min(210,118+f)},${Math.min(215,160+f)},${Math.min(235,212+f)})`
  }
}

function nodeRadius(direction, ringDepth = 0) {
  const base = direction === "center" ? 34 : direction === "broader" || direction === "narrower" ? 28 : 22
  return Math.max(12, base - ringDepth * 4)
}


// ─── Build flat map from vocabulary JSON ──────────────────────
function buildFlatMap(vocabId, data, lang) {
  const map = new Map()
  function lbl(c) {
    return c.prefLabel?.[lang] || c.prefLabel?.es || c.prefLabel?.en ||
      c.id?.split("/").pop() || c.id || "?"
  }
  function idsOf(arr) {
    if (!arr) return []
    return (Array.isArray(arr) ? arr : [arr]).map(x => (typeof x === "string" ? x : x?.id)).filter(Boolean)
  }
  function visit(concept) {
    if (map.has(concept.id)) return
    map.set(concept.id, {
      id: concept.id, label: lbl(concept),
      narrowerIds: idsOf(concept.narrower), broaderIds: [],
      _related: idsOf(concept.related), _exactMatch: idsOf(concept.exactMatch),
      _closeMatch: idsOf(concept.closeMatch), _relatedMatch: idsOf(concept.relatedMatch),
      _broadMatch: idsOf(concept.broadMatch), _narrowMatch: idsOf(concept.narrowMatch),
    })
    for (const child of (Array.isArray(concept.narrower) ? concept.narrower : concept.narrower ? [concept.narrower] : [])) visit(child)
  }
  map.set(vocabId, {
    id: vocabId, label: data.title?.[lang] || data.title?.es || data.title?.en || vocabId,
    narrowerIds: idsOf(data.hasTopConcept), broaderIds: [],
    _related: [], _exactMatch: [], _closeMatch: [], _relatedMatch: [], _broadMatch: [], _narrowMatch: [],
  })
  for (const tc of (data.hasTopConcept || [])) visit(tc)
  for (const [, node] of map) {
    for (const cid of node.narrowerIds) {
      const child = map.get(cid)
      if (child && !child.broaderIds.includes(node.id)) child.broaderIds.push(node.id)
    }
  }
  return map
}

// ─── Build subgraph with separate broader/narrower depths ─────
// focalConcept: raw Gatsby concept prop (authoritative source for match data)
function buildSubgraph(focalId, allMap, depthBroader, depthNarrow, showMatches, focalConcept) {
  const nodeMap = new Map()
  const edges = []
  const edgeSet = new Set()
  const focal = allMap.get(focalId)
  if (!focal) return { nodes: [], edges: [] }
  nodeMap.set(focalId, { id: focalId, label: focal.label, ringDepth: 0, direction: "center" })

  function addEdge(s, t, predicate) {
    const key = `${predicate}:${s}|${t}`
    if (!edgeSet.has(key)) { edgeSet.add(key); edges.push({ s, t, predicate }) }
  }

  // BFS upward (broader)
  {
    const queue = [{ id: focalId, depth: 0 }]
    while (queue.length) {
      const { id, depth } = queue.shift()
      if (depth >= depthBroader) continue
      const c = allMap.get(id); if (!c) continue
      for (const bid of c.broaderIds) {
        if (!allMap.has(bid)) continue
        if (!nodeMap.has(bid)) {
          nodeMap.set(bid, { id: bid, label: allMap.get(bid).label, ringDepth: depth + 1, direction: "broader" })
          queue.push({ id: bid, depth: depth + 1 })
        }
        addEdge(id, bid, "broader")
      }
    }
  }

  // BFS downward (narrower)
  {
    const queue = [{ id: focalId, depth: 0 }]
    while (queue.length) {
      const { id, depth } = queue.shift()
      if (depth >= depthNarrow) continue
      const c = allMap.get(id); if (!c) continue
      for (const nid of c.narrowerIds) {
        if (!allMap.has(nid)) continue
        if (!nodeMap.has(nid)) {
          nodeMap.set(nid, { id: nid, label: allMap.get(nid).label, ringDepth: depth + 1, direction: "narrower" })
          queue.push({ id: nid, depth: depth + 1 })
        }
        addEdge(id, nid, "narrower")
      }
    }
  }

  // Semantic matches — read directly from the Gatsby concept prop (guaranteed complete)
  if (showMatches && focalConcept) {
    const idsOfMatch = (arr) => {
      if (!arr) return []
      return (Array.isArray(arr) ? arr : [arr]).map(x => (typeof x === "string" ? x : x?.id)).filter(Boolean)
    }
    for (const prop of SEMANTIC_PROPS) {
      for (const tid of idsOfMatch(focalConcept[prop])) {
        if (!nodeMap.has(tid)) {
          const dir = prop === "related" ? "related" : "external-match"
          const label = allMap.get(tid)?.label || tid.split("/").pop() || tid
          nodeMap.set(tid, { id: tid, label, ringDepth: 1, direction: dir })
        }
        addEdge(focalId, tid, prop)
      }
    }
  }

  return { nodes: [...nodeMap.values()], edges }
}

// ─── Compute real max depths reachable from a focal concept ──
function computeMaxDepths(focalId, allMap) {
  let maxBroader = 0
  const vB = new Set([focalId])
  const qB = [{ id: focalId, d: 0 }]
  while (qB.length) {
    const { id, d } = qB.shift()
    maxBroader = Math.max(maxBroader, d)
    for (const bid of (allMap.get(id)?.broaderIds || [])) {
      if (!vB.has(bid) && allMap.has(bid)) { vB.add(bid); qB.push({ id: bid, d: d + 1 }) }
    }
  }
  let maxNarrow = 0
  const vN = new Set([focalId])
  const qN = [{ id: focalId, d: 0 }]
  while (qN.length) {
    const { id, d } = qN.shift()
    maxNarrow = Math.max(maxNarrow, d)
    for (const nid of (allMap.get(id)?.narrowerIds || [])) {
      if (!vN.has(nid) && allMap.has(nid)) { vN.add(nid); qN.push({ id: nid, d: d + 1 }) }
    }
  }
  return { maxBroader, maxNarrow }
}

// ─── Concentric ring layout ───────────────────────────────────
const RING_RADII = [0, 155, 265, 368, 466, 560, 650, 737, 820]

function layoutNodes(nodes, cx, cy) {
  const rings = {}
  for (const n of nodes) {
    const r = n.ringDepth
    if (!rings[r]) rings[r] = []
    rings[r].push(n)
  }
  const pos = {}
  if (rings[0]?.length) pos[rings[0][0].id] = { x: cx, y: cy }
  const maxRing = Math.max(...Object.keys(rings).map(Number))
  for (let r = 1; r <= maxRing; r++) {
    const ring = rings[r] || []
    if (!ring.length) continue
    const R = RING_RADII[Math.min(r, RING_RADII.length - 1)] || r * 110
    ring.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / ring.length - Math.PI / 2
      pos[n.id] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) }
    })
  }
  return pos
}

// ─── Depth button row (shows 0..max buttons) ──────────────────
function DepthBtns({ label, value, max, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3 }}>
      <span style={{ fontSize:11, color:"rgb(100,80,60)", whiteSpace:"nowrap" }}>{label}</span>
      {Array.from({ length: max + 1 }, (_, d) => d).map(d => (
        <button key={d} onClick={() => onChange(d)} style={{
          width:21, height:21, borderRadius:"50%", fontFamily:"inherit",
          border:`1.5px solid ${value===d ? "rgb(196,95,40)" : "rgb(220,205,185)"}`,
          background: value===d ? "rgb(196,95,40)" : "white",
          color: value===d ? "white" : "rgb(80,60,40)",
          cursor:"pointer", fontSize:11, fontWeight: value===d ? 700 : 400,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.12s", padding:0,
        }}>{d}</button>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────
const ConceptEgoModal = ({ concept, language, customDomain, onClose }) => {
  const containerRef  = useRef(null)
  const panRef        = useRef({ x: 0, y: 0 })
  const scaleRef      = useRef(1)
  const canvasDragRef = useRef(null)  // { sx, sy, ox, oy }
  const nodeDragRef   = useRef(null)  // { id, ox, oy, sx, sy }

  const [pan, setPan]           = useState({ x: 0, y: 0 })
  const [scale, setScale]       = useState(1)
  const [size, setSize]         = useState({ w: 800, h: 560 })
  const [allMap, setAllMap]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [err, setErr]           = useState(null)
  const [depthBroader, setDepthBroader] = useState(1)
  const [depthNarrow, setDepthNarrow]   = useState(1)
  const [showMatches, setShowMatches]   = useState(false)
  const [nodeOverrides, setNodeOverrides] = useState({})
  const [maxDepths, setMaxDepths]       = useState({ maxBroader: 5, maxNarrow: 5 })

  const centerLabel = concept.prefLabel?.[language]
    || concept.prefLabel?.es || concept.prefLabel?.en
    || concept.id?.split("/").pop() || "?"

  const rawScheme = concept.inSchemeAll
  const vocabId = (Array.isArray(rawScheme) ? rawScheme : rawScheme ? [rawScheme] : [])
    .filter(Boolean)[0]?.id

  useEffect(() => {
    if (!vocabId) { setLoading(false); return }
    const path = withPrefix(getFilePath(vocabId, "json", customDomain))
    fetch(path)
      .then(r => r.json())
      .then(data => {
        const m = buildFlatMap(vocabId, data, language)
        setAllMap(m)
        setMaxDepths(computeMaxDepths(concept.id, m))
        setLoading(false)
      })
      .catch(() => {
        setErr(language === "en" ? "Could not load vocabulary" : "No se pudo cargar el vocabulario")
        setLoading(false)
      })
  }, [vocabId, language])

  useEffect(() => {
    const el = containerRef.current
    if (el) setSize({ w: el.clientWidth, h: el.clientHeight })
  }, [])

  // Reset overrides only when matches toggle changes (adds/removes a different node set)
  useEffect(() => { setNodeOverrides({}) }, [showMatches])

  const { nodes, edges } = allMap
    ? buildSubgraph(concept.id, allMap, depthBroader, depthNarrow, showMatches, concept)
    : { nodes: [], edges: [] }

  const { w, h } = size
  const cx = w / 2, cy = h / 2
  const basePos = layoutNodes(nodes, cx, cy)

  // Merge computed positions with user-dragged overrides
  const posMap = { ...basePos, ...nodeOverrides }

  const presentPreds = [...new Set(edges.map(e => e.predicate))]

  // Count match relations on the focal concept (from Gatsby data)
  const _idsOf = arr => !arr ? [] : (Array.isArray(arr) ? arr : [arr]).map(x => typeof x === "string" ? x : x?.id).filter(Boolean)
  const matchCount = SEMANTIC_PROPS.reduce((n, p) => n + _idsOf(concept[p]).length, 0)

  // ── Interaction handlers ───────────────────────────────────
  const onCanvasMouseDown = (e) => {
    if (nodeDragRef.current) return
    canvasDragRef.current = { sx: e.clientX, sy: e.clientY, ox: panRef.current.x, oy: panRef.current.y }
  }

  const onMouseMove = (e) => {
    if (nodeDragRef.current) {
      const { id, ox, oy, sx, sy } = nodeDragRef.current
      const dx = (e.clientX - sx) / scaleRef.current
      const dy = (e.clientY - sy) / scaleRef.current
      if (Math.abs(e.clientX - sx) > 4 || Math.abs(e.clientY - sy) > 4) {
        nodeDragRef.current.moved = true
      }
      setNodeOverrides(prev => ({ ...prev, [id]: { x: ox + dx, y: oy + dy } }))
      return
    }
    if (!canvasDragRef.current) return
    const nx = canvasDragRef.current.ox + e.clientX - canvasDragRef.current.sx
    const ny = canvasDragRef.current.oy + e.clientY - canvasDragRef.current.sy
    panRef.current = { x: nx, y: ny }; setPan({ x: nx, y: ny })
  }

  const onMouseUp = () => {
    if (nodeDragRef.current && !nodeDragRef.current.moved && nodeDragRef.current.url) {
      window.open(nodeDragRef.current.url, "_blank")
    }
    canvasDragRef.current = null
    nodeDragRef.current = null
  }

  const onWheel = (e) => {
    e.preventDefault()
    const s = Math.max(0.15, Math.min(4, scaleRef.current - e.deltaY * 0.001))
    scaleRef.current = s; setScale(s)
  }

  const onNodeMouseDown = (e, nodeId, nodeUrl, pos) => {
    e.stopPropagation()
    nodeDragRef.current = { id: nodeId, url: nodeUrl, ox: pos.x, oy: pos.y, sx: e.clientX, sy: e.clientY, moved: false }
  }

  // ── Legend ────────────────────────────────────────────────
  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.55)",
        display:"flex",alignItems:"center",justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background:"white",borderRadius:"12px",width:"90vw",height:"86vh",
        display:"flex",flexDirection:"column",overflow:"hidden",
        boxShadow:"0 8px 48px rgba(0,0,0,0.35)" }}>

        {/* ── Header ── */}
        <div style={{ padding:"8px 14px",borderBottom:"1px solid rgb(220,205,185)",flexShrink:0,
          display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>

          <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
            <span style={{ fontWeight:700,fontSize:"14px",color:"rgb(35,15,5)",whiteSpace:"nowrap" }}>
              {language==="en"?"Concept graph":"Grafo del concepto"}
            </span>
            <span style={{ fontSize:"12px",color:"rgb(130,110,90)",overflow:"hidden",
              textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
              — {centerLabel}
            </span>
            <span style={{ fontSize:"10px",color:"rgb(130,110,90)",background:"rgb(244,240,232)",
              borderRadius:"10px",padding:"1px 7px",whiteSpace:"nowrap",flexShrink:0 }}>
              {nodes.length} {language==="en"?"nodes":"nodos"}
            </span>
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0,flexWrap:"wrap" }}>
            <DepthBtns label="↑ Broader:" value={depthBroader} max={maxDepths.maxBroader} onChange={setDepthBroader} />
            <DepthBtns label="↓ Narrower:" value={depthNarrow} max={maxDepths.maxNarrow} onChange={setDepthNarrow} />
            <button
              onClick={() => setShowMatches(m => !m)}
              style={{
                padding:"3px 10px",borderRadius:"12px",fontFamily:"inherit",fontSize:11,
                border:`1.5px solid ${showMatches ? "rgb(196,95,40)" : "rgb(220,205,185)"}`,
                background: showMatches ? "rgb(255,245,235)" : "white",
                color: showMatches ? "rgb(196,95,40)" : matchCount===0 ? "rgb(185,170,150)" : "rgb(100,80,60)",
                cursor:"pointer",
                transition:"all 0.12s",
                opacity: matchCount===0 ? 0.55 : 1,
              }}>
              {`External Matches${matchCount > 0 ? ` (${matchCount})` : ""}`}
            </button>
          </div>

          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",
            fontSize:"22px",color:"rgb(130,110,90)",lineHeight:1,padding:"0 4px",flexShrink:0 }}>×</button>
        </div>

        {/* ── Canvas ── */}
        <div ref={containerRef}
          style={{ flex:1,overflow:"hidden",position:"relative",
            background:"rgb(250,248,245)",cursor:"grab" }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          {loading && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",
              justifyContent:"center",color:"rgb(130,110,90)",fontSize:"15px" }}>
              {language==="en"?"Loading…":"Cargando…"}
            </div>
          )}
          {err && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",
              justifyContent:"center",color:"rgb(200,60,60)",fontSize:"15px" }}>{err}</div>
          )}
          {!loading && !err && nodes.length === 0 && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",
              justifyContent:"center",color:"rgb(130,110,90)",fontSize:"15px" }}>
              {language==="en"?"No relations found":"Sin relaciones encontradas"}
            </div>
          )}

          {!loading && !err && nodes.length > 0 && (
            <svg width="100%" height="100%" style={{ userSelect:"none",display:"block" }}>
              <defs>
                {presentPreds.map(pred => {
                  const col = PRED_COLORS[pred] || "rgb(150,130,110)"
                  return (
                    <marker key={pred} id={`ego-arr-${pred}`}
                      viewBox="0 -4 8 8" refX="7" refY="0"
                      markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M0,-4L8,0L0,4" fill={col} />
                    </marker>
                  )
                })}
              </defs>

              <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>

                {/* ── Edges ── */}
                {edges.map((e, i) => {
                  const sp = posMap[e.s], tp = posMap[e.t]
                  if (!sp || !tp) return null
                  const col = PRED_COLORS[e.predicate] || "rgb(150,130,110)"
                  const nS = nodes.find(n => n.id === e.s)
                  const nT = nodes.find(n => n.id === e.t)
                  const rS = nodeRadius(nS?.direction || "", nS?.ringDepth || 0)
                  const rT = nodeRadius(nT?.direction || "", nT?.ringDepth || 0)
                  const dx = tp.x-sp.x, dy = tp.y-sp.y
                  const dist = Math.sqrt(dx*dx+dy*dy) || 1
                  const ux = dx/dist, uy = dy/dist
                  const x1 = sp.x+ux*rS, y1 = sp.y+uy*rS
                  const x2 = tp.x-ux*(rT+8), y2 = tp.y-uy*(rT+8)
                  const mx = (x1+x2)/2, my = (y1+y2)/2
                  const angleDeg = Math.atan2(dy,dx)*180/Math.PI
                  const flip = angleDeg > 90 || angleDeg < -90
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={col} strokeWidth={1.5} strokeOpacity={0.75}
                        markerEnd={`url(#ego-arr-${e.predicate})`} />
                      <text x={mx} y={my} dy={-5} textAnchor="middle"
                        fontSize={10} fontFamily="sans-serif" fontStyle="italic" fill={col}
                        transform={`rotate(${flip ? angleDeg+180 : angleDeg},${mx},${my})`}
                        style={{ pointerEvents:"none" }}>
                        {e.predicate}
                      </text>
                    </g>
                  )
                })}

                {/* ── Nodes ── */}
                {nodes.map(n => {
                  const pos = posMap[n.id]
                  if (!pos) return null
                  const isCenter = n.direction === "center"
                  const fill = getNodeFill(n.direction, n.ringDepth)
                  const r = nodeRadius(n.direction, n.ringDepth)
                  const label = n.label || ""
                  const nodeUrl = isCenter ? null : n.id
                  return (
                    <g key={n.id}
                      style={{ cursor: isCenter ? "grab" : "pointer" }}
                      onMouseDown={e => onNodeMouseDown(e, n.id, nodeUrl, pos)}
                    >
                      {isCenter && (
                        <circle cx={pos.x} cy={pos.y} r={r+10}
                          fill={fill} fillOpacity={0.15} />
                      )}
                      <circle cx={pos.x} cy={pos.y} r={r}
                        fill={fill} stroke="white" strokeWidth={isCenter ? 2.5 : 1.5} />
                      {isCenter ? (
                        <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize={11} fontWeight={700} fontFamily="sans-serif"
                          fill="rgb(20,10,0)" stroke="white" strokeWidth={2} paintOrder="stroke"
                          style={{ pointerEvents:"none" }}>
                          {label}
                        </text>
                      ) : (
                        <text x={pos.x} y={pos.y - (r + 8)} textAnchor="middle"
                          fontSize={11} fontFamily="sans-serif" fill="rgb(45,30,15)"
                          stroke="rgb(250,248,245)" strokeWidth={3} paintOrder="stroke"
                          style={{ pointerEvents:"none" }}>
                          {label}
                        </text>
                      )}
                    </g>
                  )
                })}

              </g>
            </svg>
          )}

          {/* ── Zoom controls ── */}
          <div style={{ position:"absolute",bottom:14,right:14,display:"flex",flexDirection:"column",gap:4 }}>
            {[
              { label:"+", fn:() => { const s=Math.min(4,scaleRef.current+0.2); scaleRef.current=s; setScale(s) } },
              { label:"−", fn:() => { const s=Math.max(0.15,scaleRef.current-0.2); scaleRef.current=s; setScale(s) } },
              { label:"⌖", fn:() => { panRef.current={x:0,y:0}; setPan({x:0,y:0}); scaleRef.current=1; setScale(1); setNodeOverrides({}) } },
            ].map(b => (
              <button key={b.label} onClick={b.fn} style={{
                width:30,height:30,border:"1px solid rgb(220,205,185)",borderRadius:6,
                background:"white",cursor:"pointer",fontSize:b.label==="⌖"?14:18,
                color:"rgb(35,15,5)",display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 1px 4px rgba(0,0,0,0.1)",fontFamily:"sans-serif",
              }}>{b.label}</button>
            ))}
          </div>

          {/* ── Hint ── */}
          <div style={{ position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",
            fontSize:11,color:"rgb(175,155,130)",pointerEvents:"none",whiteSpace:"nowrap" }}>
            {language==="en"
              ? "Drag canvas to pan · Scroll to zoom · Drag node to reposition"
              : "Arrastra el fondo para mover · Rueda para zoom · Arrastra nodo para reposicionar"}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConceptEgoModal
