// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    addDoc,
    collection,
    onSnapshot,
    query,
    deleteDoc,
    Timestamp,
    writeBatch,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA59Apn8I_8uT7XBrMIS_zD1RdtHgJCzOA",
    authDomain: "gestao-capoeira.firebaseapp.com",
    projectId: "gestao-capoeira",
    storageBucket: "gestao-capoeira.firebasestorage.app",
    messagingSenderId: "907559288919",
    appId: "1:907559288919:web:a4afdb4ed23e9d11196312"
};

// Inicialização do Firebase
let app, auth, db, userId;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase inicializado com sucesso.");
} catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
    document.body.innerHTML = "<p>Erro crítico ao conectar ao banco de dados. Verifique a configuração do Firebase.</p>";
}

// --- [FUNÇÃO DE LOG ATUALIZADA] ---
/**
 * Registra uma ação no log do Firestore na coleção centralizada.
 * Agora suporta logs detalhados de diff (antes/depois).
 */
async function registrarLog(acao, detalhes = {}) {
    if (!auth || !auth.currentUser) {
        console.warn("Tentativa de log sem usuário autenticado.");
        return;
    }
    
    try {
        // Usa a mesma coleção 'logs' que o site de visualização monitora
        const logCollectionRef = collection(db, "dadosIgreja", "ADCA-CG", "logs");
        await addDoc(logCollectionRef, {
            timestamp: Timestamp.now(),
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            acao: acao,
            detalhes: detalhes
        });
        console.log(`Log registrado: ${acao}`);
    } catch (error) {
        console.error("Falha ao registrar log:", error);
    }
}
// --- FIM DA FUNÇÃO DE LOG ---

// Variáveis de estado global
let localMembros = [];
let localDizimos = [];
let localOfertas = [];
let localFinanceiro = [];
let unsubMembros, unsubDizimos, unsubOfertas, unsubFinanceiro;

// Objeto para guardar os dados da exclusão
let itemParaExcluir = {
    id: null,
    tipo: null // 'financeiro', 'dizimo', 'oferta', 'membro'
};

// ID do membro a ser editado
let membroParaEditarId = null;

// --- REFERÊNCIAS DO DOM ---

// Autenticação
const authScreen = document.getElementById("auth-screen");
const appContent = document.getElementById("app-content");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const userEmailDisplay = document.getElementById("user-email-display");
const logoutButton = document.getElementById("logout-button");
const loginSubmitBtn = document.getElementById("login-submit-btn");

// Abas da Aplicação
const tabButtons = document.querySelectorAll(".app-tab-button");
const tabContents = document.querySelectorAll(".app-content-tab"); 

// Formulários
const formMembro = document.getElementById("form-membro");
const membroSubmitBtn = document.getElementById("membro-submit-btn");
const estadoCivilSelect = document.getElementById("estado-civil");
const conjugeContainer = document.getElementById("conjuge-container");

const formEditMembro = document.getElementById("form-edit-membro");
const editMembroError = document.getElementById("edit-membro-error");
const editMembroSubmitBtn = document.getElementById("edit-membro-submit-btn");
const editEstadoCivilSelect = document.getElementById("edit-estado-civil");
const editConjugeContainer = document.getElementById("edit-conjuge-container");

const formDizimo = document.getElementById("form-dizimo");
const dizimoSubmitBtn = document.getElementById("dizimo-submit-btn");
const dizimoMembroSelect = document.getElementById("dizimo-membro");

const formOferta = document.getElementById("form-oferta");
const ofertaSubmitBtn = document.getElementById("oferta-submit-btn");

const formFinanceiro = document.getElementById("form-financeiro");
const financeiroSubmitBtn = document.getElementById("financeiro-submit-btn");

// Listas e Tabelas
const listaMembros = document.getElementById("lista-membros");
const filtroMembros = document.getElementById("filtro-membros");
const totalMembrosDisplay = document.getElementById("total-membros-display");
const listaFinanceiro = document.getElementById("lista-financeiro");
const saldoTotalFinanceiro = document.getElementById("saldo-total-financeiro");
const listaDizimos = document.getElementById("lista-dizimos");
const listaOfertas = document.getElementById("lista-ofertas");

// Filtros
const filtroDizimoMes = document.getElementById("filtro-dizimo-mes");
const filtroDizimoAno = document.getElementById("filtro-dizimo-ano");
const filtroOfertaMes = document.getElementById("filtro-oferta-mes");
const filtroOfertaAno = document.getElementById("filtro-oferta-ano");
const filtroFinanceiroMes = document.getElementById("filtro-financeiro-mes");
const filtroFinanceiroAno = document.getElementById("filtro-financeiro-ano");

// Dashboard
const saldoDashboard = document.getElementById("saldo-total-dashboard");
const entradasDashboard = document.getElementById("entradas-mes-dashboard");
const saidasDashboard = document.getElementById("saidas-mes-dashboard");
const saldoMesDashboard = document.getElementById("saldo-mes-dashboard");
const dashboardLoading = document.getElementById("dashboard-loading");

// Modais
const membroDetalhesModal = document.getElementById("membro-detalhes-modal");
const closeMembroModal = document.getElementById("close-membro-modal");
const membroEditModal = document.getElementById("membro-edit-modal");
const closeMembroEditModal = document.getElementById("close-membro-edit-modal");
const showEditMembroBtn = document.getElementById("show-edit-membro-btn");
const cancelEditMembroBtn = document.getElementById("cancel-edit-membro-btn");
const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const closeDeleteModal = document.getElementById("close-delete-modal");
const deleteConfirmForm = document.getElementById("delete-confirm-form");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const deleteErrorMsg = document.getElementById("delete-error-message");
const deleteCascadeWarning = document.getElementById("delete-cascade-warning");
const showDeleteMembroBtn = document.getElementById("show-delete-membro-btn");
const deleteSubmitBtn = document.getElementById("delete-submit-btn");

