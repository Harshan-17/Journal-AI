const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

async function makeAdmin() {
  const email = 'harshan1339a@gmail.com';
  try {
    const user = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully made ${email} an admin.`);
  } catch (err) {
    console.error(err);
  }
}

makeAdmin();
