import { useNavigate } from "react-router-dom";
import logo from '../logo.svg';
import '../App.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Livro de Ponto</h1>
        <div>
          <button className="App-button" onClick={() => navigate("/login")}>Área GRH</button>
          <button className="App-button" onClick={() => navigate("/login")}>Área Colaborador</button>
        </div>
      </header>
    </div>
  );
}

export default Home;
