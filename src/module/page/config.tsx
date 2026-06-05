export enum LayoutElement {
    main = "_ebig-main-layout_axts4_37",
    header = "_ebig-header-layout_axts4_37",
    siderbar = "_ebig-sidebar-layout_axts4_37",
    body = "_ebig-body-layout_axts4_37",
}

export const layoutElements = [
    LayoutElement.main,
    LayoutElement.header,
    LayoutElement.siderbar,
    LayoutElement.body
]

export const encodeClassName = (cls: string, prefix?: string) => {
    return `_${prefix ?? "ebig"}-${cls}_axts4_37`
}

export const decodeClassName = (cls: string, prefix?: string) => {
    return cls.replace(`_${prefix ?? "ebig"}-`, "").replace("_axts4_37", "")
}
export const regexResponsiveClassCol = /col([0-9]|1[0-9]|2[0-4])/;
export const handleErrorImgSrc = "https://cdn.ebig.co/icon-library/image-placeholder.png";