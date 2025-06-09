import { createDailySlots, generateYearlySlots } from '../services/timeSlotService.js';
import {
  createTimeSlotService,
  getAllSlotsService,
  getAvailableSlotsService,
  getSlotByIdService,
  updateSlotService,
  deleteSlotService,
  bookSlotService
} from '../services/timeSlotService.js';

// @desc    Create a new time slot
// @route   POST /api/slots
// @access  Admin
export const createSlot = async (req, res, next) => {
  try {
    const slotData = req.body;
    const newSlot = await createTimeSlotService(slotData);
    res.status(201).json(newSlot);
  } catch (error) {
    next(error);
  }
};

export const bulkCreateSlots = async (req, res, next) => {
  try {
    const slotsData = req.body; // Expecting an array of slot objects
    if (!Array.isArray(slotsData) || slotsData.length === 0) {
      return res.status(400).json({ message: 'Invalid slots data' });
    }
    
    const createdSlots = await createDailySlots(slotsData.startDate, slotsData.endDate, slotsData.times);
    res.status(201).json(createdSlots);
  } catch (error) {
    next(error);
  }
}

// @desc    Get all slots
// @route   GET /api/slots
// @access  Admin
export const getSlots = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const slots = await getAllSlotsService(startDate, endDate);
    res.status(200).json({slots, success: true});
  } catch (error) {
    next(error);
  }
};

// @desc    Get available slots
// @route   GET /api/slots/available
// @access  Public
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    const slots = await getAvailableSlotsService(date);
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single slot
// @route   GET /api/slots/:id
// @access  Admin
export const getSlotById = async (req, res, next) => {
  try {
    const slot = await getSlotByIdService(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    res.json(slot);
  } catch (error) {
    next(error);
  }
};

export const generateSlots = async (req, res) => {
  const { year, options } = req.body;
  const result = await generateYearlySlots(year, options);
  
  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(500).json(result);
  }
};

// @desc    Update a slot
// @route   PUT /api/slots/:id
// @access  Admin
export const updateSlot = async (req, res, next) => {
  try {
    const updatedSlot = await updateSlotService(req.params.id, req.body);
    if (!updatedSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    res.json(updatedSlot);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a slot
// @route   DELETE /api/slots/:id
// @access  Admin
export const deleteSlot = async (req, res, next) => {
  try {
    const result = await deleteSlotService(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    res.json({ message: 'Time slot removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a time slot
// @route   POST /api/slots/:id/book
// @access  Private
export const bookSlot = async (req, res, next) => {
  try {
    const result = await bookSlotService(req.params.id);
    res.json({
      success: true,
      slot: result,
      message: 'Slot booked successfully'
    });
  } catch (error) {
    next(error);
  }
};