# CloudResume — Resume Builder & Portfolio

> A lightweight, cloud-native resume builder with AWS integration. Build, store, and share professional resumes with S3 storage, RDS database, and serverless deployment options.

CloudResume is a full-stack resume builder application that enables users to create, upload, and manage resume PDFs through a browser-based interface. The backend stores resumes securely in AWS S3 and maintains metadata in a MySQL database (RDS), while the frontend provides an intuitive builder interface with authentication.

## ✨ Features

- **Resume Upload & Storage** — Upload resume PDFs directly to AWS S3 with automatic metadata tracking
- **Secure Download URLs** — Generate pre-signed S3 URLs for time-limited, secure resume downloads
- **User Authentication** — Email/password signup and login backed by MySQL
- **Resume Builder UI** — Interactive browser-based resume editor with live preview
- **Cloud-Native Architecture** — Built for AWS Elastic Beanstalk, S3, and RDS deployment

## 🚀 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL (AWS RDS)
- **Storage:** AWS S3
- **Key Libraries:** Multer (file upload), AWS SDK v3, mysql2, dotenv, cors
- **Deployment:** Elastic Beanstalk, Heroku (via Procfile)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16+ recommended) and npm
- **AWS Account** with:
  - An S3 bucket for resume storage
  - IAM credentials (or IAM role for EC2/EB instances)
- **MySQL Database** (AWS RDS or local instance)
- **Environment Variables** configured (see below)

## ⚙️ Environment Setup

Create a `.env` file in the project root with the following variables:

```bash
# Server Configuration
PORT=8081
CORS_ORIGIN=

# AWS Configuration
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Database Configuration (MySQL/RDS)
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

> **⚠️ Security Note:** Never commit `.env` files to version control. Add `.env` to your `.gitignore` file.

## 🔧 Installation & Local Development

1. **Clone the repository**
   ```powershell
   git clone https://github.com/yourusername/cloudresume.git
   cd cloudresume
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file with the variables listed above
   - Replace placeholder values with your actual AWS and database credentials

