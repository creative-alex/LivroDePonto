import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from "react-router-dom";
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

const App = () => {
  const { setUsername, username, setUserEmail, userEmail } = useContext(UserContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHours, setShowHours] = useState(false);


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
        <button className="btn-menu">Mostrar Entidades & Users</button>        
        </Link>
        <Link to="/nova-entidade">
          <button className="btn-menu">Criar Entidade</button>
        </Link>
        <Link to="/novo-user">
          <button className="btn-menu">Criar User</button>
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
        <ShowRegister onClick={() => setShowHours(true)} />
      </div>
      {showHours && <TableHours username={username} />}
      <LogoutButton className="flex-center button-container" onLogout={handleLogout} />
    </div>
  );

  console.log(username);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? (isFirstLogin ? <Navigate to="/first-login" /> : <Navigate to={isAdmin ? "/admin" : "/home"} />) : <Login onLoginSuccess={handleLoginSuccess} />} />
        {isLoggedIn && isFirstLogin && !isAdmin && <Route path="/first-login" element={<FirstLoginComponent email={userEmail} onComplete={() => setIsFirstLogin(false)} />} />}
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
          <Route path="/home" element={<UserMenu />} />
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
