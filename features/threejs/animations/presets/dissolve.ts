import * as THREE from 'three'
import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'
import { ZERO_OUTPUT } from '../types'

// Noise helpers + dissolve logic prepended to the fragment shader
const FRAG_PREPEND = `
uniform float uDissolve;
uniform float uEdgeGlow;
float _dh(vec2 p){p=fract(p*vec2(234.34,435.35));p+=dot(p,p+34.23);return fract(p.x*p.y);}
float _dn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(_dh(i),_dh(i+vec2(1,0)),f.x),mix(_dh(i+vec2(0,1)),_dh(i+vec2(1,1)),f.x),f.y);}
float _dfbm(vec2 uv){return .5*_dn(uv*3.)+.25*_dn(uv*7.)+.125*_dn(uv*13.)+.0625*_dn(uv*26.);}
`

// Replaces #include <alphatest_fragment> — re-inserts it then adds dissolve discard + edge glow
const INJECT = `
#include <alphatest_fragment>
{
  float dv=_dfbm(vUv);
  if(dv<uDissolve)discard;
  float de=1.-smoothstep(uDissolve,uDissolve+max(.001,.1*uEdgeGlow),dv);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.45,.05)*1.6,de*.9);
}
`

function injectDissolve(mat: THREE.Material): Record<string, { value: number }> {
  const uniforms: Record<string, { value: number }> = {
    uDissolve: { value: 0 },
    uEdgeGlow: { value: 0.6 },
  }
  const m = mat as THREE.MeshPhysicalMaterial
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = FRAG_PREPEND + shader.fragmentShader.replace(
      '#include <alphatest_fragment>',
      INJECT
    )
  }
  m.needsUpdate = true
  m.userData.dissolveUniforms = uniforms
  return uniforms
}

export const dissolvePreset: AnimationPreset = {
  id: 'dissolve',

  init(target, _params) {
    if (!target.mainMesh) return
    const mats = (Array.isArray(target.mainMesh.material)
      ? target.mainMesh.material
      : [target.mainMesh.material]) as THREE.Material[]

    target.mainMesh.userData._dissolveOrig = mats.slice()

    const clones = mats.map(m => {
      const clone = (m as THREE.MeshPhysicalMaterial).clone()
      injectDissolve(clone)
      return clone
    })

    target.mainMesh.material = clones.length === 1 ? clones[0] : clones
  },

  update(target, params, _delta, time): AnimationOutput {
    if (!target.mainMesh) return ZERO_OUTPUT
    const { amount, edgeGlow, speed, looping } = params.dissolve
    const val = looping
      ? (Math.sin(time * speed * Math.PI) * 0.5 + 0.5) * 0.92
      : Math.max(0, Math.min(1, amount))

    const mats = (Array.isArray(target.mainMesh.material)
      ? target.mainMesh.material
      : [target.mainMesh.material]) as THREE.Material[]

    for (const m of mats) {
      const u = m.userData.dissolveUniforms as Record<string, { value: number }> | undefined
      if (!u) continue
      u.uDissolve.value = val
      u.uEdgeGlow.value = edgeGlow
    }
    return ZERO_OUTPUT
  },

  cleanup(target) {
    if (!target.mainMesh) return
    const orig = target.mainMesh.userData._dissolveOrig as THREE.Material[] | undefined
    if (!orig) return

    const current = (Array.isArray(target.mainMesh.material)
      ? target.mainMesh.material
      : [target.mainMesh.material]) as THREE.Material[]
    current.forEach(m => m.dispose())

    target.mainMesh.material = orig.length === 1 ? orig[0] : orig
    delete target.mainMesh.userData._dissolveOrig
  },
}
