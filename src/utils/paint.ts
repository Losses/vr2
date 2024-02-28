
const localScale = localStorage.getItem("scale");
const localDistance = localStorage.getItem("distance");

let paintMode: string = localStorage.getItem("paintMode") || "contain";
let scale = localScale ? Number.parseFloat(localScale) : 100;
let distance = localDistance ? Number.parseFloat(localDistance) : 0;

const paintFill = ($video: HTMLVideoElement, ctx: CanvasRenderingContext2D) => {
    const paintOffset = window.innerWidth * (distance / 100);
    const scaleConfig = scale / 100;
    
    const $canvas = ctx.canvas;

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

export const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);

const paintContain = ($video: HTMLVideoElement, ctx: CanvasRenderingContext2D) => {
    const paintOffset = window.innerWidth * (distance / 100);
    const scaleConfig = scale / 100;
    
    const $canvas = ctx.canvas;

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

const paintCover = ($video: HTMLVideoElement, ctx: CanvasRenderingContext2D) => {
    const scaleConfig = scale / 100;
    const paintOffset = window.innerWidth * (distance / 100);

    // @ts-ignore
    
    const $canvas = ctx.canvas;

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

export const paint = ($video: HTMLVideoElement, ctx: CanvasRenderingContext2D) => {
    const $canvas = ctx.canvas;

    ctx.clearRect(0, 0, $canvas.width, $canvas.height);

    switch (paintMode) {
        case "contain":
            paintContain($video, ctx);
            break;
        case "cover":
            paintCover($video, ctx);
            break;
        case "fill":
            paintFill($video, ctx);
    }
};