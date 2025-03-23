import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

// Read the .env file
const envFile = fs.readFileSync('.env', 'utf8');
const envLines = envFile.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));

console.log('Found these environment variables to upload:');
envLines.forEach(line => {
  const [key] = line.split('=');
  console.log(`- ${key}`);
});

// Function to add an environment variable to Vercel
const addEnvToVercel = (key, value) => {
  try {
    console.log(`Adding ${key} to Vercel...`);
    // Write the value to a temporary file to avoid shell escaping issues
    fs.writeFileSync('.temp-env-value', value);
    execSync(`vercel env add ${key} production < .temp-env-value`, { stdio: 'inherit' });
    fs.unlinkSync('.temp-env-value');
    return true;
  } catch (error) {
    console.error(`Error adding ${key}: ${error.message}`);
    return false;
  }
};

// Process each environment variable
const processEnvVars = () => {
  let successful = 0;
  let failed = 0;

  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('='); // Rejoin in case value contains =
    
    // Remove quotes if present
    const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
    
    if (addEnvToVercel(key, cleanValue)) {
      successful++;
    } else {
      failed++;
    }
  });

  console.log(`\nCompleted: ${successful} variables added successfully, ${failed} failed`);
  
  if (successful > 0) {
    console.log('\nTo deploy with the new environment variables, run:');
    console.log('vercel --prod');
  }
};

// Ask for confirmation before proceeding
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to add these environment variables to Vercel? (y/n) ', (answer) => {
  rl.close();
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    processEnvVars();
  } else {
    console.log('Operation cancelled.');
  }
}); 