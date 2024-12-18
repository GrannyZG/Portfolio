import * as THREE from '../node_modules/three/build/three.module.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';


// Osnovna scena, kamera i renderer
const scene = new THREE.Scene();

const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;

const context = canvas.getContext('2d');

// Dodaj gradijent
const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
gradient.addColorStop(0, '#75c8ff'); // Gornja boja
gradient.addColorStop(1, '#9fffd7'); // Donja boja

context.fillStyle = gradient;
context.fillRect(0, 0, canvas.width, canvas.height);

// Postavi CanvasTexture kao pozadinu scene
const gradientTexture = new THREE.CanvasTexture(canvas);
scene.background = gradientTexture;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls za kontrolu kocke
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false; // Onemogući desni klik za pomicanje scene

// Učitavanje teksture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/textures/wood.jpg');

function createTexturedText(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512; canvas.height = 512;

  // Nacrtaj pozadinsku sliku
  if (texture.image) {
      context.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
  } else {
      context.fillStyle = '#dcdcdc'; // Ako slika nije još učitana, koristi sivo
      context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Dodaj prozirni sloj za bolju čitljivost teksta
  context.fillStyle = 'rgb(207, 207, 161)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Nacrtaj tekst
  context.font = 'bold 60px Arial';
  context.fillStyle = '#333333'; // Tamno siva boja
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Dodaj crni border
  context.strokeStyle = '#0f59a8';
  context.lineWidth = 2;
  context.strokeRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

// Kreiramo materijale s tekstom za svaku stranu kocke
const materials = [
  new THREE.MeshBasicMaterial({ map: createTexturedText('Personal Info') }), // Prednja
  new THREE.MeshBasicMaterial({ map: createTexturedText('Education') }),     // Desna
  new THREE.MeshBasicMaterial({ map: createTexturedText('Skills') }),        // Stražnja
  new THREE.MeshBasicMaterial({ map: createTexturedText('Projects') }),      // Lijeva
  new THREE.MeshBasicMaterial({ map: createTexturedText('Experience') }),    // Gornja
  new THREE.MeshBasicMaterial({ map: createTexturedText('Contact') })        // Donja
];

const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position; // Proslijedi poziciju verteksa u fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vPosition;
  void main() {
    // Mapiraj vPosition.y na opseg [0.0, 1.0] za glatki gradijent
    float gradient = (vPosition.y + 0.5) / 1.0;
    vec3 color1 = vec3(0.46, 0.78, 1.0); // #75c8ff
    vec3 color2 = vec3(0.65, 0.62, 1.0); // #a59fff
    gl_FragColor = vec4(mix(color1, color2, gradient), 1.0);
  }
`;

// ShaderMaterial konfiguracija
const gradientMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.DoubleSide // Omogućuje prikaz gradijenta na svim stranama
});

// Kocka s teksturom
const geometry = new THREE.BoxGeometry();
const cube = new THREE.Mesh(geometry, materials);
scene.add(cube);

cube.rotation.set(0, Math.PI*1.5, 0);

// Funkcija za detekciju strane kocke
function detectSide() {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    const faceNormals = {
        'Personal Info': new THREE.Vector3(0, 0, -1),  // Prednja strana
        'Education': new THREE.Vector3(0, 0, 1),      // Desna strana
        'Skills': new THREE.Vector3(0, -1, 0),        // Stražnja strana
        'Projects': new THREE.Vector3(0, 1, 0),       // Lijeva strana
        'Experience': new THREE.Vector3(1, 0, 0),    // Gornja strana
        'Contact': new THREE.Vector3(-1, 0, 0),        // Donja strana
    };

    let detectedSide = 'Unknown';
    let maxDot = -Infinity;

    for (const [side, normal] of Object.entries(faceNormals)) {
        const dotProduct = cameraDirection.dot(normal);
        if (dotProduct > maxDot) {
            maxDot = dotProduct;
            detectedSide = side;
        }
    }

    return maxDot > 0.5 ? detectedSide : 'Unknown';
}

// Funkcija za otvaranje modala iz HTML-a
function openModal(detectedSide) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = 'none'); // Zatvori sve modale

    const modal = document.getElementById(`${detectedSide.replace(/\s+/g, '-')}-modal`);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Animacija
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Dinamični gumb
const button = document.createElement('button');
button.innerText = 'Open';
button.style.position = 'absolute';
button.style.top = 'calc(50% + 200px)'; // Pomakni gumb ispod kocke
button.style.left = '50%';
button.style.transform = 'translate(-50%, -50%)';
button.style.padding = '10px 20px';
button.style.fontSize = '16px';
button.style.border = 'none';
button.style.background = 'linear-gradient(to bottom,rgb(34, 47, 235), #005bbb)';
button.style.color = 'white';
button.style.borderRadius = '5px';
button.style.cursor = 'pointer';
document.body.appendChild(button);

button.addEventListener('click', () => {
    const detectedSide = detectSide();
    openModal(detectedSide);
});
