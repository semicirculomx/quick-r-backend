import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const bannerSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product' }
}, { timestamps: true });

const Banner = model('Banner', bannerSchema);
export default Banner;
