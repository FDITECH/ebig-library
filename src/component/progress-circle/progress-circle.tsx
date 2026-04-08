import { CSSProperties, forwardRef } from 'react'
import './progress-circle.css'

interface ProgressCircleProps {
    id?: string,
    /** value:  0 - 100 (%)*/
    percent?: number,
    size?: string | number,
    style?: CSSProperties,
    className?: string,
    fillColor?: string,
    percentColor?: string,
    strokeWidth?: number,
    strokeColor?: string,
    textStyle?: CSSProperties,
    title?: string
}

export const ProgressCircle = forwardRef<SVGSVGElement, ProgressCircleProps>(({ strokeWidth = 4, percent = 0, style = {}, textStyle = {}, ...props }, ref) => {
    const radius = 30 - strokeWidth
    const diameter = Math.PI * 2 * radius;
    const strokeOffset = (1 - (percent / 100)) * diameter;
    return <svg id={props.id} ref={ref} className={props.className} width="100%" height="100%" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...style, width: props.size ?? '4.8rem', height: props.size ?? '4.8rem' }} >
        <path d={`M 30,30 m 0,-${radius} a ${radius},${radius} 0 1 1 0,${2 * radius} a ${radius},${radius} 0 1 1 0,-${2 * radius}`} style={{ fill: "none", stroke: props.strokeColor ?? "var(--neutral-main-background-color, light-dark(#EFEFF0, #313135))", strokeWidth: strokeWidth, }} />
        <path d={`M 30,30 m 0,-${radius} a ${radius},${radius} 0 1 1 0,${2 * radius} a ${radius},${radius} 0 1 1 0,-${2 * radius}`} style={{ stroke: props.percentColor ?? "var(--primary-main-color, #287CF0)", strokeWidth: strokeWidth, strokeLinecap: 'round', strokeDasharray: `${diameter}px ${diameter}px`, strokeDashoffset: `${strokeOffset}px` }} />
        <text x="50%" y="50%" dy=".3em" textAnchor="middle" style={{ fontSize: "1.6rem", fontWeight: "600", fill: "var(--neutral-text-title-color, light-dark(#18181B, #F4F4F5))", ...textStyle }}>{props.title ?? `${percent}%`}</text>
    </svg>
})