import { 
  getUsuarios as getUsuariosService, 
  getUsuario as getUsuarioService, 
  createUsuario as createUsuarioService, 
  updateUsuario as updateUsuarioService, 
  deleteUsuario as deleteUsuarioService, 
  editUsuarioAdmin as editUsuarioAdminService 
} from '../services/userService.js';

export async function getUsuarios(req, res) {
  try {
    const usuarios = await getUsuariosService();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUsuario(req, res) {
  try {
    const { id } = req.params;
    const usuario = await getUsuarioService(id);
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createUsuario(req, res) {
  try {
    const newUsuario = await createUsuarioService(req.body);
    res.status(201).json(newUsuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateUsuario(req, res) {
  try {
    const { id } = req.params;
    const updatedUsuario = await updateUsuarioService(id, req.body);
    res.json(updatedUsuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteUsuario(req, res) {
  try {
    const { id } = req.params;
    await deleteUsuarioService(id);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function editUsuarioAdmin(req, res) {
  try {
    const { id } = req.params;
    const updatedUsuario = await editUsuarioAdminService(id, req.body);
    res.json(updatedUsuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
