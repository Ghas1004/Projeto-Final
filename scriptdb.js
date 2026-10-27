
require('dotenv').config({ quiet: true })

const DATABASE_URL = process.env.DATABASE_URL

const host = new URL (DATABASE_URL).host

const neonHttpEndpoint = `https://${host}/sql`


async function executarQueryNeon(querySQL,parametros=[]) {
    try{
        const resposta = await fetch(neonHttpEndpoint,
            {
                method:'POST',
                headers:{
                    'Neon-Connection-String':DATABASE_URL,
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({
                    query:querySQL,
                    params:parametros
                })
            })

            if(!resposta.ok)
            {
                const erroTexto = await resposta.text();
                throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`)
            }
            const dados = await resposta.json();
            return dados.rows;
    }
    catch(error){
        console.error("Falha ao comunicar com o banco de dados: ", error)
        return null
    }
}

 const categoriaMock = [
        {categoria:'Eletronicos'},
        {categoria:'Biblioteca'},
        {categoria:'Moveis'},
        {categoria:'Roupas'}
    ]

   async function insertData(table, coluna, data){
       const query = `INSERT INTO ${table} (${coluna}) VALUES ($1) RETURNING *`
       const params = [data]
       console.log(query, params)
       const linhas = await executarQueryNeon(query,params);
       return linhas !== null;
    }



    async function testeInsert() {
    for (const element of categoriaMock) {
        await insertData("categoria", "descricao", element.categoria)
    }
    }


if (require.main === module) {
    testeInsert();
}

// --- PRODUTOS ---

async function listarProdutos() {
    const query = `
        SELECT
            p.id_produto,
            p.descricao,
            p.preco,
            p.id_categoria,
            c.descricao AS categoria
        FROM produto p
        LEFT JOIN categoria c
            ON c.id_categoria = p.id_categoria
        ORDER BY p.id_produto
    `;
    return await executarQueryNeon(query);
}
async function inserirProduto(descricao, preco, idCategoria) {
    const query = `INSERT INTO produto (descricao, preco, id_categoria) VALUES ($1, $2, $3) RETURNING *`
    const linhas = await executarQueryNeon(query, [descricao, preco, idCategoria])
    return linhas ? linhas[0] : null
}

async function atualizarProduto(id, descricao, preco, idCategoria) {
    const query = `UPDATE produto SET descricao = $1, preco = $2, id_categoria = $3 WHERE id_produto = $4 RETURNING *`
    const linhas = await executarQueryNeon(query, [descricao, preco, idCategoria, id])
    return linhas ? linhas[0] : null
}

module.exports = { executarQueryNeon, insertData, listarProdutos, inserirProduto, atualizarProduto }
