const input = document.getElementById("input");
const btnAdd = document.getElementById("add");
const lista = document.getElementById("lista");
let regras = [];
let editIndex = -1; // -1 significa que nenhum item está em modo de edição

function salvar() {
  chrome.storage.sync.set({ regras });
}

function render() {
  lista.innerHTML = "";

  regras.forEach((regra, index) => {
    const li = document.createElement("li");

    if (index === editIndex) {
      // --- MODO DE EDIÇÃO ---
      const editInput = document.createElement("input");
      editInput.className = "edit-input";
      editInput.value = regra;
      
      const actions = document.createElement("div");
      actions.className = "actions";

      const saveBtn = document.createElement("button");
      saveBtn.innerHTML = "💾"; // Ícone de salvar
      saveBtn.onclick = () => {
        const novoValor = editInput.value.trim().toLowerCase();
        if (novoValor && (novoValor === regra || !regras.includes(novoValor))) {
          regras[index] = novoValor;
          salvar();
        }
        editIndex = -1;
        render();
      };
      
      const cancelBtn = document.createElement("button");
      cancelBtn.innerHTML = "❌"; // Ícone de cancelar
      cancelBtn.onclick = () => {
        editIndex = -1;
        render();
      };

      li.appendChild(editInput);
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      li.appendChild(actions);

      setTimeout(() => editInput.focus(), 0);
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveBtn.click();
        if (e.key === "Escape") cancelBtn.click();
      });

    } else {
      // --- MODO DE VISUALIZAÇÃO ---
      const text = document.createElement("span");
      text.textContent = regra;
      text.className = "rule-text";

      const actions = document.createElement("div");
      actions.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.innerHTML = "✏️"; // Ícone de editar
      editBtn.onclick = () => {
        editIndex = index;
        render();
      };
      
      const delBtn = document.createElement("button");
      delBtn.innerHTML = "🗑️"; // Ícone de deletar
      delBtn.onclick = () => {
        regras.splice(index, 1);
        salvar();
        render();
      };
      
      li.appendChild(text);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      li.appendChild(actions);
    }
    
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
  editIndex = -1; // Garante que saia do modo de edição se estiver ativo
  salvar();
  render();
};

// Adicionar com Enter
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") btnAdd.click();
});