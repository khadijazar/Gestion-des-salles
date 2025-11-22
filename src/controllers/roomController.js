import Room from "../models/Room.js";

// GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { name, capacity, location, features } = req.body;

    const newRoom = new Room({ name, capacity, location, features });
    await newRoom.save();

    res.status(201).json({ message: "Salle créée avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ message: "Salle non trouvée" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Salle non trouvée" });
    res.json({ message: "Salle supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


