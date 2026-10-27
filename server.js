const http = require('http')
const fs = require('fs')
const path = require('path')
const { executarQueryNeon, listarProdutos, inserirProduto, atualizarProduto } = require('./scriptdb')

const PORTA = process.env.PORT || 3001

const arquivos = {
    '/': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/index.html': { arquivo: 'index.html', tipo: 'text/html; charset=utf-8' },
    '/app.js': { arquivo: 'app.js', tipo: 'text/javascript; charset=utf-8' },
    '/style.css': { arquivo: 'style.css', tipo: 'text/css; charset=utf-8' }
}

function responderJSON(res, status, dados) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(dados))
}

function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let corpo = ''
        req.on('data', pedaco => corpo += pedaco)
        req.on('end', () => {
            try { resolve(JSON.parse(corpo || '{}')) }
            catch (erro) { reject(erro) }
        })
        req.on('error', reject)
    })
}

const servidor = http.createServer(async (req, res) => {
    // ignora query string (ex.: /api/produtos?x=1)
    const url = req.url.split('?')[0]

    try {
        if (url === '/api/categorias' && req.method === 'GET') {
            const linhas = await executarQueryNeon('SELECT * FROM categoria ORDER BY id_categoria')
            if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao consultar o banco' })
            return responderJSON(res, 200, linhas)
        }

        if (url === '/api/categorias' && req.method === 'POST') {
            let corpo
            try { corpo = await lerCorpo(req) }
            catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }

            const descricao = String(corpo.descricao || '').trim()
            if (!descricao) return responderJSON(res, 400, { erro: 'Informe a descrição' })

            const linhas = await executarQueryNeon(
                'INSERT INTO categoria (descricao) VALUES ($1) RETURNING *',
                [descricao]
            )
            if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao inserir no banco' })
            return responderJSON(res, 201, linhas[0])
        }

        if (url === '/api/produtos' && req.method === 'GET') {
            const linhas = await listarProdutos()
            if (linhas === null) return responderJSON(res, 500, { erro: 'Falha ao consultar o banco' })
            return responderJSON(res, 200, linhas)
        }

        if (url === '/api/produtos' && req.method === 'POST') {
            let corpo
            try { corpo = await lerCorpo(req) }
            catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }

            const descricao = String(corpo.descricao || '').trim()
            const preco = Number(corpo.preco)
            const idCategoria = corpo.id_categoria || null

            if (!descricao) return responderJSON(res, 400, { erro: 'Informe a descrição' })
            if (isNaN(preco) || preco < 0) return responderJSON(res, 400, { erro: 'Informe um preço válido' })

            const produto = await inserirProduto(descricao, preco, idCategoria)
            if (produto === null) return responderJSON(res, 500, { erro: 'Falha ao inserir no banco' })
            return responderJSON(res, 201, produto)
        }

        if (url.startsWith('/api/produtos/') && req.method === 'PUT') {
            const id = url.slice('/api/produtos/'.length)
            if (!id || isNaN(Number(id))) return responderJSON(res, 400, { erro: 'ID inválido' })

            let corpo
            try { corpo = await lerCorpo(req) }
            catch { return responderJSON(res, 400, { erro: 'JSON inválido' }) }

            const descricao = String(corpo.descricao || '').trim()
            const preco = Number(corpo.preco)            // <-- corrigido (era "coro")
            const idCategoria = corpo.id_categoria || null

            if (!descricao) return responderJSON(res, 400, { erro: 'Informe a descrição' })
            if (isNaN(preco) || preco < 0) return responderJSON(res, 400, { erro: 'Informe um preço válido' })

            const produto = await atualizarProduto(Number(id), descricao, preco, idCategoria)
            if (produto === null) return responderJSON(res, 500, { erro: 'Falha ao atualizar no banco' })
            return responderJSON(res, 200, produto)
        }

        const rota = arquivos[url]
        if (rota) {
            res.writeHead(200, { 'Content-Type': rota.tipo })
            return fs.createReadStream(path.join(__dirname, rota.arquivo)).pipe(res)
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Página não encontrada')
    } catch (erro) {
        console.error(erro)
        if (!res.headersSent) responderJSON(res, 500, { erro: 'Erro interno no servidor' })
    }
})

servidor.listen(PORTA, () => {
    console.log(`Loja do Zé rodando em http://localhost:${PORTA}`)
})
