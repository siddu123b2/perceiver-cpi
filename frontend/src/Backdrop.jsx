import { useEffect, useRef } from 'react'

/**
 * Background: a slowly rotating molecular skeleton — rings and branches, the shape of a small
 * drug molecule — projected from 3D to 2D by hand.
 *
 * Deliberately quiet. It sits at 50% opacity behind the interface and turns slowly; scrolling
 * nudges the rotation rather than driving it, so the page never feels like it is sliding around.
 * Plain canvas maths, no 3D library, so it costs almost nothing while a prediction is running.
 */

// A fused two-ring scaffold with a few substituents: roughly the shape of a kinase inhibitor.
// [x, y, z] in arbitrary units, then the bonds between them.
function buildMolecule() {
  const atoms = []
  const bonds = []

  const ring = (cx, cy, cz, radius, tilt, start) => {
    const first = atoms.length
    for (let i = 0; i < 6; i += 1) {
      const a = start + (i / 6) * Math.PI * 2
      atoms.push([
        cx + Math.cos(a) * radius,
        cy + Math.sin(a) * radius * Math.cos(tilt),
        cz + Math.sin(a) * radius * Math.sin(tilt),
      ])
      bonds.push([first + i, first + ((i + 1) % 6)])
    }
    return first
  }

  const a = ring(-0.55, 0, 0, 0.5, 0.25, 0)
  const b = ring(0.42, 0.12, 0.1, 0.5, -0.3, 0.4)
  bonds.push([a + 1, b + 4])                       // link the two rings

  // substituents hanging off the rings
  const branch = (from, dx, dy, dz, steps) => {
    let previous = from
    for (let i = 1; i <= steps; i += 1) {
      atoms.push([atoms[from][0] + dx * i, atoms[from][1] + dy * i, atoms[from][2] + dz * i])
      bonds.push([previous, atoms.length - 1])
      previous = atoms.length - 1
    }
  }
  branch(a + 3, -0.42, -0.3, 0.12, 2)
  branch(b + 1, 0.38, 0.36, -0.16, 2)
  branch(b + 2, 0.3, -0.42, 0.2, 1)
  branch(a + 5, -0.16, 0.44, -0.24, 1)

  return { atoms, bonds }
}

export default function Backdrop() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { atoms, bonds } = buildMolecule()

    let width = 0
    let height = 0
    let scale = 1

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scale = Math.min(width, height) * 0.3
    }

    let scrollNudge = 0
    let target = 0
    function onScroll() {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      target = (window.scrollY / max) * Math.PI * 1.1   // a little over half a turn, top to bottom
    }

    function project(point, yaw, pitch) {
      const [x, y, z] = point
      // rotate about Y, then X
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw)
      const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw)
      const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch)
      const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch)
      const depth = 1 / (2.6 - z2 * 0.42)              // weak perspective
      return { x: x1 * depth * scale, y: y1 * depth * scale, d: (z2 + 1.4) / 2.8 }
    }

    function frame(time) {
      const spin = reduced ? 0.6 : time * 0.000085
      scrollNudge += (target - scrollNudge) * 0.05
      const yaw = spin + scrollNudge
      const pitch = 0.42 + Math.sin(spin * 0.7) * 0.12

      ctx.clearRect(0, 0, width, height)
      // off to the right on wide screens so it never fights the text
      const cx = width > 1000 ? width * 0.76 : width * 0.5
      const cy = height * 0.46
      ctx.save()
      ctx.translate(cx, cy)

      const points = atoms.map((p) => project(p, yaw, pitch))

      for (const [i, j] of bonds) {
        const p = points[i]
        const q = points[j]
        const d = (p.d + q.d) / 2
        ctx.strokeStyle = `rgba(110, 150, 220, ${0.05 + d * 0.16})`
        ctx.lineWidth = 0.6 + d * 1.5
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(q.x, q.y)
        ctx.stroke()
      }

      for (const p of points) {
        ctx.fillStyle = `rgba(140, 190, 240, ${0.07 + p.d * 0.2})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.1 + p.d * 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
      if (!reduced) handle = requestAnimationFrame(frame)
    }

    let handle = 0
    resize()
    onScroll()
    scrollNudge = target
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    handle = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(handle)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return <canvas id="bg-canvas" ref={ref} aria-hidden="true" />
}
