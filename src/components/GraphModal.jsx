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

const LINK_LAYOUTS = new Set(["force", "radial", "tree-v", "tree-h"])
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
  return (arr || [])
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
  broader: "rgb(165,85,55)",
  narrower: "rgb(165,55,55)",
  related: "rgb(65,115,185)",
  exactMatch: "rgb(50,145,90)",
  closeMatch: "rgb(85,160,110)",
  relatedMatch: "rgb(135,65,175)",
  broadMatch: "rgb(25,155,155)",
  narrowMatch: "rgb(50,120,120)",
}
const EGO_RING_RADII = [0, 155, 265, 368, 466, 560, 650, 737, 820]

function egoGetNodeFill(direction, ringDepth) {
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
  showMatches
) {
  const nodeMap = new Map(),
    egoEdges = [],
    edgeSet = new Set()
  const labelOf = (id) =>
    nodeInfo.find((n) => n.id === id)?.label || id.split("/").pop() || id
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
  // broader BFS: narrower edge t=id means s is broader
  {
    const vis = new Set([focalId]),
      q = [{ id: focalId, d: 0 }]
    while (q.length) {
      const { id, d } = q.shift()
      if (d >= depthBroader) continue
      for (const e of edgesAll) {
        if (e.type === "narrower" && e.t === id) {
          if (!nodeMap.has(e.s))
            nodeMap.set(e.s, {
              id: e.s,
              label: labelOf(e.s),
              ringDepth: d + 1,
              direction: "broader",
            })
          addE(id, e.s, "broader")
          if (!vis.has(e.s)) {
            vis.add(e.s)
            q.push({ id: e.s, d: d + 1 })
          }
        }
      }
    }
  }
  // narrower BFS: narrower edge s=id means t is narrower
  {
    const vis = new Set([focalId]),
      q = [{ id: focalId, d: 0 }]
    while (q.length) {
      const { id, d } = q.shift()
      if (d >= depthNarrow) continue
      for (const e of edgesAll) {
        if (e.type === "narrower" && e.s === id) {
          if (!nodeMap.has(e.t))
            nodeMap.set(e.t, {
              id: e.t,
              label: labelOf(e.t),
              ringDepth: d + 1,
              direction: "narrower",
            })
          addE(id, e.t, "narrower")
          if (!vis.has(e.t)) {
            vis.add(e.t)
            q.push({ id: e.t, d: d + 1 })
          }
        }
      }
    }
  }
  // matches from d3 hierarchy data (includes external URIs)
  if (showMatches && d3Root) {
    const d3n = d3Root.descendants().find((n) => n.data.id === focalId)
    if (d3n) {
      const idsOf = (a) =>
        !a
          ? []
          : (Array.isArray(a) ? a : [a])
              .map((x) => (typeof x === "string" ? x : x?.id))
              .filter(Boolean)
      for (const prop of SEMANTIC_PROPS) {
        for (const tid of idsOf(d3n.data[`_${prop}`])) {
          if (!nodeMap.has(tid))
            nodeMap.set(tid, {
              id: tid,
              label:
                nodeInfo.find((n) => n.id === tid)?.label ||
                tid.split("/").pop() ||
                tid,
              ringDepth: 1,
              direction: prop === "related" ? "related" : "external-match",
            })
          addE(focalId, tid, prop)
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
            width: 20,
            height: 20,
            borderRadius: "50%",
            fontFamily: "inherit",
            padding: 0,
            border: `1.5px solid ${
              d === value ? "rgb(196,95,40)" : "rgb(220,205,185)"
            }`,
            background: d === value ? "rgb(196,95,40)" : "white",
            color: d === value ? "white" : "rgb(80,60,40)",
            cursor: "pointer",
            fontSize: 10,
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
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState(
    new Set(["narrower"])
  )
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [egoDepthBroader, setEgoDepthBroader] = useState(1)
  const [egoDepthNarrow, setEgoDepthNarrow] = useState(1)
  const [egoShowMatches, setEgoShowMatches] = useState(false)
  const [egoFocalId, setEgoFocalId] = useState(null)
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
          .distance((d) => (d.type === "narrower" ? 90 : 150))
          .strength((d) => (d.type === "narrower" ? 0.7 : 0.3))
      )
      .force("charge", forceManyBody().strength(-350))
      .force("center", forceCenter(cx, cy).strength(0.05))
      .force("collide", forceCollide(14).strength(0.5))
      .alphaDecay(0.025)
      .on("tick", () => {
        const arr = sim.nodes().map((n) => ({ id: n.id, x: n.x, y: n.y }))
        positionsRef.current = arr
        setPositions(arr)
      })
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

      if (type === "radial") {
        const step = 130
        const t = tree()
          .size([2 * Math.PI, 1])
          .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)
        const rooted = t(root)
        rooted.descendants().forEach((node) => {
          const r = node.depth === 0 ? 0 : node.depth * step
          const a = node.x - Math.PI / 2
          arr.push({
            id: node.data.id,
            x: cx + r * Math.cos(a),
            y: cy + r * Math.sin(a),
          })
        })
      } else if (type === "tree-v") {
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

  useEffect(
    () => () => {
      if (d3SimRef.current) d3SimRef.current.stop()
    },
    []
  )

  // ── Ego subgraph recomputation ────────────────────────────
  useEffect(() => {
    if (layoutType !== "ego" || !egoFocalId) {
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
      egoShowMatches
    )
    const el = containerRef.current
    const cx = el ? el.clientWidth / 2 : 400,
      cy = el ? el.clientHeight / 2 : 300
    const basePos = egoLayoutNodes(sub.nodes, cx, cy, sub.edges)
    // Merge: keep user-dragged overrides for nodes still in subgraph
    const nodeIds = new Set(sub.nodes.map((n) => n.id))
    const pos = { ...basePos }
    for (const [id, p] of Object.entries(egoOverridesRef.current)) {
      if (nodeIds.has(id)) pos[id] = p
    }
    egoSubgraphRef.current = sub
    egoPositionsRef.current = pos
    setEgoSubgraph(sub)
    setEgoPositions(pos)
  }, [
    layoutType,
    egoFocalId,
    egoDepthBroader,
    egoDepthNarrow,
    egoShowMatches,
    nodeInfo,
    edgesAll,
  ])

  useEffect(() => {
    if (!egoFocalId || !edgesAll.length) return
    setEgoMaxDepths(computeEgoMaxDepths(egoFocalId, edgesAll))
  }, [egoFocalId, edgesAll])

  // ── Layout switch ─────────────────────────────────────────
  const handleLayout = (type) => {
    layoutRef.current = type
    setLayoutType(type)
    if (type === "ego") {
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      egoOverridesRef.current = {}
      const focal = selectedId || nodeInfoRef.current[0]?.id || null
      setEgoFocalId(focal)
      if (focal)
        setEgoMaxDepths(computeEgoMaxDepths(focal, edgesAllRef.current))
      return
    }
    if (type === "force") {
      const el = containerRef.current
      const cx = el ? el.clientWidth / 2 : 400
      const cy = el ? el.clientHeight / 2 : 300
      const count = nodeInfoRef.current.length
      const r = Math.min(220, 40 + count * 5)
      const cur = positionsRef.current
      const initNodes = nodeInfoRef.current.map((info, i) => {
        const p = cur.find((pp) => pp.id === info.id)
        return {
          id: info.id,
          x:
            p?.x ??
            (i === 0
              ? cx
              : cx + r * Math.cos((2 * Math.PI * i) / Math.max(count - 1, 1))),
          y:
            p?.y ??
            (i === 0
              ? cy
              : cy + r * Math.sin((2 * Math.PI * i) / Math.max(count - 1, 1))),
        }
      })
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      startForce(initNodes, edgesAllRef.current, enabledRef.current)
    } else {
      if (d3SimRef.current) {
        d3SimRef.current.stop()
        d3SimRef.current = null
      }
      applyStaticLayout(type)
    }
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
    if (lt === "ego") {
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

  const onMouseDown = (e) => {
    e.preventDefault()
    didMoveRef.current = false
    const hit = hitNode(e.clientX, e.clientY)
    if (hit && layoutRef.current === "force" && d3SimRef.current) {
      hit.fx = hit.x
      hit.fy = hit.y
      d3SimRef.current.alphaTarget(0.3).restart()
      dragRef.current = { type: "node", d3Node: hit }
    } else if (hit && layoutRef.current === "ego" && hit.isEgoNode) {
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
      if (!didMoveRef.current)
        setSelectedId((id) => (id === nd.id ? null : nd.id))
    } else if (dragRef.current.type === "ego-node" && !didMoveRef.current) {
      const hitId = dragRef.current.hitId
      const isInternal = nodeInfoRef.current.some((n) => n.id === hitId)
      if (isInternal && dragRef.current.egoDir !== "center") {
        egoOverridesRef.current = {}
        setEgoFocalId(hitId)
        setEgoMaxDepths(computeEgoMaxDepths(hitId, edgesAllRef.current))
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
    const sub = egoSubgraphRef.current
    const el = containerRef.current
    const cx = el ? el.clientWidth / 2 : 400,
      cy = el ? el.clientHeight / 2 : 300
    const freshPos = egoLayoutNodes(sub.nodes, cx, cy, sub.edges)
    egoPositionsRef.current = freshPos
    setEgoPositions(freshPos)
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
    return computeLabels(nodeInfo, posMap)
  }, [positions, nodeInfo, posMode])

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
        : branchDepthFill(info.branchIdx, info.depth)
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
          {h >= 10 &&
            (isNarrow ? (
              h >= 30 && (
                <text
                  transform={`translate(${pos.x0 + w / 2 + 1},${
                    pos.y0 + 5
                  }) rotate(90)`}
                  textAnchor="start"
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="rgb(20,10,0)"
                  style={{ pointerEvents: "none" }}
                >
                  {info.label}
                </text>
              )
            ) : (
              <text
                x={pos.x0 + 4}
                y={pos.y0 + 11}
                fontSize={isSel ? 11 : 10}
                fontWeight={isSel ? 700 : 400}
                fontFamily="sans-serif"
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
        : branchDepthFill(info.branchIdx, info.depth)
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
      const showLabel = arcH > 8 && (pos.x1 - pos.x0) * midR > 6
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
              fontSize={9}
              fontFamily="sans-serif"
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
        {ldat && (
          <text
            x={lx}
            y={ly + LABEL_H / 2}
            textAnchor="middle"
            fontSize={isSel ? 14 : 12}
            fontWeight={isSel || isNbr ? 700 : 400}
            fontFamily="sans-serif"
            fill="rgb(20,10,0)"
            style={{ pointerEvents: "none" }}
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
                fontSize: "15px",
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

          {/* Row 2: vocab selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "rgb(130,110,90)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              {language === "en" ? "Vocabulary:" : "Vocabulario:"}
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
                  flex: 1,
                  minWidth: 0,
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
          </div>

          {/* Row 3: layout buttons */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              flexWrap: "wrap",
              paddingBottom: layoutType === "ego" ? "6px" : "10px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "rgb(35,15,5)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginRight: "2px",
              }}
            >
              {language === "en" ? "Graph type:" : "Tipo de grafo:"}
            </span>
            {LAYOUTS.map((l) => {
              const active = layoutType === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => handleLayout(l.id)}
                  style={{
                    padding: "5px 13px",
                    borderRadius: "20px",
                    fontFamily: "inherit",
                    border: `1px solid ${
                      active ? "rgb(196,95,40)" : "rgb(220,205,185)"
                    }`,
                    background: active ? "rgb(196,95,40)" : "white",
                    color: active ? "white" : "rgb(80,60,40)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 400,
                    transition:
                      "background 0.15s,color 0.15s,border-color 0.15s",
                  }}
                >
                  {language === "en" ? l.en : l.es}
                </button>
              )
            })}
          </div>

          {/* Ego controls */}
          {layoutType === "ego" && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
                paddingBottom: "10px",
              }}
            >
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
              <button
                onClick={() => setEgoShowMatches((m) => !m)}
                style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontFamily: "inherit",
                  fontSize: 11,
                  border: `1.5px solid ${
                    egoShowMatches ? "rgb(196,95,40)" : "rgb(220,205,185)"
                  }`,
                  background: egoShowMatches ? "rgb(255,245,235)" : "white",
                  color: egoShowMatches ? "rgb(196,95,40)" : "rgb(100,80,60)",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                External Matches
              </button>
              <button
                onClick={handleEgoReset}
                title={
                  language === "en" ? "Reset layout" : "Reiniciar posiciones"
                }
                style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontFamily: "inherit",
                  fontSize: 11,
                  border: "1.5px solid rgb(220,205,185)",
                  background: "white",
                  color: "rgb(100,80,60)",
                  cursor: "pointer",
                }}
              >
                ⌖ Reset
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
              layoutType === "force" || layoutType === "ego"
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

          {positions.length > 0 && layoutType !== "ego" && (
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

          {layoutType === "ego" &&
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
                    const sp = egoPositions[e.s],
                      tp = egoPositions[e.t]
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
                    const x1 = sp.x + ux * rS,
                      y1 = sp.y + uy * rS,
                      x2 = tp.x - ux * (rT + 8),
                      y2 = tp.y - uy * (rT + 8)
                    const mx = (x1 + x2) / 2,
                      my = (y1 + y2) / 2
                    const ang = (Math.atan2(dy, dx) * 180) / Math.PI,
                      flip = ang > 90 || ang < -90
                    return (
                      <g key={i}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={col}
                          strokeWidth={1.5}
                          strokeOpacity={0.75}
                          markerEnd={`url(#gm-arr-${e.pred})`}
                        />
                        <text
                          x={mx}
                          y={my}
                          dy={-5}
                          textAnchor="middle"
                          fontSize={10}
                          fontFamily="sans-serif"
                          fontStyle="italic"
                          fill={col}
                          transform={`rotate(${
                            flip ? ang + 180 : ang
                          },${mx},${my})`}
                          style={{ pointerEvents: "none" }}
                        >
                          {e.pred}
                        </text>
                      </g>
                    )
                  })}
                  {egoSubgraph.nodes.map((n) => {
                    const pos = egoPositions[n.id]
                    if (!pos) return null
                    const isCenter = n.direction === "center"
                    const fill = egoGetNodeFill(n.direction, n.ringDepth)
                    const r = egoNodeR(n.direction, n.ringDepth)
                    const label = n.label || ""
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
                        <text
                          x={pos.x}
                          y={pos.y - (r + 8)}
                          textAnchor="middle"
                          fontSize={11}
                          fontFamily="sans-serif"
                          fontWeight={isCenter ? 700 : 400}
                          fill="rgb(20,10,0)"
                          style={{ pointerEvents: "none" }}
                        >
                          {label}
                        </text>
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
                  fontFamily: "sans-serif",
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
            {layoutType === "ego"
              ? language === "en"
                ? "Drag to pan · Scroll to zoom · Drag node · Click internal node to refocus · Click external node to open URI"
                : "Arrastrar para mover · Rueda para zoom · Arrastrar nodo · Clic nodo interno para recentrar · Clic nodo externo abre URI"
              : layoutType === "force"
              ? language === "en"
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
