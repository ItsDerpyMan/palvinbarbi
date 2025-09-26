# Git & GitHub Workflow on Windows

This is a simple workflow for using Git and GitHub on Windows, either via CLI or GUI (GitHub Desktop).

---

## 1️⃣ Clone the repository

**CLI:**

```bash
git clone https://github.com/username/repo.git
cd repo
```

**GUI (GitHub Desktop):**

* Click **File → Clone Repository**
* Enter repo URL and choose local folder.

---

## 2️⃣ Create a branch for your feature

**CLI:**

```bash
git checkout -b my-feature
```

**GUI:**

* Click **Current Branch → New Branch**
* Name it `my-feature` and switch to it.

---

## 3️⃣ Make changes and commit

**CLI:**

```bash
git add .
git commit -m "Add feature X"
```

**GUI:**

* Stage files in the **Changes** tab.
* Write a commit message.
* Click **Commit to my-feature**.

---

## 4️⃣ Push your branch to GitHub

**CLI:**

```bash
git push -u origin my-feature
```

**GUI:**

* Click **Push origin** in GitHub Desktop.

---

## 5️⃣ Create a Pull Request (PR)

**CLI (GitHub CLI):**

```bash
gh pr create --base main --head my-feature --title "Add feature X" --body "Description of feature"
```

**GUI (GitHub Desktop):**

* Click **Branch → Create Pull Request**
* Fill title/description and submit in the browser.

---

## 6️⃣ Keep your branch updated

**CLI:**

```bash
git checkout main
git pull origin main
git checkout my-feature
git merge main
```

**GUI:**

* Switch to **main**, click **Fetch origin → Pull**
* Switch back to your branch.
* Merge main into current branch via **Branch → Merge into current branch**.

---

## 7️⃣ After PR is merged

**CLI:**

```bash
git checkout main
git pull origin main
git branch -d my-feature
```

**GUI:**

* Switch to **main**, click **Fetch origin → Pull**
* Delete the merged branch in the branch dropdown.

---

💡 **Tips:**

* Always create a **new branch** for each feature/fix.
* Keep commits **small and descriptive**.
* GUI is good for visualization; CLI is faster for advanced tasks.

