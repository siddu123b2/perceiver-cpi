import { useEffect, useRef } from 'react'

/**
 * The moving background: a DNA double helix that turns as you scroll, with a drifting field of
 * bonded molecule nodes behind it.
 *
 * Written from scratch on a single canvas rather than with a 3D library, because this needs to stay
 * smooth on an integrated GPU while the page is also running a prediction. Everything is 2D maths.
 *
 * Scrolling does two things: it advances the helix (so the strands appear to travel past the
 * viewer) and it shifts the molecule field slightly, which gives a sense of depth without a real
 * camera. Both are eased, so a flick of the wheel does not snap the animation.
 */
export default function Backdrop() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d', { alpha: true })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let molecules = []

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildMolecules()
    }

    // A loose cloud of nodes with a few bonds each - reads as "molecule" without being any real one.
    function buildMolecules() {
      const count = Math.round(Math.min(58, Math.max(22, (width * height) / 26000)))
      molecules = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.35 + Math.random() * 0.65,          // depth: drives size, speed and opacity
        vx: (Math.random() - 0.5) * 0.11,
        vy: (Math.random() - 0.5) * 0.11,
        r: 0.9 + Math.random() * 2.1,
      }))
    }

    // Scroll progress, eased so the motion never snaps.
    let targetScroll = 0
    let scroll = 0
    function onScroll() {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      targetScroll = window.scrollY / max
    }

    const HELIX_TURNS = 3.1
    const STRAND_GAP = Math.PI                    // the two strands sit half a turn apart

    function drawHelix(time) {
      // The helix runs down the right on wide screens and straight down the middle on narrow ones.
      const axis = width > 900 ? width * 0.78 : width * 0.5
      const amplitude = Math.min(width * 0.1, 128)
      const steps = 150
      const phase = time * 0.00016 + scroll * HELIX_TURNS * Math.PI * 2
      const points = [[], []]

      for (let strand = 0; strand < 2; strand += 1) {
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps
          const angle = t * HELIX_TURNS * Math.PI * 2 - phase + strand * STRAND_GAP
          points[strand].push({
            x: axis + Math.sin(angle) * amplitude,
            y: t * height,
            // depth from the cosine: a strand at the back is dimmer and thinner
            depth: (Math.cos(angle) + 1) / 2,
          })
        }
      }

      // rungs between the strands, drawn first so they sit behind
      for (let i = 0; i <= steps; i += 5) {
        const a = points[0][i]
        const b = points[1][i]
        const depth = (a.depth + b.depth) / 2
        ctx.strokeStyle = `rgba(139, 123, 240, ${0.05 + depth * 0.17})`
        ctx.lineWidth = 0.6 + depth * 0.9
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      // the two sugar-phosphate backbones, segment by segment so depth can vary along them
      for (let strand = 0; strand < 2; strand += 1) {
        const colour = strand === 0 ? '233, 195, 123' : '79, 209, 197'
        for (let i = 0; i < steps; i += 1) {
          const a = points[strand][i]
          const b = points[strand][i + 1]
          ctx.strokeStyle = `rgba(${colour}, ${0.05 + a.depth * 0.3})`
          ctx.lineWidth = 0.7 + a.depth * 1.9
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        // bases, only on the near side so the helix reads as 3D
        for (let i = 0; i <= steps; i += 5) {
          const p = points[strand][i]
          if (p.depth < 0.55) continue
          ctx.fillStyle = `rgba(${colour}, ${(p.depth - 0.55) * 0.5})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1 + p.depth * 1.7, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    function drawMolecules() {
      const drift = scroll * 90
      for (let i = 0; i < molecules.length; i += 1) {
        const m = molecules[i]
        for (let j = i + 1; j < molecules.length; j += 1) {
          const n = molecules[j]
          const dx = m.x - n.x
          const dy = (m.y - n.y)
          const d2 = dx * dx + dy * dy
          if (d2 > 20000) continue
          const strength = (1 - Math.sqrt(d2) / 141) * 0.16 * Math.min(m.z, n.z)
          ctx.strokeStyle = `rgba(150, 170, 255, ${strength})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(m.x, m.y - drift * m.z)
          ctx.lineTo(n.x, n.y - drift * n.z)
          ctx.stroke()
        }
      }
      for (const m of molecules) {
        const y = m.y - drift * m.z
        ctx.fillStyle = `rgba(190, 205, 255, ${0.1 + m.z * 0.3})`
        ctx.beginPath()
        ctx.arc(m.x, y, m.r * m.z, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function step(time) {
      scroll += (targetScroll - scroll) * 0.055        // ease toward the real scroll position
      ctx.clearRect(0, 0, width, height)

      for (const m of molecules) {
        m.x += m.vx * m.z
        m.y += m.vy * m.z
        // wrap, with a margin so nodes never pop in at the edge
        if (m.x < -60) m.x = width + 60
        if (m.x > width + 60) m.x = -60
        if (m.y < -60) m.y = height + 60
        if (m.y > height + 60) m.y = -60
      }

      drawMolecules()
      drawHelix(time)
      frame = requestAnimationFrame(step)
    }

    // One static frame when the viewer asked for reduced motion.
    function drawOnce() {
      ctx.clearRect(0, 0, width, height)
      drawMolecules()
      drawHelix(0)
    }

    let frame = 0
    resize()
    onScroll()
    scroll = targetScroll
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })

    if (reduced) {
      drawOnce()
    } else {
      frame = requestAnimationFrame(step)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return <canvas id="backdrop" ref={ref} aria-hidden="true" />
}
