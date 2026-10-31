param(
    [string]$DeviceName = "",
    [string]$FileName = "",
    [string]$DestPath = ""
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $DestPath) {
    Write-Error "DestPath parameter is required"
    exit 1
}

$destDir = Split-Path -Parent $DestPath
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

$shell = New-Object -ComObject Shell.Application
$pc = $shell.Namespace(17) # ssfDRIVES

$targetItem = $null

foreach ($item in $pc.Items()) {
    if (-not $DeviceName -or $item.Name -ieq $DeviceName) {
        $folder = $item.GetFolder
        if ($folder) {
            foreach ($storage in $folder.Items()) {
                $storageFolder = $storage.GetFolder
                if ($storageFolder) {
                    $readera = $storageFolder.Items() | Where-Object { $_.Name -ieq "ReadEra" }
                    if ($readera) {
                        $backups = $readera.GetFolder.Items() | Where-Object { $_.Name -ieq "Backups" }
                        if ($backups) {
                            $backupFolder = $backups.GetFolder
                            if ($FileName) {
                                $targetItem = $backupFolder.Items() | Where-Object { $_.Name -ieq $FileName }
                            } else {
                                # Pick newest .bak
                                $targetItem = $backupFolder.Items() | Where-Object { $_.Name -ilike "*.bak" } | Sort-Object Name -Descending | Select-Object -First 1
                            }
                            if ($targetItem) { break }
                        }
                    }
                }
            }
        }
    }
    if ($targetItem) { break }
}

if (-not $targetItem) {
    Write-Error "Backup file not found on device"
    exit 2
}

# Copy item to destination directory
$targetDirShell = $shell.Namespace($destDir)
$targetDirShell.CopyHere($targetItem, 16) # 16 = Respond 'Yes to All' for any dialog

# Wait up to 5s for copy completion
$copiedFile = Join-Path $destDir $targetItem.Name
for ($i = 0; $i -lt 10; $i++) {
    if (Test-Path $copiedFile) {
        # If destination was a different filename, rename
        if ($copiedFile -ne $DestPath) {
            Move-Item -Force -Path $copiedFile -Destination $DestPath
        }
        Write-Output "SUCCESS: $DestPath"
        exit 0
    }
    Start-Sleep -Milliseconds 500
}

Write-Error "Copy operation timed out"
exit 3
