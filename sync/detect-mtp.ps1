[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$shell = New-Object -ComObject Shell.Application
$pc = $shell.Namespace(17) # ssfDRIVES (This PC)
$results = @()

if ($pc) {
    foreach ($item in $pc.Items()) {
        # Check if item is a portable device (WPD paths begin with :: or \\?\usb)
        $path = $item.Path
        if ($path -like "::*" -or $path -like "\\\?*" -or $path -eq "") {
            $folder = $item.GetFolder
            if ($folder) {
                foreach ($storage in $folder.Items()) {
                    $storageFolder = $storage.GetFolder
                    if ($storageFolder) {
                        # Search for ReadEra folder
                        $readera = $storageFolder.Items() | Where-Object { $_.Name -ieq "ReadEra" }
                        if ($readera) {
                            $readeraFolder = $readera.GetFolder
                            $backups = $readeraFolder.Items() | Where-Object { $_.Name -ieq "Backups" }
                            $bakFiles = @()
                            if ($backups) {
                                foreach ($b in $backups.GetFolder.Items()) {
                                    if ($b.Name -ilike "*.bak") {
                                        $bakFiles += [PSCustomObject]@{
                                            name = $b.Name
                                            modifyDate = $b.ModifyDate
                                        }
                                    }
                                }
                            }
                            $results += [PSCustomObject]@{
                                deviceName = $item.Name
                                storageName = $storage.Name
                                bakCount = $bakFiles.Count
                                backups = $bakFiles
                            }
                        }
                    }
                }
            }
        }
    }
}

if ($results.Count -gt 0) {
    $results | ConvertTo-Json -Depth 3
} else {
    Write-Output "[]"
}
