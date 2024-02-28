import * as React from "react";
import cn from "classnames";

import { paint } from "../utils/paint";
import { playing } from '../utils/videoPlaying';

import "./Home.css";
import { BackIcon } from "../components/BackIcon";
import { Loading } from "../components/Loading";
import { PlayIcon } from "../components/PlayIcon";

type Screen = "fileSelection" | "loading" | "player";

const Home: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D>();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const initializedRef = React.useRef<boolean>(false);

  // State variables
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [currentScreen, switchScreen] = React.useState<Screen>("fileSelection");
  const [settingsOn, setSettingsOn] = React.useState<boolean>(false);
  
  const [isPlaying, setIsPlaying] = React.useState(false);

  const [paintMode, setPaintMode] = React.useState(
    localStorage.getItem("paintMode") ?? "contain"
  );
  const [scale, setScale] = React.useState(
    Number.parseFloat(localStorage.getItem("scale") ?? "100")
  );
  const [distance, setDistance] = React.useState(
    Number.parseFloat(localStorage.getItem("distance") ?? "0")
  );

  if (canvasRef.current && ctxRef.current?.canvas !== canvasRef.current) {
    const ctx = canvasRef.current.getContext("2d")!;
    ctxRef.current = ctx;
  }

  const syncPlaying = React.useCallback(() => {
    const x =playing(videoRef.current);
    setIsPlaying(x);

    return x;
  }, []);

  const metaPaint = React.useCallback(() => {
    if (ctxRef.current && fileUrl && videoRef.current) {
      paint(videoRef.current, ctxRef.current);
    }
  }, [fileUrl]);

  const handleRaf = React.useCallback(() => {
    if (!playing(videoRef.current)) return;

    metaPaint();
    window.requestAnimationFrame(handleRaf);
  }, [metaPaint]);

  const handleVideoPlay = React.useCallback(() => {
    handleRaf();
  }, [handleRaf]);

  const handleVideoReady = React.useCallback(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    setTimeout(() => {
      metaPaint();
    }, 500);
  }, [metaPaint]);

  const handleFileChange = React.useCallback(
    (x: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;

      const file = x.currentTarget.files?.[0];
      if (!file) return;

      switchScreen("loading");
      const type = file.type;

      const canPlay = videoRef.current?.canPlayType(type);

      if (!canPlay) {
        alert("Video format not supported!");
        switchScreen("fileSelection");
      }

      setFileUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }

        const newUrl = URL.createObjectURL(file);
        initializedRef.current = false;
        return newUrl;
      });

      syncPlaying();

      x.currentTarget.value = "";
      switchScreen("player");
    },
    []
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
    if (!videoRef.current) return;
    if (currentScreen != "player") return;

    // TODO: Implement a control here.
    // controllerRef.current.plyr.toggleControls(true);
    setTopBarHidden(false);

    window.clearTimeout(toggleTimeoutRef.current);
    toggleTimeoutRef.current = window.setTimeout(() => {
      if (!videoRef.current) return;

      // TODO: Implement a control here.
      // controllerRef.current.plyr.toggleControls(true);
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
      metaPaint();
    },
    []
  );

  const handleScaleChange = React.useCallback(
    (x: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem("scale", x.currentTarget.value);
      setScale(Number.parseFloat(x.currentTarget.value));
      metaPaint();
    },
    [metaPaint]
  );

  const handleDistanceChange = React.useCallback(
    (x: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem("distance", x.currentTarget.value);
      setDistance(Number.parseFloat(x.currentTarget.value));
      metaPaint();
    },
    [metaPaint]
  );

  const handleBackButtonClick = React.useCallback(() => {
    switchScreen("fileSelection");
  }, []);

  const handleSettingsButtonClick = React.useCallback(() => {
    setSettingsOn((x) => !x);
  }, []);

  const handleCanvasClick = React.useCallback(() => {
    const x = syncPlaying();

    if (x) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
  }, []);

  console.log(isPlaying);

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
        <Loading />
      </div>
      <div
        id="main_player"
        className={cn({ hide: currentScreen !== "player" })}
      >
        <div id="canvas_container">
          <canvas id="stage" ref={canvasRef} onClick={handleCanvasClick} />
        </div>
        <div id="play_button_container">
          {!isPlaying && <div className="play_button"><PlayIcon /></div>}
        </div>
        <div id="video_container">
          <video
            ref={videoRef}
            controls={true}
            onPlay={handleVideoPlay}
            onCanPlay={handleVideoReady}
          >
            {fileUrl && <source src={fileUrl} />}
          </video>
        </div>
        <div
          id="top_bar"
          className={cn({ hide: topBarHidden, "settings-on": settingsOn })}
        >
          <button id="back" title="back" onClick={handleBackButtonClick}>
            <BackIcon />
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
