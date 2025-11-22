import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

// Jours de la semaine ajustés de Dimanche à Jeudi (5 jours)
const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi"]; 
const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// --- Component for Room-focused Schedule View (Styles mis à jour) ---
const RoomScheduleView = ({ roomScheduleMap, hours, days }) => {
  if (!roomScheduleMap || Object.keys(roomScheduleMap).length === 0) {
    return <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>Aucune salle ou emploi du temps trouvé.</p>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '30px',
      width: '100%'
    }}>
      {Object.entries(roomScheduleMap).map(([roomId, roomData]) => (
        <div key={roomId} style={{ 
          marginBottom: 0, 
          border: '1px solid #e0e0e0', 
          padding: '15px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          backgroundColor: '#ffffff'
        }}>
          <h3 style={{ 
            borderBottom: '2px solid #5a8fbf', // Couleur primaire
            paddingBottom: '8px', 
            color: '#5a8fbf',
            marginTop: 0,
            marginBottom: '15px'
          }}>
            📍 Salle: **{roomData.name}**
          </h3>
          <table style={{ 
            width: '100%', 
            fontSize: '0.9em',
            borderCollapse: 'collapse',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#e3f2fd', color: '#3a4a5c', textAlign: 'left' }}>Heure</th>
                {days.map(d => <th key={d} style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#e3f2fd', color: '#3a4a5c' }}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {hours.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#fafafa' }}><b>{hour}</b></td>
                  {days.map(day => {
                    const cell = roomData.schedule[day]?.[hour];
                    
                    return (
                      <td
                        key={day}
                        style={{ 
                          padding: '10px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                          height: '60px',
                          // Couleurs comme dans ProfDashboard
                          backgroundColor: cell ? (cell.occupied ? '#ffcdd2' : '#d4edda') : '#f8f8f8',
                          color: cell ? (cell.occupied ? '#c62828' : '#155724') : '#6c757d',
                          fontWeight: cell?.occupied ? 'bold' : 'normal',
                          lineHeight: '1.2'
                        }}
                      >
                        {cell ? (
                          <>
                            <b>{cell.subject}</b><br />
                            <small style={{ fontSize: '0.8em', color: cell.occupied ? '#d32f2f' : '#388e3c' }}>({cell.profName})</small>
                            {cell.occupied && <div style={{fontSize:'0.75em', color: '#c62828', fontWeight:'bold', marginTop: '3px'}}>🔥 OCCUPÉE</div>}
                          </>
                        ) : "Libre"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};


const AdminDashboard = () => {
  const navigate = useNavigate();

  const [professors, setProfessors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentView, setCurrentView] = useState('schedule');
  const [schedule, setSchedule] = useState({});
  const [roomScheduleMap, setRoomScheduleMap] = useState({});

  // --- Simulation Time State ---
  const today = new Date();
  const [simulationDate, setSimulationDate] = useState(today.toISOString().split('T')[0]); 
  const [simulationTime, setSimulationTime] = useState(today.toTimeString().split(' ')[0].substring(0, 5)); 
  
  // LOGIQUE CLÉ DE SYNCHRONISATION : Stocke le temps dans localStorage à chaque changement
  useEffect(() => {
    const dateObj = new Date(`${simulationDate}T00:00:00`);
    const dayIndex = dateObj.getDay();
    const dayName = days[dayIndex];
    
    localStorage.setItem('simNow', JSON.stringify({
      date: simulationDate,
      hour: simulationTime.substring(0, 5),
      day: dayName 
    }));
  }, [simulationDate, simulationTime]);
  
  // Derived state for display
  const simulatedDateTime = new Date(`${simulationDate}T${simulationTime}:00`);
  const simulatedDayOfWeek = simulatedDateTime.getDay(); 
  const simulatedDayName = days[simulatedDayOfWeek]; 
  // ---------------------------------

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(null);
  const [modalHour, setModalHour] = useState(null);
  const [modalProfId, setModalProfId] = useState("");
  const [modalSalleId, setModalSalleId] = useState("");
  const [modalScheduleId, setModalScheduleId] = useState(null);
  const [modalSubject, setModalSubject] = useState(""); 

  const [addProfModalOpen, setAddProfModalOpen] = useState(false);
  const [newProfName, setNewProfName] = useState("");
  const [newProfEmail, setNewProfEmail] = useState("");
  const [newProfPassword, setNewProfPassword] = useState("");

  const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("");
  const [newRoomLocation, setNewRoomLocation] = useState("");

  const [, setTick] = useState(0);

  // --- Utility: Calculate End Time (1-hour slot) ---
  const calculateEndTime = (startTime) => {
    const [h, m] = startTime.split(":").map(Number);
    const endH = h + 1;
    return `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // --- Utility: Reformat Schedule Data for Room View ---
  const createRoomScheduleMap = useCallback((scheduleData, roomsList) => {
    const roomMap = {};
    
    roomsList.forEach(room => {
        roomMap[room._id] = { name: room.name, schedule: {} };
        days.forEach(day => {
            roomMap[room._id].schedule[day] = {};
        });
    });

    days.forEach(day => {
        const dailySchedule = scheduleData[day] || {};
        hours.forEach(hour => {
            const entry = dailySchedule[hour];
            if (entry && entry.roomId) {
                const roomId = entry.roomId;
                if (roomMap[roomId]) {
                    roomMap[roomId].schedule[day][hour] = entry;
                }
            }
        });
    });
    
    return roomMap;
  }, []); 
  
  // --- Fetch data from backend ---
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Professors
      const usersRes = await fetch("http://localhost:3000/api/users");
      const usersData = await usersRes.json();
      const profs = usersData.filter(u => u.role === "professor");
      setProfessors(profs);

      // 2. Fetch Rooms
      const roomsRes = await fetch("http://localhost:3000/api/rooms");
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      // 3. Fetch Schedules (Populated)
      const schedulesRes = await fetch("http://localhost:3000/api/schedules");
      const schedulesData = await schedulesRes.json();

      const schedMap = {};
      days.forEach(day => (schedMap[day] = {}));

      schedulesData.forEach(entry => {
        const dayName = days[entry.dayOfWeek];
        
        const start = new Date(entry.startTime);
        const startHour =
          start.getHours().toString().padStart(2, "0") +
          ":" +
          start.getMinutes().toString().padStart(2, "0");

        const profId = entry.profId?._id;
        const profName = entry.profId?.name || "???";
        const roomId = entry.roomId?._id;
        const roomName = entry.roomId?.name || "???";

        if (profId && roomId && days.includes(dayName)) {
          schedMap[dayName][startHour] = {
            profId: profId,
            profName: profName,
            roomId: roomId,
            roomName: roomName,
            scheduleId: entry._id,
            subject: entry.subject || "Informatique", 
            occupied: entry.occupied || false, // Lit l'état d'occupation du backend
          };
        }
      });

      setSchedule(schedMap);
      setRoomScheduleMap(createRoomScheduleMap(schedMap, roomsData));

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [createRoomScheduleMap]);
    
  useEffect(() => {
    fetchData();
    // Écoute les changements d'occupation faits par le prof via l'API
    const storageHandler = (e) => {
        if (e.key === 'scheduleUpdate') {
            fetchData();
            setTick(t => t + 1);
        }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [fetchData]); 

  // --- Logout ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // --- Open edit modal ---
  const openEditModal = (day, hour) => {
    if (currentView !== 'schedule') return; 
      
    const cell = schedule[day]?.[hour];
    setModalDay(day);
    setModalHour(hour);

    if (cell) {
      setModalProfId(cell.profId);
      setModalSalleId(cell.roomId);
      setModalScheduleId(cell.scheduleId);
      setModalSubject(cell.subject); 
    } else {
      setModalProfId("");
      setModalSalleId("");
      setModalScheduleId(null);
      setModalSubject("Informatique"); 
    }

    setModalOpen(true);
  };

  // --- Save schedule entry ---
  const handleSaveModal = () => {
    if (!modalProfId || !modalSalleId || !modalSubject) {
      return alert("Veuillez choisir professeur, salle et sujet !");
    }
    
    const arbitraryDate = new Date();
    const datePrefix = arbitraryDate.toISOString().split('T')[0] + 'T'; 

    const startTimeISO = datePrefix + modalHour + ":00.000Z";
    const endTimeISO = datePrefix + calculateEndTime(modalHour) + ":00.000Z";
    
    // Récupère l'état 'occupied' actuel de la cellule si elle existe (pour la mise à jour)
    const existingCell = schedule[modalDay]?.[modalHour];
    const existingOccupiedStatus = existingCell ? existingCell.occupied : false;


    let payload = {
      profId: modalProfId,
      roomId: modalSalleId,
      dayOfWeek: days.indexOf(modalDay), 
      startTime: startTimeISO,
      endTime: endTimeISO,    
      subject: modalSubject,
    };

    const url = modalScheduleId
      ? `http://localhost:3000/api/schedules/${modalScheduleId}`
      : "http://localhost:3000/api/schedules";

    const method = modalScheduleId ? "PUT" : "POST";

    // Si c'est une MISE À JOUR (PUT), nous incluons l'état d'occupation pour qu'il soit conservé.
    if (method === 'PUT') {
        payload = { ...payload, occupied: existingOccupiedStatus };
    }

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur de l'API lors de la sauvegarde.");
        return res.json();
      })
      .then(data => {
        fetchData(); 
        setModalOpen(false);
        localStorage.setItem('scheduleUpdate', Date.now()); // Notifie ProfDashboards
      })
      .catch(err => {
        console.error("Erreur sauvegarde :", err);
        alert("Erreur lors de la sauvegarde ! Vérifiez la console pour les détails.");
      });
  };


  // --- Add professor ---
  const handleAddProfessor = () => {
    if (!newProfName || !newProfEmail || !newProfPassword) {
      return alert("Veuillez remplir tous les champs !");
    }

    fetch("http://localhost:3000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newProfEmail,
        password: newProfPassword,
        name: newProfName,
        role: "professor",
      }),
    })
      .then(res => res.json())
      .then(data => {
        fetchData(); // Pour rafraîchir la liste des professeurs dans le select
        setAddProfModalOpen(false);
        setNewProfName("");
        setNewProfEmail("");
        setNewProfPassword("");
        alert("Professeur ajouté !");
      })
      .catch(console.error);
  };

  // --- Add room ---
  const handleAddRoom = () => {
    if (!newRoomName) return alert("Veuillez renseigner le nom de la salle !");

    fetch("http://localhost:3000/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRoomName,
        capacity: newRoomCapacity ? Number(newRoomCapacity) : undefined,
        location: newRoomLocation,
      }),
    })
      .then(res => res.json())
      .then(data => {
        fetchData(); // Pour rafraîchir la liste des salles dans le select
        setAddRoomModalOpen(false);
        setNewRoomName("");
        setNewRoomCapacity("");
        setNewRoomLocation("");
        alert("Salle ajoutée !");
      })
      .catch(console.error);
  };

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Logout */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={handleLogout}
          style={{ 
            padding: "8px 12px", 
            borderRadius: 8, 
            border: "none", 
            background: "#f44336", 
            color: "white", 
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          🔒 Déconnexion
        </button>
      </div>

      <h1 style={{ color: '#3a4a5c', borderBottom: '3px solid #5a8fbf', paddingBottom: '10px', marginBottom: '20px' }}>
        📊 Admin — Gestion des Salles et Emplois du Temps
      </h1>

      {/* --- Simulation Time Controls and Display --- */}
      <div style={{ 
        marginBottom: 25, 
        padding: 15, 
        border: '1px solid #cfe1f0', 
        borderRadius: 8, 
        background: '#e3f2fd', 
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#3a4a5c' }}>
          ⏳ Heure de Référence (Simulée): 
          <span style={{ color: '#5a8fbf', marginLeft: 8 }}>
            **{simulatedDayName || 'Jour non scolaire'} {simulationTime}**
          </span>
        </p>
        
        <div style={{ display: 'flex', gap: 15, marginTop: 15, justifyContent: 'center' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8em', fontWeight: 600, textAlign: 'left' }}>
            Date de simulation:
            <input 
              type="date" 
              value={simulationDate} 
              onChange={(e) => setSimulationDate(e.target.value)} 
              style={{ padding: 8, borderRadius: 6, border: '1px solid #a8d5e5', marginTop: 5 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8em', fontWeight: 600, textAlign: 'left' }}>
            Heure de simulation:
            <input 
              type="time" 
              value={simulationTime} 
              onChange={(e) => setSimulationTime(e.target.value)} 
              style={{ padding: 8, borderRadius: 6, border: '1px solid #a8d5e5', marginTop: 5 }}
            />
          </label>
        </div>
      </div>
      {/* -------------------------------------------------- */}


      {/* --- View Toggle Buttons --- */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={() => setCurrentView('schedule')}
          style={{ 
            padding: "10px 20px", 
            borderRadius: 8, 
            border: "1px solid #cfe1f0", 
            background: currentView === 'schedule' ? '#5a8fbf' : '#ffffff', 
            color: currentView === 'schedule' ? 'white' : '#3a4a5c', 
            cursor: "pointer",
            fontWeight: 600 
          }}
        >
          Emploi du Temps Global
        </button>
        <button
          onClick={() => setCurrentView('rooms')}
          style={{ 
            padding: "10px 20px", 
            borderRadius: 8, 
            border: "1px solid #cfe1f0", 
            background: currentView === 'rooms' ? '#5a8fbf' : '#ffffff', 
            color: currentView === 'rooms' ? 'white' : '#3a4a5c', 
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Occupation des Salles
        </button>
      </div>
      {/* --------------------------- */}


      {/* Add professor / room buttons */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <button
          onClick={() => setAddProfModalOpen(true)}
          style={{ 
            padding: "10px 15px", 
            borderRadius: 8, 
            border: "none", 
            background: "#4caf50", 
            color: "white", 
            cursor: "pointer", 
            marginRight: 10,
            fontWeight: 600
          }}
        >
          ➕ Ajouter un professeur
        </button>
      
        <button
          onClick={() => setAddRoomModalOpen(true)}
          style={{ 
            padding: "10px 15px", 
            borderRadius: 8, 
            border: "none", 
            background: "#2196f3", 
            color: "white", 
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          ➕ Ajouter une salle
        </button>
      </div>

      {/* --- CONDITIONAL RENDERING --- */}
      {currentView === 'schedule' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#e3f2fd', color: '#3a4a5c', textAlign: 'left', minWidth: '80px' }}>Heure</th>
              {days.map(d => <th key={d} style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#e3f2fd', color: '#3a4a5c', fontWeight: 600 }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => {
              // Highlight the current simulated hour
              const isCurrentHour = hour.substring(0, 2) === simulationTime.substring(0, 2);
              
              return (
                <tr key={hour}>
                  <td style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: isCurrentHour ? '#c5cae9' : '#f5f5f5', fontWeight: 'bold' }}><b>{hour}</b></td>
                  {days.map(day => {
                    const cell = schedule[day]?.[hour];
                    const isCurrentDay = day === simulatedDayName;
                    
                    let highlightStyle = {};
                    if (isCurrentDay && isCurrentHour) {
                        highlightStyle = { backgroundColor: '#ffccbc', border: '3px solid #ff7043' }; // Strong highlight for current slot
                    } else if (isCurrentDay) {
                        highlightStyle = { backgroundColor: '#fff3e0' }; // Light highlight for current day
                    }

                    return (
                      <td
                        key={day}
                        onClick={() => openEditModal(day, hour)}
                        style={{ 
                            padding: '10px',
                            border: '1px solid #ddd',
                            textAlign: 'center',
                            height: '60px',
                            ...highlightStyle, 
                            cursor: 'pointer',
                            // Couleurs comme dans ProfDashboard
                            backgroundColor: cell ? (cell.occupied ? '#ffcdd2' : (highlightStyle.backgroundColor || '#d4edda')) : (highlightStyle.backgroundColor || '#f8f8f8'),
                            color: cell ? (cell.occupied ? '#c62828' : '#155724') : '#6c757d',
                            fontWeight: cell?.occupied ? 'bold' : 'normal'
                        }}
                      >
                        {cell ? (
                          <>
                            <b>{cell.roomName}</b><br />
                            <small style={{ fontSize: '0.8em', color: cell.occupied ? '#d32f2f' : '#388e3c' }}>{cell.profName}</small>
                            {cell.occupied && <div style={{fontSize:'0.75em', color: '#c62828', fontWeight:'bold', marginTop: '3px'}}>🔥 OCCUPÉE</div>}
                          </>
                        ) : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {currentView === 'rooms' && (
        <RoomScheduleView roomScheduleMap={roomScheduleMap} hours={hours} days={days} />
      )}
      {/* ------------------------------ */}


      {/* --- Modals --- */}
      {/* Edit Schedule Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ width: 500, background: "white", borderRadius: 12, padding: 25, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <h2 style={{ marginTop: 0, color: '#5a8fbf', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              Modifier séance — {modalDay} {modalHour}
            </h2>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#3a4a5c' }}>Sujet de la séance</label>
            <input 
              type="text" 
              placeholder="Sujet" 
              value={modalSubject} 
              onChange={e => setModalSubject(e.target.value)} 
              style={{ width: "100%", padding: 10, marginBottom: 15, borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }} 
            />
            <div style={{ display: "flex", gap: 15 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#3a4a5c' }}>Salle</label>
                <select value={modalSalleId} onChange={e => setModalSalleId(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: '1px solid #ccc' }}>
                  <option value="">-- choisir salle --</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#3a4a5c' }}>Professeur</label>
                <select value={modalProfId} onChange={e => setModalProfId(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: '1px solid #ccc' }}>
                  <option value="">-- choisir professeur --</option>
                  {professors.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button 
                onClick={() => setModalOpen(false)} 
                style={{ padding: '10px 15px', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', fontWeight: 600 }}
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveModal} 
                style={{ padding: '10px 15px', borderRadius: 6, border: 'none', background: "#5a8fbf", color: "white", cursor: "pointer", fontWeight: 600 }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Professor Modal (Unchanged) */}
      {addProfModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ width: 400, background: "white", borderRadius: 12, padding: 25, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <h2 style={{ marginTop: 0, color: '#4caf50', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>Ajouter un professeur</h2>
            <input type="text" placeholder="Nom" value={newProfName} onChange={e => setNewProfName(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }} />
            <input type="email" placeholder="Email" value={newProfEmail} onChange={e => setNewProfEmail(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }} />
            <input type="password" placeholder="Mot de passe" value={newProfPassword} onChange={e => setNewProfPassword(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button onClick={() => setAddProfModalOpen(false)} style={{ padding: '10px 15px', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={handleAddProfessor} style={{ padding: '10px 15px', borderRadius: 6, border: 'none', background: "#4caf50", color: "white", cursor: "pointer", fontWeight: 600 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal (Unchanged) */}
      {addRoomModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ width: 400, background: "white", borderRadius: 12, padding: 25, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <h2 style={{ marginTop: 0, color: '#2196f3', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>Ajouter une salle</h2>
            <input type="text" placeholder="Nom de la salle" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }} />
            <input type="number" placeholder="Capacité" value={newRoomCapacity} onChange={e => setNewRoomCapacity(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }} />
            <input type="text" placeholder="Localisation" value={newRoomLocation} onChange={e => setNewRoomLocation(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button onClick={() => setAddRoomModalOpen(false)} style={{ padding: '10px 15px', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={handleAddRoom} style={{ padding: '10px 15px', borderRadius: 6, border: 'none', background: "#2196f3", color: "white", cursor: "pointer", fontWeight: 600 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;