let regras = [];

/**
 * Converte "x.com.br" -> regex segura para pegar o domínio e subdomínios.
 * Resultado: /^x\.com\.br$|.*\.x\.com\.br$/i
 */
function dominioParaRegex(dominio) {
  const escaped = dominio.replace(/[.*+?^${}()|[\\]/g, '\\$&');
  return new RegExp(`^${escaped}$|.*\\.${escaped}$`, "i");
}

/**
 * Varre o histórico em busca de URLs que correspondem a uma lista de regras
 * e as remove.
 * @param {Array<{original: string, regex: RegExp}>} regrasParaLimpar - As regras a serem usadas na limpeza.
 */
function limparHistorico(regrasParaLimpar) {
  if (!regrasParaLimpar || regrasParaLimpar.length === 0) {
    return;
  }
  console.log('[NullTrace] Iniciando limpeza do histórico para:', regrasParaLimpar.map(r => r.original));

  for (const regra of regrasParaLimpar) {
    // A API de busca é limitada, então buscamos pelo texto do domínio e filtramos depois.
    // maxResults: 0 busca por todo o histórico.
    chrome.history.search({ text: regra.original, maxResults: 0 }, (items) => {
      items.forEach((item) => {
        try {
          const url = new URL(item.url);
          if (regra.regex.test(url.hostname)) {
            chrome.history.deleteUrl({ url: item.url });
            console.log(`[NullTrace] Limpeza: Removido ${item.url} do histórico.`);
          }
        } catch (_) {
          // Ignora URLs inválidas (ex: "about:blank")
        }
      });
    });
  }
}

/**
 * Busca todas as regras salvas e executa uma limpeza completa do histórico.
 */
function limpezaCompleta() {
    chrome.storage.sync.get(["regras"], (res) => {
        const todasAsRegras = (res.regras || []).map(r => ({
            original: r,
            regex: dominioParaRegex(r)
        }));
        if(todasAsRegras.length > 0) {
             limparHistorico(todasAsRegras);
        }
    });
}

// 1. Carregar regras salvas ao iniciar o service worker
chrome.storage.sync.get(["regras"], (res) => {
  regras = (res.regras || []).map(r => ({
    original: r,
    regex: dominioParaRegex(r)
  }));
});

// 2. Atualizar regras em tempo real e LIMPAR histórico para novas regras
chrome.storage.onChanged.addListener((changes) => {
  if (changes.regras) {
    const novasRegrasValor = changes.regras.newValue || [];
    const antigasRegrasValor = changes.regras.oldValue || [];

    // Atualiza a lista de regras em memória
    regras = novasRegrasValor.map(r => ({
      original: r,
      regex: dominioParaRegex(r)
    }));

    // Encontra regras recém-adicionadas para executar a limpeza imediatamente
    const regrasAdicionadas = novasRegrasValor.filter(r => !antigasRegrasValor.includes(r));
    if (regrasAdicionadas.length > 0) {
      const regrasParaLimpar = regrasAdicionadas.map(r => ({
          original: r,
          regex: dominioParaRegex(r)
      }));
      console.log(`[NullTrace] Novas regras detectadas. Limpando histórico para:`, regrasAdicionadas);
      limparHistorico(regrasParaLimpar);
    }
  }
});

// 3. O GUARDIÃO: Escutar histórico e apagar se der match (ação em tempo real)
chrome.history.onVisited.addListener((item) => {
  try {
    const url = new URL(item.url);

    for (const regra of regras) {
      if (regra.regex.test(url.hostname)) {
        chrome.history.deleteUrl({ url: item.url });
        console.log(`[NullTrace] Removido em tempo real: ${url.hostname}`);
        break;
      }
    }
  } catch (_) {
    // Ignora URLs inválidas
  }
});


// 4. LÓGICA DE LIMPEZA AUTOMÁTICA ADICIONAL

// Limpa na inicialização do navegador
chrome.runtime.onStartup.addListener(() => {
    console.log("[NullTrace] Navegador iniciado. Executando limpeza completa do histórico.");
    limpezaCompleta();
});

// Configura e executa limpeza periódica
chrome.runtime.onInstalled.addListener(() => {
    // Cria um alarme para limpeza periódica
    chrome.alarms.create('limpezaPeriodica', {
        delayInMinutes: 5, // Espera 5 min após a instalação/atualização
        periodInMinutes: 120 // Roda a cada 2 horas
    });
    console.log("[NullTrace] Alarme de limpeza periódica configurado.");

    // Executa uma limpeza completa na instalação/atualização
    limpezaCompleta();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'limpezaPeriodica') {
    console.log("[NullTrace] Alarme periódico disparado. Executando limpeza completa do histórico.");
    limpezaCompleta();
  }
});