// Relatório
const gerarRelatorioBtn = document.getElementById("gerar-relatorio-btn");
const relatorioGeralMes = document.getElementById("relatorio-geral-mes");
const relatorioGeralAno = document.getElementById("relatorio-geral-ano");
const gerarRelatorioMembrosBtn = document.getElementById("gerar-relatorio-membros-btn");

// Aniversariantes
const listaAniversariantesAtual = document.getElementById("lista-aniversariantes-atual");
const listaAniversariantesProximos = document.getElementById("lista-aniversariantes-proximos");
const tituloAniversariantesAtual = document.getElementById("titulo-aniversariantes-atual");
const gerarRelatorioAniversariantesBtn = document.getElementById("gerar-relatorio-aniversariantes-btn");

// Toast e Utils
const toastContainer = document.getElementById("toast-container");
const entradasMesFinanceiro = document.getElementById("entradas-mes-financeiro");
const saidasMesFinanceiro = document.getElementById("saidas-mes-financeiro");
const saldoMesFinanceiroAba = document.getElementById("saldo-mes-financeiro-aba");
const MESES_DO_ANO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];


// --- CONTROLE DE AUTENTICAÇÃO ---

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    toggleButtonLoading(loginSubmitBtn, true, "Entrar");

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Erro no login:", error.code, error.message);
        loginError.textContent = "Email ou senha inválidos.";
    } finally {
        toggleButtonLoading(loginSubmitBtn, false, "Entrar");
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao sair:", error);
        showToast("Erro ao sair.", "error");
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        userEmailDisplay.textContent = user.email;
        authScreen.style.display = "none";
        appContent.style.display = "block";
        loadAllData();
        
        document.getElementById("dizimo-data").valueAsDate = new Date();
        document.getElementById("oferta-data").valueAsDate = new Date();
        document.getElementById("fin-data").valueAsDate = new Date();
        
        const hoje = new Date();
        popularFiltros(filtroDizimoMes, filtroDizimoAno, hoje);
        popularFiltros(filtroOfertaMes, filtroOfertaAno, hoje);
        popularFiltros(filtroFinanceiroMes, filtroFinanceiroAno, hoje);
        popularFiltros(relatorioGeralMes, relatorioGeralAno, hoje);

    } else {
        userId = null;
        authScreen.style.display = "flex";
        appContent.style.display = "none";
        clearAllTables();
        stopAllListeners();
    }
});

async function reauthenticate(password) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não está logado.");
    
    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Senha incorreta.");
        } else {
            throw new Error("Erro de autenticação.");
        }
    }
}

// --- CONTROLE DE NAVEGAÇÃO POR ABAS ---
tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        const targetTab = button.dataset.tab;
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => content.classList.remove("active")); 
        button.classList.add("active");
        document.getElementById(targetTab).classList.add("active");
        if (targetTab === 'dashboard') updateDashboard();
        if (targetTab === 'aniversariantes') renderAniversariantes();
        lucide.createIcons();
    });
});

// --- FORMULÁRIO DE MEMBROS (CADASTRO) ---
estadoCivilSelect.addEventListener("change", () => {
    if (estadoCivilSelect.value === 'Casado(a)') conjugeContainer.classList.remove("hidden");
    else conjugeContainer.classList.add("hidden");
});

formMembro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return;

    toggleButtonLoading(membroSubmitBtn, true, "Salvar Membro");

    const dadosMembro = {
        nome: document.getElementById("nome").value,
        dataNascimento: document.getElementById("data-nascimento").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        cpf: document.getElementById("cpf").value,
        rg: document.getElementById("rg").value,
        naturalidade: document.getElementById("naturalidade").value,
        endereco: document.getElementById("endereco").value,
        nomePai: document.getElementById("nome-pai").value,
        nomeMae: document.getElementById("nome-mae").value,
        estadoCivil: document.getElementById("estado-civil").value,
        conjuge: (document.getElementById("estado-civil").value === 'Casado(a)') ? document.getElementById("conjuge").value : "",
        profissao: document.getElementById("profissao").value,
        escolaridade: document.getElementById("escolaridade").value,
        funcao: document.getElementById("funcao").value,
        dataBatismo: document.getElementById("data-batismo").value,
        dataChegada: document.getElementById("data-chegada").value,
        igrejaAnterior: document.getElementById("igreja-anterior").value,
        cargoAnterior: document.getElementById("cargo-anterior").value,
        createdAt: new Date().toISOString()
    };

    try {
        const docRef = collection(db, "dadosIgreja", "ADCA-CG", "membros");
        const novoDoc = await addDoc(docRef, dadosMembro);

        // [LOG ATUALIZADO] Salva todos os dados
        await registrarLog("Membro Criado", { 
            membroId: novoDoc.id, 
            ...dadosMembro 
        });

        formMembro.reset();
        conjugeContainer.classList.add("hidden");
        showToast("Membro salvo com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar membro: ", error);
        showToast("Erro ao salvar membro.", "error");
    } finally {
        toggleButtonLoading(membroSubmitBtn, false, "Salvar Membro");
    }
});

// --- FORMULÁRIO DE MEMBROS (EDIÇÃO) ---
editEstadoCivilSelect.addEventListener("change", () => {
    if (editEstadoCivilSelect.value === 'Casado(a)') editConjugeContainer.classList.remove("hidden");
    else editConjugeContainer.classList.add("hidden");
});

