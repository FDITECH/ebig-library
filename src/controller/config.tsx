import axios from 'axios';
import { Util } from "./utils";
import { ToastMessage } from '../component/toast-noti/toast-noti';

export class ConfigData {
    static pid = "";
    static url = "";
    static fileUrl = "";
    static imgUrlId = "";
    static regexGuid = /^[0-9a-fA-F]{32}$/;
    static ebigCdn = "https://cdn.ebig.co"
    static onInvalidToken = () => Util.clearCookie();
}

export const refreshTokenHeaders = { 'Content-Type': 'application/json', pid: "wini" }
export const specialCharsRegex = /[^a-zA-Z0-9]/g;

export const imgFileTypes = [".png", ".svg", ".jpg", "jpeg", ".webp", ".gif"]

const maxFileSize = 200 * 1024 * 1024
export class BaseDA {
    static post = async (url: string, options?: { headers?: { [k: string]: any }, body?: any, withCredentials?: boolean }) => {
        try {
            let _headers = { 'Content-Type': 'application/json' }
            if (options?.headers) _headers = { ..._headers, ...options.headers }
            const response = await axios.post(url, options?.body, { headers: _headers, withCredentials: options?.withCredentials ?? (url.startsWith(ConfigData.url)) })
            if (response.status === 200 || response.status === 201) {
                return response.data
            } else if (response.status === 204) {
                return {
                    message: 'ok',
                    data: options?.body
                }
            } else if (response.status === 401) {
                ToastMessage.errors('Unauthorized access')
                ConfigData.onInvalidToken()
            } else {
                console.log("error: ??: ", response.statusText)
                return { status: response.status, message: response.statusText };
            }
        } catch (error) {
            console.error("Failed to POST data:", error);
            throw error;
        }
    }

    static postFile = async (url: string, options?: { headers?: { [k: string]: any }, body?: any }) => {
        try {
            if (options?.headers) {
                options.headers["Content-Type"] = "multipart/form-data"
            }
            const response = await axios.post(url, options?.body, { headers: options?.headers ?? { "Content-Type": "multipart/form-data" } })
            switch (response.status) {
                case 200:
                case 201:
                    return response.data
                case 204:
                    return {
                        message: 'ok',
                        data: options?.body
                    }
                case 401:
                    ToastMessage.errors('Unauthorized access')
                    ConfigData.onInvalidToken()
                    return;
                default:
                    console.log("error: ??: ", response.statusText)
                    return { status: response.status, message: response.statusText };
            }
        } catch (error) {
            console.error("Failed to POST data:", error);
            return undefined;
        }
    }

    static get = async (url: string, options?: { headers?: { [k: string]: any }, withCredentials?: boolean }) => {
        try {
            let _headers = { 'Content-Type': 'application/json' }
            if (options?.headers) _headers = { ..._headers, ...options.headers }
            const response = await axios.get(url, { headers: _headers, withCredentials: options?.withCredentials ?? (url.startsWith(ConfigData.url)) })
            if (response.status === 200 || response.status === 201) {
                return response.data
            } else if (response.status === 204) {
                return { message: 'ok' }
            } else if (response.status === 401) {
                ToastMessage.errors('Unauthorized access')
                ConfigData.onInvalidToken()
                return;
            } else {
                console.log("error: ??: ", response.statusText)
                return { status: response.status, message: response.statusText };
            }
        } catch (error) {
            console.error("Failed to GET data:", error);
            return undefined;
        }
    }

