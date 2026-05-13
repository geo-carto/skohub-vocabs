import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
const RELATION_STYLES = {
  broader: {
    color: "rgb(94, 94, 94)",
    hlColor: "rgb(51, 51, 51)",
    dash: null,
  },
  narrower: {
    color: "rgb(175, 175, 175)",
    hlColor: "rgb(138, 134, 134)",
    dash: null,
  },
  related: {
    color: "rgb(209, 172, 117)",
    hlColor: "rgb(192, 134, 62)",
    dash: "6,3",
  },
  close: {
    color: "rgb(187, 122, 52)",
    hlColor: "rgb(153, 81, 26)",
    dash: "4,2",
  },
  exactMatch: {
    color: "rgb(99, 153, 204)",
    hlColor: "rgb(38, 86, 122)",
    dash: "2,2",
  },
  closeMatch: {
    color: "rgb(108, 177, 131)",
    hlColor: "rgb(58, 126, 82)",
    dash: "4,3",
  },
  relatedMatch: {
    color: "rgb(167, 120, 194)",
    hlColor: "rgb(116, 58, 153)",
    dash: "3,3",
  },
  broadMatch: {
    color: "rgb(63, 150, 150)",
    hlColor: "rgb(13, 122, 122)",
    dash: "5,3",
  },
  narrowMatch: {
    color: "rgb(127, 196, 196)",
    hlColor: "rgb(71, 163, 163)",
    dash: "3,5",
  },
}

const EDGE_DEFS = [
  {
    id: "narrower",
    es: "Jerárquica",
    en: "Hierarchical",
    ...RELATION_STYLES.narrower,
  },
  {
    id: "related",
    es: "Relacionado",
    en: "Related",
    ...RELATION_STYLES.related,
  },
  {
    id: "exactMatch",
    es: "ExactMatch",
    en: "ExactMatch",
    ...RELATION_STYLES.exactMatch,
  },
  {
    id: "close",
    es: "Close",
    en: "Close",
    ...RELATION_STYLES.close,
  },
  {
    id: "closeMatch",
    es: "CloseMatch",
    en: "CloseMatch",
    ...RELATION_STYLES.closeMatch,
  },
  {
    id: "relatedMatch",
    es: "RelatedMatch",
    en: "RelatedMatch",
    ...RELATION_STYLES.relatedMatch,
  },
  {
    id: "broadMatch",
    es: "BroadMatch",
    en: "BroadMatch",
    ...RELATION_STYLES.broadMatch,
  },
  {
    id: "narrowMatch",
    es: "NarrowMatch",
    en: "NarrowMatch",
    ...RELATION_STYLES.narrowMatch,
  },
]
const EDGE_BY_ID = Object.fromEntries(EDGE_DEFS.map((e) => [e.id, e]))
const SEMANTIC_PROPS = [
  "related",
  "exactMatch",
  "close",
  "closeMatch",
  "relatedMatch",
  "broadMatch",
  "narrowMatch",
]
const EGO_RELATION_DEFS = [
  { id: "broader", es: "Broader", en: "Broader" },
  { id: "narrower", es: "Narrower", en: "Narrower" },
  { id: "related", es: "Related", en: "Related" },
  { id: "close", es: "Close", en: "Close" },
]
const EGO_EXTERNAL_RELATION_DEFS = [
  { id: "exactMatch", es: "ExactMatch", en: "ExactMatch" },
  { id: "closeMatch", es: "CloseMatch", en: "CloseMatch" },
  { id: "relatedMatch", es: "RelatedMatch", en: "RelatedMatch" },
  { id: "broadMatch", es: "BroadMatch", en: "BroadMatch" },
  { id: "narrowMatch", es: "NarrowMatch", en: "NarrowMatch" },
]
const GRAPH_FONT_FAMILY = "roboto, Roboto, sans-serif"
const GRAPH_FONT_WEIGHT = 700

const NODE_STYLES = {
  selected: "rgb(196, 95, 40)",
  selectedStroke: "rgb(140, 50, 10)",
  neighbor: "rgb(220, 130, 55)",
  root: "#c95050",
  related: "rgb(137, 174, 218)",
  depth: [
    "#c24343",
    "#e49791",
    "#ebadad",
    "#d3b5b1",
    "#d7cabc",
    "#f3d5ba",
    "#f7ead4",
  ],
  depthLight: [
    "rgb(176, 88, 74)",
    "rgb(190, 98, 82)",
    "rgb(203, 111, 92)",
    "rgb(215, 129, 108)",
    "rgb(224, 150, 130)",
    "rgb(231, 171, 153)",
    "rgb(236, 190, 174)",
  ],
  depthGreen: [
    "#758635",
    "#b1b983",
    "#d9dfbf",
    "#cabda0",
    "#d6c295",
    "#ebe2bd",
    "#fcefd4",
  ],
  depthBlue: [
    "#4a7baf",
    "#87abcf",
    "#d1e2f3",
    "#9fa4c5",
    "#c4c6d6",
    "#ddd9c5",
    "#fcefd4",
  ],
  external: [
    "rgb(218, 240, 255)",
    "rgb(139, 178, 218)",
    "rgb(211, 231, 241)",
    "rgb(75, 125, 172)",
    "rgb(150, 196, 226)",
  ],
}

// ─── Warm red palette, subtle branch offset ─
const NODE_PALETTE_OPTIONS = [
  { id: "depth", es: "Roja", en: "Red" },
  { id: "depthGreen", es: "Verde", en: "Green" },
  { id: "depthBlue", es: "Azul", en: "Blue" },
]

