import ReactDOM from 'react-dom'
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import styles from "./table.module.css";
import { ColDataType, FEDataType } from "../da";
import { Util, Text, Tag, showTooltipElement, Ebigicon, useEbigContext, DataController, randomGID, ToastMessage, showDialog, ComponentStatus } from "../../index";
import { BaseDA, ConfigData } from "../../controller/config";
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { i18n } from '../../language/i18n';
import { AsyncFunction, getValidLink } from '../page/pageById';

interface AutoCellContentProps {
    colItem: { [p: string]: any };
    data?: any;
    fields: { [p: string]: any }[];
    files: { [p: string]: any }[];
    style?: CSSProperties;
    rowItem?: { [p: string]: any };
    rowIndex?: number;
    relativeData?: { [p: string]: any[] };
    tbName: string;
    isParent?: boolean;
}

const regexGetVariables = /\${([^}]*)}/;
const replaceVariables = /\${([^}]*)}/g;
export const AutoCellContent = ({ colItem, data, fields = [], files = [], style = {}, rowItem, rowIndex, relativeData, tbName, isParent = false }: AutoCellContentProps) => {
    const ebigContextData = useEbigContext()
    const { t } = useTranslation()
    const location = useLocation()
    const query = new URLSearchParams(location.search)
    const params = useParams()
    const mapValue = useMemo<any>(() => {
        if (colItem.Type === ColDataType.formula) return ""
        if (!data || colItem.Column || (Array.isArray(data) && !data.length)) return undefined // data undefined or this is relative key
        const fieldItem = fields.find(e => e.Name === colItem.Name.split(".").pop())
        if (!fieldItem) return undefined
        const listData = Array.isArray(data) ? data : [data]
        switch (colItem.Type) {
            case ColDataType.people:
                return listData.filter(Boolean);
            // @ts-ignore
            case ColDataType.label:
                if (fieldItem.Form?.Options?.length) {
                    return listData.map(item => {
                        let tmp = item[fieldItem.Name]
                        if (!!tmp || tmp === 0) {
                            switch (fieldItem.DataType) {
                                case FEDataType.BOOLEAN:
                                    if (typeof tmp === "string") tmp = tmp === "true"
                                    else if (typeof tmp === "number") tmp = tmp === 1
                                    else tmp = tmp ? true : false
                                    break;
                                default:
                                    break;
                            }
                            if (typeof tmp === "string") tmp = tmp.split(",").map(id => fieldItem.Form.Options.find((e: any) => e.id === id)).filter(n => !!n || n === 0)
                            else tmp = fieldItem.Form.Options.filter((e: any) => e.id === tmp)
                        }
                        return tmp
                    }).filter(e => !!e || e === 0).flat(Infinity)
                }
            default:
                const joinValue = listData.map(item => {
                    let tmp = item[fieldItem.Name]
                    switch (fieldItem.DataType) {
                        case FEDataType.DATE:
                            if (tmp) tmp = Util.dateToString(new Date(tmp))
                            break;
                        case FEDataType.DATETIME:
                            switch (colItem.Type) {
                                case ColDataType.text:
                                    if (tmp) tmp = new Date(tmp).toLocaleString()
                                    break;
                                default:
                                    switch (colItem.Format?.toLowerCase()) {
                                        case "date month year":
                                        case "day date month year":
                                            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                                            const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
                                            const date = new Date(tmp);
                                            const dayName = t(days[date.getDay()]);
                                            const day = date.getDate();
                                            const month = t(months[date.getMonth()]);
                                            const year = date.getFullYear();
                                            if (colItem.Format.toLowerCase().includes("day")) tmp = `${dayName}, ${day} ${month} ${year}`;
                                            else tmp = `${day} ${month} ${year}`;
                                            break;
                                        default:
                                            if (tmp) tmp = Util.dateToString(new Date(tmp), colItem.Format?.toLowerCase() ?? "dd/mm/yyyy hh:mm")
                                            break;
                                    }
                                    break;
                            }
                            break;
                        case FEDataType.MONEY:
                            if (tmp) tmp = Util.formatCurrency(tmp)
                            break;
                        case FEDataType.PASSWORD:
                            if (tmp) tmp = "************"
                            break;
                        case FEDataType.BOOLEAN:
                            if (typeof tmp === "string") tmp = tmp === "true"
                            else if (typeof tmp === "number") tmp = tmp === 1
                            else tmp = tmp ? true : false
                            break;
                        default:
                            break;
                    }
                    if (fieldItem.Form?.Options?.length && (!!tmp || tmp === 0)) {
                        if (typeof tmp === "string") tmp = tmp.split(",").map(id => fieldItem.Form.Options.find((e: any) => e.id === id)?.name).filter(n => !!n).join(", ")
                        else tmp = fieldItem.Form.Options.find((e: any) => e.id === tmp)?.name
                    }
                    return `${tmp ?? ""}`
                }).join(", ")
                if (fieldItem.DataType === FEDataType.HTML) return <ContentView content={joinValue} />
                return joinValue
        }
    }, [colItem, data])
    const [formulaValue, setFormulaValue] = useState<string>()

    useEffect(() => {
        if (colItem.Type === ColDataType.formula && colItem.Caculate?.length && rowItem) {
            try {
                (new AsyncFunction(
                    "rowItem", "rowIndex", "relativeData", "tableName", "tableTitle", "nameField", "files", "Util", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "showDialog", "ComponentStatus", "useEbigContext",
                    colItem.Caculate // This string can now safely contain the 'await' keyword
                ))(
                    rowItem,
                    rowIndex,
                    relativeData,
                    tbName,
                    tbName.split("_").map((e, i) => (i ? e.toLowerCase() : e)).join(" "),
                    colItem.Name,
                    files,
                    Util,
                    DataController,
                    randomGID,
                    ToastMessage,
                    BaseDA.uploadFiles,
                    BaseDA.getFilesInfor,
                    showDialog,
                    ComponentStatus,
                    () => ebigContextData
                ).then((result: any) => {
                    if (typeof result === "string") setFormulaValue(result)
                    else {
                        ToastMessage.infor("Your code should return a string that is innerHTML of cell element")
                        console.error("Your code should return a string that is innerHTML of cell element: ", result)
                    }
                })
            } catch (error) {
                console.error("Error in formula code: ", error)
            }
        }
    }, [colItem.Type, rowItem, rowIndex, relativeData, ebigContextData, tbName, files])

    const replaceThisVariables = (content: string, dataItem: any) => {
        return content.replace(replaceVariables, (m) => {
            const execRegex = regexGetVariables.exec(m)
            if (!execRegex?.[1]) return m
            const variable = execRegex[1].split(".")
            let getValue: any = m
            switch (variable[0]) {
                case "this":
                    getValue = dataItem?.[variable[1]]
                    break;
                case "location":
                    getValue = (location as any)[variable[1]]
                    break;
                case "query":
                    getValue = query.get(variable[1])
                    break;
                case "params":
                    getValue = params[variable[1]]
                    break;
                case "cookie":
                    getValue = Util.getCookie(variable[1])
                    break;
                case "storage":
                    getValue = Util.getStorage(variable[1])
                    break;
                case "session":
                    getValue = Util.getSession(variable[1])
                    break;
                default:
                    break;
            }
            return getValue
        })
    }

    switch (colItem.Type) {
        case ColDataType.formula:
            return <div className={isParent ? "label-1" : "body-3"} style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: formulaValue } as any} suppressHydrationWarning />
        case ColDataType.text:
            if (typeof mapValue === "string")
                return <p className={`comp-text ${isParent ? "label-1" : "body-3"}`} style={{ "--max-line": 2, margin: 0, flex: 1, ...style } as any}>{mapValue}</p>
            else return mapValue
        case ColDataType.label:
            if (typeof mapValue === "string")
                return <p className={`comp-text ${isParent ? "label-1" : "body-3"}`} style={{ "--max-line": 2, margin: 0, flex: 1, ...style } as any}>{mapValue}</p>
            else
                return mapValue?.map((item: any, i: number) => {
                    switch (colItem.Style) {
                        case "solid":
                            return <Tag
                                key={item.id + "-" + i}
                                title={item.name}
                                className="size24 label-5"
                                style={{ borderRadius: 8, lineHeight: "normal", backgroundColor: `hsl(from ${item.color} h s calc(l + 30))`, color: "#000", gap: 8 }}
                                prefix={!!item.prefix?.length && <Ebigicon src={item.prefix} color={"#000"} size={12} style={{ padding: 0 }} />}
                            />;
                        case "ghost":
                            return <div key={item.id + "-" + i} className="row" style={{ gap: 12 }}>
                                {!!item.prefix?.length && <Ebigicon src={item.prefix} color={item.color} size={12} style={{ width: 24, height: 24, border: `1px dashed ${item.color}`, borderRadius: "50%" }} />}
                                <span style={{ flex: 1, color: item.color, fontSize: 14, fontWeight: 400 }}>{item.name}</span>
                            </div>
                        default:
                            return <div key={item.id + "-" + i} className="row" style={{ gap: 12 }}>
                                {!!item.prefix?.length && <Ebigicon src={item.prefix} color="var(--neutral-text-title-color)" size={14} />}
                                <span style={{ flex: 1, color: "var(--neutral-text-title-color)", fontSize: 14, fontWeight: 400 }}>{item.name}</span>
                            </div>
                    }
                })
        case ColDataType.icon:
            if (mapValue && (mapValue.startsWith("color/") || mapValue.startsWith("fill/") || mapValue.startsWith("outline/")))
                return <Ebigicon src={mapValue} size={20} />
            else return <p className={`comp-text ${isParent ? "label-1" : "body-3"}`} style={{ "--max-line": 2, margin: 0, flex: 1, ...style } as any}>{mapValue}</p>
        case ColDataType.website:
            const listData = Array.isArray(data) ? data : [data]
            return listData.map((item, i) => {
                if (!item) return null
                if (!colItem.Link) {
                    var url = item[colItem.Name]
                } else if (regexGetVariables.test(colItem.Link)) {
                    url = replaceThisVariables(colItem.Link, item)
                    if (!url.includes("https")) url = (url.startsWith("/") ? "/" : "") + url.split("/").filter((e: any) => !!e.trim()).join("/")
                } else if (colItem.Link.includes("https")) {
                    url = colItem.Link
                } else {
                    url = colItem.Link.startsWith("/") ? colItem.Link : `/${colItem.Link}`
                }
                return <NavLink key={item.Id + "-" + i} to={url} target={colItem.Target ?? "_blank"} className={`body-3 ${styles["link-hover"]}`} style={{ "--max-line": 2, margin: 0, flex: 1, color: "var(--primary-main-color,#287CF0)", ...style } as any}>{mapValue}</NavLink>
            })
        case ColDataType.people:
            return mapValue?.map((item: any, i: number) => <div key={`people-${item.Id}-${i}`} className="row" style={{ gap: "0.8rem", flex: 1, ...style }}>
                <CustomerAvatar data={item} style={{ width: 32, height: 32, fontSize: 14 }} />
                <Text className="label-4" style={{ flex: 1 }}>{item.Name}</Text>
            </div>)
        case ColDataType.files:
            const sliceList = files.filter(f => mapValue.includes(f.Id)).slice(0, 2)
            return <>
                {sliceList.map((f, fIndex, arr) => {
                    const tmp: any = {}
                    if (arr.length - 1 === fIndex && mapValue.split(",").length > 2 && f.Type?.includes("image")) tmp["img-length"] = `+${mapValue.split(",").length - 2}`
                    return <NavLink key={f.Id + "-" + fIndex} to={f.Url} target='_blank' className={styles["table-img"]} style={style} {...tmp}>
                        {f.Type?.includes("image") ?
                            <img alt={f.Name} src={f.Url.startsWith("https") ? f.Url : getValidLink(f.Id)} /> :
                            <Text className='body-3' maxLine={2} style={{ color: "var(--primary-main-color)", flex: 1 }}>{f.Name},</Text>}
                    </NavLink>
                })}
                {sliceList[1] && !sliceList[1].Type?.includes("image") && mapValue.split(",").length > 2 && <Text className='body-3' maxLine={1}>{`+${mapValue.split(",").length - 2}...`}</Text>}
            </>
        default:
            return <p className={`comp-text ${isParent ? "label-1" : "body-3"}`} style={{ "--max-line": 2, margin: 0, flex: 1, ...style } as any}>{mapValue}</p>
    }
}

