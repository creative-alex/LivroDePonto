import React, { useState, useEffect, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import EntryButton from "./buttons/entryRegisterButton";
import ExitButton from "./buttons/exitRegisterButton";

const Calendario = ({userName}) => {
  //const { userName } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [modalType, setModalType] = useState(null);
  const [entryTime, setEntryTime] = useState(sessionStorage.getItem("entryTime") || "");
  const [exitTime, setExitTime] = useState(sessionStorage.getItem("exitTime") || "");
  const [events, setEvents] = useState([]);
  const hoje = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (userName) {
      fetchUserRecords();
    }
  }, [userName]);

  const fetchUserRecords = async () => {
    try {
      const response = await fetch("http://localhost:4005/users/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }), // Mudança de userName para userId
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar os registros");
      }

      const data = await response.json();

      const registros = data.map((registro) => ({
        title: `Entrada: ${registro.horaEntrada} ${registro.horaSaida ? `- Saída: ${registro.horaSaida}` : ""}`,
        start: registro.date, // O backend já retorna o formato YYYY-MM-DD
        allDay: true,
      }));

      console.log(registros)

      setEvents(registros);
    } catch (error) {
      console.error("Erro ao buscar registros:", error);
    }
  };

  const handleDateClick = (info) => {
    if (info.dateStr === hoje) {
      setSelectedDate(info.dateStr);
      setIsModalOpen(true);
    }
  };

  const handleEntry = (event) => {
    const value = event.target.value;
    setEntryTime(value);
    sessionStorage.setItem("entryTime", value);

    fetch("http://localhost:4005/users/registerEntry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryTime: value, userId: userName }),
    })
      .then((response) => response.json())
      .then(() => fetchUserRecords()) // Atualizar calendário após registro
      .catch((error) => console.error("Erro ao registrar entrada:", error));
  };

  const handleExit = (event) => {
    const value = event.target.value;
    setExitTime(value);
    sessionStorage.setItem("exitTime", value);

    fetch("http://localhost:4005/users/registerLeave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exitTime: value, userId: userName }),
    })
      .then((response) => response.json())
      .then(() => fetchUserRecords()) // Atualizar calendário após registro
      .catch((error) => console.error("Erro ao registrar saída:", error));
  };

  return (
    <div>
      <h2>Calendário de Registros</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        selectable={true}
        dateClick={handleDateClick}
      />

      {isModalOpen && (
        <div>
          <h3>Registro de Ponto</h3>
          <p>Data: {selectedDate}</p>
          <p>user: {userName}</p>

          {modalType === "entry" && (
            <div>
              <label htmlFor="entryTime">Hora de Entrada: </label>
              <select id="entryTime" onChange={handleEntry}>
                <option value="">Selecione</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
              </select>
              {entryTime && <p>Hora de Entrada: {entryTime}</p>}
            </div>
          )}

          {modalType === "exit" && (
            <div>
              <label htmlFor="exitTime">Hora de Saída: </label>
              <select id="exitTime" onChange={handleExit}>
                <option value="">Selecione</option>
                <option value="17:00">17:00</option>
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
              </select>
              {exitTime && <p>Hora de Saída: {exitTime}</p>}
            </div>
          )}

          <button onClick={() => setModalType("entry")}>
            <EntryButton />
          </button>
          <button onClick={() => setModalType("exit")}>
            <ExitButton />
          </button>
          <button onClick={() => setIsModalOpen(false)}>Fechar</button>
        </div>
      )}
    </div>
  );
};

export default Calendario;
