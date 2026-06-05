import React, { CSSProperties, ReactNode } from 'react';
import './text.css';

interface TextProps {
    id?: string,
    children?: ReactNode,
    style?: CSSProperties,
    className?: string,
    maxLine?: number,
    onClick?: React.MouseEventHandler<HTMLDivElement>,
    onHover?: React.MouseEventHandler<HTMLDivElement>,
    html?: string,
    title?: string
}

export const Text = React.forwardRef<HTMLDivElement, TextProps>((props, ref) => {
    let convertStyle: CSSProperties = props.style ?? {}
    if (props.maxLine) {
        convertStyle = { ...convertStyle, '--max-line': props.maxLine } as CSSProperties
    }
    return props.html ? <div ref={ref} title={props.title} dangerouslySetInnerHTML={{ __html: props.html }} id={props.id} onMouseOver={props.onHover} onClick={props.onClick} className={`comp-text-innerhtml ${props.className ?? ''}`} style={convertStyle} /> :
        <div ref={ref} id={props.id} title={props.title} onMouseOver={props.onHover} onClick={props.onClick} className={`comp-text ${props.onClick ? 'type-button' : ''} ${props.className ?? ''}`} style={convertStyle}>{props.children}</div>
})