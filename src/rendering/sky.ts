import * as THREE from 'three';
import { daylight } from '../world/day-cycle.ts';

export class Sky {
  readonly scene = new THREE.Scene();
  readonly ambient = new THREE.HemisphereLight(0xf3fbff, 0x617450, 2);
  readonly sunLight = new THREE.DirectionalLight(0xffedcf, 2.1);
  readonly moonLight = new THREE.DirectionalLight(0x9bbcff, 0.3);
  private sun = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0xffefad, fog: false }));
  private moon = new THREE.Group();
  private color = new THREE.Color();
  private night = new THREE.Color('#101c38');
  private day = new THREE.Color('#b8d8de');
  private dusk = new THREE.Color('#db997d');

  constructor(worldScene: THREE.Scene) {
    const moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ color: 0xdce6f6, fog: false }));
    this.moon.add(moonDisc);
    const craterMaterial = new THREE.MeshBasicMaterial({ color: 0x9daecc, fog: false });
    for (const [x, y, size] of [[-1.5, 1.5, 1.5], [1, -1, 2], [-2, -1.5, 0.8]]) {
      const crater = new THREE.Mesh(new THREE.PlaneGeometry(size, size), craterMaterial);
      crater.position.set(x, y, 0.01);
      this.moon.add(crater);
    }
    this.scene.add(this.sun, this.moon);
    this.scene.background = this.color;
    worldScene.add(this.ambient, this.sunLight, this.sunLight.target, this.moonLight, this.moonLight.target);
  }

  update(time: number, camera: THREE.Camera, fog: THREE.Fog) {
    const { x, y, brightness, twilight } = daylight(time);
    this.color.copy(this.night).lerp(this.day, brightness).lerp(this.dusk, twilight * 0.65);
    fog.color.copy(this.color);
    // Follow the camera so the sky stays distant even during unrestricted flight.
    this.sun.position.copy(camera.position).add(new THREE.Vector3(x * 100, y * 100, 0));
    this.moon.position.copy(camera.position).add(new THREE.Vector3(-x * 100, -y * 100, 0));
    this.sun.lookAt(camera.position);
    this.moon.lookAt(camera.position);
    this.sun.visible = y > -0.08;
    this.moon.visible = y < 0.08;
    this.sunLight.position.copy(this.sun.position);
    this.moonLight.position.copy(this.moon.position);
    this.sunLight.target.position.copy(camera.position);
    this.moonLight.target.position.copy(camera.position);
    this.sunLight.intensity = 2.1 * Math.max(0, y);
    this.sunLight.color.set(0xffedcf).lerp(new THREE.Color(0xffa56b), twilight);
    this.moonLight.intensity = 0.35 * Math.max(0, -y);
    this.ambient.intensity = 0.3 + brightness * 1.7;
    this.ambient.color.set(0x7089bd).lerp(new THREE.Color(0xf3fbff), brightness);
    this.ambient.groundColor.set(0x28334b).lerp(new THREE.Color(0x617450), brightness);
  }
}
