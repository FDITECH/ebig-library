import { CSSProperties, ReactNode } from "react";
import * as XLSX from 'xlsx';
import { Button } from "../../component/button/button";

// enum ExcelCol {
//     A = "A",
//     B = "B",
//     C = "C",
//     D = "D",
//     E = "E",
//     F = "F",
//     G = "G",
//     H = "H",
//     I = "I",
//     J = "J",
//     K = "K",
//     L = "L",
//     M = "M",
//     N = "N",
//     O = "O",
//     P = "P",
//     Q = "Q",
//     R = "R",
//     S = "S",
//     T = "T",
//     U = "U",
//     V = "V",
//     W = "W",
//     X = "X",
//     Y = "Y",
//     Z = "Z",
// }

interface Props {
    label: string,
    fileName?: string,
    sheetName?: string,
    getData: () => Promise<Array<{ [p: string]: any }>>,
    style?: CSSProperties,
    className?: string,
    disabled?: boolean,
    prefix?: ReactNode,
    suffix?: ReactNode,
    config?: { title: Array<string> }
}

export default function ExportXlsx(props: Props) {

    const onExport = async (ev: any) => {
        const btn = ev.target.closest("button")
        btn.disabled = true
        /* fetch JSON data and parse */
        const raw_data = await props.getData();
        if (raw_data.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(raw_data);
            const workbook = XLSX.utils.book_new();
            worksheet["!cols"] = (props.config?.title ?? Object.keys(raw_data[0])).map(e => ({ wch: e.length * 6 }))
            XLSX.utils.sheet_add_aoa(worksheet, [props.config?.title ?? Object.keys(raw_data[0])], { origin: "A1", cellStyles: true });
            styleRow(worksheet, 0, {
                font: {
                    name: 'Calibri',
                    sz: 12,
                    bold: true,
                    color: { rgb: "FFFFFF" } // White text
                },
                fill: {
                    patternType: "solid",
                    fgColor: { rgb: "4CAF50" } // Green background
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center"
                }
            });
            XLSX.utils.book_append_sheet(workbook, worksheet, props.sheetName ?? "Sheet 1");
            XLSX.writeFile(workbook, `${props.fileName ?? "Exported"}.xlsx`, { compression: true, bookType: 'xlsx', cellStyles: true });
        }
        btn.disabled = false
    }

    return <Button label={props.label} onClick={onExport} style={props.style} className={props.className} disabled={props.disabled} prefix={props.prefix} suffix={props.suffix} />
}

function styleRow(worksheet: XLSX.WorkSheet, rowIndex: number, style: any) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] ?? "A1"); // Get the range of the sheet
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
        if (!worksheet[cellAddress]) continue; // Skip if cell doesn't exist
        worksheet[cellAddress].s = style;
    }
}

export const handleFileUpload = (ev: any, onSuccess: (json: any) => void) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event: any) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        onSuccess(json);
    };
    reader.readAsArrayBuffer(file);
};

export const handleGoogleSheetFetch = async (sheetUrl: string, delimiter = ",") => {
    try {
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) throw new Error('Invalid Google Sheet URL');
        const sheetId = match[1];
        const gidMatch = sheetUrl.match(/gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        const res = await fetch(csvUrl);
        const csvText = await res.text();
        const lines = csvText.trim().split("\n");
        const headers = lines[0]
            .split(delimiter)
            .map(h => h
                .trim()
                .replace(/^\uFEFF/, "")   // remove BOM
                .replace(/^["']|["']$/g, "") // remove surrounding quotes
            );

        return lines.slice(1).map(line => {
            // Handle quoted fields with commas inside
            const values: any[] = [];
            let current: string = "";
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    values.push(current);
                    current = "";
                } else {
                    current += char;
                }
            }
            values.push(current); // last field

            return headers.reduce((obj: any, header, i) => {
                obj[header] = parseValue(values[i] ?? "");
                return obj;
            }, {});
        });
    } catch (err: any) {
        console.error(err.message)
        return undefined;
    }
};

function parseValue(value: any) {
    const trimmed = value.trim();

    // Empty
    if (trimmed === "" || trimmed === null) return null;

    // Boolean
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;

    // Number (int or float)
    if (!isNaN(trimmed) && trimmed !== "") return Number(trimmed);

    // Date (ISO or common formats)
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,                     // 2024-01-15
        /^\d{2}\/\d{2}\/\d{4}$/,                    // 01/15/2024
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,    // ISO datetime
    ];
    if (datePatterns.some(p => p.test(trimmed))) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
    }

    // JSON (array or object)
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try { return JSON.parse(trimmed); } catch { }
    }

    // String fallback
    return trimmed;
}