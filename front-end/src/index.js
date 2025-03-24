import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import "./index.css";
import Login from "./components/Login/login";
import FirstLoginComponent from "./components/Login/firstLogin";
import NovaEntidade from "./pages/MenuSuperAdmin/entities/newEntity/newEntity";
import { AllEntities, EntityDetail } from "./pages/MenuSuperAdmin/entities/allEntities/allEntities";
import NewUser from "./pages/MenuSuperAdmin/users/newUser";
import RegisterEntry from "./pages/MenuUser/buttons/entryRegisterButton";
import RegisterLeave from "./pages/MenuUser/buttons/exitRegisterButton";
import TableHours from "./pages/MenuUser/pointRegister";
import { UserProvider, UserContext } from "./context/UserContext";
import UserList from "./pages/MenuSuperAdmin/users/userList";
import UserDetails from "./pages/MenuSuperAdmin/users/userDetails";
import LogoutButton from './components/LogoutButton/logoutButton';

const App = () => {
  const { setUsername, username, setUserEmail, userEmail } = useContext(UserContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  console.log(selectedUser, "aquii");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const { nome, role, email, firstLogin } = JSON.parse(storedUser);
      setUsername(nome);
      setUserEmail(email);
      setIsLoggedIn(true);
      setIsAdmin(role === "SuperAdmin");
      setIsFirstLogin(firstLogin && role !== "SuperAdmin");
    }
  }, [setUsername, setUserEmail]);

  const handleLoginSuccess = (role, nome, firstLogin, email) => {
    const userData = { nome, role, email, firstLogin };
    localStorage.setItem("user", JSON.stringify(userData));
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

  const AdminMenu = () => {
    const navigate = useNavigate();
    return (
      <div>
        <div className="flex-center button-container">
          <button className="gradient-border" onClick={() => navigate("/entidades")}>Ver Entidades</button>
          <button className="gradient-border" onClick={() => navigate("/nova-entidade")}>Criar Entidade</button>
          <button className="gradient-border" onClick={() => navigate("/novo-user")}>Criar User</button>
        </div>
        <LogoutButton onLogout={handleLogout} />
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? (isFirstLogin ? <Navigate to="/first-login" /> : <Navigate to={isAdmin ? "/admin" : "/home"} />) : <Login onLoginSuccess={handleLoginSuccess} />} />
        
        {isLoggedIn && isFirstLogin && !isAdmin && (
          <Route path="/first-login" element={<FirstLoginComponent email={userEmail} onComplete={() => setIsFirstLogin(false)} />} />
        )}

        {isLoggedIn && isAdmin && (
          <>
            <Route path="/admin" element={<AdminMenu />} />
            <Route path="/entidades" element={<AllEntities />} />
            <Route path="/entidades/:entityName" element={<EntityDetail />} />
            <Route path="/entidades/:entityName/users" element={<UserList setSelectedUser={setSelectedUser} />} />
            <Route path="/entidades/:entityName/users/:userName" element={<UserDetails selectedUser={selectedUser} />} />
            <Route path="/nova-entidade" element={<NovaEntidade />} />
            <Route path="/novo-user" element={<NewUser />} />
          </>
        )}

        {isLoggedIn && !isAdmin && (
          <>
            <Route path="/home" element={<RegisterEntry username={username} />} />
            <Route path="/registrar-saida" element={<RegisterLeave username={username} />} />
            <Route path="/horas" element={<TableHours username={username} />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);