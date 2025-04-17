import React, { useState, useEffect, useContext } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom"; 
import logo from "../../assets/logo.png";
import capa from "../../assets/capa.jpg";
import footer from "../../assets/footer.png";

// Carregar variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { username, setUsername } = useContext(UserContext);
  const navigate = useNavigate(); // Inicializar o hook

  useEffect(() => {
    const checkLocalStorage = () => {
      const storedName = localStorage.getItem("username");
      console.log("Verificando nome armazenado no localStorage:", storedName);
      if (storedName !== username) {
        console.log("Nome armazenado é diferente do nome atual");
      } else {
        console.log("Nome armazenado e nome atual são iguais");
      }
    };

    const interval = setInterval(() => {
      console.log("Verificando localStorage a cada 60 segundos...");
      checkLocalStorage();
    }, 60000);

    return () => {
      clearInterval(interval);
      console.log("Limpeza do intervalo de verificação do localStorage");
    };
  }, [username]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Formulário de login enviado");
    setError("");

    const auth = getAuth(app);
    console.log("Autenticando no Firebase...");

    try {
      console.log("Tentando fazer login com email:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login bem-sucedido:", userCredential);
      
      const user = userCredential.user;
      console.log("Usuário autenticado:", user);
      
      const token = await user.getIdToken();
      console.log("Token do usuário:", token);

      // Verifica token no backend
      const response = await fetch("http://localhost:4005/users/verifyToken", {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error("Erro ao autenticar");
      console.log("Resposta da verificação do token:", response);

      // Obtém o papel e nome do user
      const roleResponse = await fetch("http://localhost:4005/users/getUserRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      console.log("Resposta da obtenção do papel do usuário:", roleResponse);

      const roleData = await roleResponse.json();
      console.log("Dados do papel do usuário:", roleData);

      if (!roleResponse.ok) throw new Error(roleData.message || "Erro ao obter informações do user");

      // Passa o papel, nome e isFirstLogin 
      onLoginSuccess(roleData.role, roleData.nome, roleData.isFirstLogin, user.email);
      console.log("Login bem-sucedido, passando dados para o App:", roleData);

      // Atualiza o contexto
      setUsername(roleData.nome);
      console.log("Nome do usuário atualizado no contexto:", roleData.nome);
      
      // Redireciona o usuário com base no papel
      if (roleData.role === "SuperAdmin") {
        navigate("/admin"); // Redireciona para o menu de admin
      } else if (roleData.isFirstLogin) {
        navigate("/first-login"); // Redireciona para o primeiro login
      } else {
        navigate("/home"); // Redireciona para o menu de usuário
      }
      
    } catch (error) {
      setError(error.message);
      console.error("Erro no login:", error);
    }
  };
  return (
  <>
    <div>
      <img src={capa} alt="Capa" className="capa" />
    <h1>Bom dia!</h1>
    </div>
    <div className="login-form">
      <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          type="email"
          id="email"
          placeholder="Email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <input
          type="password"
          id="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-unique">{error}</p>}
      <button className="btn login" type="submit">→</button>
    </form>
  </div>
  <footer className="footer">
    <img src={footer} alt="Rodapé" className="footer-image" />
    </footer>
  </>
  );
};

export default Login;