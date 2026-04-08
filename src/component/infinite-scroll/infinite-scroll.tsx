import React, { CSSProperties, forwardRef, ReactNode, useImperativeHandle, useRef } from 'react';
import styles from './infinite-scroll.module.css'


interface InfiniteScrollProps {
    id?: string,
    className?: string,
    style?: CSSProperties,
    handleScroll?: (onLoadMore: boolean, ev: React.UIEvent<HTMLDivElement, UIEvent>) => Promise<any> | null,
    children?: ReactNode,
    horizontal?: boolean
}

interface InfiniteScrollRef {
    element?: HTMLDivElement;
    loading?: boolean
}

export const InfiniteScroll = forwardRef<InfiniteScrollRef, InfiniteScrollProps>((props: InfiniteScrollProps, ref) => {
    const [loading, setLoading] = React.useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
        element: scrollRef.current as any,
        loading
    }), [loading])

    return <div
        ref={scrollRef}
        id={props.id}
        onScroll={async (ev) => {
            if (props.handleScroll) {
                setLoading(true)
                let scrollElement = ev.target as HTMLDivElement
                await props.handleScroll(Math.round(scrollElement.offsetHeight + Math.abs(scrollElement.scrollTop)) >= (scrollElement.scrollHeight - 1), ev)
                setLoading(false)
            }
        }}
        className={`${styles['infinite-scroll']} ${loading ? styles['loading'] : ''} ${props.className ?? (props.horizontal ? 'row' : 'col')}`}
        style={props.style ?? { 'overflow': props.horizontal ? 'auto hidden' : 'hidden auto' }}
    >
        {props.children}
    </div>
})