formEditMembro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId || !membroParaEditarId) return;
    
    toggleButtonLoading(editMembroSubmitBtn, true, "Salvar Alterações");
    const password = document.getElementById("edit-membro-password").value;
    editMembroError.textContent = "";

    if (!password) {
        editMembroError.textContent = "A senha é obrigatória para salvar.";
        toggleButtonLoading(editMembroSubmitBtn, false, "Salvar Alterações");
        return;
    }

    try {
        await reauthenticate(password);
        
        // 1. Captura dados ANTIGOS para o log (Clone)
        const membroAntigo = localMembros.find(m => m.id === membroParaEditarId);
        const dadosAntigos = membroAntigo ? { ...membroAntigo } : {};

        // 2. Prepara os NOVOS dados
        const dadosAtualizados = {
            nome: document.getElementById("edit-nome").value,
            dataNascimento: document.getElementById("edit-data-nascimento").value,
            telefone: document.getElementById("edit-telefone").value,
            email: document.getElementById("edit-email").value,
            cpf: document.getElementById("edit-cpf").value,
            rg: document.getElementById("edit-rg").value,
            naturalidade: document.getElementById("edit-naturalidade").value,
            endereco: document.getElementById("edit-endereco").value,
            nomePai: document.getElementById("edit-nome-pai").value,
            nomeMae: document.getElementById("edit-nome-mae").value,
            estadoCivil: document.getElementById("edit-estado-civil").value,
            conjuge: (document.getElementById("edit-estado-civil").value === 'Casado(a)') ? document.getElementById("edit-conjuge").value : "",
            profissao: document.getElementById("edit-profissao").value,
            escolaridade: document.getElementById("edit-escolaridade").value,
            funcao: document.getElementById("edit-funcao").value,
            dataBatismo: document.getElementById("edit-data-batismo").value,
            dataChegada: document.getElementById("edit-data-chegada").value,
            igrejaAnterior: document.getElementById("edit-igreja-anterior").value,
            cargoAnterior: document.getElementById("edit-cargo-anterior").value,
            updatedAt: new Date().toISOString()
        };

        // Cria objeto final mesclado para o log
        const dadosNovos = { ...dadosAntigos, ...dadosAtualizados };

        // 3. Atualiza no Firestore
        const docRef = doc(db, "dadosIgreja", "ADCA-CG", "membros", membroParaEditarId);
        await updateDoc(docRef, dadosAtualizados);
        
        // [LOG ATUALIZADO] Registra diff com dados antigos e novos
        await registrarLog("Membro Atualizado", { 
            membroId: membroParaEditarId, 
            nome: dadosAtualizados.nome,
            dadosAntigos: dadosAntigos,
            dadosNovos: dadosNovos
        });

        doCloseMembroEditModal(); 
        showToast("Membro atualizado com sucesso!", "success");
    
    } catch (error) {
         console.error("Erro ao atualizar membro:", error);
         editMembroError.textContent = error.message || "Erro ao salvar os dados.";
    } finally {
        toggleButtonLoading(editMembroSubmitBtn, false, "Salvar Alterações");
    }
});


// --- FORMULÁRIO DE DÍZIMOS ---
formDizimo.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return;

    toggleButtonLoading(dizimoSubmitBtn, true, "Registar Dízimo");

    const membroSelect = document.getElementById("dizimo-membro");
    const membroId = membroSelect.value;
    const membroNome = membroSelect.options[membroSelect.selectedIndex].text;
    const valor = parseFloat(document.getElementById("dizimo-valor").value);
    const data = document.getElementById("dizimo-data").value;

    if (!membroId || !valor || !data) {
        showToast("Preencha todos os campos.", "warning");
        toggleButtonLoading(dizimoSubmitBtn, false, "Registar Dízimo");
        return;
    }

    try {
        const batch = writeBatch(db);
        const dizimoDocRef = doc(collection(db, "dadosIgreja", "ADCA-CG", "dizimos"));
        const financeiroDocRef = doc(collection(db, "dadosIgreja", "ADCA-CG", "financeiro"));

        batch.set(dizimoDocRef, {
            membroId: membroId,
            membroNome: membroNome,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            financeiroId: financeiroDocRef.id
        });

        batch.set(financeiroDocRef, {
            tipo: "entrada",
            descricao: `Dízimo - ${membroNome}`,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: dizimoDocRef.id,
            origemTipo: "dizimo"
        });

        await batch.commit();

        await registrarLog("Dízimo Criado", {
            dizimoId: dizimoDocRef.id,
            financeiroId: financeiroDocRef.id,
            membroId: membroId,
            membroNome: membroNome,
            valor: valor
        });

        formDizimo.reset();
        document.getElementById("dizimo-data").valueAsDate = new Date();
        showToast("Dízimo registado com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar dízimo: ", error);
        showToast("Erro ao registar dízimo.", "error");
    } finally {
        toggleButtonLoading(dizimoSubmitBtn, false, "Registar Dízimo");
    }
});

