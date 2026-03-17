const { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } = window.fs;
const db = window.db;

const clientesRef = collection(db, "clientes_carretas");

// FUNÇÃO PARA CADASTRAR
window.adicionarCliente = async function() {
    const nome = document.getElementById('nomeCliente').value;
    const placa = document.getElementById('placaCarreta').value.toUpperCase();
    const tel = document.getElementById('telCliente').value.replace(/\D/g, '');
    const data = document.getElementById('dataVenda').value;

    if (!nome || !placa || !tel || !data) {
        return alert("Preencha todos os campos!");
    }

    try {
        await addDoc(clientesRef, {
            nome: nome,
            placa: placa,
            telefone: tel,
            dataVenda: data,
            contatado: false, // NOVO: Começa como não contatado
            criadoEm: new Date()
        });
        alert("Carreta registrada!");
        document.querySelectorAll('input').forEach(i => i.value = "");
    } catch (e) { alert("Erro ao salvar."); }
}

// LISTAGEM COM MEMÓRIA DE CONTATO
const q = query(clientesRef, orderBy("criadoEm", "desc"));

onSnapshot(q, (snapshot) => {
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

        const dataVendaObj = new Date(c.dataVenda + "T12:00:00");
        const dataRevisao = new Date(dataVendaObj);
        dataRevisao.setDate(dataRevisao.getDate() + 30);
        
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const vencido = hoje >= dataRevisao;
        if (vencido) contVencidas++;

        const statusHTML = vencido ? '<span class="status-alerta">⚠️ VENCIDA</span>' : '<span class="status-ok">✅ NO PRAZO</span>';
        
        // MENSAGEM WHATSAPP
        const msg = `Olá ${c.nome}! A revisão de 30 dias da carreta ${c.placa} está próxima. Vamos agendar?`;
        const linkZap = `https://wa.me/55${c.tel}?text=${encodeURIComponent(msg)}`;

        // LÓGICA DE ESTILO PARA LINHA CONTATADA
        const estiloContatado = c.contatado ? 'style="background-color: #e8f5e9; opacity: 0.8;"' : '';
        const textoBotao = c.contatado ? "✅ CONTATADO" : "✔️ MARCAR CONTATO";

        const linha = `
            <tr ${estiloContatado}>
                <td>${c.nome}</td>
                <td><strong>${c.placa}</strong></td>
                <td>${c.telefone}</td>
                <td>${dataVendaObj.toLocaleDateString('pt-BR')}</td>
                <td>${dataRevisao.toLocaleDateString('pt-BR')}</td>
                <td>${statusHTML}</td>
                <td class="acoes-contato">
                    <a href="${linkZap}" target="_blank" class="btn-zap" onclick="window.marcarComoFeito('${id}')">Avisar</a>
                    <button class="btn-check" onclick="window.marcarComoFeito('${id}')">${textoBotao}</button>
                </td>
                <td><button class="btn-excluir" onclick="window.excluirCliente('${id}')">Apagar</button></td>
            </tr>
        `;
        tabela.innerHTML += linha;
    });
    totalVendas.innerText = contVendas;
    totalVencidas.innerText = contVencidas;
});

// FUNÇÃO PARA SALVAR NO BANCO QUE JÁ FOI FEITO
window.marcarComoFeito = async (id) => {
    const docRef = doc(db, "clientes_carretas", id);
    try {
        await updateDoc(docRef, { contatado: true });
    } catch (e) { console.error("Erro ao atualizar contato:", e); }
}

window.excluirCliente = async (id) => {
    if (confirm("Excluir registro?")) await deleteDoc(doc(db, "clientes_carretas", id));
}