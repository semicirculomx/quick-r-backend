import * as operatorService from '../services/operatorService.js';

export const getOperadores = async (req, res) => {
  try {
    const operadores = await operatorService.getAllOperators();
    res.json(operadores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerOperador = async (req, res) => {
  try {
    const result = await operatorService.registerOperator(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAvailableOperadores = async (req, res) => {
  try {
    const operadores = await operatorService.getAvailableOperators();
    res.json(operadores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOperadorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOperador = await operatorService.updateOperatorStatus(id, status);
    res.json(updatedOperador);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const completeOrderAndUpdateOperador = async (req, res) => {
  try {
    const { orderId, operatorId } = req.body;
    const result = await operatorService.completeOrderAndUpdateOperator(orderId, operatorId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//ai