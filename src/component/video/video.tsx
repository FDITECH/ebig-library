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
    muted?: boolean;
    width?: number;
    height?: number;
}

interface VideoPlayerRef {
    element: HTMLVideoElement | HTMLDivElement;
    play: () => void;
    pause: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ controlsList = "", src, className = "", onPlay, muted, autoPlay, onEnded, sources, width, height, ...props }, ref) => {
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
            controls controlsList={controlsList}
            className={`${styles["video-player"]} ${className}`}
            onPlay={onPlay}
            onEnded={onEnded}
            autoPlay={autoPlay}
            muted={muted}
            width={width}
            height={height}
            {...props}
        >
            {sources ?? <>
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </>}
        </video>
    } else {
        return <div ref={videoRef as any} className={`${styles["video-player"]} ${className}`} {...props} />
    }
})