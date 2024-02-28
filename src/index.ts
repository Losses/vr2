import Plyr from "plyr";

import "./index.css";
import "plyr/dist/plyr.css";

const $fileSelectionScreen = document.querySelector("#input_container")!;
const $loadingScreen = document.querySelector("#file_loading")!;
const $playerScreen = document.querySelector("#main_player")!;

const switchScreen = (x: "fileSelection" | "loading" | "player") => {
  switch (x) {
    case "fileSelection":
      $fileSelectionScreen.classList.remove("hide");
      $loadingScreen.classList.add("hide");
      $playerScreen.classList.add("hide");
      break;
    case "loading":
      $fileSelectionScreen.classList.add("hide");
      $loadingScreen.classList.remove("hide");
      $playerScreen.classList.add("hide");
      break;
    case "player":
      $fileSelectionScreen.classList.add("hide");
      $loadingScreen.classList.add("hide");
      $playerScreen.classList.remove("hide");
      break;
  }
};

switchScreen("fileSelection");

const $video = document.querySelector("#video")! as HTMLVideoElement;
const $fileSelector = document.querySelector(
  "#file_selector"
)! as HTMLInputElement;

const controller = new Plyr("#video", {
  controls: ["play-large", "progress", "current-time"],
  hideControls: false,
});

let fileUrl: string | null = null;

const handleFileChange = () => {
  switchScreen("loading");
  const file = $fileSelector.files?.[0];
  if (!file) return;

  const type = file.type;
  const canPlay = $video.canPlayType(type);

  if (!canPlay) {
    alert("Video format not supported!");
    switchScreen("fileSelection");
  }

  if (fileUrl) {
    URL.revokeObjectURL(fileUrl);
  }

  fileUrl = URL.createObjectURL(file);
  controller.source = {
    type: "video",
    sources: [
      {
        src: fileUrl,
        provider: "html5",
      },
    ],
  };
  $fileSelector.value = "";
  switchScreen("player");
};

$fileSelector.addEventListener("change", handleFileChange, false);

const $canvas = document.querySelector("#stage")! as HTMLCanvasElement;
const ctx = $canvas.getContext("2d")!;

const handleWindowResize = () => {
  $canvas.width = window.innerWidth * window.devicePixelRatio;
  $canvas.height = window.innerHeight * window.devicePixelRatio;
};

handleWindowResize();
window.addEventListener("resize", handleWindowResize);

const localScale = localStorage.getItem("scale");
const localDistance = localStorage.getItem("distance");

let paintMode: string = localStorage.getItem("paintMode") || "contain";
let scale = localScale ? Number.parseFloat(localScale) : 100;
let distance = localDistance ? Number.parseFloat(localDistance) : 0;

const paintFill = () => {
  const paintOffset = window.innerWidth * (distance / 100);
  const scaleConfig = scale / 100;
  // @ts-ignore
  const $video = controller.media;

  const cw = $canvas.width;
  const ch = $canvas.height;

  const py = (ch / 2) * (1 - scaleConfig);

  ctx.drawImage(
    $video,
    (cw / 2) * (1 - scaleConfig) - paintOffset,
    py,
    (cw / 2) * scaleConfig,
    ch * scaleConfig
  );
  ctx.drawImage(
    $video,
    cw / 2 + paintOffset,
    py,
    (cw / 2) * scaleConfig,
    ch * scaleConfig
  );
};

const paintContain = () => {
  const paintOffset = window.innerWidth * (distance / 100);
  const scaleConfig = scale / 100;
  // @ts-ignore
  const $video = controller.media;

  const cw = $canvas.width;
  const ch = $canvas.height;
  const vw = $video.videoWidth;
  const vh = $video.videoHeight;

  let x: number, y: number, pw: number, ph: number;
  if (vw >= vh) {
    const scaleRatio = (cw / vw / 2) * scaleConfig;
    pw = vw * scaleRatio;
    ph = vh * scaleRatio;
  } else {
    const scaleRatio = (ch / vh) * scaleConfig;
    pw = vw * scaleRatio;
    ph = vh * scaleRatio;
  }

  x = cw / 2 - pw;
  y = ch / 2 - ph / 2;

  ctx.drawImage($video, x - paintOffset, y, pw, ph);
  ctx.drawImage($video, cw / 2 + paintOffset, y, pw, ph);
};

