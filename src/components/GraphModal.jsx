import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { withPrefix } from "gatsby"
import { getFilePath } from "../common"
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force"
import {
  hierarchy,
  tree,
  treemap,
  treemapSliceDice,
  partition,
} from "d3-hierarchy"

// ─── Layout definitions ───────────────────────────────────────
const LAYOUTS = [
  { id: "force", es: "Fuerza", en: "Force" },
  { id: "radial", es: "Radial", en: "Radial" },
  { id: "tree-v", es: "Árbol ↕", en: "Tree ↕" },
  { id: "tree-h", es: "Árbol →", en: "Tree →" },
  { id: "treemap", es: "Treemap", en: "Treemap" },
  { id: "sunburst", es: "Sunburst", en: "Sunburst" },
  { id: "ego", es: "Ego", en: "Ego" },
]

const LINK_LAYOUTS = new Set(["force", "tree-v", "tree-h"])
const RECT_LAYOUTS = new Set(["treemap"])

// ─── Edge type definitions ────────────────────────────────────
const EDGE_DEFS = [
  {
    id: "narrower",
    es: "Jerárquica",
    en: "Hierarchical",
    color: "rgb(196,155,110)",
    hlColor: "rgb(196,95,40)",
    dash: null,
  },
  {
    id: "related",
    es: "Relacionado",
    en: "Related",
    color: "rgb(80,130,210)",
    hlColor: "rgb(50,90,190)",
    dash: "6,3",
  },
  {
    id: "exactMatch",
    es: "ExactMatch",
    en: "ExactMatch",
    color: "rgb(50,165,90)",
    hlColor: "rgb(30,130,60)",
    dash: "2,2",
  },
  {
    id: "closeMatch",
    es: "CloseMatch",
    en: "CloseMatch",
    color: "rgb(100,180,130)",
    hlColor: "rgb(70,150,100)",
    dash: "4,3",
  },
  {
    id: "relatedMatch",
    es: "RelatedMatch",
    en: "RelatedMatch",
    color: "rgb(160,80,200)",
    hlColor: "rgb(130,50,170)",
    dash: "3,3",
  },
  {
    id: "broadMatch",
    es: "BroadMatch",
    en: "BroadMatch",
    color: "rgb(40,180,180)",
    hlColor: "rgb(20,150,150)",
    dash: "5,3",
  },
  {
    id: "narrowMatch",
    es: "NarrowMatch",
    en: "NarrowMatch",
    color: "rgb(80,150,150)",
    hlColor: "rgb(50,120,120)",
    dash: "3,5",
  },
]
const EDGE_BY_ID = Object.fromEntries(EDGE_DEFS.map((e) => [e.id, e]))
const SEMANTIC_PROPS = [
  "related",
  "exactMatch",
  "closeMatch",
  "relatedMatch",
  "broadMatch",
  "narrowMatch",
]
const GRAPH_FONT_FAMILY = "roboto, Roboto, sans-serif"

// ─── Warm monochromatic palette (like ego), subtle branch offset ─
const BRANCH_OFFSETS = [0, 15, -12, 22, -18, 28, -22, 12]
function branchDepthFill(branchIdx, depth) {
  const br =
    branchIdx >= 0 ? BRANCH_OFFSETS[branchIdx % BRANCH_OFFSETS.length] : 0
  const f = Math.min(depth, 6) * 28
  return `rgb(${Math.min(250, 130 + br + f)},${Math.min(
    240,
    50 + f
  )},${Math.min(220, 20 + f)})`
}

function lightBranchDepthFill(branchIdx, depth) {
  const br =
    branchIdx >= 0 ? BRANCH_OFFSETS[branchIdx % BRANCH_OFFSETS.length] : 0
  const palette = [
    [155, 52, 42],
    [185, 70, 58],
    [207, 105, 86],
    [226, 148, 125],
    [239, 188, 168],
    [247, 218, 202],
    [250, 235, 224],
  ]
  const [r, g, b] = palette[Math.min(depth, palette.length - 1)]
  return `rgb(${Math.max(135, Math.min(255, r + br * 0.4))},${Math.max(
    45,
    Math.min(248, g + br * 0.15)
  )},${Math.max(38, Math.min(240, b + br * 0.12))})`
}

// ─── Label helpers ────────────────────────────────────────────
const CHAR_W = 5.8,
  LABEL_H = 13,
  LPAD = 4

function computeLabels(nodeInfo, posMap) {
  const items = nodeInfo
    .map((info) => {
      const pos = posMap[info.id]
      if (!pos || pos.x == null) return null
      const txt = info.label,
        w = txt.length * CHAR_W
      const nr = info.isRoot ? 9 : 6
      const cy0 = pos.y + nr + 3 + LABEL_H / 2
      return {
        id: info.id,
        txt,
        w,
        cx: pos.x,
        cy: cy0,
        nat: cy0,
        nodeX: pos.x,
        nodeY: pos.y,
        nr,
      }
    })
    .filter(Boolean)

  for (let iter = 0; iter < 30; iter++) {
    for (let i = 0; i < items.length; i++) {
      const lbl = items[i]
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j]
        const sepX = (lbl.w + b.w) / 2 + LPAD,
          sepY = LABEL_H + LPAD
        const dx = b.cx - lbl.cx,
          dy = b.cy - lbl.cy
        const ovX = sepX - Math.abs(dx),
          ovY = sepY - Math.abs(dy)
        if (ovX > 0 && ovY > 0) {
          if (ovX < ovY * 0.6) {
            const p = ovX / 2 + 0.5
            if (dx >= 0) {
              lbl.cx -= p
              b.cx += p
            } else {
              lbl.cx += p
              b.cx -= p
            }
          } else {
            const p = ovY / 2 + 0.5
            if (dy >= 0) {
              lbl.cy -= p
              b.cy += p
            } else {
              lbl.cy += p
              b.cy -= p
            }
          }
        }
      }
      for (let j = 0; j < items.length; j++) {
        if (j === i) continue
        const nd = items[j]
        const sepX = lbl.w / 2 + nd.nr + LPAD + 2,
          sepY = LABEL_H / 2 + nd.nr + LPAD + 2
        const dx = lbl.cx - nd.nodeX,
          dy = lbl.cy - nd.nodeY
        const ovX = sepX - Math.abs(dx),
          ovY = sepY - Math.abs(dy)
        if (ovX > 0 && ovY > 0) {
          ovX < ovY
            ? (lbl.cx += (dx >= 0 ? 1 : -1) * (ovX + 0.5))
            : (lbl.cy += (dy >= 0 ? 1 : -1) * (ovY + 0.5))
        }
      }
      lbl.cy += (lbl.nat - lbl.cy) * 0.08
    }
  }
  const out = {}
  items.forEach((it) => {
    out[it.id] = it
  })
  return out
}

// ─── Data helpers ─────────────────────────────────────────────
function getLabel(c, lang) {
  return (
    c.prefLabel?.[lang] ||
    c.prefLabel?.es ||
    c.prefLabel?.en ||
    c.title?.[lang] ||
    c.title?.es ||
    c.title?.en ||
    (c.id || "").split("/").pop() ||
    "?"
  )
}

function ids(arr) {
  if (!arr) return []
  return (Array.isArray(arr) ? arr : [arr])
    .map((x) => (typeof x === "string" ? x : x?.id))
    .filter(Boolean)
}

function buildNode(concept, lang) {
  return {
    id: concept.id,
    label: getLabel(concept, lang),
    _related: ids(concept.related),
    _exactMatch: ids(concept.exactMatch),
    _closeMatch: ids(concept.closeMatch),
    _relatedMatch: ids(concept.relatedMatch),
    _broadMatch: ids(concept.broadMatch),
    _narrowMatch: ids(concept.narrowMatch),
    children: (concept.narrower || []).map((c) => buildNode(c, lang)),
  }
}

function collectEdges(d3Root) {
  const allIds = new Set(d3Root.descendants().map((n) => n.data.id))
  const edges = [],
    seen = new Set()
  d3Root.each((node) => {
    if (node.parent)
      edges.push({ s: node.parent.data.id, t: node.data.id, type: "narrower" })
    SEMANTIC_PROPS.forEach((prop) => {
      ;(node.data[`_${prop}`] || []).forEach((tid) => {
        if (!allIds.has(tid) || tid === node.data.id) return
        const key = `${prop}:${[node.data.id, tid].sort().join("|")}`
        if (seen.has(key)) return
        seen.add(key)
        edges.push({ s: node.data.id, t: tid, type: prop })
      })
    })
  })
  return edges
}

// ─── Arc path for sunburst ────────────────────────────────────
function arcPath(x0, x1, y0, y1, cx, cy) {
  if (x1 - x0 < 0.0001) return ""
  const a0 = x0 - Math.PI / 2,
    a1 = x1 - Math.PI / 2
  const r0 = Math.max(0, y0),
    r1 = Math.max(r0 + 0.5, y1)
  const large = x1 - x0 > Math.PI ? 1 : 0
  const [c0, s0, c1, s1] = [
    Math.cos(a0),
    Math.sin(a0),
    Math.cos(a1),
    Math.sin(a1),
  ]
  if (r0 < 1) {
    return `M ${cx},${cy} L ${cx + r1 * c0},${
      cy + r1 * s0
    } A ${r1},${r1} 0 ${large} 1 ${cx + r1 * c1},${cy + r1 * s1} Z`
  }
  return `M ${cx + r0 * c0},${cy + r0 * s0} A ${r0},${r0} 0 ${large} 1 ${
    cx + r0 * c1
  },${cy + r0 * s1} L ${cx + r1 * c1},${
    cy + r1 * s1
  } A ${r1},${r1} 0 ${large} 0 ${cx + r1 * c0},${cy + r1 * s0} Z`
}

