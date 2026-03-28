import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: [true, 'Page is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: true,
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
    chatbotUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    gameUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    projectViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastEventAt: {
      type: Date,
      default: null,
    },
    lastEventMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ page: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
