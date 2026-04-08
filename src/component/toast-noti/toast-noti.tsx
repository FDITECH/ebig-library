import { Slide, toast, ToastOptions } from 'react-toastify';
import { ReactNode } from 'react';

const defaultOptions: ToastOptions = {
    hideProgressBar: true,
    transition: Slide,
    autoClose: 3000,
    position: "bottom-right",
    className: "body-3",
}

export class ToastMessage {

    static infor(message: string | ReactNode, options?: ToastOptions) {
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        toast.info(typeof message === "string" ? <span style={{ flex: 1 }}>{message}</span> : message, { ...defaultOptions, theme, ...(options ?? {}) });
    }

    static warn(message: string, options?: ToastOptions) {
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        toast.warn(<span style={{ flex: 1 }}>{message}</span>, { ...defaultOptions, theme, ...(options ?? {}) });
    }

    static success(message: string, options?: ToastOptions) {
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        toast.success(<span style={{ flex: 1 }}>{message}</span>, { ...defaultOptions, theme, ...(options ?? {}) });
    }

    static errors(message: string, options?: ToastOptions) {
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        toast.error(<span style={{ flex: 1 }}>{message}</span>, { ...defaultOptions, theme, ...(options ?? {}) });
    }
}