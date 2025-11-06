// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    setDoc,
    doc,
    addDoc,
    collection,
    onSnapshot,
    query,
    deleteDoc,
    Timestamp,
    getDocs,
    where,
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
} catch (error)
{
    console.error("Erro ao inicializar o Firebase:", error);
    document.body.innerHTML = "<p>Erro crítico ao conectar ao banco de dados. Verifique a configuração do Firebase.</p>";
}

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

// --- REFERÊNCIAS DO DOM (AGRUPADAS) ---

// Autenticação
const authScreen = document.getElementById("auth-screen");
const appContent = document.getElementById("app-content");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const userEmailDisplay = document.getElementById("user-email-display");
const logoutButton = document.getElementById("logout-button");
const loginSubmitBtn = document.getElementById("login-submit-btn");
const registerSubmitBtn = document.getElementById("register-submit-btn");
const loginTabButton = document.getElementById("auth-login-tab-button");
const registerTabButton = document.getElementById("auth-register-tab-button");
const loginTab = document.getElementById("auth-login-tab");
const registerTab = document.getElementById("auth-register-tab");

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

// Aniversariantes
const listaAniversariantesAtual = document.getElementById("lista-aniversariantes-atual");
const listaAniversariantesProximos = document.getElementById("lista-aniversariantes-proximos");
const tituloAniversariantesAtual = document.getElementById("titulo-aniversariantes-atual");
const gerarRelatorioAniversariantesBtn = document.getElementById("gerar-relatorio-aniversariantes-btn");


// Toast
const toastContainer = document.getElementById("toast-container");

// Resumo Financeiro do Mês (Aba Financeiro)
const entradasMesFinanceiro = document.getElementById("entradas-mes-financeiro");
const saidasMesFinanceiro = document.getElementById("saidas-mes-financeiro");
const saldoMesFinanceiroAba = document.getElementById("saldo-mes-financeiro-aba");

// Meses para formatação
const MESES_DO_ANO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// --- CONTROLE DE AUTENTICAÇÃO ---

// Abas de Autenticação
loginTabButton.addEventListener("click", () => {
    loginTabButton.classList.add("active");
    registerTabButton.classList.remove("active");
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginError.textContent = "";
    registerError.textContent = "";
});

registerTabButton.addEventListener("click", () => {
    registerTabButton.classList.add("active");
    loginTabButton.classList.remove("active");
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    loginError.textContent = "";
    registerError.textContent = "";
});

// Processar Cadastro
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerError.textContent = "";
    toggleButtonLoading(registerSubmitBtn, true, "Cadastrar");
    
    const nome = document.getElementById("register-name").value;
    const telefoneInput = document.getElementById("register-phone").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (!nome || !telefoneInput) {
        registerError.textContent = "Nome e Telefone são obrigatórios.";
        toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
        return;
    }
    
    const nomeLimpo = nome.trim().toLowerCase();
    const telefoneLimpo = telefoneInput.replace(/\D/g, ''); // Remove não-números

    // Regras de negócio
    const usuariosAutorizados = {
        "gabriel angelino": "21964597378",
        "lorrane": "21979626240" , 
        "vitoria": "21988611788"
    };

    if (usuariosAutorizados[nomeLimpo] !== telefoneLimpo) {
         registerError.textContent = "Nome e Telefone não correspondem a um utilizador autorizado.";
         toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
         return;
    }
    
    try {
        // Criar o usuário na Autenticação
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salvar dados do perfil no Firestore
        await setDoc(doc(db, "dadosIgreja", "ADCA-CG", "perfisUtilizadores", user.uid), {
            nome: nome.trim(),
            telefone: telefoneLimpo,
            email: email,
            createdAt: Timestamp.now()
        });
        
    } catch (error) {
        console.error("Erro no cadastro:", error.code, error.message);
        if (error.code === 'auth/email-already-in-use') {
            registerError.textContent = "Este email já está cadastrado. Tente fazer login.";
        } else if (error.code === 'auth/weak-password') {
            registerError.textContent = "Senha fraca. A senha deve ter no mínimo 6 caracteres.";
        } else {
            registerError.textContent = "Erro ao cadastrar. Verifique o email e a senha.";
        }
    } finally {
        toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
    }
});


// Processar Login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    toggleButtonLoading(loginSubmitBtn, true, "Entrar");

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // O onAuthStateChanged vai tratar de mostrar o app
    } catch (error) {
        console.error("Erro no login:", error.code, error.message);
        loginError.textContent = "Email ou senha inválidos.";
    } finally {
        toggleButtonLoading(loginSubmitBtn, false, "Entrar");
    }
});

// Processar Logout
logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        // O onAuthStateChanged vai tratar de esconder o app
    } catch (error) {
        console.error("Erro ao sair:", error);
        showToast("Erro ao sair.", "error");
    }
});

// Observador do estado de autenticação (principal)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário está logado
        userId = user.uid; // Definido globalmente
        userEmailDisplay.textContent = user.email;
        authScreen.style.display = "none";
        appContent.style.display = "block";
        loadAllData(); // Carrega os dados
        
        // Define as datas dos formulários para hoje
        document.getElementById("dizimo-data").valueAsDate = new Date();
        document.getElementById("oferta-data").valueAsDate = new Date();
        document.getElementById("fin-data").valueAsDate = new Date();
        
        // Popula os filtros de data
        const hoje = new Date();
        popularFiltros(filtroDizimoMes, filtroDizimoAno, hoje);
        popularFiltros(filtroOfertaMes, filtroOfertaAno, hoje);
        popularFiltros(filtroFinanceiroMes, filtroFinanceiroAno, hoje);
        popularFiltros(relatorioGeralMes, relatorioGeralAno, hoje);


    } else {
        // Usuário está deslogado
        userId = null;
        authScreen.style.display = "flex";
        appContent.style.display = "none";
        clearAllTables(); // Limpa dados da tela
        stopAllListeners(); // Para de ouvir dados
    }
});

