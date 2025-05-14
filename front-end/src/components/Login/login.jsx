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
      if (storedName !== username) {
      } else {
      }
    };

    const interval = setInterval(() => {
      checkLocalStorage();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [username]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const auth = getAuth(app);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      const token = await user.getIdToken();

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

      // Passa o papel, nome e isFirstLogin
      onLoginSuccess(roleData.role, roleData.nome, roleData.isFirstLogin, user.email);

      // Atualiza o contexto
      setUsername(roleData.nome);

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