// ─── Ego layout helpers ───────────────────────────────────────
const EGO_PRED_COLORS = {
  broader: "rgb(202, 171, 117)",
  narrower: "rgb(204, 87, 87)",
  related: "rgb(99, 147, 214)",
  exactMatch: "rgb(50,145,90)",
  closeMatch: "rgb(85,160,110)",
  relatedMatch: "rgb(135,65,175)",
  broadMatch: "rgb(25,155,155)",
  narrowMatch: "rgb(50,120,120)",
}
const EGO_RING_RADII = [0, 155, 265, 368, 466, 560, 650, 737, 820]
const EXTERNAL_SOURCE_COLORS = [
  "rgb(82,154,205)",
  "rgb(43,105,166)",
  "rgb(123,177,216)",
  "rgb(30,86,138)",
  "rgb(150,196,226)",
]

function getExternalSourceInfo(uri) {
  let label = "Externo"
  let key = "external"
  try {
    const url = new URL(uri)
    const host = url.hostname.replace(/^www\./, "")
    if (host.includes("inspire.ec.europa.eu")) {
      label = "INSPIRE"
      key = "inspire"
    } else if (host.includes("geosciml.org")) {
      label = "GeoSciML"
      key = "geosciml"
    } else if (host.includes("resource.geosciml.org")) {
      label = "GeoSciML"
      key = "geosciml"
    } else {
      label = host.split(".").slice(0, 2).join(".")
      key = host
    }
  } catch {
    key = uri.split("/")[2] || uri
    label = key
  }
  const hash = [...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return {
    key,
    label,
    color: EXTERNAL_SOURCE_COLORS[hash % EXTERNAL_SOURCE_COLORS.length],
  }
}

function egoGetNodeFill(direction, ringDepth) {
  if (direction?.startsWith("external:")) {
    return direction.slice("external:".length)
  }
  const f = (ringDepth - 1) * 20
  switch (direction) {
    case "center":
      return "rgb(210,90,75)"
    case "broader":
      return `rgb(${Math.min(240, 215 + f)},${Math.min(
        220,
        138 + f
      )},${Math.min(210, 90 + f)})`
    case "narrower":
      return `rgb(${Math.min(240, 200 + f)},${Math.min(190, 90 + f)},${Math.min(
        185,
        85 + f
      )})`
    case "related":
      return `rgb(${Math.min(200, 88 + f)},${Math.min(210, 138 + f)},${Math.min(
        235,
        205 + f
      )})`
    default:
      return `rgb(${Math.min(210, 118 + f)},${Math.min(
        215,
        160 + f
      )},${Math.min(235, 212 + f)})`
  }
}
function egoNodeR(dir, ringDepth = 0) {
  const base =
    dir === "center" ? 36 : dir === "broader" || dir === "narrower" ? 28 : 22
  return Math.max(10, base - ringDepth * 5)
}

function computeEgoMaxDepths(focalId, edgesAll) {
  let maxBroader = 0
  const vB = new Set([focalId]),
    qB = [{ id: focalId, d: 0 }]
  while (qB.length) {
    const { id, d } = qB.shift()
    maxBroader = Math.max(maxBroader, d)
    for (const e of edgesAll) {
      if (e.type === "narrower" && e.t === id && !vB.has(e.s)) {
        vB.add(e.s)
        qB.push({ id: e.s, d: d + 1 })
      }
    }
  }
  let maxNarrow = 0
  const vN = new Set([focalId]),
    qN = [{ id: focalId, d: 0 }]
  while (qN.length) {
    const { id, d } = qN.shift()
    maxNarrow = Math.max(maxNarrow, d)
    for (const e of edgesAll) {
      if (e.type === "narrower" && e.s === id && !vN.has(e.t)) {
        vN.add(e.t)
        qN.push({ id: e.t, d: d + 1 })
      }
    }
  }
  return { maxBroader, maxNarrow }
}

function buildEgoSubgraph(
  focalId,
  nodeInfo,
  edgesAll,
  d3Root,
  depthBroader,
  depthNarrow,
  showMatches,
  matchDataById = {},
  showBroaderEdges = true,
  showNarrowerEdges = true
) {
  const nodeMap = new Map(),
    egoEdges = [],
    edgeSet = new Set()
  const labelOf = (id) =>
    nodeInfo.find((n) => n.id === id)?.label || id.split("/").pop() || id
  const nodeInfoById = new Map(nodeInfo.map((node) => [node.id, node]))
  nodeMap.set(focalId, {
    id: focalId,
    label: labelOf(focalId),
    ringDepth: 0,
    direction: "center",
  })
  const addE = (s, t, pred) => {
    const k = `${pred}:${s}|${t}`
    if (!edgeSet.has(k)) {
      edgeSet.add(k)
      egoEdges.push({ s, t, pred })
    }
  }
  const visited = new Set([focalId])
  const q = [{ id: focalId, up: 0, down: 0 }]
  while (q.length) {
    const { id, up, down } = q.shift()
    for (const e of edgesAll) {
      if (e.type !== "narrower") continue
      const next =
        e.s === id && down < depthNarrow
          ? { id: e.t, up, down: down + 1 }
          : e.t === id && up < depthBroader
          ? { id: e.s, up: up + 1, down }
          : null
      if (!next || visited.has(next.id)) continue
      visited.add(next.id)
      const info = nodeInfoById.get(next.id)
      nodeMap.set(next.id, {
        id: next.id,
        label: labelOf(next.id),
        ringDepth: info?.depth ?? Math.max(next.up, next.down),
        direction: next.up > 0 ? "broader" : "narrower",
      })
      q.push(next)
    }
  }
  for (const e of edgesAll) {
    if (e.type === "narrower" && nodeMap.has(e.s) && nodeMap.has(e.t)) {
      if (showNarrowerEdges) addE(e.s, e.t, "narrower")
      if (showBroaderEdges) addE(e.t, e.s, "broader")
    }
  }
  const focalInfo = nodeInfoById.get(focalId)
  if (focalInfo?.isRoot) {
    for (const info of nodeInfo) {
      if (info.depth <= depthNarrow && !nodeMap.has(info.id)) {
        nodeMap.set(info.id, {
          id: info.id,
          label: labelOf(info.id),
          ringDepth: info.depth,
          direction: info.isRoot ? "center" : "narrower",
        })
      }
    }
    for (const e of edgesAll) {
      if (e.type === "narrower" && nodeMap.has(e.s) && nodeMap.has(e.t)) {
        if (showNarrowerEdges) addE(e.s, e.t, "narrower")
        if (showBroaderEdges) addE(e.t, e.s, "broader")
      }
    }
  }
  if (!nodeMap.has(focalId)) {
    nodeMap.set(focalId, {
      id: focalId,
      label: labelOf(focalId),
      ringDepth: 0,
      direction: "center",
    })
  } else {
    nodeMap.set(focalId, {
      ...nodeMap.get(focalId),
      ringDepth: 0,
      direction: "center",
    })
  }
  // matches can come from embedded scheme JSON or from each visible concept JSON.
  if (showMatches) {
    const internalIds = new Set(nodeInfo.map((n) => n.id))
    const visibleInternalIds = [...nodeMap.keys()].filter((id) =>
      internalIds.has(id)
    )
    for (const sourceId of visibleInternalIds) {
      const d3n = d3Root?.descendants().find((n) => n.data.id === sourceId)
      const matchData = matchDataById[sourceId] || {}
      const sourceNode = nodeMap.get(sourceId)
      for (const prop of SEMANTIC_PROPS) {
        const tids = new Set([
          ...ids(d3n?.data?.[`_${prop}`]),
          ...ids(matchData?.[prop]),
        ])
        for (const tid of tids) {
          const source = getExternalSourceInfo(tid)
          if (!nodeMap.has(tid)) {
            const isInternalTarget = internalIds.has(tid)
            const plainLabel =
              nodeInfo.find((n) => n.id === tid)?.label ||
              tid.split("/").pop() ||
              tid
            nodeMap.set(tid, {
              id: tid,
              label: isInternalTarget
                ? plainLabel
                : `${source.label}: ${plainLabel}`,
              ringDepth: (sourceNode?.ringDepth ?? 0) + 1,
              direction: isInternalTarget
                ? "related"
                : `external:${source.color}`,
              externalSource: isInternalTarget ? null : source,
            })
          }
          addE(sourceId, tid, prop)
        }
      }
    }
  }
  return { nodes: [...nodeMap.values()], edges: egoEdges }
}

function egoLayoutNodes(nodes, cx, cy, edges = []) {
  if (!nodes.length) return {}
  const center = nodes.find((n) => n.direction === "center")
  if (!center) return {}
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  // BFS spanning tree from center
  const childrenOf = new Map(nodes.map((n) => [n.id, []]))
  const visited = new Set([center.id])
  const queue = [center.id]
  while (queue.length) {
    const id = queue.shift()
    for (const e of edges) {
      const nbr = e.s === id ? e.t : e.t === id ? e.s : null
      if (nbr && !visited.has(nbr) && nodeById.has(nbr)) {
        visited.add(nbr)
        queue.push(nbr)
        childrenOf.get(id).push(nbr)
      }
    }
  }
  // Subtree sizes
  const sz = new Map()
  function calcSize(id) {
    const s =
      1 + (childrenOf.get(id) || []).reduce((a, c) => a + calcSize(c), 0)
    sz.set(id, s)
    return s
  }
  calcSize(center.id)
  // Radial tree placement
  const pos = { [center.id]: { x: cx, y: cy } }
  function place(id, aLo, aHi, depth) {
    const ch = childrenOf.get(id) || []
    if (!ch.length) return
    const R =
      EGO_RING_RADII[Math.min(depth, EGO_RING_RADII.length - 1)] || depth * 110
    const total = ch.reduce((a, c) => a + sz.get(c), 0)
    let a = aLo
    for (const c of ch) {
      const span = ((aHi - aLo) * sz.get(c)) / total
      const mid = a + span / 2 - Math.PI / 2
      pos[c] = { x: cx + R * Math.cos(mid), y: cy + R * Math.sin(mid) }
      place(c, a, a + span, depth + 1)
      a += span
    }
  }
  place(center.id, 0, 2 * Math.PI, 1)
  // Fallback for disconnected nodes
  nodes
    .filter((n) => !pos[n.id])
    .forEach((n, i, arr) => {
      const a = (2 * Math.PI * i) / arr.length - Math.PI / 2
      const R = EGO_RING_RADII[Math.min(n.ringDepth, EGO_RING_RADII.length - 1)]
      pos[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }
    })
  return pos
}

function EgoDepthBtns({ label, value, max, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <span
        style={{ fontSize: 11, color: "rgb(100,80,60)", whiteSpace: "nowrap" }}
      >
        {label}
      </span>
      {Array.from({ length: max + 1 }, (_, d) => d).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            fontFamily: "inherit",
            padding: 0,
            border: `1.5px solid ${
              d === value ? "rgb(196,95,40)" : "rgb(220,205,185)"
            }`,
            background: d === value ? "rgb(196,95,40)" : "white",
            color: d === value ? "white" : "rgb(80,60,40)",
            cursor: "pointer",
            fontSize: 9,
            fontWeight: d === value ? 700 : 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {d}
        </button>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────
const GraphModal = ({
  vocabId,
  customDomain,
  language,
  title,
  onClose,
  schemes,
  onVocabChange,
}) => {
  const [nodeInfo, setNodeInfo] = useState([])
  const [edgesAll, setEdgesAll] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [layoutType, setLayoutType] = useState("force")
  const [showLabels, setShowLabels] = useState(true)
  const [labelOverrides, setLabelOverrides] = useState({})
  const [egoLabelOverrides, setEgoLabelOverrides] = useState({})
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState(
    new Set(["narrower"])
  )
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [egoDepthBroader, setEgoDepthBroader] = useState(1)
  const [egoDepthNarrow, setEgoDepthNarrow] = useState(1)
  const [egoShowBroader, setEgoShowBroader] = useState(false)
  const [egoShowNarrower, setEgoShowNarrower] = useState(true)
  const [egoShowEdgeLabels, setEgoShowEdgeLabels] = useState(true)
  const [labelFontSize, setLabelFontSize] = useState(11)
  const [egoShowMatches, setEgoShowMatches] = useState(false)
  const [egoFocalId, setEgoFocalId] = useState(null)
  const [egoMatchDataById, setEgoMatchDataById] = useState({})
  const [egoSubgraph, setEgoSubgraph] = useState({ nodes: [], edges: [] })
  const [egoPositions, setEgoPositions] = useState({})
  const [egoMaxDepths, setEgoMaxDepths] = useState({
    maxBroader: 3,
    maxNarrow: 3,
  })

  const d3SimRef = useRef(null)
  const hierarchyRef = useRef(null)
  const edgesAllRef = useRef([])
  const nodeInfoRef = useRef([])
  const positionsRef = useRef([])
  const enabledRef = useRef(new Set(["narrower"]))
  const containerRef = useRef(null)
  const panRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const dragRef = useRef(null)
  const didMoveRef = useRef(false)
  const layoutRef = useRef("force")
  const labelOverridesRef = useRef({})
  const egoLabelOverridesRef = useRef({})
  const egoMatchCacheRef = useRef({})
  const egoSubgraphRef = useRef({ nodes: [], edges: [] })
  const egoPositionsRef = useRef({})
  const egoOverridesRef = useRef({}) // user-dragged positions, preserved across depth changes

  const posMode = RECT_LAYOUTS.has(layoutType)
    ? "rect"
    : layoutType === "sunburst"
    ? "arc"
    : "link"

  // ── Keep positionsRef in sync ─────────────────────────────
  const updatePositions = useCallback((arr) => {
    positionsRef.current = arr
    setPositions(arr)
  }, [])

  // ── Force simulation ──────────────────────────────────────
  const startForce = useCallback((initNodes, allEdges, enabledTypes) => {
    if (d3SimRef.current) d3SimRef.current.stop()
    const el = containerRef.current
    const cx = el ? el.clientWidth / 2 : 400
    const cy = el ? el.clientHeight / 2 : 300
    const simNodes = initNodes.map((n) => ({
      id: n.id,
      x: n.x ?? cx,
      y: n.y ?? cy,
    }))
    const links = allEdges
      .filter((e) => enabledTypes.has(e.type))
      .map((e) => ({ source: e.s, target: e.t, type: e.type }))

    const sim = forceSimulation(simNodes)
      .force(
        "link",
        forceLink(links)
          .id((d) => d.id)
          .distance((d) => (d.type === "narrower" ? 130 : 190))
          .strength((d) => (d.type === "narrower" ? 0.7 : 0.3))
      )
      .force("charge", forceManyBody().strength(-400))
      .force("center", forceCenter(cx, cy).strength(0.05))
      .force("collide", forceCollide(14).strength(0.6))
      .alphaDecay(0.035)
      .stop()

    // Pre-compute 80 ticks so nodes start in a near-settled layout immediately
    sim.tick(80)
    const prePos = sim.nodes().map((n) => ({ id: n.id, x: n.x, y: n.y }))
    positionsRef.current = prePos
    setPositions(prePos)

    sim
      .on("tick", () => {
        const arr = sim.nodes().map((n) => ({ id: n.id, x: n.x, y: n.y }))
        positionsRef.current = arr
        setPositions(arr)
      })
      .restart()

    d3SimRef.current = sim
  }, [])

  // ── Static layout computation ─────────────────────────────
  const applyStaticLayout = useCallback(
    (type) => {
      const root = hierarchyRef.current
      if (!root) return
      const el = containerRef.current
      const cw = el ? el.clientWidth : 800
      const ch = el ? el.clientHeight : 600
      const cx = cw / 2,
        cy = ch / 2
      let arr = []

      if (type === "tree-v") {
        const r = tree().nodeSize([70, 90])
        r(root)
        const nodes = root.descendants()
        const minX = Math.min(...nodes.map((n) => n.x))
        nodes.forEach((n) =>
          arr.push({ id: n.data.id, x: n.x - minX + 50, y: n.y + 50 })
        )
      } else if (type === "tree-h") {
        const r = tree().nodeSize([55, 160])
        r(root)
        const nodes = root.descendants()
        const minY = Math.min(...nodes.map((n) => n.x))
        nodes.forEach((n) =>
          arr.push({ id: n.data.id, x: n.y + 60, y: n.x - minY + 50 })
        )
      } else if (type === "treemap") {
        treemap()
          .tile(treemapSliceDice)
          .size([cw, ch])
          .paddingOuter(2)
          .paddingTop(16)
          .paddingInner(1)(root)
          .descendants()
          .forEach((node) => {
            arr.push({
              id: node.data.id,
              x0: node.x0,
              y0: node.y0,
              x1: node.x1,
              y1: node.y1,
            })
          })
      } else if (type === "sunburst") {
        const maxDepth = Math.max(1, ...root.descendants().map((n) => n.depth))
        const R = Math.max(Math.min(cx, cy) - 10, maxDepth * 75)
        partition()
          .size([2 * Math.PI, R])(root)
          .descendants()
          .forEach((node) => {
            arr.push({
              id: node.data.id,
              x0: node.x0,
              x1: node.x1,
              y0: node.y0,
              y1: node.y1,
              cx,
              cy,
            })
          })
      }
      updatePositions(arr)
    },
    [updatePositions]
  )

  // ── Load vocabulary ───────────────────────────────────────
  useEffect(() => {
    if (!vocabId) return
    if (d3SimRef.current) {
      d3SimRef.current.stop()
      d3SimRef.current = null
    }
    setLoading(true)
    setErr(null)
    setNodeInfo([])
    setEdgesAll([])
    updatePositions([])
    setSelectedId(null)
    setEgoFocalId(null)
    setEgoMatchDataById({})
    egoMatchCacheRef.current = {}
    labelOverridesRef.current = {}
    egoLabelOverridesRef.current = {}
    setLabelOverrides({})
    setEgoLabelOverrides({})

    const path = withPrefix(getFilePath(vocabId, "json", customDomain))
    fetch(path)
      .then((r) => r.json())
      .then((data) => {
        const schemeLabel =
          data.title?.[language] ||
          data.title?.es ||
          data.title?.en ||
          title ||
          ""
        const nodeData = {
          id: vocabId,
          label: schemeLabel,
          _related: [],
          _exactMatch: [],
          _closeMatch: [],
          _relatedMatch: [],
          _broadMatch: [],
          _narrowMatch: [],
          children: (data.hasTopConcept || []).map((tc) =>
            buildNode(tc, language)
          ),
        }
        const d3Root = hierarchy(nodeData)
          .sum((d) => (!d.children || !d.children.length ? 1 : 0))
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

        hierarchyRef.current = d3Root
        const topConcepts = d3Root.children || []
        d3Root.each((n) => {
          let anc = n
          while (anc.parent && anc.parent.parent) anc = anc.parent
          n.data._branchIdx = anc.parent ? topConcepts.indexOf(anc) : -1
        })
        const flatNodes = d3Root.descendants().map((n) => ({
          id: n.data.id,
          label: n.data.label,
          isRoot: n.data.id === vocabId,
          isLeaf: !n.children || n.children.length === 0,
          depth: n.depth,
          branchIdx: n.data._branchIdx,
        }))
        const allEdges = collectEdges(d3Root)

        nodeInfoRef.current = flatNodes
        edgesAllRef.current = allEdges
        const initEnabled = new Set(["narrower"])
        enabledRef.current = initEnabled

        setNodeInfo(flatNodes)
        setEdgesAll(allEdges)
        setEnabledEdgeTypes(initEnabled)
        setLayoutType("force")
        layoutRef.current = "force"
        setLoading(false)

        // Initialize ego focal to root so force controls are visible from the start
        const rootNode = flatNodes.find((n) => n.isRoot) || flatNodes[0]
        if (rootNode) {
          const depths = computeEgoMaxDepths(rootNode.id, allEdges)
          setEgoFocalId(rootNode.id)
          setEgoMaxDepths(depths)
          setEgoDepthBroader(depths.maxBroader)
          setEgoDepthNarrow(depths.maxNarrow)
          setEgoShowBroader(false)
          setEgoShowNarrower(true)
        }

        const el = containerRef.current
        const cx = el ? el.clientWidth / 2 : 400
        const cy = el ? el.clientHeight / 2 : 300
        const count = flatNodes.length
        const r = Math.min(220, 40 + count * 5)
        const initNodes = flatNodes.map((info, i) => ({
          id: info.id,
          x:
            i === 0
              ? cx
              : cx +
                r * Math.cos((2 * Math.PI * i) / Math.max(count - 1, 1)) +
                (Math.random() - 0.5) * 20,
          y:
            i === 0
              ? cy
              : cy +
                r * Math.sin((2 * Math.PI * i) / Math.max(count - 1, 1)) +
                (Math.random() - 0.5) * 20,
        }))
        updatePositions(initNodes.map((n) => ({ id: n.id, x: n.x, y: n.y })))
        startForce(initNodes, allEdges, initEnabled)
      })
      .catch(() => {
        setErr(
          language === "en"
            ? "Could not load vocabulary"
            : "No se pudo cargar el vocabulario"
        )
        setLoading(false)
      })
  }, [vocabId, language])

  useEffect(() => {
    if (!egoShowMatches || !egoFocalId) {
      setEgoMatchDataById({})
      return
    }
    const baseSub = buildEgoSubgraph(
      egoFocalId,
      nodeInfo,
      edgesAll,
      hierarchyRef.current,
      egoDepthBroader,
      egoDepthNarrow,
      false,
      {},
      true,
      true
    )
    const internalIds = new Set(nodeInfo.map((n) => n.id))
    const visibleIds = baseSub.nodes
      .map((n) => n.id)
      .filter((id) => internalIds.has(id))
    const cachedData = Object.fromEntries(
      visibleIds
        .filter((id) => egoMatchCacheRef.current[id])
        .map((id) => [id, egoMatchCacheRef.current[id]])
    )
    setEgoMatchDataById(cachedData)
    const missingIds = visibleIds.filter((id) => !egoMatchCacheRef.current[id])
    if (!missingIds.length) return
    let cancelled = false
    Promise.all(
      missingIds.map((id) =>
        fetch(withPrefix(getFilePath(id, "json", customDomain)))
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => [id, data || {}])
          .catch(() => [id, {}])
      )
    ).then((entries) => {
      if (cancelled) return
      entries.forEach(([id, data]) => {
        egoMatchCacheRef.current[id] = data
      })
      setEgoMatchDataById((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }))
    })
    return () => {
      cancelled = true
    }
  }, [
    egoShowMatches,
    egoFocalId,
    egoDepthBroader,
    egoDepthNarrow,
    customDomain,
    nodeInfo,
    edgesAll,
  ])

  useEffect(
    () => () => {
      if (d3SimRef.current) d3SimRef.current.stop()
    },
    []
  )

  // ── Ego subgraph recomputation ────────────────────────────
  useEffect(() => {
    if (!["ego", "radial", "force"].includes(layoutType) || !egoFocalId) {
      egoSubgraphRef.current = { nodes: [], edges: [] }
      egoPositionsRef.current = {}
      setEgoSubgraph({ nodes: [], edges: [] })
      setEgoPositions({})
      return
    }
    const sub = buildEgoSubgraph(
      egoFocalId,
      nodeInfo,
      edgesAll,
      hierarchyRef.current,
      egoDepthBroader,
      egoDepthNarrow,
      egoShowMatches,
      egoMatchDataById,
      layoutType === "ego" ? true : egoShowBroader,
      layoutType === "ego" ? true : egoShowNarrower
    )
    egoSubgraphRef.current = sub
    setEgoSubgraph(sub)
    // For force layout, positions come from the force sim (handled by separate effect)
    if (layoutType !== "force") {
      const el = containerRef.current
      const cx = el ? el.clientWidth / 2 : 400,
        cy = el ? el.clientHeight / 2 : 300
      const basePos = egoLayoutNodes(sub.nodes, cx, cy, sub.edges)
      const nodeIds = new Set(sub.nodes.map((n) => n.id))
      const pos = { ...basePos }
      for (const [id, p] of Object.entries(egoOverridesRef.current)) {
        if (nodeIds.has(id)) pos[id] = p
      }
      egoPositionsRef.current = pos
      setEgoPositions(pos)
    }
  }, [
    layoutType,
    egoFocalId,
    egoDepthBroader,
    egoDepthNarrow,
    egoShowMatches,
    egoMatchDataById,
    egoShowBroader,
    egoShowNarrower,
    nodeInfo,
    edgesAll,
  ])

  // ── Force sim restart when in force+ego mode ─────────────
  useEffect(() => {
    if (layoutType !== "force" || !egoFocalId || !egoSubgraph.nodes.length)
      return
    const el = containerRef.current
    const cx = el ? el.clientWidth / 2 : 400
    const cy = el ? el.clientHeight / 2 : 300
    const nodes = egoSubgraph.nodes
    const count = nodes.length
    const r = Math.min(220, 40 + count * 5)
    const cur = positionsRef.current
    const initNodes = nodes.map((node, i) => {
      const p = cur.find((pp) => pp.id === node.id)
      // Fall back to egoPositions (from a previous radial/ego layout) so nodes don't all start at center
      const egoP = egoPositionsRef.current[node.id]
      return {
        id: node.id,
        x:
          p?.x ??
          egoP?.x ??
          (i === 0
            ? cx
            : cx + r * Math.cos((2 * Math.PI * i) / Math.max(count - 1, 1))),
        y:
          p?.y ??
          egoP?.y ??
          (i === 0
            ? cy
            : cy + r * Math.sin((2 * Math.PI * i) / Math.max(count - 1, 1))),
      }
    })
    const forceEdges = egoSubgraph.edges
      .filter((e) => e.pred === "narrower" || e.pred === "broader")
      .map((e) => ({
        s: e.pred === "broader" ? e.t : e.s,
        t: e.pred === "broader" ? e.s : e.t,
        type: "narrower",
      }))
    if (d3SimRef.current) {
      d3SimRef.current.stop()
      d3SimRef.current = null
    }
    startForce(initNodes, forceEdges, new Set(["narrower"]))
  }, [layoutType, egoFocalId, egoSubgraph, startForce])

  useEffect(() => {
    if (!egoFocalId || !edgesAll.length) return
    setEgoMaxDepths(computeEgoMaxDepths(egoFocalId, edgesAll))
  }, [egoFocalId, edgesAll])

  // ── Layout switch ─────────────────────────────────────────
  const handleLayout = (type) => {
    layoutRef.current = type
    setLayoutType(type)
    labelOverridesRef.current = {}
    egoLabelOverridesRef.current = {}
    setLabelOverrides({})
    setEgoLabelOverrides({})
    // radial = ego-style layout starting at vocab root (formerly "ego" layout)
    if (type === "radial") {
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      egoOverridesRef.current = {}
      setEgoShowBroader(false)
      setEgoShowNarrower(true)
      const rootNode =
        nodeInfoRef.current.find((n) => n.isRoot) || nodeInfoRef.current[0]
      const focal = rootNode?.id || null
      setEgoFocalId(focal)
      if (focal) {
        const depths = computeEgoMaxDepths(focal, edgesAllRef.current)
        setEgoMaxDepths(depths)
        setEgoDepthBroader(depths.maxBroader)
        setEgoDepthNarrow(depths.maxNarrow)
      }
      return
    }
    // ego = concept-focused, starts at selected concept
    if (type === "ego") {
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      egoOverridesRef.current = {}
      const focal =
        selectedId ||
        nodeInfoRef.current.find((n) => !n.isRoot)?.id ||
        nodeInfoRef.current[0]?.id ||
        null
      setEgoFocalId(focal)
      if (focal) {
        const depths = computeEgoMaxDepths(focal, edgesAllRef.current)
        setEgoMaxDepths(depths)
        setEgoDepthBroader(Math.min(1, depths.maxBroader))
        setEgoDepthNarrow(Math.min(1, depths.maxNarrow))
      }
      return
    }
    // force = ego-style subgraph with force-directed positions
    if (type === "force") {
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      egoOverridesRef.current = {}
      setEgoShowBroader(false)
      setEgoShowNarrower(true)
      const rootNode =
        nodeInfoRef.current.find((n) => n.isRoot) || nodeInfoRef.current[0]
      const focal = rootNode?.id || null
      setEgoFocalId(focal)
      if (focal) {
        const depths = computeEgoMaxDepths(focal, edgesAllRef.current)
        setEgoMaxDepths(depths)
        setEgoDepthBroader(depths.maxBroader)
        setEgoDepthNarrow(depths.maxNarrow)
      }
      // Force sim restart is handled by the force+ego useEffect below
      return
    }
    if (d3SimRef.current) {
      d3SimRef.current.stop()
      d3SimRef.current = null
    }
    applyStaticLayout(type)
  }

  // ── Edge type toggle ──────────────────────────────────────

  // ── Mouse interaction ─────────────────────────────────────
  const getGXY = (clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      gx: (clientX - rect.left - panRef.current.x) / scaleRef.current,
      gy: (clientY - rect.top - panRef.current.y) / scaleRef.current,
    }
  }

  const hitNode = (clientX, clientY) => {
    const c = getGXY(clientX, clientY)
    if (!c) return null
    const { gx, gy } = c
    const lt = layoutRef.current

    if (lt === "force" && d3SimRef.current) {
      const H2 = (14 / scaleRef.current) ** 2
      return (
        d3SimRef.current
          .nodes()
          .find((n) => (n.x - gx) ** 2 + (n.y - gy) ** 2 < H2) || null
      )
    }
    const pos = positionsRef.current
    if (LINK_LAYOUTS.has(lt)) {
      const H2 = (14 / scaleRef.current) ** 2
      const h = pos.find(
        (p) => p.x != null && (p.x - gx) ** 2 + (p.y - gy) ** 2 < H2
      )
      return h ? { id: h.id } : null
    }
    if (RECT_LAYOUTS.has(lt)) {
      const hits = pos.filter(
        (p) =>
          p.x0 != null && gx >= p.x0 && gx <= p.x1 && gy >= p.y0 && gy <= p.y1
      )
      return hits.length
        ? hits.reduce((b, p) =>
            !b || (p.x1 - p.x0) * (p.y1 - p.y0) < (b.x1 - b.x0) * (b.y1 - b.y0)
              ? p
              : b
          )
        : null
    }
    if (lt === "sunburst") {
      const ref = pos.find((p) => p.cx != null)
      if (!ref) return null
      const dx = gx - ref.cx,
        dy = gy - ref.cy
      const rr = Math.sqrt(dx * dx + dy * dy)
      let ang = Math.atan2(dy, dx) + Math.PI / 2
      if (ang < 0) ang += 2 * Math.PI
      const hits = pos.filter(
        (p) =>
          p.x0 != null && rr >= p.y0 && rr <= p.y1 && ang >= p.x0 && ang <= p.x1
      )
      return hits.length
        ? hits.reduce((b, p) =>
            !b || (p.y1 - p.y0) * (p.x1 - p.x0) < (b.y1 - b.y0) * (b.x1 - b.x0)
              ? p
              : b
          )
        : null
    }
    if (lt === "ego" || lt === "radial") {
      const egoNodes = egoSubgraphRef.current.nodes
      const egoPos = egoPositionsRef.current
      const hit = egoNodes.find((n) => {
        const p = egoPos[n.id]
        if (!p) return false
        const r = egoNodeR(n.direction, n.ringDepth) + 6
        return (p.x - gx) ** 2 + (p.y - gy) ** 2 <= r * r
      })
      return hit ? { id: hit.id, isEgoNode: true, egoDir: hit.direction } : null
    }
    return null
  }

  const hitLabel = (clientX, clientY) => {
    if (!showLabels) return null
    const c = getGXY(clientX, clientY)
    if (!c) return null
    const { gx, gy } = c
    if (
      layoutRef.current === "ego" ||
      layoutRef.current === "radial" ||
      (layoutRef.current === "force" && egoFocalId)
    ) {
      const labels = egoSubgraphRef.current.nodes
        .map((node) => {
          const pos =
            layoutRef.current === "force"
              ? positionsRef.current.find((p) => p.id === node.id)
              : egoPositionsRef.current[node.id]
          if (!pos) return null
          const r = egoNodeR(node.direction, node.ringDepth)
          const override = egoLabelOverridesRef.current[node.id]
          return {
            id: node.id,
            isEgoLabel: true,
            txt: node.label || "",
            cx: override?.x ?? pos.x,
            cy: override?.y ?? pos.y - (r + 8),
            w: (node.label || "").length * CHAR_W,
          }
        })
        .filter(Boolean)
      return (
        labels.find((label) => {
          const w = label.w + LPAD * 2
          const h = LABEL_H + LPAD * 2
          return (
            gx >= label.cx - w / 2 &&
            gx <= label.cx + w / 2 &&
            gy >= label.cy - h / 2 &&
            gy <= label.cy + h / 2
          )
        }) || null
      )
    }
    if (posMode !== "link") return null
    return (
      Object.values(labelData).find((label) => {
        const w = label.w + LPAD * 2
        const h = LABEL_H + LPAD * 2
        return (
          gx >= label.cx - w / 2 &&
          gx <= label.cx + w / 2 &&
          gy >= label.cy - h / 2 &&
          gy <= label.cy + h / 2
        )
      }) || null
    )
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    didMoveRef.current = false
    const labelHit = hitLabel(e.clientX, e.clientY)
    if (labelHit) {
      dragRef.current = {
        type: labelHit.isEgoLabel ? "ego-label" : "label",
        hitId: labelHit.id,
        sx: e.clientX,
        sy: e.clientY,
        ox: labelHit.cx,
        oy: labelHit.cy,
      }
      return
    }
    const hit = hitNode(e.clientX, e.clientY)
    if (hit && layoutRef.current === "force" && d3SimRef.current) {
      hit.fx = hit.x
      hit.fy = hit.y
      d3SimRef.current.alphaTarget(0.3).restart()
      dragRef.current = { type: "node", d3Node: hit }
    } else if (
      hit &&
      (layoutRef.current === "ego" || layoutRef.current === "radial") &&
      hit.isEgoNode
    ) {
      dragRef.current = {
        type: "ego-node",
        hitId: hit.id,
        isEgoNode: true,
        egoDir: hit.egoDir,
        sx: e.clientX,
        sy: e.clientY,
      }
    } else {
      dragRef.current = {
        type: "pan",
        hitId: hit?.id || null,
        isEgoNode: false,
        sx: e.clientX,
        sy: e.clientY,
        ox: panRef.current.x,
        oy: panRef.current.y,
      }
    }
  }

  const onMouseMove = (e) => {
    if (!dragRef.current) return
    const dx = e.clientX - (dragRef.current.sx ?? e.clientX)
    const dy = e.clientY - (dragRef.current.sy ?? e.clientY)
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didMoveRef.current = true

    if (dragRef.current.type === "node") {
      const c = getGXY(e.clientX, e.clientY)
      if (c) {
        dragRef.current.d3Node.fx = c.gx
        dragRef.current.d3Node.fy = c.gy
      }
    } else if (dragRef.current.type === "ego-node") {
      const c = getGXY(e.clientX, e.clientY)
      if (c) {
        const p = { x: c.gx, y: c.gy }
        egoOverridesRef.current[dragRef.current.hitId] = p
        egoPositionsRef.current = {
          ...egoPositionsRef.current,
          [dragRef.current.hitId]: p,
        }
        setEgoPositions({ ...egoPositionsRef.current })
      }
    } else if (dragRef.current.type === "static-node") {
      const p = {
        id: dragRef.current.hitId,
        x: dragRef.current.ox + dx / scaleRef.current,
        y: dragRef.current.oy + dy / scaleRef.current,
      }
      const next = positionsRef.current.map((pos) =>
        pos.id === p.id ? { ...pos, x: p.x, y: p.y } : pos
      )
      updatePositions(next)
    } else if (dragRef.current.type === "label") {
      const next = {
        ...labelOverridesRef.current,
        [dragRef.current.hitId]: {
          cx: dragRef.current.ox + dx / scaleRef.current,
          cy: dragRef.current.oy + dy / scaleRef.current,
        },
      }
      labelOverridesRef.current = next
      setLabelOverrides(next)
    } else if (dragRef.current.type === "ego-label") {
      const next = {
        ...egoLabelOverridesRef.current,
        [dragRef.current.hitId]: {
          x: dragRef.current.ox + dx / scaleRef.current,
          y: dragRef.current.oy + dy / scaleRef.current,
        },
      }
      egoLabelOverridesRef.current = next
      setEgoLabelOverrides(next)
    } else {
      const nx = dragRef.current.ox + dx,
        ny = dragRef.current.oy + dy
      panRef.current = { x: nx, y: ny }
      setPan({ x: nx, y: ny })
    }
  }

  const onMouseUp = () => {
    if (!dragRef.current) return
    if (dragRef.current.type === "node") {
      const nd = dragRef.current.d3Node
      nd.fx = null
      nd.fy = null
      d3SimRef.current?.alphaTarget(0)
      if (!didMoveRef.current) {
        setSelectedId((id) => (id === nd.id ? null : nd.id))
        // In force+ego mode: clicking an internal non-center node refocuses ego
        if (layoutRef.current === "force" && egoFocalId) {
          const isInternal = nodeInfoRef.current.some((n) => n.id === nd.id)
          const egoNode = egoSubgraphRef.current.nodes.find(
            (n) => n.id === nd.id
          )
          if (isInternal && egoNode?.direction !== "center") {
            egoOverridesRef.current = {}
            setEgoFocalId(nd.id)
            setEgoMaxDepths(computeEgoMaxDepths(nd.id, edgesAllRef.current))
          } else if (isInternal && egoNode?.direction === "center") {
            handleEgoRoot()
          }
        }
      }
    } else if (dragRef.current.type === "static-node") {
      if (!didMoveRef.current) {
        const hitId = dragRef.current.hitId
        setSelectedId((id) => (id === hitId ? null : hitId))
      }
    } else if (dragRef.current.type === "label") {
      if (!didMoveRef.current) {
        const hitId = dragRef.current.hitId
        setSelectedId((id) => (id === hitId ? null : hitId))
      }
    } else if (dragRef.current.type === "ego-label") {
      if (!didMoveRef.current) {
        const hitId = dragRef.current.hitId
        const hitNode = egoSubgraphRef.current.nodes.find((n) => n.id === hitId)
        const isInternal = nodeInfoRef.current.some((n) => n.id === hitId)
        if (isInternal && hitNode?.direction !== "center") {
          egoOverridesRef.current = {}
          setEgoFocalId(hitId)
          setEgoMaxDepths(computeEgoMaxDepths(hitId, edgesAllRef.current))
        } else if (isInternal) {
          handleEgoRoot()
        } else {
          window.open(hitId, "_blank", "noopener,noreferrer")
        }
      }
    } else if (dragRef.current.type === "ego-node" && !didMoveRef.current) {
      const hitId = dragRef.current.hitId
      const isInternal = nodeInfoRef.current.some((n) => n.id === hitId)
      if (isInternal && dragRef.current.egoDir !== "center") {
        egoOverridesRef.current = {}
        setEgoFocalId(hitId)
        setEgoMaxDepths(computeEgoMaxDepths(hitId, edgesAllRef.current))
      } else if (isInternal) {
        handleEgoRoot()
      } else {
        window.open(hitId, "_blank", "noopener,noreferrer")
      }
    } else if (
      dragRef.current.type === "pan" &&
      !didMoveRef.current &&
      dragRef.current.hitId
    ) {
      const hitId = dragRef.current.hitId
      setSelectedId((id) => (id === hitId ? null : hitId))
    }
    dragRef.current = null
  }

  const onMouseLeave = () => onMouseUp()

  const handleEgoReset = () => {
    egoOverridesRef.current = {}
    egoLabelOverridesRef.current = {}
    setEgoLabelOverrides({})
    const sub = egoSubgraphRef.current
    const el = containerRef.current
    const cx = el ? el.clientWidth / 2 : 400,
      cy = el ? el.clientHeight / 2 : 300
    if (layoutRef.current === "force") {
      const count = sub.nodes.length
      const r = Math.min(220, 40 + count * 5)
      const initNodes = sub.nodes.map((node, i) => ({
        id: node.id,
        x:
          i === 0
            ? cx
            : cx + r * Math.cos((2 * Math.PI * i) / Math.max(count - 1, 1)),
        y:
          i === 0
            ? cy
            : cy + r * Math.sin((2 * Math.PI * i) / Math.max(count - 1, 1)),
      }))
      const forceEdges = sub.edges
        .filter((e) => e.pred === "narrower" || e.pred === "broader")
        .map((e) => ({
          s: e.pred === "broader" ? e.t : e.s,
          t: e.pred === "broader" ? e.s : e.t,
          type: "narrower",
        }))
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      startForce(initNodes, forceEdges, new Set(["narrower"]))
    } else {
      const freshPos = egoLayoutNodes(sub.nodes, cx, cy, sub.edges)
      egoPositionsRef.current = freshPos
      setEgoPositions(freshPos)
    }
  }

  const handleEgoRoot = () => {
    const rootNode =
      nodeInfoRef.current.find((n) => n.isRoot) || nodeInfoRef.current[0]
    if (!rootNode) return
    egoOverridesRef.current = {}
    egoLabelOverridesRef.current = {}
    setEgoLabelOverrides({})
    setEgoFocalId(rootNode.id)
    const depths = computeEgoMaxDepths(rootNode.id, edgesAllRef.current)
    setEgoMaxDepths(depths)
    setEgoDepthBroader(depths.maxBroader)
    setEgoDepthNarrow(depths.maxNarrow)
  }

  const onWheel = (e) => {
    e.preventDefault()
    const s = Math.max(0.1, Math.min(4, scaleRef.current - e.deltaY * 0.001))
    scaleRef.current = s
    setScale(s)
  }

  // ── Derived data ──────────────────────────────────────────
  const posMap = useMemo(() => {
    const m = {}
    positions.forEach((p) => {
      m[p.id] = p
    })
    return m
  }, [positions])

  // For ego rendering: force+ego uses posMap (force sim positions), others use egoPositions
  const activeEgoPos =
    layoutType === "force" && egoFocalId ? posMap : egoPositions

  const hlNodes = useMemo(() => {
    const s = new Set()
    if (!selectedId) return s
    s.add(selectedId)
    edgesAll.forEach((e) => {
      if (
        enabledEdgeTypes.has(e.type) &&
        (e.s === selectedId || e.t === selectedId)
      ) {
        s.add(e.s)
        s.add(e.t)
      }
    })
    return s
  }, [selectedId, edgesAll, enabledEdgeTypes])

  const hlEdges = useMemo(() => {
    const s = new Set()
    if (!selectedId) return s
    edgesAll.forEach((e, i) => {
      if (
        enabledEdgeTypes.has(e.type) &&
        (e.s === selectedId || e.t === selectedId)
      )
        s.add(i)
    })
    return s
  }, [selectedId, edgesAll, enabledEdgeTypes])

  const hasSel = selectedId !== null
  const selInfo = useMemo(
    () => nodeInfo.find((n) => n.id === selectedId) || null,
    [selectedId, nodeInfo]
  )

  const displayEdges = useMemo(
    () => edgesAll.filter((e) => enabledEdgeTypes.has(e.type)),
    [edgesAll, enabledEdgeTypes]
  )

  const labelData = useMemo(() => {
    if (posMode !== "link") return {}
    const computed = computeLabels(nodeInfo, posMap)
    for (const [id, override] of Object.entries(labelOverrides)) {
      if (computed[id]) computed[id] = { ...computed[id], ...override }
    }
    return computed
  }, [positions, nodeInfo, posMode, labelOverrides])

  // ── Edge renderer ─────────────────────────────────────────
  const renderEdge = (e, i) => {
    const s = posMap[e.s],
      t = posMap[e.t]
    if (!s || !t || s.x == null || t.x == null) return null
    const def = EDGE_BY_ID[e.type] || EDGE_DEFS[0]
    const hi = hlEdges.has(i),
      dim = hasSel && !hi
    const col = hi ? def.hlColor : def.color
    const w = hi ? 2.5 : 1.5,
      op = dim ? 0.1 : 1
    const dash = def.dash || undefined

    if (layoutType === "tree-v") {
      const my = (s.y + t.y) / 2
      return (
        <path
          key={i}
          d={`M ${s.x},${s.y} C ${s.x},${my} ${t.x},${my} ${t.x},${t.y}`}
          fill="none"
          stroke={col}
          strokeWidth={w}
          strokeOpacity={op}
          strokeDasharray={dash}
        />
      )
    }
    if (layoutType === "tree-h") {
      const mx = (s.x + t.x) / 2
      return (
        <path
          key={i}
          d={`M ${s.x},${s.y} C ${mx},${s.y} ${mx},${t.y} ${t.x},${t.y}`}
          fill="none"
          stroke={col}
          strokeWidth={w}
          strokeOpacity={op}
          strokeDasharray={dash}
        />
      )
    }
    return (
      <line
        key={i}
        x1={s.x}
        y1={s.y}
        x2={t.x}
        y2={t.y}
        stroke={col}
        strokeWidth={w}
        strokeOpacity={op}
        strokeDasharray={dash}
      />
    )
  }

  // ── Node renderer ─────────────────────────────────────────
  const renderNode = (info) => {
    const pos = posMap[info.id]
    if (!pos) return null
    const isSel = info.id === selectedId
    const isNbr = !isSel && hlNodes.has(info.id)
    const dim = hasSel && !hlNodes.has(info.id)

    // ── Rect (icicle / treemap) ──
    if (posMode === "rect") {
      if (pos.x0 == null) return null
      const w = pos.x1 - pos.x0,
        h = pos.y1 - pos.y0
      const fill = isSel
        ? "rgb(196,95,40)"
        : isNbr
        ? "rgb(220,130,55)"
        : lightBranchDepthFill(info.branchIdx, info.depth)
      const isNarrow = w < 28
      return (
        <g key={info.id} opacity={dim ? 0.4 : 1} style={{ cursor: "pointer" }}>
          <rect
            x={pos.x0 + 0.5}
            y={pos.y0 + 0.5}
            width={Math.max(0, w - 1)}
            height={Math.max(0, h - 1)}
            fill={fill}
            stroke={isSel ? "rgb(140,50,10)" : "white"}
            strokeWidth={isSel ? 2 : 1}
          />
          {showLabels &&
            h >= 10 &&
            (isNarrow ? (
              h >= 30 && (
                <text
                  transform={`translate(${pos.x0 + w / 2 + 1},${
                    pos.y0 + 5
                  }) rotate(90)`}
                  textAnchor="start"
                  fontSize={labelFontSize}
                  fontFamily={GRAPH_FONT_FAMILY}
                  fill="rgb(20,10,0)"
                  style={{ pointerEvents: "none" }}
                >
                  {info.label}
                </text>
              )
            ) : (
              <text
                x={pos.x0 + 4}
                y={pos.y0 + 15}
                fontSize={isSel ? labelFontSize + 2 : labelFontSize}
                fontWeight={isSel ? 700 : 400}
                fontFamily={isSel ? "inherit" : GRAPH_FONT_FAMILY}
                fill="rgb(20,10,0)"
                style={{ pointerEvents: "none" }}
              >
                {info.label}
              </text>
            ))}
        </g>
      )
    }

    // ── Arc (sunburst) ──
    if (posMode === "arc") {
      if (pos.x0 == null || pos.cx == null) return null
      const fill = isSel
        ? "rgb(196,95,40)"
        : isNbr
        ? "rgb(220,130,55)"
        : lightBranchDepthFill(info.branchIdx, info.depth)
      const d = arcPath(pos.x0, pos.x1, pos.y0, pos.y1, pos.cx, pos.cy)
      if (!d) return null
      const midA = (pos.x0 + pos.x1) / 2 - Math.PI / 2
      const midR = (pos.y0 + pos.y1) / 2
      // Label at inner edge, text extends radially outward — no clipping
      const innerR = pos.y0 < 2 ? 0 : pos.y0 + 4
      const lx2 = pos.cx + innerR * Math.cos(midA)
      const ly2 = pos.cy + innerR * Math.sin(midA)
      const degA = (midA * 180) / Math.PI
      const isLeft = midA > Math.PI / 2 || midA < -Math.PI / 2
      const textRot = isLeft ? degA + 180 : degA
      const anchor = isLeft ? "end" : "start"
      const arcH = pos.y1 - pos.y0
      const showLabel = showLabels && arcH > 8 && (pos.x1 - pos.x0) * midR > 6
      return (
        <g key={info.id} opacity={dim ? 0.4 : 1} style={{ cursor: "pointer" }}>
          <path
            d={d}
            fill={fill}
            stroke="white"
            strokeWidth={isSel ? 2 : 0.5}
          />
          {showLabel && (
            <text
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={labelFontSize}
              fontFamily={GRAPH_FONT_FAMILY}
              fill="rgb(20,10,0)"
              transform={`rotate(${textRot},${lx2},${ly2})`}
              x={lx2}
              y={ly2}
              style={{ pointerEvents: "none" }}
            >
              {info.label}
            </text>
          )}
        </g>
      )
    }

    // ── Link (force / tree / radial) ──
    if (pos.x == null) return null
    const ldat = labelData[info.id]
    const r = info.isRoot ? 12 : isSel ? 11 : 8
    const fill = isSel
      ? "rgb(196,95,40)"
      : isNbr
      ? "rgb(230,145,55)"
      : info.isRoot
      ? "rgb(90,45,15)"
      : branchDepthFill(info.branchIdx, info.depth)
    const lx = ldat ? ldat.cx - pos.x : 0
    const ly = ldat ? ldat.cy - pos.y : r + 14
    return (
      <g
        key={info.id}
        transform={`translate(${pos.x},${pos.y})`}
        style={{ cursor: "pointer" }}
        opacity={dim ? 0.18 : 1}
      >
        {isSel && <circle r={r + 7} fill="rgb(196,95,40)" fillOpacity={0.18} />}
        <circle r={r} fill={fill} stroke="white" strokeWidth={1.5} />
        {showLabels && ldat && (
          <text
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isSel ? labelFontSize + 2 : labelFontSize}
            fontWeight={isSel || isNbr ? 700 : 400}
            fontFamily={isSel || isNbr ? "inherit" : GRAPH_FONT_FAMILY}
            fill="rgb(20,10,0)"
            style={{ pointerEvents: "none", cursor: "move" }}
          >
            {ldat.txt}
          </text>
        )}
      </g>
    )
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          width: "92vw",
          height: "87vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 48px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "10px 16px 0 16px",
            borderBottom: "1px solid rgb(220,205,185)",
            flexShrink: 0,
            background: "rgb(248,244,238)",
          }}
        >
          {/* Row 1: title + close */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "21px",
                color: "rgb(35,15,5)",
              }}
            >
              {language === "en" ? "Graph view" : "Vista de grafo"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {selInfo && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 10px",
                    background: "rgb(255,245,235)",
                    border: "1px solid rgb(220,175,120)",
                    borderRadius: "20px",
                    fontSize: "12px",
                    color: "rgb(140,70,20)",
                    maxWidth: "320px",
                  }}
                >
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    }}
                  >
                    {selInfo.label}
                  </span>
                  <span
                    style={{
                      color: "rgb(180,130,80)",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hlNodes.size - 1}{" "}
                    {language === "en" ? "connected" : "conexiones"}
                  </span>
                  <button
                    onClick={() => setSelectedId(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgb(180,130,80)",
                      fontSize: "15px",
                      lineHeight: 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "22px",
                  color: "rgb(130,110,90)",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Row 2: selectors and options */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 900,
                color: "rgb(35,15,5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              {language === "en" ? "VOCABULARY:" : "VOCABULARIO:"}
            </span>
            {schemes?.length > 0 ? (
              <select
                value={vocabId}
                onChange={(e) => onVocabChange?.(e.target.value)}
                style={{
                  fontSize: "13px",
                  color: "rgb(80,50,20)",
                  border: "1px solid rgb(220,205,185)",
                  borderRadius: "6px",
                  padding: "4px 26px 4px 10px",
                  background: "white",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: "min(34vw, 360px)",
                  maxWidth: "360px",
                  minWidth: "220px",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23826e5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                }}
              >
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              title && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgb(80,60,40)",
                    fontWeight: 600,
                  }}
                >
                  {title}
                </span>
              )
            )}
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "rgb(35,15,5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginRight: "2px",
              }}
            >
              {language === "en" ? "Graph type:" : "Tipo de grafo:"}
            </span>
            <select
              value={layoutType}
              onChange={(e) => handleLayout(e.target.value)}
              style={{
                fontSize: "13px",
                color: "rgb(80,50,20)",
                border: "1px solid rgb(220,205,185)",
                borderRadius: "6px",
                padding: "4px 26px 4px 10px",
                background: "white",
                fontFamily: "inherit",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                minWidth: "150px",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23826e5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              {LAYOUTS.map((l) => (
                <option key={l.id} value={l.id}>
                  {language === "en" ? l.en : l.es}
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "rgb(35,15,5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginLeft: "6px",
              }}
            >
              {language === "en" ? "OPTIONS:" : "OPCIONES:"}
            </span>
            <button
              onClick={() => setShowLabels((v) => !v)}
              style={{
                padding: "5px 13px",
                borderRadius: "20px",
                fontFamily: "inherit",
                border: `1px solid ${
                  showLabels ? "rgb(196,95,40)" : "rgb(220,205,185)"
                }`,
                background: showLabels ? "rgb(196,95,40)" : "white",
                color: showLabels ? "white" : "rgb(80,60,40)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: showLabels ? 700 : 400,
              }}
            >
              {language === "en" ? "Show Labels" : "Ver Etiquetas"}
            </button>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "rgb(35,15,5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginLeft: "4px",
                whiteSpace: "nowrap",
              }}
            >
              {language === "en" ? "TEXT SIZE:" : "TAMAÑO TEXTO:"}
            </span>
            <select
              value={labelFontSize}
              onChange={(e) => setLabelFontSize(Number(e.target.value))}
              style={{
                fontSize: "13px",
                color: "rgb(80,50,20)",
                border: "1px solid rgb(220,205,185)",
                borderRadius: "6px",
                padding: "4px 26px 4px 10px",
                background: "white",
                fontFamily: "inherit",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                minWidth: "76px",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23826e5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              {Array.from({ length: 9 }, (_, i) => i + 8).map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          {/* Ego controls */}
          {(layoutType === "ego" ||
            layoutType === "radial" ||
            (layoutType === "force" && egoFocalId)) && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
                paddingBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgb(35,15,5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {language === "en"
                  ? "Hierarchy depth:"
                  : "Nivel de profundidad de jerarquía:"}
              </span>
              <EgoDepthBtns
                label="↑ Broader:"
                value={egoDepthBroader}
                max={egoMaxDepths.maxBroader}
                onChange={setEgoDepthBroader}
              />
              <EgoDepthBtns
                label="↓ Narrower:"
                value={egoDepthNarrow}
                max={egoMaxDepths.maxNarrow}
                onChange={setEgoDepthNarrow}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgb(35,15,5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginLeft: 4,
                }}
              >
                {language === "en" ? "Show relations:" : "Ver Relaciones:"}
              </span>
              <button
                onClick={() => {
                  if (layoutType === "ego") return
                  if (egoShowBroader && !egoShowNarrower) return
                  setEgoShowBroader((v) => !v)
                }}
                style={{
                  padding: "5px 13px",
                  borderRadius: "20px",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: `1.5px solid ${
                    layoutType === "ego"
                      ? "rgb(210,200,185)"
                      : egoShowBroader
                      ? "rgb(198,166,112)"
                      : "rgb(220,205,185)"
                  }`,
                  background:
                    layoutType === "ego"
                      ? "rgb(245,242,238)"
                      : egoShowBroader
                      ? "rgb(198,166,112)"
                      : "white",
                  color:
                    layoutType === "ego"
                      ? "rgb(185,170,150)"
                      : egoShowBroader
                      ? "white"
                      : "rgb(100,80,60)",
                  fontWeight:
                    egoShowBroader && layoutType !== "ego" ? 700 : 400,
                  cursor:
                    layoutType === "ego" || (egoShowBroader && !egoShowNarrower)
                      ? "default"
                      : "pointer",
                  opacity:
                    layoutType === "ego" || (egoShowBroader && !egoShowNarrower)
                      ? 0.5
                      : 1,
                  transition: "all 0.12s",
                }}
              >
                Broader
              </button>
              <button
                onClick={() => {
                  if (layoutType === "ego") return
                  if (!egoShowBroader && egoShowNarrower) return
                  setEgoShowNarrower((v) => !v)
                }}
                style={{
                  padding: "5px 13px",
                  borderRadius: "20px",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: `1.5px solid ${
                    layoutType === "ego"
                      ? "rgb(210,200,185)"
                      : egoShowNarrower
                      ? "rgb(196,95,40)"
                      : "rgb(220,205,185)"
                  }`,
                  background:
                    layoutType === "ego"
                      ? "rgb(245,242,238)"
                      : egoShowNarrower
                      ? "rgb(196,95,40)"
                      : "white",
                  color:
                    layoutType === "ego"
                      ? "rgb(185,170,150)"
                      : egoShowNarrower
                      ? "white"
                      : "rgb(100,80,60)",
                  fontWeight:
                    egoShowNarrower && layoutType !== "ego" ? 700 : 400,
                  cursor:
                    layoutType === "ego" || (!egoShowBroader && egoShowNarrower)
                      ? "default"
                      : "pointer",
                  opacity:
                    layoutType === "ego" || (!egoShowBroader && egoShowNarrower)
                      ? 0.5
                      : 1,
                  transition: "all 0.12s",
                }}
              >
                Narrower
              </button>
              <button
                onClick={() => setEgoShowEdgeLabels((v) => !v)}
                style={{
                  padding: "5px 13px",
                  borderRadius: "20px",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: `1.5px solid ${
                    egoShowEdgeLabels ? "rgb(196,95,40)" : "rgb(220,205,185)"
                  }`,
                  background: egoShowEdgeLabels ? "rgb(196,95,40)" : "white",
                  color: egoShowEdgeLabels ? "white" : "rgb(100,80,60)",
                  fontWeight: egoShowEdgeLabels ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {language === "en" ? "Show Labels" : "Ver Etiquetas"}
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgb(35,15,5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginLeft: 4,
                }}
              >
                {language === "en"
                  ? "External vocabularies:"
                  : "Vocabularios externos:"}
              </span>
              <button
                onClick={() => setEgoShowMatches((m) => !m)}
                style={{
                  padding: "5px 13px",
                  borderRadius: "20px",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: `1.5px solid ${
                    egoShowMatches ? "rgb(196,95,40)" : "rgb(220,205,185)"
                  }`,
                  background: egoShowMatches ? "rgb(196,95,40)" : "white",
                  color: egoShowMatches ? "white" : "rgb(100,80,60)",
                  fontWeight: egoShowMatches ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {language === "en" ? "Show alignments" : "Ver alineaciones"}
              </button>
              <span
                style={{
                  borderLeft: "1.5px solid rgb(210,195,175)",
                  height: 18,
                  margin: "0 2px",
                  alignSelf: "center",
                  flexShrink: 0,
                }}
              />
              <button
                onClick={handleEgoRoot}
                style={{
                  padding: "5px 13px",
                  borderRadius: "20px",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: "1.5px solid rgb(220,205,185)",
                  background: "white",
                  color: "rgb(100,80,60)",
                  cursor: "pointer",
                }}
              >
                {language === "en" ? "Back to root node" : "Volver a nodo raíz"}
              </button>
              <button
                onClick={handleEgoReset}
                title={
                  language === "en"
                    ? "Reset positions"
                    : "Reestablecer posiciones"
                }
                style={{
                  padding: "5px 13px",
                  borderRadius: "20px",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  border: "1.5px solid rgb(220,205,185)",
                  background: "white",
                  color: "rgb(100,80,60)",
                  cursor: "pointer",
                }}
              >
                {language === "en"
                  ? "Reset positions"
                  : "Reestablecer posiciones"}
              </button>
              {egoFocalId && (
                <span
                  style={{
                    fontSize: 11,
                    color: "rgb(130,110,90)",
                    marginLeft: 4,
                  }}
                >
                  —{" "}
                  {nodeInfo.find((n) => n.id === egoFocalId)?.label ||
                    egoFocalId.split("/").pop()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Graph canvas ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            background: "white",
            cursor:
              layoutType === "force" ||
              layoutType === "ego" ||
              layoutType === "radial"
                ? "grab"
                : "default",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onWheel={onWheel}
        >
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgb(130,110,90)",
                fontSize: "15px",
              }}
            >
              {language === "en" ? "Loading graph…" : "Cargando grafo…"}
            </div>
          )}
          {err && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgb(200,60,60)",
                fontSize: "15px",
              }}
            >
              {err}
            </div>
          )}

          {positions.length > 0 &&
            !["ego", "radial"].includes(layoutType) &&
            !(layoutType === "force" && egoFocalId) && (
              <svg
                width="100%"
                height="100%"
                style={{ userSelect: "none", display: "block" }}
              >
                <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                  {LINK_LAYOUTS.has(layoutType) &&
                    displayEdges.map((e, i) => renderEdge(e, i))}
                  {nodeInfo.map((info) => renderNode(info))}
                </g>
              </svg>
            )}

          {(layoutType === "ego" ||
            layoutType === "radial" ||
            (layoutType === "force" && egoFocalId)) &&
            !loading &&
            !err &&
            (egoSubgraph.nodes.length === 0 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgb(130,110,90)",
                  fontSize: "15px",
                }}
              >
                {language === "en"
                  ? "Click a concept to view its ego graph"
                  : "Haz clic en un concepto para ver su grafo ego"}
              </div>
            ) : (
              <svg
                width="100%"
                height="100%"
                style={{ userSelect: "none", display: "block" }}
              >
                <defs>
                  {[...new Set(egoSubgraph.edges.map((e) => e.pred))].map(
                    (pred) => {
                      const col = EGO_PRED_COLORS[pred] || "rgb(150,130,110)"
                      return (
                        <marker
                          key={pred}
                          id={`gm-arr-${pred}`}
                          viewBox="0 -4 8 8"
                          refX="7"
                          markerWidth="5"
                          markerHeight="5"
                          orient="auto"
                        >
                          <path d="M0,-4L8,0L0,4" fill={col} />
                        </marker>
                      )
                    }
                  )}
                </defs>
                <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                  {egoSubgraph.edges.map((e, i) => {
                    const sp = activeEgoPos[e.s],
                      tp = activeEgoPos[e.t]
                    if (!sp || !tp) return null
                    const col = EGO_PRED_COLORS[e.pred] || "rgb(150,130,110)"
                    const nS = egoSubgraph.nodes.find((n) => n.id === e.s)
                    const nT = egoSubgraph.nodes.find((n) => n.id === e.t)
                    const rS = egoNodeR(nS?.direction || "", nS?.ringDepth || 0)
                    const rT = egoNodeR(nT?.direction || "", nT?.ringDepth || 0)
                    const dx = tp.x - sp.x,
                      dy = tp.y - sp.y,
                      dist = Math.sqrt(dx * dx + dy * dy) || 1
                    const ux = dx / dist,
                      uy = dy / dist
                    const hasOppositeHierarchy = egoSubgraph.edges.some(
                      (other) =>
                        other !== e &&
                        ((e.pred === "narrower" &&
                          other.pred === "broader" &&
                          other.s === e.t &&
                          other.t === e.s) ||
                          (e.pred === "broader" &&
                            other.pred === "narrower" &&
                            other.s === e.t &&
                            other.t === e.s))
                    )
                    const lineOffset =
                      hasOppositeHierarchy &&
                      (e.pred === "broader" || e.pred === "narrower")
                        ? -4
                        : 0
                    const nx = -uy,
                      ny = ux
                    const ox = nx * lineOffset,
                      oy = ny * lineOffset
                    const x1 = sp.x + ux * rS + ox,
                      y1 = sp.y + uy * rS + oy,
                      x2 = tp.x - ux * (rT + 8) + ox,
                      y2 = tp.y - uy * (rT + 8) + oy
                    const mx = (x1 + x2) / 2,
                      my = (y1 + y2) / 2
                    const ang = (Math.atan2(dy, dx) * 180) / Math.PI,
                      flip = ang > 90 || ang < -90
                    const isHierarchy =
                      e.pred === "broader" || e.pred === "narrower"
                    const labelOffset = isHierarchy
                      ? hasOppositeHierarchy
                        ? e.pred === "broader"
                          ? -7
                          : -10
                        : -14
                      : 0
                    const labelX = mx + nx * labelOffset
                    const labelY = my + ny * labelOffset
                    const labelDy = isHierarchy ? 0 : -5
                    return (
                      <g key={i}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={col}
                          strokeWidth={
                            e.pred === "broader" || e.pred === "narrower"
                              ? 2.2
                              : 1.5
                          }
                          strokeOpacity={
                            e.pred === "broader" || e.pred === "narrower"
                              ? 0.9
                              : 0.75
                          }
                          markerEnd={`url(#gm-arr-${e.pred})`}
                        />
                        {egoShowEdgeLabels && (
                          <text
                            x={labelX}
                            y={labelY}
                            dy={labelDy}
                            textAnchor="middle"
                            fontSize={10}
                            fontFamily={GRAPH_FONT_FAMILY}
                            fontStyle="italic"
                            fill={col}
                            transform={`rotate(${
                              flip ? ang + 180 : ang
                            },${labelX},${labelY})`}
                            style={{ pointerEvents: "none" }}
                          >
                            {e.pred}
                          </text>
                        )}
                      </g>
                    )
                  })}
                  {egoSubgraph.nodes.map((n) => {
                    const pos = activeEgoPos[n.id]
                    if (!pos) return null
                    const isCenter = n.direction === "center"
                    const fill = egoGetNodeFill(n.direction, n.ringDepth)
                    const r = egoNodeR(n.direction, n.ringDepth)
                    const label = n.label || ""
                    const labelOverride = egoLabelOverrides[n.id]
                    // Compute outward label position for radial/ego layouts
                    const egoCenterNode = egoSubgraph.nodes.find(
                      (nn) => nn.direction === "center"
                    )
                    const egoCenterPos = egoCenterNode
                      ? activeEgoPos[egoCenterNode.id]
                      : null
                    let labelX, labelY
                    if (labelOverride) {
                      labelX = labelOverride.x
                      labelY = labelOverride.y
                    } else if (
                      !isCenter &&
                      egoCenterPos &&
                      layoutType !== "force"
                    ) {
                      const dx = pos.x - egoCenterPos.x
                      const dy = pos.y - egoCenterPos.y
                      const dist = Math.sqrt(dx * dx + dy * dy) || 1
                      labelX = pos.x + (dx / dist) * (r + 10)
                      labelY = pos.y + (dy / dist) * (r + 10)
                    } else {
                      labelX = pos.x
                      labelY = pos.y - (r + 8)
                    }
                    return (
                      <g
                        key={n.id}
                        style={{ cursor: isCenter ? "grab" : "pointer" }}
                      >
                        {isCenter && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={r + 10}
                            fill={fill}
                            fillOpacity={0.15}
                          />
                        )}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={r}
                          fill={fill}
                          stroke="white"
                          strokeWidth={isCenter ? 2.5 : 1.5}
                        />
                        {showLabels && (
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            fontSize={labelFontSize}
                            fontFamily={
                              isCenter ? "inherit" : GRAPH_FONT_FAMILY
                            }
                            fontWeight={isCenter ? 700 : 400}
                            fill="rgb(20,10,0)"
                            style={{ pointerEvents: "none", cursor: "move" }}
                          >
                            {label}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              </svg>
            ))}

          {/* Zoom controls */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {[
              {
                label: "+",
                fn: () => {
                  const s = Math.min(4, scaleRef.current + 0.25)
                  scaleRef.current = s
                  setScale(s)
                },
              },
              {
                label: "−",
                fn: () => {
                  const s = Math.max(0.1, scaleRef.current - 0.25)
                  scaleRef.current = s
                  setScale(s)
                },
              },
              {
                label: "⌖",
                fn: () => {
                  panRef.current = { x: 0, y: 0 }
                  setPan({ x: 0, y: 0 })
                  scaleRef.current = 1
                  setScale(1)
                },
              },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.fn}
                style={{
                  width: 30,
                  height: 30,
                  border: "1px solid rgb(220,205,185)",
                  borderRadius: 6,
                  background: "white",
                  cursor: "pointer",
                  fontSize: b.label === "⌖" ? 14 : 18,
                  color: "rgb(35,15,5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  fontFamily: GRAPH_FONT_FAMILY,
                }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 14,
              fontSize: 11,
              color: "rgb(175,155,130)",
              pointerEvents: "none",
              lineHeight: 1.6,
            }}
          >
            {layoutType === "ego" || layoutType === "radial"
              ? language === "en"
                ? "Drag to pan · Scroll to zoom · Drag node · Click internal node to refocus · Click external node to open URI"
                : "Arrastrar para mover · Rueda para zoom · Arrastrar nodo · Clic nodo interno para recentrar · Clic nodo externo abre URI"
              : layoutType === "force"
              ? egoFocalId
                ? language === "en"
                  ? "Drag to pan · Scroll to zoom · Drag node · Click internal node to refocus"
                  : "Arrastrar para mover · Rueda para zoom · Arrastrar nodo · Clic nodo interno para recentrar"
                : language === "en"
                ? "Drag to pan · Scroll to zoom · Drag node · Click to highlight"
                : "Arrastrar para mover · Rueda para zoom · Arrastrar nodo · Clic para destacar"
              : language === "en"
              ? "Scroll to zoom · Click to highlight"
              : "Rueda para zoom · Clic para destacar"}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphModal
