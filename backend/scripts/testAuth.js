const axios = require('axios');

const testAuth = async () => {
  try {
    console.log('Testing authentication...');
    
    // Test login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'student@demo.com',
      password: 'password123'
    });
    
    console.log('Login successful!');
    console.log('Token length:', loginResponse.data.token.length);
    
    // Test /me endpoint
    const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('Me endpoint successful!');
    console.log('User:', meResponse.data.user.name, '(' + meResponse.data.user.role + ')');
    
    // Test instructor login
    const instructorResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'instructor@demo.com',
      password: 'password123'
    });
    
    console.log('Instructor login successful!');
    
    const instructorMeResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${instructorResponse.data.token}`
      }
    });
    
    console.log('Instructor me endpoint successful!');
    console.log('Instructor:', instructorMeResponse.data.user.name, '(' + instructorMeResponse.data.user.role + ')');
    
    console.log('\n✅ All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:');
    console.error('Error:', error.response?.data || error.message);
  }
};

testAuth();
