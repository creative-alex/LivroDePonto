const admin = require("firebase-admin");
const path = require("path");
const db = admin.firestore();

const createUser = async (req, res) => {
  try {
      const { nome, email, entidade, role } = req.body;

      if (!nome || !email || !entidade) {
          console.log('Erro: Nome, email ou entidade ausentes.');
          return res.status(400).json({ error: 'Nome, email e entidade são obrigatórios' });
      }

      // Gerar o ID base do user
      let baseUserId = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
      let userId = baseUserId;
      let counter = 1;

      // Verificar se o ID já existe no Firestore
      let userRef = db.collection('users').doc(userId);
      let doc = await userRef.get();

      while (doc.exists) {
          counter++;
          userId = `${baseUserId}-${String(counter).padStart(2, '0')}`; // id-02, id-03...
          userRef = db.collection('users').doc(userId);
          doc = await userRef.get();
      }

      // Criar referência da entidade no Firestore
      const entityId = entidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
      const entityRef = `entidades/${entityId}`;

      const userRole = role.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

      // Criar documento do user com ID único
      await userRef.set({
          nome,
          email,
          entidade: entityRef,
          createdAt: new Date().toISOString(),
          role: userRole,
          isFirstLogin: true
      });

      res.status(201).json({ message: 'User criado com sucesso', id: userId });

  } catch (error) {
      console.error('Erro ao criar user no banco de dados:', error);
      res.status(500).json({ error: 'Erro ao criar user no banco de dados' });
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
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const userData = querySnapshot.docs[0].data();
    const isSuperAdmin = userData.role === "SuperAdmin";

    res.json({
      role: userData.role || 'user',
      nome: userData.nome || 'N/A',
      isFirstLogin: isSuperAdmin ? false : (userData.isFirstLogin ?? true), // SuperAdmins nunca veem a tela de primeiro login
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
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

    // Buscar o usuário no Firebase Authentication
    console.log("Buscando usuário no Firebase Authentication:", userEmail);
    const userRecord = await admin.auth().getUserByEmail(userEmail);

    if (!userRecord) {
      console.log("Usuário não encontrado no Firebase Authentication");
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    console.log("Usuário encontrado:", userRecord.uid);

    // Atualizar senha no Firebase Authentication
    console.log("Atualizando senha para o usuário:", userRecord.uid);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });
    console.log("Senha atualizada com sucesso");

    // Atualizar isFirstLogin no Firestore
    console.log("Buscando usuário no Firestore pelo email:", userEmail);
    const userQuery = await db.collection("users").where("email", "==", userEmail).get();

    if (!userQuery.empty) {
      const userId = userQuery.docs[0].id;
      console.log("Usuário encontrado no Firestore com ID:", userId);

      console.log("Atualizando isFirstLogin para false no Firestore");
      await db.collection("users").doc(userId).update({
        isFirstLogin: false,
      });
      console.log("isFirstLogin atualizado com sucesso");
    } else {
      console.log("Usuário não encontrado no Firestore");
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

    if (!userName) {
      return res.status(400).json({ error: "O campo userName é obrigatório." });
    }

    // Buscar usuário no Firestore
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("nome", "==", userName).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Buscar entidade relacionada
    let entidadeNome = "Desconhecida";

    if (userData.entidade && typeof userData.entidade === "string") {
      const entidadeParts = userData.entidade.split("/"); // ['entidades', 'coorperativa-comenius']

      if (entidadeParts.length === 2 && entidadeParts[0] === "entidades") {
        const entidadeId = entidadeParts[1]; // 'coorperativa-comenius'

        try {
          const entidadeRef = await db.collection("entidades").doc(entidadeId).get();
          if (entidadeRef.exists) {
            entidadeNome = entidadeRef.data().nome || "Desconhecida";
          }
        } catch (err) {
          console.warn("⚠️ Erro ao buscar entidade:", err);
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

    res.json(userDetails);
  } catch (error) {
    console.error("🚨 Erro ao buscar detalhes do usuário:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes do usuário." });
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
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const hh = String(today.getHours()).padStart(2, "0");
    const min = String(today.getMinutes()).padStart(2, "0");
    const ss = String(today.getSeconds()).padStart(2, "0");

    // Criando um ID único para o registro baseado na data e hora
    const registroId = `registro_${dd}${mm}${yyyy}`;


    console.log("Registrando entrada para o usuário:", userId);

    // Referência ao documento do usuário dentro da coleção "registro-ponto"
    const userDocRef = db.collection("registro-ponto").doc(`user_${userId}`);

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

    const { username } = req.body;
    
    if (!username) {
      console.log("Erro: Nome de usuário ausente.");
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
    const registroId = `registro_${dd}${mm}${yyyy}`;


    const userDocRef = db.collection("registro-ponto").doc(`user_${userId}`);
    const registroDoc = await userDocRef.collection("Registros").doc(registroId).get();

    if (registroDoc.exists) {
      console.log("Entrada já registrada para hoje.");
      return res.status(200).json({ hasEntry: true });
    }

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

    // Referência à subcoleção "Registros" do usuário
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
      console.log("Erro: Nome de usuário ausente.");
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
    
    console.log("Saída já registrada para hoje.");
    return res.status(200).json({ hasLeave: true });
  } catch (error) {
    console.error("Erro ao verificar saída:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getUserRecords = async (req, res) => {
  try {

    const { username, month } = req.body;
    if (!username || !month) {
      console.log("Erro: Nome de usuário e mês são obrigatórios.");
      return res.status(400).json({ error: "O nome de usuário e o mês são obrigatórios" });
    }

    // Gerando o userId no formato correto
    let userId = username
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    const admin = require("firebase-admin");
    const db = admin.firestore();


    // Definir início e fim do mês
    const now = new Date();
    const year = now.getFullYear();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0, 23, 59, 59);

    // Referência à coleção de registros do usuário
    const registrosRef = db
      .collection("registro-ponto")
      .doc(`user_${userId}`)
      .collection("Registros");

    const snapshot = await registrosRef
      .where("timestamp", ">=", firstDay)
      .where("timestamp", "<=", lastDay)
      .orderBy("timestamp", "asc")
      .get();

    if (snapshot.empty) {
      console.log("Nenhum registro encontrado para o usuário neste mês.");
      return res.status(404).json({ error: "Nenhum registro encontrado para o mês informado" });
    }

    // Montando a resposta
    const registros = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        timestamp: data.timestamp.toDate().toISOString(),
        horaEntrada: data.horaEntrada || "-",
        horaSaida: data.horaSaida || "-",
      };
    });

    return res.status(200).json(registros);
  } catch (error) {
    console.error("Erro ao buscar registros de usuário:", error);
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
    console.error("Erro ao atualizar horário do usuário:", error);
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
      console.log("Nenhum usuário encontrado para essa entidade.");
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
    console.error("Erro ao buscar usuários por entidade:", error);
    return res.status(500).json({ error: "Erro ao buscar usuários." });
  }
};
const updateUserDetails = async (req, res) => {
  try {
    console.log("🔹 Iniciando updateUserDetails...");
    console.log("📩 Dados recebidos:", req.body);

    const { email, entidade, nome, role, newPassword } = req.body;

    if (!email) {
      console.log("❌ Erro: Campo 'email' é obrigatório");
      return res.status(400).json({ error: "O campo 'email' é obrigatório." });
    }

    // Gerar entidadeId no formato correto
    let entidadeId = entidade
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // Remove acentos
      .replace(/\s+/g, "-"); // Substitui espaços por hífen

    const entidadeRef = `entidades/${entidadeId}`;

    const usersRef = db.collection("users");
    console.log("🔍 Buscando usuário com email:", email);
    const querySnapshot = await usersRef.where("email", "==", email).get();

    if (querySnapshot.empty) {
      console.log("❌ Usuário não encontrado para o email:", email);
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    console.log("✅ Usuário encontrado! ID:", userId);

    const updatedData = { entidade: entidadeRef, nome, role };
    console.log("✏ Dados atualizados antes da modificação:", updatedData);

    if (newPassword) {
      updatedData.isFirstLogin = true; // Marca que o usuário deve redefinir a senha no primeiro login
      console.log("🔑 Nova senha detectada, isFirstLogin definido para true");
    }

    console.log("🚀 Atualizando usuário no Firestore...");
    await usersRef.doc(userId).update(updatedData);
    console.log("✅ Usuário atualizado com sucesso!");

    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  } catch (error) {
    console.error("🚨 Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};



module.exports = { getUserInfo, verifyToken, createUser, registerEntry, 
                  registerLeave, getUserRecords, getUsersByEntity, userDetails, 
                  checkEntry, checkLeave, updateUserTime, updateFirstLogin,
                  updateUserDetails };