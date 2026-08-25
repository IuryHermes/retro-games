(function () {
    'use strict';

    const CACHE_TTL = 10 * 60 * 1000;
    const cores = new Set(['nes', 'snes', 'n64', 'gba', 'gb', 'gbc', 'segaMD', 'psx', 'pcsx_rearmed']);
    const extensions = {
        nes: ['nes', 'zip'], snes: ['sfc', 'smc', 'zip'], n64: ['z64', 'n64', 'v64', 'zip'],
        gba: ['gba', 'zip'], gb: ['gb', 'zip'], gbc: ['gbc', 'zip'], segaMD: ['md', 'gen', 'bin', 'zip'],
        psx: ['chd', 'bin', 'cue', 'm3u'], pcsx_rearmed: ['chd', 'bin', 'cue', 'm3u']
    };

    function cached(key) {
        try {
            const value = JSON.parse(sessionStorage.getItem(key) || 'null');
            return value && Date.now() - value.checkedAt < CACHE_TTL ? value : null;
        } catch (_) { return null; }
    }

    function webglAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
        } catch (_) { return false; }
    }

    async function remoteExists(url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
            if (response.status === 404 || response.status === 410) throw new Error('O arquivo deste jogo não está disponível no servidor.');
            return response.ok;
        } catch (error) {
            if (/não está disponível/.test(error.message)) throw error;
            return null; // Falha de HEAD/CORS não bloqueia um jogo que pode abrir normalmente.
        } finally { clearTimeout(timeout); }
    }

    async function check(options) {
        const core = String(options.core || '');
        const gameUrl = String(options.gameUrl || '');
        if (!cores.has(core)) throw new Error('O núcleo informado para este jogo é inválido.');
        if (typeof WebAssembly !== 'object') throw new Error('Este navegador não oferece suporte ao emulador WebAssembly.');
        let parsed;
        try { parsed = new URL(gameUrl, location.href); } catch (_) { throw new Error('O endereço do arquivo do jogo é inválido.'); }
        if (!/^https?:$/.test(parsed.protocol)) throw new Error('O endereço do jogo usa um protocolo não permitido.');
        const extension = parsed.pathname.split('.').pop().toLowerCase();
        if (!extensions[core]?.includes(extension)) throw new Error(`O arquivo .${extension || '?'} não é compatível com o núcleo ${core}.`);
        if (core === 'n64' && !webglAvailable()) throw new Error('A aceleração gráfica necessária para Nintendo 64 está indisponível neste navegador.');

        const discs = Array.isArray(options.discs) ? options.discs : [];
        if ((core === 'psx' || core === 'pcsx_rearmed') && discs.length) {
            if (new Set(discs).size !== discs.length) throw new Error('A coleção possui discos repetidos e foi bloqueada antes de iniciar.');
            if (discs.some(url => !/^https:\/\//i.test(url))) throw new Error('A coleção possui um endereço de disco inseguro.');
        }

        const key = `neo-preflight:${core}:${parsed.pathname}`;
        const previous = cached(key);
        if (previous) return previous;
        const targets = [parsed.href, ...discs.filter(url => url !== parsed.href)];
        const remoteChecks = await Promise.all(targets.map(remoteExists));
        const result = { ok: true, checkedAt: Date.now(), remoteChecked: remoteChecks.every(value => value === true), core, extension, files: targets.length };
        try { sessionStorage.setItem(key, JSON.stringify(result)); } catch (_) {}
        return result;
    }

    window.NeoEmulatorPreflight = { check };
})();
