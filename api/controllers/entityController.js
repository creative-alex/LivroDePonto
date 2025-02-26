const { db } = require('../db/firebase');
const { validateEntity } = require('../validations/entity')
const admin = require("firebase-admin");
const path = require("path");

const createEntity = async (req, res) => {
  try {
    const { nome, morada, nif, nColaboradores } = req.body;

    if (!nome || !morada || !nif || nColaboradores === undefined) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Validando os dados da entidade
    const validationError = validateEntity({ nome, morada, nif, nColaboradores });

    if (validationError.length > 0) {
      return res.status(400).json({ error: validationError });
    } 

    // Gerando um ID baseado no nome 
    const entityId = nome.toLowerCase().replace(/\s+/g, '-'); // Ex: "Empresa XPTO" -> "empresa-xpto"

    const data = {
      nome,
      morada,
      nif,
      nColaboradores,
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
    const { oldName, nome, morada, nif, nColaboradores } = req.body;

    if (!oldName || !nome || !morada || !nif || nColaboradores === undefined) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const oldEntityId = `entidades/${oldName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;
    const newEntityId = `entidades/${nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`;

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
      nColaboradores,
      updatedAt: new Date(),
    };

    if (oldEntityId === newEntityId) {
      console.log('Nome não mudou, atualizando entidade...');
      await entityRef.update(data);
    } else {
      console.log('Criando nova entidade e atualizando usuários...');

      // Criar nova entidade com o novo ID
      await db.doc(newEntityId).set(data);

      // Atualizar usuários que possuem referência à entidade antiga
      const usersRef = db.collection('users');
      const usersSnapshot = await usersRef.where('entidade', '==', oldEntityId).get();


      if (usersSnapshot.empty) {
        console.log('Nenhum usuário encontrado para atualizar!');
      }

      const batch = db.batch();
      usersSnapshot.forEach((doc) => {
        const userRef = usersRef.doc(doc.id);
        console.log(`Atualizando usuário ${doc.id} para nova entidade: ${newEntityId}`);
        batch.update(userRef, { entidade: newEntityId });
      });

      await batch.commit();
      console.log('Usuários atualizados com sucesso!');

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
    const entityId = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

    // Busca a entidade na coleção "entidades"
    const entityRef = db.collection("entidades").doc(entityId);
    const entitySnapshot = await entityRef.get();

    if (!entitySnapshot.exists) {
      return res.status(404).json({ error: "Entidade não encontrada." });
    }

    // Contar usuários que fazem referência à entidade
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



module.exports = { createEntity, updateEntity, showEntity, entityDetails};
