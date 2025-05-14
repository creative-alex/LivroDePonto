const { db } = require('../db/firebase');
const { validateEntity } = require('../validations/entity')
const admin = require("firebase-admin");
const path = require("path");

const createEntity = async (req, res) => {
  try {
    const { nome, morada, nif } = req.body;

    if (!nome || !morada || !nif) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validando os dados da entidade
    const validationError = validateEntity({ nome, morada, nif});

    if (validationError.length > 0) {
      return res.status(400).json({ error: validationError });
    } 

    // Gerando um ID baseado no nome 
    const entityId = nome
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, 'e')
  .replace(/-/g, ' ')
  .replace(/[^a-z0-9\s]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');


    const data = {
      nome,
      morada,
      nif,
      createdAt: new Date(),
    };


    // Criando a entidade com um ID específico no Firestore
    await db.collection('entidades').doc(entityId).set(data);

    res.status(201).json({ id: entityId, message: 'Entidade criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar entidade:', error);
    res.status(500).json({ error: 'Erro ao criar entidade' });
  }
};
const updateEntity = async (req, res) => {
  try {
    const { oldName, nome, morada, nif } = req.body;

    console.log("kkkkkk")

    if (!oldName || !nome || !morada || !nif ) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

   const oldEntityId = `entidades/${oldName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'e')
      .replace(/-/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

    const newEntityId = `entidades/${nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'e')
      .replace(/-/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')}`;

    console.log(`Old Entity ID: ${oldEntityId}`);
    console.log(`New Entity ID: ${newEntityId}`);

    const entityRef = db.doc(oldEntityId);
    const entityDoc = await entityRef.get();

    if (!entityDoc.exists) {
      console.log('Entidade não encontrada!');
      return res.status(404).json({ error: 'Entidade não encontrada' });
    }

    const data = {
      nome,
      morada,
      nif,
      updatedAt: new Date(),
    };

    if (oldEntityId === newEntityId) {
      console.log('Nome não mudou, atualizando entidade...');
      await entityRef.update(data);
    } else {
      console.log('Criando nova entidade e atualizando users...');

      // Criar nova entidade com o novo ID
      await db.doc(newEntityId).set(data);

      // Atualizar users que possuem referência à entidade antiga
      const usersRef = db.collection('users');
      const usersSnapshot = await usersRef.where('entidade', '==', oldEntityId).get();


      if (usersSnapshot.empty) {
        console.log('Nenhum user encontrado para atualizar!');
      }

      const batch = db.batch();
      usersSnapshot.forEach((doc) => {
        const userRef = usersRef.doc(doc.id);
        console.log(`Atualizando user ${doc.id} para nova entidade: ${newEntityId}`);
        batch.update(userRef, { entidade: newEntityId });
      });

      await batch.commit();
      console.log('users atualizados com sucesso!');

      // Deletar entidade antiga
      await entityRef.delete();
      console.log('Entidade antiga deletada!');
    }

    res.status(200).json({ id: newEntityId, message: 'Entidade atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar entidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar entidade' });
  }
};
const showEntity = async (req, res) => {
  try {
    const snapshot = await db.collection('entidades').get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Nenhuma entidade encontrada' });
    }

    const entityNames = snapshot.docs.map(doc => {
      const data = doc.data();
      return data.nome; 
    });

    const entityCount = snapshot.size;

    res.status(200).json({ entityNames, entityCount });
  } catch (error) {
    console.error('Erro ao listar entidades:', error);
    res.status(500).json({ error: 'Erro ao listar entidades' });
  }
};
const entityDetails = async (req, res) => {
  try {
    const { name } = req.body; 

    if (!name) {
      return res.status(400).json({ error: "O nome da entidade é obrigatório." });
    }

    // Gera o ID padronizado
    const entityId = name
.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // Remove acentos
    .replace(/&/g, 'e')                 // Substitui "&" por "e"
    .replace(/-/g, ' ')                 // Converte hífens em espaços
    .replace(/[^a-z0-9\s]/g, '')        // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')               // Substitui espaços por hífen
    .replace(/-+/g, '-')                // Evita hífens duplicados
    .replace(/^-+|-+$/g, '');           // Remove hífens nas extremidades


    
    // Busca a entidade na coleção "entidades"
    const entityRef = db.collection("entidades").doc(entityId);
    const entitySnapshot = await entityRef.get();

    if (!entitySnapshot.exists) {
      return res.status(404).json({ error: "Entidade não encontrada." });
    } 

    // Contar users que fazem referência à entidade
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.where('entidade', '==', `entidades/${entityId}`).get();
    const userCount = usersSnapshot.size;

    res.json({
      ...entitySnapshot.data(),
      userCount 
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da entidade:", error);
    res.status(500).json({ error: "Erro no servidor." });
  }
};
const deleteEntity = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "O nome da entidade é obrigatório." });
    }

    // Gera o ID padronizado
    const entityId = name
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, 'e')
  .replace(/-/g, ' ')
  .replace(/[^a-z0-9\s]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');


    // Verifica se a entidade existe
    const entityRef = db.collection("entidades").doc(entityId);
    const entitySnapshot = await entityRef.get();

    if (!entitySnapshot.exists) {
      return res.status(404).json({ error: "Entidade não encontrada." });
    }

    // Verifica se há colaboradores associados à entidade
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.where('entidade', '==', `entidades/${entityId}`).get();

    if (!usersSnapshot.empty) {
      return res.status(400).json({ error: "Não é possível apagar a entidade. Existem colaboradores associados a ela." });
    }

    // Apaga a entidade
    await entityRef.delete();

    res.status(200).json({ message: "Entidade apagada com sucesso." });
  } catch (error) {
    console.error("Erro ao apagar entidade:", error);
    res.status(500).json({ error: "Erro ao apagar entidade." });
  }
};


module.exports = { createEntity, updateEntity, showEntity, 
                   entityDetails, deleteEntity};
