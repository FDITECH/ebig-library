import { CSSProperties, forwardRef, HTMLAttributes, ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom"
import { handleErrorImgSrc, LayoutElement, regexResponsiveClassCol } from "./config"
import { ActionType, ComponentType, FEDataType, TriggerType, ValidateType } from "../da"
import { FormById } from "../form/formById"
import { CardById } from "../card/cardById"
import { ChartById } from "../chart/chartById"
import { ViewById } from "../view/viewById"
import { SimpleButton } from "../../component/button/button"
import { randomGID, Util } from "../../controller/utils"
import { regexGetVariableByThis, regexGetVariables, replaceVariables } from "../card/config"
import { BaseDA, CkEditorUploadAdapter, ConfigData, imgFileTypes } from "../../controller/config"
import { FCheckbox, FColorPicker, FDateTimePicker, FGroupCheckbox, FGroupRadioButton, FInputPassword, FNumberPicker, FRadioButton, FSelectDropdownForm, FSwitch, FTextArea, FTextField, FUploadMultipleFileType } from "./component-form"
import { Ebigicon, Text, Rating, CustomCkEditor5, ProgressCircle, ProgressBar, VideoPlayer, IframePlayer, ComponentStatus, useEbigContext, Pagination, AudioPlayer, ToastMessage, TableController, DataController, showDialog, showPopup, Popup } from "../../index"

interface Props {
    methods?: UseFormReturn
}

export interface CustomHTMLProps extends HTMLAttributes<any> {
    style?: CSSProperties;
    className?: string;
    /** type function only for card element */
    propsData?: { [p: string]: CustomHTMLProps } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => CustomHTMLProps },
    /** type function only for card element */
    itemData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    /** type function only for card element */
    childrenData?: { [p: string]: ReactNode } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    /** only for card element */
    cardData?: Array<{ [p: string]: any }>,
    /** only for card element */
    controller?: "all" | { page?: number, size?: number, searchRaw?: string, filter?: string, sortby?: Array<{ prop: string, direction?: "ASC" | "DESC" }>, pattern?: { returns: Array<string>, [p: string]: Array<string> | { searchRaw?: string, reducers: string } } } | { ids: string, maxLength?: number | "none" },
    /** only for card element */
    emptyLink?: string,
    /** only for card element */
    emptyMessage?: string,
    /** only for card element */
    emptyElement?: ReactNode,
    /** only for card element */
    onUnMount?: () => void;
    /** only for form element */
    data?: { [p: string]: any };
    /** only for form element */
    customOptions?: { [p: string]: Array<{ [k: string]: any }> };
    /** only for form element */
    onSubmit?: (
        /** form data */
        e?: { [p: string]: any }
    ) => void;
    /** only for form element */
    onError?: (e?: { [p: string]: any }) => void;
    /** only for form element */
    autoBcrypt?: boolean;
}

interface RenderPageProps extends Props {
    layers: Array<{ [p: string]: any }>,
    bodyId?: string
    children?: ReactNode,
    /**
     * type function only for card element \n
     * custom props of layer by id. Ex: { "gid": { style: { width: "60rem", backgroundColor: "red" }, className: "my-class" } }
     * */
    propsData?: { [p: string]: CustomHTMLProps } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => CustomHTMLProps },
    /**
     * type function only for card element \n
     * replace children of parent layer by id. Ex: { "gid": <Text className="heading-7">Example</Text> }
     * */
    childrenData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    /**
     * type function only for card element \n
     * replace layer by id. Ex: { "gid": <Text className="heading-7">Example</Text> }
     * */
    itemData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
}

const RenderPageView = ({ childrenData, propsData, itemData, layers = [], children, methods, bodyId }: RenderPageProps) => {

    return layers.filter(e => !e.ParentId || e.ParentId === bodyId).map(e => <RenderLayerElement
        key={e.Id}
        item={e}
        list={layers}
        methods={methods}
        bodyChildren={children}
        childrenData={childrenData}
        itemData={itemData}
        propsData={propsData}
        type="page"
    />)
}

interface RenderLayerElementProps extends Props {
    item: { [p: string]: any },
    list: Array<{ [p: string]: any }>,
    cols?: Array<{ [p: string]: any }>,
    rels?: Array<{ [p: string]: any }>,
    bodyChildren?: ReactNode,
    tbName?: string,
    type?: "page" | "view" | "card" | "form",
    propsData?: { [p: string]: CustomHTMLProps } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => CustomHTMLProps },
    itemData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    childrenData?: { [p: string]: ReactNode } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    indexItem?: { [p: string]: any },
    index?: number,
    style?: CSSProperties,
    className?: string,
    options?: { [p: string]: Array<{ [p: string]: any }> },
    onSubmit?: () => void
}

export const pageAllRefs: { [p: string]: any } = {}
export const RenderLayerElement = (props: RenderLayerElementProps) => {
    const findId = props.item.Setting?.id ?? props.item.Id
    if (props.itemData && props.itemData[findId] && (props.type !== "card" || (props.itemData[findId] as any)(props.indexItem, props.index, props.methods))) {
        if (props.type === "card") return (props.itemData[findId] as any)(props.indexItem, props.index, props.methods)
        else return props.itemData[findId]
    } else return <CaculateLayer {...props} />
}

export const getValidLink = (link: string) => {
    if (link.startsWith("http")) return link
    if (ConfigData.regexGuid.test(link)) return ConfigData.imgUrlId + link
    else return ConfigData.fileUrl + link
}

export const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const CaculateLayer = (props: RenderLayerElementProps) => {
    const findId = props.item.Setting?.id ?? props.item.Id
    // init refs
    if (props.item.Type.toLowerCase() === ComponentType.form.toLowerCase() || props.item.Type.toLowerCase() === ComponentType.card.toLowerCase()) {
        pageAllRefs[findId] = (props.propsData?.[findId] as any)?.ref ?? useRef(null)
    }
    useEffect(() => {
        return () => { delete pageAllRefs[findId] }
    }, [])
    /** declare parameters */
    const ebigContextData = useEbigContext()
    const popupRef = useRef<any>(null)
    const location = useLocation() as any
    const params = useParams()
    const query = new URLSearchParams(location.search)
    const children = useMemo(() => props.list.filter(e => e.ParentId === props.item.Id), [props.list, props.item])
    const defferWatch = useDeferredValue(JSON.stringify(props.methods!.watch()))
    /** handle replace variables */
    const replaceThisVariables = (content: string) => {
        const replaceTmp = content.replace(replaceVariables, (m: string, p1: string) => {
            let getValue: any = m
            try {
                getValue = new Function(
                    "indexItem",
                    "Util",
                    "watch",
                    "location",
                    "query",
                    "params",
                    "user",
                    "lang",
                    "t",
                    "global",
                    `return ${p1.replace(/this/g, "indexItem")}`
                )({ ...props.indexItem, index: props.index }, Util, props.methods!.watch, location, query, params, ebigContextData.userData, ebigContextData.i18n.language, ebigContextData.i18n.t, ebigContextData.globalData)
            } catch (error) {
                console.error("item: ", props.item, " --- match: ", m, " --- p1: ", p1, " --- error: ", error)
            }
            return Array.isArray(getValue) ? JSON.stringify(getValue) : getValue
        })
        switch (replaceTmp.trim()) {
            case "undefined":
                return undefined;
            case "null":
                return null;
            default:
                try {
                    if (replaceTmp.startsWith("!")) return !JSON.parse(replaceTmp.substring(1))
                    else if (replaceTmp.startsWith("!!")) return !!JSON.parse(replaceTmp.substring(2))
                    else return JSON.parse(replaceTmp)
                } catch (error) {
                    return replaceTmp
                }
        }
    }
    const stateCustomProps = useMemo(() => {
        let tmp: { [p: string]: any } = {}
        const triggerState = props.item.State?.filter((e: any) => e.Trigger?.length)
        if (triggerState?.length) {
            for (const st of triggerState) {
                const checked = replaceThisVariables(st.Trigger)
                if (checked) {
                    st.Setting ??= {}
                    st.Setting.unmounted ??= false
                    tmp = { ...tmp, ...st.Setting }
                }
            }
        }
        return tmp
    }, [location.pathname, location.search, JSON.stringify(params), JSON.stringify(location.state), props.indexItem, defferWatch, ebigContextData.globalData, ebigContextData.userData, ebigContextData.i18n.language])
    // 
    const watchForCustomProps = useDeferredValue(stateCustomProps)

    const isMounted = useMemo(() => !(typeof watchForCustomProps?.unmounted === "boolean" ? watchForCustomProps.unmounted : (props.item.Setting?.unmounted ?? false)), [watchForCustomProps?.unmounted, props.item.Setting?.unmounted])
    /** Check unmounted */
    if (!isMounted) return null;
    else return <>
        <Popup ref={popupRef} />
        <ElementUI
            {...props}
            watchForCustomProps={watchForCustomProps}
            findId={findId}
            children={children}
            defferWatch={defferWatch}
            replaceThisVariables={replaceThisVariables}
            showHTMLPopup={({ className, clickOverlayClosePopup, hideOverlay, content }: { className?: string, clickOverlayClosePopup?: boolean, hideOverlay?: boolean, content: ReactNode | HTMLElement }) => {
                showPopup({ ref: popupRef, className, clickOverlayClosePopup, hideOverlay, content })
            }}
        />
    </>
}