// --- FUNÇÃO AUXILIAR DE REAUTENTICAÇÃO ---
async function reauthenticate(password) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Usuário não está logado.");
    }
    if (!user.email) {
         throw new Error("Usuário não tem email associado (ex: anônimo).");
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true; // Reautenticação bem-sucedida
    } catch (error) {
        console.error("Erro ao reautenticar:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Senha incorreta.");
        } else {
            throw new Error("Erro de autenticação.");
        }
    }
}


// --- CONTROLE DE NAVEGAÇÃO POR ABAS (APP) ---
tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        const targetTab = button.dataset.tab;

        // Desativa todos
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => content.classList.remove("active")); 

        // Ativa o clicado
        button.classList.add("active");
        document.getElementById(targetTab).classList.add("active");

        // Atualiza dados se a aba for o dashboard
        if (targetTab === 'dashboard') {
            updateDashboard();
        }
        // Atualiza dados se a aba for aniversariantes
        if (targetTab === 'aniversariantes') {
            renderAniversariantes();
        }
        
        // Atualiza ícones quando muda de aba
        lucide.createIcons();
    });
});

// --- FORMULÁRIO DE MEMBROS (CADASTRO) ---
estadoCivilSelect.addEventListener("change", () => {
    if (estadoCivilSelect.value === 'Casado(a)') {
        conjugeContainer.classList.remove("hidden");
    } else {
        conjugeContainer.classList.add("hidden");
    }
});


formMembro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return;

    toggleButtonLoading(membroSubmitBtn, true, "Salvar Membro");

    // Coleta de todos os campos
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
    };

    try {
        const docRef = collection(db, "dadosIgreja", "ADCA-CG", "membros");
        await addDoc(docRef, dadosMembro);

        formMembro.reset();
        conjugeContainer.classList.add("hidden"); // Esconde o campo cônjuge
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
    if (editEstadoCivilSelect.value === 'Casado(a)') {
        editConjugeContainer.classList.remove("hidden");
    } else {
        editConjugeContainer.classList.add("hidden");
    }
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

    // 1. Reautenticar
    try {
        await reauthenticate(password);
    } catch (error) {
        console.error(error);
        editMembroError.textContent = error.message; // Exibe "Senha incorreta."
        toggleButtonLoading(editMembroSubmitBtn, false, "Salvar Alterações");
        return;
    }
    
    // 2. Coletar dados do formulário
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
    };
    
    // 3. Atualizar no Firebase
    try {
        const docRef = doc(db, "dadosIgreja", "ADCA-CG", "membros", membroParaEditarId);
        await updateDoc(docRef, dadosAtualizados);
        
        // Sucesso
        doCloseMembroEditModal(); 
        showToast("Membro atualizado com sucesso!", "success");
    
    } catch (error) {
         console.error("Erro ao atualizar membro:", error);
         editMembroError.textContent = "Erro ao salvar os dados.";
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
            financeiroId: financeiroDocRef.id // Link
        });

        batch.set(financeiroDocRef, {
            tipo: "entrada",
            descricao: `Dízimo - ${membroNome}`,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: dizimoDocRef.id, // Link
            origemTipo: "dizimo"
        });

        await batch.commit();

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

