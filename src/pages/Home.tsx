import * as React from "react";
import cn from "classnames";
import Plyr, { APITypes, PlyrOptions, PlyrSource } from "plyr-react";

import { paint } from '../utils/paint';

import "./Home.css";
import "plyr/dist/plyr.css";


type Screen = "fileSelection" | "loading" | "player";

type PlyrConfigurationProps = {
  source: PlyrSource | null;
  options?: PlyrOptions | null;
};

const DEFAULT_OPTIONS: PlyrConfigurationProps = {
  options: {
    controls: ["play-large", "progress", "current-time"],
    hideControls: false,
  },
  source: null,
};

const Home: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D>();
  const controllerRef = React.useRef<APITypes>(null);
  const [plyrOptions, setPlyrOptions] = React.useState(DEFAULT_OPTIONS);

  // State variables
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [currentScreen, switchScreen] = React.useState<Screen>("fileSelection");
  const [settingsOn, setSettingsOn] = React.useState<boolean>(false);

  const [paintMode, setPaintMode] = React.useState(
    localStorage.getItem("paintMode") || "contain"
  );
  const [scale, setScale] = React.useState(
    Number.parseFloat(localStorage.getItem("scale") ?? "100")
  );
  const [distance, setDistance] = React.useState(
    Number.parseFloat(localStorage.getItem("distance") ?? "0")
  );

  if (canvasRef.current && ctxRef.current?.canvas !== canvasRef.current) {
    ctxRef.current = canvasRef.current.getContext("2d")!;
  }

  const handleRaf = React.useCallback(() => {
    console.log('!');
    if (!controllerRef.current?.plyr.playing) return;
    console.log(ctxRef.current, plyrOptions.source);

    if (ctxRef.current && plyrOptions.source) {
      paint(ctxRef.current);
    }

    window.requestAnimationFrame(handleRaf);
  }, [plyrOptions.source]);

  const handleVideoPlay = React.useCallback(() => {
    console.log('vp');
    handleRaf();
  }, [handleRaf]);

  const handleVideoReady = React.useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.plyr.currentTime = 0;
    }

    setTimeout(() => {
      if (ctxRef.current) {
        paint(ctxRef.current);
      }
    }, 500);
  }, []);

  React.useEffect(() => {
    const controller = controllerRef.current?.plyr;
    
    if (plyrOptions.source) {
      if (!controller) return;

      console.log(controller);

      controller.on("play", handleVideoPlay);
      controller.on("pause", () => console.log('PAUSE'));
      controller.on("ready", handleVideoReady);
    }

    () => {
      if (!controller) return;
      if (!controller.off) return;

      controller.off("play", handleVideoPlay);
      controller.off("ready", handleVideoReady);  
    }
  }, [plyrOptions.source, handleVideoPlay, handleVideoReady]);

  const handleFileChange = React.useCallback(
    (x: React.ChangeEvent<HTMLInputElement>) => {
      if (!controllerRef.current) return;

      const file = x.currentTarget.files?.[0];
      if (!file) return;

      switchScreen("loading");
      const type = file.type;

      const canPlay = (
        controllerRef.current?.plyr.elements.container?.querySelector(
          "video"
        ) as HTMLVideoElement | undefined
      )?.canPlayType(type);

      if (!canPlay) {
        alert("Video format not supported!");
        switchScreen("fileSelection");
      }

      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }

      const newUrl = URL.createObjectURL(file);
      setFileUrl(newUrl);

      setPlyrOptions((x) => ({
        ...x,
        source: {
          type: "video",
          sources: [
            {
              src: newUrl,
              provider: "html5",
            },
          ],
        },
      }));

      x.currentTarget.value = "";
      switchScreen("player");
    },
    [fileUrl]
  );

  const handleWindowResize = React.useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.width = window.innerWidth * window.devicePixelRatio;
    canvasRef.current.height = window.innerHeight * window.devicePixelRatio;
  }, []);

  React.useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    handleWindowResize();

    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const toggleTimeoutRef = React.useRef<number | undefined>();
  const [topBarHidden, setTopBarHidden] = React.useState(true);

  const handleShowControls = React.useCallback(() => {
    if (!controllerRef.current) return;
    if (currentScreen != "player") return;

    controllerRef.current.plyr.toggleControls(true);
    setTopBarHidden(false);

    window.clearTimeout(toggleTimeoutRef.current);
    toggleTimeoutRef.current = window.setTimeout(() => {
      if (!controllerRef.current) return;

      controllerRef.current.plyr.toggleControls(false);
      setTopBarHidden(true);
    }, 3000);
  }, [currentScreen]);

  React.useEffect(() => {
    window.addEventListener("click", handleShowControls);
    window.addEventListener("pointermove", handleShowControls);

    () => {
      window.removeEventListener("click", handleShowControls);
      window.removeEventListener("pointermove", handleShowControls);
    };
  }, []);

  const handlePaintModeChange = React.useCallback(
    (x: React.ChangeEvent<HTMLSelectElement>) => {
      localStorage.setItem("paintMode", x.currentTarget.value);
      setPaintMode(x.currentTarget.value);
    },
    []
  );

  const handleScaleChange = React.useCallback(
    (x: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem("scale", x.currentTarget.value);
      setScale(Number.parseFloat(x.currentTarget.value));
      if (ctxRef.current) {
        paint(ctxRef.current);
      }
    },
    []
  );

  const handleDistanceChange = React.useCallback(
    (x: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem("distance", x.currentTarget.value);
      setDistance(Number.parseFloat(x.currentTarget.value));
      if (ctxRef.current) {
        paint(ctxRef.current);
      }
    },
    []
  );

  const handleBackButtonClick = React.useCallback(() => {
    switchScreen("fileSelection");
  }, []);

  const handleSettingsButtonClick = React.useCallback(() => {
    setSettingsOn((x) => !x);
  }, []);

  return (
    <div>
      <div
        id="input_container"
        className={cn("dynamic_background", {
          hide: currentScreen !== "fileSelection",
        })}
      >
        <input
          id="file_selector"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
        />
        <div id="button_container">
          <p>
            <img src="/button.svg" alt="Click to open" />
          </p>
          <p id="tap_to_open">Tap to open a video</p>
        </div>
      </div>
      <div
        id="file_loading"
        className={cn("dynamic_background", {
          hide: currentScreen !== "loading",
        })}
      >
        <div className="lds-grid">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      <div
        id="main_player"
        className={cn({ hide: currentScreen !== "player" })}
      >
        <div id="canvas_container">
          <canvas id="stage" ref={canvasRef} />
        </div>
        <div id="video_container">
          <Plyr
            {...plyrOptions}
            ref={controllerRef}
          />
        </div>
        <div
          id="top_bar"
          className={cn({ hide: topBarHidden, "settings-on": settingsOn })}
        >
          <button id="back" title="back" onClick={handleBackButtonClick}>
            <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"
              />
            </svg>
          </button>
          <div id="settings-panel">
            <div>
              <label htmlFor="css">
                <span>Scale</span>
                <input
                  type="range"
                  id="scale"
                  min="1"
                  max="100"
                  value={scale}
                  onChange={handleScaleChange}
                  step="1"
                />
              </label>
            </div>
            <div>
              <label htmlFor="css">
                <span>Distance</span>
                <input
                  type="range"
                  id="distance"
                  min="0"
                  max="100"
                  value={distance}
                  onChange={handleDistanceChange}
                  step="1"
                />
              </label>
            </div>
            <div>
              <label htmlFor="css">
                <span>Filling</span>
                <select
                  id="paint_mode"
                  value={paintMode}
                  onChange={handlePaintModeChange}
                >
                  <option value="contain">Fit</option>
                  <option value="cover">Crop</option>
                  <option value="fill">Stretch</option>
                </select>
              </label>
            </div>
          </div>
          <div>
            <button id="settings" onClick={handleSettingsButtonClick}>
              <img src="/settings.svg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
