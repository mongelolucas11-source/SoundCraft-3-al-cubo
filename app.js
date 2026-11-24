const sounds = [
  { id: 1, name: "La playa", category: "ambiente", duration: "04:32", colors: ["#355c78", "#7b9ba2"] },
  { id: 2, name: "Lofi Night", category: "musica", duration: "02:48", colors: ["#55427d", "#b16870"] },
  { id: 3, name: "Aplausos", category: "efectos", duration: "00:18", colors: ["#8b493c", "#d98b58"] },
  { id: 4, name: "Bosque", category: "ambiente", duration: "06:12", colors: ["#3e6053", "#7b9273"] },
  { id: 5, name: "Deep Focus", category: "musica", duration: "08:25", colors: ["#394b77", "#6d78b5"] },
  { id: 6, name: "Puerta", category: "efectos", duration: "00:06", colors: ["#79514d", "#ad7467"] }
];

let activeCategory = "todos";
let activeSoundId = null;
let audioContext = null;
let activeNodes = [];

const grid = document.getElementById("soundGrid");
const dialog = document.getElementById("soundDialog");
const toast = document.getElementById("toast");

function visualBars() {
  const heights = [24, 48, 34, 62, 42, 70, 38, 54, 28, 44];
  return `<span class="visual-bars">${heights.map((h, i) =>
    `<i style="--h:${h}px;--d:${i * 60}ms"></i>`
  ).join("")}</span>`;
}

function categoryLabel(category) {
  return { ambiente: "Ambiente", musica: "Música", efectos: "Efecto" }[category];
}

function render() {
  const visible = activeCategory === "todos"
    ? sounds
    : sounds.filter(sound => sound.category === activeCategory);

  grid.innerHTML = visible.map(sound => `
    <article class="sound-card ${activeSoundId === sound.id ? "playing" : ""}" data-id="${sound.id}">
      <div class="card-art" style="--art-a:${sound.colors[0]};--art-b:${sound.colors[1]}">
        ${visualBars()}
      </div>
      <div class="card-content">
        <div class="card-title">
          <strong>${escapeHtml(sound.name)}</strong>
          <span>${categoryLabel(sound.category)} · ${sound.duration}</span>
        </div>
        <button class="play-button" aria-label="${activeSoundId === sound.id ? "Detener" : "Reproducir"} ${escapeHtml(sound.name)}">
          ${activeSoundId === sound.id
            ? '<svg viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="12" rx="1"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'}
        </button>
      </div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}

function stopAudio() {
  activeNodes.forEach(node => {
    try { node.stop(); } catch (_) {}
  });
  activeNodes = [];
  activeSoundId = null;
  render();
}

function playAudio(sound) {
  if (activeSoundId === sound.id) {
    stopAudio();
    return;
  }
  stopAudio();
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  oscillator.type = sound.category === "musica" ? "triangle" : "sine";
  oscillator.frequency.value = sound.category === "ambiente" ? 110 : sound.category === "efectos" ? 220 : 165;
  filter.type = "lowpass";
  filter.frequency.value = 900;
  gain.gain.value = 0.025;
  oscillator.connect(filter).connect(gain).connect(audioContext.destination);
  oscillator.start();
  activeNodes = [oscillator];
  activeSoundId = sound.id;
  render();
  showToast(`Reproduciendo ${sound.name}`);
}

grid.addEventListener("click", event => {
  const card = event.target.closest(".sound-card");
  if (!card) return;
  const sound = sounds.find(item => item.id === Number(card.dataset.id));
  playAudio(sound);
});

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(".category.active")?.classList.remove("active");
    button.classList.add("active");
    activeCategory = button.dataset.category;
    render();
  });
});

document.querySelectorAll(".nav-item:not(.add-button)").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(".nav-item.active")?.classList.remove("active");
    button.classList.add("active");
  });
});

document.getElementById("addButton").addEventListener("click", () => dialog.showModal());
document.getElementById("searchButton").addEventListener("click", () => showToast("Buscador listo"));
document.getElementById("menuButton").addEventListener("click", () => showToast("Consola de Soundcraft"));

document.getElementById("saveSound").addEventListener("click", event => {
  event.preventDefault();
  const nameInput = document.getElementById("soundName");
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    showToast("Escribe un nombre");
    return;
  }
  const category = document.getElementById("soundCategory").value;
  sounds.unshift({
    id: Date.now(),
    name,
    category,
    duration: "00:30",
    colors: category === "ambiente"
      ? ["#3d6670", "#78a08d"]
      : category === "musica"
        ? ["#514b82", "#8a77ad"]
        : ["#75505e", "#b77c65"]
  });
  nameInput.value = "";
  dialog.close();
  activeCategory = "todos";
  document.querySelector(".category.active")?.classList.remove("active");
  document.querySelector('[data-category="todos"]').classList.add("active");
  render();
  showToast(`${name} añadido`);
});

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

render();
