import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const TimeSlotSchema = new Schema({
  // Date and time information
  date: { 
    type: Date, 
    required: false 
  }, // Just the date portion (YYYY-MM-DD)
  startDateTime: { 
    type: String, 
    required: false,
  },
  endDateTime: { 
    type: String, 
    required: false,
  },
  // Slot status
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  // Optional metadata
  label: { 
    type: String 
  }, // e.g., "Morning", "Afternoon", or custom label
  maxCapacity: { 
    type: Number, 
    default: 1 
  },
  bookedCount: { 
    type: Number, 
    default: 0 
  },
  // Automatic timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp and availability status before saving
TimeSlotSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update availability based on capacity
  if (this.bookedCount >= this.maxCapacity) {
    this.isAvailable = false;
  }
  next();
});

// Indexes for quick lookups
TimeSlotSchema.index({ date: 1, isAvailable: 1 });
TimeSlotSchema.index({ date: 1, startTime: 1 });

export default model('TimeSlot', TimeSlotSchema);