import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: 2000,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ['MERN', 'Django', 'AI'],
      required: [true, 'Project category is required'],
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    github: {
      type: String,
      default: '',
    },
    live: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40,
    },
    projectDate: {
      type: Date,
      default: null,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
