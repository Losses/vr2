export const playing = (x: HTMLVideoElement | null | undefined) => {
    if (!x) return false;
    return !!(x.currentTime > 0 && !x.paused && !x.ended && x.readyState > 2);
}