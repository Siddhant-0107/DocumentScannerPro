# Get current date in YYYY-MM-DD format
$date = Get-Date -Format "yyyy-MM-dd"

# Ask user for optional message
$message = Read-Host "Enter commit message (leave blank for '${date}: Auto commit')"

# Use default message if blank
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "${date}: Auto commit"
}

# Stage all changes
git add .

# Check if there are staged changes
$stagedChanges = git diff --cached

if (-not [string]::IsNullOrWhiteSpace($stagedChanges)) {
    git commit -m "$message"
    git push origin main
    Write-Host "✅ Committed & pushed: $message" -ForegroundColor Green
} else {
    Write-Host "✅ Nothing new to commit. Everything is up-to-date." -ForegroundColor Yellow
}