// --- FORMULÁRIO DE OFERTAS / OUTRAS ENTRADAS ---
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
            financeiroId: financeiroDocRef.id // Link
        });

        batch.set(financeiroDocRef, {
            tipo: "entrada",
            descricao: `${tipo} - ${descricao}`,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: ofertaDocRef.id, // Link
            origemTipo: "oferta"
        });

        await batch.commit();

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
        await addDoc(colRef, {
            tipo: "saida",
            descricao: descricao,
            valor: valor * -1, // Salva saídas como valor negativo
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: null, 
            origemTipo: null
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


// --- CARREGAMENTO E RENDERIZAÇÃO DE DADOS ---
function loadAllData() {
    if (!userId) return;
    console.log("Carregando dados partilhados...");
    dashboardLoading.innerHTML = '<div class="spinner !border-t-blue-600 !border-gray-300 w-5 h-5"></div> Carregando dados...';

    stopAllListeners();
    let loadsPending = 4; // Membros, Dizimos, Ofertas, Financeiro
    
    const onDataLoaded = () => {
        loadsPending--;
        if (loadsPending === 0) {
            console.log("Todos os dados carregados.");
            dashboardLoading.innerHTML = "";
            updateDashboard();
            renderAniversariantes(); // Renderiza aniversariantes após dados carregados
        }
    };
    
    try {
        const qMembros = query(collection(db, "dadosIgreja", "ADCA-CG", "membros"));
        unsubMembros = onSnapshot(qMembros, (snapshot) => {
            localMembros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localMembros.sort((a, b) => a.nome.localeCompare(b.nome));
            renderMembros(localMembros);
            populateMembrosSelect(localMembros);
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir membros:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de membros:", e); onDataLoaded(); }

    try {
        const qDizimos = query(collection(db, "dadosIgreja", "ADCA-CG", "dizimos"));
        unsubDizimos = onSnapshot(qDizimos, (snapshot) => {
            localDizimos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroDizimos();
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir dízimos:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de dízimos:", e); onDataLoaded(); }

    try {
        const qOfertas = query(collection(db, "dadosIgreja", "ADCA-CG", "ofertas"));
        unsubOfertas = onSnapshot(qOfertas, (snapshot) => {
            localOfertas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroOfertas();
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir ofertas:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de ofertas:", e); onDataLoaded(); }

    try {
        const qFinanceiro = query(collection(db, "dadosIgreja", "ADCA-CG", "financeiro"));
        unsubFinanceiro = onSnapshot(qFinanceiro, (snapshot) => {
            localFinanceiro = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroFinanceiro(); 
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir financeiro:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de financeiro:", e); onDataLoaded(); }
}

// Parar todos os listeners
function stopAllListeners() {
    if (unsubMembros) unsubMembros();
    if (unsubDizimos) unsubDizimos();
    if (unsubOfertas) unsubOfertas();
    if (unsubFinanceiro) unsubFinanceiro();
    console.log("Listeners interrompidos.");
}

// Limpar tabelas ao deslogar
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
    listaAniversariantesAtual.innerHTML = "";
    listaAniversariantesProximos.innerHTML = "";
}


// Renderizar Tabela de Membros
filtroMembros.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    const membrosFiltrados = localMembros.filter(m => m.nome.toLowerCase().includes(termo));
    renderMembros(membrosFiltrados);
});

function renderMembros(membros) {
    listaMembros.innerHTML = "";
    if (membros.length === 0) {
        listaMembros.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum membro encontrado.</td></tr>'; // Colspan 5
        return;
    }
    membros.forEach(membro => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50";
        const idade = calcularIdade(membro.dataNascimento); // Calcula a idade
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <a href="#" class="text-blue-600 hover:text-blue-800 font-medium" data-id="${membro.id}">${membro.nome}</a>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${idade || 'N/A'}</td>
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

// Popular Select de Membros
function populateMembrosSelect(membros) {
    dizimoMembroSelect.innerHTML = '<option value="">Selecione o Membro</option>';
    membros.forEach(membro => {
        const option = document.createElement("option");
        option.value = membro.id;
        option.textContent = membro.nome;
        dizimoMembroSelect.appendChild(option);
    });
}

// Renderizar Tabela Financeiro (Extrato)
function renderFinanceiro(transacoes) {
    listaFinanceiro.innerHTML = "";

    if (transacoes.length === 0) {
        listaFinanceiro.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum lançamento no caixa para este mês/ano.</td></tr>';
        return;
    }
    
    transacoes.forEach(transacao => {
        const valor = transacao.valor;
        const corValor = valor > 0 ? "text-green-600" : "text-red-600";
        const sinal = valor > 0 ? "+" : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatarData(transacao.data)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${transacao.descricao}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${corValor}">
            ${sinal} R$ ${Math.abs(valor).toFixed(2).replace(".", ",")}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button data-id="${transacao.id}" class="delete-btn text-red-500 hover:text-red-700" data-tipo="financeiro">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </td>
    `;
        listaFinanceiro.appendChild(tr);
    });

    adicionarListenersExcluir();
    lucide.createIcons();
}

// --- FILTROS E RENDERIZAÇÃO DE DÍZIMOS E OFERTAS ---
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
    // Corrigido: Loop para incluir anos futuros até 2027
    const anoInicial = Math.min(anoAtual - 2, 2023); // Começa 2 anos atrás ou 2023
    const anoFinal = 2027;
    
    for (let i = anoFinal; i >= anoInicial; i--) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        if (i === dataDefault.getFullYear()) option.selected = true;
        // Adiciona anos passados no início
        if (i < dataDefault.getFullYear()) {
            selectAno.prepend(option);
        } else {
            selectAno.appendChild(option);
        }
    }
}

// Event Listeners dos Filtros
filtroDizimoMes.addEventListener("change", renderFiltroDizimos);
filtroDizimoAno.addEventListener("change", renderFiltroDizimos);
filtroOfertaMes.addEventListener("change", renderFiltroOfertas);
filtroOfertaAno.addEventListener("change", renderFiltroOfertas);
filtroFinanceiroMes.addEventListener("change", renderFiltroFinanceiro);
filtroFinanceiroAno.addEventListener("change", renderFiltroFinanceiro);

// (NOVO) Função atualizada para calcular Entradas/Saídas do Mês
function renderFiltroFinanceiro() {
    const mes = parseInt(filtroFinanceiroMes.value);
    const ano = parseInt(filtroFinanceiroAno.value);

    // 1. Filtrar os dados
    const dadosFiltrados = localFinanceiro.filter(d => {
        const data = getDateFromInput(d.data);
        if (!data) return false;
        return data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    });

    // 2. Ordenar os dados filtrados (mais recente primeiro)
    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataB - dataA;
    });

    // 3. Renderizar a tabela com os dados filtrados
    renderFinanceiro(dadosFiltrados);
    
    // 4. (NOVO) Calcular totais do mês filtrado
    const entradasMes = dadosFiltrados
        .filter(t => t.valor > 0)
        .reduce((acc, t) => acc + t.valor, 0);

    const saidasMes = dadosFiltrados
        .filter(t => t.valor < 0)
        .reduce((acc, t) => acc + t.valor, 0); // Já é negativo
        
    const saldoMes = entradasMes + saidasMes; // Soma (saídas são negativas)

    // 5. (NOVO) Atualizar o resumo do mês na aba Financeiro
    entradasMesFinanceiro.textContent = `R$ ${entradasMes.toFixed(2).replace(".", ",")}`;
    saidasMesFinanceiro.textContent = `R$ ${Math.abs(saidasMes).toFixed(2).replace(".", ",")}`;
    
    // Corrigido: Atualiza o novo cartão de Saldo do Mês
    saldoMesFinanceiroAba.textContent = `R$ ${saldoMes.toFixed(2).replace(".", ",")}`;
    const corSaldoMes = saldoMes >= 0 ? "text-indigo-700" : "text-red-700";
    saldoMesFinanceiroAba.className = `text-2xl font-bold ${corSaldoMes}`;


    // 6. Calcular e renderizar o SALDO TOTAL (usando todos os dados)
    const saldoTotal = localFinanceiro.reduce((acc, transacao) => acc + transacao.valor, 0);
    const corSaldoTotal = saldoTotal >= 0 ? "text-blue-700" : "text-red-700";
    saldoTotalFinanceiro.className = `text-2xl font-bold ${corSaldoTotal}`;
    saldoTotalFinanceiro.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;
}


function renderFiltroDizimos() {
    const mes = parseInt(filtroDizimoMes.value);
    const ano = parseInt(filtroDizimoAno.value);

    const dadosFiltrados = localDizimos.filter(d => {
        const data = getDateFromInput(d.data);
        if (!data) return false;
        return data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    });

    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataA - dataB;
    });

    listaDizimos.innerHTML = "";
    if (dadosFiltrados.length === 0) {
        listaDizimos.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum dízimo registado para este mês/ano.</td></tr>';
        return;
    }

    dadosFiltrados.forEach(dizimo => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatarData(dizimo.data)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${dizimo.membroNome}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">R$ ${dizimo.valor.toFixed(2).replace(".", ",")}</td>
         <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button data-id="${dizimo.id}" class="delete-btn text-red-500 hover:text-red-700" data-tipo="dizimo">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </td>
    `;
        listaDizimos.appendChild(tr);
    });
    
    // Total do Mês (Dízimos)
    const totalDizimosMes = dadosFiltrados.reduce((acc, dizimo) => acc + (dizimo.valor || 0), 0);
    const trTotal = document.createElement("tr");
    trTotal.className = "bg-gray-100 font-bold border-t-2"; 
    trTotal.innerHTML = `
        <td colspan="2" class="px-6 py-3 text-right text-sm text-gray-800 uppercase tracking-wider">Total do Mês:</td>
        <td class="px-6 py-3 whitespace-nowrap text-sm text-green-700 font-medium">
            R$ ${totalDizimosMes.toFixed(2).replace(".", ",")}
        </td>
        <td class="px-6 py-3"></td>
    `;
    listaDizimos.appendChild(trTotal);

    adicionarListenersExcluir();
    lucide.createIcons();
}

function renderFiltroOfertas() {
    const mes = parseInt(filtroOfertaMes.value);
    const ano = parseInt(filtroOfertaAno.value);

    const dadosFiltrados = localOfertas.filter(d => {
        const data = getDateFromInput(d.data);
        if (!data) return false;
        return data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    });

    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataA - dataB;
    });

    listaOfertas.innerHTML = "";
    if (dadosFiltrados.length === 0) {
        listaOfertas.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhuma oferta registada para este mês/ano.</td></tr>';
        return;
    }

    dadosFiltrados.forEach(oferta => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatarData(oferta.data)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${oferta.tipo}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${oferta.descricao}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">R$ ${oferta.valor.toFixed(2).replace(".", ",")}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
            <button data-id="${oferta.id}" class="delete-btn text-red-500 hover:text-red-700" data-tipo="oferta">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </td>
    `;
        listaOfertas.appendChild(tr);
    });
    
    // Total do Mês (Ofertas)
    const totalOfertasMes = dadosFiltrados.reduce((acc, oferta) => acc + (oferta.valor || 0), 0);
    const trTotal = document.createElement("tr");
    trTotal.className = "bg-gray-100 font-bold border-t-2";
    trTotal.innerHTML = `
        <td colspan="3" class="px-6 py-3 text-right text-sm text-gray-800 uppercase tracking-wider">Total do Mês:</td>
        <td class="px-6 py-3 whitespace-nowrap text-sm text-green-700 font-medium">
            R$ ${totalOfertasMes.toFixed(2).replace(".", ",")}
        </td>
        <td class="px-6 py-3"></td>
    `;
    listaOfertas.appendChild(trTotal);

    adicionarListenersExcluir();
    lucide.createIcons();
}


// --- ATUALIZAÇÃO DO DASHBOARD ---
function updateDashboard() {
    if (!localFinanceiro || !localMembros) return;

    // 1. Saldo Total
    const saldoTotal = localFinanceiro.reduce((acc, transacao) => acc + transacao.valor, 0);
    const corSaldo = saldoTotal >= 0 ? "text-blue-700" : "text-red-700";
    saldoDashboard.className = `text-3xl font-bold ${corSaldo} mt-1`;
    saldoDashboard.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;

    // 2. Transações do Mês Atual
    const mesCorrente = new Date().getMonth();
    const anoCorrente = new Date().getFullYear();

    const transacoesMes = localFinanceiro.filter(t => {
        const data = getDateFromInput(t.data);
        if (!data) return false;
        return data.getUTCMonth() === mesCorrente && data.getUTCFullYear() === anoCorrente;
    });

    const entradasMes = transacoesMes
        .filter(t => t.valor > 0)
        .reduce((acc, t) => acc + t.valor, 0);

    const saidasMes = transacoesMes
        .filter(t => t.valor < 0)
        .reduce((acc, t) => acc + t.valor, 0); // Já é negativo
        
    const saldoMes = entradasMes + saidasMes;

    entradasDashboard.textContent = `R$ ${entradasMes.toFixed(2).replace(".", ",")}`;
    saidasDashboard.textContent = `R$ ${Math.abs(saidasMes).toFixed(2).replace(".", ",")}`;
    
    // 3. (Novo) Saldo do Mês
    saldoMesDashboard.textContent = `R$ ${saldoMes.toFixed(2).replace(".", ",")}`;
    const corSaldoMes = saldoMes >= 0 ? "text-indigo-700" : "text-red-700";
    saldoMesDashboard.className = `text-3xl font-bold ${corSaldoMes} mt-1`;
}

// --- CONTROLO DOS MODAIS (JANELAS POP-UP) ---

// Função auxiliar para definir textContent se o elemento existir
function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text || 'N/A';
    } else {
        // Este aviso é importante para debugging de dessincronização HTML/JS
        console.warn(`Elemento com ID "${id}" não encontrado no HTML.`);
    }
}

// Modal Detalhes do Membro
function showMembroDetalhesModal(id) {
    const membro = localMembros.find(m => m.id === id);
    if (!membro) return;
    
    // Corrigido: Adicionadas verificações (setElementText) para evitar o erro
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
    
    // Oculta/mostra campo cônjuge
    const conjugeDetalhesEl = document.getElementById("conjuge-detalhes-container");
    if (conjugeDetalhesEl) {
        if (membro.estadoCivil === 'Casado(a)' && membro.conjuge) {
            conjugeDetalhesEl.classList.remove("hidden");
        } else {
            conjugeDetalhesEl.classList.add("hidden");
        }
    }

    membroParaEditarId = id; 
    itemParaExcluir.id = id;
    itemParaExcluir.tipo = 'membro';

    membroDetalhesModal.style.display = "block";
}
closeMembroModal.onclick = () => membroDetalhesModal.style.display = "none";

// Modal Editar Membro
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
    
    // Mostra/oculta cônjuge na edição
    if (membro.estadoCivil === 'Casado(a)') {
        editConjugeContainer.classList.remove("hidden");
    } else {
        editConjugeContainer.classList.add("hidden");
    }
    
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


// Modal Universal de Exclusão
function showDeleteModal() {
    deleteErrorMsg.textContent = "";
    deleteCascadeWarning.textContent = "";
    document.getElementById("delete-password").value = "";

    if (itemParaExcluir.tipo === 'financeiro') {
        const fin = localFinanceiro.find(f => f.id === itemParaExcluir.id);
        if (fin && fin.origemId) {
            deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o Dízimo ou Oferta original associado a este lançamento.";
        }
    } else if (itemParaExcluir.tipo === 'dizimo' || itemParaExcluir.tipo === 'oferta') {
        deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o lançamento no Caixa associado a este registo.";
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
     document.querySelectorAll(".delete-btn").forEach(button => {
        button.removeEventListener("click", handleDeleteClick); 
        button.addEventListener("click", handleDeleteClick);
    });
}

function handleDeleteClick(e) {
    e.stopPropagation(); 
    const button = e.currentTarget;
    itemParaExcluir.id = button.dataset.id;
    itemParaExcluir.tipo = button.dataset.tipo;
    showDeleteModal();
}

// Processar a Exclusão (Formulário do Modal)
deleteConfirmForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId || !itemParaExcluir.id || !itemParaExcluir.tipo) return;

    toggleButtonLoading(deleteSubmitBtn, true, "Excluir Permanentemente");
    const password = document.getElementById("delete-password").value;
    deleteErrorMsg.textContent = "";

    if (!password) {
        deleteErrorMsg.textContent = "A senha é obrigatória.";
        toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
        return;
    }

    // 1. Reautenticar
    try {
        await reauthenticate(password);
    } catch (error) {
        console.error(error);
        deleteErrorMsg.textContent = error.message;
        toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
        return;
    }

    // 2. Executar a Exclusão
    try {
        const batch = writeBatch(db);
        const basePath = "dadosIgreja/ADCA-CG";
        
        if (itemParaExcluir.tipo === 'financeiro') {
            const finDocRef = doc(db, basePath, "financeiro", itemParaExcluir.id);
            const finData = localFinanceiro.find(f => f.id === itemParaExcluir.id);
            
            batch.delete(finDocRef); 

            if (finData && finData.origemId && finData.origemTipo) {
                 const origemCollection = finData.origemTipo === 'dizimo' ? 'dizimos' : 'ofertas';
                 const origemDocRef = doc(db, basePath, origemCollection, finData.origemId);
                 batch.delete(origemDocRef);
            }
        
        } else if (itemParaExcluir.tipo === 'dizimo') {
            const dizimoDocRef = doc(db, basePath, "dizimos", itemParaExcluir.id);
            const dizimoData = localDizimos.find(d => d.id === itemParaExcluir.id);
            
            batch.delete(dizimoDocRef); 
            
            if (dizimoData && dizimoData.financeiroId) {
                const finDocRef = doc(db, basePath, "financeiro", dizimoData.financeiroId);
                batch.delete(finDocRef);
            }

        } else if (itemParaExcluir.tipo === 'oferta') {
            const ofertaDocRef = doc(db, basePath, "ofertas", itemParaExcluir.id);
            const ofertaData = localOfertas.find(o => o.id === itemParaExcluir.id);

            batch.delete(ofertaDocRef); 

            if (ofertaData && ofertaData.financeiroId) {
                const finDocRef = doc(db, basePath, "financeiro", ofertaData.financeiroId);
                batch.delete(finDocRef);
            }
            
        } else if (itemParaExcluir.tipo === 'membro') {
            const membroDocRef = doc(db, basePath, "membros", itemParaExcluir.id);
            await deleteDoc(membroDocRef);
            
            deleteConfirmModal.style.display = "none";
            showToast("Membro excluído com sucesso.", "success");
            toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
            return;
        }

        await batch.commit();
        
        deleteConfirmModal.style.display = "none";
        showToast("Registo excluído com sucesso.", "success");

    } catch (error) {
        console.error("Erro ao excluir registo:", error);
        deleteErrorMsg.textContent = "Erro ao excluir. Tente novamente.";
    } finally {
        toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
    }
});

// Fecha modais se clicar fora do conteúdo
window.onclick = function (event) {
    if (event.target == membroDetalhesModal) {
        membroDetalhesModal.style.display = "none";
    }
    if (event.target == deleteConfirmModal) {
        deleteConfirmModal.style.display = "none";
    }
     if (event.target == membroEditModal) {
        doCloseMembroEditModal(); 
    }
}

// --- GERAÇÃO DE RELATÓRIO (MENSAL) ---
gerarRelatorioBtn.addEventListener("click", () => {
    try {
        const mes = parseInt(relatorioGeralMes.value);
        const ano = parseInt(relatorioGeralAno.value);
        const nomeMes = MESES_DO_ANO[mes];
        
        // 1. Filtrar todos os dados para o mês/ano selecionado
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

        // 2. Calcular Totais do Mês
        const totalDizimos = dizimosDoMes.reduce((acc, d) => acc + (d.valor || 0), 0);
        const totalOfertas = ofertasDoMes.reduce((acc, o) => acc + (o.valor || 0), 0);
        const totalEntradasMes = totalDizimos + totalOfertas;
        
        const saidasDoMes = financDoMes.filter(f => f.valor < 0);
        const totalSaidasMes = saidasDoMes.reduce((acc, s) => acc + (s.valor || 0), 0); // Já é negativo
        
        const saldoMes = totalEntradasMes + totalSaidasMes;
        
        // 3. Calcular Saldo Geral (Total)
        const saldoGeral = localFinanceiro.reduce((acc, t) => acc + (t.valor || 0), 0);
        
        // 4. Ordenar Saídas para o extrato
        saidasDoMes.sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));


        // 5. Construir o HTML do Relatório
        let relatorioHTML = `
            <html>
            <head>
                <title>Relatório Financeiro Mensal - ${nomeMes} ${ano}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: sans-serif; }
                    h1 { font-size: 24px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
                    h2 { font-size: 20px; font-weight: 600; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #93c5fd; padding-bottom: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 14px; }
                    th { background-color: #f3f4f6; font-weight: 600; }
                    .currency { text-align: right; font-weight: 500; }
                    .currency-header { text-align: right; }
                    .entrada { color: #15803d; }
                    .saida { color: #b91c1c; }
                    .total { font-weight: bold; font-size: 16px; }
                    .summary-box { background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; }
                    /* Corrigido: Alinhamento à esquerda */
                    .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db; text-align: left; }
                    .summary-item:last-child { border-bottom: none; }
                    .summary-label { font-weight: 600; color: #1f2937; text-align: left; }
                    .summary-value { font-weight: 600; text-align: right; }
                    .summary-title { font-size: 1.125rem; font-weight: 600; color: #1e40af; margin-bottom: 8px; text-align: left; }
                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="container mx-auto bg-white p-10 rounded shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h1>Relatório Financeiro Mensal</h1>
                        <button onclick="window.print()" class="no-print bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">Imprimir</button>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">Mês de Referência: <span class="font-medium">${nomeMes} de ${ano}</span></p>
                    <p class="text-sm text-gray-600 mb-6">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

                    <!-- Resumo do Mês (Alinhado à Esquerda) -->
                    <div class="summary-box">
                        <h2 class="summary-title">Resumo do Mês (${nomeMes})</h2>
                        <div class="summary-item">
                            <span class="summary-label">Entradas (Mês):</span>
                            <span class="summary-value entrada">${formatarMoeda(totalEntradasMes)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Saídas (Mês):</span>
                            <span class="summary-value saida">${formatarMoeda(totalSaidasMes)}</span>
                        </div>
                        <div class="summary-item total">
                            <span class="summary-label">Saldo (Mês):</span>
                            <span class="summary-value ${saldoMes >= 0 ? 'entrada' : 'saida'}">${formatarMoeda(saldoMes)}</span>
                        </div>
                    </div>
                    
                    <!-- Dízimos -->
                    <h2>Registos de Dízimos (${nomeMes})</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Membro</th>
                                <th class="currency-header">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dizimosDoMes.map(d => `
                                <tr>
                                    <td>${formatarData(d.data)}</td>
                                    <td>${d.membroNome}</td>
                                    <td class="currency entrada">${formatarMoeda(d.valor || 0)}</td>
                                </tr>
                            `).join('')}
                            ${dizimosDoMes.length === 0 ? '<tr><td colspan="3" class="text-center text-gray-500 py-4">Nenhum dízimo registado neste mês.</td></tr>' : ''}
                            <tr class="bg-gray-50 font-bold">
                                <td colspan="2" class="text-right">Total Dízimos (Mês):</td>
                                <td class="currency entrada">${formatarMoeda(totalDizimos)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Ofertas -->
                    <h2>Registos de Ofertas e Outras Entradas (${nomeMes})</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th class="currency-header">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ofertasDoMes.map(o => `
                                <tr>
                                    <td>${formatarData(o.data)}</td>
                                    <td>${o.tipo}</td>
                                    <td>${o.descricao}</td>
                                    <td class="currency entrada">${formatarMoeda(o.valor || 0)}</td>
                                </tr>
                            `).join('')}
                            ${ofertasDoMes.length === 0 ? '<tr><td colspan="4" class="text-center text-gray-500 py-4">Nenhuma oferta registada neste mês.</td></tr>' : ''}
                             <tr class="bg-gray-50 font-bold">
                                <td colspan="3" class="text-right">Total Ofertas (Mês):</td>
                                <td class="currency entrada">${formatarMoeda(totalOfertas)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Extrato Financeiro - SAÍDAS -->
                    <h2>Extrato Financeiro - SAÍDAS (${nomeMes})</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th class="currency-header">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                             ${saidasDoMes.map(f => `
                                <tr>
                                    <td>${formatarData(f.data)}</td>
                                    <td>${f.descricao}</td>
                                    <td class="currency saida">${formatarMoeda(f.valor || 0)}</td>
                                </tr>
                            `).join('')}
                            ${saidasDoMes.length === 0 ? '<tr><td colspan="3" class="text-center text-gray-500 py-4">Nenhuma saída registada neste mês.</td></tr>' : ''}
                            <tr class="bg-gray-50 font-bold">
                                <td colspan="2" class="text-right">Total Saídas (Mês):</td>
                                <td class="currency saida">${formatarMoeda(totalSaidasMes)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Resumo Final (Alinhado à Esquerda) -->
                    <div class="summary-box mt-8">
                         <h2 class="summary-title">Resumo Financeiro Final</h2>
                         <div class="summary-item">
                            <span class="summary-label">Total de Entradas (${nomeMes}):</span>
                            <span class="summary-value entrada">${formatarMoeda(totalEntradasMes)}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Total de Saídas (${nomeMes}):</span>
                            <span class="summary-value saida">${formatarMoeda(totalSaidasMes)}</span>
                        </div>
                        <div class="summary-item total">
                            <span class="summary-label">Saldo Final (${nomeMes}):</span>
                            <span class="summary-value ${saldoMes >= 0 ? 'entrada' : 'saida'}">${formatarMoeda(saldoMes)}</span>
                        </div>
                         <div class="summary-item total border-t-2 border-blue-200 mt-2 pt-2">
                            <span class="summary-label text-blue-800">SALDO FINAL (CAIXA GERAL):</span>
                            <span class="summary-value ${saldoGeral >= 0 ? 'text-blue-800' : 'saida'}">${formatarMoeda(saldoGeral)}</span>
                        </div>
                    </div>
                    
                </div>
            </body>
            </html>
        `;

        // 6. Abrir numa nova janela
        const relatorioJanela = window.open("", "_blank");
        if (!relatorioJanela || relatorioJanela.closed || typeof relatorioJanela.closed == 'undefined') {
            console.error("Falha ao abrir janela de relatório. Provável bloqueador de pop-up.");
            showToast("Falha ao abrir relatório. Desative o bloqueador de pop-ups.", "error");
            return;
        }

        relatorioJanela.document.write(relatorioHTML);
        relatorioJanela.document.close();
    
    } catch (error) {
        // Pega qualquer erro que possa ter acontecido
        console.error("Erro ao gerar relatório:", error);
        // Corrigido: `totalEntradas` para `totalEntradasMes` (erro de digitação)
        showToast("Ocorreu um erro inesperado ao gerar o relatório.", "error");
    }
});


// --- ABA DE ANIVERSARIANTES ---
function renderAniversariantes() {
    if (localMembros.length === 0) {
        listaAniversariantesAtual.innerHTML = '<p class="text-gray-500 p-4">Nenhum membro cadastrado.</p>';
        listaAniversariantesProximos.innerHTML = '<p class="text-gray-500 p-4">Nenhum membro cadastrado.</p>';
        return;
    }
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth(); // 0-11
    tituloAniversariantesAtual.textContent = `Aniversariantes de ${MESES_DO_ANO[mesAtual]}`;
    
    const aniversariantesPorMes = {};
    for (let i = 0; i < 12; i++) {
        aniversariantesPorMes[i] = [];
    }

    // 1. Agrupa membros por mês de aniversário
    localMembros.forEach(membro => {
        const dataNasc = getDateFromInput(membro.dataNascimento);
        if (dataNasc) {
            const mes = dataNasc.getUTCMonth(); // 0-11
            const dia = dataNasc.getUTCDate();
            aniversariantesPorMes[mes].push({ ...membro, dia });
        }
    });

    // 2. Ordena aniversariantes dentro de cada mês pelo dia
    for (let mes in aniversariantesPorMes) {
        aniversariantesPorMes[mes].sort((a, b) => a.dia - b.dia);
    }
    
    // 3. Renderiza o Mês Vigente
    const aniversariantesAtuais = aniversariantesPorMes[mesAtual];
    if (aniversariantesAtuais.length === 0) {
         listaAniversariantesAtual.innerHTML = `<div class="p-4 text-center text-gray-500">Nenhum aniversariante este mês.</div>`;
    } else {
        listaAniversariantesAtual.innerHTML = aniversariantesAtuais.map(m => `
            <div class="py-3 px-2 flex justify-between items-center hover:bg-gray-50 rounded">
                <div>
                    <div class="font-medium text-gray-800">${m.nome}</div>
                    <div class="text-sm text-gray-500">Função: ${m.funcao || 'N/A'}</div>
                </div>
                <div class="text-lg font-bold text-blue-600">${String(m.dia).padStart(2, '0')}</div>
            </div>
        `).join('');
    }
    
    // 4. Renderiza os Próximos Meses
    listaAniversariantesProximos.innerHTML = ""; // Limpa
    let mesesOrdenados = [];
    for (let i = 1; i < 12; i++) {
        mesesOrdenados.push((mesAtual + i) % 12);
    }
    
    let encontrouProximos = false;
    mesesOrdenados.forEach(mesIndex => {
        const aniversariantesDoMes = aniversariantesPorMes[mesIndex];
        if (aniversariantesDoMes.length > 0) {
            encontrouProximos = true;
            const mesDiv = document.createElement('div');
            mesDiv.innerHTML = `<h4 class="font-semibold text-gray-700 border-b pb-1 mb-2">${MESES_DO_ANO[mesIndex]}</h4>`;
            
            const listaUl = document.createElement('ul');
            listaUl.className = "divide-y divide-gray-100";
            listaUl.innerHTML = aniversariantesDoMes.map(m => `
                <li class="py-2 px-1 flex justify-between items-center">
                    <span class="text-sm text-gray-700">${m.nome}</span>
                    <span class="text-sm font-medium text-gray-600">${String(m.dia).padStart(2, '0')}</span>
                </li>
            `).join('');
            
            mesDiv.appendChild(listaUl);
            listaAniversariantesProximos.appendChild(mesDiv);
        }
    });
    
    if (!encontrouProximos) {
         listaAniversariantesProximos.innerHTML = `<p class="text-gray-500 p-4">Nenhum aniversariante nos próximos meses.</p>`;
    }
}

// Relatório de Aniversariantes
gerarRelatorioAniversariantesBtn.addEventListener("click", () => {
    try {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const nomeMesAtual = MESES_DO_ANO[mesAtual];
        
        const htmlAtual = document.getElementById('lista-aniversariantes-atual').innerHTML;
        const htmlProximos = document.getElementById('lista-aniversariantes-proximos').innerHTML;
        
        let relatorioHTML = `
            <html>
            <head>
                <title>Relatório de Aniversariantes</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: sans-serif; }
                    h1 { font-size: 24px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
                    h2 { font-size: 20px; font-weight: 600; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #93c5fd; padding-bottom: 4px; }
                    /* Estilos do Mês Vigente (copiados do .js) */
                    .aniversariante-atual { border-bottom: 1px solid #e5e7eb; padding: 12px 8px; display: flex; justify-content: space-between; align-items: center; }
                    .aniversariante-atual-nome { font-weight: 500; color: #1f2937; }
                    .aniversariante-atual-funcao { font-size: 14px; color: #6b7280; }
                    .aniversariante-atual-dia { font-size: 20px; font-weight: 700; color: #2563eb; }
                    /* Estilos dos Próximos Meses (copiados do .js) */
                    .proximo-mes-titulo { font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; margin-top: 16px; font-size: 18px; }
                    .proximo-mes-lista { list-style: none; padding-left: 0; }
                    .proximo-mes-item { padding: 8px 4px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; }
                    .proximo-mes-nome { font-size: 14px; color: #374151; }
                    .proximo-mes-dia { font-size: 14px; font-weight: 500; color: #4b5563; }
                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="container mx-auto bg-white p-10 rounded shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h1>Relatório de Aniversariantes</h1>
                        <button onclick="window.print()" class="no-print bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">Imprimir</button>
                    </div>
                    <p class="text-sm text-gray-600 mb-6">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    
                    <!-- Mês Vigente -->
                    <h2 class="text-xl font-semibold text-blue-700 mb-4">${tituloAniversariantesAtual.textContent}</h2>
                    <div class="divide-y divide-gray-200">
                        ${listaAniversariantesAtual.innerHTML}
                    </div>
                    
                    <!-- Próximos Meses -->
                    <h2 class="text-xl font-semibold text-gray-800 mb-4 mt-8">Próximos Meses</h2>
                    <div class="space-y-4">
                        ${listaAniversariantesProximos.innerHTML}
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Substitui classes do Tailwind por estilos inline (para impressão)
        relatorioHTML = relatorioHTML.replace(/class="py-3 px-2 flex justify-between items-center hover:bg-gray-50 rounded"/g, 'style="border-bottom: 1px solid #e5e7eb; padding: 12px 8px; display: flex; justify-content: space-between; align-items: center;"');
        relatorioHTML = relatorioHTML.replace(/class="font-medium text-gray-800"/g, 'style="font-weight: 500; color: #1f2937;"');
        relatorioHTML = relatorioHTML.replace(/class="text-sm text-gray-500"/g, 'style="font-size: 14px; color: #6b7280;"');
        relatorioHTML = relatorioHTML.replace(/class="text-lg font-bold text-blue-600"/g, 'style="font-size: 20px; font-weight: 700; color: #2563eb;"');
        relatorioHTML = relatorioHTML.replace(/class="font-semibold text-gray-700 border-b pb-1 mb-2"/g, 'style="font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; margin-top: 16px; font-size: 18px;"');
        relatorioHTML = relatorioHTML.replace(/class="divide-y divide-gray-100"/g, 'style="list-style: none; padding-left: 0;"');
        relatorioHTML = relatorioHTML.replace(/class="py-2 px-1 flex justify-between items-center"/g, 'style="padding: 8px 4px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6;"');
        relatorioHTML = relatorioHTML.replace(/class="text-sm text-gray-700"/g, 'style="font-size: 14px; color: #374151;"');
        relatorioHTML = relatorioHTML.replace(/class="text-sm font-medium text-gray-600"/g, 'style="font-size: 14px; font-weight: 500; color: #4b5563;"');


        const relatorioJanela = window.open("", "_blank");
        if (!relatorioJanela || relatorioJanela.closed || typeof relatorioJanela.closed == 'undefined') {
            showToast("Falha ao abrir relatório. Desative o bloqueador de pop-ups.", "error");
            return;
        }
        relatorioJanela.document.write(relatorioHTML);
        relatorioJanela.document.close();
        
    } catch(error) {
        console.error("Erro ao gerar relatório de aniversariantes:", error);
        showToast("Erro ao gerar relatório de aniversariantes.", "error");
    }
});


// --- FUNÇÕES UTILITÁRIAS ---

// Controla o estado de loading de um botão
function toggleButtonLoading(button, isLoading, defaultText) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span>Aguarde...`;
    } else {
        button.disabled = false;
        button.innerHTML = defaultText;
    }
}

// Mostra um toast de notificação
function showToast(message, type = 'success') {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    // Remove o toast após 3 segundos
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease-out forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}


// Função de formatação de data
function formatarData(dataString) {
    if (dataString && typeof dataString.toDate === 'function') {
        dataString = dataString.toDate();
    }
    else if (dataString instanceof Date) {
         // Não faz nada, já é um Date
    }
    else if (typeof dataString === 'string' && dataString.includes('-')) {
         dataString = getDateFromInput(dataString);
    } 
    else {
        return 'N/A';
    }
    
    try {
        return dataString.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        console.warn("Erro ao formatar data:", dataString, e);
        return 'N/A';
    }
}

// Converte string 'aaaa-mm-dd' ou Timestamp para um Date UTC
function getDateFromInput(dataInput) {
    try {
        if (dataInput && typeof dataInput.toDate === 'function') {
            return dataInput.toDate();
        }
        if (dataInput instanceof Date) {
            return dataInput;
        }
        if (typeof dataInput === 'string' && dataInput.includes('-')) {
            const parts = dataInput.split('-');
            if (parts.length === 3) {
                return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            }
        }
    } catch (e) {
        console.error("Data inválida:", dataInput, e);
        return null;
    }
    return null;
}

// Calcula idade
function calcularIdade(dataNascimento) {
    // Corrigido: erro de digitação de 'dataNTascimento' para 'dataNascimento'
    if (!dataNascimento) return null; 
    
    const dataNasc = getDateFromInput(dataNascimento);
    if (!dataNasc) return null;

    const hoje = new Date();
    let idade = hoje.getUTCFullYear() - dataNasc.getUTCFullYear();
    const m = hoje.getUTCMonth() - dataNasc.getUTCMonth();
    
    if (m < 0 || (m === 0 && hoje.getUTCDate() < dataNasc.getUTCDate())) {
        idade--;
    }
    return idade;
}

// Formatar Moeda (para Relatório)
function formatarMoeda(valor) {
    if (typeof valor !== 'number') {
        valor = 0;
    }
    const formatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    // Remove o "R$" negativo (ex: -R$ 100) e coloca o sinal antes (ex: R$ -100)
    if (valor < 0) {
        return `R$ -${formatado.replace('R$', '').replace('-', '')}`;
    }
    return formatado;
}


// Inicializa ícones Lucide
lucide.createIcons();