function getNodePalette(paletteId, light = false) {
  const lightId = `${paletteId}Light`
  if (light && NODE_STYLES[lightId]) return NODE_STYLES[lightId]
  if (NODE_STYLES[paletteId]) return NODE_STYLES[paletteId]
  return light ? NODE_STYLES.depthLight : NODE_STYLES.depth
}

function branchDepthFill(_branchIdx, depth, paletteId = "depth") {
  const palette = getNodePalette(paletteId)
  return palette[Math.min(depth, palette.length - 1)]
}

function lightBranchDepthFill(_branchIdx, depth, paletteId = "depth") {
  const palette = getNodePalette(paletteId, true)
  return palette[Math.min(depth, palette.length - 1)]
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
    _close: ids(concept.close),
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
  broader: RELATION_STYLES.broader.color,
  narrower: RELATION_STYLES.narrower.color,
  related: RELATION_STYLES.related.color,
  close: RELATION_STYLES.close.color,
  exactMatch: RELATION_STYLES.exactMatch.color,
  closeMatch: RELATION_STYLES.closeMatch.color,
  relatedMatch: RELATION_STYLES.relatedMatch.color,
  broadMatch: RELATION_STYLES.broadMatch.color,
  narrowMatch: RELATION_STYLES.narrowMatch.color,
}
const EGO_RING_RADII = [0, 155, 265, 368, 466, 560, 650, 737, 820]
const EXTERNAL_SOURCE_COLORS = NODE_STYLES.external

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

function egoGetNodeFill(direction, ringDepth, paletteId = "depth") {
  if (direction?.startsWith("external:")) {
    return direction.slice("external:".length)
  }
  switch (direction) {
    case "center":
      return branchDepthFill(0, 0, paletteId)
    case "broader":
      return lightBranchDepthFill(0, Math.max(1, ringDepth), paletteId)
    case "narrower":
      return branchDepthFill(0, Math.max(1, ringDepth), paletteId)
    case "related":
      return NODE_STYLES.related
    default:
      return branchDepthFill(0, Math.max(1, ringDepth), paletteId)
  }
}
function egoNodeR(dir, ringDepth = 0) {
  const base =
    dir === "center" ? 36 : dir === "broader" || dir === "narrower" ? 28 : 22
  return Math.max(10, base - ringDepth * 5)
}

const EGO_LABEL_WRAP_CHARS = 18
const EGO_LABEL_MAX_LINES = 4
const EGO_NODE_PAD_X = 14
const EGO_NODE_PAD_Y = 10

function wrapNodeLabel(label, maxChars = EGO_LABEL_WRAP_CHARS) {
  const words = String(label || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return [""]
  const lines = []
  let current = ""
  const pushLongWord = (word) => {
    for (let i = 0; i < word.length; i += maxChars) {
      lines.push(word.slice(i, i + maxChars))
    }
  }
  words.forEach((word) => {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current)
        current = ""
      }
      pushLongWord(word)
      return
    }
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  if (lines.length <= EGO_LABEL_MAX_LINES) return lines
  const out = lines.slice(0, EGO_LABEL_MAX_LINES)
  out[out.length - 1] = `${out[out.length - 1].replace(/\.{3}$/, "")}...`
  return out
}

function egoNodeDims(node, fontSize = 11) {
  const label = node?.label || ""
  const lines = wrapNodeLabel(label)
  const baseR = egoNodeR(node?.direction || "", node?.ringDepth || 0)
  const longest = Math.max(...lines.map((line) => line.length), 1)
  const textW = longest * fontSize * 0.58
  const lineH = fontSize + 2
  const textH = lines.length * lineH
  return {
    lines,
    lineH,
    rx: Math.max(baseR, textW / 2 + EGO_NODE_PAD_X),
    ry: Math.max(baseR, textH / 2 + EGO_NODE_PAD_Y),
  }
}

function ellipseEdgePoint(from, to, dims, extra = 0) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / dist
  const uy = dy / dist
  const rx = (dims?.rx || 1) + extra
  const ry = (dims?.ry || 1) + extra
  const edgeDist = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry))
  return { x: from.x + ux * edgeDist, y: from.y + uy * edgeDist, ux, uy, dist }
}

