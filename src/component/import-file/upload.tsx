import styles from "./upload.module.css"
import { CSSProperties, forwardRef, ReactNode, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { Button, closePopup, NavLink, Popup, randomGID, showPopup, Text, TextField, ToastMessage, Ebigicon } from "../../index"
import { useTranslation } from "react-i18next"
import { formatFileSize } from "./import-file";

interface FilePreview {
    id: string;
    name?: string;
    size?: number;
    type?: string;
    url: string;
    exactUrl?: string;
    status?: "uploading" | "uploaded" | "error";
    file?: File;
}

interface UploadFilesProps {
    id?: string;
    files?: FilePreview[];
    multiple?: boolean;
    className?: string;
    style?: CSSProperties;
    helperText?: string;
    helperTextColor?: string;
    placeholder?: string;
    prefix?: ReactNode;
    suffix?: ReactNode;
    onChange?: (files: FilePreview[]) => void;
    linkDomain?: string;
    prevewMaxLength?: number;
    allowType?: Array<string>;
    disabled?: boolean;
    simpleStyle?: boolean;
    readOnly?: boolean;
    /**
    * maxSize unit: kb (kilobytes) \
    * default: 200mb
    */
    maxSize?: number,
}

interface UploadFilesRef {
    showUploadPopup: () => void;
    closeUploadPopup: () => void;
    setFiles: (files: FilePreview[]) => void;
    files: FilePreview[];
    element?: HTMLDivElement;
}

const defaultSize = 200 * 1024

export const UploadFiles = forwardRef<UploadFilesRef, UploadFilesProps>(({ className = "body-3", style = {}, prevewMaxLength = 3, maxSize = defaultSize, helperTextColor = '#e14337', ...props }, ref) => {
    const [files, setFiles] = useState<FilePreview[]>([])
    const popupRef = useRef<any>(null)
    const divRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    const sizeTitle: string | undefined = useMemo(() => maxSize ? formatFileSize(maxSize * 1024) : undefined, [maxSize])

    useEffect(() => {
        setFiles(props.files || [])
    }, [props.files])

    const showUploadPopup = () => {
        showPopup({
            ref: popupRef,
            clickOverlayClosePopup: true,
            content: <UploadFilesDetailPopup
                ref={popupRef}
                files={files}
                multiple={props.multiple}
                allowType={props.allowType}
                linkDomain={props.linkDomain ?? ""}
                onChange={(files) => {
                    const tmpFiles = files.filter(e => {
                        if (e.file) {
                            return e.file.size <= (maxSize * 1024)
                        } else return !e.size || e.size <= (maxSize * 1024)
                    })
                    if (files.length !== tmpFiles.length) ToastMessage.errors(t("limitFileWarning", { sizeTitle: sizeTitle }))
                    setFiles(tmpFiles)
                    props.onChange?.(tmpFiles)
                }}
            />
        })
    }

    useImperativeHandle(ref, () => ({
        closeUploadPopup: () => closePopup(popupRef),
        showUploadPopup: showUploadPopup,
        setFiles: (files: FilePreview[]) => setFiles(files),
        files: files,
        element: divRef.current as any
    }), [files])

    return <>
        <Popup ref={popupRef} />
        <div
            id={props.id}
            ref={divRef}
            helper-text={props.helperText}
            className={`row ${props.simpleStyle ? styles['upload-files-simple-style'] : styles["upload-files-container"]} ${className} ${props.disabled ? styles['disabled'] : ""} ${props.helperText?.length ? styles['helper-text'] : ""}`}
            style={{ cursor: files.length ? "auto" : "pointer", ...style, '--helper-text-color': helperTextColor } as CSSProperties}
            onClick={props.disabled || props.readOnly ? undefined : showUploadPopup}
        >
            {props.prefix}
            <div className={`row ${styles["preview-container"]}`} data-placeholder={props.placeholder}>
                {files.slice(0, prevewMaxLength).map((f, i) => {
                    return <NavLink key={`${f.id}-${i}`} to={f.url ?? ""} target="_blank" className={`row ${styles["file-preview"]}`} style={props.multiple ? undefined : { maxWidth: "100%" }} onClick={(ev) => ev.stopPropagation()}>
                        <span>{f.name}</span>
                        {!props.disabled && <Ebigicon src="outline/user-interface/e-remove" size={12} className="icon-button light"
                            onClick={(ev) => {
                                ev.stopPropagation();
                                ev.preventDefault();
                                const tmpFiles = files.filter(e => e.id !== f.id)
                                setFiles(tmpFiles)
                                props.onChange?.(tmpFiles)
                            }} />}
                    </NavLink>
                })}
                {files.length > prevewMaxLength && <div className={`row ${styles["file-preview"]}`}>
                    <span className="label-4">+{files.length - prevewMaxLength}</span>
                </div>}
                {props.multiple && !!files.length && !props.disabled && <button disabled={props.disabled} type="button" className={`row ${styles["file-preview"]}`}
                    onClick={(ev) => {
                        ev.stopPropagation();
                        ev.preventDefault();
                        showUploadPopup();
                    }}>
                    <span>{t("uploadMore")}</span>
                    <Ebigicon src="outline/arrows/cloud-upload" size={12} />
                </button>}
            </div>
            {props.suffix}
        </div>
    </>
})

export const urlToFileType = (url: string) => {
    let type = url.split(".").pop()
    switch (type?.toLowerCase()) {
        case "pdf":
            type = "color/files/file-pdf"
            break;
        case "xlsx":
            type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            break;
        case "docx":
            type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            break;
        case "mp4":
        case "webm":
        case "ogg":
        case "avi":
            type = "video/" + type
            break;
        case "mpeg":
        case "wav":
        case "mp3":
            type = "audio/" + type
            break;
        case "png":
        case "jpeg":
        case "jpg":
        case "gif":
        case "webp":
        case "svg+xml":
            type = "image/" + type
            break;
        default:
            type = "unknown";
            break;
    }
    return type
}

const UploadFilesDetailPopup = forwardRef((props: { files: FilePreview[], onChange: (files: FilePreview[]) => void, linkDomain: string, multiple?: boolean, allowType?: Array<string> }, ref: any) => {
    const inputFileRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<FilePreview[]>(props.files || [])
    const { t } = useTranslation()

    const onSelectFiles = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.files && ev.target.files[0]) {
            const tmp: FilePreview[] = [...ev.target.files].map(f => ({ id: randomGID(), name: f.name, size: f.size, type: f.type, status: "uploaded", url: URL.createObjectURL(f), file: f }))
            if (props.multiple) setFiles(prev => [...prev, ...tmp])
            else setFiles(tmp)
        }
    }

    const onDropFiles = (ev: React.DragEvent<HTMLLabelElement>) => {
        ev.preventDefault()
        if (ev.dataTransfer.files && ev.dataTransfer.files[0]) {
            const tmpFiles = props.multiple ? [...ev.dataTransfer.files] : [ev.dataTransfer.files[0]]
            const tmp: FilePreview[] = tmpFiles.map(f => ({ id: randomGID(), name: f.name, size: f.size, type: f.type, status: "uploaded", url: URL.createObjectURL(f), file: f }))
            if (props.multiple) setFiles(prev => [...prev, ...tmp])
            else setFiles(tmp)
        }
    }

    const onApplyLink = (inputElement: HTMLInputElement) => {
        const url = inputElement.value.trim();
        if (url.length) {
            const name = url.split(/[\\/]/).pop() || "file";
            const type = urlToFileType(name);
            const file: FilePreview = {
                id: randomGID(),
                name: name,
                type: type,
                status: "uploaded",
                exactUrl: url,
                url: url
            };
            if (props.multiple) setFiles(prev => [...prev, file]);
            else setFiles([file]);
        }
        inputElement.value = "";
    }

    return <div className={`col ${styles["upload-popup"]}`}>
        <div className="row" style={{ padding: "1.6rem 2.4rem", borderBottom: "var(--neutral-main-border)" }}>
            <Text className="heading-6" style={{ flex: 1 }}>{t("uploadFile")}</Text>
            <Ebigicon src="outline/user-interface/e-remove" size={14} className="icon-button size24" onClick={() => { closePopup(ref) }} />
        </div>
        <div className="col" style={{ flex: 1, gap: "2rem", overflow: "hidden auto" }}>
            <div className={`col ${styles["upload-container"]}`}>
                <label className="col" style={{ gap: "1.6rem" }} onDragOver={(ev) => ev.preventDefault()} onDrop={onDropFiles}>
                    <input ref={inputFileRef} type="file" multiple={props.multiple} accept={props.allowType?.join(',')} hidden onChange={onSelectFiles} />
                    <Ebigicon src="outline/arrows/cloud-upload" className="icon-button size56" />
                    <span className="heading-7">{t("dragAndDrop")}</span>
                </label>
                <div className="col" style={{ gap: 4 }}>
                    <button type="button" className="row" style={{ height: "3.2rem", gap: 8 }} onClick={() => { inputFileRef.current?.click() }}>
                        <Ebigicon src="outline/files/folder" size={16} />
                        <span className="label-4">{t("selectFromDevice")}</span>
                    </button>
                    <div style={{ height: 1, backgroundColor: "var(--neutral-main-border-color)" }} />
                    <div className="row" style={{ height: "3.2rem", gap: 8 }}>
                        <Ebigicon src="outline/text/link" size={16} />
                        <span className="label-4">{t("from")} {t("link").toLowerCase()}</span>
                    </div>
                    <TextField
                        placeholder={t("pasteLink")}
                        className="body-3 size32"
                        style={{ backgroundColor: "var(--neutral-main-background-color)" }}
                        onComplete={(ev) => onApplyLink(ev.currentTarget)}
                        suffix={
                            <Ebigicon src="outline/arrows/turn-e" style={{ rotate: "180deg" }} size={12}
                                className="icon-button light"
                                onClick={(ev) => { onApplyLink(ev.currentTarget.parentElement!.querySelector("input") as any) }}
                            />}
                    />
                </div>
            </div>
            {!!files.length && <div className="col" style={{ gap: "0.8rem", padding: "0.8rem 2.4rem" }}>
                <div className="row" style={{ marginBottom: "0.8rem" }}>
                    <span className="heading-7" style={{ flex: 1 }}>{t("files")}</span>
                    <Text className="button-text-5" onClick={() => { setFiles([]) }}>{t("clearall")}({files.length})</Text>
                </div>
                {files.map((f, i) => {
                    switch (f.type) {
                        case "application/pdf":
                            var icon = "color/files/file-pdf"
                            break;
                        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                            icon = "color/files/file-xlsx"
                            break;
                        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                            icon = "color/files/file-docx"
                            break;
                        case "video/mp4":
                        case "video/webm":
                        case "video/ogg":
                        case "video/avi":
                            icon = "color/files/file-play"
                            break;
                        case "audio/mpeg":
                        case "audio/wav":
                        case "audio/ogg":
                        case "audio/mp3":
                            icon = "color/files/file-audio"
                            break;
                        case "image/png":
                        case "image/jpeg":
                        case "image/jpg":
                        case "image/gif":
                        case "image/webp":
                        case "image/svg+xml":
                            icon = "color/development/image"
                            break;
                        default:
                            icon = "color/files/notebook"
                            break;
                    }
                    return <div key={`${f.id}-${i}`} className={`row ${styles["file-detail-tile"]}`}>
                        <Ebigicon src={icon as any} size={16} />
                        <NavLink to={f.url} target="_blank" style={{ flex: 1 }}>
                            <Text className="label-4" style={{ width: "100%" }} maxLine={1}>{f.name}</Text>
                        </NavLink>
                        <Ebigicon src="outline/user-interface/delete-forever" size={14} onClick={() => { setFiles(prev => prev.filter(pf => pf.id !== f.id)) }} />
                    </div>
                })}
            </div>}
        </div>
        {((props.files.length !== files.length) || (!!props.files.length && files.every((f => !props.files.some((pf) => pf.id === f.id))))) && <div className="row" style={{ padding: "1.6rem 2.4rem", justifyContent: "end", gap: 8 }}>
            <Button
                label={t("cancel")}
                className="button-text-3 button-grey"
                onClick={() => { closePopup(ref) }}
            />
            <Button
                label={t("done")}
                className="button-text-3 button-primary"
                onClick={() => {
                    props.onChange(files)
                    closePopup(ref)
                }}
            />
        </div>}
    </div>
})