const paintCover = () => {
  const scaleConfig = scale / 100;
  const paintOffset = window.innerWidth * (distance / 100);

  // @ts-ignore
  const $video = controller.media;

  const cw = $canvas.width;
  const ch = $canvas.height;
  const vw = $video.videoWidth;
  const vh = $video.videoHeight;

  const paintRatio = cw / 2 / ch;

  let sx: number, sy: number, sw: number, sh: number, px: number, py: number;
  if (vw >= vh) {
    sx = vw - vh * paintRatio;
    sy = 0;
    sw = vh * paintRatio;
    sh = vh;
  } else {
    sx = 0;
    sy = vh - vw / paintRatio;
    sw = vw;
    sh = vh * paintRatio;
  }

  px = (cw / 2) * (1 - scaleConfig);
  py = (ch / 2) * (1 - scaleConfig);

  ctx.drawImage(
    $video,
    sx,
    sy,
    sw,
    sh,
    px - paintOffset,
    py,
    (cw / 2) * scaleConfig,
    ch * scaleConfig
  );
  ctx.drawImage(
    $video,
    sx,
    sy,
    sw,
    sh,
    cw / 2 + paintOffset,
    py,
    (cw / 2) * scaleConfig,
    ch * scaleConfig
  );
};

const paint = () => {
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);

  switch (paintMode) {
    case "contain":
      paintContain();
      break;
    case "cover":
      paintCover();
      break;
    case "fill":
      paintFill();
  }
};

const handleRaf = () => {
  if (!controller.playing) return;

  paint();

  window.requestAnimationFrame(handleRaf);
};

const handleVideoPlay = () => handleRaf();

controller.on("play", handleVideoPlay);
controller.on("ready", () => {
  controller.currentTime = 0;
  setTimeout(() => {
    paint();
  }, 500);
});

const $topBar = document.querySelector("#top_bar")! as HTMLDivElement;

let toggleTimeout = 0;
const handleShowControls = () => {
  controller.toggleControls(true);
  $topBar.classList.remove("hidden");

  window.clearTimeout(toggleTimeout);
  toggleTimeout = window.setTimeout(() => {
    controller.toggleControls(false);
    $topBar.classList.add("hidden");
  }, 3000);
};

window.addEventListener("click", handleShowControls);
window.addEventListener("pointermove", handleShowControls);

const $paintModeSelector = document.querySelector(
  "#scale_mode"
) as HTMLInputElement;
$paintModeSelector.value = paintMode;

const $scale = document.querySelector("#scale") as HTMLInputElement;
const $distance = document.querySelector("#distance") as HTMLInputElement;

$paintModeSelector.addEventListener("change", () => {
  localStorage.setItem("paintMode", $paintModeSelector.value);
  paintMode = $paintModeSelector.value;
  paint();
});

$scale.addEventListener("input", () => {
  localStorage.setItem("scale", $scale.value);
  scale = Number.parseFloat($scale.value);
  paint();
});

$distance.addEventListener("input", () => {
  localStorage.setItem("distance", $distance.value);
  distance = Number.parseFloat($distance.value);
  paint();
});

const $backButton = document.querySelector("#back")!;
$backButton.addEventListener("click", () => {
  controller.pause();
  switchScreen("fileSelection");
});

const $settingsButton = document.querySelector("#settings")!;
$settingsButton.addEventListener("click", () => {
  $topBar.classList.toggle('settings-on');
});

// Service Worker Logic

window.addEventListener("load", (e) => {
  registerSW();
});

async function registerSW() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register(new URL('/sw.js', import.meta.url));
    } catch (e) {
      console.error("Service Worker Registered Failed!\r\n\r\n", e);
    }
  }
}

export default {}