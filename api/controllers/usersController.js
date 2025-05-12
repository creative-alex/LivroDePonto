const admin = require("firebase-admin");
const path = require("path");
const db = admin.firestore();

const createUser = async (req, res) => {
  try {
    const { nome, email, entidade, role } = req.body;

    // Validação básica
    if (!nome || !email || !entidade) {
      return res.status(400).json({ error: 'Nome, email e entidade são obrigatórios' });
    }

    // Gerar ID único
    let baseUserId = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    let userId = baseUserId;
    let counter = 1;

    // Verificar colisões no Firestore
    let userDocRef = db.collection('users').doc(userId);
    let docSnapshot = await userDocRef.get();

    while (docSnapshot.exists) {
      userId = `${baseUserId}-${String(++counter).padStart(2, '0')}`;
      userDocRef = db.collection('users').doc(userId);
      docSnapshot = await userDocRef.get();
    }

    // 1. Criar usuário no Firebase Authentication primeiro
    const temporaryPassword = generateSecurePassword(); // Implemente esta função
    let authUser;
    try {
      authUser = await admin.auth().createUser({
        uid: userId, // Usar o mesmo ID do Firestore como UID
        email,
        password: temporaryPassword,
        displayName: nome
      });
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Email já está em uso' });
      }
      throw authError;
    }

    // 2. Só então criar no Firestore
    try {
      const entityRef = `entidades/${entidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;
      
      await userDocRef.set({
        nome,
        email,
        entidade: entityRef,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: role?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') || 'user',
        isFirstLogin: true
      });

      // 3. Opcional: Enviar email de redefinição de senha
      // await sendPasswordResetEmail(email); 

      return res.status(201).json({ 
        message: 'Usuário criado com sucesso',
        id: userId,
        temporaryPassword: temporaryPassword // Remover em produção!
      });

    } catch (firestoreError) {
      // Rollback: Apagar usuário do Auth se o Firestore falhar
      await admin.auth().deleteUser(userId);
      throw firestoreError;
    }

  } catch (error) {
    console.error('Erro no processo completo:', error);
    return res.status(500).json({ error: 'Falha na criação do usuário' });
  }
};
const verifyToken = async (req, res) => {
  try {

    const { token } = req.body;
    if (!token) {
      console.log('Erro: Token não fornecido.');
      return res.status(400).json({ message: 'Token não fornecido' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    res.json({
      message: 'Token válido',
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: userRecord.displayName // Adiciona o nome do user na resposta
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};
const getUserInfo = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const querySnapshot = await db.collection('users').where('email', '==', email).get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'user não encontrado' });
    }

    const userData = querySnapshot.docs[0].data();
    const isSuperAdmin = userData.role === "SuperAdmin";

    res.json({
      role: userData.role || 'user',
      nome: userData.nome || 'N/A',
      isFirstLogin: isSuperAdmin ? false : (userData.isFirstLogin ?? true), // SuperAdmins nunca veem a tela de primeiro login
    });
  } catch (error) {
    console.error('Erro ao buscar user:', error.message);
    res.status(500).json({ message: 'Erro ao buscar user' });
  }
};
const updateFirstLogin = async (req, res) => {
  try {
    console.log("Requisição recebida para updateFirstLogin");

    const { userEmail, newPassword } = req.body;
    console.log("Dados recebidos no body:", { userEmail, newPassword });

    if (!userEmail || !newPassword) {
      console.log("Erro: Email ou senha não foram fornecidos");
      return res.status(400).json({ message: "Email e nova senha são obrigatórios" });
    }

    // Buscar o user no Firebase Authentication
    console.log("Buscando user no Firebase Authentication:", userEmail);
    const userRecord = await admin.auth().getUserByEmail(userEmail);

    if (!userRecord) {
      console.log("user não encontrado no Firebase Authentication");
      return res.status(404).json({ message: "user não encontrado" });
    }

    console.log("user encontrado:", userRecord.uid);

    // Atualizar senha no Firebase Authentication
    console.log("Atualizando senha para o user:", userRecord.uid);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });
    console.log("Senha atualizada com sucesso");

    // Atualizar isFirstLogin no Firestore
    console.log("Buscando user no Firestore pelo email:", userEmail);
    const userQuery = await db.collection("users").where("email", "==", userEmail).get();

    if (!userQuery.empty) {
      const userId = userQuery.docs[0].id;
      console.log("user encontrado no Firestore com ID:", userId);

      console.log("Atualizando isFirstLogin para false no Firestore");
      await db.collection("users").doc(userId).update({
        isFirstLogin: false,
      });
      console.log("isFirstLogin atualizado com sucesso");
    } else {
      console.log("user não encontrado no Firestore");
    }

    console.log("Processo concluído com sucesso");
    res.json({ message: "Senha alterada com sucesso e primeiro login concluído" });
  } catch (error) {
    console.error("Erro ao atualizar primeiro login:", error);
    res.status(500).json({ message: "Erro ao atualizar primeiro login" });
  }
};
const userDetails = async (req, res) => {
  try {
    const { userName } = req.body;
    console.log("Recebido userID:", userName); // Log do ID recebido

    if (!userName) {
      console.warn("⚠️ userID não encontrado no corpo da requisição.");
      return res.status(400).json({ error: "O campo userID é obrigatório." });
    }

    // Buscar user no Firestore pelo ID
    console.log("Buscando usuário no Firestore pelo ID:", userName);
    const userDoc = await db.collection("users").doc(userName).get();

    if (!userDoc.exists) {
      console.warn("⚠️ User não encontrado no Firestore.");
      return res.status(404).json({ error: "User não encontrado." });
    }

    const userData = userDoc.data();
    console.log("Dados do user encontrados:", userData);

    // Buscar entidade relacionada
    let entidadeNome = "Desconhecida";
    console.log("Verificando entidade para o user:", userData.entidade);

    if (userData.entidade && typeof userData.entidade === "string") {
      const entidadeParts = userData.entidade.split("/");

      if (entidadeParts.length === 2 && entidadeParts[0] === "entidades") {
        const entidadeId = entidadeParts[1];
        console.log("Buscando entidade com ID:", entidadeId);

        try {
          const entidadeRef = await db.collection("entidades").doc(entidadeId).get();
          if (entidadeRef.exists) {
            entidadeNome = entidadeRef.data().nome || "Desconhecida";
            console.log("Entidade encontrada:", entidadeNome);
          } else {
            console.warn("⚠️ Entidade não encontrada.");
          }
        } catch (err) {
          console.error("⚠️ Erro ao buscar entidade:", err);
        }
      }
    }

    // Montar objeto de resposta
    const userDetails = {
      email: userData.email || "N/A",
      entidade: entidadeNome,
      nome: userData.nome || "N/A",
      role: userData.role || "N/A",
    };

    console.log("Detalhes do usuário montados:", userDetails);
    res.json(userDetails);
  } catch (error) {
    console.error("🚨 Erro ao buscar detalhes do user:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes do user." });
  }
};
const registerEntry = async (req, res) => {
  try {
    const { time, username } = req.body;

    if (!time || !username) {
      console.log("Erro: Campos obrigatórios ausentes.");
      return res.status(400).json({ error: "Faltam campos obrigatórios: entryTime e/ou nome" });
    }

    // Gerando o userId no formato correto
    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-");

    // Adicionar o prefixo apenas se o userId não começar com "user_"
    if (!userId.startsWith("user_")) {
      userId = `user_${userId}`;
    }

    console.log("Registrando entrada para o user:", userId);

    // Referência ao documento do user dentro da coleção "registro-ponto"
    const userDocRef = db.collection("registro-ponto").doc(userId);

    // Criando um ID único para o registro baseado na data no formato DDMMYYYY
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const registroId = `registro_${dd}${mm}${yyyy}`;

    console.log("Gerado registroId:", registroId);

    // Criando um novo documento dentro da subcoleção "Registros"
    await userDocRef.collection("Registros").doc(registroId).set({
      horaEntrada: time,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Entrada registrada com sucesso no Firestore.");
    return res.status(201).json({ message: "Entrada registrada com sucesso", registroId });
  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    return res.status(500).json({ error: error.message });
  }
};
const checkEntry = async (req, res) => {
  try {
    console.log("checkEntry foi chamado");
    const { username } = req.body;
    console.log("Username recebido:", username);

    if (!username) {
      console.log("Erro: Nome de user ausente.");
      return res.status(400).json({ error: "Faltam campos obrigatórios: nome" });
    }

    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-");

    console.log("userId formatado:", userId);

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    const startOfDay = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const endOfDay = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`);

    const registrosRef = db
      .collection("registro-ponto")
      .doc(`user_${userId}`)
      .collection("Registros");

    const snapshot = await registrosRef
      .where("timestamp", ">=", startOfDay)
      .where("timestamp", "<=", endOfDay)
      .orderBy("timestamp", "asc") // Entrada é normalmente o primeiro do dia
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("Nenhum registro encontrado para hoje.");
      return res.status(200).json({ hasEntry: false });
    }

    const data = snapshot.docs[0].data();
    console.log("Dados encontrados:", data);

    if (data.horaEntrada) {
      console.log("horaEntrada existente:", data.horaEntrada);
      return res.status(200).json({ hasEntry: true });
    }

    console.log("horaEntrada ausente.");
    return res.status(200).json({ hasEntry: false });
  } catch (error) {
    console.error("Erro ao verificar entrada:", error);
    return res.status(500).json({ error: error.message });
  }
};

