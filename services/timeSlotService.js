import TimeSlot from '../models/TimeSlot.js';

// Service to create a new time slot
export const createTimeSlotService = async (slotData) => {
  const { date, startTime, endTime } = slotData;

  // Validate required fields
  if (!date || !startTime || !endTime) {
    throw new Error('Please provide date, start time, and end time');
  }

  // Check for time conflicts
  const conflictingSlot = await TimeSlot.findOne({
    date,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  });

  if (conflictingSlot) {
    throw new Error('Time slot conflicts with an existing slot');
  }

  return await TimeSlot.create(slotData);
};

export const createDailySlots = async (startDate, endDate, times) => {
  const slots = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    for (const time of times) {
      slots.push({
        date: new Date(currentDate),
        startTime: time.start,
        endTime: time.end,
        label: time.label
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  await TimeSlot.insertMany(slots);

    return slots;
};
/**
 * Generates time slots for an entire year (Monday-Saturday, 9AM-7PM)
 * @param {number} year - The year to generate slots for (e.g., 2024)
 * @param {Object} [options] - Configuration options
 * @param {number} [options.startHour=9] - Starting hour (9 for 9AM)
 * @param {number} [options.endHour=19] - Ending hour (19 for 7PM)
 * @param {number} [options.slotDuration=60] - Slot duration in minutes
 * @param {number} [options.maxCapacity=1] - Maximum bookings per slot
 * @returns {Promise<Object>} - Result of the operation
 */
export const generateYearlySlots = async (
  year,
  {
    startHour = 9,
    endHour = 19,
    slotDuration = 60,
    maxCapacity = 1
  } = {}
) => {
  try {
    // Validate input year
    if (!year || year < new Date().getFullYear()) {
      throw new Error('Invalid year provided');
    }

    // Calculate date range
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    // Delete existing slots for this year first (optional)
    await TimeSlot.deleteMany({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Generate all slots
    const slotsToInsert = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
  if (currentDate.getDay() !== 0) {
    for (let hour = startHour; hour < endHour; hour++) {
      // Crea el slot como un Date 
      const slotStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        hour, 0, 0, 0
      );

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

      slotsToInsert.push({
        startDateTime: slotStart.toISOString(),
        endDateTime: slotEnd.toISOString(),
        duration: slotDuration,
        isAvailable: true,
        maxCapacity,
        bookedCount: 0,
      });
    }
  }
  currentDate.setDate(currentDate.getDate() + 1);
}

    // Insert in batches for better performance
    const batchSize = 500;
    for (let i = 0; i < slotsToInsert.length; i += batchSize) {
      const batch = slotsToInsert.slice(i, i + batchSize);
      await TimeSlot.insertMany(batch);
    }

    return {
      success: true,
      message: `Successfully generated ${slotsToInsert.length} time slots for ${year}`,
      generatedCount: slotsToInsert.length
    };

  } catch (error) {
    console.error('Error generating yearly slots:', error);
    return {
      success: false,
      message: 'Failed to generate time slots',
      error: error.message
    };
  }
};

// Service to get all slots (admin view)
export const getAllSlotsService = async (startDate, endDate) => {
  let query = {};
  
  if (startDate && endDate) {
    query.startDateTime = {
      $gte: new Date(startDate).toISOString(),
      $lte: new Date(endDate).toISOString()
    };
  }
  const slots = await TimeSlot.find(query).sort({ startDateTime: 1 });
  console.log('Fetched slots:', slots.length);

  return slots ? slots : [];
  
};

// Service to get available slots with date range filtering
export const getAvailableSlotsService = async ({ startDate, endDate } = {}) => {
  try {
    const query = { isAvailable: true };
    
    // Handle date range filtering
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      // If only startDate is provided, get slots from that date onward
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      // If only endDate is provided, get slots up to that date
      query.date = { $lte: new Date(endDate) };
    } else {
      // Default to today and future dates if no dates provided
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const slots = await TimeSlot.find(query)
      .sort({ date: 1, startTime: 1 })
      .select('-createdAt -updatedAt -__v');

    return slots;
  } catch (error) {
    console.error('Error in getAvailableSlotsService:', error);
    throw new Error('Failed to fetch available slots');
  }
};

// Service to get slot by ID
export const getSlotByIdService = async (id) => {
  return await TimeSlot.findById(id);
};

// Service to update a slot
export const updateSlotService = async (id, updateData) => {
  const slot = await TimeSlot.findById(id);
  if (!slot) return null;

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      slot[key] = updateData[key];
    }
  });

  // Recalculate availability if capacity was changed
  if (updateData.maxCapacity && slot.bookedCount >= updateData.maxCapacity) {
    slot.isAvailable = false;
  }

  return await slot.save();
};

// Service to delete a slot
export const deleteSlotService = async (id) => {
  const slot = await TimeSlot.findById(id);
  if (!slot) return null;

  // Prevent deletion of slots with bookings
  if (slot.bookedCount > 0) {
    throw new Error('Cannot delete slot with existing bookings');
  }

  await slot.remove();
  return true;
};

// Service to book a slot
export const bookSlotService = async (id) => {
  const slot = await TimeSlot.findById(id);
  if (!slot) {
    throw new Error('Time slot not found');
  }

  if (!slot.isAvailable) {
    throw new Error('This time slot is not available');
  }

  slot.bookedCount += 1;
  
  if (slot.bookedCount >= slot.maxCapacity) {
    slot.isAvailable = false;
  }

  return await slot.save();
};