CloudResume — Resume Builder & AWS‑deployable

CloudResume is a lightweight, browser-first resume builder that combines an interactive resume editor with a deployable static site and a SQL-backed visitor counter. Create, preview, and export resume pages in the browser; host the result on AWS S3 and use AWS Lambda (or a small server) with Amazon RDS/Aurora to persist visit counts.


## Key features
- Upload resume PDFs and save to S3
- Generate pre-signed S3 URLs for secure downloads
- Basic signup / login endpoints backed by MySQL
- Simple static frontend served from `public` folder

## Quick facts
- Start command: `npm start` (runs `node server.js`)
- Main file: `server.js`
- Procfile: `web: node server.js` (useful for Heroku / Elastic Beanstalk)
- Dependencies: Express, Multer, mysql2, AWS SDK v3, dotenv, cors

## Prerequisites
- Node.js (16+ recommended)
- npm
- An AWS S3 bucket and credentials (or IAM role)
- A MySQL database (RDS or local)

## Environment variables (.env)
Create a `.env` file in the project root and add the following values (do NOT commit `.env`):

```
PORT=8081
CORS_ORIGIN=
AWS_REGION=your-aws-region
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
# DB values prefer using env vars rather than hardcoding in server.js
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

Note: `server.js` in this repo currently contains a MySQL connection object; replace hard-coded values with env vars for security.

## Install and run locally
1. Install dependencies

```powershell
npm install
```

2. Create `.env` with the variables above.

3. Run the app

```powershell
npm start
```

The server listens on `PORT` (default 8081).

## API endpoints (overview)
- `GET /` — serves `public/index.html` if present
- `GET /test-db` — runs a simple DB query to test MySQL connectivity
- `POST /signup` — body: `{ email, password }` — creates a user
- `POST /login` — body: `{ email, password }` — authenticates a user
- `GET /resumes?userId=<id>` — lists resumes for a user and returns pre-signed download URLs
- `POST /upload-resume` — form-data: `resume` file + `userId` — upload a resume to S3
- `POST /save-resume-from-builder` — form-data: `resumePdf` + `userId` + `resumeData` — saves builder-generated PDF with metadata

For implementation details, see `server.js`.

## Database schema (example)
Run these SQL statements to create the required tables:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  s3_key VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## AWS / Deployment notes
- This project is prepared for deployment to services like Elastic Beanstalk or Heroku (see `Procfile`).
- See `AWS_SETUP.md` and `DEPLOYMENT_GUIDE.md` for step-by-step S3 and Elastic Beanstalk instructions.
- In production, prefer IAM roles for S3 access and never store access keys in source control.

## Security
- Do not commit `.env`; add it to `.gitignore`.
- Replace any hard-coded credentials in `server.js` with env variables.
- Restrict S3 bucket access via IAM and bucket policies.

## Suggested next steps
- Add a `.gitignore` (include `node_modules/` and `.env`).
- Add basic tests for endpoints (supertest + jest or similar).
- Add CI (GitHub Actions) and linting.

## License & author
Add your name and license here (e.g., MIT).

---
If you want, I can also: add a `.gitignore`, open a PR adding the README to your repo, or create a condensed README tailored for GitHub's top-of-repo display. Which would you like next?

## AWS S3 Setup Instructions

### Prerequisites
1. Create an AWS account if you don't have one
2. Create an S3 bucket for storing resumes

### Steps to configure AWS S3:

#### 1. Create S3 Bucket
1. Go to AWS S3 Console
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., "my-resume-builder-bucket")
4. Select your preferred region
5. Keep default settings and create the bucket

#### 2. Create IAM User
1. Go to AWS IAM Console
2. Click "Users" → "Create user"
3. Enter username (e.g., "resume-builder-user")
4. Click "Next"
5. Choose "Attach policies directly"
6. Search and select "AmazonS3FullAccess" (or create a custom policy for specific bucket access)
7. Click "Next" and "Create user"

#### 3. Create Access Keys
1. Click on the created user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Choose "Application running outside AWS"
5. Click "Next" and "Create access key"
6. **IMPORTANT**: Copy the Access Key ID and Secret Access Key

#### 4. Update .env file
Replace the placeholder values in `.env` file with your actual AWS credentials:

```
AWS_REGION=us-east-1                    # Your bucket region
AWS_BUCKET_NAME=my-resume-builder-bucket # Your bucket name
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_HERE   # From IAM user
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE # From IAM user
```

#### 5. Database Setup
Make sure your MySQL database has the required table:

```sql
CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Security Note
- Never commit your `.env` file to version control
- The `.env` file contains sensitive credentials
- Consider using IAM roles instead of access keys for production