interface CustomerAvatarProps {
    data: { [p: string]: any }
    style?: CSSProperties
    onClick?: () => void
    emableTooltip?: boolean
}

export const CustomerAvatar = ({ data, style = {}, onClick, emableTooltip = false }: CustomerAvatarProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const customer = useMemo<{ [p: string]: any } | null>(() => (data ? { ...data, bgColor: Util.generateDarkColorRgb(data.Id) } : null), [data])
    const [errorImg, setErrorImg] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false);

    const commonProps = useMemo<{ [p: string]: any }>(() => {
        if (!customer) return {}
        const tmp: any = {
            onClick: onClick,
            style: customer.AvatarUrl && !errorImg ?
                { cursor: onClick ? "pointer" : "auto", ...style } :
                { backgroundColor: customer.bgColor, color: "#fff", cursor: onClick ? "pointer" : "auto", ...style }
        }
        if (emableTooltip) {
            tmp.onMouseOver = () => { setShowTooltip(true) }
            tmp.onMouseOut = () => { setShowTooltip(false) }
        }
        return tmp
    }, [style, customer, onClick, errorImg])

    return customer && <div className={`row ${styles["customer-avatar"]}`} {...commonProps} ref={ref}>
        {customer.AvatarUrl && !errorImg ?
            <img
                src={customer.AvatarUrl.startsWith("https") ? customer.AvatarUrl : (ConfigData.imgUrlId + customer.AvatarUrl)}
                alt='' style={{ width: '100%', height: '100%', objectFit: "contain" }}
                onError={() => { setErrorImg(true) }}
            /> :
            <Text className="row" style={{ fontSize: "1em", fontWeight: 600, color: "#fff" }}>{customer?.Name?.substring(0, 1)}</Text>}
        {showTooltip && ReactDOM.createPortal(showTooltipElement({ element: ref.current, tooltip: { message: data.Name, position: "bottom" } }), document.body)}
    </div>
}


