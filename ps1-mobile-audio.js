(function () {
    'use strict';

    const params = new URLSearchParams(location.search);
    const core = (params.get('core') || '').toLowerCase();
    const system = (params.get('system') || '').toLowerCase();
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const mobilePs1 = mobile && (core === 'psx' || core === 'pcsx_rearmed' || system === 'ps1');

    window.NEO_MOBILE_PS1_AUDIO = mobilePs1;
    if (!mobilePs1) return;

    // EmulatorJS creates retroarch.cfg inside GameManager. Patch the public
    // class before loader.js instantiates EmulatorJS, without forking the CDN.
    function installProfile() {
        const Manager = window.EJS_GameManager;
        if (!Manager || !Manager.prototype || Manager.prototype.__neoPs1AudioProfile) return false;
        const original = Manager.prototype.getRetroArchCfg;
        if (typeof original !== 'function') return false;

        Manager.prototype.getRetroArchCfg = function () {
            const cfg = original.call(this);
            return cfg
                .replace(/(^|\n)audio_latency\s*=\s*\d+/m, '$1audio_latency = 256')
                .replace(/(^|\n)video_vsync\s*=\s*(?:false|"false"|0)/m, '$1video_vsync = true');
        };
        Manager.prototype.__neoPs1AudioProfile = true;
        return true;
    }

    const observer = new MutationObserver((records) => {
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (node.tagName !== 'SCRIPT' || !/emulator(?:\.min)?\.js(?:[?#]|$)/i.test(node.src || '')) continue;
                node.addEventListener('load', () => {
                    if (installProfile()) observer.disconnect();
                });
            }
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    if (installProfile()) observer.disconnect();
}());
