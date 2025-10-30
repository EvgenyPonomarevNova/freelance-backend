// check-oauth-users.js
require('dotenv').config();
const { User } = require('./models');

const checkOAuthUsers = async () => {
  try {
    console.log('👥 Checking OAuth users in database...\n');
    
    const oauthUsers = await User.findAll({
      where: {
        isOAuth: true
      }
    });
    
    console.log(`📊 Found ${oauthUsers.length} OAuth users:\n`);
    
    oauthUsers.forEach(user => {
      console.log(`   👤 ${user.email}`);
      console.log(`      Name: ${user.fullName}`);
      console.log(`      Provider: ${user.profile.oauthProvider}`);
      console.log(`      Yandex ID: ${user.profile.yandexId}`);
      console.log(`      Created: ${user.created_at}`);
      console.log('   ──────────────────────');
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit();
  }
};

checkOAuthUsers();