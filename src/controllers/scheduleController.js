import Schedule from "../models/Schedule.js";
import mongoose from "mongoose";

export const createSchedule = async (req, res) => {
  try {
    const { roomId, profId, startTime, endTime, subject, dayOfWeek } = req.body;

    if (!roomId || !profId || !startTime || !endTime || !subject || dayOfWeek === undefined) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const newSchedule = new Schedule({
      roomId: new mongoose.Types.ObjectId(roomId),
      profId: new mongoose.Types.ObjectId(profId),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      subject,
      dayOfWeek: Number(dayOfWeek),
    });

    const savedSchedule = await newSchedule.save();
    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate("roomId", "name capacity location")
      .populate("profId", "username name role");
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Optionnel : update et delete plus tard
export const updateSchedule = async (req, res) => res.status(501).send("Not implemented");
export const deleteSchedule = async (req, res) => res.status(501).send("Not implemented");
