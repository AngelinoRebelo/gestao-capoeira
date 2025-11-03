// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// ... (imports)
import {
    getFirestore,
    setDoc,
// ... (imports)
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
// ... (config)
};

// Inicialização do Firebase
let app, auth, db, userId;
try {
    app = initializeApp(firebaseConfig);
// ... (init)
    console.log("Firebase inicializado com sucesso.");
} catch (error)
{
// ... (error)
}

// Variáveis de estado global
let localMembros = [];
let localDizimos = [];
let localOfertas = [];
let localFinanceiro = [];
let unsubMembros, unsubDizimos, unsubOfertas, unsubFinanceiro;

// Objeto para guardar os dados da exclusão
let itemParaExcluir = {
// ... (excluir)
};

// ID do membro a ser editado
let membroParaEditarId = null;


// --- (NOVA SEÇÃO) REFERÊNCIAS DE ELEMENTOS DO DOM ---
// Movi todas as declarações de elementos para o topo para corrigir o ReferenceError
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

// Elementos do formulário de Membros
const formMembro = document.getElementById("form-membro");
const membroSubmitBtn = document.getElementById("membro-submit-btn");
const estadoCivilSelect = document.getElementById("estado-civil");
const conjugeContainer = document.getElementById("conjuge-container");
const listaMembros = document.getElementById("lista-membros");
const filtroMembros = document.getElementById("filtro-membros");

// Elementos do formulário de Dízimos
const formDizimo = document.getElementById("form-dizimo");
const dizimoSubmitBtn = document.getElementById("dizimo-submit-btn");
const dizimoMembroSelect = document.getElementById("dizimo-membro");
const filtroDizimoMes = document.getElementById("filtro-dizimo-mes");
const filtroDizimoAno = document.getElementById("filtro-dizimo-ano");
const listaDizimos = document.getElementById("lista-dizimos");

// Elementos do formulário de Ofertas
const formOferta = document.getElementById("form-oferta");
const ofertaSubmitBtn = document.getElementById("oferta-submit-btn");
const filtroOfertaMes = document.getElementById("filtro-oferta-mes");
const filtroOfertaAno = document.getElementById("filtro-oferta-ano");
const listaOfertas = document.getElementById("lista-ofertas");

// Elementos do formulário Financeiro
const formFinanceiro = document.getElementById("form-financeiro");
const financeiroSubmitBtn = document.getElementById("financeiro-submit-btn");
const listaFinanceiro = document.getElementById("lista-financeiro");
const saldoTotalFinanceiro = document.getElementById("saldo-total-financeiro");
const filtroFinanceiroMes = document.getElementById("filtro-financeiro-mes");
const filtroFinanceiroAno = document.getElementById("filtro-financeiro-ano");

// Elementos do Relatório Mensal
const filtroRelatorioMes = document.getElementById("filtro-relatorio-mes");
const filtroRelatorioAno = document.getElementById("filtro-relatorio-ano");
const relatorioContainer = document.getElementById("relatorio-mensal-container");
const gerarRelatorioMesBtn = document.getElementById("gerar-relatorio-mes-btn");

// Elementos do Dashboard
const saldoDashboard = document.getElementById("saldo-total-dashboard");
const entradasDashboard = document.getElementById("entradas-mes-dashboard");
const saidasDashboard = document.getElementById("saidas-mes-dashboard");
const membrosDashboard = document.getElementById("total-membros-dashboard");
const dashboardLoading = document.getElementById("dashboard-loading");

