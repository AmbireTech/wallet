import { useState, useEffect } from 'react'

export default function useIsWindowMobile () {
    const [isWindowMobile, setIsWindowMobile] = useState(false);
    useEffect(() => {
        function handler() {
            setIsWindowMobile(window.innerWidth <= 800);
        }
        window.addEventListener("resize", handler);
        handler()
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isWindowMobile;
}
