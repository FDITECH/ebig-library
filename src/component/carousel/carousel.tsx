import React, { CSSProperties, ReactNode } from 'react';
import AwesomeSlider from "react-awesome-slider";
import "react-awesome-slider/dist/styles.css";
import './carousel.css'
import "react-awesome-slider/dist/custom-animations/scale-out-animation.css";
import "react-awesome-slider/dist/custom-animations/fold-out-animation.css";
import "react-awesome-slider/dist/custom-animations/cube-animation.css";
import "react-awesome-slider/dist/custom-animations/fall-animation.css";
import { Ebigicon } from '../icon/ebig-icon';

interface CarouselProps {
    id?: string,
    children?: Array<ReactNode>,
    autoPlay?: boolean,
    /** default: 2000ms */
    duration?: number,
    className?: string,
    iconSize?: number | string,
    iconColor?: string,
    prevButton?: ReactNode,
    nextButton?: ReactNode,
    style?: CSSProperties,
    buttons?: boolean,
    onChage?: (i: number) => void,
    animation?: "scaleOut" | "cubeAnimation" | "foldOut" | "fall";
}

interface SliderState {
    page: number
}

export class Carousel extends React.Component<CarouselProps, SliderState> {
    private intervalPlay: any
    constructor(props: CarouselProps) {
        super(props)
        props.buttons ??= true
        this.state = {
            page: 0
        }
        this.autoPlay = this.autoPlay.bind(this)
        this.nextPage = this.nextPage.bind(this)
        this.previousPage = this.previousPage.bind(this)
    }

    nextPage = () => {
        let index = this.state?.page ?? 0;
        if (this.props?.children && (index + 1) < this.props.children.length) {
            this.setState({ page: index + 1 })
            if (this.props.onChage) this.props.onChage(index + 1)
        }
    }

    previousPage = () => {
        let index = this.state?.page ?? 0;
        if (this.props?.children && index > 0) {
            this.setState({ page: index - 1 })
            if (this.props.onChage) this.props.onChage(index - 1)
        }
    }

    private autoPlay = () => {
        let index = this.state?.page ?? 0;
        if (this.props?.children && (index + 1) === this.props.children.length)
            index = -1
        this.setState({ page: index + 1 })
        if (this.props.onChage) this.props.onChage(index + 1)
    }

    componentDidMount(): void {
        if (this.props.autoPlay) this.intervalPlay = setInterval(this.autoPlay, this.props.duration ?? 2000)
    }

    componentDidUpdate(prevProps: Readonly<CarouselProps>): void {
        if (this.props.autoPlay !== prevProps.autoPlay && !this.props.autoPlay) clearInterval(this.intervalPlay)
    }

    render() {
        return <AwesomeSlider
            animation={this.props.animation}
            style={this.props.style}
            className={`custom-slider-container ${this.props.className ?? ''}`}
            selected={this.state.page}
            bullets={false}
            buttons={this.props.buttons ? (this.props.children && this.props.children?.length > 1) : false}
            organicArrows={false}
            buttonContentLeft={this.props.prevButton ?? <Ebigicon src={"fill/arrows/circle-ctrl-left"} size={"2.4rem"} color={this.props.iconColor ?? "var(--neutral-absolute-background-color,light-dark(#FFFFFF, #14181b))"} />}
            buttonContentRight={this.props.nextButton ?? <Ebigicon src={"fill/arrows/circle-ctrl-right"} size={"2.4rem"} color={this.props.iconColor ?? "var(--neutral-absolute-background-color,light-dark(#FFFFFF, #14181b))"} />}
        >
            {this.props.children}
        </AwesomeSlider>
    }
}