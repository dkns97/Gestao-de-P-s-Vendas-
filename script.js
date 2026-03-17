const { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } = window.fs;
const db = window.db;
const clientesRef = collection(db, "clientes_carretas");

// 1. ADICIONAR CLIENTE
window.adicionarCliente = async function() {
    const nome = document.getElementById('nomeCliente').value;
    const placa = document.getElementById('placaCarreta').value.toUpperCase();
    const tel = document.getElementById('telCliente').value.replace(/\D/g, '');
    const data = document.getElementById('dataVenda').value;

    if (!nome || !placa || !tel || !data) {
        return alert("Por favor, preencha todos os campos!");
    }

    try {
        await addDoc(clientesRef, {
            nome,
            placa,
            telefone: tel,
            dataVenda: data,
            contatado: false,
            criadoEm: new Date()
        });
        alert("Sucesso! Carreta cadastrada.");
        // Limpa os campos
        document.getElementById('nomeCliente').value = "";
        document.getElementById('placaCarreta').value = "";
        document.getElementById('telCliente').value = "";
        document.getElementById('dataVenda').value = "";
    } catch (e) { 
        alert("Erro ao salvar dados."); 
    }
}

// 2. LISTAGEM EM TEMPO REAL
onSnapshot(query(clientesRef, orderBy("criadoEm", "desc")), (snapshot) => {
    const tabela = document.getElementById('corpoTabela');
    const totalVendas = document.getElementById('totalVendas');
    const totalVencidas = document.getElementById('totalVencidas');
    
    tabela.innerHTML = "";
    let contVendas = 0;
    let contVencidas = 0;

    snapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const id = docSnap.id;
        contVendas++;

        // Cálculos de Revisão
        const dataVendaObj = new Date(c.dataVenda + "T12:00:00");
        const rev1 = new Date(dataVendaObj);
        rev1.setDate(rev1.getDate() + 30);
        const rev2 = new Date(dataVendaObj);
        rev2.setDate(rev2.getDate() + 120);

        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const vencido = hoje >= rev1;
        if (vencido && !c.contatado) contVencidas++;

        // Status
        const statusHTML = vencido ? '<span class="status-alerta">⚠️ REVISÃO</span>' : '<span class="status-ok">✅ EM DIA</span>';
        
        // Estilo da linha (marcar como contatado)
        const classeLinha = c.contatado ? 'class="contatado"' : '';

        // Link WhatsApp
        const msg = `Olá ${c.nome}! Acompanhando a garantia da sua carreta placa ${c.placa}, seguem as datas das suas revisões:\n\n📍 1ª Revisão (30 dias): ${rev1.toLocaleDateString('pt-BR')}\n📍 2ª Revisão (120 dias): ${rev2.toLocaleDateString('pt-BR')}\n\nPodemos agendar?`;
        const linkZap = `https://wa.me/55${c.telefone}?text=${encodeURIComponent(msg)}`;

        // MONTAGEM DA LINHA (EXATAMENTE 8 TD'S)
        const tr = document.createElement('tr');
        if (c.contatado) tr.classList.add('contatado');

        tr.innerHTML = `
            <td>${c.nome}</td>
            <td><strong>${c.placa}</strong></td>
            <td>${c.telefone}</td>
            <td>${rev1.toLocaleDateString('pt-BR')}</td>
            <td>${rev2.toLocaleDateString('pt-BR')}</td>
            <td>${statusHTML}</td>
            <td>
                <div class="acoes-contato">
                    <a href="${linkZap}" target="_blank" class="btn-zap" onclick="window.marcarComoFeito('${id}')">Avisar</a>
                    <button class="btn-check" onclick="window.marcarComoFeito('${id}')">${c.contatado ? '✅ OK' : '✔️ MARCAR'}</button>
                </div>
            </td>
            <td>
                <button class="btn-excluir" onclick="window.excluirCliente('${id}')">Apagar</button>
            </td>
        `;
        tabela.appendChild(tr);
    });

    if(totalVendas) totalVendas.innerText = contVendas;
    if(totalVencidas) totalVencidas.innerText = contVencidas;
});

// 3. MARCAR COMO CONTATADO
window.marcarComoFeito = async (id) => {
    await updateDoc(doc(db, "clientes_carretas", id), { contatado: true });
}

// 4. EXCLUIR REGISTRO
window.excluirCliente = async (id) => {
    if (confirm("Excluir permanentemente?")) {
        await deleteDoc(doc(db, "clientes_carretas", id));
    }
}

// 5. FILTRAR TABELA
window.filtrarTabela = function() {
    const termo = document.getElementById('buscaPlaca').value.toUpperCase();
    const linhas = document.getElementById('corpoTabela').getElementsByTagName('tr');

    for (let i = 0; i < linhas.length; i++) {
        const colunaPlaca = linhas[i].getElementsByTagName('td')[1]; 
        if (colunaPlaca) {
            const texto = colunaPlaca.textContent || colunaPlaca.innerText;
            linhas[i].style.display = texto.toUpperCase().includes(termo) ? "" : "none";
        }
    }
}