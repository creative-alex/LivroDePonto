import React, { useState, useEffect, useContext } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { UserContext } from "../../context/UserContext";
import { useNavigate, useLocation } from "react-router-dom"; 
import { toast, ToastContainer } from "react-toastify";
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
  const location = useLocation(); // Obter o estado passado pelo navigate

  useEffect(() => {
    // Verifica se há uma mensagem de sucesso no estado
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
    }
  }, [location.state]);

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
      const response = await fetch("https://api-ls3q.onrender.com/users/verifyToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao autenticar o token");
      }
      console.log("Resposta da verificação do token:", response);

      // Obtém o papel e nome do user
      const roleResponse = await fetch("https://api-ls3q.onrender.com/users/getUserRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!roleResponse.ok) {
        const errorData = await roleResponse.json();
        throw new Error(errorData.message || "Erro ao obter informações do usuário");
      }

      const roleData = await roleResponse.json();
      console.log("Dados do papel do usuário:", roleData);

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
      console.error("Erro no login:", error);
      setError("Erro no login: " + error.message);
      toast.error("Erro no login: " + error.message); // Exibe um toast com o erro
    }
  };

  return (
  <>
    <div>
    <h1>Bem-Vindo!</h1>
      <img src={capa} alt="Capa" className="capa" />
    </div>
    <img src={logo} alt="Logo" className="logo" />
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