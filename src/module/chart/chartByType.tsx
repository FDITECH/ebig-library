import { CSSProperties, useMemo } from "react";
import ReactEcharts from "echarts-for-react";
import styles from "./chart.module.css";
import { useEbigContext, Ebigicon, Text } from "../../index";

export interface DatasetItem {
    id: string | number,
    name: string,
    title?: string,
    color?: string,
    backgroundColor?: string,
    value: number | Array<number>
}

interface Props {
    style?: CSSProperties,
    chartStyle?: CSSProperties,
    className?: string,
    legend?: "left" | "top" | "right" | "bottom" | "none",
    type: 'line' | 'bar' | 'horizontal bar' | 'scatter' | 'bubble' | 'radar' | 'area' | 'doughnut' | 'pie',
    datasets: DatasetItem[],
    xAxisConfig?: { name: string[] | { name: string, color?: string }[], unit?: string, label?: { [k: string]: any } },
    yAxisConfig?: { name: string[] | { name: string, color?: string }[], unit?: string, label?: { [k: string]: any } },
    indicator?: { name: string, max: number, min?: number, color?: string }[],
    formatter?: (ev: any) => void | string,
    handleChartClick?: (ev: any) => void;
}

const pieStyle = { width: 200, height: 200 }
const barStyle = { height: 314, width: "100%" }