interface ElementUIProps extends RenderLayerElementProps {
    findId: string,
    watchForCustomProps: { [p: string]: any },
    defferWatch: string,
    children: { [p: string]: any }[],
    replaceThisVariables: (content: string) => any,
    showHTMLPopup?: (params: { className?: string, clickOverlayClosePopup?: boolean, hideOverlay?: boolean, content: ReactNode | HTMLElement }) => void,
    [p: string]: any
}

const ElementUI = ({ findId, children, watchForCustomProps, replaceThisVariables, defferWatch, showHTMLPopup, ...props }: ElementUIProps) => {
    const ebigContextData = useEbigContext()
    const location = useLocation()
    const navigate = useNavigate()
    const params = useParams()
    // first processing item's setting 
    const memeCustomProps = useMemo(() => {
        let _props = { ...props.item.Setting }
        _props.style ??= {}
        _props.className ??= ""
        if (watchForCustomProps) {
            const { style, ...restOfCustomProps } = watchForCustomProps
            _props = { ..._props, ...restOfCustomProps }
            if (style) _props.style = { ..._props.style, ...style }
        }
        delete _props.action
        delete _props.unmounted
        delete _props.aspectRatio
        if (props.style) _props.style = { ..._props.style, ...props.style }
        delete _props.style.order
        if (props.className) _props.className = [..._props.className.split(" "), ...props.className.split(" ")].filter((cls, i, arr) => cls.length && arr.indexOf(cls) === i).join(" ")
        if (!regexResponsiveClassCol.test(_props.className)) delete _props.style["--gutter"]
        delete _props.action
        if (props.propsData && props.propsData[findId]) var extendProps = props.type === "card" ? (props.propsData[findId] as any)(props.indexItem, props.index, props.methods) : props.propsData[findId]
        if (extendProps) {
            if (extendProps.style) _props.style = { ..._props.style, ...extendProps.style }
            delete extendProps.style
            _props = { ..._props, ...extendProps }
        }
        return _props
    }, [props.item, props.propsData, props.indexItem, watchForCustomProps, JSON.stringify(props.style), props.className])
    const customProps = useDeferredValue(memeCustomProps)
    const customActions = useMemo(() => {
        const _propsActions = props.item.Setting?.action
        if (_propsActions?.length && Array.isArray(_propsActions)) {
            const tmpAct: any = {}
            Object.values(TriggerType).forEach(trigger => {
                const triggerActions: any = _propsActions.filter((e: any) => e.Type === trigger)
                const handleEvent = async (acts = [], event: any) => {
                    for (const [_, act] of acts.entries()) {
                        const actItem = act as { [p: string]: any }
                        switch (actItem.Action) {
                            case ActionType.back:
                                navigate(-1)
                                break;
                            case ActionType.navigate:
                                if (actItem.To) {
                                    if (regexGetVariables.test(actItem.To)) {
                                        const url = `${replaceThisVariables(actItem.To)}`
                                        if (url.includes("https")) window.open(url, "_blank")
                                        else navigate((url?.startsWith("/") ? "/" : "") + url.split("/").filter((e: string) => !!e.trim()).join("/"))
                                    } else if (actItem.To.includes("https")) {
                                        window.open(actItem.To, "_blank")
                                    } else {
                                        navigate(actItem.To.startsWith("/") ? actItem.To : `/${actItem.To}`)
                                    }
                                }
                                break;
                            case ActionType.submit:
                                if (actItem.To === "this form") props.onSubmit?.()
                                else pageAllRefs[actItem.To]?.current?.onSubmit()
                                return;
                            case ActionType.setValue:
                                props.methods!.setValue(actItem.NameField, new Function((isNaN(Number(actItem.Caculate)) && actItem.Calculate !== "true" && actItem.Calculate !== "false" && actItem.Calculate !== "null") ? `return \`${actItem.Caculate}\`` : `return ${actItem.Caculate}`)())
                                break;
                            case ActionType.showDialog:
                                showDialog({
                                    status: actItem.Status,
                                    title: actItem.Title,
                                    content: actItem.Content,
                                    submitTitle: actItem.SubmitTitle,
                                    onSubmit: async () => {
                                        if (actItem.Caculate) {
                                            await (new AsyncFunction(
                                                "entityData", "entityIndex", "tableName", "tableTitle", "nameField", "Util", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "showDialog", "showPopup", "ComponentStatus", "event", "methods", "useParams", "useNavigate", "useEbigContext",
                                                `${actItem.Caculate}` // This string can now safely contain the 'await' keyword
                                            ))(
                                                props.indexItem ?? props.methods?.getValues(),
                                                props.index,
                                                props.tbName,
                                                props.tbName?.split("_").map((e, i) => (i ? e.toLowerCase() : e)).join(" "),
                                                props.item.NameField,
                                                Util,
                                                DataController,
                                                randomGID,
                                                ToastMessage,
                                                BaseDA.uploadFiles,
                                                BaseDA.getFilesInfor,
                                                showDialog,
                                                showHTMLPopup,
                                                ComponentStatus,
                                                event,
                                                props.methods,
                                                () => params,
                                                () => navigate,
                                                () => ebigContextData
                                            )
                                        }
                                    }
                                })
                                return;
                            case ActionType.custom:
                                if (actItem.Caculate) {
                                    const asyncFuncResponse = await (new AsyncFunction(
                                        "entityData", "entityIndex", "tableName", "tableTitle", "nameField", "Util", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "showDialog", "showPopup", "ComponentStatus", "event", "methods", "useParams", "useNavigate", "location", "useEbigContext",
                                        `${actItem.Caculate}` // This string can now safely contain the 'await' keyword
                                    ))(
                                        props.indexItem ?? props.methods?.getValues(),
                                        props.index,
                                        props.tbName,
                                        props.tbName?.split("_").map((e, i) => (i ? e.toLowerCase() : e)).join(" "),
                                        props.item.NameField,
                                        Util,
                                        DataController,
                                        randomGID,
                                        ToastMessage,
                                        BaseDA.uploadFiles,
                                        BaseDA.getFilesInfor,
                                        showDialog,
                                        showHTMLPopup,
                                        ComponentStatus,
                                        event,
                                        props.methods,
                                        () => params,
                                        () => navigate,
                                        location,
                                        () => ebigContextData
                                    )
                                    if (asyncFuncResponse === false) return;
                                }
                                break;
                            case ActionType.loadMore:
                                if (pageAllRefs[actItem.loadingId]) {
                                    const cardData = pageAllRefs[actItem.loadingId].current?.data
                                    if (cardData.totalCount && cardData.data.length < cardData.totalCount) {
                                        pageAllRefs[actItem.loadingId].current.getData(Math.floor(cardData.data.length / pageAllRefs[actItem.loadingId].current.controller.size) + 1)
                                    }
                                }
                                return;
                            default:
                                break;
                        }
                    }
                }
                if (triggerActions.length) {
                    switch (trigger) {
                        case TriggerType.init:
                            tmpAct.onInit = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.dimiss:
                            tmpAct.onDimiss = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.click:
                            tmpAct.onClick = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.rightClick:
                            tmpAct.onContextMenu = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.hover:
                            tmpAct.onMouseOver = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.keydown:
                            tmpAct.onKeyDown = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.mouseenter:
                            tmpAct.onMouseEnter = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.mouseleave:
                            tmpAct.onMouseLeave = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.mousedown:
                            tmpAct.onMouseDown = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.mouseup:
                            tmpAct.onMouseUp = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.focus:
                            tmpAct.onFocus = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.change:
                            tmpAct.onChange = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.blur:
                            tmpAct.onBlur = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.submit:
                            tmpAct.onSubmit = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.scroll:
                            tmpAct.onScroll = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.loaded:
                            tmpAct.onLoaded = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.locationChange:
                            tmpAct.onLocationChange = (ev: any) => handleEvent(triggerActions, ev)
                            break;
                        case TriggerType.getOptions:
                            tmpAct.onGetOptions = triggerActions[0].Caculate
                            break;
                        default:
                            break;
                    }
                }
            })
            return tmpAct
        }
        return undefined
    }, [props.propsData, props.indexItem, watchForCustomProps, defferWatch, location.pathname, location.search, JSON.stringify(params), JSON.stringify(location.state), ebigContextData])

    // handle listener
    const handleListener = (funcString: string) => {
        const tmp: any = {}
        if (funcString.includes("entityData")) tmp.indexItem = JSON.stringify(props.indexItem ?? props.methods?.getValues())
        if (funcString.includes("location") || funcString.includes("useLocation") || funcString.includes("useParams")) {
            tmp.pathname = location.pathname
            tmp.search = location.search
            tmp.params = JSON.stringify(params)
            tmp.state = JSON.stringify(location.state)
        }
        if (funcString.includes("ebigContextData")) {
            tmp.language = ebigContextData.i18n.language
            tmp.globalData = JSON.stringify(ebigContextData.globalData)
            tmp.userData = JSON.stringify(ebigContextData.userData)
        }
        if (funcString.includes("methods.watch")) {
            const _tmpWatch = JSON.parse(defferWatch ?? "{}")
            // regex string to find what variables methods watch by pattern: methods.watch(variablename)
            const watchedVars: string[] = []
            // Match: methods.watch("varName") or methods.watch('varName')
            const singleWatchRegex = /methods\.watch\(\s*["']([^"']+)["']\s*\)/g
            let match: RegExpExecArray | null
            while ((match = singleWatchRegex.exec(funcString)) !== null) {
                watchedVars.push(match[1])
            }
            // Match: const { var1, var2, ...rest } = methods.watch()
            const destructureRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*methods\.watch\(\s*\)/g
            while ((match = destructureRegex.exec(funcString)) !== null) {
                const vars = match[1].split(",").map(v => v.trim().replace(/^\.{3}/, "")).filter(Boolean)
                watchedVars.push(...vars)
            }
            // Match: const|let|var varName = methods.watch() then find varName.prop1, varName.prop2, varName["prop3"], varName['prop4']
            const assignRegex = /(?:const|let|var)\s+(\w+)\s*=\s*methods\.watch\(\s*\)/g
            while ((match = assignRegex.exec(funcString)) !== null) {
                const varName = match[1]
                // Match varName.property (dot notation)
                const dotAccessRegex = new RegExp(`${varName}\\.(\\w+)`, "g")
                let propMatch: RegExpExecArray | null
                while ((propMatch = dotAccessRegex.exec(funcString)) !== null) {
                    if (!watchedVars.includes(propMatch[1])) watchedVars.push(propMatch[1])
                }
                // Match varName["property"] or varName['property'] (bracket notation)
                const bracketAccessRegex = new RegExp(`${varName}\\[\\s*["']([^"']+)["']\\s*\\]`, "g")
                while ((propMatch = bracketAccessRegex.exec(funcString)) !== null) {
                    if (!watchedVars.includes(propMatch[1])) watchedVars.push(propMatch[1])
                }
            }
            if (watchedVars.length) {
                const filtered: { [k: string]: any } = {}
                for (const key of watchedVars) {
                    if (key in _tmpWatch) filtered[key] = _tmpWatch[key]
                }
                tmp.watch = JSON.stringify(filtered)
            } else {
                tmp.watch = JSON.stringify(_tmpWatch)
            }
        }
        return tmp
    }

    // handle get options of select dropdown component
    const [handleOptions, setHandleOptions] = useState<any>(null)
    const getOptionsLisener = useMemo(() => {
        if (!customActions?.onGetOptions) return null;
        return handleListener(customActions.onGetOptions)
    }, [customActions?.onGetOptions, location, ebigContextData.i18n.language, ebigContextData.globalData, ebigContextData.userData, defferWatch, props.indexItem])

    const dropdownOnGetOptions = async (event?: any) => {
        const getDataFunc = async () => {
            let asyncFuncResponse = await (new AsyncFunction(
                "entityData", "entityIndex", "tableName", "tableTitle", "Util", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "showDialog", "showPopup", "ComponentStatus", "event", "methods", "useParams", "useNavigate", "location", "useEbigContext",
                `${customActions.onGetOptions}` // This string can now safely contain the 'await' keyword
            ))(
                props.indexItem ?? props.methods?.getValues(),
                props.index,
                props.tbName,
                props.tbName?.split("_").map((e, i) => (i ? e.toLowerCase() : e)).join(" "),
                Util,
                DataController,
                randomGID,
                ToastMessage,
                BaseDA.uploadFiles,
                BaseDA.getFilesInfor,
                showDialog,
                showHTMLPopup,
                ComponentStatus,
                event,
                props.methods,
                () => params,
                () => navigate,
                location,
                () => ebigContextData
            )
            return asyncFuncResponse
        }
        const res = await getDataFunc()
        return res
    }

    useEffect(() => {
        if (customActions?.onGetOptions) {
            switch (props.item.Type) {
                case ComponentType.selectDropdown:
                    dropdownOnGetOptions().then(setHandleOptions)
                    break;
                default:
                    break;
            }
        }
    }, [customActions?.onGetOptions, getOptionsLisener?.pathname, getOptionsLisener?.search, getOptionsLisener?.params, getOptionsLisener?.state, getOptionsLisener?.language, getOptionsLisener?.globalData, getOptionsLisener?.userData, getOptionsLisener?.watch, getOptionsLisener?.indexItem])

    const _options = useMemo(() => {
        if (handleOptions) return Array.isArray(handleOptions.data) ? handleOptions.data : []
        if (!props.options || !props.item.NameField?.length) return undefined
        const keys = props.item.NameField.split(".")
        const keyname = keys.shift()
        const tmp = props.options?.[`${keyname}`] ?? props.options?.[`${keyname}_Options`] ?? props.options?.[`_${keyname}`]
        if (tmp?.length) return tmp
        if (!keys.length && props.cols?.length) {
            const tmpCol = props.cols?.find(e => e.Name === keyname)
            if (tmpCol) {
                if (tmpCol.DataType === FEDataType.FILE) return props.options?.["_files"]
                return tmpCol?.Form?.Options
            }
        }
        return undefined
    }, [props.item.NameField, props.options, props.cols, handleOptions])

    // handle data value of input data components: textfield, selectdropdown, radio, checkbox, switch, textarea,...
    const dataValue = useMemo(() => {
        if (props.type === "page" || !props.item.NameField?.length || !props.indexItem) return undefined
        const keys = props.item.NameField.split(".")
        if (keys.length > 1) {
            const _rel = props.rels?.find((e: any) => e.TableName === keys[0].replace("Id", "") && e.Name === keys[1])
            if (!_rel) return undefined
            let tmpValue = _options?.find((e: any) => e && props.indexItem![keys[0]]?.includes(e.Id))?.[keys[1]]
            switch (_rel.DataType) {
                case FEDataType.FILE:
                    if (tmpValue?.length) {
                        if (!Array.isArray(tmpValue)) {
                            tmpValue = tmpValue.split(",").map((fid: string) => {
                                if (ConfigData.regexGuid.test(fid)) {
                                    const tmpF = _options?.find((f: any) => f.Id === fid)
                                    if (!tmpF) return undefined;
                                    return { id: tmpF.Id, name: tmpF.Name, size: tmpF.Size, type: tmpF.Type, url: tmpF.Url }
                                } else {
                                    const _url = getValidLink(fid)
                                    const _type = fid.split(".").pop()?.toLowerCase()
                                    return { id: fid, name: fid, url: _url, type: imgFileTypes.includes(`.${_type}`) ? `image/${_type}` : _type }
                                }
                            }).filter((f: any) => !!f)
                        }
                    }
                    break;
                case FEDataType.HTML:
                    tmpValue = { __html: tmpValue }
                    break;
                case FEDataType.MONEY:
                    tmpValue = tmpValue ? Util.formatCurrency(tmpValue) : undefined
                    break;
                case FEDataType.DATE:
                    tmpValue = tmpValue ? Util.dateToString(new Date(typeof tmpValue === 'string' ? parseInt(tmpValue) : tmpValue)) : undefined
                    break;
                case FEDataType.DATETIME:
                    tmpValue = tmpValue ? Util.dateToString(new Date(typeof tmpValue === 'string' ? parseInt(tmpValue) : tmpValue), "dd/mm/yyyy hh:mm") : undefined
                    break;
                default:
                    if (_rel.Form?.Options?.length) {
                        if (_rel.Form.ComponentType === "SelectMultiple" || props.item.Setting?.multiple) {
                            tmpValue = _rel.Form.Options.filter((e: any) => {
                                switch (_rel.DataType) {
                                    case FEDataType.BOOLEAN:
                                        return tmpValue === e.id || `${tmpValue}` === `${e.id}`
                                    default:
                                        return tmpValue?.includes(e.id);
                                }
                            }).map((e: any) => e.name).join(",")
                        } else {
                            tmpValue = _rel.Form.Options.find((e: any) => e.id === tmpValue)?.name ?? tmpValue
                        }
                    }
                    break;
            }
            return tmpValue
        } else {
            const _col = props.cols?.find((e: any) => e.Name === props.item.NameField)
            if (!_col) return undefined
            let tmpValue = props.indexItem[props.item.NameField]
            switch (_col.DataType) {
                case FEDataType.FILE:
                    if (tmpValue?.length) {
                        if (!Array.isArray(tmpValue)) {
                            tmpValue = tmpValue.split(",").map((fid: string) => {
                                if (ConfigData.regexGuid.test(fid)) {
                                    const tmpF = _options?.find((f: any) => f.Id === fid)
                                    if (!tmpF) return undefined;
                                    return { id: tmpF.Id, name: tmpF.Name, size: tmpF.Size, type: tmpF.Type, url: tmpF.Url }
                                } else {
                                    const _url = getValidLink(fid)
                                    const _type = fid.split(".").pop()?.toLowerCase()
                                    return { id: fid, name: fid, url: _url, type: imgFileTypes.includes(`.${_type}`) ? `image/${_type}` : _type }
                                }
                            }).filter((f: any) => !!f)
                        }
                    }
                    break;
                case FEDataType.HTML:
                    tmpValue = { __html: tmpValue }
                    break;
                case FEDataType.MONEY:
                    tmpValue = tmpValue ? Util.formatCurrency(tmpValue) : undefined
                    break;
                case FEDataType.DATE:
                    tmpValue = tmpValue ? Util.dateToString((tmpValue instanceof Date) ? tmpValue : new Date(typeof tmpValue === 'string' ? parseInt(tmpValue) : tmpValue)) : undefined
                    break;
                case FEDataType.DATETIME:
                    tmpValue = tmpValue ? Util.dateToString((tmpValue instanceof Date) ? tmpValue : new Date(typeof tmpValue === 'string' ? parseInt(tmpValue) : tmpValue), "dd/mm/yyyy hh:mm") : undefined
                    break;
                default:
                    if (_col.Form?.Options?.length) {
                        if (_col.Form.ComponentType === "SelectMultiple" || props.item.Setting?.multiple) {
                            tmpValue = _col.Form.Options.filter((e: any) => (_col.DataType === FEDataType.BOOLEAN ? (tmpValue === e.id || `${tmpValue}` === `${e.id}`) : tmpValue?.includes(e.id))).map((e: any) => e.name).join(",")
                        } else {
                            tmpValue = _col.Form.Options.find((e: any) => e.id === tmpValue)?.name ?? tmpValue
                        }
                    }
                    break;
            }
            return tmpValue
        }
    }, [props.indexItem, props.item, props.cols, props.rels, _options])
    /***/
    const typeProps = useMemo(() => {
        let tmpProps = { ...customProps }
        if (regexGetVariables.test(tmpProps.id)) tmpProps.id = replaceThisVariables(tmpProps.id)
        if (regexGetVariables.test(tmpProps.className)) tmpProps.className = replaceThisVariables(tmpProps.className)
        if (props.item.NameField && tmpProps.validate?.some((v: any) => v.type === ValidateType.required)) tmpProps.required = true
        switch (props.item.Type) {
            case ComponentType.form:
            case ComponentType.view:
            case ComponentType.card:
                if (!tmpProps.data && tmpProps.controller && tmpProps.controller !== "all") {
                    let newController = { ...tmpProps.controller }
                    if (newController.searchRaw && regexGetVariables.test(newController.searchRaw)) {
                        const newSearchRaw = replaceThisVariables(newController.searchRaw)
                        newController.searchRaw = newSearchRaw
                    }
                    if (newController.page && regexGetVariables.test(`${newController.page}`)) {
                        const newPageIndex = replaceThisVariables(`${newController.page}`)
                        if (newPageIndex) newController.page = newPageIndex
                    }
                    if (newController.size && regexGetVariables.test(`${newController.size}`)) {
                        const newPageSize = replaceThisVariables(`${newController.size}`)
                        if (newPageSize) newController.size = newPageSize
                    }
                    if (newController.ids && regexGetVariables.test(newController.ids)) {
                        if (regexGetVariableByThis.test(newController.ids)) {
                            const relativeModule = regexGetVariableByThis.exec(newController.ids)![1]
                            tmpProps.cardData = (props.methods?.watch(`_${relativeModule}`) ?? []).filter((e: any) => props.indexItem?.[relativeModule]?.includes(e.Id))
                        } else {
                            const getByIds = replaceThisVariables(newController.ids)
                            newController.ids = getByIds
                        }
                    }
                    tmpProps.controller = newController
                }
                break;
            case ComponentType.navLink:
                if (dataValue && dataValue.backgroundImage) tmpProps = { ...customProps, style: { ...customProps.style, ...dataValue } }
                if (tmpProps.to && regexGetVariables.test(tmpProps.to)) {
                    const url = `${replaceThisVariables(tmpProps.to)}`
                    tmpProps.to = url
                }
                break;
            case ComponentType.text:
                if (regexGetVariables.test(tmpProps.value)) tmpProps.value = replaceThisVariables(tmpProps.value)
                break;
            case ComponentType.img:
            case ComponentType.video:
            case ComponentType.audio:
            case ComponentType.iframe:
            case ComponentType.icon:
                if (regexGetVariables.test(tmpProps.src)) tmpProps.src = replaceThisVariables(tmpProps.src)
                break;
            case ComponentType.pagination:
                if (tmpProps.currentPage && regexGetVariables.test(tmpProps.currentPage)) {
                    const newCurrentPage = replaceThisVariables(tmpProps.currentPage)
                    if (newCurrentPage) tmpProps.currentPage = newCurrentPage
                }
                if (tmpProps.itemPerPage && regexGetVariables.test(`${tmpProps.itemPerPage}`)) {
                    const newItemPerPage = replaceThisVariables(tmpProps.itemPerPage)
                    if (newItemPerPage) tmpProps.itemPerPage = newItemPerPage
                }
                if (tmpProps.totalItem && regexGetVariables.test(`${tmpProps.totalItem}`)) {
                    const newTotalItem = replaceThisVariables(tmpProps.totalItem)
                    if (newTotalItem) tmpProps.totalItem = newTotalItem
                }
                if (typeof tmpProps.currentPage === "string") tmpProps.currentPage = parseInt(tmpProps.currentPage)
                if (typeof tmpProps.itemPerPage === "string") tmpProps.itemPerPage = parseInt(tmpProps.itemPerPage)
                if (typeof tmpProps.totalItem === "string") tmpProps.totalItem = parseInt(tmpProps.totalItem)
                break;
            default:
                switch (props.item.Type) {
                    case ComponentType.button:
                        if (tmpProps.label && regexGetVariables.test(tmpProps.label)) tmpProps.label = replaceThisVariables(tmpProps.label)
                        break;
                    case "Select1":
                    case "SelectMultiple":
                    case ComponentType.selectDropdown:
                        if (customProps.onGetOptions) {
                            tmpProps.getOptions = dropdownOnGetOptions
                            delete tmpProps.onGetOptions
                        } else tmpProps.getOptions = props.rels?.find(e => e.Column === props.item.NameField)?.getOptions
                        if (!props.item.NameField?.length && regexGetVariables.test(tmpProps.value)) tmpProps.value = replaceThisVariables(tmpProps.value)
                        if ((props.item.Type === "SelectMultiple" || tmpProps.multiple) && tmpProps.value && !Array.isArray(tmpProps.value)) tmpProps.value = []
                        break;
                    case ComponentType.textArea:
                    case ComponentType.textField:
                        if (!props.item.NameField?.length && regexGetVariables.test(tmpProps.defaultValue)) tmpProps.defaultValue = replaceThisVariables(tmpProps.defaultValue)
                        break;
                    case ComponentType.datePicker:
                    case ComponentType.dateTimePicker:
                        if (props.item.NameField?.length) {
                            const propsColDataType = props.cols?.find(e => e.Name === props.item.NameField)?.DataType
                            switch (propsColDataType) {
                                case FEDataType.DATE:
                                    tmpProps.pickerType = "date"
                                    break;
                                case FEDataType.DATETIME:
                                    tmpProps.pickerType = "datetime"
                                    tmpProps.pickOnly = true
                                    break;
                                case FEDataType.PASSWORD:
                                    tmpProps.IsPassword = true
                                    break;
                                default:
                                    break;
                            }
                        } else if (regexGetVariables.test(tmpProps.value)) tmpProps.value = replaceThisVariables(tmpProps.value)
                        break;
                    case ComponentType.radio:
                        if (!props.item.NameField?.length && regexGetVariables.test(tmpProps.value)) tmpProps.value = replaceThisVariables(tmpProps.value)
                        if (!props.item.NameField?.length && regexGetVariables.test(tmpProps.checked)) tmpProps.checked = replaceThisVariables(tmpProps.checked)
                        break;
                    default:
                        if (!props.item.NameField?.length && regexGetVariables.test(tmpProps.value)) tmpProps.value = replaceThisVariables(tmpProps.value)
                        break;
                }
                if (tmpProps.placeholder && regexGetVariables.test(tmpProps.placeholder)) tmpProps.placeholder = replaceThisVariables(tmpProps.placeholder)
                if (children.length) {
                    const iconPrefix = children.find(e => e.Setting.type === "prefix")
                    const iconSuffix = children.find(e => e.Setting.type === "suffix")
                    if (iconPrefix) tmpProps.prefix = <RenderLayerElement {...props} item={iconPrefix} style={undefined} className={undefined} />
                    if (iconSuffix) tmpProps.suffix = <RenderLayerElement {...props} item={iconSuffix} style={undefined} className={undefined} />
                }
                break;
        }
        return tmpProps
    }, [JSON.stringify(customProps), props.indexItem, JSON.stringify(dataValue), defferWatch, location.pathname, location.search, JSON.stringify(params), JSON.stringify(location.state), ebigContextData.globalData, ebigContextData.userData, ebigContextData.i18n.language])

    const htmlElementRef = useRef<any | any[]>(null)

    useEffect(() => {
        if (customActions?.onInit) customActions.onInit(pageAllRefs[findId]?.current ?? htmlElementRef.current)
    }, [!!customActions?.onInit])

    useEffect(() => {
        if (customActions?.onDimiss) {
            return () => { customActions.onDimiss(pageAllRefs[findId]?.current ?? htmlElementRef.current) }
        }
    }, [!!customActions?.onDimiss])

    useEffect(() => {
        if (customActions?.onLocationChange) customActions.onLocationChange(pageAllRefs[findId]?.current ?? htmlElementRef.current)
    }, [!!customActions?.onLocationChange, location.pathname, location.search, JSON.stringify(params), JSON.stringify(location.state)])

    const getDataLisener = useMemo(() => {
        if (!customProps.data) return null;
        return handleListener(customProps.data)
    }, [customProps.data, location, ebigContextData.i18n.language, ebigContextData.globalData, ebigContextData.userData, defferWatch, props.indexItem])

    const [handleFormCardViewData, setHandleFormCardViewData] = useState<any>(null)
    useEffect(() => {
        if (customProps.data) {
            switch (props.item.Type) {
                case ComponentType.form:
                case ComponentType.view:
                case ComponentType.card:
                    const getDataFunc = async () => {
                        let asyncFuncResponse = await (new AsyncFunction(
                            "entityData", "entityIndex", "tableName", "tableTitle", "Util", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "showDialog", "showPopup", "ComponentStatus", "methods", "useParams", "useNavigate", "location", "useEbigContext",
                            `${customProps.data}` // This string can now safely contain the 'await' keyword
                        ))(
                            props.indexItem ?? props.methods?.getValues(),
                            props.index,
                            props.tbName,
                            props.tbName?.split("_").map((e, i) => (i ? e.toLowerCase() : e)).join(" "),
                            Util,
                            DataController,
                            randomGID,
                            ToastMessage,
                            BaseDA.uploadFiles,
                            BaseDA.getFilesInfor,
                            showDialog,
                            showHTMLPopup,
                            ComponentStatus,
                            props.methods,
                            () => params,
                            () => navigate,
                            location,
                            () => ebigContextData
                        )
                        return asyncFuncResponse
                    }
                    getDataFunc().then(setHandleFormCardViewData)
                    break;
                default:
                    break;
            }
        }
    }, [customProps.data, getDataLisener?.pathname, getDataLisener?.search, getDataLisener?.params, getDataLisener?.state, getDataLisener?.language, getDataLisener?.globalData, getDataLisener?.userData, getDataLisener?.watch, getDataLisener?.indexItem])


    // not functions of react 
    const { onLocationChange, onInit, onDimiss, ...restOfActions } = (customActions ?? {})

    switch (props.item.Type) {
        case ComponentType.navLink:
        case ComponentType.container:
            if (props.childrenData && props.childrenData[findId]) var childComponent = props.type === "card" ? (props.childrenData[findId] as any)(props.indexItem, props.index, props.methods) : props.childrenData[findId]
            const isRow = typeProps.className?.split(" ").includes("row")
            let gutterStyle: any = undefined
            if (isRow) {
                const gutter = typeProps.style?.columnGap ?? typeProps.style?.gap ?? 0
                gutterStyle = { "--gutter": isNaN(gutter) ? gutter : `${gutter}px` }
            }
            if (dataValue && dataValue.backgroundImage) var containerProps: any = { ...typeProps, style: { ...typeProps.style, ...dataValue } }
            const dataValueProps = { ...(containerProps ?? typeProps), ...restOfActions }
            delete dataValueProps.emptyElement
            delete dataValueProps.onLoaded
            const getType = props.item.Type === ComponentType.navLink ? "a" : (props.type === "form" && !props.item.ParentId) ? "form" : dataValueProps.type
            if (Array.isArray(dataValue)) {
                htmlElementRef.current = []
                return dataValue.map((dataValueItem, i) => {
                    dataValueProps.indexItem = { ...props.indexItem, [props.item.NameField.split(".").length > 1 ? props.item.NameField.split(".")[1] : props.item.NameField]: dataValueItem }
                    return <RenderContainer
                        key={`${dataValueItem}-${i}`}
                        ref={r => {
                            if (r && Array.isArray(htmlElementRef.current)) htmlElementRef.current.push(r)
                        }}
                        {...dataValueProps}
                        type={getType}
                    >
                        {childComponent ??
                            (typeProps.className?.includes(LayoutElement.body) ?
                                <>
                                    {children.map(e => <RenderLayerElement key={e.Id} {...props} item={e} style={gutterStyle} className={undefined} />)}
                                    {props.bodyChildren}
                                </> :
                                children.map(e => <RenderLayerElement key={e.Id} {...props} item={e} style={gutterStyle} className={undefined} />)
                            )}
                    </RenderContainer>
                })
            } else {
                return <RenderContainer ref={htmlElementRef} {...dataValueProps} type={getType}>
                    {childComponent ??
                        (typeProps.className?.includes(LayoutElement.body) ?
                            <>
                                {children.map(e => <RenderLayerElement key={e.Id} {...props} item={e} style={gutterStyle} className={undefined} />)}
                                {props.bodyChildren}
                            </> :
                            children.map(e => <RenderLayerElement key={e.Id} {...props} item={e} style={gutterStyle} className={undefined} />)
                        )}
                </RenderContainer>
            }
        case ComponentType.text:
            if (props.item.NameField) {
                if (Array.isArray(dataValue)) { // list file
                    return dataValue.map((f, i) => <FileName key={f.id + "-" + i} file={f} index={i} {...typeProps} {...restOfActions} />)
                } else if (typeof dataValue === "object") typeProps.html = dataValue?.["__html"] ?? ""
                else typeProps.value = dataValue
            }
            return <CustomText {...typeProps} {...restOfActions} />
        case ComponentType.img:
            if (!typeProps.src?.length) typeProps.src = handleErrorImgSrc
            if (props.item.NameField && !!dataValue?.length) {
                if (Array.isArray(dataValue)) {
                    htmlElementRef.current = []
                    return dataValue.map((f, i) => <img
                        key={f.id + "-" + i}
                        ref={r => {
                            if (r && Array.isArray(htmlElementRef.current)) htmlElementRef.current.push(r)
                        }}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(ev) => { ev.currentTarget.src = handleErrorImgSrc }}
                        {...typeProps}
                        {...restOfActions}
                        src={ConfigData.regexGuid.test(f.id) ? (ConfigData.imgUrlId + f.id) : f.url}
                    />)
                } else typeProps.src = getValidLink(dataValue)
            }
            return <img ref={htmlElementRef} alt="" referrerPolicy="no-referrer" onError={(ev) => { ev.currentTarget.src = handleErrorImgSrc }} {...typeProps} {...restOfActions} />
        case ComponentType.video:
            if (props.item.NameField && !!dataValue?.length) {
                if (Array.isArray(dataValue)) {
                    htmlElementRef.current = []
                    return dataValue.map((f, i) => <VideoPlayer
                        key={f.id + "-" + i}
                        ref={r => {
                            if (r && Array.isArray(htmlElementRef.current)) htmlElementRef.current.push(r)
                        }}
                        {...typeProps}
                        {...restOfActions}
                        src={f.url}
                    />)
                } else typeProps.src = getValidLink(dataValue)
            }
            return <VideoPlayer ref={htmlElementRef} {...typeProps} {...restOfActions} />
        case ComponentType.audio:
            if (props.item.NameField && !!dataValue?.length) {
                if (Array.isArray(dataValue)) {
                    htmlElementRef.current = []
                    return dataValue.map((f, i) => <AudioPlayer
                        key={f.id + "-" + i}
                        ref={r => {
                            if (r && Array.isArray(htmlElementRef.current)) htmlElementRef.current.push(r)
                        }}
                        {...typeProps}
                        {...restOfActions}
                        src={f.url}
                    />)
                } else typeProps.src = getValidLink(dataValue)
            }
            return <AudioPlayer ref={htmlElementRef} {...typeProps} {...restOfActions} />
        case ComponentType.iframe:
            if (props.item.NameField && !!dataValue?.length) {
                if (Array.isArray(dataValue)) {
                    htmlElementRef.current = []
                    return dataValue.map((f, i) => {
                        return <IframePlayer
                            key={f.id + "-" + i}
                            ref={r => {
                                if (r && Array.isArray(htmlElementRef.current)) htmlElementRef.current.push(r)
                            }}
                            referrerPolicy="no-referrer" {...typeProps} {...restOfActions} src={f.url} />
                    })
                } else typeProps.src = getValidLink(dataValue)
            }
            return <IframePlayer ref={htmlElementRef} referrerPolicy="no-referrer" {...typeProps} {...restOfActions} />
        case ComponentType.rate:
            if (props.item.NameField) return <Rating ref={htmlElementRef} {...typeProps} {...restOfActions} value={dataValue} />
            else return <Rating ref={htmlElementRef} {...typeProps} {...restOfActions} />
        case ComponentType.progressBar:
            if (props.item.NameField) return <ProgressBar ref={htmlElementRef} {...typeProps} {...restOfActions} progressBarOnly percent={dataValue} />
            else return <ProgressBar ref={htmlElementRef} {...typeProps} {...restOfActions} progressBarOnly />
        case ComponentType.progressCircle:
            if (props.item.NameField) return <ProgressCircle ref={htmlElementRef} {...typeProps} {...restOfActions} percent={dataValue} />
            return <ProgressCircle ref={htmlElementRef} {...typeProps} {...restOfActions} />
        case ComponentType.icon:
            if (dataValue) return <Ebigicon ref={htmlElementRef} {...typeProps} {...restOfActions} src={dataValue} />
            else if (props.item.NameField) return null
            else return <Ebigicon ref={htmlElementRef} {...typeProps} {...restOfActions} />
        case ComponentType.chart:
            return <ChartById {...typeProps} {...restOfActions} id={typeProps.chartId} ref={pageAllRefs[findId]} />
        case "form":
        case ComponentType.form:
            if (props.itemData) typeProps.itemData = typeProps.itemData ? { ...props.itemData, ...typeProps.itemData } : props.itemData
            if (props.childrenData) typeProps.childrenData = typeProps.childrenData ? { ...props.childrenData, ...typeProps.childrenData } : props.childrenData
            if (props.propsData) typeProps.propsData = typeProps.propsData ? { ...props.propsData, ...typeProps.propsData } : props.propsData
            if (customProps.data) typeProps.data = handleFormCardViewData
            return <FormById  {...typeProps} id={typeProps.formId} ref={pageAllRefs[findId]} />
        case "card":
        case ComponentType.card:
            if (props.itemData) typeProps.itemData = typeProps.itemData ? { ...props.itemData, ...typeProps.itemData } : props.itemData
            if (props.childrenData) typeProps.childrenData = typeProps.childrenData ? { ...props.childrenData, ...typeProps.childrenData } : props.childrenData
            if (props.propsData) typeProps.propsData = typeProps.propsData ? { ...props.propsData, ...typeProps.propsData } : props.propsData
            if (customProps.data) typeProps.data = handleFormCardViewData ?? { data: [] }
            return <CardById {...typeProps} {...restOfActions} id={typeProps.cardId} ref={pageAllRefs[findId]} />
        case "view":
        case ComponentType.view:
            if (props.itemData) typeProps.itemData = typeProps.itemData ? { ...props.itemData, ...typeProps.itemData } : props.itemData
            if (props.childrenData) typeProps.childrenData = typeProps.childrenData ? { ...props.childrenData, ...typeProps.childrenData } : props.childrenData
            if (props.propsData) typeProps.propsData = typeProps.propsData ? { ...props.propsData, ...typeProps.propsData } : props.propsData
            if (customProps.data) typeProps.data = handleFormCardViewData
            return <ViewById {...typeProps} {...restOfActions} id={typeProps.viewId} ref={pageAllRefs[findId]} />
        case ComponentType.button:
            return <SimpleButton ref={htmlElementRef} {...typeProps} {...restOfActions} />
        case ComponentType.textField:
            const { IsPassword, ...typeProps2 } = typeProps
            if (IsPassword)
                return <FInputPassword ref={htmlElementRef} {...typeProps2} {...restOfActions} name={props.item.NameField} methods={props.methods} />
            else
                return <FTextField ref={htmlElementRef} {...typeProps2} {...restOfActions} name={props.item.NameField} methods={props.methods} />
        case ComponentType.textArea:
            return <FTextArea ref={htmlElementRef} {...typeProps} {...restOfActions} name={props.item.NameField} methods={props.methods} />
        case ComponentType.radio:
            if (_options?.length) return <FGroupRadioButton {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} options={_options} />
            else return <FRadioButton ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case ComponentType.checkbox:
            if (_options?.length) return <FGroupCheckbox {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} options={_options} />
            else return <FCheckbox ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case ComponentType.switch:
            return <FSwitch ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case "Select1":
        case "SelectMultiple":
        case ComponentType.selectDropdown:
            if (props.item.Setting?.multiple || props.item.Type === "SelectMultiple") typeProps.multiple = true
            return <FSelectDropdownForm ref={htmlElementRef} {...typeProps} {...restOfActions} key={props.item.Id} methods={props.methods} name={props.item.NameField} options={_options} />
        case ComponentType.colorPicker:
            return <FColorPicker ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case ComponentType.numberPicker:
            return <FNumberPicker ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case ComponentType.dateTimePicker:
        case ComponentType.datePicker:
            return <FDateTimePicker ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case ComponentType.upload:
            return <FUploadMultipleFileType ref={htmlElementRef} {...typeProps} {...restOfActions} methods={props.methods} name={props.item.NameField} />
        case ComponentType.ckEditor:
            return <CustomCkEditor5
                {...typeProps}
                {...restOfActions}
                methods={props.methods}
                extraPlugins={[
                    function (editor: any) {
                        editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => new CkEditorUploadAdapter(loader)
                    }
                ]}
                value={props.item.NameField ? props.methods?.watch(props.item.NameField) : typeProps.value}
                onBlur={(_: any, editor: any) => {
                    const editorData = editor.getData()
                    if (props.item.NameField) props.methods?.setValue(props.item.NameField, editorData)
                    if (restOfActions.onBlur) restOfActions.onBlur(editorData)
                }}
            />
        case ComponentType.pagination:
            return <Pagination simpleStyle {...typeProps} {...restOfActions} />
        default:
            return <div {...typeProps} {...restOfActions} />
    }
}