const registerLeave = async (req, res) => {
  try {

    const { time, username } = req.body;

    if (!time || !username) {
      console.log("Erro: Campos obrigatórios ausentes.");
      return res.status(400).json({ error: "Campos exitTime e nome são obrigatórios" });
    }

    // Gerando o userId no formato correto
    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    console.log("Buscando documento de entrada no Firestore...");

    // Referência à subcoleção "Registros" do user
    const registrosRef = db.collection("registro-ponto").doc(`user_${userId}`).collection("Registros");

    // Procurar o registro mais recente do dia atual
    const snapshot = await registrosRef
      .where("timestamp", ">=", new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`))
      .where("timestamp", "<=", new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`))
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("Erro: Nenhum registro de entrada encontrado para hoje.");
      return res.status(404).json({ error: "Nenhum registro de entrada encontrado para hoje" });
    }

    // Pega o primeiro documento encontrado
    const registroDoc = snapshot.docs[0];
    const registroId = registroDoc.id;

    console.log(`Atualizando registro ${registroId} com hora de saída...`);

    // Atualizando o campo `horaSaida`
    await registrosRef.doc(registroId).update({
      horaSaida: time,
    });

    console.log("Saída registrada com sucesso no Firestore.");

    return res.status(200).json({ message: "Saída registrada com sucesso", registroId });
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    return res.status(500).json({ error: error.message });
  }
};
const checkLeave = async (req, res) => {
  try {

    const { username } = req.body;

    if (!username) {
      console.log("Erro: Nome de user ausente.");
      return res.status(400).json({ error: "Faltam campos obrigatórios: nome" });
    }

    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-");

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();


    const registrosRef = db.collection("registro-ponto").doc(`user_${userId}`).collection("Registros");
    
    const snapshot = await registrosRef
      .where("timestamp", ">=", new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`))
      .where("timestamp", "<=", new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`))
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();
    
    if (snapshot.empty || !snapshot.docs[0].data().horaSaida) {
      return res.status(200).json({ hasLeave: false });
    }
    
    return res.status(200).json({ hasLeave: true });
  } catch (error) {
    console.error("Erro ao verificar saída:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getUserRecords = async (req, res) => {
  try {
    console.log("✅ Iniciando getUserRecords...");
    console.log("📥 Dados recebidos no body:", req.body);

    const { username, month } = req.body;

    if (!username || !month) {
      console.log("❌ Erro: Nome de user e mês são obrigatórios.");
      return res.status(400).json({ error: "O nome de user e o mês são obrigatórios" });
    }

    const userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-");

    console.log("🆔 userId formatado:", userId);

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const now = new Date();
    const year = now.getFullYear();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 1, 23, 59, 59);

    console.log("📅 Período definido:");
    console.log("➡️ Primeiro dia:", firstDay);
    console.log("➡️ Último dia:", lastDay);

    // ========== [1] GERAR LISTA DE DATAS DO MÊS ==========
    const listaDeDatas = [];
    let tempDate = new Date(firstDay);
    while (tempDate <= lastDay) {
      const dd = String(tempDate.getDate()).padStart(2, "0");
      const mm = String(tempDate.getMonth() + 1).padStart(2, "0");
      const yyyy = tempDate.getFullYear();
      listaDeDatas.push(`${dd}-${mm}-${yyyy}`);
      tempDate.setDate(tempDate.getDate() + 1);
    }

    console.log("📅 Lista de datas geradas:", listaDeDatas);

    // ========== [2] BUSCAR REGISTROS DE PONTO ==========
    const registrosRef = db
      .collection("registro-ponto")
      .doc(`user_${userId}`)
      .collection("Registros");

    console.log("🔍 Consultando registros de ponto...");

    const snapshot = await registrosRef
      .where("timestamp", ">=", firstDay)
      .where("timestamp", "<=", lastDay)
      .orderBy("timestamp", "asc")
      .get();

    console.log("📊 Snapshot de registros retornado:");
    console.log("➡️ Quantidade de registros encontrados:", snapshot.size);

    // ========== [3] BUSCAR FÉRIAS ==========
    const feriasRef = db
      .collection("registro-ponto")
      .doc(`user_${userId}`)
      .collection("Ferias");

    let feriasDates = [];
    console.log("🌴 Consultando férias em lotes de 30...");

    for (let i = 0; i < listaDeDatas.length; i += 30) {
      const batch = listaDeDatas.slice(i, i + 30);
      const feriasSnapshot = await feriasRef.where("date", "in", batch).get();
      feriasDates.push(...feriasSnapshot.docs.map((doc) => doc.data().date));
    }

    console.log("🌴 Lista final de datas de férias:", feriasDates);

    // ========== [4] BUSCAR BAIXAS MÉDICAS ==========
    const baixasRef = db
      .collection("registro-ponto")
      .doc(`user_${userId}`)
      .collection("BaixasMedicas");

    let baixasDates = [];
    console.log("🩺 Consultando baixas médicas em lotes de 30...");

    for (let i = 0; i < listaDeDatas.length; i += 30) {
      const batch = listaDeDatas.slice(i, i + 30);
      const baixasSnapshot = await baixasRef.where("date", "in", batch).get();
      baixasDates.push(...baixasSnapshot.docs.map((doc) => doc.data().date));
    }

    console.log("🩺 Lista final de datas de baixas médicas:", baixasDates);

    // ========== [5] MONTAR RESULTADO FINAL ==========
    const registrosPorDia = listaDeDatas.map((dataStr) => {
      // Verificar se existe registro de ponto para esta data
      const registroPonto = snapshot.docs.find(doc => {
        const dataDoc = doc.data().timestamp.toDate();
        const dd = String(dataDoc.getDate()).padStart(2, "0");
        const mm = String(dataDoc.getMonth() + 1).padStart(2, "0");
        const yyyy = dataDoc.getFullYear();
        return `${dd}-${mm}-${yyyy}` === dataStr;
      });

      // Determinar status
      let status = "Sem registro";
      if (feriasDates.includes(dataStr)) {
        status = "Férias";
      } else if (baixasDates.includes(dataStr)) {
        status = "Baixa Médica";
      } else if (registroPonto) {
        status = "Trabalho";
      }

      // Extrair horários se existir registro
      const horaEntrada = registroPonto ? registroPonto.data().horaEntrada || "-" : "-";
      const horaSaida = registroPonto ? registroPonto.data().horaSaida || "-" : "-";

      return {
        data: dataStr,
        horaEntrada,
        horaSaida,
        status
      };
    });

    console.log("✅ Registros finais:", registrosPorDia);

    return res.status(200).json({ 
      registros: registrosPorDia,
      ferias: feriasDates,
      baixas: baixasDates 
    });

  } catch (error) {
    console.error("❌ Erro ao buscar registros de user:", error);
    return res.status(500).json({ error: error.message });
  }
};

