/* ════════════════════════════════════════════════
   Acessórios Norte — app.js
════════════════════════════════════════════════ */

// ════════════════════════════════════════════════
//  CHAVES DE ARMAZENAMENTO
//  (compatíveis com as do sistema original)
// ════════════════════════════════════════════════
const STORE = {
  usuarios: 'acessoriosNorte_usuarios',  // mesma chave do original
  logado:   'acessoriosNorte_logado',    // mesma chave do original
  produtos: 'acessoriosNorte_produtos',  // mesma chave do original
};

// ════════════════════════════════════════════════
//  ESTADO GLOBAL
// ════════════════════════════════════════════════
let state = {
  produtos:    [],
  usuario:     null,
  editProdId:  null,
  editUserId:  null,
  sortCol:     null,
  sortDir:     'asc',
  confirmCb:   null,
};

// ════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  await seedAdmin(); // Garante admin padrão no primeiro acesso

  const salvo = JSON.parse(localStorage.getItem(STORE.logado));
  if (salvo) {
    state.usuario = salvo;
    iniciarApp();
  } else {
    mostrarAuth('tela-login');
  }
});

// ════════════════════════════════════════════════
//  UTILITÁRIOS
// ════════════════════════════════════════════════

// Hash SHA-256 via Web Crypto API (senha nunca fica em texto puro)
async function hash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Exibe um toast temporário na tela
function toast(msg, tipo = '') {
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Valida um array de campos { fid, el, msg }
// Retorna true se todos estiverem preenchidos
function validar(campos) {
  let ok = true;
  campos.forEach(({ fid, el, msg }) => {
    const f = document.getElementById(fid);
    if (!el.value.trim()) {
      f.classList.add('bad');
      if (msg) f.querySelector('.err').textContent = msg;
      ok = false;
    } else {
      f.classList.remove('bad');
    }
  });
  return ok;
}

// Remove marcação de erro de uma lista de IDs de campo
function limparErros(...ids) {
  ids.forEach(id => document.getElementById(id)?.classList.remove('bad'));
}

// Abre o modal de confirmação com uma mensagem e um callback
function pedir(msg, cb) {
  document.getElementById('modal-msg').textContent = msg;
  document.getElementById('overlay').classList.add('open');
  state.confirmCb = cb;
}

function fecharModal() {
  document.getElementById('overlay').classList.remove('open');
  state.confirmCb = null;
}

function confirmarAcao() {
  if (state.confirmCb) state.confirmCb();
  fecharModal();
}

// ════════════════════════════════════════════════
//  AUTENTICAÇÃO
// ════════════════════════════════════════════════

// Controla qual tela de auth está visível
function mostrarAuth(id) {
  document.getElementById('auth-wrap').style.display    = 'flex';
  document.getElementById('app-shell').style.display    = 'none';
  document.getElementById('tela-login').style.display    = id === 'tela-login'    ? 'block' : 'none';
  document.getElementById('tela-cadastro').style.display = id === 'tela-cadastro' ? 'block' : 'none';
}

// Navega entre as telas de login e cadastro
function irPara(id) { mostrarAuth(id); }

// Cria o usuário administrador padrão na primeira vez que o sistema é aberto
async function seedAdmin() {
  const lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
  if (lista.length === 0) {
    lista.push({ id: 1, usuario: 'Nicolas', senha: await hash('123456'), perfil: 'administrador' });
    localStorage.setItem(STORE.usuarios, JSON.stringify(lista));
  }
}

// Faz o login do usuário verificando usuário e senha (hash)
async function login() {
  const el = { u: document.getElementById('lu'), s: document.getElementById('ls') };
  if (!validar([
    { fid: 'f-lu', el: el.u, msg: 'Informe o usuário' },
    { fid: 'f-ls', el: el.s, msg: 'Informe a senha'   },
  ])) return;

  const h = await hash(el.s.value);
  const lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
  const u = lista.find(u => u.usuario === el.u.value.trim() && u.senha === h);

  if (u) {
    state.usuario = u;
    localStorage.setItem(STORE.logado, JSON.stringify(u));
    iniciarApp();
  } else {
    toast('Usuário ou senha inválidos.', 'err');
  }
}

// Cadastra um novo usuário no sistema
async function cadastrar() {
  const el = {
    u: document.getElementById('cu'),
    s: document.getElementById('cs'),
    p: document.getElementById('cp'),
  };
  if (!validar([
    { fid: 'f-cu', el: el.u, msg: 'Informe o usuário'  },
    { fid: 'f-cs', el: el.s, msg: 'Informe a senha'    },
    { fid: 'f-cp', el: el.p, msg: 'Selecione o perfil' },
  ])) return;

  const lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
  if (lista.find(u => u.usuario === el.u.value.trim())) {
    toast('Usuário já existe!', 'err');
    return;
  }

  lista.push({ id: Date.now(), usuario: el.u.value.trim(), senha: await hash(el.s.value), perfil: el.p.value });
  localStorage.setItem(STORE.usuarios, JSON.stringify(lista));
  toast('Usuário cadastrado!', 'ok');
  irPara('tela-login');
}

// Encerra a sessão do usuário
function logout() {
  localStorage.removeItem(STORE.logado);
  state.usuario = null;
  mostrarAuth('tela-login');
}

// ════════════════════════════════════════════════
//  APP SHELL
// ════════════════════════════════════════════════

// Inicializa o dashboard após o login
function iniciarApp() {
  document.getElementById('auth-wrap').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';

  const u = state.usuario;
  document.getElementById('sb-nome').textContent   = u.usuario;
  document.getElementById('sb-perfil').textContent = u.perfil;

  // Menu de usuários visível somente para administrador
  document.getElementById('nav-usuarios').style.display =
    u.perfil === 'administrador' ? 'flex' : 'none';

  // Carrega produtos do localStorage
  state.produtos = JSON.parse(localStorage.getItem(STORE.produtos)) || [];

  abrirTela('produtos');
}

// Troca a tela ativa no dashboard
function abrirTela(nome) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tela-${nome}`)?.classList.add('on');
  document.getElementById(`nav-${nome}`)?.classList.add('active');

  if (nome === 'produtos') {
    const operacional = state.usuario.perfil === 'operacional';
    // Operacional não vê o formulário de produto nem o botão de importação
    document.getElementById('form-produto').style.display     = operacional ? 'none'  : 'block';
    document.getElementById('btn-importar-csv').style.display = operacional ? 'none'  : 'inline-flex';
    renderProdutos();
  }
  if (nome === 'usuarios') renderUsers();
}

// ════════════════════════════════════════════════
//  PRODUTOS — CRUD
// ════════════════════════════════════════════════

const ESTOQUE_MIN = 5; // Quantidade mínima antes do alerta visual

// Salva um produto novo ou atualiza um existente
function salvarProduto() {
  const el = {
    n: document.getElementById('pn'),
    c: document.getElementById('pc'),
    p: document.getElementById('pp'),
    q: document.getElementById('pq'),
  };
  if (!validar([
    { fid: 'f-pn', el: el.n, msg: 'Informe o nome'        },
    { fid: 'f-pc', el: el.c, msg: 'Selecione a categoria'  },
    { fid: 'f-pp', el: el.p, msg: 'Informe o preço'        },
    { fid: 'f-pq', el: el.q, msg: 'Informe a quantidade'   },
  ])) return;

  const prod = {
    nome:       el.n.value.trim(),
    categoria:  el.c.value,
    preco:      parseFloat(el.p.value),
    quantidade: parseInt(el.q.value),
  };

  if (state.editProdId !== null) {
    // Atualiza produto existente
    const idx = state.produtos.findIndex(p => p.id === state.editProdId);
    if (idx !== -1) state.produtos[idx] = { ...state.produtos[idx], ...prod };
    toast('Produto atualizado!', 'ok');
    cancelarEdicao();
  } else {
    // Adiciona produto novo
    prod.id = Date.now();
    state.produtos.push(prod);
    toast('Produto adicionado!', 'ok');
  }

  localStorage.setItem(STORE.produtos, JSON.stringify(state.produtos));
  limparFormProd();
  renderProdutos();
}

// Limpa os campos do formulário de produto
function limparFormProd() {
  ['pn', 'pc', 'pp', 'pq'].forEach(id => document.getElementById(id).value = '');
  limparErros('f-pn', 'f-pc', 'f-pp', 'f-pq');
}

// Cancela a edição e volta ao modo de adição
function cancelarEdicao() {
  state.editProdId = null;
  limparFormProd();
  document.getElementById('btn-salvar-prod').textContent     = '＋ Adicionar';
  document.getElementById('btn-cancelar-prod').style.display = 'none';
  document.getElementById('form-titulo').textContent          = 'Adicionar produto';
}

// Preenche o formulário com os dados do produto para edição
function editarProduto(id) {
  const p = state.produtos.find(p => p.id === id);
  if (!p) return;
  state.editProdId = id;
  document.getElementById('pn').value = p.nome;
  document.getElementById('pc').value = p.categoria;
  document.getElementById('pp').value = p.preco;
  document.getElementById('pq').value = p.quantidade;
  document.getElementById('btn-salvar-prod').textContent     = '💾 Salvar alterações';
  document.getElementById('btn-cancelar-prod').style.display = 'inline-flex';
  document.getElementById('form-titulo').textContent          = 'Editar produto';
  document.getElementById('pn').focus();
  document.getElementById('form-produto').scrollIntoView({ behavior: 'smooth' });
}

// Remove um produto após confirmação
function excluirProduto(id) {
  pedir('Deseja excluir este produto?', () => {
    state.produtos = state.produtos.filter(p => p.id !== id);
    localStorage.setItem(STORE.produtos, JSON.stringify(state.produtos));
    toast('Produto excluído.', 'ok');
    renderProdutos();
  });
}

// ════════════════════════════════════════════════
//  PRODUTOS — FILTRO E ORDENAÇÃO
// ════════════════════════════════════════════════

// Retorna a lista de produtos com filtros e ordenação aplicados
function filtrados() {
  const busca = document.getElementById('f-busca')?.value.toLowerCase() || '';
  const min   = parseFloat(document.getElementById('f-pmin')?.value) || 0;
  const max   = parseFloat(document.getElementById('f-pmax')?.value) || Infinity;

  let lista = state.produtos.filter(p =>
    p.nome.toLowerCase().includes(busca) &&
    p.preco >= min && p.preco <= max
  );

  if (state.sortCol) {
    lista = lista.slice().sort((a, b) => {
      let va = a[state.sortCol], vb = b[state.sortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      const d = state.sortDir === 'asc' ? 1 : -1;
      return va < vb ? -d : va > vb ? d : 0;
    });
  }
  return lista;
}

// Define a coluna e direção de ordenação
function ordenar(col) {
  state.sortDir = state.sortCol === col && state.sortDir === 'asc' ? 'desc' : 'asc';
  state.sortCol = col;
  renderProdutos();
}

// ════════════════════════════════════════════════
//  PRODUTOS — RENDER
// ════════════════════════════════════════════════

// Atualiza a tabela de produtos na tela
function renderProdutos() {
  const tbody  = document.getElementById('tbody-prod');
  const lista  = filtrados();
  const perfil = state.usuario?.perfil;

  // Atualiza ícones de ordenação nos cabeçalhos
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.classList.remove('asc', 'desc');
    if (th.dataset.col === state.sortCol) th.classList.add(state.sortDir);
  });

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="td-empty">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const baixo = p.quantidade < ESTOQUE_MIN;
    const acoes = perfil !== 'operacional'
      ? `<button class="btn btn-ghost btn-icon" onclick="editarProduto(${p.id})" title="Editar">✏️</button>
         <button class="btn btn-danger btn-icon" onclick="excluirProduto(${p.id})" title="Excluir">🗑️</button>`
      : `<span style="color:var(--muted);font-size:12px">—</span>`;

    return `
      <tr${baixo ? ' class="low"' : ''}>
        <td>${p.nome}</td>
        <td>R$ ${p.preco.toFixed(2)}</td>
        <td class="qty">${p.quantidade}${baixo ? ' ⚠️' : ''}</td>
        <td><span class="badge badge-cat">${p.categoria}</span></td>
        <td>${acoes}</td>
      </tr>`;
  }).join('');
}

// ════════════════════════════════════════════════
//  USUÁRIOS — CRUD (somente administrador)
// ════════════════════════════════════════════════

// Atualiza a tabela de usuários na tela
function renderUsers() {
  if (state.usuario?.perfil !== 'administrador') return;
  const lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
  const tbody = document.getElementById('tbody-users');

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="td-empty">Nenhum usuário.</td></tr>`;
    return;
  }

  const classes = { administrador: 'badge-admin', tecnico: 'badge-tec', operacional: 'badge-op' };

  tbody.innerHTML = lista.map(u => `
    <tr>
      <td>${u.usuario}</td>
      <td><span class="badge ${classes[u.perfil] || ''}">${u.perfil}</span></td>
      <td>
        <button class="btn btn-ghost btn-icon" onclick="editarUser(${u.id})" title="Editar">✏️</button>
        <button class="btn btn-danger btn-icon" onclick="excluirUser(${u.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('');
}

// Preenche o painel de edição com os dados do usuário selecionado
function editarUser(id) {
  const lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
  const u = lista.find(u => u.id === id);
  if (!u) return;
  state.editUserId = id;
  document.getElementById('eun').value = u.usuario;
  document.getElementById('eup').value = u.perfil;
  document.getElementById('eus').value = '';
  document.getElementById('painel-edit-user').style.display = 'block';
}

// Salva as alterações do usuário em edição
async function salvarUser() {
  const el = {
    n: document.getElementById('eun'),
    p: document.getElementById('eup'),
    s: document.getElementById('eus'),
  };
  if (!validar([
    { fid: 'f-eun', el: el.n, msg: 'Informe o nome'     },
    { fid: 'f-eup', el: el.p, msg: 'Selecione o perfil'  },
  ])) return;

  const lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
  const idx = lista.findIndex(u => u.id === state.editUserId);
  if (idx === -1) return;

  lista[idx].usuario = el.n.value.trim();
  lista[idx].perfil  = el.p.value;
  // Só atualiza a senha se um novo valor foi digitado
  if (el.s.value.trim()) lista[idx].senha = await hash(el.s.value);

  localStorage.setItem(STORE.usuarios, JSON.stringify(lista));
  toast('Usuário atualizado!', 'ok');
  cancelarEditUser();
  renderUsers();
}

// Fecha o painel de edição de usuário
function cancelarEditUser() {
  state.editUserId = null;
  document.getElementById('painel-edit-user').style.display = 'none';
}

// Remove um usuário após confirmação (não permite excluir a si mesmo)
function excluirUser(id) {
  if (id === state.usuario?.id) {
    toast('Você não pode excluir seu próprio usuário.', 'err');
    return;
  }
  pedir('Deseja excluir este usuário?', () => {
    let lista = JSON.parse(localStorage.getItem(STORE.usuarios)) || [];
    lista = lista.filter(u => u.id !== id);
    localStorage.setItem(STORE.usuarios, JSON.stringify(lista));
    toast('Usuário excluído.', 'ok');
    renderUsers();
  });
}

// ════════════════════════════════════════════════
//  IMPORTAÇÃO CSV
// ════════════════════════════════════════════════

// Categorias válidas aceitas no sistema
const CATEGORIAS_VALIDAS = ['Bolsas','Cintos','Colares','Brincos','Pulseiras','Óculos','Outros'];

// Abre o seletor de arquivo CSV invisível
function abrirImportCSV() {
  document.getElementById('csv-input').click();
}

// Processa o arquivo CSV selecionado e importa os produtos
function importarCSV(input) {
  const arquivo = input.files[0];
  if (!arquivo) return;

  // Aceita apenas .csv
  if (!arquivo.name.toLowerCase().endsWith('.csv')) {
    toast('Selecione um arquivo .csv válido.', 'err');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const texto = e.target.result;
    const linhas = texto.trim().split(/\r?\n/);

    if (linhas.length < 2) {
      toast('O arquivo está vazio ou sem dados.', 'err');
      input.value = '';
      return;
    }

    // Detecta separador (vírgula ou ponto-e-vírgula)
    const sep = linhas[0].includes(';') ? ';' : ',';
    const cabecalho = linhas[0].split(sep).map(c => c.trim().toLowerCase());

    // Verifica se as colunas obrigatórias existem
    const obrigatorios = ['nome', 'categoria', 'preco', 'quantidade'];
    const faltando = obrigatorios.filter(c => !cabecalho.includes(c));
    if (faltando.length) {
      toast(`Colunas faltando no CSV: ${faltando.join(', ')}`, 'err');
      input.value = '';
      return;
    }

    const idx = {
      nome:       cabecalho.indexOf('nome'),
      categoria:  cabecalho.indexOf('categoria'),
      preco:      cabecalho.indexOf('preco'),
      quantidade: cabecalho.indexOf('quantidade'),
    };

    let importados = 0;
    let ignorados  = 0;
    const erros    = [];

    linhas.slice(1).forEach((linha, i) => {
      if (!linha.trim()) return; // pula linhas em branco

      const cols = linha.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
      const num  = i + 2; // número real da linha no arquivo

      const nome      = cols[idx.nome]      || '';
      const categoria = cols[idx.categoria] || '';
      // Aceita tanto vírgula quanto ponto como decimal no preço
      const preco     = parseFloat((cols[idx.preco] || '').replace(',', '.'));
      const quantidade = parseInt(cols[idx.quantidade] || '');

      // Validações por linha
      if (!nome) {
        erros.push(`Linha ${num}: nome em branco`);
        ignorados++; return;
      }
      if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        erros.push(`Linha ${num}: categoria inválida ("${categoria}")`);
        ignorados++; return;
      }
      if (isNaN(preco) || preco < 0) {
        erros.push(`Linha ${num}: preço inválido`);
        ignorados++; return;
      }
      if (isNaN(quantidade) || quantidade < 0) {
        erros.push(`Linha ${num}: quantidade inválida`);
        ignorados++; return;
      }

      state.produtos.push({ id: Date.now() + importados, nome, categoria, preco, quantidade });
      importados++;
    });

    localStorage.setItem(STORE.produtos, JSON.stringify(state.produtos));
    renderProdutos();
    input.value = ''; // reseta o input para permitir reimportar o mesmo arquivo

    if (importados > 0) toast(`${importados} produto(s) importado(s)!`, 'ok');
    if (ignorados  > 0) {
      setTimeout(() => toast(`${ignorados} linha(s) ignorada(s) por erros.`, 'err'), 400);
      console.warn('Erros na importação CSV:\n' + erros.join('\n'));
    }
  };

  reader.onerror = () => toast('Erro ao ler o arquivo.', 'err');
  reader.readAsText(arquivo, 'UTF-8');
}

// ════════════════════════════════════════════════
//  RELATÓRIO PDF
// ════════════════════════════════════════════════

// Gera e baixa o relatório em PDF com totais por produto
function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF();
  const hoje = new Date().toLocaleDateString('pt-BR');

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Loja de Acessórios Norte — Relatório de Produtos', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Gerado em ${hoje}`, 14, 25);
  doc.line(14, 28, 196, 28);

  // Cabeçalhos da tabela
  let y = 36;
  doc.setFont('helvetica', 'bold');
  doc.text('Produto',   14,  y);
  doc.text('Categoria', 80,  y);
  doc.text('Preço',    128,  y);
  doc.text('Qtd',      155,  y);
  doc.text('Subtotal', 172,  y);
  y += 5;
  doc.line(14, y, 196, y);
  y += 7;

  // Linhas dos produtos
  doc.setFont('helvetica', 'normal');
  let totalValor = 0;
  state.produtos.forEach(p => {
    const sub = p.preco * p.quantidade;
    totalValor += sub;
    doc.text(String(p.nome).substring(0, 34), 14,  y);
    doc.text(String(p.categoria),             80,  y);
    doc.text(`R$ ${p.preco.toFixed(2)}`,     128,  y);
    doc.text(String(p.quantidade),           155,  y);
    doc.text(`R$ ${sub.toFixed(2)}`,         172,  y);
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; } // Nova página se necessário
  });

  // Totais gerais
  doc.line(14, y, 196, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de produtos: ${state.produtos.length}`, 14, y);
  doc.text(`Valor total em estoque: R$ ${totalValor.toFixed(2)}`, 14, y + 8);

  doc.save('relatorio_acessorios_norte.pdf');
  toast('PDF exportado!', 'ok');
}