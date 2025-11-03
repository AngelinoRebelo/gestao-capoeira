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
import {
    getStorage,
    ref,
    uploadBytesResumable, 
    uploadBytes, 
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";


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
let app, auth, db, storage, userId; 
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); 
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

let itemParaExcluir = {
    id: null,
    tipo: null 
};

let membroParaEditarId = null;
let fotoParaUpload = null; 
let fotoParaEditar = null; 

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

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerError.textContent = "";
    toggleButtonLoading(registerSubmitBtn, true, "Cadastrar");
    
    const nome = document.getElementById("register-name").value;
    const telefone = document.getElementById("register-phone").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (!nome || !telefone) {
        registerError.textContent = "Nome e Telefone são obrigatórios.";
        toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
        return;
    }

    const nomeLimpo = nome.trim().toLowerCase();
    const telefoneLimpo = telefone.replace(/\D/g, ''); 

    const authorizedUsers = {
        "gabriel angelino": "21964597378",
        "lorrane": "21979626240"
    };

    if (authorizedUsers[nomeLimpo] !== telefoneLimpo) {
         registerError.textContent = "Nome e/ou Telefone não autorizados.";
         toggleButtonLoading(registerSubmitBtn, false, "Cadastrar");
         return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const perfilRef = doc(db, "dadosIgreja/ADCA-CG/perfisUtilizadores", user.uid);
        await setDoc(perfilRef, {
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
        loadAllData(userId); 
        
        document.getElementById("dizimo-data").valueAsDate = new Date();
        document.getElementById("oferta-data").valueAsDate = new Date();
        document.getElementById("fin-data").valueAsDate = new Date();

    } else {
        userId = null;
        authScreen.style.display = "flex";
        appContent.style.display = "none";
        clearAllTables(); 
        stopAllListeners(); 
    }
});

// --- FUNÇÃO AUXILIAR DE REAUTENTICAÇÃO ---

async function reauthenticate(password) {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Usuário inválido ou sem email.");
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
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

const tabButtons = document.querySelectorAll(".app-tab-button"); 
const tabContents = document.querySelectorAll(".tab-content:not(#login-tab):not(#register-tab)");

tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        const targetTab = button.dataset.tab;
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => content.classList.remove("active"));
        button.classList.add("active");
        document.getElementById(targetTab).classList.add("active");

        if (targetTab === 'dashboard') {
            updateDashboard();
        }
        lucide.createIcons();
    });
});

// --- LÓGICA DE UPLOAD DE FOTO (NOVO) ---

const cadastroFotoContainer = document.getElementById("cadastro-foto-container");
const cadastroFotoInput = document.getElementById("cadastro-foto-input");
const cadastroFotoPreview = document.getElementById("cadastro-foto-preview");
const cadastroFotoRemover = document.getElementById("cadastro-foto-remover");
const placeholderFoto = "https://placehold.co/400x400/e2e8f0/cbd5e1?text=Sem+Foto";
const editFotoContainer = document.getElementById("edit-foto-container");
const editFotoInput = document.getElementById("edit-foto-input");
const editFotoPreview = document.getElementById("edit-foto-preview");
const editFotoRemover = document.getElementById("edit-foto-remover");

cadastroFotoContainer.addEventListener("click", () => { cadastroFotoInput.click(); });
editFotoContainer.addEventListener("click", () => { editFotoInput.click(); });
cadastroFotoInput.addEventListener("change", (e) => { handleFotoChange(e, 'cadastro'); });
editFotoInput.addEventListener("change", (e) => { handleFotoChange(e, 'edit'); });
cadastroFotoRemover.addEventListener("click", () => { resetFotoUploader('cadastro'); });
editFotoRemover.addEventListener("click", () => { resetFotoUploader('edit'); });

function handleFotoChange(event, tipo) {
    const file = event.target.files[0];
    if (!file) return;

    if (tipo === 'cadastro') {
        fotoParaUpload = file;
        cadastroFotoPreview.src = URL.createObjectURL(file);
        cadastroFotoRemover.classList.remove("hidden");
    } else {
        fotoParaEditar = file;
        editFotoPreview.src = URL.createObjectURL(file);
        editFotoRemover.classList.remove("hidden");
    }
}