// --- FORMULÁRIO DE OFERTAS ---
formOferta.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return;

    toggleButtonLoading(ofertaSubmitBtn, true, "Registar Entrada");

    const tipo = document.getElementById("oferta-tipo").value;
    const descricao = document.getElementById("oferta-descricao").value;
    const valor = parseFloat(document.getElementById("oferta-valor").value);
    const data = document.getElementById("oferta-data").value;

    if (!tipo || !descricao || !valor || !data) {
        showToast("Preencha todos os campos.", "warning");
        toggleButtonLoading(ofertaSubmitBtn, false, "Registar Entrada");
        return;
    }

    try {
        const batch = writeBatch(db);
        const ofertaDocRef = doc(collection(db, "dadosIgreja", "ADCA-CG", "ofertas"));
        const financeiroDocRef = doc(collection(db, "dadosIgreja", "ADCA-CG", "financeiro"));
        
        batch.set(ofertaDocRef, {
            tipo: tipo,
            descricao: descricao,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            financeiroId: financeiroDocRef.id
        });

        batch.set(financeiroDocRef, {
            tipo: "entrada",
            descricao: `${tipo} - ${descricao}`,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: ofertaDocRef.id,
            origemTipo: "oferta"
        });

        await batch.commit();

        await registrarLog("Oferta/Entrada Criada", {
            ofertaId: ofertaDocRef.id,
            financeiroId: financeiroDocRef.id,
            tipo: tipo,
            descricao: descricao,
            valor: valor
        });

        formOferta.reset();
        document.getElementById("oferta-data").valueAsDate = new Date();
        showToast("Entrada registada com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar oferta: ", error);
        showToast("Erro ao registar entrada.", "error");
    } finally {
        toggleButtonLoading(ofertaSubmitBtn, false, "Registar Entrada");
    }
});

// --- FORMULÁRIO FINANCEIRO (SAÍDAS) ---
formFinanceiro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return;

    toggleButtonLoading(financeiroSubmitBtn, true, "Registar Saída");

    const descricao = document.getElementById("fin-descricao").value;
    const valor = parseFloat(document.getElementById("fin-valor").value);
    const data = document.getElementById("fin-data").value;

    if (!descricao || !valor || !data) {
        showToast("Preencha todos os campos.", "warning");
        toggleButtonLoading(financeiroSubmitBtn, false, "Registar Saída");
        return;
    }

    try {
        const colRef = collection(db, "dadosIgreja", "ADCA-CG", "financeiro");
        const novoDoc = await addDoc(colRef, {
            tipo: "saida",
            descricao: descricao,
            valor: valor * -1,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: null, 
            origemTipo: null
        });

        await registrarLog("Saída Criada", {
            financeiroId: novoDoc.id,
            descricao: descricao,
            valor: valor * -1
        });

        formFinanceiro.reset();
        document.getElementById("fin-data").valueAsDate = new Date();
        showToast("Saída registada com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar saída: ", error);
        showToast("Erro ao registar saída.", "error");
    } finally {
        toggleButtonLoading(financeiroSubmitBtn, false, "Registar Saída");
    }
});


// --- CARREGAMENTO E LISTENERS ---
function loadAllData() {
    if (!userId) return;
    dashboardLoading.innerHTML = '<div class="spinner !border-t-blue-600 !border-gray-300 w-5 h-5"></div> Carregando dados...';

    stopAllListeners();
    let loadsPending = 4; 
    
    const onDataLoaded = () => {
        loadsPending--;
        if (loadsPending === 0) {
            dashboardLoading.innerHTML = "";
            updateDashboard();
            renderAniversariantes();
        }
    };
    
    unsubMembros = onSnapshot(query(collection(db, "dadosIgreja", "ADCA-CG", "membros")), (snap) => {
        localMembros = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localMembros.sort((a, b) => a.nome.localeCompare(b.nome));
        if (totalMembrosDisplay) totalMembrosDisplay.textContent = localMembros.length;
        renderMembros(localMembros);
        populateMembrosSelect(localMembros);
        onDataLoaded();
    });

    unsubDizimos = onSnapshot(query(collection(db, "dadosIgreja", "ADCA-CG", "dizimos")), (snap) => {
        localDizimos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderFiltroDizimos();
        onDataLoaded();
    });

    unsubOfertas = onSnapshot(query(collection(db, "dadosIgreja", "ADCA-CG", "ofertas")), (snap) => {
        localOfertas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderFiltroOfertas();
        onDataLoaded();
    });

    unsubFinanceiro = onSnapshot(query(collection(db, "dadosIgreja", "ADCA-CG", "financeiro")), (snap) => {
        localFinanceiro = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderFiltroFinanceiro(); 
        onDataLoaded();
    });
}

function stopAllListeners() {
    if (unsubMembros) unsubMembros();
    if (unsubDizimos) unsubDizimos();
    if (unsubOfertas) unsubOfertas();
    if (unsubFinanceiro) unsubFinanceiro();
}

function clearAllTables() {
    listaMembros.innerHTML = "";
    listaDizimos.innerHTML = "";
    listaOfertas.innerHTML = "";
    listaFinanceiro.innerHTML = "";
    dizimoMembroSelect.innerHTML = '<option value="">Selecione o Membro</option>';
    saldoTotalFinanceiro.textContent = "R$ 0,00";
    entradasMesFinanceiro.textContent = "R$ 0,00";
    saidasMesFinanceiro.textContent = "R$ 0,00";
    saldoMesFinanceiroAba.textContent = "R$ 0,00";
    saldoDashboard.textContent = "R$ 0,00";
    entradasDashboard.textContent = "R$ 0,00";
    saidasDashboard.textContent = "R$ 0,00";
    saldoMesDashboard.textContent = "R$ 0,00";
    if (totalMembrosDisplay) totalMembrosDisplay.textContent = "0";
    listaAniversariantesAtual.innerHTML = "";
    listaAniversariantesProximos.innerHTML = "";
}

// --- RENDERIZAÇÃO ---

filtroMembros.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    renderMembros(localMembros.filter(m => m.nome.toLowerCase().includes(termo)));
});

