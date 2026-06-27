import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: '',
    },
    skill: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      maxlength: 100,
    },
    percentage: {
      type: Number,
      required: [true, 'Skill percentage is required'],
      min: [0, 'Percentage must be at least 0'],
      max: [100, 'Percentage must be at most 100'],
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

skillSchema.index({ skill: 1 }, { unique: true });
skillSchema.index({ displayOrder: 1, percentage: -1 });

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
