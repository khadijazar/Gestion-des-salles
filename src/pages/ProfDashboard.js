import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

// Jours de la semaine ajustés de Dimanche à Jeudi (5 jours)
const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi"]; 
const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const SESSION_DURATION_MINUTES = 60; 
const API_BASE_URL = "http://localhost:3000/api";

// --- Component for Room-focused Schedule View (Shared with Admin) ---
const RoomScheduleView = ({ roomScheduleMap, hours, days, profId }) => {
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
            borderBottom: '2px solid #5a8fbf', 
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
                    const isProfClass = cell && cell.profId === profId;

                    return (
                      <td
                        key={day}
                        className={cell ? (cell.occupied ? "occupied-room" : "occupied") : "free"}
                        style={{ 
                          backgroundColor: cell ? (cell.occupied ? '#ffcdd2' : (isProfClass ? '#d4edda' : '#f0f0f0')) : '#f8f8f8', 
                          color: cell ? (cell.occupied ? '#c62828' : (isProfClass ? '#155724' : '#000000')) : '#6c757d',
                          border: isProfClass ? '1px solid #4caf50' : '1px solid #ccc',
                          fontWeight: cell?.occupied ? 'bold' : 'normal',
                          lineHeight: '1.2'
                        }}
                      >
                        {cell ? (
                          <>
                            <b>{cell.subject}</b><br />
                            <small style={{ fontSize: '0.8em', color: cell.occupied ? '#d32f2f' : '#388e3c' }}>({cell.profName})</small>
                            {cell.occupied && <div style={{fontWeight:'bold', color: '#c62828', fontSize:'0.75em'}}>🔥 Occupée</div>}
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


// --- Helper: Retrieve current state from Admin's simulation (from localStorage) ---
const getSimNow = () => {
  try {
    const s = localStorage.getItem('simNow');
    if (!s) return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
};

// --- Helper: Get the current simulated Date object ---
const getCurrentNow = () => {
  const sim = getSimNow();
  const nowReal = new Date();
  
  if (sim && sim.date && sim.hour) {
    const simDate = sim.date;
    const simTime = sim.hour;
    return new Date(`${simDate}T${simTime}:00`);
  }
  return nowReal;
};


const ProfDashboard = () => {
  const [, setTick] = useState(0); 
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({});
  const [rooms, setRooms] = useState([]);
  const [roomScheduleMap, setRoomScheduleMap] = useState({});
  const [currentView, setCurrentView] = useState('profSchedule'); 

  // --- New Code Verification State ---
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [codeModalScheduleId, setCodeModalScheduleId] = useState(null);
  const [codeModalRoomId, setCodeModalRoomId] = useState(null);
  // -----------------------------------


  // ** CORRECTION CLÉ : Récupération de l'ID sous le nom `_id` ou `id` **
  const user = (() => {
    try { 
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.role === "professor") {
             // Assigne l'ID à la propriété standard '_id' que nous utilisons partout
             const userId = storedUser._id || storedUser.id;
             if (userId) {
                return { ...storedUser, _id: userId };
             }
        }
        return null;
    } catch { 
        return null; 
    }
  })();

  // --- Simulation State (Read-only, synchronized from Admin) ---
  const simNowState = getSimNow() || {};
  const [simulationDate, setSimulationDate] = useState(simNowState.date || new Date().toISOString().split('T')[0]); 
  const [simulationTime, setSimulationTime] = useState(simNowState.hour || new Date().toTimeString().split(' ')[0].substring(0, 5)); 
  
  // Derived state for display
  const simulatedDateTime = getCurrentNow();
  const simulatedDayOfWeek = simulatedDateTime.getDay();
  const simulatedDayName = days[simulatedDayOfWeek] || "Jour non scolaire";
  // -------------------------------------------------------------

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationDay, setNotificationDay] = useState(null);
  const [notificationHour, setNotificationHour] = useState(null);
  const [notificationSalle, setNotificationSalle] = useState(null);

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

  // --- Utility: Determine if session has ended (using simulated time) ---
  const isSessionEnded = useCallback((day, hour) => {
    if (day !== simulatedDayName) return false;
    const now = simulatedDateTime;

    const startHour = parseInt(hour, 10);
    if (Number.isNaN(startHour)) return false;
    
    const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0);
    const sessionEnd = new Date(sessionStart.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
    
    return now >= sessionEnd;
  }, [simulatedDateTime, simulatedDayName]);

  // --- Fetch data from backend (adapted from Admin) ---
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const roomsRes = await fetch("http://localhost:3000/api/rooms");
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

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
            occupied: entry.occupied || false,
          };
        }
      });

      setSchedule(schedMap);
      setRoomScheduleMap(createRoomScheduleMap(schedMap, roomsData));

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [user, createRoomScheduleMap]);
    
  useEffect(() => {
    fetchData();
    // GESTIONNAIRE DE SYNCHRONISATION DU TEMPS ET DU PLANNING
    const storageHandler = (e) => {
      if (e.key === 'simNow' || e.key === 'scheduleUpdate') {
        const sim = getSimNow();
        if (sim) {
          setSimulationDate(sim.date); 
          setSimulationTime(sim.hour);
        }
        
        fetchData();
        setTick(t => t + 1);
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [fetchData]); 

  // --- Core Action: Request Code and Open Modal (Replaced handlePresence) ---
  const handlePresence = async (day, hour, scheduleId) => {
    const cell = schedule[day]?.[hour];
    if (!user || !cell || cell.profId !== user._id) return alert("Action non autorisée ou séance non valide.");

    const now = simulatedDateTime;
    const currentDay = simulatedDayName;

    if (day !== currentDay) return alert(`Action limitée au jour courant : ${currentDay || '—'}`);
    
    const startHourInt = parseInt(hour, 10);
    const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHourInt, 0, 0);
    const sessionEnd = new Date(sessionStart.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);

    if (now < sessionStart) return alert('La séance n\'a pas encore commencé.');
    if (now >= sessionEnd) return alert('La séance est terminée — trop tard pour marquer présence.');
    if (cell.occupied) return alert('La salle est déjà marquée occupée.');

    try {
      // 1. Request code generation from backend
      const response = await fetch(`${API_BASE_URL}/access-logs/generate-code`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scheduleId, 
          profId: user._id, 
          roomId: cell.roomId 
        }) 
      });
      
      if (!response.ok) throw new Error("Erreur de l'API lors de la génération du code.");
      
      const data = await response.json();
      const code = data.code; 

      // 2. Open modal with code and store context
      setGeneratedCode(code);
      setEnteredCode("");
      setCodeModalScheduleId(scheduleId);
      setCodeModalRoomId(cell.roomId);
      setCodeModalOpen(true);

    } catch (error) {
      console.error("Error generating code:", error);
      alert("Erreur lors de la génération du code. Vérifiez le backend.");
    }
  };

  // --- Core Action: Submit Code and Mark Occupied ---
  const handleCodeSubmit = async () => {
    // Basic frontend verification check (though backend is the authority)
    if (enteredCode !== generatedCode) {
      alert('Code incorrect ! Veuillez recopier le code généré exactement.');
      setEnteredCode("");
      return;
    }
    
    const scheduleId = codeModalScheduleId;
    const roomId = codeModalRoomId;
    
    try {
      const response = await fetch(`${API_BASE_URL}/access-logs/grant`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            scheduleEntryId: scheduleId, 
            profId: user._id, 
            roomId: roomId,
            code: enteredCode 
        }) 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur inconnue lors de la validation.");
      }

      // Success: refresh data, close modal, notify
      await fetchData();
      setCodeModalOpen(false);
      alert('📌 Code validé et présence enregistrée ! La salle est maintenant occupée.');
      localStorage.setItem('scheduleUpdate', Date.now()); 

    } catch (error) {
      console.error("Error submitting code/marking occupied:", error);
      alert(`Erreur de validation: ${error.message}`);
      setEnteredCode(""); // Clear code on failure
    }
  };


  // --- Core Action: Release the Room (Existing PUT logic) ---
  const handleEndSession = async (day, hour, scheduleId) => {
    if (!user) return;
    const cell = schedule[day]?.[hour];
    if (!cell || cell.profId !== user._id) return alert("Vous ne pouvez pas terminer une séance qui n'est pas la vôtre.");
    if (!cell.occupied) return alert('La séance n\'est pas marquée comme occupée.');
    if (!isSessionEnded(day, hour)) return alert('La séance n\'est pas encore terminée.');

    try {
      const response = await fetch(`${API_BASE_URL}/schedules/occupy/${scheduleId}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupied: false }) 
      });
      
      if (!response.ok) throw new Error("Erreur de l'API lors de la libération.");
      
      await fetchData();
      setNotificationOpen(false); 
      alert('✅ Séance terminée — la salle est libérée.');
      localStorage.setItem('scheduleUpdate', Date.now()); 

    } catch (error) {
      console.error("Error releasing room:", error);
      alert("Erreur lors de la libération de la salle. Vérifiez le backend.");
    }
  };


  // --- Polling for Session End Notification ---
  useEffect(() => {
    if (!user || currentView === 'rooms') return; 

    const WARNING_MINUTES = 5; 

    const checkSessionEndingSoon = () => {
      const now = simulatedDateTime; 

      for (const day of days) {
        for (const hour of hours) {
          const cell = schedule[day]?.[hour]; 
          
          if (!cell || cell.profId !== user._id || !cell.occupied || day !== simulatedDayName) continue;

          const startHour = parseInt(hour, 10);
          if (Number.isNaN(startHour)) continue;

          const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0);
          const sessionEnd = new Date(sessionStart.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
          const msLeft = sessionEnd.getTime() - now.getTime();

          if (msLeft <= WARNING_MINUTES * 60 * 1000 && msLeft > -300000) { 
            if (!notificationOpen) {
              setNotificationDay(day);
              setNotificationHour(hour);
              setNotificationSalle(cell.roomName);
              setNotificationOpen(true);
              return; 
            }
          }
        }
      }
    };

    const interval = setInterval(checkSessionEndingSoon, 5000); 
    return () => clearInterval(interval);
  }, [user, notificationOpen, schedule, simulatedDateTime, simulatedDayName, currentView]);


  const handleLogout = () => {
    localStorage.removeItem('user'); 
    localStorage.removeItem('token');
    navigate("/"); 
  };
  
  if (!user) {
    return (
      <div className="dashboard-container">
        <h2 style={{color:'#4a7ba7'}}>Accès professeur requis</h2>
        <p>Connectez-vous avec un compte professeur pour voir votre emploi du temps.</p>
        <button onClick={() => navigate("/")} style={{marginTop: 10, padding: 8, borderRadius: 6}}>Aller à la page de connexion</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h1 className="dashboard-title">👨‍🏫 Espace Professeur — Emploi du Temps</h1>
        <div style={{display:'flex', gap:8}}>
          <button
            onClick={() => setCurrentView(currentView === 'fullSchedule' ? 'profSchedule' : 'fullSchedule')}
            style={{padding:'8px 12px', borderRadius:8, border:'1px solid #cfe1f0', background: currentView === 'fullSchedule' ? '#5a8fbf' : (currentView === 'profSchedule' ? '#ffffff' : '#ffffff'), color: currentView === 'fullSchedule' ? 'white' : '#3a4a5c', cursor:'pointer', fontWeight:600}}>
            {currentView === 'fullSchedule' ? 'Mon emploi' : 'Emploi complet'}
          </button>
          <button
            onClick={() => setCurrentView(currentView === 'rooms' ? 'profSchedule' : 'rooms')}
            style={{padding:'8px 12px', borderRadius:8, border:'1px solid #cfe1f0', background: currentView === 'rooms' ? '#5a8fbf' : '#ffffff', color: currentView === 'rooms' ? 'white' : '#3a4a5c', cursor:'pointer', fontWeight:600}}>
            {currentView === 'rooms' ? 'Mon emploi' : 'Occupation des Salles'}
          </button>
          <button
            style={{padding:'8px 12px', borderRadius:8, border:'none', background:'#f44336', color:'white', cursor:'pointer', fontWeight:600}}
            onClick={handleLogout}>
            🔒 Déconnexion
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: 10, border: '1px solid #ccc', borderRadius: 8, background: '#f9f9f9', textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#3a4a5c' }}>
          ⏳ Heure de Référence (Simulée): 
          <span style={{ color: '#5a8fbf', marginLeft: 8 }}>
            **{simulatedDayName} {simulatedDateTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}**
          </span>
        </p>
      </div>
      
      {/* --- SCHEDULE VIEW (Global or Filtered) --- */}
      {(currentView === 'profSchedule' || currentView === 'fullSchedule') && (
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Heure</th>
              {days.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => {
              const currentSimHour = simulatedDateTime.getHours().toString().padStart(2, '0') + ':00';
              const isCurrentHourSlot = hour === currentSimHour;

              return (
              <tr key={hour}>
                <td style={{ backgroundColor: isCurrentHourSlot ? '#e3f2fd' : 'inherit' }}><b>{hour}</b></td>
                {days.map(day => {
                  const cell = schedule[day]?.[hour]; 
                  // ** Logique de filtrage utilisant la propriété _id normalisée **
                  const isMyClass = cell && user && cell.profId === user._id; 
                  
                  const isVisible = currentView === 'fullSchedule' || isMyClass; 
                  
                  const isCurrentDay = day === simulatedDayName;
                  
                  let highlightStyle = {};
                  if (isCurrentDay && isCurrentHourSlot) {
                    highlightStyle = { backgroundColor: '#ffccbc', border: '2px solid #ff7043' };
                  } else if (isCurrentDay) {
                    highlightStyle = { backgroundColor: '#fff3e0' };
                  }
                  
                  const startHourInt = parseInt(hour, 10);
                  let isSessionActive = false;
                  if (!Number.isNaN(startHourInt) && isCurrentDay) {
                    const sessionStart = new Date(simulatedDateTime.getFullYear(), simulatedDateTime.getMonth(), simulatedDateTime.getDate(), startHourInt, 0, 0);
                    const sessionEnd = new Date(sessionStart.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
                    isSessionActive = simulatedDateTime >= sessionStart && simulatedDateTime < sessionEnd;
                  }

                  return (
                    <td 
                      key={day} 
                      className={cell && isVisible ? (cell.occupied ? "occupied-room" : "occupied") : "free"}
                      style={{
                        ...highlightStyle,
                        backgroundColor: cell ? (cell.occupied ? '#ffcdd2' : (highlightStyle.backgroundColor || '#d4edda')) : (highlightStyle.backgroundColor || '#f8f8f8'),
                        color: cell ? (cell.occupied ? '#c62828' : '#155724') : '#6c757d',
                        fontWeight: cell?.occupied ? 'bold' : 'normal'
                      }} 
                    >
                      {/* Afficher le contenu détaillé UNIQUEMENT si la cellule a des données ET est visible */}
                      {cell && isVisible ? (
                        <>
                          <b>{cell.roomName}</b><br />
                          <small>{cell.profName}</small><br />
                          {cell.occupied ? (
                            (isSessionEnded(day, hour) && isMyClass) ? (
                              <button
                                onClick={() => handleEndSession(day, hour, cell.scheduleId)}
                                style={{marginTop: "5px", padding: "5px 8px", borderRadius: "8px", border: "none", background: "#f44336", color: "white", cursor: "pointer"}}
                              >
                                Terminé — Libérer
                              </button>
                            ) : (
                              <div style={{fontSize:12, color:'#c62828', fontWeight:'bold'}}>🔥 Occupée</div>
                            )
                          ) : (
                            isMyClass ? (
                              <button
                                onClick={() => handlePresence(day, hour, cell.scheduleId)}
                                disabled={!isSessionActive}
                                style={{marginTop: "5px", padding: "5px 8px", borderRadius: "8px", border: "none", background: "#5a8fbf", color: "white", cursor: "pointer", opacity: isSessionActive ? 1 : 0.5}}
                              >
                                Je suis dans la salle
                              </button>
                            ) : null
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>
            );
            })}
          </tbody>
        </table>
      )}
      
      {/* --- ROOM OCCUPANCY VIEW --- */}
      {currentView === 'rooms' && (
        <RoomScheduleView roomScheduleMap={roomScheduleMap} hours={hours} days={days} profId={user._id} />
      )}
      {/* --------------------------- */}
      
      {/* Code verification modal */}
      {codeModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3001}}>
          <div style={{width:420, background:'white', borderRadius:12, padding:24, boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginTop:0, color:'#5a8fbf', textAlign:'center'}}>📌 Vérification de Présence</h2>
            <p style={{color:'#3a4a5c', textAlign:'center', marginBottom:12}}>
              Un code aléatoire a été généré par le système :
            </p>
            <div style={{background:'#f3f4f6', border:'2px solid #5a8fbf', borderRadius:8, padding:16, textAlign:'center', marginBottom:20}}>
              <p style={{fontSize:12, color:'#6f7f94', margin:'0 0 8px 0'}}>Code généré :</p>
              <p style={{fontSize:32, fontWeight:700, color:'#5a8fbf', margin:0, fontFamily:'monospace', letterSpacing:'4px'}}>
                {generatedCode}
              </p>
            </div>
            <p style={{color:'#3a4a5c', textAlign:'center', marginBottom:8, fontSize:14}}>
              Recopiez ce code exactement dans le champ ci-dessous :
            </p>
            <input
              type="text"
              placeholder="Entrez le code ici..."
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:8,
                border:'1px solid #cfe1f0',
                fontSize:16,
                boxSizing:'border-box',
                marginBottom:16,
                fontFamily:'monospace',
                letterSpacing:'2px'
              }}
            />
            <div style={{display:'flex', justifyContent:'center', gap:8}}>
              <button
                onClick={() => setCodeModalOpen(false)}
                style={{
                  padding:'10px 16px',
                  borderRadius:8,
                  border:'none',
                  background:'#e0e6ea',
                  color:'#3a4a5c',
                  cursor:'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCodeSubmit}
                style={{padding:'10px 16px', borderRadius:8, border:'none', background:'#5a8fbf', color:'white', cursor:'pointer', fontWeight:600}}
              >
                Valider le code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session ended notification modal */}
      {notificationOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000}}>
          <div style={{width:420, background:'white', borderRadius:12, padding:24, boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginTop:0, color:'#d97706', textAlign:'center'}}>⏰ Séance Terminée</h2>
            <p style={{color:'#3a4a5c', textAlign:'center', marginBottom:16}}>
              Votre séance dans la salle <b>{notificationSalle}</b> est maintenant terminée.
            </p>
            <div style={{display:'flex', justifyContent:'center', gap:8}}>
              <button
                onClick={() => setNotificationOpen(false)}
                style={{padding:'10px 16px', borderRadius:8, border:'none', background:'#e0e6ea', color:'#3a4a5c', cursor:'pointer'}}
              >
                Plus tard
              </button>
              <button
                onClick={() => {
                  const scheduleId = schedule[notificationDay]?.[notificationHour]?.scheduleId;
                  if (scheduleId) handleEndSession(notificationDay, notificationHour, scheduleId);
                }}
                style={{padding:'10px 16px', borderRadius:8, border:'none', background:'#10b981', color:'white', cursor:'pointer', fontWeight:600}}
              >
                Libérer la salle maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfDashboard;