import { useEffect, useState } from "react"
import styles from "./offline-banner.module.css"

/** Returns `true` when the browser is offline */
export function useOnlineStatus() {
    const [online, setOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    )

    useEffect(() => {
        const goOnline = () => setOnline(true)
        const goOffline = () => setOnline(false)
        window.addEventListener("online", goOnline)
        window.addEventListener("offline", goOffline)
        return () => {
            window.removeEventListener("online", goOnline)
            window.removeEventListener("offline", goOffline)
        }
    }, [])

    return online
}

/**
 * Fixed top banner shown when the browser loses network connectivity.
 * Disappears automatically when back online.
 */
export function OfflineBanner() {
    const online = useOnlineStatus()
    if (online) return null

    return (
        <div className={styles.offlineBanner} role="alert">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 8.98C20.93 5.9 16.69 4 12 4C10.56 4 9.16 4.2 7.83 4.57L9.78 6.52C10.5 6.35 11.24 6.2 12 6.2C15.73 6.2 19.11 7.77 21.53 10.25L24 8.98ZM2.29 2.29L1 3.58L3.55 6.13C1.97 7.29 0.67 8.74 0 10.25L2.47 11.52C3.17 10.13 4.23 8.95 5.51 8.09L7.48 10.06C6.39 10.63 5.44 11.4 4.7 12.32L7.17 13.59C7.87 12.82 8.76 12.2 9.78 11.81L12.04 14.07C11.82 14.03 11.6 14 11.37 14C9.83 14 8.37 14.67 7.33 15.79L12 21L14.57 18.05L20.42 23.9L21.71 22.61L2.29 2.29ZM17.3 12.32L19.77 13.59C19.39 13.12 18.97 12.69 18.5 12.32H17.3Z" />
            </svg>
            <span>You are offline. Please check your internet connection.</span>
        </div>
    )
}