    static uploadFiles = async (listFile: File[] | { id: string, file: File }[], headers?: { [k: string]: any }) => {
        const loader = document.createElement("div")
        loader.className = "loader"
        document.body.appendChild(loader)

        listFile = [...listFile] as any
        // Extract files and IDs
        const files = listFile.map(e => e instanceof File ? e : e.file);
        const ids = listFile.map(e => e instanceof File ? null : e.id).filter(Boolean);

        const headersObj: any = { pid: ConfigData.pid, ...headers }
        // Remove Content-Type - browser will set it with boundary for multipart

        const listRequest: Array<{ files: File[], ids: string[] }> = [{ files: [], ids: [] }]

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const id = ids[i] || null;

            if (file.size > maxFileSize) {
                ToastMessage.errors('File size must be not more than 200MB')
                loader.remove()
                return null
            } else {
                const tmp = listRequest[listRequest.length - 1];
                const totalSize = [...tmp.files, file].map(f => f.size).reduce((a, b) => a + b, 0);

                // Check if need to create new batch
                if (tmp.files.length >= 12 || totalSize > maxFileSize) {
                    listRequest.push({ files: [file], ids: id ? [id] : [] })
                } else {
                    tmp.files.push(file);
                    if (id) tmp.ids.push(id);
                }
            }
        }

        const response = await Promise.all(listRequest.map(rq => {
            const formData = new FormData();
            rq.files.forEach(e => {
                formData.append("files", e);
            })
            // Add IDs if provided
            if (rq.ids.length > 0) {
                formData.append("ids", rq.ids.join(","));
            }
            return BaseDA.postFile(ConfigData.url + 'file/uploadfiles', {
                headers: headersObj,
                body: formData,
            })
        }))

        loader.remove()
        if (response.every(r => r.code === 200)) {
            return response.map(r => r.data).flat(Infinity)
        } else {
            ToastMessage.errors(response.find(r => r.code !== 200)?.message ?? "Failed to upload files")
        }
        return null;
    }

    static getFilesInfor = async (ids: Array<string>) => {
        const response = await BaseDA.post(ConfigData.url + 'file/getFilesInfor', {
            headers: { pid: ConfigData.pid, 'Content-Type': 'application/json' },
            body: { ids },
        })
        return response
    }

    static updateFilesInfor = async (data: Array<{ [p: string]: any }>) => {
        const response = await BaseDA.post(ConfigData.url + 'file/editFileInfor', {
            headers: { pid: ConfigData.pid, 'Content-Type': 'application/json' },
            body: { data },
        })
        return response
    }

    static deleteFiles = async (ids: Array<string>, headers?: { [k: string]: any }) => {
        const loader = document.createElement("div")
        loader.className = "loader"
        document.body.appendChild(loader)

        const headersObj: any = { "Content-Type": "application/json", pid: ConfigData.pid, ...headers }

        const response = await BaseDA.post(ConfigData.url + 'file/deleteFiles', {
            headers: headersObj,
            body: { ids },
        })
        loader.remove()
        return response
    }

    static duplicateFiles = async (ids: Array<string>, headers?: { [k: string]: any }) => {
        const loader = document.createElement("div")
        loader.className = "loader"
        document.body.appendChild(loader)

        const headersObj: any = { "Content-Type": "application/json", pid: ConfigData.pid, ...headers }

        const response = await BaseDA.post(ConfigData.url + 'file/duplicateFiles', {
            headers: headersObj,
            body: { ids },
        })
        loader.remove()
        return response
    }
}

export class CkEditorUploadAdapter {
    loader: any;


    constructor(loader: any) {
        // The file loader instance to use during the upload.
        this.loader = loader;
    }

    // Starts the upload process.
    upload() {
        return this.loader.file.then((file: any) => new Promise((resolve, reject) => {
            this._sendRequest(file, resolve, reject);
        }));
    }

    async _sendRequest(file: File, resolve: { (value: unknown): void; (arg0: { default: string }): void }, reject: { (arg0: string): void }) {
        BaseDA.uploadFiles([file]).then((res: any) => {
            if (res?.length) {
                resolve({
                    default: res[0].Url
                })
            } else {
                ToastMessage.errors("Failed to upload file")
                reject("Failed to upload file")
                console.error(`Failed to upload file: ${res?.message}`)
            }
        }).catch(err => {
            ToastMessage.errors("Failed to upload file")
            reject("Failed to upload file")
            console.error(`Failed to upload file: ${err.message}`)
        })
    }
}