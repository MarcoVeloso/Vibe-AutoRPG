(function () {
    const TRANSITION_TOTAL_MS = 1000;
    const HALF_DURATION_MS = TRANSITION_TOTAL_MS / 2;
    const FADEIN_PENDING_KEY = 'vibeAutorpgFadeInPending';
    const OVERLAY_ID = 'screen-transition-overlay';
    let isNavigating = false;

    function hasPendingFadeIn() {
        try {
            return window.sessionStorage.getItem(FADEIN_PENDING_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function ensureOverlay(startBlack) {
        let overlay = document.getElementById(OVERLAY_ID);

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.background = '#000';
            overlay.style.opacity = startBlack ? '1' : '0';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99999';
            overlay.style.transition = `opacity ${HALF_DURATION_MS}ms linear`;
            const mountTarget = document.body || document.documentElement;
            mountTarget.appendChild(overlay);
        }

        overlay.style.opacity = startBlack ? '1' : '0';

        return overlay;
    }

    function beginFadeInIfNeeded() {
        const needsFadeIn = hasPendingFadeIn();

        if (!needsFadeIn) return;
        ensureOverlay(true);

        window.addEventListener('DOMContentLoaded', () => {
            const overlay = ensureOverlay(true);
            void overlay.offsetHeight;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                    }, HALF_DURATION_MS + 50);
                });
            });
        });

        try {
            window.sessionStorage.removeItem(FADEIN_PENDING_KEY);
        } catch (e) {
            // ignore
        }
    }

    function navigateWithTransition(url, options) {
        if (!url || isNavigating) return;
        isNavigating = true;

        const opts = options || {};
        const useReplace = !!opts.replace;

        const runNavigation = () => {
            try {
                window.sessionStorage.setItem(FADEIN_PENDING_KEY, '1');
            } catch (e) {
                // ignore
            }

            if (useReplace) {
                window.location.replace(url);
            } else {
                window.location.href = url;
            }
        };

        const startFadeOut = () => {
            const overlay = ensureOverlay(false);
            void overlay.offsetHeight;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    overlay.style.opacity = '1';
                });
            });
            window.setTimeout(runNavigation, HALF_DURATION_MS);
        };

        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', startFadeOut, { once: true });
            return;
        }

        startFadeOut();
    }

    // Intercept internal anchor navigation to apply the transition.
    document.addEventListener('click', (event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const anchor = event.target.closest('a[href]');
        if (!anchor) return;
        if (anchor.target && anchor.target !== '_self') return;

        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        let targetUrl;
        try {
            targetUrl = new URL(href, window.location.href);
        } catch (e) {
            return;
        }

        if (targetUrl.origin !== window.location.origin) return;

        event.preventDefault();
        navigateWithTransition(targetUrl.href);
    });

    beginFadeInIfNeeded();
    window.navigateWithTransition = navigateWithTransition;
})();
