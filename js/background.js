// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader';

const loader = new GLTFLoader();
const scene = new THREE.Scene();
// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
// Load Light
var ambientLight = new THREE.DirectionalLight(0xeeeeee);
ambientLight.intensity = 1;
scene.add(ambientLight);
var directionalLight = new THREE.DirectionalLight(0xffffff );
directionalLight.position.set(-3, 3, 3).normalize();
directionalLight.castShadow = true;
directionalLight.intensity = 1;

scene.add(directionalLight);

//const material = new THREE.LineBasicMaterial({
//    color: 0xffffff,
//    linewidth: 1,
//    linecap: 'round', //ignored by WebGLRenderer
//    linejoin: 'round' //ignored by WebGLRenderer
//});
loader.load('/3d/desk.glb', function (gltf) {
    gltf.scene.children.forEach(x => x.castShadow = true);
    gltf.scene.children.forEach(x => x.receiveShadow = true);

    gltf.scene.receiveShadow = true;
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

camera.position.x = 0;
camera.position.y = 1;
camera.position.z = -1;

function animate() {
    requestAnimationFrame(animate);

    camera.position.y = 1 - $('#scroll-container')[0].scrollTop / 2500;
    renderer.render(scene, camera);
};

animate();
