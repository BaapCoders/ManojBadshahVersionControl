import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET_NAME!,
  },
  python: {
    serverUrl: process.env.PYTHON_SERVER_URL || 'http://localhost:9000',
  },
};

if (!config.meta.accessToken || !config.meta.phoneNumberId || !config.meta.webhookVerifyToken) {
  console.error('❌ Missing Meta environment variables');
  process.exit(1);
}

if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !config.aws.s3Bucket) {
  console.error('❌ Missing AWS S3 environment variables');
  console.error('Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME');
  process.exit(1);
}

console.log('✅ Config loaded');
console.log('✅ AWS S3 Bucket:', config.aws.s3Bucket);