const RenderContainer = forwardRef<any, { type: "label" | "p" | "form" | "a" | "div", children: ReactNode, [key: string]: any }>(({ type, children, indexItem, ...props }, ref) => {
    switch (type) {
        case "label":
            return <label ref={ref} {...props}>{children}</label>
        case "p":
            return <p ref={ref} {...props}>{children}</p>
        case "form":
            return <form ref={ref} {...props}>{children}</form>
        case "a":
            return <NavLink ref={ref} {...(props as any)}>{children}</NavLink>
        case "div":
        default:
            return <div ref={ref} {...props}>{children}</div>
    }
})

const FileName = ({ file, index, ...props }: { type?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6", file: { [k: string]: any }, index: number, maxLine?: number, className?: string, style?: CSSProperties, value?: string, [k: string]: any }) => {
    return <>
        {!!index && <span className={props.className?.split(" ")?.filter(c => !c.includes("col"))?.join(" ")} style={{ ...(props.style ?? {}), width: "fit-content", maxWidth: "fit-content", color: "--neutral-text-body-reverse-color" }}>, </span>}
        <CustomText {...props} value={file.name?.split("/").pop() ?? "unknown"} onClick={() => { window.open(file.url, "_blank") }} />
    </>
}

const CustomText = forwardRef<any, { type?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6", html?: string, maxLine?: number, className?: string, style?: CSSProperties, value?: string, [k: string]: any }>(({ type = "div", ...props }, ref) => {
    const [convertContentHtml, setConvertContentHtml] = useState<string>("")

    useEffect(() => {
        if (props.html && ConfigData.regexGuid.test(props.html)) {
            BaseDA.get(`${ConfigData.ebigCdn}/${ConfigData.pid}/${props.html}`).then((result: any) => {
                if (typeof result === 'string') setConvertContentHtml(result)
                else setConvertContentHtml(props.html!)
            })
        } else if (props.html) setConvertContentHtml(props.html)
    }, [props.html])

    const customProps = useMemo(() => {
        if (!props.value && !props.html) return null
        let _props: any = { ...props, style: { ...(props.style ?? {}) } }
        delete _props.value
        _props.style ??= {}
        if (props.maxLine && type !== "div") {
            _props.style['--max-line'] = props.maxLine
            delete _props.maxLine
        }
        if (props.html) _props.dangerouslySetInnerHTML = { __html: convertContentHtml }
        if (type && type !== "div") _props.className = `${props.maxLine ? "comp-text" : ""}${props.html ? "-innerhtml" : ""} ${props.className ?? ""}`
        else _props.className = props.className
        delete _props.type
        delete _props.html
        return _props
    }, [convertContentHtml, props.className, props])

    if (!props.value && !props.html) return null
    else
        switch (type) {
            case "p":
                if (props.html) return <p ref={ref} {...customProps} />
                else return <p ref={ref} {...customProps}>{props.value}</p>
            case "span":
                if (props.html) return <span ref={ref} {...customProps} />
                else return <span ref={ref} {...customProps}>{props.value}</span>
            case "h1":
                if (props.html) return <h1 ref={ref} {...customProps} />
                else return <h1 ref={ref} {...customProps}>{props.value}</h1>
            case "h2":
                if (props.html) return <h2 ref={ref} {...customProps} />
                else return <h2 ref={ref} {...customProps}>{props.value}</h2>
            case "h3":
                if (props.html) return <h3 ref={ref} {...customProps} />
                else return <h3 ref={ref} {...customProps}>{props.value}</h3>
            case "h4":
                if (props.html) return <h4 ref={ref} {...customProps} />
                else return <h4 ref={ref} {...customProps}>{props.value}</h4>
            case "h5":
                if (props.html) return <h5 ref={ref} {...customProps} />
                else return <h5 ref={ref} {...customProps}>{props.value}</h5>
            case "h6":
                if (props.html) return <h6 ref={ref} {...customProps} />
                else return <h6 ref={ref} {...customProps}>{props.value}</h6>
            default:
                const { onMouseOver, ...tmpProps } = customProps
                return <Text ref={ref} {...tmpProps} onHover={onMouseOver}>{props.value}</Text>
        }
})

