import * as THREE from 'three'
import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'
import { ZERO_OUTPUT } from '../types'

function makeSpriteTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0,    'rgba(210,190,255,1)')
  g.addColorStop(0.35, 'rgba(140,100,255,0.75)')
  g.addColorStop(1,    'rgba(80,60,200,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export const explodePreset: AnimationPreset = {
  id: 'explode',

  init(target, _params) {
    if (!target.mainMesh) return
    const geo     = target.mainMesh.geometry as THREE.BufferGeometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const stride  = Math.max(1, Math.floor(posAttr.count / 512))
    const count   = Math.floor(posAttr.count / stride)

    const orig: Float32Array = new Float32Array(count * 3)
    const vels: Array<{ x: number; y: number; z: number }> = []

    for (let i = 0; i < count; i++) {
      const vi = i * stride
      const x = posAttr.getX(vi), y = posAttr.getY(vi), z = posAttr.getZ(vi)
      orig[i * 3] = x; orig[i * 3 + 1] = y; orig[i * 3 + 2] = z
      const len = Math.sqrt(x * x + y * y + z * z) || 1
      vels.push({
        x: x / len + (Math.random() - 0.5) * 0.8,
        y: y / len + (Math.random() - 0.5) * 0.8 + 0.15,
        z: Math.random() * 1.0 + 0.1,
      })
    }

    const ptsGeo = new THREE.BufferGeometry()
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(orig.slice(), 3))

    const ptsMat = new THREE.PointsMaterial({
      size:        0.055,
      map:         makeSpriteTex(),
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      color:       0x9880FF,
    })

    const points = new THREE.Points(ptsGeo, ptsMat)
    target.mainMesh.visible = false
    target.meshGroup.add(points)

    const ud = target.mainMesh.userData
    ud._explodePoints = points
    ud._explodeVels   = vels
    ud._explodeOrig   = orig
    ud._explodeProg   = 0
    ud._explodeDir    = 1
  },

  update(target, params, delta): AnimationOutput {
    if (!target.mainMesh) return ZERO_OUTPUT
    const ud     = target.mainMesh.userData
    const points = ud._explodePoints as THREE.Points | undefined
    if (!points) return ZERO_OUTPUT

    let prog = (ud._explodeProg as number) ?? 0
    let dir  = (ud._explodeDir  as number) ?? 1

    prog += delta * 0.5 * dir * params.explode.force
    if (prog >= 1) { prog = 1; dir = -1 }
    else if (prog <= 0) { prog = 0; dir = 1 }
    ud._explodeProg = prog
    ud._explodeDir  = dir

    // Cubic ease in-out
    const eased = prog < 0.5
      ? 4 * prog * prog * prog
      : 1 - Math.pow(-2 * prog + 2, 3) / 2

    const force = params.explode.spread
    const orig  = ud._explodeOrig as Float32Array
    const vels  = ud._explodeVels as Array<{ x: number; y: number; z: number }>
    const posA  = points.geometry.attributes.position as THREE.BufferAttribute

    for (let i = 0; i < vels.length; i++) {
      const v = vels[i]
      posA.setXYZ(i,
        orig[i * 3]     + v.x * force * eased,
        orig[i * 3 + 1] + v.y * force * eased,
        orig[i * 3 + 2] + v.z * force * eased,
      )
    }
    posA.needsUpdate = true
    ;(points.material as THREE.PointsMaterial).opacity = 0.4 + eased * 0.6

    return ZERO_OUTPUT
  },

  cleanup(target) {
    if (!target.mainMesh) return
    const ud     = target.mainMesh.userData
    const points = ud._explodePoints as THREE.Points | undefined
    if (points) {
      target.meshGroup.remove(points)
      ;(points.material as THREE.PointsMaterial).map?.dispose()
      ;(points.material as THREE.Material).dispose()
      points.geometry.dispose()
    }
    if (target.mainMesh) target.mainMesh.visible = true
    delete ud._explodePoints; delete ud._explodeVels
    delete ud._explodeOrig;   delete ud._explodeProg; delete ud._explodeDir
  },
}
