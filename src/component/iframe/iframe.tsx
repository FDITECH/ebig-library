import { CSSProperties, forwardRef, useImperativeHandle, useRef } from "react";
import styles from "./iframe.module.css";

interface IframePlayerProps {
    id?: string;
    /** nodownload nofullscreen noremoteplayback */
    src: string;
    srcDoc: string;
    style?: CSSProperties;
    className?: string;
    width?: number;
    height?: number;
    placeholder?: string;
    loading?: "eager" | "lazy";
    allow?: string;
    allowFullScreen?: boolean;
    allowTransparency?: boolean;
    referrerPolicy?: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
    name?: string;
}

interface IframePlayerRef {
    element: HTMLIFrameElement | HTMLDivElement;
}

export const IframePlayer = forwardRef<IframePlayerRef, IframePlayerProps>(({ src, srcDoc, className = "", placeholder = "", width, height, allow, allowFullScreen, allowTransparency, referrerPolicy, name, ...props }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement | HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        element: iframeRef.current as any,
    }), [iframeRef.current]);

    if (src) {
        return <iframe
            id={props.id}
            key={src}
            ref={iframeRef as any}
            srcDoc={srcDoc}
            src={src}
            className={`${styles["iframe-player"]} ${className}`}
            width={width}
            height={height}
            allow={allow}
            allowFullScreen={allowFullScreen}
            referrerPolicy={referrerPolicy}
            name={name}
            {...props}
        />
    } else {
        return <div ref={iframeRef as any} data-placeholder={placeholder} className={`${styles["iframe-player"]} ${className}`} {...props} />
    }
})