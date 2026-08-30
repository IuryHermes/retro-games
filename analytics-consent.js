(function () {
    'use strict';

    // Preencha com o ID da propriedade GA4 (formato G-XXXXXXXXXX).
    // Enquanto estiver vazio, nenhum pedido ao Google Analytics será feito.
    const GA4_MEASUREMENT_ID = 'G-CJNYR5QTZX';
    const queue = [];
    let loaded = false;

    const validId = () => /^G-[A-Z0-9]{6,}$/i.test(GA4_MEASUREMENT_ID);
    const allowed = () => Boolean(window.NeoPrivacy?.has?.('analytics'));
    const cleanParams = params => Object.fromEntries(Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''));

    function loadAnalytics() {
        if (loaded || !allowed() || !validId()) return false;
        loaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA4_MEASUREMENT_ID, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
        document.head.appendChild(script);
        while (queue.length) {
            const [name, params] = queue.shift();
            window.gtag('event', name, params);
        }
        return true;
    }

    window.neoTrack = (name, params = {}) => {
        if (!allowed() || !validId()) return;
        const safe = cleanParams(params);
        if (!loadAnalytics()) queue.push([name, safe]);
        else window.gtag('event', name, safe);
    };

    window.addEventListener('neo:consent-changed', event => {
        if (event.detail?.analytics) loadAnalytics();
    });
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', loadAnalytics, { once:true }) : loadAnalytics();
})();
