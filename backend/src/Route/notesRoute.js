import express from "express"
import { getAllNotes, createNote, updateNote, deleteNote, getNoteById } from "../controllers/notesController.js";
import authenticateToken from "../utilities.js";

const router = express.Router();

router.get("/",authenticateToken, getAllNotes);

router.get("/:id",authenticateToken, getNoteById);

router.post("/",authenticateToken, createNote);

router.put("/:id",authenticateToken, updateNote);

router.delete("/:id",authenticateToken, deleteNote);


export default router;


