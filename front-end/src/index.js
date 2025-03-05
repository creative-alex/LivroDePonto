import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Login from './components/Login/login';
import FirstLoginComponent from './components/Login/firstLogin';
import Logout from './components/LogoutButton/logoutButton';
import NovaEntidade from './pages/MenuSuperAdmin/entities/newEntity/newEntity';
import CreateEntityButton from './pages/MenuSuperAdmin/buttons/createEntityButton';
import ShowAllEntitiesButton from './pages/MenuSuperAdmin/buttons/showEntitiesButton';
import AllEntities from './pages/MenuSuperAdmin/entities/allEntities/allEntities';
import NewUserButton from './pages/MenuSuperAdmin/buttons/newUserButton';
import NewUser from './pages/MenuSuperAdmin/users/newUser';
import RegisterEntry from './pages/MenuUser/buttons/entryRegisterButton';
import RegisterLeave from './pages/MenuUser/buttons/exitRegisterButton';
import TableHours from './pages/MenuUser/pointRegister';
import ShowRegister from './pages/MenuUser/buttons/showRegisterButton';
import reportWebVitals from './reportWebVitals';
import { UserProvider, UserContext } from './context/UserContext';

const App = () => {
  const { setUsername, username, setUserEmail, userEmail } = useContext(UserContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePage, setActivePage] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
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
    localStorage.setItem('user', JSON.stringify(userData));
    setUsername(nome);
    setUserEmail(email);
    setIsLoggedIn(true);
    setIsAdmin(role === "SuperAdmin");
    setIsFirstLogin(firstLogin && role !== "SuperAdmin");
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setActivePage(null);
    setUsername(null);
    setUserEmail(null);
    setIsFirstLogin(false);
  };

  return isLoggedIn ? (
    isFirstLogin && !isAdmin ? (
      <FirstLoginComponent email={userEmail} onComplete={() => setIsFirstLogin(false)} />
    ) : isAdmin ? (
      <>
        <div className="button-container">
          <ShowAllEntitiesButton onClick={() => setActivePage('allEntities')} />
          <CreateEntityButton onClick={() => setActivePage('newEntity')} />
          <NewUserButton onClick={() => setActivePage('newUser')} />
        </div>
        {activePage === 'allEntities' && <AllEntities />}
        {activePage === 'newEntity' && <NovaEntidade />}
        {activePage === 'newUser' && <NewUser />}
        <Logout onClick={handleLogout} />
      </>
    ) : (
      <>
        <div className="button-container">
          <RegisterEntry username={username} />
          <RegisterLeave username={username} isSuperAdmin="SuperAdmin" />
          <ShowRegister onClick={() => setActivePage('allregister')} />
        </div>
        {activePage === 'allregister' && <TableHours username={username} month={currentMonth} />}
        <Logout onClick={handleLogout} />
      </>
    )
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);

reportWebVitals();