function renderMembros(membros) {
    listaMembros.innerHTML = "";
    if (membros.length === 0) return listaMembros.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum membro encontrado.</td></tr>';
    
    membros.forEach(membro => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50";
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap"><a href="#" class="text-blue-600 hover:text-blue-800 font-medium" data-id="${membro.id}">${membro.nome}</a></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${calcularIdade(membro.dataNascimento) || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${membro.funcao || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${membro.telefone || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${membro.email || ''}</td>
    `;
        tr.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            showMembroDetalhesModal(membro.id);
        });
        listaMembros.appendChild(tr);
    });
}

function populateMembrosSelect(membros) {
    dizimoMembroSelect.innerHTML = '<option value="">Selecione o Membro</option>';
    membros.forEach(m => {
        const option = document.createElement("option");
        option.value = m.id;
        option.textContent = m.nome;
        dizimoMembroSelect.appendChild(option);
    });
}

function renderFinanceiro(transacoes) {
    listaFinanceiro.innerHTML = "";
    if (transacoes.length === 0) return listaFinanceiro.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum lançamento no caixa para este mês/ano.</td></tr>';
    
    transacoes.forEach(transacao => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatarData(transacao.data)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${transacao.descricao}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${transacao.valor > 0 ? "text-green-600" : "text-red-600"}">
            ${transacao.valor > 0 ? "+" : ""} R$ ${Math.abs(transacao.valor).toFixed(2).replace(".", ",")}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button data-id="${transacao.id}" class="delete-btn text-red-500 hover:text-red-700" data-tipo="financeiro"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </td>
    `;
        listaFinanceiro.appendChild(tr);
    });
    adicionarListenersExcluir();
    lucide.createIcons();
}

// Filtros
const anoAtual = new Date().getFullYear();
function popularFiltros(selectMes, selectAno, dataDefault) {
    selectMes.innerHTML = "";
    MESES_DO_ANO.forEach((mes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = mes;
        if (index === dataDefault.getMonth()) option.selected = true;
        selectMes.appendChild(option);
    });

    selectAno.innerHTML = "";
    for (let i = 2027; i >= 2023; i--) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        if (i === dataDefault.getFullYear()) option.selected = true;
        selectAno.appendChild(option);
    }
}

filtroDizimoMes.addEventListener("change", renderFiltroDizimos);
filtroDizimoAno.addEventListener("change", renderFiltroDizimos);
filtroOfertaMes.addEventListener("change", renderFiltroOfertas);
filtroOfertaAno.addEventListener("change", renderFiltroOfertas);
filtroFinanceiroMes.addEventListener("change", renderFiltroFinanceiro);
filtroFinanceiroAno.addEventListener("change", renderFiltroFinanceiro);

function renderFiltroFinanceiro() {
    const mes = parseInt(filtroFinanceiroMes.value);
    const ano = parseInt(filtroFinanceiroAno.value);

    const dadosFiltrados = localFinanceiro.filter(d => {
        const data = getDateFromInput(d.data);
        return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    }).sort((a, b) => getDateFromInput(b.data) - getDateFromInput(a.data));

    renderFinanceiro(dadosFiltrados);
    
    const entradasMes = dadosFiltrados.filter(t => t.valor > 0).reduce((acc, t) => acc + t.valor, 0);
    const saidasMes = dadosFiltrados.filter(t => t.valor < 0).reduce((acc, t) => acc + t.valor, 0);
    const saldoMes = entradasMes + saidasMes;

    entradasMesFinanceiro.textContent = `R$ ${entradasMes.toFixed(2).replace(".", ",")}`;
    saidasMesFinanceiro.textContent = `R$ ${Math.abs(saidasMes).toFixed(2).replace(".", ",")}`;
    saldoMesFinanceiroAba.textContent = `R$ ${saldoMes.toFixed(2).replace(".", ",")}`;
    saldoMesFinanceiroAba.className = `text-2xl font-bold ${saldoMes >= 0 ? "text-indigo-700" : "text-red-700"}`;

    const saldoTotal = localFinanceiro.reduce((acc, t) => acc + t.valor, 0);
    saldoTotalFinanceiro.className = `text-2xl font-bold ${saldoTotal >= 0 ? "text-blue-700" : "text-red-700"}`;
    saldoTotalFinanceiro.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;
}

function renderFiltroDizimos() {
    const mes = parseInt(filtroDizimoMes.value);
    const ano = parseInt(filtroDizimoAno.value);

    const dadosFiltrados = localDizimos.filter(d => {
        const data = getDateFromInput(d.data);
        return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));

    listaDizimos.innerHTML = "";
    if (dadosFiltrados.length === 0) listaDizimos.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum dízimo registado para este mês/ano.</td></tr>';
    else {
        dadosFiltrados.forEach(dizimo => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatarData(dizimo.data)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${dizimo.membroNome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">R$ ${dizimo.valor.toFixed(2).replace(".", ",")}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><button data-id="${dizimo.id}" class="delete-btn text-red-500 hover:text-red-700" data-tipo="dizimo"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`;
            listaDizimos.appendChild(tr);
        });
        const total = dadosFiltrados.reduce((acc, d) => acc + d.valor, 0);
        listaDizimos.innerHTML += `<tr class="bg-gray-100 font-bold border-t-2"><td colspan="2" class="px-6 py-3 text-right text-sm">Total do Mês:</td><td class="px-6 py-3 text-sm text-green-700">R$ ${total.toFixed(2).replace(".", ",")}</td><td></td></tr>`;
    }
    adicionarListenersExcluir();
    lucide.createIcons();
}

