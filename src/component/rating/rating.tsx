import React, { CSSProperties, useEffect, useState } from "react"
import styles from './rating.module.css'
import { randomGID } from "../../controller/utils"

interface RatingProps {
    id?: string,
    /**
    value: 0-5
    */
    value?: number,
    size?: number | string,
    onChange?: (e: number) => void
    className?: string,
    style?: CSSProperties,
    strokeColor?: string,
    fillColor?: string,
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(({ id, value = 0, size = '2rem', onChange, className, style, strokeColor, fillColor }, ref) => {
    const [ratingValue, setRatingValue] = useState(value)

    useEffect(() => {
        setRatingValue(value)
    }, [value])

    return <div ref={ref} id={id} className={`row ${styles['rating-container']} ${className ?? ''}`} style={style}>
        {Array.from({ length: 5 }).map((_, i) => {
            let uniqueId = 'rating-star-grad-0'
            let stopValue = 0
            if (ratingValue >= 5) {
                uniqueId = 'rating-star-grad-5'
                stopValue = 100
            } else if (ratingValue >= i) {
                uniqueId = randomGID()
                stopValue = (ratingValue - i) * 100
            }
            return <svg onClick={() => {
                if (onChange) {
                    setRatingValue(i + 1)
                    onChange(i + 1)
                }
            }} key={'rate-' + i} width={"100%"} height={"100%"} style={{ width: size, height: size }} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id={uniqueId} x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" style={{ stopColor: fillColor ?? 'var(--secondary3-main-color,#FAAD1E)' }} />
                        <stop offset={`${stopValue}%`} style={{ stopColor: fillColor ?? 'var(--secondary3-main-color,#FAAD1E)' }} />
                        <stop offset={`${stopValue}%`} style={{ stopColor: '#00000000' }} />
                    </linearGradient>
                </defs>
                <path fillRule="evenodd" clipRule="evenodd" d="M10 1.66667C10.2884 1.66667 10.5518 1.82993 10.6794 2.0878L12.844 6.46194L17.6847 7.16325C17.97 7.20459 18.2071 7.4039 18.2962 7.67736C18.3853 7.95082 18.311 8.25101 18.1045 8.45172L14.6018 11.8563L15.4285 16.6636C15.4772 16.947 15.3604 17.2334 15.127 17.4024C14.8937 17.5714 14.5844 17.5937 14.3292 17.4599L10 15.1897L5.67081 17.4599C5.41557 17.5937 5.10627 17.5714 4.87295 17.4024C4.63964 17.2334 4.52278 16.947 4.57151 16.6636L5.39815 11.8563L1.89545 8.45172C1.68896 8.25101 1.61465 7.95082 1.70377 7.67736C1.79288 7.4039 2.02996 7.20459 2.31533 7.16325L7.15599 6.46194L9.32063 2.0878C9.44825 1.82993 9.71162 1.66667 10 1.66667ZM10 4.12915L8.33846 7.48665C8.22811 7.70963 8.01479 7.86418 7.76802 7.89993L4.05223 8.43827L6.74094 11.0517C6.91947 11.2252 7.00094 11.4752 6.95881 11.7203L6.3243 15.4102L9.64738 13.6676C9.86813 13.5519 10.1319 13.5519 10.3526 13.6676L13.6757 15.4102L13.0412 11.7203C12.9991 11.4752 13.0805 11.2252 13.2591 11.0517L15.9478 8.43827L12.232 7.89993C11.9852 7.86418 11.7719 7.70963 11.6615 7.48665L10 4.12915Z" style={{ fill: strokeColor ?? 'var(--neutral-text-placeholder-color,#878792)' }} />
                <path d="M17.738 7.18949L12.8212 6.47499L10.6249 2.02268C10.5611 1.91426 10.47 1.82438 10.3608 1.76194C10.2515 1.6995 10.1279 1.66666 10.0021 1.66666C9.87623 1.66666 9.75259 1.6995 9.64335 1.76194C9.53411 1.82438 9.44306 1.91426 9.37921 2.02268L7.17875 6.47499L2.26191 7.18949C2.13368 7.208 2.0132 7.26201 1.91406 7.34542C1.81493 7.42882 1.74111 7.5383 1.70095 7.66147C1.66078 7.78463 1.65588 7.91658 1.68678 8.04239C1.71769 8.1682 1.78317 8.28286 1.87583 8.3734L5.43449 11.8411L4.59499 16.7385C4.57311 16.8662 4.58739 16.9975 4.63622 17.1175C4.68505 17.2375 4.76648 17.3414 4.8713 17.4175C4.97612 17.4937 5.10016 17.539 5.22938 17.5483C5.3586 17.5577 5.48785 17.5306 5.60252 17.4704L9.99998 15.1588L14.3974 17.4704C14.5121 17.5306 14.6414 17.5577 14.7706 17.5483C14.8998 17.539 15.0238 17.4937 15.1286 17.4175C15.2335 17.3414 15.3149 17.2375 15.3637 17.1175C15.4126 16.9975 15.4268 16.8662 15.405 16.7385L14.5655 11.8411L18.1241 8.3734C18.2168 8.28295 18.2823 8.16841 18.3132 8.0427C18.3442 7.91699 18.3394 7.78512 18.2994 7.66199C18.2594 7.53886 18.1858 7.42937 18.0868 7.34587C17.9879 7.26238 17.8675 7.20822 17.7394 7.18949H17.738Z" fill={`url(#${uniqueId})`} />
            </svg>
        })}
    </div>
})

export { Rating }