// Elementos dos Modais de Membro (Detalhes, Edição, Exclusão)
const membroDetalhesModal = document.getElementById("membro-detalhes-modal");
const closeMembroModal = document.getElementById("close-membro-modal");
const membroEditModal = document.getElementById("membro-edit-modal");
const closeMembroEditModal = document.getElementById("close-membro-edit-modal");
const showEditMembroBtn = document.getElementById("show-edit-membro-btn");
const cancelEditMembroBtn = document.getElementById("cancel-edit-membro-btn");
const formEditMembro = document.getElementById("form-edit-membro");
const editMembroError = document.getElementById("edit-membro-error");
const editMembroSubmitBtn = document.getElementById("edit-membro-submit-btn");
const editEstadoCivilSelect = document.getElementById("edit-estado-civil");
const editConjugeContainer = document.getElementById("edit-conjuge-container");
const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const closeDeleteModal = document.getElementById("close-delete-modal");
const deleteConfirmForm = document.getElementById("delete-confirm-form");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const deleteErrorMsg = document.getElementById("delete-error-message");
const deleteCascadeWarning = document.getElementById("delete-cascade-warning");
const showDeleteMembroBtn = document.getElementById("show-delete-membro-btn");
const deleteSubmitBtn = document.getElementById("delete-submit-btn");
const gerarRelatorioBtn = document.getElementById("gerar-relatorio-btn");
const toastContainer = document.getElementById("toast-container");
// --- FIM DAS REFERÊNCIAS DO DOM ---


// --- CONTROLE DE AUTENTICAÇÃO ---

// ... (constantes de auth já definidas acima)

// Abas de Autenticação
loginTabButton.addEventListener("click", () => {
// ... (código)
});

registerTabButton.addEventListener("click", () => {
// ... (código)
});

// Processar Cadastro
registerForm.addEventListener("submit", async (e) => {
// ... (código)
});


// Processar Login
loginForm.addEventListener("submit", async (e) => {
// ... (código)
});

// Processar Logout
logoutButton.addEventListener("click", async () => {
// ... (código)
});

// Observador do estado de autenticação (principal)
onAuthStateChanged(auth, (user) => {
// ... (código)
});

// --- FUNÇÃO AUXILIAR DE REAUTENTICAÇÃO ---

async function reauthenticate(password) {
// ... (código)
}


// --- CONTROLE DE NAVEGAÇÃO POR ABAS (APP) ---

const tabButtons = document.querySelectorAll(".app-tab-button"); // ATUALIZADO
// ... (código)

tabButtons.forEach(button => {
    button.addEventListener("click", () => {
// ... (código)
    });
});

// --- FORMULÁRIO DE MEMBROS (CADASTRO) ---

// ... (constantes já definidas acima)
estadoCivilSelect.addEventListener("change", () => {
// ... (código)
});


formMembro.addEventListener("submit", async (e) => {
// ... (código)
});

// --- FORMULÁRIO DE MEMBROS (EDIÇÃO) ---

// ... (constantes já definidas acima)
editEstadoCivilSelect.addEventListener("change", () => {
// ... (código)
});

formEditMembro.addEventListener("submit", async (e) => {
// ... (código)
});


// --- FORMULÁRIO DE DÍZIMOS ---

// ... (constantes já definidas acima)
formDizimo.addEventListener("submit", async (e) => {
// ... (código)
});

// --- FORMULÁRIO DE OFERTAS / OUTRAS ENTRADAS ---

// ... (constantes já definidas acima)
formOferta.addEventListener("submit", async (e) => {
// ... (código)
});


// --- FORMULÁRIO FINANCEIRO (SAÍDAS) ---

// ... (constantes já definidas acima)
formFinanceiro.addEventListener("submit", async (e) => {
// ... (código)
});


// --- CARREGAMENTO E RENDERIZAÇÃO DE DADOS ---

function loadAllData() { // userId não é mais necessário para os caminhos
// ... (código)
    // Ouvir Membros
    try {
// ... (código)
    } catch (e) { console.error("Erro ao criar query de membros:", e); onDataLoaded(); }

    // Ouvir Dízimos
    try {
// ... (código)
    } catch (e) { console.error("Erro ao criar query de dízimos:", e); onDataLoaded(); }

    // Ouvir Ofertas
    try {
// ... (código)
    } catch (e) { console.error("Erro ao criar query de ofertas:", e); onDataLoaded(); }


    // Ouvir Financeiro
    try {
// ... (código)
    } catch (e) { console.error("Erro ao criar query de financeiro:", e); onDataLoaded(); }

}

