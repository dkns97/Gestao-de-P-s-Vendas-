// 1. Conexão com as ferramentas do Firebase vindas do HTML
const { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } = window.fs;
const db = window.db;

// 2. Referência para a coleção (pasta) no banco de dados
const clientesRef = collection(db, "clientes_carretas");

console.log("Sistema de Gestão Randon carregado com sucesso!");

// 3. FUNÇÃO PARA CADASTRAR CLIENTE (SAÍDA DE CARRETA)
window.adicionarCliente = async function() {
    const nome = document.getElementById('nomeCliente').value;
    const placa = document.getElementById('placaCarreta').value.toUpperCase(); // Força placa maiúscula
    const tel = document.getElementById('telCliente').value.replace(/\D/g, ''); // Limpa o telefone
    const data = document.getElementById('dataVenda').value;

    if (!nome || !placa || !tel || !data) {
        return alert("Por favor, preencha todos os campos para registrar a venda!");
    }

    try {
        await addDoc(clientesRef, {
            nome: nome,
            placa: placa,
            telefone: tel,
            dataVenda: data,
            criadoEm: new Date()
        });
        
        alert("Carreta registrada no sistema!");
        
        // Limpa os campos após salvar
        document.getElementById('nomeCliente').value = "";
        document.getElementById('placaCarreta').value = "";
        document.getElementById('telCliente').value = "";
        document.getElementById('dataVenda').value = "";
        
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao conectar com o banco de dados.");
    }
}

// 4. LISTAGEM EM TEMPO REAL E ATUALIZAÇÃO DO PAINEL
const q = query(clientesRef, orderBy("criadoEm", "desc"));

onSnapshot(q, (snapshot) => {
    const tabela = document.getElementById('corpoTabela');
    const displayTotal = document.getElementById('totalVendas');
    const displayVencidas = document.getElementById('totalVencidas');

    if (!tabela) return;

    tabela.innerHTML = ""; // Limpa a tabela para atualizar

    // Variáveis para o contador do topo
    let contadorTotal = 0;
    let contadorVencidas = 0;

    snapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const id = docSnap.id;
        contadorTotal++;

        // --- CÁLCULO DAS DATAS (30 DIAS) ---
        const dataVendaObj = new Date(c.dataVenda + "T12:00:00");
        const dataRevisao = new Date(dataVendaObj);
        dataRevisao.setDate(dataRevisao.getDate() + 30);

        // --- LÓGICA DE STATUS E CONTADOR DE VENCIDAS ---
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); 
        
        const vencido = hoje >= dataRevisao;
        if (vencido) contadorVencidas++;

        const statusHTML = vencido 
            ? '<span class="status-alerta">⚠️ VENCIDA</span>' 
            : '<span class="status-ok">✅ NO PRAZO</span>';

        // --- MENSAGEM DO WHATSAPP ---
        const dataRevFormatada = dataRevisao.toLocaleDateString('pt-BR');
        const msg = `Olá ${c.nome}! A revisão de 30 dias da carreta placa ${c.placa} está próxima (${dataRevFormatada}). Vamos agendar?`;
        const linkZap = `https://wa.me/55${c.telefone}?text=${encodeURIComponent(msg)}`;

        // --- DESENHO DA LINHA NA TABELA (COM COR AZUL RANDON NO TEXTO) ---
        const linha = `
            <tr>
                <td>${c.nome}</td>
                <td><strong>${c.placa}</strong></td>
                <td>${c.telefone}</td>
                <td>${dataVendaObj.toLocaleDateString('pt-BR')}</td>
                <td>${dataRevFormatada}</td>
                <td>${statusHTML}</td>
                <td>
                    <a href="${linkZap}" target="_blank" class="btn-zap">
                        Avisar Cliente
                    </a>
                </td>
                <td>
                    <button class="btn-excluir" onclick="window.excluirCliente('${id}')">
                        Apagar
                    </button>
                </td>
            </tr>
        `;
        tabela.innerHTML += linha;
    });

    // Atualiza os cards de resumo no topo
    if (displayTotal) displayTotal.innerText = contadorTotal;
    if (displayVencidas) displayVencidas.innerText = contadorVencidas;
});

// 5. FUNÇÃO PARA EXCLUIR CLIENTE
window.excluirCliente = async (id) => {
    if (confirm("Deseja remover este registro de venda?")) {
        try {
            await deleteDoc(doc(db, "clientes_carretas", id));
        } catch (error) {
            console.error("Erro ao excluir:", error);
        }
    }
}
window.filtrarTabela = function() {
    const termo = document.getElementById('buscaPlaca').value.toUpperCase();
    const tabela = document.getElementById('corpoTabela');
    const linhas = tabela.getElementsByTagName('tr');

    for (let i = 0; i < linhas.length; i++) {
        // O índice [1] é a coluna da PLACA. Se mudar a ordem das colunas, mude aqui.
        const colunaPlaca = linhas[i].getElementsByTagName('td')[1];
        
        if (colunaPlaca) {
            const textoPlaca = colunaPlaca.textContent || colunaPlaca.innerText;
            if (textoPlaca.toUpperCase().indexOf(termo) > -1) {
                linhas[i].style.display = "";
            } else {
                linhas[i].style.display = "none";
            }
        }
    }
}