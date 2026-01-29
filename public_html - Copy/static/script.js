document.querySelectorAll('.play-btn').forEach(button => {
  button.addEventListener('click', e => {
    const card = e.target.closest('.card');
    const title = card.getAttribute('data-title');
    const artist = card.getAttribute('data-artist');

    document.getElementById('nowPlayingBtn').textContent = `LIVE: ${title} – ${artist}`;
  });
});


const livePill = document.getElementById("livePill");
const audio = document.getElementById("liveAudio");
const pillIcon = document.getElementById("pillIcon");

let isPlaying = false;

livePill.addEventListener("click", () => {
  if (isPlaying) {
    audio.pause();
    pillIcon.innerHTML = `<polygon points="6,4 20,12 6,20" />`; // ▶️
  } else {
    audio.play();
    pillIcon.innerHTML = `
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    `; // ⏸️
  }
  isPlaying = !isPlaying;
});

