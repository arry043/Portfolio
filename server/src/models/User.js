import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email address'
    ]
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if provider is 'local' (Google OAuth users don't need one)
      return this.provider === 'local';
    },
    minlength: 6,
    select: false // Avoid returning the password block by default in queries
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profileImage: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);
export default User;
