param(
    [string]$DeviceName = "",
    [string]$SearchName = "",
    [string]$FileName = "",
    [string]$DestDir = ""
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $SearchName -and -not $FileName) {
    Write-Error "SearchName or FileName required"
    [System.Environment]::Exit(1)
}

$cleanSearch = ($SearchName -replace '[^\p{L}\p{Nd}]', '').ToLower()
$cleanFileName = ($FileName -replace '[^\p{L}\p{Nd}]', '').ToLower()
$searchWords = ($SearchName -split '[^\p{L}\p{Nd}]+') | Where-Object { $_.Length -gt 2 }

# 1. Fast local cache check
if ($DestDir -and (Test-Path $DestDir)) {
    $existing = Get-ChildItem -Path $DestDir -File -ErrorAction SilentlyContinue
    foreach ($ef in $existing) {
        $cName = ($ef.Name -replace '[^\p{L}\p{Nd}]', '').ToLower()
        if (($cleanSearch.Length -ge 4 -and $cName.Contains($cleanSearch)) -or ($cleanFileName.Length -ge 4 -and $cName.Contains($cleanFileName))) {
            Write-Output $ef.FullName
            [System.Environment]::Exit(0)
        }
    }
}

# 2. Transliteration helper for Russian book titles matching Latin filenames
function Convert-RuToLat($text) {
    if (-not $text) { return "" }
    $t = $text.ToLower()
    $ru = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
    $lat = @('a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','shch','','y','','e','yu','ya')
    $sb = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $t.Length; $i++) {
        $ch = [string]$t[$i]
        $idx = $ru.IndexOf($ch)
        if ($idx -ge 0) {
            [void]$sb.Append($lat[$idx])
        } else {
            [void]$sb.Append($ch)
        }
    }
    return $sb.ToString()
}

$translitSearch = Convert-RuToLat $cleanSearch
$translitWords = @()
foreach ($w in $searchWords) {
    $tw = Convert-RuToLat $w
    if ($tw.Length -gt 2) { $translitWords += $tw }
}

# 3. Connect to Phone Shell COM
$shell = New-Object -ComObject Shell.Application
$pc = $shell.Namespace(17)

$phone = $null
$storageFolder = $null

foreach ($item in $pc.Items()) {
    if ($DeviceName -and $item.Name -ine $DeviceName) { continue }
    try {
        $folder = $item.GetFolder
        if ($folder) {
            foreach ($storage in $folder.Items()) {
                try {
                    $sf = $storage.GetFolder
                    if ($sf) {
                        $hasReadEra = $sf.Items() | Where-Object { $_.Name -ieq "ReadEra" }
                        if ($hasReadEra) {
                            $phone = $item
                            $storageFolder = $sf
                            break
                        }
                    }
                } catch {}
            }
        }
    } catch {}
    if ($storageFolder) { break }
}

if (-not $storageFolder) {
    Write-Error "Phone storage not accessible"
    [System.Environment]::Exit(1)
}

$global:foundItem = $null

function MatchBookItem($rawName) {
    if (-not $rawName) { return $false }
    $lower = $rawName.ToLower()

    # Direct filename match
    if ($FileName -and ($rawName -ieq $FileName -or $rawName -like "*$FileName*")) { return $true }
    if ($SearchName -and ($rawName -ieq $SearchName -or $rawName -like "*$SearchName*")) { return $true }

    # Normalized match
    $cleanItem = ($rawName -replace '[^\p{L}\p{Nd}]', '').ToLower()
    if ($cleanFileName.Length -ge 4 -and $cleanItem.Contains($cleanFileName)) { return $true }
    if ($cleanSearch.Length -ge 4) {
        if ($cleanItem.Contains($cleanSearch) -or ($cleanItem.Length -ge 6 -and $cleanSearch.Contains($cleanItem))) {
            return $true
        }
    }

    # Transliterated match
    if ($translitSearch.Length -ge 4) {
        if ($cleanItem.Contains($translitSearch) -or ($cleanItem.Length -ge 6 -and $translitSearch.Contains($cleanItem))) {
            return $true
        }
    }

    # Word match
    if ($searchWords.Count -gt 0) {
        $allFound = $true
        foreach ($w in $searchWords) {
            if ($lower -notmatch [regex]::Escape($w.ToLower())) {
                $allFound = $false; break
            }
        }
        if ($allFound) { return $true }
    }

    # Transliterated word match
    if ($translitWords.Count -gt 0) {
        $allTranslitFound = $true
        foreach ($tw in $translitWords) {
            if ($lower -notmatch [regex]::Escape($tw.ToLower())) {
                $allTranslitFound = $false; break
            }
        }
        if ($allTranslitFound) { return $true }
    }

    return $false
}

function ScanFolder($fld) {
    if ($global:foundItem -or -not $fld) { return }

    foreach ($item in $fld.Items()) {
        if ($item.IsFolder) { continue }
        $rawName = $item.Name
        if (MatchBookItem $rawName) {
            if ($rawName -match '\.(fb2(\.zip)?|epub|mobi|txt|pdf|djvu|doc|docx)$') {
                $global:foundItem = $item
                return
            } elseif (-not $global:foundItem) {
                $global:foundItem = $item
            }
        }
    }
}

# Scan priority folders directly via ParseName (O(1) folder access)
foreach ($targetName in @('Download', 'Books', 'Documents', 'Downloads', 'ReadEra')) {
    if ($global:foundItem) { break }
    try {
        $parsed = $storageFolder.ParseName($targetName)
        if ($parsed) {
            ScanFolder $parsed.GetFolder
        }
    } catch {}
}

if (-not $global:foundItem) {
    Write-Error "Book not found on device"
    [System.Environment]::Exit(2)
}

if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
}

$copiedFile = Join-Path $DestDir $global:foundItem.Name
if ((Test-Path $copiedFile) -and ((Get-Item $copiedFile).Length -gt 0)) {
    Write-Output $copiedFile
    [System.Environment]::Exit(0)
}

$destShell = $shell.Namespace($DestDir)
$destShell.CopyHere($global:foundItem, 16 + 512 + 1024)

for ($i = 0; $i -lt 30; $i++) {
    if ((Test-Path $copiedFile) -and ((Get-Item $copiedFile).Length -gt 0)) {
        Write-Output $copiedFile
        [System.Environment]::Exit(0)
    }
    Start-Sleep -Milliseconds 300
}

Write-Error "Copy timed out"
[System.Environment]::Exit(3)
