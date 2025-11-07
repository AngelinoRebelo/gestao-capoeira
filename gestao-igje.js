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
const totalMembrosDisplay = document.getElementById("total-membros-display"); // [ALTERAÇÃO APLICADA]
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

// [NOVO] Referência para o novo botão
const gerarRelatorioMembrosBtn = document.getElementById("gerar-relatorio-membros-btn");

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

// [NOVO] Relatório Geral de Membros
gerarRelatorioMembrosBtn.addEventListener("click", () => {
    try {
        if (localMembros.length === 0) {
            showToast("Nenhum membro cadastrado para gerar relatório.", "warning");
            return;
        }

        // Os membros em localMembros já estão ordenados por nome (definido no loadAllData)
        
        let relatorioHTML = `
            <html>
            <head>
                <title>Relatório Geral de Membros</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    body { font-family: sans-serif; }
                    h1 { font-size: 24px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; } /* Fonte menor para caber mais info */
                    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
                    th { background-color: #f3f4f6; font-weight: 600; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .total-row { background-color: #f3f4f6; font-weight: bold; font-size: 14px; }
                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="container mx-auto bg-white p-10 rounded shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h1>Relatório Geral de Membros</h1>
                        <button onclick="window.print()" class="no-print bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">Imprimir</button>
                    </div>
                    <p class="text-sm text-gray-600 mb-6">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Idade</th>
                                <th>Função/Ministério</th>
                                <th>Telefone</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${localMembros.map(membro => `
                                <tr>
                                    <td>${membro.nome || ''}</td>
                                    <td>${calcularIdade(membro.dataNascimento) || 'N/A'}</td>
                                    <td>${membro.funcao || ''}</td>
                                    <td>${membro.telefone || ''}</td>
                                    <td>${membro.email || ''}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td colspan="4" class="text-right">Total de Membros:</td>
                                <td class="text-left">${localMembros.length}</td>
                            </tr>
                        </tbody>
                    </table>
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
        console.error("Erro ao gerar relatório de membros:", error);
        showToast("Erro ao gerar relatório de membros.", "error");
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
