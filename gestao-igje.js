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
// REMOVIDO: Importações do Storage

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
// REMOVIDO: storage
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // REMOVIDO: storage = getStorage(app);
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

// --- CONTROLE DE AUTENTICAÇÃO ---

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

const loginTabButton = document.getElementById("login-tab-button");
const registerTabButton = document.getElementById("register-tab-button");
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");

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
    
    // Campos
    const nome = document.getElementById("register-name").value;
    const telefone = document.getElementById("register-phone").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    // --- INÍCIO DAS NOVAS VERIFICAÇÕES ---

    // 1. Validar campos
    if (!nome || !telefone) {
        registerError.textContent = "Nome e Telefone são obrigatórios.";
        toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
        return;
    }
    
    // 2. Limpar nome e telefone
    const nomeLimpo = nome.trim().toLowerCase();
    const telefoneLimpo = telefone.replace(/\D/g, ''); // Remove tudo que não é dígito

    // 3. Verificar lista de combinações permitidas
    const allowedUsers = {
        "gabriel angelino": "21964597378",
        "lorrane": "21979626240"
    };

    if (allowedUsers[nomeLimpo] !== telefoneLimpo) {
         registerError.textContent = "Combinação de nome e telefone não autorizada.";
         toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
         return;
    }
   
    // --- FIM DAS NOVAS VERIFICAÇÕES ---

    try {
        // 4. Criar o usuário na Autenticação
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 5. Salvar dados do perfil no Firestore
        await setDoc(doc(db, "dadosIgreja/ADCA-CG/perfisUtilizadores", user.uid), {
            nome: nome.trim(),
            telefone: telefoneLimpo,
            email: email,
            createdAt: Timestamp.now()
        });

        // O onAuthStateChanged vai pegar a partir daqui
        
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
        userId = user.uid; // userId é usado para reautenticação, mas não para caminhos
        userEmailDisplay.textContent = user.email;
        authScreen.style.display = "none";
        appContent.style.display = "block";
        loadAllData(); // Carrega os dados partilhados
        
        // Define as datas dos formulários para hoje
        document.getElementById("dizimo-data").valueAsDate = new Date();
        document.getElementById("oferta-data").valueAsDate = new Date();
        document.getElementById("fin-data").valueAsDate = new Date();

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

// Esta função é crucial para operações seguras (excluir, editar)
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

const tabButtons = document.querySelectorAll(".app-tab-button"); // ATUALIZADO
const tabContents = document.querySelectorAll(".tab-content:not(#login-tab):not(#register-tab)");

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
        // ATUALIZAÇÃO: Renderiza o relatório mensal se a aba for essa
        if (targetTab === 'relatorio-mensal') {
            renderRelatorioMensal();
        }

        // Atualiza ícones quando muda de aba
        lucide.createIcons();
    });
});

// --- FORMULÁRIO DE MEMBROS (CADASTRO) ---

const formMembro = document.getElementById("form-membro");
const membroSubmitBtn = document.getElementById("membro-submit-btn");
// Campos condicionais de Cônjuge
const estadoCivilSelect = document.getElementById("estado-civil");
const conjugeContainer = document.getElementById("conjuge-container");

estadoCivilSelect.addEventListener("change", () => {
    if (estadoCivilSelect.value === 'Casado(a)') {
        conjugeContainer.classList.remove("hidden");
    } else {
        conjugeContainer.classList.add("hidden");
    }
});


formMembro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return; // Precisa estar logado

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
        // Salva no caminho partilhado
        const docRef = collection(db, "dadosIgreja/ADCA-CG/membros");
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

const formEditMembro = document.getElementById("form-edit-membro");
const editMembroError = document.getElementById("edit-membro-error");
const editMembroSubmitBtn = document.getElementById("edit-membro-submit-btn");
// Campos condicionais de Cônjuge (Edição)
const editEstadoCivilSelect = document.getElementById("edit-estado-civil");
const editConjugeContainer = document.getElementById("edit-conjuge-container");

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
        // Atualiza no caminho partilhado
        const docRef = doc(db, "dadosIgreja/ADCA-CG/membros", membroParaEditarId);
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

const formDizimo = document.getElementById("form-dizimo");
const dizimoSubmitBtn = document.getElementById("dizimo-submit-btn");

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

        // 1. Cria o documento de dízimo (caminho partilhado)
        const dizimoDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/dizimos"));
        batch.set(dizimoDocRef, {
            membroId: membroId,
            membroNome: membroNome,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            financeiroId: null 
        });

        // 2. Cria o documento financeiro (caminho partilhado)
        const financeiroDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/financeiro"));
        batch.set(financeiroDocRef, {
            tipo: "entrada",
            descricao: `Dízimo - ${membroNome}`,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: dizimoDocRef.id, 
            origemTipo: "dizimo"      
        });

        batch.update(dizimoDocRef, { financeiroId: financeiroDocRef.id });
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