## AWS Deployment Guide

This guide explains how to deploy your Node.js Resume Builder app using AWS services: Elastic Beanstalk, S3, and RDS. It covers all connections, including login, file upload, and database setup.

### 1. AWS Services Used
- **Elastic Beanstalk**: Hosts and manages your Node.js application.
- **S3**: Stores uploaded resume PDFs securely.
- **RDS (MySQL)**: Stores user and resume metadata.
- **IAM**: Manages credentials and permissions for S3 and RDS access.

### 2. Prerequisites
- AWS account
- Node.js project (this repo)
- S3 bucket created for resumes
- RDS MySQL instance created and accessible
- IAM user with S3 access keys
- SQL Workbench/J for database management

### 3. Project Structure
```
├── .ebextensions/           # Elastic Beanstalk environment configs
├── .env                    # Local environment variables (not uploaded)
├── Procfile                # Tells EB how to start the app
├── server.js               # Main Node.js backend
├── scripts.js              # Frontend logic
├── builder.html, ...       # Frontend pages
├── package.json            # Node.js dependencies
```

### 4. Database Setup (RDS)
1. Create a MySQL RDS instance in AWS.
2. Use SQL Workbench/J to connect and run:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```
3. Make sure the RDS security group allows inbound traffic from Elastic Beanstalk.

### 5. S3 Setup
1. Create an S3 bucket (e.g., `my-resume-bucket`).
2. Create an IAM user with `AmazonS3FullAccess` or a custom policy for your bucket.
3. Store the access key and secret key securely.
4. Update your Elastic Beanstalk environment variables with these credentials.

#### S3 Bucket Setup Instructions (short)
1. Go to the AWS S3 Console and create a bucket with a unique name in your chosen region.
2. Keep bucket private (block public access) for resume storage.

#### Create an IAM User for S3 Access (short)
1. In IAM, add a user with Programmatic access.
2. Attach `AmazonS3FullAccess` or a custom policy limited to your bucket.
3. Copy the Access Key ID and Secret Access Key.

#### Add IAM Credentials to Elastic Beanstalk
In the EB Console: Configuration → Software → Environment properties. Add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_BUCKET_NAME`
- `AWS_REGION`

#### Optional S3 Bucket Policy Example
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/resume-builder-user"},
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::my-resume-bucket",
        "arn:aws:s3:::my-resume-bucket/*"
      ]
    }
  ]
}
```

Replace `YOUR_ACCOUNT_ID` and `my-resume-bucket` with your values.

### 6. Elastic Beanstalk Setup
1. Install the EB CLI or use the AWS Console.
2. Ensure a `Procfile` exists with:
```
web: node server.js
```
3. Add `.ebextensions/01_env.config` to set environment variables if desired.
4. Zip the project (exclude `node_modules` and `.env`) and deploy via EB CLI or Console:

```
eb init
eb create resume-builder-env
eb open
```

### 7. Environment Variables
Set these in Elastic Beanstalk or your hosting environment:
- `AWS_REGION`
- `AWS_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### 8. Application Connections
- **Login/Signup**: User credentials are stored in RDS. The backend checks credentials on login.
- **Resume Upload**: After login, user uploads a resume. The backend receives the PDF, uploads it to S3, and stores metadata in RDS.
- **Resume Fetch/Download**: The backend generates a pre-signed S3 URL for secure download.
- **Frontend/Backend**: Frontend uses fetch/XHR to communicate with backend endpoints for login, upload, and fetch.

### 9. Security Checklist
- Never commit `.env` or AWS credentials to version control.
- Use IAM roles for production if possible.
- Restrict S3 bucket and RDS access to only necessary resources.
- Use HTTPS for all connections.

### 10. Troubleshooting
- **DB Connection Issues**: Check RDS security group and credentials.
- **S3 Upload Issues**: Check IAM permissions and bucket policy.
- **App Not Starting**: Check `Procfile` and environment variables.

### 11. Useful Links
- Elastic Beanstalk Docs: https://docs.aws.amazon.com/elasticbeanstalk/
- S3 Docs: https://docs.aws.amazon.com/s3/
- RDS Docs: https://docs.aws.amazon.com/rds/
- EB CLI Install: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html

---