const updateUserTime = async (req, res) => {
  try {

    const { username, date, campo, valor } = req.body;

    if (!username || !date || !campo || !valor) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Gerando o userId corretamente
    let userId = `user_${username.replace(/\s+/g, "-").toLowerCase()}`;

    // Validando e convertendo a data
    const dateParts = date.split("-");
    if (dateParts.length !== 2) {
      console.log("Erro: Formato de data inválido.", date);
      return res.status(400).json({ error: "Formato de data inválido. Use DD-MM" });
    }

    const [day, month] = dateParts.map(Number);
    const year = new Date().getFullYear(); // Assume o ano atual
    
    if (isNaN(day) || isNaN(month)) {
      console.log("Erro: Data contém valores inválidos.", date);
      return res.status(400).json({ error: "Data inválida fornecida" });
    }

    // Criar timestamp com a hora fornecida
    let [hour, minute] = valor.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) {
      console.log("Erro: Horário inválido.", valor);
      return res.status(400).json({ error: "Horário inválido fornecido" });
    }

    const dataRegistro = new Date(year, month - 1, day, hour, minute);
    if (isNaN(dataRegistro.getTime())) {
      console.log("Erro: Data gerada inválida.", dataRegistro);
      return res.status(400).json({ error: "Data inválida gerada" });
    }

    console.log("Data processada com horário:", dataRegistro.toISOString());

    // Cria um ID baseado na data no formato correto
    const registroId = `registro_${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;

    // Referência ao documento no Firestore
    const registroRef = db
      .collection("registro-ponto")
      .doc(userId)
      .collection("Registros")
      .doc(registroId);

    // Verificar se o documento já existe
    const docSnapshot = await registroRef.get();
    if (!docSnapshot.exists) {
      console.log("Registro não encontrado. Criando novo documento...");
    }

    // Atualizar ou criar o documento
    const updateData = { timestamp: dataRegistro };
    updateData[campo] = valor;
    await registroRef.set(updateData, { merge: true });

    return res.status(200).json({ message: "Horário atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar horário do user:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getUsersByEntity = async (req, res) => {
  try {

    const { entidadeNome } = req.body;

    if (!entidadeNome) {
      console.log("Erro: entidadeNome não foi enviado");
      return res.status(400).json({ error: "O campo entidadeNome é obrigatório." });
    }

    // Aplicar a lógica de normalização para obter o entidadeId
    const entidadeId = entidadeNome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");


    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("entidade", "==", `entidades/${entidadeId}`).get();


    if (snapshot.empty) {
      console.log("Nenhum user encontrado para essa entidade.");
      return res.status(200).json([]);
    }

    const users = snapshot.docs.map(doc => {
      return {
        uid: doc.id,
        ...doc.data(),
      };
    });


    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar users por entidade:", error);
    return res.status(500).json({ error: "Erro ao buscar users." });
  }
};
const updateUserDetails = async (req, res) => {
  console.log(req.body);
  try {
    console.log("🔹 Iniciando updateUserDetails...");
    console.log("📩 Dados recebidos:", req.body);

    const { email, oldNome, nome, entidade, role, newPassword } = req.body;

    if (!email || !oldNome || !nome || !entidade || !role) {
      console.log("❌ Erro: Campos obrigatórios ausentes");
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    // Gerar entidadeId no formato correto
    let entidadeId = entidade
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, "-");

    const entidadeRef = `entidades/${entidadeId}`;

    const usersRef = db.collection("users");
    console.log("🔍 Buscando user com email:", email);
    const querySnapshot = await usersRef.where("email", "==", email).get();

    if (querySnapshot.empty) {
      console.log("❌ user não encontrado para o email:", email);
      return res.status(404).json({ error: "user não encontrado." });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log("✅ user encontrado! ID:", userId);

    // Criar userId baseado apenas no nome (substituindo espaços por "-")
    const formatUserId = (name) => {
      return `user_${name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, "-")}`; // Substitui espaços por "-"
    };

    const newUserId = formatUserId(nome);

    if (oldNome !== nome) {
      console.log("🆕 Nome alterado, criando novo user...");

      const newUserRef = usersRef.doc(newUserId);

      const newUserData = {
        ...userData,
        nome,
        entidade: entidadeRef,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (newPassword) {
        newUserData.isFirstLogin = true;
      }

      await newUserRef.set(newUserData);
      console.log("✅ Novo user criado com sucesso! ID:", newUserId);

      // Referências para os registros de ponto e férias
      const oldUserRef = db.collection("registro-ponto").doc(userId);
      const newUserRegistroRef = db.collection("registro-ponto").doc(newUserId);

      // Função para copiar subcoleções
      const copySubcollection = async (subcollectionName) => {
        const oldSubcollectionRef = oldUserRef.collection(subcollectionName);
        const newSubcollectionRef = newUserRegistroRef.collection(subcollectionName);

        const snapshot = await oldSubcollectionRef.get();

        if (!snapshot.empty) {
          console.log(`🔄 Copiando ${subcollectionName}...`);
          const batch = db.batch();

          snapshot.forEach((doc) => {
            const newDocRef = newSubcollectionRef.doc(doc.id);
            batch.set(newDocRef, doc.data());
          });

          await batch.commit();
          console.log(`✅ ${subcollectionName} copiados para o novo usuário!`);
        } else {
          console.log(`⚠ Nenhum dado encontrado na subcoleção ${subcollectionName}.`);
        }
      };

      // ✅ Copiar registros de ponto e férias
      await copySubcollection("Registros");
      await copySubcollection("Ferias");

      // 🗑 Remover usuário antigo e seus registros
      console.log("🗑 Removendo usuário antigo...");
      const batchDelete = db.batch();

      const oldRegistrosSnapshot = await oldUserRef.collection("Registros").get();
      oldRegistrosSnapshot.forEach((doc) => batchDelete.delete(doc.ref));

      const oldFeriasSnapshot = await oldUserRef.collection("Ferias").get();
      oldFeriasSnapshot.forEach((doc) => batchDelete.delete(doc.ref));

      batchDelete.delete(oldUserRef);
      batchDelete.delete(usersRef.doc(userId));

      await batchDelete.commit();
      console.log("✅ Usuário antigo e registros removidos!");

      return res.status(200).json({ message: "Usuário atualizado com novo ID com sucesso." });
    } else {
      console.log("✏ Nome não mudou, atualizando usuário existente...");

      const updatedData = { entidade: entidadeRef, nome, role, updatedAt: new Date() };

      if (newPassword) {
        updatedData.isFirstLogin = true;
      }

      await usersRef.doc(userId).update(updatedData);
      console.log("✅ Usuário atualizado com sucesso!");

      return res.status(200).json({ message: "Usuário atualizado com sucesso." });
    }
  } catch (error) {
    console.error("🚨 Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};
const createVacation = async (req, res) => {
  try {
    const { username, date } = req.body;

    if (!username || !date) {
      console.log("Erro: Campos obrigatórios ausentes.");
      return res.status(400).json({ error: "Faltam campos obrigatórios: username e/ou date" });
    }

    // Gerando o userId no formato correto
    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-");

    // Adicionar o prefixo apenas se o username não começar com "user_"
    if (!username.toLowerCase().startsWith("user_")) {
      userId = `user_${userId}`;
    }

    console.log("Registrando férias para o user:", userId);

    // Referência ao documento do user dentro da coleção "registro-ponto"
    const userDocRef = db.collection("registro-ponto").doc(userId);

    // Criando um ID único para o registro baseado na data no formato DDMMYYYY
    const [day, month] = date.split("-");
    const year = new Date().getFullYear(); // Assume o ano atual
    const registroId = `registro_${day}${month}${year}`;

    console.log("Gerado registroId:", registroId);

    // Criando um novo documento dentro da subcoleção "Ferias"
    await userDocRef.collection("Ferias").doc(registroId).set({
      date: `${day}-${month}-${year}`, // Armazena a data no formato DD-MM-YYYY
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Férias registradas com sucesso no Firestore.");
    return res.status(201).json({ message: "Férias registradas com sucesso", registroId });
  } catch (error) {
    console.error("Erro ao registrar férias:", error);
    return res.status(500).json({ error: error.message });
  }
};
const deleteRegister = async (req, res) => {
  try {
    console.log("🔹 Recebendo requisição para deletar registro...");
    const { username, date } = req.body;

    if (!username || !date) {
      console.log("❌ Erro: UserName e data são obrigatórios.");
      return res.status(400).json({ error: "O nome de user e a data são obrigatórios" });
    }

    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-");

    console.log("🗑️ Apagando registros para user:", userId, "na data:", date);

    const userDocRef = db.collection("registro-ponto").doc(`user_${userId}`);
    console.log("📌 Referência ao documento do user obtida:", userDocRef.path);
    
    const registrosRef = userDocRef.collection("Registros");
    const feriasRef = userDocRef.collection("Ferias");

    // Converter data do formato "01-01" para "DDMMYYYY"
    const formatDateForRegister = (date) => {
      const [day, month] = date.split("-");
      const year = new Date().getFullYear();
      return `${day}${month}${year}`;
    };

    const formattedDate = formatDateForRegister(date);
    const registroId = `registro_${formattedDate}`;

    console.log("📌 Buscando registro com ID:", registroId);
    const registroDoc = await registrosRef.doc(registroId).get();

    console.log("📌 Buscando registros na coleção 'Ferias'...");
    const snapshotFerias = await feriasRef.where("date", "==", date).get();

    console.log("📌 Registros encontrados:", registroDoc.exists ? 1 : 0, "| Férias encontradas:", snapshotFerias.size);

    if (!registroDoc.exists && snapshotFerias.empty) {
      console.log("⚠️ Nenhum registro encontrado para a data informada");
      return res.status(404).json({ error: "Nenhum registro encontrado para a data informada" });
    }

    const batch = db.batch();
    if (registroDoc.exists) {
      console.log("🗑️ Deletando registro:", registroId);
      batch.delete(registroDoc.ref);
    }
    snapshotFerias.forEach((doc) => {
      console.log("🗑️ Deletando registro de férias:", doc.id);
      batch.delete(doc.ref);
    });

    console.log("🔄 Executando batch delete...");
    await batch.commit();

    console.log("✅ Registros apagados com sucesso.");
    return res.status(200).json({ message: "Registros apagados com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao apagar registros:", error);
    return res.status(500).json({ error: error.message });
  }
};
const deleteUser = async (req, res) => {
  const { userName } = req.body;
  console.log(req.body);

  if (!userName) {
    console.log("Erro: UserName obrigatório.");
    return res.status(400).json({ error: "O UserName é obrigatório" });
  }

  let userId = userName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-");

  console.log("A apagar user", userId, "e os seus dados");

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "user não encontrado." });
    }

    const userEmail = userDoc.data().email;

    if (!userEmail) {
      return res.status(404).json({ error: "Email do user não encontrado." });
    }

    const registroPontoRef = db.collection("registro-ponto").doc(userId);
    const userRegRef = registroPontoRef.collection("Registro");
    const userFerRef = registroPontoRef.collection("Férias");

    // Deleta os subdocumentos de Registro
    const registroSnapshot = await userRegRef.get();
    const deleteRegistros = registroSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deleteRegistros);

    // Deleta os subdocumentos de Férias
    const feriasSnapshot = await userFerRef.get();
    const deleteFerias = feriasSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deleteFerias);

    // Deleta os documentos principais
    await registroPontoRef.delete();
    await userDocRef.delete();

    // Deleta o user do Authentication
    await admin.auth().getUserByEmail(userEmail).then(async (userRecord) => {
      await admin.auth().deleteUser(userRecord.uid);
    });

    console.log("Utilizador", userId, "apagado com sucesso.");
    return res.status(200).json({ message: "Utilizador apagado com sucesso." });
  } catch (error) {
    console.error("Erro ao apagar utilizador:", error);
    return res.status(500).json({ error: "Erro ao apagar utilizador." });
  }
};
const createMedicalLeave = async (req, res) => {
  try {
    const { username, date } = req.body;

    if (!username || !date) {
      console.log("Erro: Campos obrigatórios ausentes.");
      return res.status(400).json({ error: "Faltam campos obrigatórios: username e/ou date" });
    }

    // Gerando o userId no formato correto
    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-");

    // Adicionar o prefixo apenas se o username não começar com "user_"
    if (!username.toLowerCase().startsWith("user_")) {
      userId = `user_${userId}`;
    }

    console.log("Registrando baixa médica para o user:", userId);

    // Referência ao documento do user dentro da coleção "registro-ponto"
    const userDocRef = db.collection("registro-ponto").doc(userId);

    // Criando um ID único para o registro baseado na data no formato DDMMYYYY
    const [day, month] = date.split("-");
    const year = new Date().getFullYear(); // Assume o ano atual
    const registroId = `registro_${day}${month}${year}`;

    console.log("Gerado registroId:", registroId);

    // Criando um novo documento dentro da subcoleção "BaixasMedicas"
    await userDocRef.collection("BaixasMedicas").doc(registroId).set({
      date: `${day}-${month}-${year}`, // Armazena a data no formato DD-MM-YYYY
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Baixa médica registrada com sucesso no Firestore.");
    return res.status(201).json({ message: "Baixa médica registrada com sucesso", registroId });
  } catch (error) {
    console.error("Erro ao registrar baixa médica:", error);
    return res.status(500).json({ error: error.message });
  }
};
const ping = async (req, res) => {
  try {
    console.log("Ping recebido");
    res.status(200).json({ message: "Pong" });
  } catch (error) {
    console.error("Erro no ping:", error);
    res.status(500).json({ error: "Erro no ping" });
  }
}

module.exports = { getUserInfo, verifyToken, createUser, registerEntry, 
                  registerLeave, getUserRecords, getUsersByEntity, userDetails, 
                  checkEntry, checkLeave, updateUserTime, updateFirstLogin,
                  updateUserDetails, createVacation, deleteRegister,
                  deleteUser, createMedicalLeave, ping };