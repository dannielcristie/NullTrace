const input = document.getElementById("input");
const btnAdd = document.getElementById("add");
const lista = document.getElementById("lista");
let regras = [];

function salvar() {
  chrome.storage.sync.set({ regras });
}

function render() {
  lista.innerHTML = "";

  regras.forEach((regra, index) => {
    const li = document.createElement("li");
    li.textContent = regra;

    const actions = document.createElement("div");
    actions.className = "actions";

    const del = document.createElement("button");
    del.innerHTML = "🗑️";
    del.onclick = () => {
      regras.splice(index, 1);
      salvar();
      render();
    };

    actions.appendChild(del);
    li.appendChild(actions);
    lista.appendChild(li);
  });
}

// Carregar ao abrir
chrome.storage.sync.get(["regras"], (res) => {
  regras = res.regras || [];
  render();
});

// Adicionar ao clicar
btnAdd.onclick = () => {
  const valor = input.value.trim().toLowerCase();
  
  if (!valor) return;
  if (regras.includes(valor)) {
    input.value = "";
    return;
  }

  regras.push(valor);
  input.value = "";
  salvar();
  render();
};

// Adicionar com Enter
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnAdd.click();
});