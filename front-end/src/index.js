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
import Home from "./components/App"

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
      const { nome, role, email, firstLogin } = JSON.parse(storedUser);
      setUsername(nome);
      setUserEmail(email);
      setIsLoggedIn(true);
      setIsAdmin(role === "SuperAdmin");
      setIsFirstLogin(firstLogin && role !== "SuperAdmin");

      // Redireciona o usuário logado para a página correta
      if (window.location.pathname === "/" || window.location.pathname === "/login" || window.location.pathname === "/first-login") {
        if (role === "SuperAdmin") {
          navigate("/admin");
        } else if (firstLogin && role !== "SuperAdmin") {
          navigate("/first-login");
        } else {
          navigate("/home");
        }
      }
    }
  }, [setUsername, setUserEmail, navigate]);

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
    <div>
      <div className="flex-center button-container">
        <Link to="/entidades">
        <button className="btn-menu gradient-border">Mostrar Entidades & Users</button>        
        </Link>
        <Link to="/nova-entidade">
          <button className="btn-menu gradient-border">Criar Entidade</button>
        </Link>
        <Link to="/novo-user">
          <button className="btn-menu gradient-border">Criar User</button>
        </Link>
      </div>
      <LogoutButton onLogout={handleLogout} />
    </div>
  );
  

  const UserMenu = () => (
    <div>
      <div className="flex-center button-container">
        <RegisterEntry username={username} />
        <RegisterLeave username={username} />
      </div>
      {/* Renderiza a tabela de horas diretamente */}
      <TableHours username={username} />
      <LogoutButton className="flex-center button-container" onLogout={handleLogout} />
    </div>
  );


  
  return (
    <Routes>
      {/* Garante que Home aparece primeiro */}
      <Route path="/" element={<Home />} />

      {/* Login separado para ser acessado pelos botões do Home */}
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
                  <Route path="/entidades/:entityName/users" element={<UserList setSelectedUser={setSelectedUser} />} />
                  <Route path="/entidades/:entityName/users/:userName" element={<UserDetails selectedUser={selectedUser} />} />
                  <Route path="/nova-entidade" element={<NovaEntidade />} />
                  <Route path="/novo-user" element={<NewUser />} />
                </>
              ) : (
                <Route path="/home" element={<UserMenu />} />
              )}
            </>
          )}
        </>
      )}
    </Routes>
  );
  
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <Router> {/* Mova o Router para cá */}
      <App />
    </Router>
  </UserProvider>
);
