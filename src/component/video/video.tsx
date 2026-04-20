import { CSSProperties, forwardRef, ReactEventHandler, ReactNode, useImperativeHandle, useRef } from "react";
import styles from "./video.module.css";

interface VideoPlayerProps {
    id?: string;
    /** nodownload nofullscreen noremoteplayback */
    controlsList?: string;
    src: string;
    style?: CSSProperties;
    className?: string;
    onPlay?: ReactEventHandler<HTMLVideoElement>;
    onEnded?: ReactEventHandler<HTMLVideoElement>;
    sources?: ReactNode;
    autoPlay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    width?: number;
    height?: number;
}

interface VideoPlayerRef {
    element: HTMLVideoElement | HTMLDivElement;
    play: () => void;
    pause: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ controls = true, controlsList = "", src, className = "", onPlay, muted, autoPlay, onEnded, sources, width, height, loop, ...props }, ref) => {
    const videoRef = useRef<HTMLVideoElement | HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        element: videoRef.current as any,
        play: () => {
            if ((src || sources) && videoRef.current) (videoRef.current as any).play()
        },
        pause: () => {
            if ((src || sources) && videoRef.current) (videoRef.current as any).pause()
        }
    }), [videoRef.current, src, sources]);

    if (src || sources) {
        return <video
            ref={videoRef as any}
            controls={controls}
            controlsList={controls ? controlsList : undefined}
            className={`${styles["video-player"]} ${className}`}
            onPlay={onPlay}
            onEnded={onEnded}
            autoPlay={autoPlay}
            muted={muted}
            width={width}
            height={height}
            loop={loop}
            {...props}
        >
            {sources ?? <source src={src} type="video/mp4" />}
        </video>
    } else {
        return <div ref={videoRef as any} className={`${styles["video-player"]} ${className}`} {...props} />
    }
})