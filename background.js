let regras = [];

/**
 * Converte "x.com.br" -> regex segura para pegar o domínio e subdomínios.
 * Resultado: /^x\\.com\\.br$|.*\\.x\\.com\\.br$/i
 */
function dominioParaRegex(dominio) {
  // Escapa todos os caracteres especiais de regex para segurança.
  const escaped = dominio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // A regex gerada garante que o hostname seja EXATAMENTE o domínio
  // ou termine com ".<domínio>", cobrindo todos os subdomínios.
  return new RegExp(`^${escaped}$|.*\\.${escaped}$`, "i");
}

// 1. Carregar regras salvas ao iniciar
chrome.storage.sync.get(["regras"], (res) => {
  regras = (res.regras || []).map(r => ({
    original: r,
    regex: dominioParaRegex(r)
  }));
});

// 2. Atualizar regras em tempo real
chrome.storage.onChanged.addListener((changes) => {
  if (changes.regras) {
    regras = (changes.regras.newValue || []).map(r => ({
      original: r,
      regex: dominioParaRegex(r)
    }));
  }
});

// 3. O GUARDIÃO: Escutar histórico e apagar se der match
chrome.history.onVisited.addListener((item) => {
  try {
    const url = new URL(item.url);

    for (const regra of regras) {
      if (regra.regex.test(url.hostname)) {
        chrome.history.deleteUrl({ url: item.url });
        console.log(`[NullTrace] Removido: ${url.hostname}`);
        break;
      }
    }
  } catch (_) {
    // Ignora URLs inválidas
  }
});
