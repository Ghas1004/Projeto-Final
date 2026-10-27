// --- CATEGORIAS ---

const lista = document.getElementById('lista-categorias')
const formulario = document.getElementById('form-categoria')
const campoDescricao = document.getElementById('descricao')
const mensagem = document.getElementById('mensagem')

function mostrarMensagem(elemento, texto, erro = false) {
    elemento.textContent = texto
    elemento.classList.toggle('erro', erro)
}

function itemVazio(texto) {
    const item = document.createElement('li')
    item.className = 'vazio'
    item.textContent = texto
    return item
}

async function carregarCategorias() {
    lista.replaceChildren(itemVazio('Carregando...'))
    try {
        const resposta = await fetch('/api/categorias')
        const categorias = await resposta.json()
        if (!resposta.ok) throw new Error(categorias.erro)

        lista.replaceChildren()
        for (const categoria of categorias) {
            const item = document.createElement('li')
            item.textContent = `#${categoria.id_categoria} - ${categoria.descricao}`
            lista.appendChild(item)
        }
        if (categorias.length === 0) lista.replaceChildren(itemVazio('Nenhuma categoria cadastrada.'))
    } catch (erro) {
        lista.replaceChildren(itemVazio(`Erro: ${erro.message}`))
    }
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    try {
        const resposta = await fetch('/api/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: campoDescricao.value })
        })
        const dados = await resposta.json()

        if (resposta.ok) {
            mostrarMensagem(mensagem, `Categoria "${dados.descricao}" cadastrada!`)
            campoDescricao.value = ''
            carregarCategorias()
            carregarCategoriasNoSelect()
        } else {
            mostrarMensagem(mensagem, `Erro: ${dados.erro}`, true)
        }
    } catch {
        mostrarMensagem(mensagem, 'Erro: não foi possível falar com o servidor.', true)
    }
})

// --- PRODUTOS ---

const listaProdutos = document.getElementById('lista-produtos')
const formularioProduto = document.getElementById('form-produto')
const tituloProduto = document.getElementById('titulo-produto')
const campoProdutoId = document.getElementById('produto-id')
const campoProdutoDescricao = document.getElementById('produto-descricao')
const campoProdutoPreco = document.getElementById('produto-preco')
const campoProdutoCategoria = document.getElementById('produto-categoria')
const mensagemProduto = document.getElementById('mensagem-produto')
const btnProduto = document.getElementById('btn-produto')
const btnCancelarProduto = document.getElementById('btn-cancelar-produto')

async function carregarCategoriasNoSelect() {
    try {
        const resposta = await fetch('/api/categorias')
        const categorias = await resposta.json()
        if (!resposta.ok) return

        const selecionada = campoProdutoCategoria.value
        campoProdutoCategoria.replaceChildren()

        const padrao = document.createElement('option')
        padrao.value = ''
        padrao.textContent = 'Selecione a categoria'
        campoProdutoCategoria.appendChild(padrao)

        for (const categoria of categorias) {
            const opcao = document.createElement('option')
            opcao.value = categoria.id_categoria
            opcao.textContent = categoria.descricao
            campoProdutoCategoria.appendChild(opcao)
        }
        campoProdutoCategoria.value = selecionada
    } catch {
        // sem rede: o select fica só com a opção padrão
    }
}

async function carregarProdutos() {
    listaProdutos.replaceChildren(itemVazio('Carregando...'))
    try {
        const resposta = await fetch('/api/produtos')
        const produtos = await resposta.json()
        if (!resposta.ok) throw new Error(produtos.erro)

        listaProdutos.replaceChildren()
        for (const produto of produtos) {
            const item = document.createElement('li')

            const texto = document.createElement('span')
            texto.textContent = `#${produto.id_produto} - ${produto.descricao} - R$ ${Number(produto.preco).toFixed(2)} (${produto.categoria ?? 'sem categoria'})`

            const botaoEditar = document.createElement('button')
            botaoEditar.type = 'button'
            botaoEditar.className = 'secundario pequeno'
            botaoEditar.textContent = 'Editar'
            botaoEditar.addEventListener('click', () => entrarModoEdicao(produto))

            item.append(texto, botaoEditar)
            listaProdutos.appendChild(item)
        }
        if (produtos.length === 0) listaProdutos.replaceChildren(itemVazio('Nenhum produto cadastrado.'))
    } catch (erro) {
        listaProdutos.replaceChildren(itemVazio(`Erro: ${erro.message}`))
    }
}

function entrarModoEdicao(produto) {
    campoProdutoId.value = produto.id_produto
    campoProdutoDescricao.value = produto.descricao
    campoProdutoPreco.value = produto.preco
    campoProdutoCategoria.value = produto.id_categoria ?? ''
    tituloProduto.textContent = `Editar produto #${produto.id_produto}`
    btnProduto.textContent = 'Salvar'
    btnCancelarProduto.hidden = false
    mostrarMensagem(mensagemProduto, '')
    formularioProduto.scrollIntoView({ behavior: 'smooth', block: 'center' })
    campoProdutoDescricao.focus()
}

function sairModoEdicao() {
    campoProdutoId.value = ''
    formularioProduto.reset()
    tituloProduto.textContent = 'Novo produto'
    btnProduto.textContent = 'Cadastrar'
    btnCancelarProduto.hidden = true
}

btnCancelarProduto.addEventListener('click', sairModoEdicao)

formularioProduto.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const id = campoProdutoId.value
    const corpo = {
        descricao: campoProdutoDescricao.value,
        preco: Number(campoProdutoPreco.value),
        id_categoria: campoProdutoCategoria.value || null
    }

    const url = id ? `/api/produtos/${id}` : '/api/produtos'
    const metodo = id ? 'PUT' : 'POST'

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        })
        const dados = await resposta.json()

        if (resposta.ok) {
            mostrarMensagem(
                mensagemProduto,
                id ? `Produto "${dados.descricao}" atualizado!` : `Produto "${dados.descricao}" cadastrado!`
            )
            sairModoEdicao()
            carregarProdutos()
        } else {
            mostrarMensagem(mensagemProduto, `Erro: ${dados.erro}`, true)
        }
    } catch {
        mostrarMensagem(mensagemProduto, 'Erro: não foi possível falar com o servidor.', true)
    }
})

carregarCategorias()
carregarCategoriasNoSelect()
carregarProdutos()
