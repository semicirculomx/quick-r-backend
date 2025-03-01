import Usuario from '../models/Usuario.js';

export async function getUsuarios() {
  // Retrieve all users from the database
  return await Usuario.find();
}

export async function getUsuario(id) {
  // Retrieve a single user by id
  return await Usuario.findById(id);
}

export async function createUsuario(userData) {
  // Create and save a new user in the database
  const newUsuario = new Usuario(userData);
  return await newUsuario.save();
}

export async function updateUsuario(id, userData) {
  // Update the user with the provided id
  return await Usuario.findByIdAndUpdate(id, userData, { new: true });
}

export async function deleteUsuario(id) {
  // Delete the user from the database
  await Usuario.findByIdAndDelete(id);
  return;
}

export async function editUsuarioAdmin(id, changes) {
  // For admin modifications: update the user with complete modifications allowed
  return await Usuario.findByIdAndUpdate(id, changes, { new: true });
}