function resetFotoUploader(tipo) {
    if (tipo === 'cadastro') {
        fotoParaUpload = null;
        cadastroFotoInput.value = null; 
        cadastroFotoPreview.src = placeholderFoto;
        cadastroFotoRemover.classList.add("hidden");
    } else {
        fotoParaEditar = null;
        editFotoInput.value = null;
        const membro = localMembros.find(m => m.id === membroParaEditarId);
        editFotoPreview.src = (membro && membro.fotoURL) ? membro.fotoURL : placeholderFoto;
        editFotoRemover.classList.add("hidden");
    }
}


// --- FORMULÁRIO DE MEMBROS (CADASTRO) ---

const formMembro = document.getElementById("form-membro");
const membroSubmitBtn = document.getElementById("membro-submit-btn");
const estadoCivilSelect = document.getElementById("estado-civil");
const conjugeContainer = document.getElementById("conjuge-container");

estadoCivilSelect.addEventListener("change", () => {
    conjugeContainer.classList.toggle("hidden", estadoCivilSelect.value !== 'Casado(a)');
});

formMembro.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!userId) return;

    toggleButtonLoading(membroSubmitBtn, true, "Salvar Membro"); // <-- BOTÃO FICA "AGUARDE..."

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
        fotoURL: "" 
    };

    let novoMembroId = null; // Declarar aqui para ser acessível no catch

    try {
        console.log("Passo 1: A salvar dados do membro no Firestore...");
        const docRef = await addDoc(collection(db, "dadosIgreja/ADCA-CG/membros"), dadosMembro);
        novoMembroId = docRef.id;
        console.log("Passo 2: Membro salvo com ID:", novoMembroId);


        if (fotoParaUpload) {
            console.log("Passo 3: A fazer upload da foto...");
            const fotoRef = ref(storage, `fotosMembros/${novoMembroId}`);
            
            const uploadTask = await uploadBytes(fotoRef, fotoParaUpload);
            console.log("Passo 4: Upload da foto concluído.");
            
            const downloadURL = await getDownloadURL(uploadTask.ref);
            console.log("Passo 5: URL da foto obtido.");
            
            await updateDoc(doc(db, "dadosIgreja/ADCA-CG/membros", novoMembroId), {
                fotoURL: downloadURL
            });
            console.log("Passo 6: Documento do membro atualizado com a fotoURL.");
        }

        formMembro.reset();
        conjugeContainer.classList.add("hidden");
        resetFotoUploader('cadastro');
        showToast("Membro salvo com sucesso!", "success");

    } catch (error) {
        console.error("ERRO CRÍTICO ao salvar membro:", error);
        showToast("Erro ao salvar membro. Verifique a consola.", "error");
        
        // Tenta apagar o membro se a foto falhar, para não deixar órfãos
        if (novoMembroId) {
            console.log("A reverter criação do membro...");
            try {
                await deleteDoc(doc(db, "dadosIgreja/ADCA-CG/membros", novoMembroId));
                console.log("Criação do membro revertida.");
            } catch (deleteError) {
                console.error("ERRO ao reverter criação do membro:", deleteError);
                showToast("Erro crítico. Contacte o suporte.", "error");
            }
        }
    } finally {
        console.log("Passo Final: A redefinir o botão.");
        toggleButtonLoading(membroSubmitBtn, false, "Salvar Membro");
    }
});

// --- FORMULÁRIO DE MEMBROS (EDIÇÃO) ---

const formEditMembro = document.getElementById("form-edit-membro");
const editMembroError = document.getElementById("edit-membro-error");
const editMembroSubmitBtn = document.getElementById("edit-membro-submit-btn");
const editEstadoCivilSelect = document.getElementById("edit-estado-civil");
const editConjugeContainer = document.getElementById("edit-conjuge-container");

