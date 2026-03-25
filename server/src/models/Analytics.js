import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: [true, 'Page is required'],
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ page: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
