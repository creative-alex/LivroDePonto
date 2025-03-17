import React, { useState, useEffect, useContext } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { UserContext } from "../../context/UserContext";

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
  const { userName, setUserName } = useContext(UserContext);

  useEffect(() => {
    const checkLocalStorage = () => {
      const storedName = localStorage.getItem("userName");
      if (storedName !== userName) {
      }
    };

    // Verifica mudanças no localStorage a cada 500ms
    const interval = setInterval(checkLocalStorage, 60000);

    return () => clearInterval(interval);
  }, [userName]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");  
  
    const auth = getAuth(app);

  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
  
      // Verifica token no backend
      const response = await fetch("http://localhost:4005/users/verifyToken", {  
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
  
      if (!response.ok) throw new Error("Erro ao autenticar");
      console.log("Email antes da requisição:", email);

  
      // Obtém o papel e nome do user
      const roleResponse = await fetch("http://localhost:4005/users/getUserRole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      
      const roleData = await roleResponse.json();
      if (!roleResponse.ok) throw new Error(roleData.message || "Erro ao obter informações do user");
      
      // Passa o papel, nome e isFirstLogin para o App
      onLoginSuccess(roleData.role, roleData.nome, roleData.isFirstLogin, user.email);
      
      
      // Atualiza o contexto
      setUserName(roleData.nome);
      
    } catch (error) {
      setError(error.message);
      console.error("Erro no login:", error);
    }
  };

  return (
    <div className="login-container-unique">
    <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <div className="form-group-unique">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group-unique">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-unique">{error}</p>}
      <button type="submit">Login</button>
    </form>
  </div>
  
  );
};

export default Login;