interface PageByIdProps extends Props {
    id: string,
    /**
     * type function only for card element \n
     * custom props of layer by id. Ex: { "gid": { style: { width: "60rem", backgroundColor: "red" }, className: "my-class" } }
     * */
    propsData?: { [p: string]: CustomHTMLProps } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => CustomHTMLProps },
    /**
     * type function only for card element \n
     * replace children of parent layer by id. Ex: { "gid": <Text className="heading-7">Example</Text> }
     * */
    childrenData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    /**
     * type function only for card element \n
     * replace layer by id. Ex: { "gid": <Text className="heading-7">Example</Text> }
     * */
    itemData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    onlyLayout?: boolean,
    onlyBody?: boolean,
    /** children of layout-body */
    children?: ReactNode;
}

export const globalTableCache = new Map()
const cacheLayout = new Map()
export const PageById = ({ childrenData, ...props }: PageByIdProps) => {
    const methods = useForm({ shouldFocusError: false })
    const pageController = new TableController("page")
    const layoutController = new TableController("layout")
    const [pageItem, setPageItem] = useState<{ [p: string]: any }>()
    const [memoLayout, setLayout] = useState<{ [p: string]: any }[]>([])
    const layout = useMemo(() => memoLayout.sort((a: any, b: any) => (a.Setting.style?.order ?? 0) - (b.Setting.style?.order ?? 0)), [memoLayout])
    const [memoLayers, setLayers] = useState<{ [p: string]: any }[]>([])
    const layers = useMemo(() => memoLayers.sort((a: any, b: any) => (a.Setting.style?.order ?? 0) - (b.Setting.style?.order ?? 0)), [memoLayers])
    const [loading, setLoading] = useState(true)
    const layoutBody = useMemo(() => {
        if (!pageItem?.LayoutId) return undefined;
        if (layout.length) return layout.find(e => e.Setting?.className?.includes(LayoutElement.body))
        else if (cacheLayout.has(pageItem.LayoutId)) {
            const layoutFromCache = cacheLayout.get(pageItem.LayoutId)
            return layoutFromCache?.find((e: any) => e.Setting?.className?.includes(LayoutElement.body))
        } else return undefined
    }, [layout, layers.length, pageItem?.LayoutId])

    useEffect(() => {
        if (!loading) setLoading(true)
        pageController.getById(props.id).then(async (res) => {
            if (res.code === 200 && res.data) {
                const thisPage = res.data
                setPageItem(thisPage)
                setLoading(false)
            } else setPageItem(undefined)
        })
        return () => {
            if (globalTableCache.size > 50) globalTableCache.clear()
        }
    }, [props.id])

    useEffect(() => {
        if (pageItem && !props.onlyLayout) setLayers(pageItem.Setting ? JSON.parse(pageItem.Setting) : [])
        else setLayers([])
    }, [pageItem, props.onlyLayout])

    useEffect(() => {
        if (pageItem?.LayoutId && !props.onlyBody) {
            layoutController.getById(pageItem.LayoutId).then((res) => {
                if (res.code === 200 && res.data) {
                    const layoutData = res.data
                    const layoutSetting = layoutData?.Setting ? JSON.parse(layoutData.Setting) : []
                    setLayout(layoutSetting)
                    cacheLayout.set(layoutData.Id, layoutSetting)
                    setLoading(false)
                } else {
                    methods.reset()
                    ToastMessage.errors("Failed to load layout data")
                    console.error("Failed to load layout data:", res.message)
                }
            })
        } else setLayout([])
    }, [pageItem?.LayoutId, props.onlyBody])

    const gutterOfBody = useMemo(() => {
        if (props.onlyLayout || !pageItem?.LayoutId || !layers.length || !layoutBody) return undefined;
        const isRow = layoutBody.Setting.className?.split(" ").includes("row")
        if (!isRow) return undefined
        const gutter = layoutBody.Setting.style?.columnGap ?? layoutBody.Setting.style?.gap ?? 0
        return { "--gutter": isNaN(gutter) ? gutter : `${gutter}px` }
    }, [props.onlyBody, layers.length, pageItem?.LayoutId, layoutBody])

    useEffect(() => {
        if (gutterOfBody && layers.length && layoutBody) {
            setLayers(prev => prev.map((e: any) => {
                if (!e.ParentId || e.ParentId === layoutBody.Id) return { ...e, Setting: { ...e.Setting, style: { ...e.Setting.style, ...gutterOfBody } } }
                return e
            }))
        }
    }, [layers.length, gutterOfBody, layoutBody])

    const propsChildren: any = useMemo(() => {
        if (props.children && layoutBody && props.onlyLayout) {
            return {
                ...childrenData,
                [layoutBody.Setting?.id ?? layoutBody.Id]: props.children
            }
        }
        return childrenData
    }, [childrenData, props.children, layoutBody, props.onlyLayout])

    if (pageItem) {
        if (props.onlyLayout) {
            return !!layout.length && <RenderPageView
                key={pageItem.LayoutId}
                layers={layout}
                {...props}
                childrenData={propsChildren}
                methods={props.methods ?? methods}
            />
        } else if (props.onlyBody) {
            return !loading && <RenderPageView key={pageItem.Id} layers={layers} {...props} childrenData={childrenData} methods={props.methods ?? methods} />
        } else {
            return pageItem && !!layout.length ? <RenderPageView key={pageItem.LayoutId} layers={layout} {...props} childrenData={childrenData} methods={props.methods ?? methods}>
                {!loading && <RenderPageView key={pageItem.Id} layers={layers} {...props} childrenData={childrenData} methods={props.methods ?? methods} bodyId={layoutBody?.Id} />}
            </RenderPageView> : null
        }
    } else return null
}

