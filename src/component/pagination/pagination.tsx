import { CSSProperties, useEffect, useRef } from "react";
import ReactPaginate from "react-paginate";
import styles from './pagination.module.css';
import { Text } from "../text/text";
import { TextField, TextFieldRef } from "../text-field/text-field";
import { Ebigicon } from "../icon/ebig-icon";
import { useTranslation } from "react-i18next";
import { SelectDropdown } from "../dropdown/select-dropdown";

interface Props {
    id?: string,
    currentPage: number,
    itemPerPage: number,
    totalItem?: number,
    onChange?: (ev: { page: number, size: number }) => void,
    hideGoToPage?: boolean,
    hidePageSize?: boolean,
    style?: CSSProperties,
    className?: string,
    simpleStyle?: boolean
}

export function Pagination({ itemPerPage = 10, ...props }: Props) {
    const goToPageRef = useRef<TextFieldRef>(null)
    const { t } = useTranslation()

    useEffect(() => {
        if (goToPageRef.current) {
            const _inputPage = goToPageRef.current.inputElement
            if (_inputPage) _inputPage.value = props.currentPage.toString()
        }
    }, [props.currentPage])

    if (props.currentPage > 1 && (!props.totalItem || (Math.floor(props.totalItem / itemPerPage) + (props.totalItem % itemPerPage === 0 ? 0 : 1)) < props.currentPage)) {
        props.onChange?.({ page: 1, size: itemPerPage });
        return <div></div>;
    } else if (props.totalItem) {
        return <div id={props.id} className={`${styles[props.simpleStyle ? 'simple-custom-pagination' : 'custom-pagination']} row ${props.className ?? ""}`} style={props.style}>
            {!props.hidePageSize && <>
                <div className="row" style={{ gap: '0.8rem' }}>
                    <SelectDropdown
                        value={itemPerPage}
                        options={[10, 20, 50, 100, 200].map((item, _) => { return { id: item, name: `${item}` } })}
                        className="body-3 size24"
                        style={{ width: '6.8rem' }}
                        suffix={<Ebigicon src={"fill/arrows/down-arrow"} size={12} />}
                        onChange={(ev: any) => {
                            props.onChange?.({ page: props.currentPage, size: isNaN(parseInt(ev.id)) ? itemPerPage : parseInt(ev.id) });
                        }}
                    />
                    <Text className="body-3">{t("ofItems", { totalItem: props.totalItem })}</Text>
                </div>
                <div style={{ flex: 1 }} />
            </>}
            <ReactPaginate
                onPageChange={(ev) => {
                    props.onChange?.({ page: ev.selected + 1, size: itemPerPage });
                }}
                forcePage={props.currentPage - 1}
                breakClassName="row button-text-3"
                breakLabel="..."
                pageCount={Math.ceil(props.totalItem / itemPerPage)}
                previousClassName="row"
                previousLabel={<Ebigicon src={"fill/arrows/left-arrow"} size={14} />}
                nextClassName="row"
                nextLabel={<Ebigicon src={"fill/arrows/right-arrow"} size={14} />}
                containerClassName={`${styles['pagination']} row`}
                pageClassName="row button-text-3"
                activeClassName={styles['active']}
                hrefBuilder={(pageIndex: number) =>
                    pageIndex >= 1 && pageIndex <= Math.ceil(props.totalItem! / itemPerPage) ? `/page/${pageIndex}` : '#'
                }
                renderOnZeroPageCount={null}
            />
            {!props.hideGoToPage && <>
                <div style={{ height: '1.6rem', backgroundColor: "var(--neutral-bolder-border-color, light-dark(#D7D7DB, #494950))", width: 1 }} />
                <span className="label-3">{t("go")} {t("page").toLowerCase()}</span>
                <TextField
                    ref={goToPageRef as any}
                    style={{ width: '4.8rem', textAlign: "center" }}
                    className="body-3 size24"
                    type="number"
                    onBlur={(ev) => {
                        const _tmp = ev.target.value.trim().length ? parseInt(ev.target.value.trim()) : undefined
                        if (_tmp && !isNaN(_tmp) && _tmp > 0 && _tmp <= Math.ceil(props.totalItem! / itemPerPage)) {
                            props.onChange?.({ page: _tmp, size: itemPerPage })
                        } else ev.target.value = ""
                    }}
                />
            </>}
        </div>
    } else return <div id={props.id} style={props.style} className={props.className} />
}