function linkNodeDims(info, fontSize = 11) {
  const lines = wrapNodeLabel(info?.label || "")
  const baseR = info?.isRoot ? 12 : 8
  const longest = Math.max(...lines.map((line) => line.length), 1)
  const textW = longest * fontSize * 0.58
  const lineH = fontSize + 2
  const textH = lines.length * lineH
  return {
    lines,
    lineH,
    rx: Math.max(baseR, textW / 2 + 12),
    ry: Math.max(baseR, textH / 2 + 8),
  }
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
  enabledRelations = new Set(["broader", "narrower"])
) {
  const nodeMap = new Map(),
    egoEdges = [],
    edgeSet = new Set()
  const relationSet =
    enabledRelations instanceof Set
      ? enabledRelations
      : new Set(enabledRelations || [])
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
  const addContextualHierarchyEdge = (e) => {
    if (e.type !== "narrower" || !nodeMap.has(e.s) || !nodeMap.has(e.t)) return
    const source = nodeMap.get(e.s)
    const target = nodeMap.get(e.t)
    const pointsDown =
      (source.direction === "center" || source.direction === "narrower") &&
      target.direction === "narrower"
    const pointsUp =
      (target.direction === "center" || target.direction === "broader") &&
      source.direction === "broader"
    if (relationSet.has("narrower") && pointsDown) addE(e.s, e.t, "narrower")
    if (relationSet.has("broader") && pointsUp) addE(e.t, e.s, "broader")
  }
  const visited = new Set([focalId])
  const q = [{ id: focalId, up: 0, down: 0 }]
  while (q.length) {
    const { id, up, down } = q.shift()
    for (const e of edgesAll) {
      if (e.type !== "narrower") continue
      const next =
        relationSet.has("narrower") && e.s === id && down < depthNarrow
          ? { id: e.t, up, down: down + 1 }
          : relationSet.has("broader") && e.t === id && up < depthBroader
          ? { id: e.s, up: up + 1, down }
          : null
      if (!next || visited.has(next.id)) continue
      visited.add(next.id)
      const info = nodeInfoById.get(next.id)
      nodeMap.set(next.id, {
        id: next.id,
        label: labelOf(next.id),
        ringDepth: Math.max(next.up, next.down),
        direction: next.up > 0 ? "broader" : "narrower",
      })
      q.push(next)
    }
  }
  for (const e of edgesAll) {
    addContextualHierarchyEdge(e)
  }
  const focalInfo = nodeInfoById.get(focalId)
  if (focalInfo?.isRoot && relationSet.has("narrower")) {
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
      addContextualHierarchyEdge(e)
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
  // semantic relations can come from embedded scheme JSON, and external matches
  // can additionally come from each visible concept JSON when alignments are on.
  if (SEMANTIC_PROPS.some((prop) => relationSet.has(prop))) {
    const internalIds = new Set(nodeInfo.map((n) => n.id))
    const visibleInternalIds = [...nodeMap.keys()].filter((id) =>
      internalIds.has(id)
    )
    for (const sourceId of visibleInternalIds) {
      const d3n = d3Root?.descendants().find((n) => n.data.id === sourceId)
      const matchData = matchDataById[sourceId] || {}
      const sourceNode = nodeMap.get(sourceId)
      for (const prop of SEMANTIC_PROPS) {
        if (!relationSet.has(prop)) continue
        const tids = new Set([
          ...ids(d3n?.data?.[`_${prop}`]),
          ...(showMatches ? ids(matchData?.[prop]) : []),
        ])
        for (const tid of tids) {
          const source = getExternalSourceInfo(tid)
          const isInternalTarget = internalIds.has(tid)
          if (!isInternalTarget && !showMatches) continue
          if (!nodeMap.has(tid)) {
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

function egoLayoutNodes(nodes, cx, cy, edges = [], radialSpacing = 1) {
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
    const baseR =
      EGO_RING_RADII[Math.min(depth, EGO_RING_RADII.length - 1)] || depth * 110
    const R = baseR * radialSpacing
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
      const baseR =
        EGO_RING_RADII[Math.min(n.ringDepth, EGO_RING_RADII.length - 1)]
      const R = baseR * radialSpacing
      pos[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }
    })
  return pos
}

function EgoDepthBtns({ label, value, max, onChange }) {
  const safeMax = Math.max(0, Number(max) || 0)
  const safeValue = Math.min(Math.max(0, value), safeMax)
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 11,
          color: "rgb(100,80,60)",
          whiteSpace: "nowrap",
        }}
      >
        <span>{label}</span>
        <span>
          {safeValue}/{safeMax}
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={safeMax}
        step={1}
        value={safeValue}
        disabled={safeMax === 0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "rgb(196,95,40)",
          cursor: safeMax === 0 ? "default" : "pointer",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${safeMax + 1}, 1fr)`,
          fontSize: 9,
          color: "rgb(130,110,90)",
          lineHeight: 1,
          marginTop: -2,
        }}
      >
        {Array.from({ length: safeMax + 1 }, (_, d) => (
          <span
            key={d}
            style={{
              textAlign: d === 0 ? "left" : d === safeMax ? "right" : "center",
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </label>
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
  const [, setEgoLabelOverrides] = useState({})
  const [enabledEdgeTypes, setEnabledEdgeTypes] = useState(
    new Set(["narrower"])
  )
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [egoDepthBroader, setEgoDepthBroader] = useState(1)
  const [egoDepthNarrow, setEgoDepthNarrow] = useState(1)
  const [enabledEgoRelations, setEnabledEgoRelations] = useState(
    new Set(["broader", "narrower"])
  )
  const [enabledExternalRelations, setEnabledExternalRelations] = useState(
    new Set()
  )
  const [egoShowEdgeLabels, setEgoShowEdgeLabels] = useState(true)
  const [labelFontSize, setLabelFontSize] = useState(11)
  const [edgeLabelFontSize, setEdgeLabelFontSize] = useState(10)
  const [nodePalette, setNodePalette] = useState("depth")
  const [radialSpacing, setRadialSpacing] = useState(1)
  const [treeSpacingX, setTreeSpacingX] = useState(190)
  const [treeSpacingY, setTreeSpacingY] = useState(145)
  const egoShowMatches = enabledExternalRelations.size > 0
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
  const startForce = useCallback(
    (initNodes, allEdges, enabledTypes) => {
      if (d3SimRef.current) d3SimRef.current.stop()
      const el = containerRef.current
      const cx = el ? el.clientWidth / 2 : 400
      const cy = el ? el.clientHeight / 2 : 300
      const simNodes = initNodes.map((n) => ({
        ...n,
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
        .force(
          "collide",
          forceCollide((d) => {
            const dims = egoNodeDims(d, labelFontSize)
            return Math.max(dims.rx, dims.ry) + 10
          }).strength(0.6)
        )
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
    },
    [labelFontSize]
  )

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
        const r = tree().nodeSize([treeSpacingX, treeSpacingY])
        r(root)
        const nodes = root.descendants()
        const minX = Math.min(...nodes.map((n) => n.x))
        nodes.forEach((n) =>
          arr.push({ id: n.data.id, x: n.x - minX + 50, y: n.y + 50 })
        )
      } else if (type === "tree-h") {
        const r = tree().nodeSize([treeSpacingY, treeSpacingX])
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
        const ringWidth = 92
        const R = Math.max(Math.min(cx, cy) - 10, maxDepth * ringWidth)
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
    [treeSpacingX, treeSpacingY, updatePositions]
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
    setEnabledExternalRelations(new Set())
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
          _close: [],
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
          setEnabledEgoRelations(new Set(["narrower"]))
        }

        const el = containerRef.current
        const cx = el ? el.clientWidth / 2 : 400
        const cy = el ? el.clientHeight / 2 : 300
        const count = flatNodes.length
        const r = Math.min(220, 40 + count * 5)
        const initNodes = flatNodes.map((info, i) => ({
          ...info,
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
      new Set(["broader", "narrower"])
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
      new Set([...enabledEgoRelations, ...enabledExternalRelations])
    )
    egoSubgraphRef.current = sub
    setEgoSubgraph(sub)
    // For force layout, positions come from the force sim (handled by separate effect)
    if (layoutType !== "force") {
      const el = containerRef.current
      const cx = el ? el.clientWidth / 2 : 400,
        cy = el ? el.clientHeight / 2 : 300
      const basePos = egoLayoutNodes(
        sub.nodes,
        cx,
        cy,
        sub.edges,
        radialSpacing
      )
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
    enabledEgoRelations,
    enabledExternalRelations,
    radialSpacing,
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
        ...node,
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

  useEffect(() => {
    if (
      enabledEgoRelations.has("broader") &&
      egoMaxDepths.maxBroader > 0 &&
      egoDepthBroader === 0
    ) {
      setEgoDepthBroader(1)
    }
    if (
      enabledEgoRelations.has("narrower") &&
      egoMaxDepths.maxNarrow > 0 &&
      egoDepthNarrow === 0
    ) {
      setEgoDepthNarrow(1)
    }
  }, [
    enabledEgoRelations,
    egoMaxDepths.maxBroader,
    egoMaxDepths.maxNarrow,
    egoDepthBroader,
    egoDepthNarrow,
  ])

  // ── Layout switch ─────────────────────────────────────────
  useEffect(() => {
    if (layoutType === "tree-v" || layoutType === "tree-h") {
      applyStaticLayout(layoutType)
    }
  }, [layoutType, treeSpacingX, treeSpacingY, applyStaticLayout])

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
      setEnabledEgoRelations(new Set(["narrower"]))
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
      setEnabledEgoRelations(new Set(["broader", "narrower"]))
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
      setEnabledEgoRelations(new Set(["narrower"]))
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
      return (
        d3SimRef.current.nodes().find((n) => {
          const dims = egoNodeDims(n, labelFontSize)
          return (
            (n.x - gx) ** 2 / dims.rx ** 2 + (n.y - gy) ** 2 / dims.ry ** 2 <= 1
          )
        }) || null
      )
    }
    const pos = positionsRef.current
    if (LINK_LAYOUTS.has(lt)) {
      const nodeById = new Map(
        nodeInfoRef.current.map((node) => [node.id, node])
      )
      const h = pos.find((p) => {
        if (p.x == null) return false
        const dims = linkNodeDims(nodeById.get(p.id), labelFontSize)
        return (
          (p.x - gx) ** 2 / dims.rx ** 2 + (p.y - gy) ** 2 / dims.ry ** 2 <= 1
        )
      })
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
        const dims = egoNodeDims(n, labelFontSize)
        return (
          (p.x - gx) ** 2 / dims.rx ** 2 + (p.y - gy) ** 2 / dims.ry ** 2 <= 1
        )
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
      return null
    }
    return null
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
      dragRef.current = {
        type: "node",
        d3Node: hit,
        sx: e.clientX,
        sy: e.clientY,
      }
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

  const refocusEgo = (id, resetDepths = false) => {
    const depths = computeEgoMaxDepths(id, edgesAllRef.current)
    const minBroader = Math.min(1, depths.maxBroader)
    const minNarrow = Math.min(1, depths.maxNarrow)
    setEgoFocalId(id)
    setEgoMaxDepths(depths)
    setEgoDepthBroader((current) =>
      resetDepths
        ? minBroader
        : Math.min(Math.max(current, minBroader), depths.maxBroader)
    )
    setEgoDepthNarrow((current) =>
      resetDepths
        ? minNarrow
        : Math.min(Math.max(current, minNarrow), depths.maxNarrow)
    )
  }

  const onMouseUp = () => {
    if (!dragRef.current) return
    if (dragRef.current.type === "node") {
      const nd = dragRef.current.d3Node
      nd.fx = null
      nd.fy = null
      d3SimRef.current?.alphaTarget(0)
      if (!didMoveRef.current) {
        // In force+ego mode: clicking an internal non-center node refocuses ego
        if (layoutRef.current === "force" && egoFocalId) {
          const isInternal = nodeInfoRef.current.some((n) => n.id === nd.id)
          const egoNode = egoSubgraphRef.current.nodes.find(
            (n) => n.id === nd.id
          )
          if (isInternal && egoNode?.direction !== "center") {
            egoOverridesRef.current = {}
            refocusEgo(nd.id)
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
          refocusEgo(hitId)
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
        refocusEgo(hitId)
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
        ...node,
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
      const freshPos = egoLayoutNodes(
        sub.nodes,
        cx,
        cy,
        sub.edges,
        radialSpacing
      )
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
    const sourceInfo = nodeInfo.find((n) => n.id === e.s)
    const targetInfo = nodeInfo.find((n) => n.id === e.t)
    const sourceDims = linkNodeDims(sourceInfo, labelFontSize)
    const targetDims = linkNodeDims(targetInfo, labelFontSize)
    const sEdge = ellipseEdgePoint(s, t, sourceDims)
    const tEdge = ellipseEdgePoint(t, s, targetDims)
    const sx = sEdge.x,
      sy = sEdge.y,
      tx = tEdge.x,
      ty = tEdge.y
    const def = EDGE_BY_ID[e.type] || EDGE_DEFS[0]
    const hi = hlEdges.has(i),
      dim = hasSel && !hi
    const col = hi ? def.hlColor : def.color
    const treeCol = hi ? "rgb(105,100,95)" : "rgb(170,165,158)"
    const w = hi ? 2.5 : 1.5,
      op = dim ? 0.1 : 1
    const dash = def.dash || undefined

    if (layoutType === "tree-v") {
      const my = (sy + ty) / 2
      return (
        <path
          key={i}
          d={`M ${sx},${sy} C ${sx},${my} ${tx},${my} ${tx},${ty}`}
          fill="none"
          stroke={treeCol}
          strokeWidth={w}
          strokeOpacity={op}
          strokeDasharray={dash}
          markerEnd={`url(#gm-tree-arr-${hi ? "hi" : "base"})`}
        />
      )
    }
    if (layoutType === "tree-h") {
      const mx = (sx + tx) / 2
      return (
        <path
          key={i}
          d={`M ${sx},${sy} C ${mx},${sy} ${mx},${ty} ${tx},${ty}`}
          fill="none"
          stroke={treeCol}
          strokeWidth={w}
          strokeOpacity={op}
          strokeDasharray={dash}
          markerEnd={`url(#gm-tree-arr-${hi ? "hi" : "base"})`}
        />
      )
    }
    return (
      <line
        key={i}
        x1={sx}
        y1={sy}
        x2={tx}
        y2={ty}
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
        ? NODE_STYLES.selected
        : isNbr
        ? NODE_STYLES.neighbor
        : lightBranchDepthFill(info.branchIdx, info.depth, nodePalette)
      const isNarrow = w < 28
      return (
        <g key={info.id} opacity={dim ? 0.4 : 1} style={{ cursor: "pointer" }}>
          <rect
            x={pos.x0 + 0.5}
            y={pos.y0 + 0.5}
            width={Math.max(0, w - 1)}
            height={Math.max(0, h - 1)}
            fill={fill}
            stroke={isSel ? NODE_STYLES.selectedStroke : "white"}
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
                  fontWeight={GRAPH_FONT_WEIGHT}
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
                fontWeight={GRAPH_FONT_WEIGHT}
                fontFamily={GRAPH_FONT_FAMILY}
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
        ? NODE_STYLES.selected
        : isNbr
        ? NODE_STYLES.neighbor
        : lightBranchDepthFill(info.branchIdx, info.depth, nodePalette)
      const d = arcPath(pos.x0, pos.x1, pos.y0, pos.y1, pos.cx, pos.cy)
      if (!d) return null
      const midA = (pos.x0 + pos.x1) / 2 - Math.PI / 2
      const midR = (pos.y0 + pos.y1) / 2
      // Label at inner edge, text extends radially outward — no clipping
      const innerR = pos.y0 < 2 ? 0 : pos.y0 + 10
      const lx2 = pos.cx + innerR * Math.cos(midA)
      const ly2 = pos.cy + innerR * Math.sin(midA)
      const degA = (midA * 180) / Math.PI
      const isLeft = midA > Math.PI / 2 || midA < -Math.PI / 2
      const textRot = isLeft ? degA + 180 : degA
      const anchor = isLeft ? "end" : "start"
      const arcH = pos.y1 - pos.y0
      const showLabel = showLabels && arcH > 8 && (pos.x1 - pos.x0) * midR > 6
      const isSunburstRoot = info.isRoot || pos.y0 < 2
      const labelLines = wrapNodeLabel(info.label, isSunburstRoot ? 16 : 14)
      const lineH = labelFontSize + 2
      const labelStartY =
        (isSunburstRoot ? pos.cy : ly2) - ((labelLines.length - 1) * lineH) / 2
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
              textAnchor={isSunburstRoot ? "middle" : anchor}
              dominantBaseline="middle"
              fontSize={labelFontSize}
              fontFamily={GRAPH_FONT_FAMILY}
              fontWeight={GRAPH_FONT_WEIGHT}
              fill="rgb(20,10,0)"
              transform={
                isSunburstRoot ? undefined : `rotate(${textRot},${lx2},${ly2})`
              }
              x={isSunburstRoot ? pos.cx : lx2}
              y={labelStartY}
              style={{ pointerEvents: "none" }}
            >
              {labelLines.map((line, idx) => (
                <tspan
                  key={`${info.id}-sunburst-${idx}`}
                  x={isSunburstRoot ? pos.cx : lx2}
                  dy={idx === 0 ? 0 : lineH}
                >
                  {line}
                </tspan>
              ))}
            </text>
          )}
        </g>
      )
    }

    // ── Link (force / tree / radial) ──
    if (pos.x == null) return null
    const ldat = labelData[info.id]
    const dims = linkNodeDims(info, isSel ? labelFontSize + 2 : labelFontSize)
    const textStartY = -((dims.lines.length - 1) * dims.lineH) / 2
    const fill = isSel
      ? NODE_STYLES.selected
      : isNbr
      ? NODE_STYLES.neighbor
      : info.isRoot
      ? egoGetNodeFill("center", 0, nodePalette)
      : egoGetNodeFill("narrower", Math.max(1, info.depth), nodePalette)
    return (
      <g
        key={info.id}
        transform={`translate(${pos.x},${pos.y})`}
        style={{ cursor: "pointer" }}
        opacity={dim ? 0.18 : 1}
      >
        {isSel && (
          <ellipse
            rx={dims.rx + 7}
            ry={dims.ry + 7}
            fill={NODE_STYLES.selected}
            fillOpacity={0.18}
          />
        )}
        <ellipse
          rx={dims.rx}
          ry={dims.ry}
          fill={fill}
          stroke="white"
          strokeWidth={1.5}
        />
        {showLabels && ldat && (
          <text
            x={0}
            y={textStartY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isSel ? labelFontSize + 2 : labelFontSize}
            fontWeight={GRAPH_FONT_WEIGHT}
            fontFamily={GRAPH_FONT_FAMILY}
            fill="rgb(20,10,0)"
            style={{ pointerEvents: "none" }}
          >
            {dims.lines.map((line, idx) => (
              <tspan
                key={`${info.id}-${idx}`}
                x={0}
                dy={idx === 0 ? 0 : dims.lineH}
              >
                {line}
              </tspan>
            ))}
          </text>
        )}
      </g>
    )
  }

  const sidePanelLabelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "rgb(35,15,5)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }
  const sideSelectStyle = {
    fontSize: "13px",
    color: "rgb(80,50,20)",
    border: "1px solid rgb(220,205,185)",
    borderRadius: "6px",
    padding: "6px 26px 6px 10px",
    background: "white",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23826e5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    fontFamily: "inherit",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
  }
  const sideCheckboxRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "2px 0",
    cursor: "pointer",
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
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
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
              display: "none",
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
                display: "none",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
                paddingBottom: "10px",
              }}
            >
              <span style={sidePanelLabelStyle}>
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
              <details style={{ position: "relative" }}>
                <summary
                  style={{
                    listStyle: "none",
                    padding: "5px 30px 5px 13px",
                    borderRadius: "20px",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    border: "1.5px solid rgb(196,95,40)",
                    background: "rgb(196,95,40)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {enabledEgoRelations.size}{" "}
                  {language === "en" ? "selected" : "seleccionadas"}
                  <span
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                    }}
                  >
                    ▾
                  </span>
                </summary>
                <div
                  style={{
                    position: "absolute",
                    zIndex: 10,
                    top: "calc(100% + 4px)",
                    left: 0,
                    minWidth: 210,
                    padding: "8px",
                    border: "1px solid rgb(220,205,185)",
                    borderRadius: 8,
                    background: "white",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.16)",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  {EGO_RELATION_DEFS.map((rel) => {
                    const checked = enabledEgoRelations.has(rel.id)
                    const col = EGO_PRED_COLORS[rel.id] || "rgb(120,110,100)"
                    return (
                      <label
                        key={rel.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 6px",
                          borderRadius: 5,
                          color: "rgb(65,45,30)",
                          fontSize: 13,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(enabledEgoRelations)
                            if (checked) next.delete(rel.id)
                            else next.add(rel.id)
                            setEnabledEgoRelations(next)
                          }}
                        />
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: col,
                            flexShrink: 0,
                          }}
                        />
                        {language === "en" ? rel.en : rel.es}
                      </label>
                    )
                  })}
                </div>
              </details>
              <button
                onClick={() => setEnabledEgoRelations(new Set(["narrower"]))}
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
                {language === "en" ? "Narrower" : "Narrower"}
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
                  whiteSpace: "nowrap",
                }}
              >
                {language === "en" ? "TEXT SIZE:" : "TAMAÑO TEXTO:"}
              </span>
              <select
                value={edgeLabelFontSize}
                onChange={(e) => setEdgeLabelFontSize(Number(e.target.value))}
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
              <details style={{ position: "relative" }}>
                <summary
                  style={{
                    listStyle: "none",
                    padding: "5px 30px 5px 13px",
                    borderRadius: "20px",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    border: `1.5px solid ${
                      enabledExternalRelations.size
                        ? "rgb(196,95,40)"
                        : "rgb(220,205,185)"
                    }`,
                    background: enabledExternalRelations.size
                      ? "rgb(196,95,40)"
                      : "white",
                    color: enabledExternalRelations.size
                      ? "white"
                      : "rgb(100,80,60)",
                    fontWeight: enabledExternalRelations.size ? 700 : 400,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {enabledExternalRelations.size}{" "}
                  {language === "en" ? "selected" : "seleccionadas"}
                  <span
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                    }}
                  >
                    ▾
                  </span>
                </summary>
                <div
                  style={{
                    position: "absolute",
                    zIndex: 10,
                    top: "calc(100% + 4px)",
                    left: 0,
                    minWidth: 190,
                    padding: "8px",
                    border: "1px solid rgb(220,205,185)",
                    borderRadius: 8,
                    background: "white",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.16)",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  {EGO_EXTERNAL_RELATION_DEFS.map((rel) => {
                    const checked = enabledExternalRelations.has(rel.id)
                    const col = EGO_PRED_COLORS[rel.id] || "rgb(120,110,100)"
                    return (
                      <label
                        key={rel.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 6px",
                          borderRadius: 5,
                          color: "rgb(65,45,30)",
                          fontSize: 13,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(enabledExternalRelations)
                            if (checked) next.delete(rel.id)
                            else next.add(rel.id)
                            setEnabledExternalRelations(next)
                          }}
                        />
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: col,
                            flexShrink: 0,
                          }}
                        />
                        {language === "en" ? rel.en : rel.es}
                      </label>
                    )
                  })}
                </div>
              </details>
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
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 3,
              width: 250,
              overflowY: "auto",
              padding: 12,
              borderRight: "1px solid rgb(220,205,185)",
              background: "rgb(250,247,242)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxSizing: "border-box",
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {schemes?.length > 0 ? (
              <label style={{ display: "grid", gap: 5 }}>
                <span style={sidePanelLabelStyle}>
                  {language === "en" ? "Vocabulary" : "Vocabulario"}
                </span>
                <select
                  value={vocabId}
                  onChange={(e) => onVocabChange?.(e.target.value)}
                  aria-label={language === "en" ? "Vocabulary" : "Vocabulario"}
                  style={sideSelectStyle}
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
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

            <div style={{ display: "grid", gap: 5 }}>
              <span style={sidePanelLabelStyle}>
                {language === "en" ? "Graph type" : "Tipo de grafo"}
              </span>
              <div
                role="group"
                aria-label={language === "en" ? "Graph type" : "Tipo de grafo"}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 5,
                }}
              >
                {LAYOUTS.map((l) => {
                  const active = layoutType === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLayout(l.id)}
                      style={{
                        minHeight: 30,
                        padding: "5px 6px",
                        borderRadius: 6,
                        border: `1px solid ${
                          active ? "rgb(196,95,40)" : "rgb(220,205,185)"
                        }`,
                        background: active ? "rgb(196,95,40)" : "white",
                        color: active ? "white" : "rgb(80,60,40)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 12,
                        fontWeight: active ? 700 : 400,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {language === "en" ? l.en : l.es}
                    </button>
                  )
                })}
              </div>
              <label
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span style={sidePanelLabelStyle}>
                  {language === "en" ? "Color palette" : "Paleta de color"}
                </span>
                <select
                  value={nodePalette}
                  onChange={(e) => setNodePalette(e.target.value)}
                  aria-label={
                    language === "en" ? "Color palette" : "Paleta de color"
                  }
                  style={sideSelectStyle}
                >
                  {NODE_PALETTE_OPTIONS.map((palette) => (
                    <option key={palette.id} value={palette.id}>
                      {language === "en" ? palette.en : palette.es}
                    </option>
                  ))}
                </select>
              </label>
              {(layoutType === "tree-v" || layoutType === "tree-h") && (
                <div style={{ display: "grid", gap: 5 }}>
                  <label style={{ display: "grid", gap: 3 }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "rgb(100,80,60)",
                      }}
                    >
                      <span>
                        {language === "en"
                          ? "Horizontal spacing"
                          : "Separacion horizontal"}
                      </span>
                      <span>{treeSpacingX}</span>
                    </span>
                    <input
                      type="range"
                      min={120}
                      max={320}
                      step={10}
                      value={treeSpacingX}
                      onChange={(e) => setTreeSpacingX(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: "rgb(196,95,40)",
                        cursor: "pointer",
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 3 }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "rgb(100,80,60)",
                      }}
                    >
                      <span>
                        {language === "en"
                          ? "Vertical spacing"
                          : "Separacion vertical"}
                      </span>
                      <span>{treeSpacingY}</span>
                    </span>
                    <input
                      type="range"
                      min={80}
                      max={240}
                      step={10}
                      value={treeSpacingY}
                      onChange={(e) => setTreeSpacingY(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: "rgb(196,95,40)",
                        cursor: "pointer",
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div style={sideCheckboxRowStyle}>
              <span style={sidePanelLabelStyle}>
                {language === "en" ? "Node labels" : "Etiquetas nodos"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={() => setShowLabels((v) => !v)}
                />
                <select
                  value={labelFontSize}
                  onChange={(e) => setLabelFontSize(Number(e.target.value))}
                  style={{
                    ...sideSelectStyle,
                    width: 76,
                  }}
                >
                  {Array.from({ length: 17 }, (_, i) => i + 8).map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(layoutType === "ego" ||
              layoutType === "radial" ||
              (layoutType === "force" && egoFocalId)) && (
              <div style={sideCheckboxRowStyle}>
                <span style={sidePanelLabelStyle}>
                  {language === "en"
                    ? "Relation labels"
                    : "Etiquetas relaciones"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={egoShowEdgeLabels}
                    onChange={() => setEgoShowEdgeLabels((v) => !v)}
                  />
                  <select
                    value={edgeLabelFontSize}
                    onChange={(e) =>
                      setEdgeLabelFontSize(Number(e.target.value))
                    }
                    style={{
                      ...sideSelectStyle,
                      width: 76,
                    }}
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 8).map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(layoutType === "ego" ||
              layoutType === "radial" ||
              (layoutType === "force" && egoFocalId)) && (
              <>
                <div style={{ display: "grid", gap: 5, marginTop: 2 }}>
                  <span style={sidePanelLabelStyle}>
                    {language === "en"
                      ? "Hierarchy depth"
                      : "Nivel profundidad jerarquica"}
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
                  {(layoutType === "ego" || layoutType === "radial") && (
                    <label style={{ display: "grid", gap: 4 }}>
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          fontSize: 11,
                          color: "rgb(100,80,60)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>
                          {language === "en"
                            ? "Ring distance:"
                            : "Distancia anillos:"}
                        </span>
                        <span>{radialSpacing.toFixed(2)}x</span>
                      </span>
                      <input
                        type="range"
                        min={0.55}
                        max={1.8}
                        step={0.05}
                        value={radialSpacing}
                        onChange={(e) =>
                          setRadialSpacing(Number(e.target.value))
                        }
                        style={{
                          width: "100%",
                          accentColor: "rgb(196,95,40)",
                          cursor: "pointer",
                        }}
                      />
                    </label>
                  )}
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <span style={sidePanelLabelStyle}>
                    {language === "en" ? "Show relations" : "Ver relaciones"}
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gap: 2,
                    }}
                  >
                    {EGO_RELATION_DEFS.map((rel) => {
                      const checked = enabledEgoRelations.has(rel.id)
                      const col = EGO_PRED_COLORS[rel.id] || "rgb(120,110,100)"
                      return (
                        <label
                          key={rel.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "2px 0",
                            color: "rgb(65,45,30)",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(enabledEgoRelations)
                              if (checked) next.delete(rel.id)
                              else next.add(rel.id)
                              setEnabledEgoRelations(next)
                            }}
                          />
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: col,
                              flexShrink: 0,
                            }}
                          />
                          {language === "en" ? rel.en : rel.es}
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 2,
                    }}
                  >
                    {EGO_EXTERNAL_RELATION_DEFS.map((rel) => {
                      const checked = enabledExternalRelations.has(rel.id)
                      const col = EGO_PRED_COLORS[rel.id] || "rgb(120,110,100)"
                      return (
                        <label
                          key={rel.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "2px 0",
                            color: "rgb(65,45,30)",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(enabledExternalRelations)
                              if (checked) next.delete(rel.id)
                              else next.add(rel.id)
                              setEnabledExternalRelations(next)
                            }}
                          />
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: col,
                              flexShrink: 0,
                            }}
                          />
                          {language === "en" ? rel.en : rel.es}
                        </label>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleEgoRoot}
                  style={{
                    padding: "6px 13px",
                    borderRadius: "20px",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    border: "1.5px solid rgb(220,205,185)",
                    background: "white",
                    color: "rgb(100,80,60)",
                    cursor: "pointer",
                  }}
                >
                  {language === "en" ? "Back to root" : "Volver a raíz"}
                </button>
                <button
                  onClick={handleEgoReset}
                  style={{
                    padding: "6px 13px",
                    borderRadius: "20px",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    border: "1.5px solid rgb(220,205,185)",
                    background: "white",
                    color: "rgb(100,80,60)",
                    cursor: "pointer",
                  }}
                >
                  {language === "en" ? "Reset positions" : "Reestablecer"}
                </button>
              </>
            )}
          </div>

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
                {(layoutType === "tree-v" || layoutType === "tree-h") && (
                  <defs>
                    <marker
                      id="gm-tree-arr-base"
                      viewBox="0 -4 8 8"
                      refX="7"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M0,-4L8,0L0,4" fill="rgb(170,165,158)" />
                    </marker>
                    <marker
                      id="gm-tree-arr-hi"
                      viewBox="0 -4 8 8"
                      refX="7"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M0,-4L8,0L0,4" fill="rgb(105,100,95)" />
                    </marker>
                  </defs>
                )}
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
                    const sEdge = ellipseEdgePoint(
                      sp,
                      tp,
                      egoNodeDims(nS, labelFontSize)
                    )
                    const tEdge = ellipseEdgePoint(
                      tp,
                      sp,
                      egoNodeDims(nT, labelFontSize),
                      8
                    )
                    const x1 = sEdge.x + ox,
                      y1 = sEdge.y + oy,
                      x2 = tEdge.x + ox,
                      y2 = tEdge.y + oy
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
                            fontSize={edgeLabelFontSize}
                            fontFamily={GRAPH_FONT_FAMILY}
                            fontWeight={GRAPH_FONT_WEIGHT}
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
                    const fill = egoGetNodeFill(
                      n.direction,
                      n.ringDepth,
                      nodePalette
                    )
                    const dims = egoNodeDims(n, labelFontSize)
                    const textStartY =
                      pos.y - ((dims.lines.length - 1) * dims.lineH) / 2
                    return (
                      <g
                        key={n.id}
                        style={{ cursor: isCenter ? "grab" : "pointer" }}
                      >
                        {isCenter && (
                          <ellipse
                            cx={pos.x}
                            cy={pos.y}
                            rx={dims.rx + 10}
                            ry={dims.ry + 10}
                            fill={fill}
                            fillOpacity={0.15}
                          />
                        )}
                        <ellipse
                          cx={pos.x}
                          cy={pos.y}
                          rx={dims.rx}
                          ry={dims.ry}
                          fill={fill}
                          stroke="white"
                          strokeWidth={isCenter ? 2.5 : 1.5}
                        />
                        {showLabels && (
                          <text
                            x={pos.x}
                            y={textStartY}
                            textAnchor="middle"
                            fontSize={labelFontSize}
                            fontFamily={GRAPH_FONT_FAMILY}
                            fontWeight={GRAPH_FONT_WEIGHT}
                            fill="rgb(20,10,0)"
                            dominantBaseline="middle"
                            style={{ pointerEvents: "none" }}
                          >
                            {dims.lines.map((line, idx) => (
                              <tspan
                                key={`${n.id}-${idx}`}
                                x={pos.x}
                                dy={idx === 0 ? 0 : dims.lineH}
                              >
                                {line}
                              </tspan>
                            ))}
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
              bottom: 58,
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
                label: "⟲",
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
                  fontSize: b.label === "⟲" ? 17 : 18,
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
              left: 264,
              right: 14,
              fontSize: 11,
              color: "rgb(175,155,130)",
              pointerEvents: "none",
              lineHeight: 1.6,
              textAlign: "center",
              background: "rgba(255,255,255,0.82)",
              borderRadius: 999,
              padding: "2px 10px",
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