interface PageByUrlProps extends Props {
    url: string,
    /**
     * type function only for card element \n
     * custom props of layer by id. Ex: { "gid": { style: { width: "60rem", backgroundColor: "red" }, className: "my-class" } }
     * */
    propsData?: { [p: string]: CustomHTMLProps } | { [p: string]: (itemData: { [p: string]: any }, index: number, methods: UseFormReturn) => CustomHTMLProps },
    /**
     * type function only for card element \n
     * replace children of parent layer by id. Ex: { "gid": <Text className="heading-7">Example</Text> }
     * */
    childrenData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    /**
     * type function only for card element \n
     * replace layer by id. Ex: { "gid": <Text className="heading-7">Example</Text> }
     * */
    itemData?: { [p: string]: ReactNode } | { [p: string]: (indexItem: { [p: string]: any }, index: number, methods: UseFormReturn) => ReactNode },
    onlyLayout?: boolean,
    onlyBody?: boolean;
    /** children of layout-body */
    children?: ReactNode;
}

export const PageByUrl = ({ childrenData, ...props }: PageByUrlProps) => {
    const methods = useForm({ shouldFocusError: false })
    const pageController = new TableController("page")
    const layoutController = new TableController("layout")
    const [pageItem, setPageItem] = useState<{ [p: string]: any }>()
    const [memoLayout, setLayout] = useState<{ [p: string]: any }[]>([])
    const layout = useMemo(() => memoLayout.sort((a: any, b: any) => (a.Setting.style?.order ?? 0) - (b.Setting.style?.order ?? 0)), [memoLayout])
    const [memoLayers, setLayers] = useState<{ [p: string]: any }[]>([])
    const layers = useMemo(() => memoLayers.sort((a: any, b: any) => (a.Setting.style?.order ?? 0) - (b.Setting.style?.order ?? 0)), [memoLayers])
    const [loading, setLoading] = useState(true)
    const layoutBody = useMemo(() => {
        if (!pageItem?.LayoutId) return undefined;
        if (layout.length) return layout.find(e => e.Setting?.className?.includes(LayoutElement.body))
        else if (cacheLayout.has(pageItem.LayoutId)) {
            const layoutFromCache = cacheLayout.get(pageItem.LayoutId)
            return layoutFromCache?.find((e: any) => e.Setting?.className?.includes(LayoutElement.body))
        } else return undefined
    }, [layout, layers.length, pageItem?.LayoutId])

    useEffect(() => {
        if (!loading) setLoading(true)
        pageController.getListSimple({
            size: 1,
            query: `@Url:{${props.url.length ? props.url.replace(/[^a-zA-Z0-9]/g, (m) => `\\${m}`) : "\\/"}}`,
            returns: props.onlyLayout ? ["Id", "LayoutId", "Sort"] : ["Id", "LayoutId", "Sort", "Setting"],
            sortby: { BY: "Sort", DIRECTION: "ASC" },
        }).then(async (res) => {
            if (res.code === 200 && res.data[0]) {
                const thisPage = res.data[0]
                setPageItem(thisPage)
                setLoading(false)
            } else setPageItem(undefined)
        })
        return () => {
            if (globalTableCache.size > 50) globalTableCache.clear()
        }
    }, [props.url])

    useEffect(() => {
        if (pageItem && !props.onlyLayout) setLayers(pageItem.Setting ? JSON.parse(pageItem.Setting) : [])
        else setLayers([])
    }, [pageItem, props.onlyLayout])

    useEffect(() => {
        if (pageItem?.LayoutId && !props.onlyBody) {
            layoutController.getById(pageItem.LayoutId).then((res) => {
                if (res.code === 200 && res.data) {
                    const layoutData = res.data
                    const layoutSetting = layoutData?.Setting ? JSON.parse(layoutData.Setting) : []
                    setLayout(layoutSetting)
                    cacheLayout.set(layoutData.Id, layoutSetting)
                    setLoading(false)
                } else {
                    methods.reset()
                    ToastMessage.errors("Failed to load layout data")
                    console.error("Failed to load layout data:", res.message)
                }
            })
        } else setLayout([])
    }, [pageItem?.LayoutId, props.onlyBody])

    const gutterOfBody = useMemo(() => {
        if (props.onlyLayout || !pageItem?.LayoutId || !layers.length || !layoutBody) return undefined;
        const isRow = layoutBody.Setting.className?.split(" ").includes("row")
        if (!isRow) return undefined
        const gutter = layoutBody.Setting.style?.columnGap ?? layoutBody.Setting.style?.gap ?? 0
        return { "--gutter": isNaN(gutter) ? gutter : `${gutter}px` }
    }, [props.onlyBody, layers.length, pageItem?.LayoutId, layoutBody])

    useEffect(() => {
        if (gutterOfBody && layers.length && layoutBody) {
            setLayers(prev => prev.map((e: any) => {
                if (!e.ParentId || e.ParentId === layoutBody.Id) return { ...e, Setting: { ...e.Setting, style: { ...e.Setting.style, ...gutterOfBody } } }
                return e
            }))
        }
    }, [layers.length, gutterOfBody, layoutBody])

    const propsChildren: any = useMemo(() => {
        if (props.children && layoutBody && props.onlyLayout) {
            return {
                ...childrenData,
                [layoutBody.Setting?.id ?? layoutBody.Id]: props.children
            }
        }
        return childrenData
    }, [childrenData, props.children, layoutBody, props.onlyLayout])

    if (pageItem) {
        if (props.onlyLayout) {
            return !!layout.length && <RenderPageView
                key={pageItem.LayoutId}
                layers={layout}
                {...props}
                childrenData={propsChildren}
                methods={props.methods ?? methods}
            />
        } else if (props.onlyBody) {
            return !loading && <RenderPageView key={pageItem.Id} layers={layers} {...props} childrenData={childrenData} methods={props.methods ?? methods} />
        } else {
            return pageItem && !!layout.length ? <RenderPageView key={pageItem.LayoutId} layers={layout} {...props} childrenData={childrenData} methods={props.methods ?? methods}>
                {!loading && <RenderPageView key={pageItem.Id} layers={layers} {...props} childrenData={childrenData} methods={props.methods ?? methods} bodyId={layoutBody?.Id} />}
            </RenderPageView> : null
        }
    } else return null
}