function renderFiltroOfertas() {
    const mes = parseInt(filtroOfertaMes.value);
    const ano = parseInt(filtroOfertaAno.value);

    const dadosFiltrados = localOfertas.filter(d => {
        const data = getDateFromInput(d.data);
        return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));

    listaOfertas.innerHTML = "";
    if (dadosFiltrados.length === 0) listaOfertas.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhuma oferta registada para este mês/ano.</td></tr>';
    else {
        dadosFiltrados.forEach(oferta => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatarData(oferta.data)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${oferta.tipo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${oferta.descricao}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">R$ ${oferta.valor.toFixed(2).replace(".", ",")}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><button data-id="${oferta.id}" class="delete-btn text-red-500 hover:text-red-700" data-tipo="oferta"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`;
            listaOfertas.appendChild(tr);
        });
        const total = dadosFiltrados.reduce((acc, o) => acc + o.valor, 0);
        listaOfertas.innerHTML += `<tr class="bg-gray-100 font-bold border-t-2"><td colspan="3" class="px-6 py-3 text-right text-sm">Total do Mês:</td><td class="px-6 py-3 text-sm text-green-700">R$ ${total.toFixed(2).replace(".", ",")}</td><td></td></tr>`;
    }
    adicionarListenersExcluir();
    lucide.createIcons();
}

function updateDashboard() {
    if (!localFinanceiro) return;
    const saldoTotal = localFinanceiro.reduce((acc, t) => acc + t.valor, 0);
    saldoDashboard.className = `text-3xl font-bold ${saldoTotal >= 0 ? "text-blue-700" : "text-red-700"} mt-1`;
    saldoDashboard.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;

    const hoje = new Date();
    const transacoesMes = localFinanceiro.filter(t => {
        const data = getDateFromInput(t.data);
        return data && data.getUTCMonth() === hoje.getMonth() && data.getUTCFullYear() === hoje.getFullYear();
    });

    const entradas = transacoesMes.filter(t => t.valor > 0).reduce((acc, t) => acc + t.valor, 0);
    const saidas = transacoesMes.filter(t => t.valor < 0).reduce((acc, t) => acc + t.valor, 0);
    const saldoMes = entradas + saidas;

    entradasDashboard.textContent = `R$ ${entradas.toFixed(2).replace(".", ",")}`;
    saidasDashboard.textContent = `R$ ${Math.abs(saidas).toFixed(2).replace(".", ",")}`;
    saldoMesDashboard.textContent = `R$ ${saldoMes.toFixed(2).replace(".", ",")}`;
    saldoMesDashboard.className = `text-3xl font-bold ${saldoMes >= 0 ? "text-indigo-700" : "text-red-700"} mt-1`;
}

// --- MODAIS ---

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || 'N/A';
}

function showMembroDetalhesModal(id) {
    const membro = localMembros.find(m => m.id === id);
    if (!membro) return;
    
    setElementText("modal-detalhes-nome", membro.nome);
    setElementText("modal-detalhes-funcao", membro.funcao);
    setElementText("modal-detalhes-email", membro.email);
    setElementText("modal-detalhes-telefone", membro.telefone);
    setElementText("modal-detalhes-data-nascimento", formatarData(membro.dataNascimento));
    setElementText("modal-detalhes-endereco", membro.endereco);
    setElementText("modal-detalhes-naturalidade", membro.naturalidade);
    setElementText("modal-detalhes-cpf", membro.cpf);
    setElementText("modal-detalhes-rg", membro.rg);
    setElementText("modal-detalhes-pai", membro.nomePai);
    setElementText("modal-detalhes-mae", membro.nomeMae);
    setElementText("modal-detalhes-estado-civil", membro.estadoCivil);
    setElementText("modal-detalhes-conjuge", membro.conjuge);
    setElementText("modal-detalhes-profissao", membro.profissao);
    setElementText("modal-detalhes-escolaridade", membro.escolaridade);
    setElementText("modal-detalhes-data-batismo", formatarData(membro.dataBatismo));
    setElementText("modal-detalhes-data-chegada", formatarData(membro.dataChegada));
    setElementText("modal-detalhes-igreja-anterior", membro.igrejaAnterior);
    setElementText("modal-detalhes-cargo-anterior", membro.cargoAnterior);
    
    const conjEl = document.getElementById("conjuge-detalhes-container");
    if (conjEl) {
        if (membro.estadoCivil === 'Casado(a)' && membro.conjuge) conjEl.classList.remove("hidden");
        else conjEl.classList.add("hidden");
    }

    membroParaEditarId = id; 
    itemParaExcluir.id = id;
    itemParaExcluir.tipo = 'membro';

    membroDetalhesModal.style.display = "block";
}
closeMembroModal.onclick = () => membroDetalhesModal.style.display = "none";

function showMembroEditModal() {
    const membro = localMembros.find(m => m.id === membroParaEditarId);
    if (!membro) return;

    document.getElementById("edit-nome").value = membro.nome || '';
    document.getElementById("edit-data-nascimento").value = membro.dataNascimento || '';
    document.getElementById("edit-telefone").value = membro.telefone || '';
    document.getElementById("edit-email").value = membro.email || '';
    document.getElementById("edit-cpf").value = membro.cpf || '';
    document.getElementById("edit-rg").value = membro.rg || '';
    document.getElementById("edit-naturalidade").value = membro.naturalidade || '';
    document.getElementById("edit-endereco").value = membro.endereco || '';
    document.getElementById("edit-nome-pai").value = membro.nomePai || '';
    document.getElementById("edit-nome-mae").value = membro.nomeMae || '';
    document.getElementById("edit-estado-civil").value = membro.estadoCivil || '';
    document.getElementById("edit-conjuge").value = membro.conjuge || '';
    document.getElementById("edit-profissao").value = membro.profissao || '';
    document.getElementById("edit-escolaridade").value = membro.escolaridade || '';
    document.getElementById("edit-funcao").value = membro.funcao || '';
    document.getElementById("edit-data-batismo").value = membro.dataBatismo || '';
    document.getElementById("edit-data-chegada").value = membro.dataChegada || '';
    document.getElementById("edit-igreja-anterior").value = membro.igrejaAnterior || '';
    document.getElementById("edit-cargo-anterior").value = membro.cargoAnterior || '';
    
    if (membro.estadoCivil === 'Casado(a)') editConjugeContainer.classList.remove("hidden");
    else editConjugeContainer.classList.add("hidden");
    
    document.getElementById("edit-membro-password").value = "";
    document.getElementById("edit-membro-error").textContent = "";

    membroDetalhesModal.style.display = "none";
    membroEditModal.style.display = "block";
}

