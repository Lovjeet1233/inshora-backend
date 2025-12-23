import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Settings from '../src/models/Settings';

// Load environment variables
dotenv.config();

const addUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://LOVJEET:LOVJEETMONGO@cluster0.zpzj90m.mongodb.net/Inshoraa?retryWrites=true&w=majority";
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // User details
    const email = 'lovjeet@gmail.com';
    const password = 'test123';
    const name = 'Lovjeet Singh';
    const role = 'admin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('⚠️  User already exists with this email');
      console.log('📧 Email:', email);
      console.log('👤 User ID:', existingUser._id);
      
      // Check if settings exist
      const existingSettings = await Settings.findOne({ userId: existingUser._id });
      
      if (!existingSettings) {
        console.log('📝 Creating default settings for existing user...');
        const settings = new Settings({
          userId: existingUser._id
        });
        await settings.save();
        console.log('✅ Settings created');
      } else {
        console.log('✅ Settings already exist');
      }
      
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      return;
    }

    // Create new user
    console.log('👤 Creating new user...');
    const user = new User({
      email,
      password, // Will be hashed automatically by the pre-save hook
      name,
      role
    });

    await user.save();
    console.log('✅ User created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('🎭 Role:', role);
    console.log('🆔 User ID:', user._id);

    // Create default settings for the user
    console.log('📝 Creating default settings...');
    const settings = new Settings({
      userId: user._id
    });

    await settings.save();
    console.log('✅ Settings created successfully!');
    console.log('🆔 Settings ID:', settings._id);

    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    console.log('\n🎉 User setup complete!');
    console.log('You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Duplicate key error - User with this email already exists');
    }
    process.exit(1);
  }
};

// Run the script
addUser();