editEstadoCivilSelect.addEventListener("change", () => {
    editConjugeContainer.classList.toggle("hidden", editEstadoCivilSelect.value !== 'Casado(a)');
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
        console.log("Passo 1 (Edição): A reautenticar...");
        await reauthenticate(password);
        console.log("Passo 2 (Edição): Reautenticado.");
    } catch (error) {
        editMembroError.textContent = error.message;
        toggleButtonLoading(editMembroSubmitBtn, false, "Salvar Alterações");
        return;
    }
    
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
        const docRef = doc(db, "dadosIgreja/ADCA-CG/membros", membroParaEditarId);

        if (fotoParaEditar) {
            console.log("Passo 3 (Edição): A fazer upload da nova foto...");
            const fotoRef = ref(storage, `fotosMembros/${membroParaEditarId}`);
            const uploadTask = await uploadBytes(fotoRef, fotoParaEditar);
            console.log("Passo 4 (Edição): Upload concluído.");
            dadosAtualizados.fotoURL = await getDownloadURL(uploadTask.ref);
            console.log("Passo 5 (Edição): URL da foto obtido.");
        
        } else if (editFotoPreview.src.includes('placehold.co')) {
            dadosAtualizados.fotoURL = ""; 
            console.log("Passo 3 (Edição): A remover foto...");
            try {
                const fotoRef = ref(storage, `fotosMembros/${membroParaEditarId}`);
                await deleteObject(fotoRef);
                console.log("Passo 4 (Edição): Foto antiga removida do storage.");
            } catch (error) {
                if (error.code !== 'storage/object-not-found') {
                    console.warn("Erro ao apagar foto antiga:", error);
                }
            }
        }

        console.log("Passo 6 (Edição): A atualizar documento no Firestore...");
        await updateDoc(docRef, dadosAtualizados);
        console.log("Passo 7 (Edição): Documento atualizado.");
        
        doCloseMembroEditModal(); 
        showToast("Membro atualizado com sucesso!", "success");
    
    } catch (error) {
         console.error("Erro ao atualizar membro:", error);
         editMembroError.textContent = "Erro ao salvar os dados.";
    } finally {
        console.log("Passo Final (Edição): A redefinir o botão.");
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
        const dizimoDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/dizimos"));
        const financeiroDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/financeiro"));

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
        const ofertaDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/ofertas"));
        const financeiroDocRef = doc(collection(db, "dadosIgreja/ADCA-CG/financeiro"));

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
        const colRef = collection(db, "dadosIgreja/ADCA-CG/financeiro");
        await addDoc(colRef, {
            tipo: "saida",
            descricao: descricao,
            valor: valor * -1,
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

function loadAllData(currentUserId) {
    if (!currentUserId) return;
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
        }
    };

    const dbPath = "dadosIgreja/ADCA-CG"; 

    try {
        const qMembros = query(collection(db, dbPath, "membros"));
        unsubMembros = onSnapshot(qMembros, (snapshot) => {
            localMembros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localMembros.sort((a, b) => a.nome.localeCompare(b.nome));
            renderMembros(localMembros);
            populateMembrosSelect(localMembros);
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir membros:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de membros:", e); onDataLoaded(); }

    try {
        const qDizimos = query(collection(db, dbPath, "dizimos"));
        unsubDizimos = onSnapshot(qDizimos, (snapshot) => {
            localDizimos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroDizimos();
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir dízimos:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de dízimos:", e); onDataLoaded(); }

    try {
        const qOfertas = query(collection(db, dbPath, "ofertas"));
        unsubOfertas = onSnapshot(qOfertas, (snapshot) => {
            localOfertas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroOfertas();
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir ofertas:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de ofertas:", e); onDataLoaded(); }

    try {
        const qFinanceiro = query(collection(db, dbPath, "financeiro"));
        unsubFinanceiro = onSnapshot(qFinanceiro, (snapshot) => {
            localFinanceiro = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFiltroFinanceiro();
            onDataLoaded();
        }, (error) => { console.error("Erro ao ouvir financeiro:", error.message); onDataLoaded(); });
    } catch (e) { console.error("Erro ao criar query de financeiro:", e); onDataLoaded(); }
}

// --- FUNÇÕES stopAllListeners e clearAllTables ---
function stopAllListeners() {
    if (unsubMembros) unsubMembros();
    if (unsubDizimos) unsubDizimos();
    if (unsubOfertas) unsubOfertas();
    if (unsubFinanceiro) unsubFinanceiro();
    console.log("Listeners interrompidos.");
}

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
}
// --- FIM stopAllListeners e clearAllTables ---


// Renderizar Tabela de Membros
const listaMembros = document.getElementById("lista-membros");
const filtroMembros = document.getElementById("filtro-membros");

filtroMembros.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    const membrosFiltrados = localMembros.filter(m => m.nome.toLowerCase().includes(termo));
    renderMembros(membrosFiltrados);
});

function renderMembros(membros) {
    listaMembros.innerHTML = "";
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
    adicionarListenersExcluir();
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

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const hoje = new Date();
const mesAtual = hoje.getMonth();
const anoAtual = hoje.getFullYear();

function popularFiltros(selectMes, selectAno) {
    selectMes.innerHTML = "";
    meses.forEach((mes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = mes;
        if (index === mesAtual) option.selected = true;
        selectMes.appendChild(option);
    });
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
        if (!data) return false;
        return data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    });
    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1; if (!dataB) return -1;
        return dataB - dataA;
    });
    renderFinanceiro(dadosFiltrados);
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
        if (!data) return false;
        return data.getUTCMonth() === mes && data.getUTCFullYear() === ano;
    });
    dadosFiltrados.sort((a, b) => {
        const dataA = getDateFromInput(a.data);
        const dataB = getDateFromInput(b.data);
        if (!dataA) return 1; if (!dataB) return -1;
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
        if (!dataA) return 1; if (!dataB) return -1;
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
    adicionarListenersExcluir();
    lucide.createIcons();
}


// --- ATUALIZAÇÃO DO DASHBOARD ---

const saldoDashboard = document.getElementById("saldo-total-dashboard");
const entradasDashboard = document.getElementById("entradas-mes-dashboard");
const saidasDashboard = document.getElementById("saidas-mes-dashboard");
const membrosDashboard = document.getElementById("total-membros-dashboard");
const dashboardLoading = document.getElementById("dashboard-loading");

function updateDashboard() {
    if (!localFinanceiro || !localMembros) return;

    const saldoTotal = localFinanceiro.reduce((acc, transacao) => acc + transacao.valor, 0);
    const corSaldo = saldoTotal >= 0 ? "text-blue-700" : "text-red-700";
    saldoDashboard.className = `text-3xl font-bold ${corSaldo} mt-1`;
    saldoDashboard.textContent = `R$ ${saldoTotal.toFixed(2).replace(".", ",")}`;
    membrosDashboard.textContent = localMembros.length;
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
        .reduce((acc, t) => acc + t.valor, 0);
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

    document.getElementById("modal-foto").src = membro.fotoURL || placeholderFoto;
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
    
    membroParaEditarId = id;
    itemParaExcluir.id = id;
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

    resetFotoUploader('edit'); 
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
    
    editConjugeContainer.classList.toggle("hidden", document.getElementById("edit-estado-civil").value !== 'Casado(a)');

    document.getElementById("edit-profissao").value = membro.profissao || '';
    document.getElementById("edit-escolaridade").value = membro.escolaridade || '';
    document.getElementById("edit-funcao").value = membro.funcao || '';
    document.getElementById("edit-data-batismo").value = membro.dataBatismo || '';
    document.getElementById("edit-data-chegada").value = membro.dataChegada || '';
    document.getElementById("edit-igreja-anterior").value = membro.igrejaAnterior || '';
    document.getElementById("edit-cargo-anterior").value = membro.cargoAnterior || '';
    
    document.getElementById("edit-membro-password").value = "";
    document.getElementById("edit-membro-error").textContent = "";

    membroDetalhesModal.style.display = "none";
    membroEditModal.style.display = "block";
}

function doCloseMembroEditModal() {
     membroEditModal.style.display = "none";
     membroParaEditarId = null;
     resetFotoUploader('edit'); 
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
    deleteErrorMsg.textContent = "";
    deleteCascadeWarning.textContent = "";
    document.getElementById("delete-password").value = "";

    if (itemParaExcluir.tipo === 'financeiro') {
        const fin = localFinanceiro.find(f => f.id === itemParaExcluir.id);
        if (fin && fin.origemId) {
            deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o Dízimo ou Oferta original.";
        }
    } else if (itemParaExcluir.tipo === 'dizimo' || itemParaExcluir.tipo === 'oferta') {
        deleteCascadeWarning.textContent = "Aviso: Isto também excluirá o lançamento no Caixa associado.";
    } else if (itemParaExcluir.tipo === 'membro') {
        deleteCascadeWarning.textContent = "Aviso: A foto do membro também será apagada.";
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
        deleteErrorMsg.textContent = error.message;
        toggleButtonLoading(deleteSubmitBtn, false, "Excluir Permanentemente");
        return;
    }

    // 2. Executar a Exclusão
    try {
        const batch = writeBatch(db);
        const dbPath = "dadosIgreja/ADCA-CG";
        
        if (itemParaExcluir.tipo === 'financeiro') {
            const finDocRef = doc(db, dbPath, "financeiro", itemParaExcluir.id);
            const finData = localFinanceiro.find(f => f.id === itemParaExcluir.id);
            batch.delete(finDocRef);
            if (finData && finData.origemId && finData.origemTipo) {
                 const origemCol = finData.origemTipo === 'dizimo' ? 'dizimos' : 'ofertas';
                 const origemDocRef = doc(db, dbPath, origemCol, finData.origemId);
                 batch.delete(origemDocRef);
            }
        
        } else if (itemParaExcluir.tipo === 'dizimo') {
            const dizimoDocRef = doc(db, dbPath, "dizimos", itemParaExcluir.id);
            const dizimoData = localDizimos.find(d => d.id === itemParaExcluir.id);
            batch.delete(dizimoDocRef);
            if (dizimoData && dizimoData.financeiroId) {
                const finDocRef = doc(db, dbPath, "financeiro", dizimoData.financeiroId);
                batch.delete(finDocRef);
            }

        } else if (itemParaExcluir.tipo === 'oferta') {
            const ofertaDocRef = doc(db, dbPath, "ofertas", itemParaExcluir.id);
            const ofertaData = localOfertas.find(o => o.id === itemParaExcluir.id);
            batch.delete(ofertaDocRef);
            if (ofertaData && ofertaData.financeiroId) {
                const finDocRef = doc(db, dbPath, "financeiro", ofertaData.financeiroId);
                batch.delete(finDocRef);
            }
            
        } else if (itemParaExcluir.tipo === 'membro') {
            const membroDocRef = doc(db, dbPath, "membros", itemParaExcluir.id);
            const membroData = localMembros.find(m => m.id === itemParaExcluir.id);
            
            batch.delete(membroDocRef);
            
            if (membroData && membroData.fotoURL && membroData.fotoURL.includes("firebase")) {
                 try {
                    const fotoRef = ref(storage, `fotosMembros/${itemParaExcluir.id}`);
                    await deleteObject(fotoRef);
                 } catch (error) {
                    if (error.code !== 'storage/object-not-found') {
                         console.warn("Erro ao apagar foto do membro:", error);
                    }
                 }
            }
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

// --- GERAÇÃO DE RELATÓRIO ---

const gerarRelatorioBtn = document.getElementById("gerar-relatorio-btn");

gerarRelatorioBtn.addEventListener("click", () => {
    try {
        const saldoTotal = localFinanceiro.reduce((acc, t) => acc + t.valor, 0);
        
        const financOrdenado = [...localFinanceiro].sort((a, b) => {
            const dataA = getDateFromInput(a.data); const dataB = getDateFromInput(b.data);
            if (!dataA) return 1; if (!dataB) return -1; return dataA - dataB;
        });
        const dizimosOrdenados = [...localDizimos].sort((a, b) => {
            const dataA = getDateFromInput(a.data); const dataB = getDateFromInput(b.data);
            if (!dataA) return 1; if (!dataB) return -1; return dataA - dataB;
        });
        const ofertasOrdenadas = [...localOfertas].sort((a, b) => {
            const dataA = getDateFromInput(a.data); const dataB = getDateFromInput(b.data);
            if (!dataA) return 1; if (!dataB) return -1; return dataA - dataB;
        });

        const formatCurrency = (value) => {
             const num = parseFloat(value);
             if (isNaN(num)) {
                 return "0,00";
             }
             return num.toFixed(2).replace(".", ",");
        };

        let relatorioHTML = `
            <html>
            <head>
                <title>Relatório GESTÃO ADCA - CAPOEIRA GRANDE</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }
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
                        <h1>Relatório GESTÃO ADCA - CAPOEIRA GRANDE</h1>
                        <button onclick="window.print()" class="no-print bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">Imprimir</button>
                    </div>
                    <p class="text-sm text-gray-600 mb-6">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    <div class="mb-8">
                        <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                            <h3 class="text-lg font-semibold text-blue-800">Saldo Atual (Caixa)</h3>
                            <p class="text-3xl font-bold ${saldoTotal >= 0 ? 'text-blue-700' : 'text-red-700'}">R$ ${formatCurrency(saldoTotal)}</p>
                        </div>
                    </div>
                    <h2>Registos de Dízimos</h2>
                    <table>
                        <thead> <tr> <th>Data</th> <th>Membro</th> <th class="currency-header">Valor (R$)</th> </tr> </thead>
                        <tbody>
                            ${dizimosOrdenados.map(d => `
                                <tr>
                                    <td>${formatarData(d.data)}</td>
                                    <td>${d.membroNome}</td>
                                    <td class="currency entrada">R$ ${formatCurrency(d.valor)}</td>
                                </tr>
                            `).join('')}
                            ${dizimosOrdenados.length === 0 ? '<tr><td colspan="3" class="text-center text-gray-500 py-4">Nenhum dízimo registado.</td></tr>' : ''}
                        </tbody>
                    </table>
                    <h2>Registos de Ofertas e Outras Entradas</h2>
                    <table>
                        <thead> <tr> <th>Data</th> <th>Tipo</th> <th>Descrição</th> <th class="currency-header">Valor (R$)</th> </tr> </thead>
                        <tbody>
                            ${ofertasOrdenadas.map(o => `
                                <tr>
                                    <td>${formatarData(o.data)}</td>
                                    <td>${o.tipo}</td>
                                    <td>${o.descricao}</td>
                                    <td class="currency entrada">R$ ${formatCurrency(o.valor)}</td>
                                </tr>
                            `).join('')}
                            ${ofertasOrdenadas.length === 0 ? '<tr><td colspan="4" class="text-center text-gray-500 py-4">Nenhuma oferta registada.</td></tr>' : ''}
                        </tbody>
                    </table>
                    <h2>Extrato Financeiro (Caixa)</h2>
                    <table>
                        <thead> <tr> <th>Data</th> <th>Descrição</th> <th class="currency-header">Valor (R$)</th> </tr> </thead>
                        <tbody>
                            ${financOrdenado.map(f => `
                                <tr>
                                    <td>${formatarData(f.data)}</td>
                                    <td>${f.descricao}</td>
                                    <td class="currency ${f.valor > 0 ? 'entrada' : 'saida'}">
                                        R$ ${formatCurrency(f.valor)}
                                    </td>
                                </tr>
                            `).join('')}
                            ${financOrdenado.length === 0 ? '<tr><td colspan="3" class="text-center text-gray-500 py-4">Nenhum lançamento no caixa.</td></tr>' : ''}
                            <tr class="total bg-gray-50">
                                <td colspan="2" class="text-right font-bold">SALDO TOTAL</td>
                                <td class="currency ${saldoTotal >= 0 ? 'text-blue-700' : 'text-red-700'}">
                                    R$ ${formatCurrency(saldoTotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        const relatorioJanela = window.open("", "_blank");
        if (!relatorioJanela || relatorioJanela.closed || typeof relatorioJanela.closed == 'undefined') {
            console.error("Falha ao abrir janela de relatório. Provável bloqueador de pop-up.");
            showToast("Falha ao abrir relatório. Desative o bloqueador de pop-ups.", "error");
            return;
        }
        relatorioJanela.document.write(relatorioHTML);
        relatorioJanela.document.close();
    } catch (error) {
        console.error("Erro CRÍTICO ao gerar relatório:", error);
        showToast("Erro inesperado ao gerar relatório. Verifique a consola.", "error");
    }
});


// --- FUNÇÕES UTILITÁRIAS ---

function toggleButtonLoading(button, isLoading, defaultText) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span>Aguarde...`;
    } else {
        button.disabled = false;
        button.innerHTML = defaultText;
    }
}

const toastContainer = document.getElementById("toast-container");
function showToast(message, type = 'success') {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease-out forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function formatarData(dataString) {
    if (dataString && typeof dataString.toDate === 'function') {
        dataString = dataString.toDate();
    }
    else if (dataString instanceof Date) {
         // Já é Date
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

// NOVA FUNÇÃO para calcular idade
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return null;
    
    const dataNasc = getDateFromInput(dataNascimento);
    if (!dataNasc) return null;

    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const m = hoje.getMonth() - dataNasc.getUTCMonth(); // Usa UTCMonth
    
    if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getUTCDate())) { // Usa UTCDate
        idade--;
    }
    return idade;
}


// Inicializa ícones Lucide
lucide.createIcons();

