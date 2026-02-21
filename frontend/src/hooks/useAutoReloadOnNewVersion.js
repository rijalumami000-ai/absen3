import { useEffect } from 'react';

const APP_VERSION = process.env.REACT_APP_BUILD_VERSION || 'dev-local';

export function useAutoReloadOnNewVersion() {
  useEffect(() => {
    let cancelled = false;

    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const latest = data.version;
        if (!latest) return;

        if (latest !== APP_VERSION && !cancelled) {
          // Versi app di server beda dengan versi yang sedang jalan -> reload paksa
          window.location.reload(true);
        }
      } catch (e) {
        // Bisa diabaikan, jangan ganggu UX
        // console.warn('Gagal cek versi app', e);
      }
    };

    // Cek sekali saat mount
    checkVersion();

    // Cek berkala, misalnya tiap 60 detik
    const id = setInterval(checkVersion, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
}
