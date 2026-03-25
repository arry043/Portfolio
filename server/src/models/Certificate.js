import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Certificate title is required'],
      trim: true,
      maxlength: 140,
    },
    image: {
      type: String,
      required: [true, 'Certificate image is required'],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    issuer: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    issuedDate: {
      type: Date,
      default: null,
    },
    issueDate: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

certificateSchema.pre('validate', function normalizeOrganization() {
  if (!this.organization && this.issuer) {
    this.organization = this.issuer;
  }

  if (!this.issuer && this.organization) {
    this.issuer = this.organization;
  }

  if (!this.organization && !this.issuer) {
    this.invalidate('organization', 'Certificate organization is required');
  }

  if (this.issueDate && !this.issuedDate) {
    this.issuedDate = this.issueDate;
  }

  if (this.issuedDate && !this.issueDate) {
    this.issueDate = this.issuedDate;
  }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