export const ChartByType = ({ xAxisConfig, yAxisConfig, legend = "none", ...props }: Props) => {
    const { theme } = useEbigContext()

    const grid = useMemo(() => {
        let _left = 24;
        let _right = 24;
        if (xAxisConfig?.unit?.length) {
            const tmp = document.createElement("span");
            tmp.style.cssText = "font-size: 12px; font-family: Inter; opacity: 0; position: fixed;";
            tmp.innerText = xAxisConfig.unit;
            document.body.appendChild(tmp);
            _right = tmp.offsetWidth + 8;
            tmp.remove();
        }
        if (yAxisConfig?.unit?.length) {
            const tmp = document.createElement("span");
            tmp.style.cssText = "font-size: 12px; font-family: Inter; opacity: 0; position: fixed;";
            tmp.innerText = yAxisConfig.unit;
            document.body.appendChild(tmp);
            _left = tmp.offsetWidth;
            tmp.remove();
        }
        return { left: Math.max(0, _left), right: Math.max(0, _right) }
    }, [xAxisConfig?.unit, yAxisConfig?.unit, props.type]);

    const axisThemeStyle = useMemo(() => ({
        splitLine: {
            lineStyle: {
                type: 'dashed',
                color: theme === "dark" ? "#494950" : "#D7D7DB"
            }
        },
        axisLine: {
            lineStyle: {
                color: theme === "dark" ? "#494950" : "#D7D7DB",
                width: 1,
            }
        },
        nameTextStyle: {
            color: theme === "dark" ? "#A2A2AA" : "#61616B",
            fontSize: 12,
        },
        axisLabel: {
            color: theme === "dark" ? "#A2A2AA" : "#61616B",
            fontSize: 12,
            lineHeight: 16,
        }
    }), [theme]);

    const buildCategoryAxis = (config?: typeof xAxisConfig, withBoundaryGap = true) => ({
        type: 'category',
        boundaryGap: withBoundaryGap,
        data: config?.name?.map((n: string | { name: string, color?: string }) =>
            typeof n === "string" ? n : { value: n.name, textStyle: { color: n.color } }
        ),
        name: config?.unit,
        nameLocation: 'end' as const,
        nameGap: 8,
        ...axisThemeStyle,
        axisLabel: {
            ...axisThemeStyle.axisLabel,
            ...config?.label
        }
    });

    const buildValueAxis = (config?: typeof yAxisConfig, withFormatter = false) => ({
        type: 'value',
        data: config?.name?.map((n: string | { name: string, color?: string }) =>
            typeof n === "string" ? n : { value: n.name, textStyle: { color: n.color } }
        ),
        name: config?.unit,
        nameLocation: 'end' as const,
        nameGap: 20,
        splitLine: axisThemeStyle.splitLine,
        nameTextStyle: axisThemeStyle.nameTextStyle,
        axisLabel: {
            ...(withFormatter ? { formatter: props.formatter } : {}),
            ...axisThemeStyle.axisLabel,
            ...(config?.label ?? {})
        }
    });

    const option = useMemo(() => {
        const tmp: any = {
            backgroundColor: "#00000000",
            responsive: true,
            tooltip: {
                trigger: 'item',
                position: 'top',
                appendToBody: true,
                axisPointer: { type: 'shadow' }
            },
            grid,
        }

        switch (props.type) {
            // ─────────────────────────────────────────────
            case "line":
                return {
                    ...tmp,
                    yAxis: buildValueAxis(yAxisConfig, true),
                    xAxis: { ...buildCategoryAxis(xAxisConfig, false), axisLine: axisThemeStyle.axisLine },
                    series: props.datasets.map((c) => ({
                        ...c,
                        stack: 'Total',
                        name: c.title ?? c.name,
                        type: 'line',
                        smooth: false,
                        data: Array.isArray(c.value) ? c.value : [c.value],
                        itemStyle: { color: c.color },
                        lineStyle: { color: c.color },
                        areaStyle: undefined,
                        symbol: 'circle',
                        symbolSize: 6,
                    })),
                };

            // ─────────────────────────────────────────────
            case "area":
                return {
                    ...tmp,
                    yAxis: buildValueAxis(yAxisConfig, true),
                    xAxis: { ...buildCategoryAxis(xAxisConfig, false), axisLine: axisThemeStyle.axisLine },
                    series: props.datasets.map((c) => ({
                        ...c,
                        stack: 'Total',
                        name: c.title ?? c.name,
                        type: 'line',
                        smooth: true,
                        data: Array.isArray(c.value) ? c.value : [c.value],
                        itemStyle: { color: c.color },
                        lineStyle: { color: c.color },
                        symbol: 'circle',
                        symbolSize: 6,
                        areaStyle: {
                            color: c.backgroundColor ?? c.color,
                            opacity: c.backgroundColor ? 1 : 0.25,
                        },
                    })),
                };

            // ─────────────────────────────────────────────
            case "bar":
                return {
                    ...tmp,
                    yAxis: buildValueAxis(yAxisConfig, true),
                    xAxis: { ...buildCategoryAxis(xAxisConfig, true), axisLine: axisThemeStyle.axisLine },
                    series: props.datasets.map((c) => ({
                        ...c,
                        name: c.title ?? c.name,
                        data: Array.isArray(c.value) ? c.value : [c.value],
                        type: 'bar',
                        itemStyle: { color: c.color, borderRadius: [2, 2, 0, 0] },
                        barMinWidth: 8,
                        barMaxWidth: 80,
                        barGap: '20%',
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                    })),
                };

            // ─────────────────────────────────────────────
            case "horizontal bar":
                return {
                    ...tmp,
                    xAxis: { ...buildValueAxis(xAxisConfig, true), ...{ splitLine: axisThemeStyle.splitLine } },
                    yAxis: { ...buildCategoryAxis(yAxisConfig, true), axisLine: axisThemeStyle.axisLine },
                    series: props.datasets.map((c) => ({
                        ...c,
                        name: c.title ?? c.name,
                        data: Array.isArray(c.value) ? c.value : [c.value],
                        type: 'bar',
                        itemStyle: { color: c.color, borderRadius: [0, 2, 2, 0] },
                        barMinHeight: 8,
                        barMaxWidth: 80,
                        barGap: '20%',
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                    })),
                };

            // ─────────────────────────────────────────────
            case "pie":
                tmp.tooltip.formatter = props.formatter || '{b}: {c} ({d}%)'
                if (!props.datasets.length) delete tmp.tooltip
                return {
                    ...tmp,
                    series: [
                        {
                            type: 'pie',
                            avoidLabelOverlap: false,
                            radius: '100%',
                            padAngle: props.datasets.length ? 2 : 0,
                            label: { show: false, position: 'center' },
                            emphasis: { label: false },
                            data: props.datasets.length
                                ? props.datasets.map(e => ({
                                    ...e,
                                    name: e.title ?? e.name,
                                    value: e.value,
                                    itemStyle: { color: e.color, borderRadius: 4 }
                                }))
                                : [{ value: 1, label: "empty", name: "empty", itemStyle: { color: theme === "dark" ? "#313135" : "#EFEFF0" } }]
                        },
                    ],
                }

            // ─────────────────────────────────────────────
            case "doughnut":
                tmp.tooltip.formatter = props.formatter || '{b}: {c} ({d}%)'
                if (!props.datasets.length) delete tmp.tooltip
                const total = props.datasets
                    .map(e => typeof e.value === 'number' ? e.value : e.value.reduce((a, b) => a + b, 0))
                    .reduce((a, b) => a + b, 0)
                return {
                    ...tmp,
                    title: {
                        text: total,
                        left: 'center',
                        top: 'center',
                        textStyle: {
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: theme === "dark" ? "#F4F4F5" : "#18181B",
                            fontFamily: "Inter"
                        },
                    },
                    series: [
                        {
                            type: "pie",
                            radius: ['56%', '90%'],
                            center: ['50%', '50%'],
                            avoidLabelOverlap: false,
                            padAngle: props.datasets.length ? 2 : 0,
                            label: { show: false, position: 'center' },
                            emphasis: { label: false },
                            data: props.datasets.length
                                ? props.datasets.map(e => ({
                                    ...e,
                                    name: e.title ?? e.name,
                                    value: e.value,
                                    itemStyle: { color: e.color, borderRadius: 4 }
                                }))
                                : [{ value: 1, label: "empty", name: "empty", itemStyle: { color: theme === "dark" ? "#313135" : "#EFEFF0" } }]
                        },
                    ],
                }

            // ─────────────────────────────────────────────
            case "radar":
                return {
                    ...tmp,
                    tooltip: { ...tmp.tooltip, trigger: 'item' },
                    radar: {
                        indicator: props.indicator,
                        splitLine: {
                            lineStyle: {
                                color: theme === "dark" ? "#494950" : "#D7D7DB"
                            }
                        },
                        splitArea: { show: false },
                        axisLine: {
                            lineStyle: {
                                color: theme === "dark" ? "#494950" : "#D7D7DB"
                            }
                        },
                        axisName: {
                            color: theme === "dark" ? "#A2A2AA" : "#61616B",
                            fontSize: 12,
                        }
                    },
                    series: [
                        {
                            type: 'radar',
                            data: props.datasets.map((c) => ({
                                name: c.title ?? c.name,
                                value: Array.isArray(c.value) ? c.value : [c.value],
                                itemStyle: { color: c.color },
                                lineStyle: { color: c.color },
                                areaStyle: {
                                    color: c.backgroundColor ?? c.color,
                                    opacity: c.backgroundColor ? 1 : 0.2,
                                },
                                label: { show: false },
                            })),
                        }
                    ],
                };

            // ─────────────────────────────────────────────
            case "scatter":
                return {
                    ...tmp,
                    tooltip: {
                        ...tmp.tooltip,
                        trigger: 'item',
                        formatter: props.formatter || ((p: any) => `${p.seriesName}<br/>(${p.value[0]}, ${p.value[1]})`)
                    },
                    xAxis: {
                        type: 'value',
                        scale: true,
                        ...axisThemeStyle,
                        axisLabel: {
                            ...axisThemeStyle.axisLabel,
                            ...xAxisConfig?.label
                        },
                        name: xAxisConfig?.unit,
                        nameLocation: 'end' as const,
                        nameTextStyle: axisThemeStyle.nameTextStyle,
                    },
                    yAxis: {
                        type: 'value',
                        scale: true,
                        ...axisThemeStyle,
                        axisLabel: {
                            ...axisThemeStyle.axisLabel,
                            ...yAxisConfig?.label
                        },
                        name: yAxisConfig?.unit,
                        nameLocation: 'end' as const,
                        nameTextStyle: axisThemeStyle.nameTextStyle,
                    },
                    series: props.datasets.map((c) => ({
                        name: c.title ?? c.name,
                        type: 'scatter',
                        data: Array.isArray(c.value) ? c.value : [[c.value, c.value]],
                        itemStyle: { color: c.color, opacity: 0.8 },
                        symbolSize: 10,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                    })),
                };

            // ─────────────────────────────────────────────
            case "bubble":
                return {
                    ...tmp,
                    tooltip: {
                        ...tmp.tooltip,
                        trigger: 'item',
                        formatter: props.formatter || ((p: any) => `${p.seriesName}<br/>(${p.value[0]}, ${p.value[1]}) — size: ${p.value[2]}`)
                    },
                    xAxis: {
                        type: 'value',
                        scale: true,
                        ...axisThemeStyle,
                        axisLabel: {
                            ...axisThemeStyle.axisLabel,
                            ...xAxisConfig?.label
                        },
                        name: xAxisConfig?.unit,
                        nameLocation: 'end' as const,
                        nameTextStyle: axisThemeStyle.nameTextStyle,
                    },
                    yAxis: {
                        type: 'value',
                        scale: true,
                        ...axisThemeStyle,
                        axisLabel: {
                            ...axisThemeStyle.axisLabel,
                            ...yAxisConfig?.label
                        },
                        name: yAxisConfig?.unit,
                        nameLocation: 'end' as const,
                        nameTextStyle: axisThemeStyle.nameTextStyle,
                    },
                    series: props.datasets.map((c) => ({
                        name: c.title ?? c.name,
                        type: 'scatter',
                        // value format: [x, y, bubbleSize]
                        data: Array.isArray(c.value) ? c.value : [[c.value, c.value, c.value]],
                        itemStyle: { color: c.color, opacity: 0.7 },
                        symbolSize: (val: number[]) => {
                            const size = Array.isArray(val) && val.length >= 3 ? val[2] : 10;
                            return Math.max(8, Math.min(80, size));
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                    })),
                };

            // ─────────────────────────────────────────────
            default:
                return undefined
        }
    }, [grid, props.datasets, props.type, xAxisConfig, yAxisConfig, props.formatter, theme, props.indicator, axisThemeStyle]);

    const isBarOrLine = ["bar", "horizontal bar", "line", "area"].includes(props.type);

    const renderChart = () => {
        if (!option) return null;
        return (
            <ReactEcharts
                key={props.type}
                onEvents={{ click: props.handleChartClick as any }}
                theme={theme}
                notMerge={true}
                lazyUpdate={true}
                option={option}
                style={props.chartStyle ?? (isBarOrLine ? barStyle : pieStyle)}
            />
        )
    }

    const renderLegend = (direction: "row" | "col") => {
        if (!props.datasets.length) return null;
        return (
            <div
                className={`${direction} ${styles["legend"]}`}
                style={direction === "col"
                    ? { flex: isBarOrLine ? undefined : 1, maxHeight: "100%", columnGap: "2rem" }
                    : { rowGap: "2rem" }
                }
            >
                <CustomLegend datasets={props.datasets as any} type={props.type} />
            </div>
        )
    }

    switch (legend) {
        case "top":
            return (
                <div className={`${styles["chart-block"]} ${props.className ?? ''}`} style={{ flexDirection: "column", ...props.style }}>
                    {renderLegend("row")}
                    {renderChart()}
                </div>
            )
        case "bottom":
            return (
                <div className={`${styles["chart-block"]} ${props.className ?? ''}`} style={{ flexDirection: "column", ...props.style }}>
                    {renderChart()}
                    {renderLegend("row")}
                </div>
            )
        case "left":
            return (
                <div className={`${styles["chart-block"]} ${props.className ?? ''}`} style={{ alignItems: "center", ...props.style }}>
                    {renderLegend("col")}
                    {renderChart()}
                </div>
            )
        case "right":
            return (
                <div className={`${styles["chart-block"]} ${props.className ?? ''}`} style={{ alignItems: "center", ...props.style }}>
                    {renderChart()}
                    {renderLegend("col")}
                </div>
            )
        case "none":
        default:
            return (
                <div className={`${styles["chart-block"]} ${props.className ?? ''}`} style={{ alignItems: "center", ...props.style }}>
                    {renderChart()}
                </div>
            )
    }
}

const CustomLegend = ({ datasets = [], type = "" }) => {
    return datasets.map((e: any, i) => {
        if (type.includes("bar")) {
            return <div key={"legend-" + e.id + i} className="row" style={{ gap: 8 }}>
                <div style={{ height: "1.6rem", width: "1.6rem", borderRadius: 4, backgroundColor: e.color }} />
                <Text className="label-4" maxLine={1}>{e.name}</Text>
            </div>
        } else if (type === "line") {
            return <div key={"legend-" + e.id + i} className="row" style={{ gap: 8 }}>
                <Ebigicon src="fill/business/line-chart" size={"2rem"} color={e.color} />
                <Text className="label-4" maxLine={1}>{e.name}: {e.value}</Text>
            </div>
        } else {
            return <div key={"legend-" + e.id + i} className="row" style={{ gap: 8 }}>
                <div style={{ height: 8, width: 8, borderRadius: "50%", backgroundColor: e.color }} />
                <Text className="label-4" maxLine={1}>{e.name}: {e.value}</Text>
            </div>
        }
    })
}