export const cellValue = (colItem: { [p: string]: any }, data: any, fields: { [p: string]: any }[] = [], files: { [p: string]: any }[] = []) => {
    const mapValue = () => {
        if (!data || colItem.Column || (Array.isArray(data) && !data.length)) return undefined // data undefined or this is relative key
        const fieldItem = fields.find(e => e.Name === colItem.Name.split(".").pop())
        if (!fieldItem) return undefined
        const listData = Array.isArray(data) ? data : [data]
        return listData.filter(Boolean).map(item => {
            let tmp = item[fieldItem.Name]
            switch (fieldItem.DataType) {
                case FEDataType.DATE:
                    if (tmp) tmp = Util.dateToString(new Date(tmp))
                    break;
                case FEDataType.DATETIME:
                    switch (colItem.Type) {
                        case ColDataType.text:
                            if (tmp) tmp = new Date(tmp).toLocaleString()
                            break;
                        default:
                            switch (colItem.Format?.toLowerCase()) {
                                case "date month year":
                                case "day date month year":
                                    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                                    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
                                    const date = new Date(tmp);
                                    const dayName = i18n.t(days[date.getDay()]);
                                    const day = date.getDate();
                                    const month = i18n.t(months[date.getMonth()]);
                                    const year = date.getFullYear();
                                    if (colItem.Format.toLowerCase().includes("day")) tmp = `${dayName}, ${day} ${month} ${year}`;
                                    else tmp = `${day} ${month} ${year}`;
                                    break;
                                default:
                                    if (tmp) tmp = Util.dateToString(new Date(tmp), colItem.Format ?? "dd/mm/yyyy hh:mm")
                                    break;
                            }
                            break;
                    }
                    break;
                case FEDataType.MONEY:
                    if (tmp) tmp = Util.formatCurrency(tmp)
                    break;
                case FEDataType.PASSWORD:
                    if (tmp) tmp = "************"
                    break;
                case FEDataType.BOOLEAN:
                    if (typeof tmp === "string") tmp = tmp === "true"
                    else if (typeof tmp === "number") tmp = tmp === 1
                    else tmp = tmp ? true : false
                    break;
                default:
                    break;
            }
            if (fieldItem.Form?.Options?.length && tmp !== undefined) {
                if (typeof tmp === "string") tmp = tmp.split(",").map(id => fieldItem.Form.Options.find((e: any) => e.id === id)?.name).filter(n => n).join(", ")
                else tmp = fieldItem.Form.Options.find((e: any) => e.id === tmp)?.name
            }
            return `${tmp ?? ""}`
        }).join(", ")
    }

    const tmp: any = mapValue()

    switch (colItem.Type) {
        case ColDataType.files:
            return files.filter(f => tmp.includes(f.Id)).map((f) => f.Url).join(", ")
        default:
            return tmp
    }
}

function ContentView({ content = "", maxLength = 120 }) {
    const divRef = useRef<HTMLDivElement>(null)
    const [convertContent, setConvertContent] = useState("")
    const [contentInnerText, setContentInnerText] = useState("")

    useEffect(() => {
        if (ConfigData.regexGuid.test(content)) {
            BaseDA.get(`${ConfigData.ebigCdn}/${ConfigData.pid}/${content}`).then((result) => {
                if (typeof result === 'string') setConvertContent(result)
                else setConvertContent(content)
            })
        } else setConvertContent(content)
    }, [content.length])

    useEffect(() => {
        if (convertContent.length && divRef.current && maxLength) {
            setContentInnerText(divRef.current.innerText.slice(0, maxLength) + "...")
        }
    }, [convertContent])

    return (!!convertContent?.length && !!contentInnerText.length) ?
        <p className="comp-text body-3" style={{ "--max-line": 2, margin: 0, flex: 1 } as any}>{contentInnerText}</p> :
        <div ref={divRef} style={{ display: "none" }} className="body-3" dangerouslySetInnerHTML={{ __html: convertContent }} />
}