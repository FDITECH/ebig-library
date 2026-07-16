import { createContext, CSSProperties, ReactNode, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
import { CustomHTMLProps, globalTableCache, RenderLayerElement } from "../page/pageById"
import { DataController, SettingDataController } from "../../controller/data"
import { TableController } from "../../controller/setting"
import { ComponentType, FEDataType } from "../da"
import { ConfigData } from "../../controller/config"
import { BaseDA } from "../../controller/config"
import { regexGetVariableByThis } from "../card/config"

interface Props {
    id: string,
    style?: CSSProperties,
    className?: string,
    data?: { [p: string]: any },
    propsData?: { [p: string]: CustomHTMLProps },
    childrenData?: { [p: string]: ReactNode },
    itemData?: { [p: string]: ReactNode },
    onUnMount?: () => void
    onGetViewError?: (e: { [p: string]: any }) => void;
    controller?: { searchRaw?: string, filter?: string, sortby?: Array<{ prop: string, direction?: "ASC" | "DESC" }>, pattern?: { returns: Array<string>, [p: string]: Array<string> | { searchRaw?: string, reducers: string } } } | { ids: string, maxLength?: number | "none" },
    /** Listen view state */
    onChange?: (ev: { data?: { [p: string]: any }, state: { [p: string]: any } }) => void
    onLoaded?: (ev: { data: { [p: string]: any } }) => void,
}

interface ViewContextProps {
    tbName: string,
    data: { [p: string]: any } | undefined,
    getData: () => Promise<void>,
    setData: React.Dispatch<React.SetStateAction<{ [p: string]: any } | undefined>>,
    methods: UseFormReturn,
    staticProps: { [p: string]: any }
}

const ViewContext = createContext<ViewContextProps | undefined>(undefined)
const globalViewCache = new Map()
export const ViewById = (props: Props) => {
    const methods = useForm({ shouldFocusError: false })
    const [viewItem, setViewItem] = useState<{ [p: string]: any }>()
    const layers = useMemo(() => (viewItem?.Props ?? []).sort((a: any, b: any) => (a.Setting.style?.order ?? 0) - (b.Setting.style?.order ?? 0)), [viewItem])
    const _colController = new TableController("column")
    const _relController = new TableController("rel")
    const [controller, setController] = useState<any>(undefined)
    const keyNames = useMemo<string[]>(() => layers.filter((e: any) => e.NameField?.length).map((e: any) => e.NameField), [layers.length])
    const [indexItem, setIndexItem] = useState<{ [p: string]: any } | undefined>(props.data)

    useEffect(() => {
        if (JSON.stringify(controller) !== JSON.stringify(props.controller)) setController(props.controller)
    }, [props.controller])

    useEffect(() => {
        if (props.id) {
            if (globalViewCache.has(props.id)) {
                let cachedView = globalViewCache.get(props.id)
                if (cachedView === "loading") {
                    const interval = setInterval(() => {
                        cachedView = globalViewCache.get(props.id)
                        if (cachedView !== "loading") {
                            setViewItem(cachedView)
                            clearInterval(interval)
                        }
                    }, 150)
                    return () => clearInterval(interval)
                } else setViewItem(cachedView)
            } else {
                globalViewCache.set(props.id, "loading")
                const controller = new SettingDataController("view")
                controller.getByIds([props.id]).then(async (res) => {
                    if (res.code === 200 && res.data[0]) {
                        let _viewItem = res.data[0]
                        if (_viewItem.Props && typeof _viewItem.Props === "string") _viewItem.Props = JSON.parse(_viewItem.Props)
                        setViewItem(_viewItem)
                        globalViewCache.set(props.id, _viewItem)
                        return;
                    } else if (props.onGetViewError) props.onGetViewError(res)
                    globalViewCache.delete(props.id)
                })
            }
        }
        return () => {
            if (globalViewCache.size > 30) globalViewCache.clear()
            props.onUnMount?.()
        }
    }, [props.id])

    const mapColumnData = async () => {
        if (keyNames.length) {
            const usingCols = []
            const usingRels = []
            if (globalTableCache.has(viewItem!.TbName)) {
                const tbFieldsData = globalTableCache.get(viewItem!.TbName)
                usingCols.push(...tbFieldsData.cols.filter((c: any) => keyNames.includes(c.Name)))
                usingRels.push(...tbFieldsData.rels.filter((r: any) => keyNames.some(k => k.startsWith(r.Column + "."))))
            }
            if (!usingCols.length) {
                const res = await Promise.all([
                    _relController.getListSimple({ page: 1, size: 100, query: `@TableFK:{${viewItem!.TbName}}` }),
                    _colController.getListSimple({ page: 1, size: 200, query: `@TableName:{${viewItem!.TbName}}` }),
                ])
                if (res.every((r: any) => r.code === 200)) {
                    const relTmp = res[0].data.map((r: any) => ({ ...r, Form: JSON.parse(r.Form) }))
                    const colTmp = res[1].data.map((c: any) => ({ ...c, Form: JSON.parse(c.Form) }))
                    globalTableCache.set(viewItem!.TbName, { cols: colTmp, rels: relTmp })
                    usingCols.push(...colTmp.filter((c: any) => keyNames.includes(c.Name)))
                    usingRels.push(...relTmp.filter((r: any) => keyNames.some(k => k.startsWith(r.Column + "."))))
                }
            }
            if (usingRels.length) {
                const relKeys = keyNames.filter((e: string) => e.split(".").length > 1)
                const getDataRelPKName = usingRels.filter((r: any) => !globalTableCache.has(r.TablePK))
                const finalRels = usingRels.filter((r: any) => globalTableCache.has(r.TablePK)).map((r: any) => globalTableCache.get(r.TablePK).cols.filter((c: any) => relKeys.includes(r.Column + "." + c.Name))).flat(Infinity)
                if (getDataRelPKName.length) {
                    const relRes = await _colController.getListSimple({
                        page: 1, size: getDataRelPKName.length * 50,
                        query: `@TableName:{${getDataRelPKName.map((e: any) => e.TablePK).join(" | ")}} @Name:{${relKeys.map((e: string) => e.split(".").pop()).join(" | ")}}`
                    })
                    if (relRes.code === 200)
                        finalRels.concat(relRes.data.filter((rc: any) => relKeys.includes(`${rc.TableName}Id.${rc.Name}`)))
                }
                methods.setValue("_rels", finalRels)
            } else methods.setValue("_rels", [])
            methods.setValue("_cols", usingCols)
        }
    }

    useEffect(() => {
        if (viewItem?.TbName) mapColumnData()
    }, [viewItem?.TbName])

    const getInitData = async () => {
        if (props.data) {
            setIndexItem(props.data)
            if (props.onLoaded) props.onLoaded({ data: props.data })
        } else if (controller) {
            const dataController = new DataController(viewItem!.TbName)
            if (controller.searchRaw) {
                dataController.patternList({ ...controller, page: 1, size: 1, searchRaw: controller!.searchRaw ?? "*" }).then(res => {
                    if (res.code === 200 && res.data[0]) {
                        setIndexItem(res.data[0])
                        if (props.onLoaded) props.onLoaded({ data: res.data[0] })
                    }
                })
            } else { // get by ids
                let listIds = controller.ids.split(",")
                if (controller.maxLength && controller.maxLength !== "none") listIds = listIds.slice(0, controller.maxLength)
                const res = await dataController.getByListId(listIds)
                if (res.code === 200 && res.data.length) {
                    setIndexItem(res.data[0])
                    if (props.onLoaded) props.onLoaded({ data: res.data[0] })
                }
            }
        }
    }

    useEffect(() => {
        if (viewItem?.TbName) getInitData()
    }, [props.data, controller, viewItem?.TbName])

    useEffect(() => {
        const fileCols = methods.getValues("_cols")?.filter((e: any) => e.DataType === FEDataType.FILE && keyNames.includes(e.Name)) ?? []
        if (fileCols.length && indexItem && keyNames.length) {
            const currentFiles = methods.watch("_files") ?? []
            const fileIds = fileCols.map((col: any) => indexItem![col.Name]?.split(",")).flat(Infinity).filter((e: string | undefined, i: number, arr: Array<string>) => e?.length && ConfigData.regexGuid.test(e) && currentFiles.every((el: any) => el.Id !== e) && arr.indexOf(e) === i)
            if (fileIds.length) {
                BaseDA.getFilesInfor(fileIds).then(fileRes => {
                    if (fileRes.code === 200) methods.setValue("_files", [...currentFiles, ...fileRes.data.filter(Boolean)])
                })
            }
        }
    }, [indexItem, methods.watch("_cols"), keyNames])

    const extendData = useMemo(() => methods.watch(), [JSON.stringify(methods.watch())])

    useEffect(() => {
        if (layers.length && indexItem && keyNames.length) {
            let relKeys = layers.filter((e: any) => e.Type === ComponentType.card && e.Setting.controller?.ids && regexGetVariableByThis.test(e.Setting.controller.ids)).map((e: any) => regexGetVariableByThis.exec(e.Setting.controller.ids)![1])
            relKeys.push(...keyNames.filter((e: string) => e.split(".").length > 1).map((e: string) => e.split(".")[0]))
            relKeys = relKeys.filter((e: string, i: number, arr: Array<string>) => arr.indexOf(e) === i)
            for (const k of relKeys) {
                const currentTmp = methods.getValues(`_${k}`) ?? []
                const dataController = new DataController(k.replace("Id", ""))
                const relDataIds = indexItem![k]?.split(",").flat(Infinity).filter((e: string | undefined, i: number, arr: Array<string>) => e?.length && currentTmp.every((el: any) => el.Id !== e) && arr.indexOf(e) === i)
                if (relDataIds?.length) {
                    dataController.getByListId(relDataIds).then(relRes => {
                        if (relRes.code === 200) methods.setValue(`_${k}`, [...currentTmp, ...relRes.data.filter(Boolean)])
                    })
                }
            }
        }
    }, [indexItem, layers, keyNames.length])

    return viewItem ? <RenderView
        key={viewItem.Id}
        {...props}
        layers={layers}
        indexItem={indexItem}
        extendData={extendData}
        tbName={viewItem.TbName}
        getData={getInitData}
        setData={setIndexItem}
    /> : null
}

interface RenderViewProps extends Props {
    layers: Array<{ [p: string]: any }>,
    indexItem?: { [p: string]: any },
    extendData: { [p: string]: any },
    tbName?: string,
    getData: () => Promise<void>,
    setData: React.Dispatch<React.SetStateAction<{ [p: string]: any } | undefined>>,
}

const RenderView = (props: RenderViewProps) => {
    const methods = useForm({ shouldFocusError: false })
    const [rels, setRels] = useState<Array<{ [p: string]: any }>>([])
    const [cols, setCols] = useState<Array<{ [p: string]: any }>>([])
    const [extendData, setExtendData] = useState<{ [p: string]: any }>({})
    const staticProps = useRef({})

    useEffect(() => {
        const tmp: { [p: string]: any } = {}
        Object.keys(props.extendData).forEach(p => {
            if (p === "_cols") setCols(props.extendData[p])
            else if (p === "_rels") setRels(props.extendData[p])
            else tmp[p] = props.extendData[p]
        })
        if (Object.keys(tmp).length) setExtendData(tmp)
    }, [props.extendData])

    const viewStateData = useMemo(() => methods.watch(), [JSON.stringify(methods.watch())])
    const finalStateData = useDeferredValue(viewStateData)

    useEffect(() => {
        if (props.onChange) props.onChange({ data: props.indexItem, state: finalStateData })
    }, [finalStateData, props.indexItem])

    return <ViewContext.Provider value={{ tbName: props.tbName!, data: props.indexItem, getData: props.getData, setData: props.setData, methods, staticProps: staticProps.current }}>
        {props.layers.filter((e: any) => !e.ParentId).map((e: any) => {
            return <RenderLayerElement
                key={e.Id}
                item={e}
                list={props.layers}
                style={props.style}
                className={props.className}
                type={"view"}
                cols={cols}
                rels={rels}
                methods={methods}
                indexItem={props.indexItem}
                propsData={props.propsData}
                childrenData={props.childrenData}
                itemData={props.itemData}
                options={extendData}
                tbName={props.tbName}
            />
        })}
    </ViewContext.Provider>
}

export const useViewContext = () => {
    const context = useContext(ViewContext);
    return context;
}