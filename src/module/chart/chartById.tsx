import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { DataController, SettingDataController } from "../../controller/data"
import { ChartByType } from "./chartByType"
import { BaseDA, ComponentStatus, randomGID, showDialog, ToastMessage, useEbigContext, Util } from "../../index"
import { AsyncFunction } from "../page/pageById"

interface Props {
    id: string;
    className?: string;
    title?: string;
    style?: CSSProperties;
}

interface ChartRef {
    chartInfor?: { [p: string]: any };
    result: { datasets: { [p: string]: any }[], textValue: { value: number, name: string } };
    element?: HTMLDivElement
}

const ChartById = forwardRef<ChartRef, Props>(({ id, style, className, ...props }, ref) => {
    const [chartItem, setChartItem] = useState<{ [p: string]: any }>()
    const [datasets, setDatasets] = useState<{ [p: string]: any }[]>([])
    const [textValue, setTextValue] = useState({ value: 0, name: '' })
    const ebigContextData = useEbigContext()
    const divRef = useRef<HTMLDivElement>(undefined)
    const settingData = useMemo(() => chartItem?.Setting && typeof chartItem.Setting === "string" ? JSON.parse(chartItem.Setting) : (chartItem?.Setting ?? {}), [chartItem])

    useEffect(() => {
        if (id) {
            const _settingDataController = new SettingDataController("chart")
            _settingDataController.getByIds([id]).then(async (res) => {
                if (res.code === 200 && res.data[0]) {
                    let _chartItem = res.data[0]
                    if (_chartItem.Setting && typeof _chartItem.Setting === "string") _chartItem.Setting = JSON.parse(_chartItem.Setting)
                    setChartItem(_chartItem)
                } else setChartItem(undefined)
            })
        }
    }, [id])

    useEffect(() => {
        if (settingData.GetData?.length) {
            try {
                (new AsyncFunction(
                    "entityData", "tableName", "Util", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "post", "get", "showDialog", "ComponentStatus", "useEbigContext",
                    settingData.GetData // This string can now safely contain the 'await' keyword
                ))(
                    {},
                    chartItem!.TbName,
                    Util,
                    DataController,
                    randomGID,
                    ToastMessage,
                    BaseDA.uploadFiles,
                    BaseDA.getFilesInfor,
                    BaseDA.post,
                    BaseDA.get,
                    showDialog,
                    ComponentStatus,
                    () => ebigContextData
                ).then((result: any) => {
                    if (chartItem!.Type === "text" && typeof result === "object") setTextValue(result)
                    else if (Array.isArray(result)) setDatasets(result)
                    else {
                        ToastMessage.infor("Your code should return a list of DatasetItem")
                        console.error("Your code should return a list of DatasetItem: ", result)
                    }
                })
            } catch (error) {
                console.error("Error in Chart code: ", error)
            }
        }
    }, [settingData.GetData, ebigContextData, chartItem?.TbName])

    useImperativeHandle(ref, () => ({
        chartInfor: chartItem,
        result: { datasets, textValue },
        element: divRef.current
    }), [chartItem, datasets, textValue])

    return chartItem && <div ref={divRef as any} className={`col ${className ?? ""}`} style={style}>
        {(!!chartItem.Name?.length || !!props.title?.length) && <span className="heading-7">{props.title ?? chartItem.Name}</span>}
        {chartItem.Type === "text" ? <div className="col" style={{ alignItems: "center", flex: 1, justifyContent: "center", gap: 8 }}>
            <h4 className="heading-4" style={{ margin: 0 }}>{textValue.value}</h4>
            {!!textValue.name.length && <span className="subtitle-3">{textValue.name}</span>}
        </div> : <ChartByType
            type={chartItem.Type}
            xAxisConfig={settingData.XConfig}
            yAxisConfig={settingData.YConfig}
            indicator={settingData.Indicator}
            datasets={datasets as any}
            legend={settingData.Legend}
        />}
    </div>
})

export { ChartById, ChartByType }