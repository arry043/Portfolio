import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resume title is required'],
      trim: true,
      maxlength: 140,
    },
    category: {
      type: String,
      enum: ['fullstack', 'backend', 'frontend', 'python', 'ai'],
      required: [true, 'Resume category is required'],
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Resume file URL is required'],
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    storageProvider: {
      type: String,
      enum: ['cloudinary'],
      default: 'cloudinary',
    },
  },
  { timestamps: true }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
