import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: 140,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: 140,
    },
    duration: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isCurrentlyWorking: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

experienceSchema.pre('validate', function validateDateRange() {
  if (this.isCurrentlyWorking) {
    this.endDate = null;
  }

  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'End date must be greater than or equal to start date');
  }
});

const Experience = mongoose.model('Experience', experienceSchema);

export default Experience;
