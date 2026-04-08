import React, { CSSProperties, ReactNode } from 'react';
import { Text } from '../text/text';
import styles from './tag.module.css'
import { ComponentStatus } from '../component-status';

interface TagProps {
    id?: string,
    title: string,
    prefix?: ReactNode,
    suffix?: ReactNode,
    disabled?: boolean,
    style?: CSSProperties,
    /** 
     * default: size24: button-text-6 \
     * recommend: size24: button-text-6 | size32: button-text-4 \
     * status tag: tag-primary | tag-infor | tag-warning | tag-error | tag-success | tag-grey | tag-neutral | tag-infor-main | tag-warning-main | tag-error-main | tag-success-main
     * */
    className?: string,
    status?: ComponentStatus,
    onClick?: React.MouseEventHandler<HTMLDivElement>
}

export class Tag extends React.Component<TagProps> {
    render() {
        return <div id={this.props.id} tag-type={this.props.status ?? 'default'} className={`${styles['tag-container']} row ${this.props.onClick ? styles['type-button'] : ''} ${this.props.disabled ? styles['disabled'] : ""} ${this.props.className ?? "button-text-6"} `} style={this.props.style} onClick={this.props.onClick}>
            {this.props.prefix}
            <Text maxLine={1} className={styles['tag-label']}>{this.props.title}</Text>
            {this.props.suffix}
        </div>
    }
}