import { CSSProperties, forwardRef, ReactEventHandler, ReactNode, useImperativeHandle, useRef } from "react";
import styles from "./audio.module.css";

interface AudioPlayerProps {
    id?: string;
    /** nodownload nofullscreen noremoteplayback */
    controlsList?: string;
    src: string;
    style?: CSSProperties;
    className?: string;
    onPlay?: ReactEventHandler<HTMLAudioElement>;
    onEnded?: ReactEventHandler<HTMLAudioElement>;
    sources?: ReactNode;
    autoPlay?: boolean;
    muted?: boolean;
    controls?: boolean;
    loop?: boolean;
}

interface AudioPlayerRef {
    element: HTMLAudioElement | HTMLDivElement;
    play: () => void;
    pause: () => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ controls = true, controlsList = "", src, className = "", onPlay, muted, autoPlay, onEnded, sources, loop, ...props }, ref) => {
    const audioRef = useRef<HTMLAudioElement | HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        element: audioRef.current as any,
        play: () => {
            if ((src || sources) && audioRef.current) (audioRef.current as any).play()
        },
        pause: () => {
            if ((src || sources) && audioRef.current) (audioRef.current as any).pause()
        }
    }), [audioRef.current, src, sources]);

    if (src || sources) {
        return <audio
            ref={audioRef as any}
            controls={controls}
            controlsList={controls ? controlsList : undefined}
            className={`${styles["audio-player"]} ${className}`}
            onPlay={onPlay}
            onEnded={onEnded}
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            {...props}
        >
            {sources ?? <source src={src} type="audio/mpeg" />}
        </audio>
    } else {
        return <div ref={audioRef as any} className={`${styles["audio-player"]} ${className}`} {...props} />
    }
})