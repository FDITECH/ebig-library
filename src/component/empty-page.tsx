import { CSSProperties, ReactNode } from 'react';
import { Text } from "./text/text";

const defaultUrl = "https://cdn.ebig.co/icon-library/error-file.png"
interface EmptyPageProps {
    title?: string | ReactNode,
    subtitle?: string | ReactNode,
    style?: CSSProperties,
    className?: string,
    button?: ReactNode,
    imgStyle?: CSSProperties,
    imgUrl?: string
}

export function EmptyPage({ imgUrl = defaultUrl, className = "", style = {}, imgStyle = {}, ...props }: EmptyPageProps) {
    return <div className={`col ${className ?? ''}`} style={{ alignItems: "center", ...style }}>
        <img
            alt=""
            src={imgUrl ?? "https://cdn.ebig.co/icon-library/color/files/archive-file.svg"}
            style={{ aspectRatio: "1/1", width: "100%", maxWidth: "30rem", ...imgStyle }}
        />
        {props.title && (
            typeof props.title === "string" ?
                <Text className="heading-5" style={{ textAlign: "center", marginTop: "1.6rem" }}>{props.title}</Text> :
                props.title
        )}
        {props.subtitle && (
            typeof props.subtitle === "string" ?
                <Text className="subtitle-2" style={{ textAlign: "center", marginTop: 4 }}>{props.subtitle}</Text> :
                props.subtitle
        )}
        {props.button}
    </div>
}