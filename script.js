// Ganti dengan URL Web App dari Google Apps Script Anda
const GOOGLE_SCRIPT_URL = "MASUKKAN_URL_WEB_APP_GOOGLE_SCRIPT_ANDA_DI_SINI";

let scene, camera, renderer, player, gems = [];
let score = 0, timeLeft = 30, timerInterval;
let isPlaying = false;
let username = "", noHp = "";

let moveInput = { x: 0, y: 0 };
const keys = {};

// Inisialisasi Arena 3D (Three.js)
function initScene() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);
  scene.fog = new THREE.FogExp2(0x0b0f19, 0.03);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 12, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Pencahayaan
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Lantai Arena
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid Dekoratif
  const grid = new THREE.GridHelper(40, 20, 0x38bdf8, 0x334155);
  grid.position.y = 0.01;
  scene.add(grid);

  // Bola Pemain
  const playerGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.5 });
  player = new THREE.Mesh(playerGeo, playerMat);
  player.position.y = 0.8;
  player.castShadow = true;
  scene.add(player);

  // Spawning Gem Merah
  for (let i = 0; i < 10; i++) spawnGem();

  window.addEventListener('resize', onWindowResize);
  setupKeyboard();
  setupJoystick();
  animate();
}

function spawnGem() {
  const geo = new THREE.OctahedronGeometry(0.6);
  const mat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.5 });
  const gem = new THREE.Mesh(geo, mat);
  
  gem.position.x = (Math.random() - 0.5) * 32;
  gem.position.z = (Math.random() - 0.5) * 32;
  gem.position.y = 0.8;
  gem.castShadow = true;

  scene.add(gem);
  gems.push(gem);
}

function startGame() {
  username = document.getElementById('username').value.trim();
  noHp = document.getElementById('noHp').value.trim();

  if (!username || !noHp) {
    alert("Harap isi Nama dan Nomor HP terlebih dahulu!");
    return;
  }

  document.getElementById('start-menu').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('joystick-zone').style.display = 'block';

  score = 0;
  timeLeft = 30;
  isPlaying = true;
  document.getElementById('score-text').innerText = score;
  document.getElementById('timer-text').innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer-text').innerText = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  isPlaying = false;
  clearInterval(timerInterval);

  document.getElementById('hud').style.display = 'none';
  document.getElementById('joystick-zone').style.display = 'none';
  document.getElementById('game-over-menu').style.display = 'block';
  document.getElementById('final-score').innerText = score;

  sendDataToGoogleSheets();
}

function restartGame() {
  document.getElementById('game-over-menu').style.display = 'none';
  player.position.set(0, 0.8, 0);
  startGame();
}

// Kontrol Keyboard (Desktop)
function setupKeyboard() {
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
}

// Kontrol Analog / Touch Joystick (Mobile)
function setupJoystick() {
  const zone = document.getElementById('joystick-zone');
  const handle = document.getElementById('joystick-handle');
  let active = false;
  let startX, startY;

  const handleStart = (e) => {
    active = true;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
  };

  const handleMove = (e) => {
    if (!active) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const dist = Math.min(Math.hypot(dx, dy), 40);
    const angle = Math.atan2(dy, dx);

    const handleX = Math.cos(angle) * dist;
    const handleY = Math.sin(angle) * dist;

    handle.style.transform = `translate(${handleX}px, ${handleY}px)`;
    moveInput.x = handleX / 40;
    moveInput.y = handleY / 40;
  };

  const handleEnd = () => {
    active = false;
    handle.style.transform = `translate(0px, 0px)`;
    moveInput = { x: 0, y: 0 };
  };

  zone.addEventListener('touchstart', handleStart);
  window.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  if (isPlaying) {
    let dirX = moveInput.x;
    let dirZ = moveInput.y;

    if (keys['w'] || keys['arrowup']) dirZ = -1;
    if (keys['s'] || keys['arrowdown']) dirZ = 1;
    if (keys['a'] || keys['arrowleft']) dirX = -1;
    if (keys['d'] || keys['arrowright']) dirX = 1;

    const speed = 0.25;
    player.position.x += dirX * speed;
    player.position.z += dirZ * speed;

    player.position.x = Math.max(-19, Math.min(19, player.position.x));
    player.position.z = Math.max(-19, Math.min(19, player.position.z));

    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 15;

    gems.forEach((gem, index) => {
      gem.rotation.y += 0.03;
      gem.rotation.x += 0.01;

      if (player.position.distanceTo(gem.position) < 1.4) {
        scene.remove(gem);
        gems.splice(index, 1);
        score += 10;
        document.getElementById('score-text').innerText = score;
        spawnGem();
      }
    });
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Integrasi Google Sheets
function sendDataToGoogleSheets() {
  const statusText = document.getElementById('status-upload');
  statusText.innerText = "Menyimpan skor ke database...";

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, noHp: noHp, score: score })
  })
  .then(() => {
    statusText.innerText = "Skor berhasil disimpan!";
    fetchLeaderboard();
  })
  .catch(err => {
    statusText.innerText = "Gagal menyimpan skor.";
    console.error(err);
  });
}

function fetchLeaderboard() {
  fetch(GOOGLE_SCRIPT_URL)
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('leaderboard-body');
      tbody.innerHTML = "";
      data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${index + 1}</td><td>${row[0]}</td><td>${row[2]}</td>`;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error("Gagal memuat leaderboard:", err));
}

window.onload = initScene;