// Parar todos os listeners
function stopAllListeners() {
// ... (código)
}

// Limpar tabelas ao deslogar
function clearAllTables() {
// ... (código)
}


// Renderizar Tabela de Membros
// ... (constantes já definidas acima)
filtroMembros.addEventListener("input", (e) => {
// ... (código)
});

function renderMembros(membros) {
// ... (código)
}

// Popular Select de Membros
// ... (constante já definida acima)
function populateMembrosSelect(membros) {
// ... (código)
}

// Renderizar Tabela Financeiro (Extrato)
// ... (constantes já definidas acima)
function renderFinanceiro(transacoes) {
// ... (código)
}

// --- FILTROS E RENDERIZAÇÃO DE DÍZIMOS E OFERTAS ---

// ... (constantes já definidas acima)
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const hoje = new Date();
const mesAtual = hoje.getMonth();
const anoAtual = hoje.getFullYear();

function popularFiltros(selectMes, selectAno) {
// ... (código)
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
// ... (código)
}


function renderFiltroDizimos() {
// ... (código)
}

function renderFiltroOfertas() {
// ... (código)
}


// --- (NOVAS FUNÇÕES) RELATÓRIO FINANCEIRO MENSAL ---

function renderRelatorioMensal() {
// ... (código)
}

// 2. Gera o HTML completo para a janela de impressão
function imprimirRelatorioMensal() {
// ... (código)
}


// --- ATUALIZAÇÃO DO DASHBOARD ---

// ... (constantes já definidas acima)
function updateDashboard() {
// ... (código)
}

// --- CONTROLO DOS MODAIS (JANELAS POP-UP) ---

// Modal Detalhes do Membro
// ... (constantes já definidas acima)
function showMembroDetalhesModal(id) {
// ... (código)
}
closeMembroModal.onclick = () => membroDetalhesModal.style.display = "none";

// Modal Editar Membro
// ... (constantes já definidas acima)
function showMembroEditModal() {
// ... (código)
}

function doCloseMembroEditModal() {
// ... (código)
}

showEditMembroBtn.onclick = showMembroEditModal;
closeMembroEditModal.onclick = doCloseMembroEditModal;
cancelEditMembroBtn.onclick = doCloseMembroEditModal;


// Modal Universal de Exclusão
// ... (constantes já definidas acima)
function showDeleteModal() {
// ... (código)
}

showDeleteMembroBtn.onclick = showDeleteModal;
closeDeleteModal.onclick = () => deleteConfirmModal.style.display = "none";
cancelDeleteBtn.onclick = () => deleteConfirmModal.style.display = "none";

function adicionarListenersExcluir() {
// ... (código)
}

function handleDeleteClick(e) {
// ... (código)
}

// Processar a Exclusão (Formulário do Modal)
deleteConfirmForm.addEventListener("submit", async (e) => {
// ... (código)
});

// Fecha modais se clicar fora do conteúdo
window.onclick = function (event) {
// ... (código)
}

// --- GERAÇÃO DE RELATÓRIO ---

// ... (constante já definida acima)
gerarRelatorioBtn.addEventListener("click", () => {
// ... (código)
});


// --- FUNÇÕES UTILITÁRIAS ---

function toggleButtonLoading(button, isLoading, defaultText) {
// ... (código)
}

// Mostra um toast de notificação
// ... (constante já definida acima)
function showToast(message, type = 'success') {
// ... (código)
}


// Função de formatação de data
function formatarData(dataString) {
// ... (código)
}

// Converte string 'aaaa-mm-dd' ou Timestamp para um Date UTC
function getDateFromInput(dataInput) {
// ... (código)
}

// Calcula a idade
function calcularIdade(dataNascimento) {
// ... (código)
}


// Inicializa ícones Lucide
lucide.createIcons();

