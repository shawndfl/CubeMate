import * as THREE from 'three';

export function voxelMaterial(map: THREE.Texture, daylight: { value: number }) {
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    map,
    alphaTest: 0.5,
    transparent: false,
    depthWrite: true,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.daylight = daylight;
    shader.vertexShader = 'attribute vec3 voxelLight; varying vec3 vVoxelLight;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvVoxelLight = voxelLight;');
    shader.fragmentShader = 'uniform float daylight; varying vec3 vVoxelLight;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float skyLevel = pow(vVoxelLight.x, 2.0) * mix(0.10, 1.0, daylight);
      float lampLevel = pow(vVoxelLight.y, 2.0);
      vec3 skyTint = mix(vec3(0.65, 0.76, 1.0), vec3(1.0), daylight);
      vec3 illumination = max(vec3(0.025), max(skyLevel * skyTint, lampLevel * vec3(1.0, 0.78, 0.48)));
      outgoingLight *= mix(illumination, vec3(1.25), vVoxelLight.z);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'voxel-light-v1';
  return material;
}
