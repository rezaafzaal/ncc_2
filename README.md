## Build Status

[![Build Status](https://problem-citation-renewably.ngrok-free.dev/buildStatus/icon?job=ncc)](https://problem-citation-renewably.ngrok-free.dev/job/ncc)

# 🚀 CI/CD Pipeline: Jenkins + SonarQube — Complete Guide

## Project Structure

```
cicd-demo/
├── src/
│   ├── app.js                  # Express app
│   └── math.js                 # Utility functions
├── test/
│   ├── app.test.js             # Route tests
│   └── math.test.js            # Unit tests
├── Jenkinsfile                 # ← THE MAIN PIPELINE
├── sonar-project.properties    # SonarQube config
├── docker-compose.yml          # Local stack (Jenkins + SonarQube)
├── package.json
├── .eslintrc.json
└── .gitignore
```

---

## Tech Stack

| Tool      | Purpose                          |
| --------- | -------------------------------- |
| Node.js   | Application runtime              |
| Express   | Web framework                    |
| Jest      | Testing + code coverage          |
| ESLint    | Linting                          |
| Jenkins   | CI/CD automation server          |
| SonarQube | Code quality & security analysis |
| Docker    | Container runtime                |

---

## PART 1 — Docker Stack (Already Done ✅)

Since you already have Jenkins and SonarQube running, this is for reference only.

```bash
# If you need to start from scratch:
sudo sysctl -w vm.max_map_count=524288   # Required for SonarQube
docker-compose up -d

# Access:
# Jenkins   → http://localhost:9090
# SonarQube → http://localhost:9000
```

> **Important:** Jenkins and SonarQube must be on the same Docker network to talk to each other.
> In your `docker-compose.yml`, both services share `cicd-network`.
> From Jenkins, reach SonarQube at: `http://sonarqube:9000`

---

## PART 2 — SonarQube Configuration

### Step 1: First Login

- URL: `http://localhost:9000`
- Default credentials: `admin` / `admin`
- Change password when prompted

### Step 2: Create a Project

1. Click **"Create Project"** → **"Manually"**
2. **Project display name:** `CI/CD Demo`
3. **Project key:** `cicd-demo` ← must match `sonar.projectKey` in `sonar-project.properties`
4. Click **"Set Up"**

### Step 3: Generate a Token

1. Choose **"With Jenkins"** → or go to:
   `http://localhost:9000/account/security`
2. Under **"Generate Tokens"**:
   - Name: `jenkins-token`
   - Type: **Global Analysis Token**
   - Expiration: **No expiration** (for local dev)
3. Click **Generate** → **COPY THE TOKEN NOW** (shown only once!)

### Step 4: Configure Quality Gate (Optional Customization)

1. Go to **Quality Gates** in top menu
2. The default **"Sonar way"** gate is fine for demo
3. It checks: coverage ≥ 80%, no new bugs, no new vulnerabilities

---

## PART 3 — Jenkins Configuration

### Step 1: Install Required Plugins

1. Go to: **Manage Jenkins** → **Plugins** → **Available plugins**
2. Search and install:
   - ✅ **SonarQube Scanner** (for `withSonarQubeEnv()` and `waitForQualityGate()`)
   - ✅ **Pipeline** (usually pre-installed)
   - ✅ **Git** (usually pre-installed)
   - ✅ **HTML Publisher** (for coverage reports)
3. Click **"Download now and install after restart"** → restart Jenkins

### Step 2: Add SonarQube Token as Jenkins Credential

1. Go to: **Manage Jenkins** → **Credentials** → **System** → **Global credentials** → **Add Credentials**
2. Fill in:
   ```
   Kind:        Secret text
   Scope:       Global
   Secret:      <paste your SonarQube token here>
   ID:          sonarqube-token          ← IMPORTANT: must match Jenkinsfile
   Description: SonarQube Analysis Token
   ```
3. Click **Save**

### Step 3: Configure SonarQube Server in Jenkins

1. Go to: **Manage Jenkins** → **System** (or **Configure System**)
2. Scroll to **"SonarQube servers"** section
3. Click **"Add SonarQube"**
4. Fill in:
   ```
   Name:            SonarQube              ← IMPORTANT: must match withSonarQubeEnv('SonarQube')
   Server URL:      http://sonarqube:9000  ← Docker internal hostname
   Server auth token: [select] sonarqube-token
   ```
5. Click **Save**

> ⚠️ If Jenkins is NOT in the same Docker network as SonarQube, use:
> `http://host.docker.internal:9000` or `http://localhost:9000`

### Step 4: Configure SonarQube Webhook (for Quality Gate)

This tells SonarQube to notify Jenkins when analysis is complete.

1. In **SonarQube**: Go to **Administration** → **Configuration** → **Webhooks**
2. Click **"Create"**
3. Fill in:
   ```
   Name:   Jenkins
   URL:    http://jenkins:9090/sonarqube-webhook/
   Secret: (leave blank for local dev)
   ```
4. Click **Create**

> ⚠️ If using `localhost`, use: `http://host.docker.internal:9090/sonarqube-webhook/`

### Step 5: Create the Jenkins Pipeline Job

1. Jenkins dashboard → **"New Item"**
2. Name: `cicd-demo-pipeline`
3. Type: **Pipeline** → Click **OK**
4. In the job configuration:

   **General tab:**
   - ✅ Check **"GitHub project"** → enter your repo URL
   - ✅ Check **"Discard old builds"** → Max: `10`

   **Build Triggers tab:**
   - ✅ Check **"GitHub hook trigger for GITScm polling"** (for webhook)

   **Pipeline tab:**
   - Definition: **"Pipeline script from SCM"**
   - SCM: **Git**
   - Repository URL: `https://github.com/YOUR_USERNAME/cicd-demo.git`
   - Credentials: add your GitHub credentials if private repo
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

5. Click **Save**

---

## PART 4 — GitHub Webhook (Auto-trigger on Push)

### Step 1: Get Your Jenkins URL

Since you're local, you need to expose Jenkins to the internet.
Use **ngrok** (free, easy):

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 9090

# You'll get a URL like:
# https://abc123.ngrok.io → http://localhost:9090
```

### Step 2: Add Webhook in GitHub

1. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**
2. Fill in:
   ```
   Payload URL:    https://abc123.ngrok.io/github-webhook/
   Content type:   application/json
   Secret:         (leave blank or set one)
   Events:         Just the push event ✅
   ```
3. Click **Add webhook**

### Step 3: Verify

- GitHub will send a test ping → you should see a green ✅ checkmark
- Push a commit → Jenkins job triggers automatically!

---

## PART 5 — Running the Pipeline

### First Run (Manual)

1. Go to your Jenkins job → **"Build Now"**
2. Click on the build number → **"Console Output"**
3. Watch the stages execute:
   ```
   📥 Checkout
   🔨 Build (npm ci)
   🔍 Lint  ┐ parallel
   🧪 Test  ┘
   📊 SonarQube Analysis
   ⏳ Quality Gate check
   🚀 Deploy (if branch = main)
   🧹 Cleanup
   ```

### Subsequent Runs

- Triggered automatically on every `git push` via webhook

---

## PART 6 — Build Status Badge

Add this to your `README.md` on GitHub to show the build status:

```markdown
[![Build Status](http://localhost:9090/buildStatus/icon?job=cicd-demo-pipeline)](http://localhost:9090/job/cicd-demo-pipeline/)
```

For a public URL (with ngrok):

```markdown
[![Build Status](https://abc123.ngrok.io/buildStatus/icon?job=cicd-demo-pipeline)](https://abc123.ngrok.io/job/cicd-demo-pipeline/)
```

For SonarQube quality badge, go to:
SonarQube → Your Project → **"Get project badges"**

```markdown
[![Quality Gate Status](http://localhost:9000/api/project_badges/measure?project=cicd-demo&metric=alert_status)](http://localhost:9000/dashboard?id=cicd-demo)
[![Coverage](http://localhost:9000/api/project_badges/measure?project=cicd-demo&metric=coverage)](http://localhost:9000/dashboard?id=cicd-demo)
```

---

## PART 7 — Viewing SonarQube Results from Jenkins

After a successful pipeline run:

1. In Jenkins job page → Look for **"SonarQube" link** in the left sidebar
2. Click it → Opens directly to SonarQube dashboard for this project
3. In SonarQube you'll see:
   - **Bugs**, **Vulnerabilities**, **Code Smells**
   - **Coverage %** (from Jest lcov report)
   - **Quality Gate** status (PASSED / FAILED)
   - Detailed line-by-line issues

---

## PART 8 — Pipeline Features Summary

| Feature                | Implementation                              |
| ---------------------- | ------------------------------------------- |
| Declarative Pipeline   | `pipeline { }` syntax in `Jenkinsfile`      |
| Environment Variables  | `environment { }` block                     |
| Credentials Management | `withSonarQubeEnv()` injects token securely |
| Build Stage            | `npm ci`                                    |
| Parallel Stages        | Lint + Test run simultaneously              |
| SonarQube Analysis     | `withSonarQubeEnv() { npx sonar-scanner }`  |
| Quality Gate           | `waitForQualityGate abortPipeline: true`    |
| Webhook                | GitHub → ngrok → Jenkins trigger            |
| Build Badge            | Jenkins `buildStatus` API                   |
| Workspace Cleanup      | `cleanWs()` in `post { always {} }`         |
| Timeout                | `timeout(time: 15, unit: 'MINUTES')`        |
| Timestamps             | `timestamps()` in options                   |

---

## Troubleshooting

### Jenkins can't reach SonarQube

```bash
# Check containers are on same network
docker network ls
docker network inspect cicd-network

# Test connectivity from Jenkins container
docker exec jenkins curl http://sonarqube:9000/api/system/status
```

### Quality Gate always times out

- Make sure the SonarQube webhook is configured (Part 3, Step 4)
- The webhook URL must be reachable FROM SonarQube TO Jenkins
- Check SonarQube logs: `docker logs sonarqube`

### npm not found in Jenkins

```bash
# Install Node.js in Jenkins container
docker exec -u root jenkins bash -c "apt-get update && apt-get install -y nodejs npm"

# Or use Jenkins NodeJS plugin:
# Manage Jenkins → Tools → NodeJS → Add NodeJS installation
```

### sonar-scanner not found

The `Jenkinsfile` uses `npx sonar-scanner` which installs it on demand.
Alternatively, install the SonarQube Scanner tool in Jenkins:
**Manage Jenkins** → **Tools** → **SonarQube Scanner** → **Add** → Name: `sonar-scanner`

---

## Quick Verification Checklist

- [ ] SonarQube accessible at `http://localhost:9000`
- [ ] Jenkins accessible at `http://localhost:9090`
- [ ] SonarQube token created and saved in Jenkins credentials as `sonarqube-token`
- [ ] SonarQube server configured in Jenkins named exactly `SonarQube`
- [ ] SonarQube webhook pointing to Jenkins
- [ ] Jenkins pipeline job created with SCM pointing to your repo
- [ ] First build triggered manually → all stages green
- [ ] GitHub webhook configured → push triggers build automatically
- [ ] Build badge visible in GitHub README