function doCloseMembroEditModal() {
     membroEditModal.style.display = "none";
     membroParaEditarId = null;
}

showEditMembroBtn.onclick = showMembroEditModal;
closeMembroEditModal.onclick = doCloseMembroEditModal;
cancelEditMembroBtn.onclick = doCloseMembroEditModal;


// Exclusão
function showDeleteModal() {
    deleteErrorMsg.textContent = "";
    deleteCascadeWarning.textContent = "";
    document.getElementById("delete-password").value = "";

    if (itemParaExcluir.tipo === 'financeiro') {
        const fin = localFinanceiro.find(f => f.id === itemParaExcluir.id);
        if (fin && fin.origemId) deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o Dízimo ou Oferta original associado.";
    } else if (itemParaExcluir.tipo === 'dizimo' || itemParaExcluir.tipo === 'oferta') {
        deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o lançamento no Caixa associado.";
    } else if (itemParaExcluir.tipo === 'membro') {
        deleteCascadeWarning.textContent = "Aviso: Excluir um membro NÃO apaga seus registos financeiros.";
        membroDetalhesModal.style.display = "none";
    }

    deleteConfirmModal.style.display = "block";
}

showDeleteMembroBtn.onclick = showDeleteModal;
closeDeleteModal.onclick = () => deleteConfirmModal.style.display = "none";
cancelDeleteBtn.onclick = () => deleteConfirmModal.style.display = "none";

function adicionarListenersExcluir() {
     document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.removeEventListener("click", handleDeleteClick); 
        btn.addEventListener("click", handleDeleteClick);
    });
}

function handleDeleteClick(e) {
    e.stopPropagation(); 
    itemParaExcluir.id = e.currentTarget.dataset.id;
    itemParaExcluir.tipo = e.currentTarget.dataset.tipo;
    showDeleteModal();
}

deleteConfirmForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId || !itemParaExcluir.id) return;

    toggleButtonLoading(deleteSubmitBtn, true, "Excluir Permanentemente");
    const password = document.getElementById("delete-password").value;
    deleteErrorMsg.textContent = "";

    if (!password) {
        deleteErrorMsg.textContent = "A senha é obrigatória.";
        toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
        return;
    }

    try {
        await reauthenticate(password);
        
        const batch = writeBatch(db);
        const basePath = "dadosIgreja/ADCA-CG";
        let logAcao = "", logDetalhes = {};
        
        if (itemParaExcluir.tipo === 'financeiro') {
            const fin = localFinanceiro.find(f => f.id === itemParaExcluir.id);
            batch.delete(doc(db, basePath, "financeiro", itemParaExcluir.id)); 
            if (fin && fin.origemId && fin.origemTipo) {
                 batch.delete(doc(db, basePath, fin.origemTipo === 'dizimo' ? 'dizimos' : 'ofertas', fin.origemId));
            }
            logAcao = "Exclusão Financeiro";
            logDetalhes = { financeiroId: itemParaExcluir.id, detalhesExcluidos: fin };
        
        } else if (itemParaExcluir.tipo === 'dizimo') {
            const dizimo = localDizimos.find(d => d.id === itemParaExcluir.id);
            batch.delete(doc(db, basePath, "dizimos", itemParaExcluir.id)); 
            if (dizimo && dizimo.financeiroId) batch.delete(doc(db, basePath, "financeiro", dizimo.financeiroId));
            logAcao = "Exclusão Dízimo";
            logDetalhes = { dizimoId: itemParaExcluir.id, detalhesExcluidos: dizimo };

        } else if (itemParaExcluir.tipo === 'oferta') {
            const oferta = localOfertas.find(o => o.id === itemParaExcluir.id);
            batch.delete(doc(db, basePath, "ofertas", itemParaExcluir.id)); 
            if (oferta && oferta.financeiroId) batch.delete(doc(db, basePath, "financeiro", oferta.financeiroId));
            logAcao = "Exclusão Oferta";
            logDetalhes = { ofertaId: itemParaExcluir.id, detalhesExcluidos: oferta };
            
        } else if (itemParaExcluir.tipo === 'membro') {
            // Membro não usa batch aqui para simplificar a lógica isolada
            const membro = localMembros.find(m => m.id === itemParaExcluir.id);
            await deleteDoc(doc(db, basePath, "membros", itemParaExcluir.id));
            
            await registrarLog("Exclusão Membro", { membroId: itemParaExcluir.id, detalhesExcluidos: membro });
            
            deleteConfirmModal.style.display = "none";
            showToast("Membro excluído com sucesso.", "success");
            toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
            return;
        }

        await batch.commit();
        if(logAcao) await registrarLog(logAcao, logDetalhes);
        
        deleteConfirmModal.style.display = "none";
        showToast("Registo excluído com sucesso.", "success");

    } catch (error) {
        console.error("Erro ao excluir registo:", error);
        deleteErrorMsg.textContent = "Erro ao excluir. Tente novamente.";
    } finally {
        toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
    }
});

window.onclick = function (event) {
    if (event.target == membroDetalhesModal) membroDetalhesModal.style.display = "none";
    if (event.target == deleteConfirmModal) deleteConfirmModal.style.display = "none";
    if (event.target == membroEditModal) doCloseMembroEditModal(); 
}

// --- RELATÓRIOS ---