4. **Set up the database**
   - Run the SQL schema (see [Database Schema](#database-schema) section below)

5. **Start the development server**
   ```powershell
   npm start
   ```

6. **Access the application**
   - Open your browser to `http://localhost:8081`

## 📊 Database Schema

Run these SQL statements to create the required tables in your MySQL database:

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes table
CREATE TABLE resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  s3_key VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## ☁️ AWS Deployment

This application is designed for deployment on AWS using the following services:

### Architecture Overview

- **Elastic Beanstalk** — Application hosting and management
- **S3** — Resume PDF storage with pre-signed URL downloads
- **RDS (MySQL)** — User and resume metadata persistence
- **IAM** — Secure credential and permission management

### Quick Deployment Steps

1. **Prepare AWS Resources**
   - Create an S3 bucket for resume storage
   - Launch an RDS MySQL instance
   - Create an IAM user with S3 access (or use instance roles)

2. **Deploy to Elastic Beanstalk**
   ```powershell
   # Initialize EB application
   eb init
   
   # Create environment and deploy
   eb create cloudresume-env
   
   # Open the deployed application
   eb open
   ```

3. **Configure Environment Variables**
   - Set variables in EB Console: **Configuration → Software → Environment properties**
   - Or use the CLI:
     ```powershell
     eb setenv AWS_REGION=ap-south-1 AWS_BUCKET_NAME=your-bucket DB_HOST=your-rds-endpoint DB_USER=admin DB_PASSWORD=yourpassword DB_NAME=cloudresume
     ```

4. **Configure Security Groups**
   - Allow EB instances to access RDS (inbound port 3306 from EB security group)
   - Restrict S3 bucket access via IAM policies

For detailed deployment instructions, see the **[AWS Deployment Guide](#aws-deployment-guide-detailed)** section below.

---

## 🔒 Security Best Practices

- ✅ **Never commit credentials** — Add `.env`, `.ebextensions/01_env.config` with real secrets to `.gitignore`
- ✅ **Use IAM roles** — Prefer instance profiles over hardcoded access keys in production
- ✅ **Rotate credentials regularly** — Especially if accidentally exposed
- ✅ **Use Secrets Manager** — Store DB passwords and API keys in AWS Secrets Manager
- ✅ **Enable HTTPS** — Use ACM certificates and enforce SSL/TLS
- ✅ **Restrict S3 access** — Use bucket policies and private buckets with pre-signed URLs
- ✅ **Validate input** — Sanitize user inputs to prevent SQL injection

---

## 📁 Project Structure

```
cloudresume/
├── .ebextensions/           # Elastic Beanstalk configuration files
│   └── 01_env.config.example  # Environment variables template (safe to commit)
├── public/                  # Static frontend files
│   ├── index.html           # Landing page
│   ├── auth.html            # Login/signup page
│   ├── builder.html         # Resume builder interface
│   ├── dashboard.html       # User dashboard
│   ├── scripts.js           # Frontend JavaScript
│   └── styles.css           # Styling
├── server.js                # Main Express server
├── package.json             # Node.js dependencies
├── Procfile                 # Process file for Heroku/EB deployment
├── .env                     # Local environment variables (DO NOT COMMIT)
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## 🛠️ Development Tips

- **Testing DB Connection:** Visit `/test-db` endpoint to verify MySQL connectivity
- **Local S3 Testing:** Use LocalStack or Minio for local S3 simulation
- **Debugging:** Check `server.js` console logs and EB logs via `eb logs`
- **Hot Reload:** Use `nodemon` for auto-restart during development:
  ```powershell
  npm install -g nodemon
  nodemon server.js
  ```

---

## 📚 Additional Resources

- **AWS Documentation:**
  - [Elastic Beanstalk Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
  - [S3 Developer Guide](https://docs.aws.amazon.com/s3/)
  - [RDS User Guide](https://docs.aws.amazon.com/rds/)
- **Tools:**
  - [EB CLI Installation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html)
  - [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Your Name**  
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- AWS Free Tier for hosting resources
- Express.js and Node.js communities
- Open-source contributors

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

</div>

---

## AWS Deployment Guide (Detailed)

## AWS Deployment Guide (Detailed)

This comprehensive guide walks you through deploying CloudResume to AWS using Elastic Beanstalk, S3, and RDS.

### 1️⃣ AWS Services Overview

| Service | Purpose |
|---------|---------|
| **Elastic Beanstalk** | Hosts and auto-scales the Node.js application |
| **S3** | Stores uploaded resume PDFs securely |
| **RDS (MySQL)** | Stores user accounts and resume metadata |
| **IAM** | Manages access permissions and credentials |

### 2️⃣ S3 Bucket Setup

1. **Create S3 Bucket**
   - Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
   - Click **Create bucket**
   - Enter a unique bucket name (e.g., `cloudresume-storage-2025`)
   - Select your preferred region (e.g., `ap-south-1`)
   - **Block all public access** (resumes will be accessed via pre-signed URLs)
   - Click **Create bucket**

2. **Create IAM User for S3 Access**
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Navigate to **Users** → **Create user**
   - Username: `cloudresume-s3-user`
   - Select **Programmatic access**
   - Attach policy: **AmazonS3FullAccess** (or create a custom policy for your specific bucket)
   - Complete user creation and **save the Access Key ID and Secret Access Key**

3. **Optional: Custom S3 Bucket Policy** (for fine-grained access)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/cloudresume-s3-user"
         },
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

### 3️⃣ RDS Database Setup

1. **Create MySQL RDS Instance**
   - Go to [RDS Console](https://console.aws.amazon.com/rds/)
   - Click **Create database**
   - Choose **MySQL** engine
   - Template: **Free tier** (for testing) or **Production** (for live apps)
   - Settings:
     - DB instance identifier: `cloudresume-db`
     - Master username: `admin`
     - Master password: *Create a strong password*
   - Instance configuration: `db.t3.micro` (free tier eligible)
   - Storage: 20 GB SSD
   - Connectivity:
     - VPC: Default VPC
     - Public access: **No** (for security)
     - VPC security group: Create new or select existing
   - Click **Create database**

2. **Configure Security Group**
   - Edit the RDS security group
   - Add inbound rule:
     - Type: **MySQL/Aurora**
     - Port: **3306**
     - Source: Security group of your Elastic Beanstalk environment

3. **Initialize Database Schema**
   - Use a MySQL client (MySQL Workbench, DBeaver, or CLI) to connect
   - Run the SQL schema from the [Database Schema](#-database-schema) section above

### 4️⃣ Elastic Beanstalk Deployment

1. **Install EB CLI** (if not already installed)
   ```powershell
   pip install awsebcli --upgrade --user
   ```

2. **Initialize Elastic Beanstalk**
   ```powershell
   cd cloudresume
   eb init
   ```
   - Select your region (e.g., `ap-south-1`)
   - Create new application: `cloudresume`
   - Platform: **Node.js**
   - Platform branch: Latest Node.js version
   - Use CodeCommit: **No**
   - SSH: **Yes** (recommended for debugging)

3. **Create Environment and Deploy**
   ```powershell
   eb create cloudresume-env
   ```
   - This command:
     - Creates an environment
     - Uploads your application
     - Provisions resources (EC2, Load Balancer, etc.)
     - Deploys the app

4. **Set Environment Variables**
   
   **Option A: Via EB Console**
   - Go to Elastic Beanstalk Console
   - Select your environment
   - Configuration → Software → Environment properties
   - Add each variable:
     ```
     AWS_REGION = ap-south-1
     AWS_BUCKET_NAME = your-bucket-name
     AWS_ACCESS_KEY_ID = your-access-key
     AWS_SECRET_ACCESS_KEY = your-secret-key
     DB_HOST = your-rds-endpoint.rds.amazonaws.com
     DB_USER = admin
     DB_PASSWORD = your-db-password
     DB_NAME = cloudresume
     ```

   **Option B: Via EB CLI**
   ```powershell
   eb setenv AWS_REGION=ap-south-1 AWS_BUCKET_NAME=your-bucket DB_HOST=your-rds-endpoint.rds.amazonaws.com DB_USER=admin DB_PASSWORD=yourpassword DB_NAME=cloudresume
   ```

5. **Open Your Application**
   ```powershell
   eb open
   ```

### 5️⃣ Security Configuration

**Important Security Steps:**

1. **Never commit credentials to Git**
   - Add to `.gitignore`:
     ```
     .env
     .ebextensions/01_env.config
     node_modules/
     ```

2. **Use IAM Roles (Recommended for Production)**
   - Instead of access keys, attach an IAM role to EB instances
   - Create a role with `AmazonS3FullAccess` policy
   - Attach to EB environment: Configuration → Security → IAM instance profile

3. **Rotate Exposed Credentials**
   - If you accidentally commit credentials:
     - Delete the access key in IAM
     - Change RDS password
     - Purge secrets from Git history (use BFG Repo-Cleaner)

4. **Enable HTTPS**
   - Request an SSL certificate via AWS Certificate Manager (ACM)
   - Configure your EB load balancer to use HTTPS

### 6️⃣ Application Workflow

```
User → Browser → Elastic Beanstalk (Node.js) → S3 (Resume Storage)
                            ↓
                         RDS MySQL (User & Metadata)
```

- **Login/Signup:** Credentials validated against RDS
- **Resume Upload:** File uploaded to S3, metadata saved to RDS
- **Resume Download:** Pre-signed S3 URL generated for secure access

### 7️⃣ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Cannot connect to RDS** | Check security group allows inbound from EB security group on port 3306 |
| **S3 upload fails** | Verify IAM user has S3 permissions; check bucket name and region |
| **Application won't start** | Check EB logs: `eb logs` or view in EB Console |
| **Environment variables not set** | Verify in EB Console → Configuration → Software |

### 8️⃣ Monitoring & Logs

- **View logs:**
  ```powershell
  eb logs
  ```
- **Monitor health:**
  ```powershell
  eb health
  ```
- **CloudWatch:** Set up alarms for CPU, memory, and request count

### 9️⃣ Updating Your Application

```powershell
# Make changes to your code
git add .
git commit -m "Update feature"

# Deploy to EB
eb deploy
```

### 🔟 Cost Optimization

- **Free Tier Resources:**
  - EC2 t2.micro (750 hours/month)
  - RDS db.t2.micro (750 hours/month)
  - S3 5GB storage, 20,000 GET requests
- **Stop dev environments** when not in use: `eb terminate cloudresume-env`
- **Use RDS Aurora Serverless** for variable traffic (scales to zero)

---

