import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const subcategorySchema = new Schema({
    name: { type: String },
  image: { type: String },
  description:{type:String},
}, { timestamps: true });

const Subcategory = model('Subcategory', subcategorySchema);
export default Subcategory;