gerarRelatorioBtn.addEventListener("click", () => {
    try {
        const mes = parseInt(relatorioGeralMes.value);
        const ano = parseInt(relatorioGeralAno.value);
        const nomeMes = MESES_DO_ANO[mes];
        
        const dizimosDoMes = localDizimos.filter(d => {
            const data = getDateFromInput(d.data);
            return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
        }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));
        
        const ofertasDoMes = localOfertas.filter(o => {
            const data = getDateFromInput(o.data);
            return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
        }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));
        
        const financDoMes = localFinanceiro.filter(f => {
            const data = getDateFromInput(f.data);
            return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
        });

        const totalDizimos = dizimosDoMes.reduce((acc, d) => acc + (d.valor || 0), 0);
        const totalOfertas = ofertasDoMes.reduce((acc, o) => acc + (o.valor || 0), 0);
        const totalEntradas = totalDizimos + totalOfertas;
        const saidasDoMes = financDoMes.filter(f => f.valor < 0);
        saidasDoMes.sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));
        const totalSaidas = saidasDoMes.reduce((acc, s) => acc + (s.valor || 0), 0);
        const saldoMes = totalEntradas + totalSaidas;
        const saldoGeral = localFinanceiro.reduce((acc, t) => acc + (t.valor || 0), 0);

        const html = `
            <html><head><title>Relatório Financeiro - ${nomeMes}/${ano}</title>
            <style>
                body{font-family:sans-serif;padding:20px} h1{color:#1e40af;border-bottom:2px solid #3b82f6}
                table{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #ddd;padding:8px}
                th{background:#f3f4f6} .green{color:green} .red{color:red} .right{text-align:right}
            </style></head><body>
            <h1>Relatório Financeiro - ${nomeMes}/${ano}</h1>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            
            <h3>Resumo</h3>
            <p>Entradas: <span class="green">${formatarMoeda(totalEntradas)}</span></p>
            <p>Saídas: <span class="red">${formatarMoeda(totalSaidas)}</span></p>
            <p><strong>Saldo do Mês: <span class="${saldoMes>=0?'green':'red'}">${formatarMoeda(saldoMes)}</span></strong></p>
            <p><strong>Saldo Geral em Caixa: ${formatarMoeda(saldoGeral)}</strong></p>
            
            <h3>Dízimos</h3>
            <table><tr><th>Data</th><th>Membro</th><th class="right">Valor</th></tr>
            ${dizimosDoMes.map(d=>`<tr><td>${formatarData(d.data)}</td><td>${d.membroNome}</td><td class="right green">${formatarMoeda(d.valor)}</td></tr>`).join('')}
            </table>
            
            <h3>Ofertas</h3>
            <table><tr><th>Data</th><th>Tipo</th><th>Desc.</th><th class="right">Valor</th></tr>
            ${ofertasDoMes.map(o=>`<tr><td>${formatarData(o.data)}</td><td>${o.tipo}</td><td>${o.descricao}</td><td class="right green">${formatarMoeda(o.valor)}</td></tr>`).join('')}
            </table>
            
            <h3>Saídas</h3>
            <table><tr><th>Data</th><th>Desc.</th><th class="right">Valor</th></tr>
            ${saidasDoMes.map(s=>`<tr><td>${formatarData(s.data)}</td><td>${s.descricao}</td><td class="right red">${formatarMoeda(s.valor)}</td></tr>`).join('')}
            </table>
            </body></html>`;
            
        const win = window.open("","_blank");
        win.document.write(html);
        win.document.close();
    } catch (e) {
        console.error(e);
        showToast("Erro ao gerar relatório.", "error");
    }
});

gerarRelatorioMembrosBtn.addEventListener("click", () => {
    if(localMembros.length===0) return showToast("Sem membros.","warning");
    const win = window.open("","_blank");
    win.document.write(`
        <html><head><title>Membros</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#eee}</style></head><body>
        <h1>Lista de Membros (${localMembros.length})</h1>
        <table><thead><tr><th>Nome</th><th>Função</th><th>Telefone</th></tr></thead><tbody>
        ${localMembros.map(m=>`<tr><td>${m.nome}</td><td>${m.funcao||''}</td><td>${m.telefone||''}</td></tr>`).join('')}
        </tbody></table></body></html>
    `);
    win.document.close();
});

gerarRelatorioAniversariantesBtn.addEventListener("click", () => {
    const win = window.open("","_blank");
    const style = `<style>body{font-family:sans-serif} .month{font-size:18px;font-weight:bold;margin-top:20px;border-bottom:1px solid #ccc} .item{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}</style>`;
    const content = document.getElementById('lista-aniversariantes-atual').innerHTML + document.getElementById('lista-aniversariantes-proximos').innerHTML;
    win.document.write(`<html><head><title>Aniversariantes</title>${style}</head><body><h1>Aniversariantes</h1>${content}</body></html>`);
    win.document.close();
});

// Utils
function toggleButtonLoading(btn, loading, text) {
    if(loading) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> ...'; }
    else { btn.disabled=false; btn.innerHTML=text; }
}

function showToast(msg, type='success') {
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3000);
}

function formatarData(d) {
    const date = getDateFromInput(d);
    return date ? date.toLocaleDateString('pt-BR',{timeZone:'UTC'}) : 'N/A';
}

function getDateFromInput(d) {
    if(!d) return null;
    if(d.toDate) return d.toDate();
    if(d instanceof Date) return d;
    if(typeof d==='string' && d.includes('-')) {
        const p = d.split('-');
        return new Date(Date.UTC(p[0], p[1]-1, p[2]));
    }
    return null;
}

function calcularIdade(d) {
    const date = getDateFromInput(d);
    if(!date) return null;
    const diff = Date.now() - date.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

function formatarMoeda(v) {
    return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

lucide.createIcons();
