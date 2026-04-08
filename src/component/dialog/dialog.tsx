import React, { createRef, ReactNode } from 'react'
import ReactDOM from 'react-dom'
import styles from './dialog.module.css'
import { ComponentStatus, getStatusIcon, Text } from '../../index'
import { useTranslation, WithTranslation } from 'react-i18next';

export enum DialogAlignment {
    start = 'start',
    center = 'center',
    end = 'end'
}

interface DialogState {
    readonly open?: boolean,
    title?: string,
    status: ComponentStatus,
    content?: string | ReactNode,
    onSubmit: Function,
    onCancel?: Function,
    submitTitle?: string,
    cancelTitle?: string,
    alignment?: DialogAlignment,
}

class TDialog extends React.Component<WithTranslation, DialogState> {
    constructor(props: WithTranslation) {
        super(props);
        this.state = {
            open: false,
            title: '',
            status: ComponentStatus.INFOR,
            onSubmit: () => { }
        }
    }
    showDialogNoti(data: DialogState) {
        this.setState({ open: true, ...data })
    }

    closeDialog() {
        this.setState({ open: false })
    }

    render() {
        const { t } = this.props;
        return (
            <>
                {this.state.open &&
                    ReactDOM.createPortal(
                        <div className={styles['dialog-overlay']}>
                            <div className={`${styles['dialog-container']} col`} style={{ width: '41.4rem', alignItems: this.state.alignment }} dialog-type={this.state.status} onClick={e => e.stopPropagation()} >
                                <div className={`${styles['dialog-body']} col`} style={{ alignItems: 'inherit' }}>
                                    <div className={`${styles['dialog-status']} row`}>{getStatusIcon(this.state.status)}</div>
                                    <div className='col'>
                                        {!!this.state.title?.length && <Text className={'heading-6'} style={{ textAlign: this.state.alignment === DialogAlignment.center ? 'center' : 'start' }}>{this.state.title}</Text>}
                                        {this.state.content &&
                                            (typeof this.state.content === "string" ?
                                                <Text className={'body-3'} style={{ textAlign: this.state.alignment === DialogAlignment.center ? 'center' : 'start' }}>{this.state.content}</Text> :
                                                this.state.content)
                                        }
                                    </div>
                                </div>
                                <div className={`${styles['dialog-footer']} row`}>
                                    <button type='button' style={this.state.alignment === DialogAlignment.center ? { flex: 1, width: '100%' } : undefined} onClick={() => {
                                        if (this.state.onCancel) this.state.onCancel();
                                        this.setState({ open: false });
                                    }} className={`${styles['dialog-action']} row`}>
                                        <Text className='button-text-3'>{this.state.cancelTitle ?? t("cancel")}</Text>
                                    </button>
                                    <button type='button' style={this.state.alignment === DialogAlignment.center ? { flex: 1, width: '100%' } : undefined} onClick={() => {
                                        this.state.onSubmit();
                                        this.setState({ open: false });
                                    }} className={`${styles['dialog-action']} row ${styles['dialog-submit']}`} >
                                        <Text className='button-text-3'>{this.state.submitTitle ?? t('submit')}</Text>
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
            </>
        )
    }
}

const dialogRef = createRef<TDialog>()
export const Dialog = () => {
    const { t, i18n } = useTranslation()
    return <TDialog ref={dialogRef} t={t} i18n={i18n} tReady={true} />
}

export const showDialog = (props: {
    title?: string,
    status?: ComponentStatus,
    content?: string | ReactNode,
    onSubmit?: Function,
    onCancel?: Function,
    submitTitle?: string,
    cancelTitle?: string,
    alignment?: DialogAlignment
}) => {
    if (dialogRef.current)
        dialogRef.current.showDialogNoti({
            title: props.title,
            status: props.status ?? ComponentStatus.INFOR,
            content: props.content,
            onSubmit: props.onSubmit ?? (() => { }),
            onCancel: props.onCancel,
            submitTitle: props.submitTitle,
            cancelTitle: props.cancelTitle,
            alignment: props.alignment
        })
}