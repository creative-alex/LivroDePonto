import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate, Link, useNavigate } from "react-router-dom";
import "./index.css";
import Login from "./components/Login/login";
import FirstLoginComponent from "./components/Login/firstLogin";
import NovaEntidade from "./pages/MenuSuperAdmin/entities/newEntity/newEntity";
import { AllEntities, EntityDetail } from "./pages/MenuSuperAdmin/entities/allEntities/allEntities";
import NewUser from "./pages/MenuSuperAdmin/users/newUser";
import RegisterEntry from "./pages/MenuUser/buttons/entryRegisterButton";
import RegisterLeave from "./pages/MenuUser/buttons/exitRegisterButton";
import ShowRegister from './pages/MenuUser/buttons/showRegisterButton';
import TableHours from "./pages/MenuUser/pointRegister";
import { UserProvider, UserContext } from "./context/UserContext";
import UserList from "./pages/MenuSuperAdmin/users/userList";
import UserDetails from "./pages/MenuSuperAdmin/users/userDetails";
import LogoutButton from './components/LogoutButton/logoutButton';
import Home from "./components/App";
import logo from "./assets/logo.png";
import capa from "./assets/capa.jpg";
import footer from "./assets/footer.png";
import { ToastContainer } from "react-toastify";

const App = () => {
  const { setUsername, username, setUserEmail, userEmail } = useContext(UserContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHours, setShowHours] = useState(false);
  const navigate = useNavigate(); // Inicializar o hook useNavigate


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const { nome, role, email, firstLogin } = JSON.parse(storedUser);
        setUsername(nome);
        setUserEmail(email);
        setIsLoggedIn(true);
        setIsAdmin(role === "SuperAdmin");
        setIsFirstLogin(firstLogin && role !== "SuperAdmin");
      } catch (error) {
        console.error("Erro ao analisar o usuário armazenado:", error);
        localStorage.removeItem("user");
      }
    }
  }, [setUsername, setUserEmail, navigate]);
  
  
  useEffect(() => {
    if (!isFirstLogin && isLoggedIn && !isAdmin) {      
      const allowedPaths = ["/home", "/registos"];
      if (!allowedPaths.includes(window.location.pathname)) {
        navigate("/home");
      }
    }
  }, [isFirstLogin, isLoggedIn, isAdmin, navigate]);

  const handleLoginSuccess = (role, nome, firstLogin, email) => {
    localStorage.setItem("user", JSON.stringify({ nome, role, email, firstLogin }));
    setUsername(nome);
    setUserEmail(email);
    setIsLoggedIn(true);
    setIsAdmin(role === "SuperAdmin");
    setIsFirstLogin(firstLogin && role !== "SuperAdmin");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsFirstLogin(false);
  };

  const AdminMenu = () => (
    <>
    <div style={{ width: '30vw' }}>
        <h1>Bem-Vindo!</h1>
          <img src={capa} alt="Capa" className="capa" />
          <LogoutButton onLogout={handleLogout} />
    </div>
    <img src={logo} alt="Logo" className="logo" />
    <div>
      <div className="flex-center button-container">
        <Link to="/entidades">
        <button className="btn-menu gradient-border">Visualizar Entidades & Users</button>        
        </Link>
        <Link to="/nova-entidade">
          <button className="btn-menu gradient-border">Criar Entidade</button>
        </Link>
        <Link to="/novo-user">
          <button className="btn-menu gradient-border">Criar User</button>
        </Link>
      </div>
    </div>
    <footer className="footer">
        <img src={footer} alt="Rodapé" className="footer-image" />
    </footer>
    </>
  );
  

  const UserMenu = () => {
    const { username } = useContext(UserContext);
  
    if (!username) {
      return <div>Carregando...</div>; // Exibir estado de carregamento
    }
  
    return (
      <>
        <div style={{ width: '30vw' }}>
          <h1>Bem-Vindo, {username}!</h1>
          <img src={capa} alt="Capa" className="capa" />
          <LogoutButton onLogout={handleLogout} />
        </div>
        <img src={logo} alt="Logo" className="logo" />
        <div>
          <div className="flex-center button-container">
            <RegisterEntry username={username} />
            <RegisterLeave username={username} />
            <button
              className="btn-menu gradient-border"
              onClick={() => navigate('/registos')}
            >
              Mostrar Registos
            </button>
          </div>
          <LogoutButton className="flex-center button-container" onLogout={handleLogout} />
        </div>
        <footer className="footer">
          <img src={footer} alt="Rodapé" className="footer-image" />
        </footer>
      </>
    );
  };


  
  return (
    <>
    <Routes>
      {/* Página inicial sempre será o login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Página de login */}
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

      {/* Se o utilizador estiver autenticado, redireciona conforme o tipo de utilizador */}
      {isLoggedIn && (
        <>
          {isFirstLogin && !isAdmin ? (
            <Route path="/first-login" element={<FirstLoginComponent email={userEmail} onComplete={() => setIsFirstLogin(false)} />} />
          ) : (
            <>
              {isAdmin ? (
                <>
                  <Route path="/admin" element={<AdminMenu />} />
                  <Route path="/entidades" element={<AllEntities />} />
                  <Route path="/entidades/:entityName" element={<EntityDetail />} />
                  <Route path="/nova-entidade" element={<NovaEntidade />} />
                  <Route path="/novo-user" element={<NewUser />} />
                  <Route path="/:entityName/:userName" element={<UserDetails selectedUser={selectedUser} />} />
                </>
              ) : (
                <>
                  <Route path="/home" element={<UserMenu />} />
                  <Route path="/registos" element={<TableHours username={username} />} /> {/* Adicionada a rota para TableHours */}
                </>
              )}
            </>
          )}
        </>
      )}
    </Routes>
    <ToastContainer/>
    </>
  );
  
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <Router>
      <App />
    </Router>
  </UserProvider>
);
