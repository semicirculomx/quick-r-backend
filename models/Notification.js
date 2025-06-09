import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', },
  message: { type: String,  },
  type: { type: String,  }, // 'order_confirmation', 'promotion'
  read: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = model('Notification', notificationSchema);
export default Notification;
