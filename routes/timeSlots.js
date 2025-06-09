import express from 'express';
import {
  createSlot,
  getSlots,
  getSlotById,
  updateSlot,
  deleteSlot,
  getAvailableSlots,
  bookSlot,
  generateSlots,
} from '../controllers/timeSlotsController.js';
import passport from '../middlewares/passport.js';

const router = express.Router();

// Public routes
router.get('/available', getAvailableSlots); // Get all available slots
router.get('/slots/', getSlots); // Get available slots for a specific date
router.post('/:id/book', bookSlot); // Book a specific slot
router.post('/generate', generateSlots);

router.route('/')
  .post(passport.authenticate('jwt', { session: false }), createSlot)    // Create new slot
  .get(getSlots);      // Get all slots (admin view)

router.route('/:id')
  .get(getSlotById)    // Get single slot details
  .put(updateSlot)     // Update slot
  .delete(deleteSlot); // Delete slot

export default router;