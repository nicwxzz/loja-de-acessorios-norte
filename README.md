# Sistema Interno de Gestão

![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

Sistema web interno para gestão de produtos, estoque e usuários da loja Acessórios Norte.

---

## Como rodar

**Online:** [Acessar o sistema](https://nicwxzz.github.io/loja-de-acessorios-norte)

**Localmente:** baixe os arquivos e abra o `index.html` no navegador. Nenhuma instalação necessária.

Para ter acesso, é preciso se cadastrar primeiro e depois fazer o login.

---

## Tecnologias

- HTML5, CSS3, JavaScript (Vanilla)
- LocalStorage para persistência de dados
- jsPDF para exportação de relatórios

---

## Funcionalidades atuais

- Autenticação com 3 níveis de perfil: Operacional, Técnico e Administrador
- Cadastro, edição e exclusão de produtos
- Filtros por nome e faixa de preço
- Ordenação por colunas
- Alerta visual para estoque baixo (abaixo de 5 unidades)
- Importação de produtos via arquivo CSV
- Exportação de relatório em PDF
- Alternância entre modo claro e escuro
- Gerenciamento de usuários (somente Administrador)

---

## Roadmap

### Relatórios mais completos

- [ ] **Gráfico de estoque por categoria** — visualização em barras ou pizza
- [ ] **Exportação em Excel (.xlsx)** além do PDF já existente

### Produtos mais detalhados

- [ ] **Código de barras ou SKU** para facilitar busca e identificação

### Funcionalidades operacionais

- [ ] **Registro de vendas** — dar baixa automática no estoque ao registrar uma venda
- [ ] **Histórico de vendas por período** — relatório de saídas com filtro de data

### Melhorias no sistema

- [ ] **Recuperação de senha** para usuários que esqueceram o acesso
- [ ] **Log de atividades por usuário** — quem fez o quê e quando em todo o sistema

---

## Estrutura de arquivos

```
/
├── index.html      # Estrutura e telas do sistema
├── style.css       # Estilos e temas (claro/escuro)
├── app.js          # Lógica do sistema
└── README.md       # Este arquivo
```

---

## Formato do CSV para importação

Para importar produtos em massa, o arquivo `.csv` deve seguir o formato abaixo:

```
nome,categoria,preco,quantidade
Colar Gargantilha Dourada,Colares,79.90,18
Brinco Argola Grande Dourada,Brincos,49.90,30
```

**Categorias aceitas:** Bolsas, Cintos, Colares, Brincos, Pulseiras, Óculos, Outros

O sistema aceita tanto vírgula quanto ponto-e-vírgula como separador, e tanto `.` quanto `,` no preço.

---

## Perfis de acesso

| Perfil | Visualizar produtos | Gerenciar produtos | Importar CSV | Gerenciar usuários |
|---|---|---|---|---|
| Operacional | ✅ | ❌ | ❌ | ❌ |
| Técnico | ✅ | ✅ | ✅ | ❌ |
| Administrador | ✅ | ✅ | ✅ | ✅ |
