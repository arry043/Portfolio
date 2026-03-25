import mongoose from 'mongoose';

const resumeChunkSchema = new mongoose.Schema(
  {
    index: Number,
    text: String,
    tokens: [String],
  },
  { _id: false }
);

const resumeKnowledgeSchema = new mongoose.Schema(
  {
    sourceName: {
      type: String,
      default: 'resume',
      trim: true,
    },
    rawText: {
      type: String,
      default: '',
    },
    chunks: {
      type: [resumeChunkSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const ResumeKnowledge = mongoose.model('ResumeKnowledge', resumeKnowledgeSchema);

export default ResumeKnowledge;