const formOferta = document.getElementById("form-oferta");
const ofertaSubmitBtn = document.getElementById("oferta-submit-btn");

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

        // 1. Cria o documento de oferta (caminho partilhado)
        const ofertaDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/ofertas"));
        batch.set(ofertaDocRef, {
            tipo: tipo,
            descricao: descricao,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            financeiroId: null 
        });

        // 2. Cria o documento financeiro (caminho partilhado)
        const financeiroDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/financeiro"));
        batch.set(financeiroDocRef, {
            tipo: "entrada",
            descricao: `${tipo} - ${descricao}`,
            valor: valor,
            data: data,
            timestamp: Timestamp.fromDate(new Date(`${data}T12:00:00`)),
            origemId: ofertaDocRef.id, 
            origemTipo: "oferta"      
        });

        batch.update(ofertaDocRef, { financeiroId: financeiroDocRef.id });
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

const formFinanceiro = document.getElementById("form-financeiro");
const financeiroSubmitBtn = document.getElementById("financeiro-submit-btn");

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
        // Salva no caminho partilhado
        const colRef = collection(db, "dadosIgreja/ADCA-CG/financeiro");
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

// Função principal para carregar dados
function loadAllData() { // userId não é mais necessário para os caminhos
    if (!auth.currentUser) return;
    console.log("Carregando dados partilhados...");
    document.getElementById("dashboard-loading").innerHTML = '<div class="spinner !border-t-blue-600 !border-gray-300 w-5 h-5"></div> Carregando dados...';

    stopAllListeners();

    let loadsPending = 4;
    const onDataLoaded = () => {
        loadsPending--;
        if (loadsPending === 0) {
            console.log("Todos os dados carregados.");
            document.getElementById("dashboard-loading").innerHTML = "";
            updateDashboard();
            renderRelatorioMensal(); // Renderiza o relatório mensal com dados atuais
        }
    };

    // Caminhos partilhados
    const basePath = "dadosIgreja/ADCA-CG";

    // Ouvir Membros
    try {
        const qMembros = query(collection(db, basePath, "membros"));
        unsubMembros = onSnapshot(qMembros, (snapshot) => {
            localMembros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localMembros.sort((a, b) => a.nome.localeCompare(b.nome)); 
            renderMembros(localMembros);
            populateMembrosSelect(localMembros);
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir membros:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de membros:", e); onDataLoaded(); }

    // Ouvir Dízimos
    try {
        const qDizimos = query(collection(db, basePath, "dizimos"));
        unsubDizimos = onSnapshot(qDizimos, (snapshot) => {
            localDizimos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroDizimos(); 
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir dízimos:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de dízimos:", e); onDataLoaded(); }

    // Ouvir Ofertas
    try {
        const qOfertas = query(collection(db, basePath, "ofertas"));
        unsubOfertas = onSnapshot(qOfertas, (snapshot) => {
            localOfertas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroOfertas(); 
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir ofertas:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de ofertas:", e); onDataLoaded(); }


    // Ouvir Financeiro
    try {
        const qFinanceiro = query(collection(db, basePath, "financeiro"));
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
    document.getElementById("lista-membros").innerHTML = "";
    document.getElementById("lista-dizimos").innerHTML = "";
    document.getElementById("lista-ofertas").innerHTML = "";
    document.getElementById("lista-financeiro").innerHTML = "";
    document.getElementById("dizimo-membro").innerHTML = '<option value="">Selecione o Membro</option>';
    document.getElementById("saldo-total-financeiro").textContent = "R$ 0,00";
    document.getElementById("saldo-total-dashboard").textContent = "R$ 0,00";
    document.getElementById("entradas-mes-dashboard").textContent = "R$ 0,00";
    document.getElementById("saidas-mes-dashboard").textContent = "R$ 0,00";
    document.getElementById("total-membros-dashboard").textContent = "0";
    document.getElementById("relatorio-mensal-container").innerHTML = "<p>Selecione o mês e o ano para ver o relatório.</p>";
}


// Renderizar Tabela de Membros
const listaMembros = document.getElementById("lista-membros");
const filtroMembros = document.getElementById("filtro-membros");

filtroMembros.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    const membrosFiltrados = localMembros.filter(m => m.nome.toLowerCase().includes(termo));
    renderMembros(membrosFiltrados);
});

function renderMembros(membros) {
    listaMembros.innerHTML = ""; // Limpa a lista
    if (membros.length === 0) {
        listaMembros.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum membro encontrado.</td></tr>';
        return;
    }
    membros.forEach(membro => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50";
        tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <a href="#" class="text-blue-600 hover:text-blue-800 font-medium" data-id="${membro.id}">${membro.nome}</a>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${calcularIdade(membro.dataNascimento) || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${membro.funcao || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${membro.telefone || ''}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${membro.email || ''}</td>
    `;
        // Adiciona listener para abrir modal
        tr.querySelector("a").addEventListener("click", (e) => {
            e.preventDefault();
            showMembroDetalhesModal(membro.id);
        });
        listaMembros.appendChild(tr);
    });
}

// Popular Select de Membros
const dizimoMembroSelect = document.getElementById("dizimo-membro");
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
const listaFinanceiro = document.getElementById("lista-financeiro");
const saldoTotalFinanceiro = document.getElementById("saldo-total-financeiro");

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

    // Adiciona listeners aos botões de excluir
    adicionarListenersExcluir();

    // Atualiza ícones Lucide
    lucide.createIcons();
}

// --- FILTROS E RENDERIZAÇÃO DE DÍZIMOS E OFERTAS ---

const filtroDizimoMes = document.getElementById("filtro-dizimo-mes");
const filtroDizimoAno = document.getElementById("filtro-dizimo-ano");
const listaDizimos = document.getElementById("lista-dizimos");
const filtroOfertaMes = document.getElementById("filtro-oferta-mes");
const filtroOfertaAno = document.getElementById("filtro-oferta-ano");
const listaOfertas = document.getElementById("lista-ofertas");
const filtroFinanceiroMes = document.getElementById("filtro-financeiro-mes");
const filtroFinanceiroAno = document.getElementById("filtro-financeiro-ano");
// NOVOS SELETORES (Relatório Mensal)
const filtroRelatorioMes = document.getElementById("filtro-relatorio-mes");
const filtroRelatorioAno = document.getElementById("filtro-relatorio-ano");
const relatorioContainer = document.getElementById("relatorio-mensal-container");
const gerarRelatorioMesBtn = document.getElementById("gerar-relatorio-mes-btn");


const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const hoje = new Date();
const mesAtual = hoje.getMonth();
const anoAtual = hoje.getFullYear();

function popularFiltros(selectMes, selectAno) {
    // Meses
    selectMes.innerHTML = "";
    meses.forEach((mes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = mes;
        if (index === mesAtual) option.selected = true;
        selectMes.appendChild(option);
    });

    // Anos (Ano atual + 2 anteriores)
    selectAno.innerHTML = "";
    for (let i = 0; i < 3; i++) {
        const ano = anoAtual - i;
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        if (ano === anoAtual) option.selected = true;
        selectAno.appendChild(option);
    }
}

popularFiltros(filtroDizimoMes, filtroDizimoAno);
popularFiltros(filtroOfertaMes, filtroOfertaAno);
popularFiltros(filtroFinanceiroMes, filtroFinanceiroAno);
// ADICIONADO: Popular filtros do novo relatório
popularFiltros(filtroRelatorioMes, filtroRelatorioAno);

filtroDizimoMes.addEventListener("change", renderFiltroDizimos);
filtroDizimoAno.addEventListener("change", renderFiltroDizimos);
filtroOfertaMes.addEventListener("change", renderFiltroOfertas);
filtroOfertaAno.addEventListener("change", renderFiltroOfertas);
filtroFinanceiroMes.addEventListener("change", renderFiltroFinanceiro);
filtroFinanceiroAno.addEventListener("change", renderFiltroFinanceiro);
// ADICIONADO: Listeners do novo relatório
filtroRelatorioMes.addEventListener("change", renderRelatorioMensal);
filtroRelatorioAno.addEventListener("change", renderRelatorioMensal);
gerarRelatorioMesBtn.addEventListener("click", imprimirRelatorioMensal);

// NOVA FUNÇÃO para filtrar e renderizar o financeiro
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

    // 4. Calcular e renderizar o SALDO TOTAL (usando todos os dados)
    const saldoTotal = localFinanceiro.reduce((acc, transacao) => acc + transacao.valor, 0);
    const corSaldo = saldoTotal >= 0 ? "text-blue-700" : "text-red-700";
    saldoTotalFinanceiro.className = `text-2xl font-bold ${corSaldo}`;
    saldoTotalFinanceiro.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;
}


function renderFiltroDizimos() {
    const mes = parseInt(filtroDizimoMes.value);
    const ano = parseInt(filtroDizimoAno.value);

    const dadosFiltrados = localDizimos.filter(d => {
        const data = getDateFromInput(d.data); 
        if (!data) return false; // Ignora datas inválidas
        return data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    });

    // Ordena por data
    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataA - dataB; // Mais antigo primeiro
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
    adicionarListenersExcluir(); // Adiciona listeners aos novos botões
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

    // Ordena por data
    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataA - dataB; // Mais antigo primeiro
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
    adicionarListenersExcluir(); // Adiciona listeners aos novos botões
    lucide.createIcons();
}


// --- (NOVAS FUNÇÕES) RELATÓRIO FINANCEIRO MENSAL ---

// 1. Renderiza a pré-visualização do relatório na aba
function renderRelatorioMensal() {
    if (!localFinanceiro || !localDizimos || !localOfertas) {
        relatorioContainer.innerHTML = "<p>A carregar dados...</p>";
        return;
    }

    const mes = parseInt(filtroRelatorioMes.value);
    const ano = parseInt(filtroRelatorioAno.value);
    const nomeMes = meses[mes];

    // --- Coletar Dados ---
    
    // Entradas de Dízimos
    const dizimosDoMes = localDizimos.filter(d => {
        const data = getDateFromInput(d.data);
        return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));
    const totalDizimos = dizimosDoMes.reduce((acc, d) => acc + (d.valor || 0), 0);
    
    // Entradas de Ofertas
    const ofertasDoMes = localOfertas.filter(o => {
        const data = getDateFromInput(o.data);
        return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));
    const totalOfertas = ofertasDoMes.reduce((acc, o) => acc + (o.valor || 0), 0);

    // Saídas
    const saidasDoMes = localFinanceiro.filter(f => {
        const data = getDateFromInput(f.data);
        return data && data.getUTCMonth() === mes && data.getUTCFullYear() === ano && f.valor < 0;
    }).sort((a, b) => getDateFromInput(a.data) - getDateFromInput(b.data));
    const totalSaidas = saidasDoMes.reduce((acc, f) => acc + (f.valor || 0), 0); // Já é negativo

    // Resumo
    const totalEntradas = totalDizimos + totalOfertas;
    const saldoDoMes = totalEntradas + totalSaidas;

    // --- Construir HTML ---
    
    let html = `
        <!-- Resumo -->
        <h3 class="text-xl font-semibold text-center mb-4">Resumo de ${nomeMes} / ${ano}</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                <h4 class="text-sm font-medium text-gray-500 uppercase">Total Entradas</h4>
                <p class="text-2xl font-bold text-green-700">R$ ${totalEntradas.toFixed(2).replace(".", ",")}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                <h4 class="text-sm font-medium text-gray-500 uppercase">Total Saídas</h4>
                <p class="text-2xl font-bold text-red-700">R$ ${Math.abs(totalSaidas).toFixed(2).replace(".", ",")}</p>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <h4 class="text-sm font-medium text-gray-500 uppercase">Saldo do Mês</h4>
                <p class="text-2xl font-bold ${saldoDoMes >= 0 ? 'text-blue-700' : 'text-red-700'}">R$ ${saldoDoMes.toFixed(2).replace(".", ",")}</p>
            </div>
        </div>

        <!-- Detalhe Dízimos -->
        <h3 class="text-lg font-semibold text-gray-700 mt-6 mb-2">Dízimos do Mês (${dizimosDoMes.length})</h3>
        <div class="overflow-x-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Membro</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${dizimosDoMes.map(d => `
                        <tr>
                            <td class="px-4 py-2 text-sm">${formatarData(d.data)}</td>
                            <td class="px-4 py-2 text-sm">${d.membroNome}</td>
                            <td class="px-4 py-2 text-sm text-green-600 font-medium">R$ ${(d.valor || 0).toFixed(2).replace(".", ",")}</td>
                        </tr>
                    `).join('')}
                    ${dizimosDoMes.length === 0 ? '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500">Nenhum dízimo neste mês.</td></tr>' : ''}
                </tbody>
            </table>
        </div>

        <!-- Detalhe Ofertas -->
        <h3 class="text-lg font-semibold text-gray-700 mt-6 mb-2">Ofertas e Outras Entradas (${ofertasDoMes.length})</h3>
        <div class="overflow-x-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${ofertasDoMes.map(o => `
                        <tr>
                            <td class="px-4 py-2 text-sm">${formatarData(o.data)}</td>
                            <td class="px-4 py-2 text-sm">${o.tipo}</td>
                            <td class="px-4 py-2 text-sm">${o.descricao}</td>
                            <td class="px-4 py-2 text-sm text-green-600 font-medium">R$ ${(o.valor || 0).toFixed(2).replace(".", ",")}</td>
                        </tr>
                    `).join('')}
                    ${ofertasDoMes.length === 0 ? '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">Nenhuma oferta neste mês.</td></tr>' : ''}
                </tbody>
            </table>
        </div>

        <!-- Detalhe Saídas -->
        <h3 class="text-lg font-semibold text-gray-700 mt-6 mb-2">Saídas do Mês (${saidasDoMes.length})</h3>
        <div class="overflow-x-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${saidasDoMes.map(f => `
                        <tr>
                            <td class="px-4 py-2 text-sm">${formatarData(f.data)}</td>
                            <td class="px-4 py-2 text-sm">${f.descricao}</td>
                            <td class="px-4 py-2 text-sm text-red-600 font-medium">R$ ${(f.valor || 0).toFixed(2).replace(".", ",")}</td>
                        </tr>
                    `).join('')}
                    ${saidasDoMes.length === 0 ? '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500">Nenhuma saída neste mês.</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;

    relatorioContainer.innerHTML = html;
}

// 2. Gera o HTML completo para a janela de impressão
function imprimirRelatorioMensal() {
    try {
        const mes = parseInt(filtroRelatorioMes.value);
        const ano = parseInt(filtroRelatorioAno.value);
        const nomeMes = meses[mes];

        // Pega o conteúdo já renderizado na pré-visualização
        const conteudoRelatorio = document.getElementById("relatorio-mensal-container").innerHTML;

        let relatorioHTML = `
            <html>
            <head>
                <title>Relatório Mensal - ${nomeMes} ${ano}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                    body { font-family: sans-serif; }
                    h1 { font-size: 24px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
                    /* Estilos das tabelas e resumos (reutilizados da função renderRelatorioMensal) */
                    
                    /* Adicionando estilos que podem estar faltando no print */
                    .text-xl { font-size: 1.25rem; }
                    .font-semibold { font-weight: 600; }
                    .text-center { text-align: center; }
                    .mb-4 { margin-bottom: 1rem; }
                    .grid { display: grid; }
                    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                    .md\:grid-cols-3 { @media (min-width: 768px) { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
                    .gap-4 { gap: 1rem; }
                    .mb-6 { margin-bottom: 1.5rem; }
                    .p-4 { padding: 1rem; }
                    .rounded-lg { border-radius: 0.5rem; }
                    .border { border-width: 1px; }
                    .bg-green-50 { background-color: #f0fdf4; }
                    .border-green-200 { border-color: #bbf7d0; }
                    .bg-red-50 { background-color: #fef2f2; }
                    .border-red-200 { border-color: #fecaca; }
                    .bg-blue-50 { background-color: #eff6ff; }
                    .border-blue-200 { border-color: #bfdbfe; }
                    .text-sm { font-size: 0.875rem; }
                    .font-medium { font-weight: 500; }
                    .text-gray-500 { color: #6b7280; }
                    .uppercase { text-transform: uppercase; }
                    .text-2xl { font-size: 1.5rem; }
                    .font-bold { font-weight: 700; }
                    .text-green-700 { color: #15803d; }
                    .text-red-700 { color: #b91c1c; }
                    .text-blue-700 { color: #1d4ed8; }
                    .text-red-600 { color: #dc2626; }
                    .text-green-600 { color: #16a34a; }
                    .mt-6 { margin-top: 1.5rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .text-lg { font-size: 1.125rem; }
                    .text-gray-700 { color: #374151; }
                    .overflow-x-auto { overflow-x: auto; }
                    .border { border-width: 1px; border-color: #e5e7eb; }
                    .min-w-full { min-width: 100%; }
                    .divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px; border-color: #e5e7eb; }
                    .bg-gray-50 { background-color: #f9fafb; }
                    .px-4 { padding-left: 1rem; padding-right: 1rem; }
                    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                    .text-left { text-align: left; }
                    .text-xs { font-size: 0.75rem; }
                    .bg-white { background-color: #ffffff; }
                    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }

                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="container mx-auto bg-white p-10 rounded shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h1>Relatório: ${nomeMes} / ${ano}</h1>
                        <button onclick="window.print()" class="no-print bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">Imprimir</button>
                    </div>
                    <p class="text-sm text-gray-600 mb-6">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    
                    ${conteudoRelatorio}

                </div>
            </body>
            </html>
        `;

        const relatorioJanela = window.open("", "_blank");
        if (!relatorioJanela || relatorioJanela.closed || typeof relatorioJanela.closed == 'undefined') {
            showToast("Falha ao abrir relatório. Desative o bloqueador de pop-ups.", "error");
            return;
        }
        relatorioJanela.document.write(relatorioHTML);
        relatorioJanela.document.close();
    
    } catch (error) {
        console.error("Erro ao imprimir relatório mensal:", error);
        showToast("Ocorreu um erro inesperado ao gerar o relatório.", "error");
    }
}


// --- ATUALIZAÇÃO DO DASHBOARD ---

const saldoDashboard = document.getElementById("saldo-total-dashboard");
const entradasDashboard = document.getElementById("entradas-mes-dashboard");
const saidasDashboard = document.getElementById("saidas-mes-dashboard");
const membrosDashboard = document.getElementById("total-membros-dashboard");
const dashboardLoading = document.getElementById("dashboard-loading");

function updateDashboard() {
    if (!localFinanceiro || !localMembros) return; // Não atualiza se os dados não chegaram

    // 1. Saldo Total
    const saldoTotal = localFinanceiro.reduce((acc, transacao) => acc + transacao.valor, 0);
    const corSaldo = saldoTotal >= 0 ? "text-blue-700" : "text-red-700";
    saldoDashboard.className = `text-3xl font-bold ${corSaldo} mt-1`;
    saldoDashboard.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;

    // 2. Total de Membros
    membrosDashboard.textContent = localMembros.length;

    // 3. Entradas e Saídas do Mês Atual
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

    entradasDashboard.textContent = `R$ ${entradasMes.toFixed(2).replace(".", ",")}`;
    saidasDashboard.textContent = `R$ ${Math.abs(saidasMes).toFixed(2).replace(".", ",")}`;
}

// --- CONTROLO DOS MODAIS (JANELAS POP-UP) ---

// Modal Detalhes do Membro
const membroDetalhesModal = document.getElementById("membro-detalhes-modal");
const closeMembroModal = document.getElementById("close-membro-modal");

function showMembroDetalhesModal(id) {
    const membro = localMembros.find(m => m.id === id);
    if (!membro) return;

    // Preenche todos os campos
    document.getElementById("modal-nome").textContent = membro.nome;
    document.getElementById("modal-funcao").textContent = membro.funcao || 'N/A';
    document.getElementById("modal-data-nascimento").textContent = formatarData(membro.dataNascimento) || 'N/A';
    document.getElementById("modal-telefone").textContent = membro.telefone || 'N/A';
    document.getElementById("modal-email").textContent = membro.email || 'N/A';
    document.getElementById("modal-cpf").textContent = membro.cpf || 'N/A';
    document.getElementById("modal-rg").textContent = membro.rg || 'N/A';
    document.getElementById("modal-naturalidade").textContent = membro.naturalidade || 'N/A';
    document.getElementById("modal-endereco").textContent = membro.endereco || 'N/A';
    document.getElementById("modal-nome-pai").textContent = membro.nomePai || 'N/A';
    document.getElementById("modal-nome-mae").textContent = membro.nomeMae || 'N/A';
    document.getElementById("modal-estado-civil").textContent = membro.estadoCivil || 'N/A';
    
    // Campo Cônjuge
    const conjugeContainer = document.getElementById("modal-conjuge-container");
    if (membro.estadoCivil === 'Casado(a)' && membro.conjuge) {
        document.getElementById("modal-conjuge").textContent = membro.conjuge;
        conjugeContainer.classList.remove("hidden");
    } else {
        conjugeContainer.classList.add("hidden");
    }

    document.getElementById("modal-profissao").textContent = membro.profissao || 'N/A';
    document.getElementById("modal-escolaridade").textContent = membro.escolaridade || 'N/A';
    document.getElementById("modal-data-batismo").textContent = formatarData(membro.dataBatismo) || 'N/A';
    document.getElementById("modal-data-chegada").textContent = formatarData(membro.dataChegada) || 'N/A';
    document.getElementById("modal-igreja-anterior").textContent = membro.igrejaAnterior || 'N/A';
    document.getElementById("modal-cargo-anterior").textContent = membro.cargoAnterior || 'N/A';
    
    // Define o ID para os botões de ação
    membroParaEditarId = id; // Para edição
    itemParaExcluir.id = id; // Para exclusão
    itemParaExcluir.tipo = 'membro';

    membroDetalhesModal.style.display = "block";
}
closeMembroModal.onclick = () => membroDetalhesModal.style.display = "none";

// Modal Editar Membro
const membroEditModal = document.getElementById("membro-edit-modal");
const closeMembroEditModal = document.getElementById("close-membro-edit-modal");
const showEditMembroBtn = document.getElementById("show-edit-membro-btn");
const cancelEditMembroBtn = document.getElementById("cancel-edit-membro-btn");

function showMembroEditModal() {
    const membro = localMembros.find(m => m.id === membroParaEditarId);
    if (!membro) return;

    // Preenche o formulário de edição
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
    document.getElementById("edit-estado-civil").value = membro.estadoCivil || 'Solteiro(a)';
    document.getElementById("edit-conjuge").value = membro.conjuge || '';
    
    // Mostra/esconde campo cônjuge
    if (document.getElementById("edit-estado-civil").value === 'Casado(a)') {
        editConjugeContainer.classList.remove("hidden");
    } else {
        editConjugeContainer.classList.add("hidden");
    }

    document.getElementById("edit-profissao").value = membro.profissao || '';
    document.getElementById("edit-escolaridade").value = membro.escolaridade || 'Não Alfabetizado';
    document.getElementById("edit-funcao").value = membro.funcao || '';
    document.getElementById("edit-data-batismo").value = membro.dataBatismo || '';
    document.getElementById("edit-data-chegada").value = membro.dataChegada || '';
    document.getElementById("edit-igreja-anterior").value = membro.igrejaAnterior || '';
    document.getElementById("edit-cargo-anterior").value = membro.cargoAnterior || '';

    
    // Limpa erros e senha
    document.getElementById("edit-membro-password").value = "";
    document.getElementById("edit-membro-error").textContent = "";

    // Troca os modais
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
const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const closeDeleteModal = document.getElementById("close-delete-modal");
const deleteConfirmForm = document.getElementById("delete-confirm-form");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const deleteErrorMsg = document.getElementById("delete-error-message");
const deleteCascadeWarning = document.getElementById("delete-cascade-warning");
const showDeleteMembroBtn = document.getElementById("show-delete-membro-btn");
const deleteSubmitBtn = document.getElementById("delete-submit-btn");


function showDeleteModal() {
    // Limpa o modal
    deleteErrorMsg.textContent = "";
    deleteCascadeWarning.textContent = "";
    document.getElementById("delete-password").value = "";

    // Avisos de exclusão em cascata
    if (itemParaExcluir.tipo === 'financeiro') {
        const fin = localFinanceiro.find(f => f.id === itemParaExcluir.id);
        if (fin && fin.origemId) {
            deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o Dízimo ou Oferta original associado a este lançamento.";
        }
    } else if (itemParaExcluir.tipo === 'dizimo' || itemParaExcluir.tipo === 'oferta') {
        deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o lançamento no Caixa associado a este registo.";
    } else if (itemParaExcluir.tipo === 'membro') {
        deleteCascadeWarning.textContent = "Aviso: Excluir um membro NÃO apaga seus registos financeiros.";
        membroDetalhesModal.style.display = "none"; // Fecha modal de detalhes
    }

    deleteConfirmModal.style.display = "block";
}

showDeleteMembroBtn.onclick = showDeleteModal;
closeDeleteModal.onclick = () => deleteConfirmModal.style.display = "none";
cancelDeleteBtn.onclick = () => deleteConfirmModal.style.display = "none";

function adicionarListenersExcluir() {
     document.querySelectorAll(".delete-btn").forEach(button => {
        // Remove listener antigo para evitar duplicados
        button.removeEventListener("click", handleDeleteClick); 
        // Adiciona novo listener
        button.addEventListener("click", handleDeleteClick);
    });
}

function handleDeleteClick(e) {
    // Impede que o clique se propague (caso esteja dentro de outro link)
    e.stopPropagation(); 
    
    // Pega o botão (pode ser o ícone ou o botão)
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
        deleteErrorMsg.textContent = error.message; // Exibe "Senha incorreta."
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
            
            batch.delete(finDocRef); // Apaga o financeiro

            // Se tiver origem, apaga a origem
            if (finData && finData.origemId && finData.origemTipo) {
                 const origemCollection = finData.origemTipo === 'dizimo' ? 'dizimos' : 'ofertas';
                 const origemDocRef = doc(db, basePath, origemCollection, finData.origemId);
                 batch.delete(origemDocRef);
            }
        
        } else if (itemParaExcluir.tipo === 'dizimo') {
            const dizimoDocRef = doc(db, basePath, "dizimos", itemParaExcluir.id);
            const dizimoData = localDizimos.find(d => d.id === itemParaExcluir.id);
            
            batch.delete(dizimoDocRef); // Apaga o dízimo
            
            // Apaga o financeiro associado
            if (dizimoData && dizimoData.financeiroId) {
                const finDocRef = doc(db, basePath, "financeiro", dizimoData.financeiroId);
                batch.delete(finDocRef);
            }

        } else if (itemParaExcluir.tipo === 'oferta') {
            const ofertaDocRef = doc(db, basePath, "ofertas", itemParaExcluir.id);
            const ofertaData = localOfertas.find(o => o.id === itemParaExcluir.id);

            batch.delete(ofertaDocRef); // Apaga a oferta

            // Apaga o financeiro associado
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
            return; // Sai da função aqui
        }

        // 3. Commit do Batch (para fin, dizimo, oferta)
        await batch.commit();
        
        // 4. Fechar modal
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

// --- GERAÇÃO DE RELATÓRIO ---

const gerarRelatorioBtn = document.getElementById("gerar-relatorio-btn");

gerarRelatorioBtn.addEventListener("click", () => {
    // ADICIONADO: try...catch global
    try {
        // 1. Coletar todos os dados
        const saldoTotal = localFinanceiro.reduce((acc, t) => acc + t.valor, 0);
        
        // 2. Ordenar dados financeiros por data (mais antigo primeiro para extrato)
        const financOrdenado = [...localFinanceiro].sort((a, b) => {
            const dataA = getDateFromInput(a.data);
            const dataB = getDateFromInput(b.data);
            if (!dataA) return 1;
            if (!dataB) return -1;
            return dataA - dataB;
        });
        const dizimosOrdenados = [...localDizimos].sort((a, b) => {
            const dataA = getDateFromInput(a.data);
            const dataB = getDateFromInput(b.data);
            if (!dataA) return 1;
            if (!dataB) return -1;
            return dataA - dataB;
        });
        const ofertasOrdenadas = [...localOfertas].sort((a, b) => {
            const dataA = getDateFromInput(a.data);
            const dataB = getDateFromInput(b.data);
            if (!dataA) return 1;
            if (!dataB) return -1;
            return dataA - dataB;
        });


        // 3. Construir o HTML do Relatório
        let relatorioHTML = `
            <html>
            <head>
                <!-- TÍTULO ATUALIZADO -->
                <title>Relatório GESTÃO ADCA - CAPOEIRA GRANDE</title>
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
                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="container mx-auto bg-white p-10 rounded shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <!-- TÍTULO ATUALIZADO -->
                        <h1>Relatório GESTÃO ADCA - CAPOEIRA GRANDE</h1>
                        <button onclick="window.print()" class="no-print bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">Imprimir</button>
                    </div>
                    <p class="text-sm text-gray-600 mb-6">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

                    <!-- Resumo -->
                    <div class="mb-8">
                        <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h3 class="text-lg font-semibold text-blue-800">Saldo Atual (Caixa)</h3>
                            <p class="text-3xl font-bold ${saldoTotal >= 0 ? 'text-blue-700' : 'text-red-700'}">R$ ${saldoTotal.toFixed(2).replace(".", ",")}</p>
                        </div>
                    </div>
                    
                    <!-- Dízimos -->
                    <h2>Registos de Dízimos</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Membro</th>
                                <th class="currency-header">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dizimosOrdenados.map(d => `
                                <tr>
                                    <td>${formatarData(d.data)}</td>
                                    <td>${d.membroNome}</td>
                                    <td class="currency entrada">R$ ${(d.valor || 0).toFixed(2).replace(".", ",")}</td>
                                </tr>
                            `).join('')}
                            ${dizimosOrdenados.length === 0 ? '<tr><td colspan="3" class="text-center text-gray-500 py-4">Nenhum dízimo registado.</td></tr>' : ''}
                        </tbody>
                    </table>
                    
                    <!-- Ofertas -->
                    <h2>Registos de Ofertas e Outras Entradas</h2>
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
                            ${ofertasOrdenadas.map(o => `
                                <tr>
                                    <td>${formatarData(o.data)}</td>
                                    <td>${o.tipo}</td>
                                    <td>${o.descricao}</td>
                                    <td class="currency entrada">R$ ${(o.valor || 0).toFixed(2).replace(".", ",")}</td>
                                </tr>
                            `).join('')}
                            ${ofertasOrdenadas.length === 0 ? '<tr><td colspan="4" class="text-center text-gray-500 py-4">Nenhuma oferta registada.</td></tr>' : ''}
                        </tbody>
                    </table>

                    <!-- Extrato Financeiro -->
                    <h2>Extrato Financeiro (Caixa)</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th class="currency-header">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${financOrdenado.map(f => `
                                <tr>
                                    <td>${formatarData(f.data)}</td>
                                    <td>${f.descricao}</td>
                                    <td class="currency ${f.valor > 0 ? 'entrada' : 'saida'}">
                                        R$ ${(f.valor || 0).toFixed(2).replace(".", ",")}
                                    </td>
                                </tr>
                            `).join('')}
                            ${financOrdenado.length === 0 ? '<tr><td colspan="3" class="text-center text-gray-500 py-4">Nenhum lançamento no caixa.</td></tr>' : ''}
                            <!-- Linha de Saldo Total -->
                            <tr class="total bg-gray-50">
                                <td colspan="2" class="text-right font-bold">SALDO TOTAL</td>
                                <td class="currency ${saldoTotal >= 0 ? 'text-blue-700' : 'text-red-700'}">
                                    R$ ${saldoTotal.toFixed(2).replace(".", ",")}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        // 4. Abrir numa nova janela
        const relatorioJanela = window.open("", "_blank");

        // Verificação de bloqueador de pop-up
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
        showToast("Ocorreu um erro inesperado ao gerar o relatório.", "error");
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
const toastContainer = document.getElementById("toast-container");
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
    // Se for um Timestamp do Firebase, converte para Date
    if (dataString && typeof dataString.toDate === 'function') {
        dataString = dataString.toDate();
    }
    // Se for um objeto Date
    else if (dataString instanceof Date) {
         // Não faz nada, já é um Date
    }
    // Se for uma string (ex: '2025-11-01')
    else if (typeof dataString === 'string' && dataString.includes('-')) {
         dataString = getDateFromInput(dataString); // Usa a função robusta
    } 
    // Se for inválido ou nulo
    else {
        return 'N/A'; // Retorna 'N/A' se a data for inválida
    }
    
    try {
        // Formata para dd/mm/aaaa
        return dataString.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        console.warn("Erro ao formatar data:", dataString, e);
        return 'N/A';
    }
}

// Converte string 'aaaa-mm-dd' ou Timestamp para um Date UTC
function getDateFromInput(dataInput) {
    try {
        // Se for um Timestamp do Firebase
        if (dataInput && typeof dataInput.toDate === 'function') {
            return dataInput.toDate(); // Retorna o objeto Date
        }
        // Se já for um objeto Date
        if (dataInput instanceof Date) {
            return dataInput; 
        }
        // Se for uma string (ex: '2025-11-01')
        if (typeof dataInput === 'string' && dataInput.includes('-')) {
            const parts = dataInput.split('-');
            if (parts.length === 3) {
                // Ano, Mês (base 0), Dia
                // Garante que seja UTC para evitar problemas de fuso
                return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            }
        }
    } catch (e) {
        console.error("Data inválida:", dataInput, e);
        return null;
    }
    // Fallback para data inválida ou formato desconhecido
    return null;
}

// Calcula a idade
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return null;
    
    const dataNasc = getDateFromInput(dataNascimento);
    if (!dataNasc) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getUTCFullYear();
    const m = hoje.getMonth() - dataNasc.getUTCMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getUTCDate())) {
        idade--;
    }
    return idade;
}


// Inicializa ícones Lucide
lucide.createIcons();

