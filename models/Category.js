import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const categorySchema = new Schema({
  name: { type: String, required: true },
  headerImage: { type: String},
  description:{type:String},
  images: [{ type: String }]
}, { timestamps: true });

const Category = model('Category', categorySchema);
export default Category;
